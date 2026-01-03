"""API routes for persistent dismissals."""

from typing import Optional
from datetime import datetime

from fastapi import APIRouter, Depends, HTTPException, Query
from pydantic import BaseModel
from sqlalchemy import select, delete, func
from sqlalchemy.ext.asyncio import AsyncSession

from ..database import get_db
from ..models import DismissedItem

router = APIRouter(prefix="/api/dismissals", tags=["dismissals"])


class DismissRequest(BaseModel):
    """Request to dismiss an item."""
    item_type: str  # reddit_post, linkedin_post, reddit_comment, opportunity
    source: str  # reddit, linkedin, craigslist, hackernews, etc.
    source_id: str
    url: Optional[str] = None


class DismissedItemResponse(BaseModel):
    """Response for a dismissed item."""
    id: int
    item_type: str
    source: str
    source_id: str
    url: Optional[str]
    dismissed_at: datetime

    class Config:
        from_attributes = True


class DismissedStatsResponse(BaseModel):
    """Statistics about dismissed items."""
    total: int
    by_type: dict[str, int]
    by_source: dict[str, int]


@router.post("/", response_model=DismissedItemResponse)
async def dismiss_item(request: DismissRequest, db: AsyncSession = Depends(get_db)):
    """Dismiss an item (persist to database)."""
    # Check if already dismissed
    existing = await db.scalar(
        select(DismissedItem).where(
            DismissedItem.item_type == request.item_type,
            DismissedItem.source_id == request.source_id
        )
    )
    if existing:
        return existing

    # Create dismissal
    dismissed = DismissedItem(
        item_type=request.item_type,
        source=request.source,
        source_id=request.source_id,
        url=request.url,
    )
    db.add(dismissed)
    await db.commit()
    await db.refresh(dismissed)
    return dismissed


@router.post("/batch")
async def dismiss_batch(items: list[DismissRequest], db: AsyncSession = Depends(get_db)):
    """Dismiss multiple items at once."""
    added = 0
    for item in items:
        existing = await db.scalar(
            select(DismissedItem).where(
                DismissedItem.item_type == item.item_type,
                DismissedItem.source_id == item.source_id
            )
        )
        if not existing:
            dismissed = DismissedItem(
                item_type=item.item_type,
                source=item.source,
                source_id=item.source_id,
                url=item.url,
            )
            db.add(dismissed)
            added += 1

    await db.commit()
    return {"received": len(items), "added": added}


@router.get("/", response_model=list[DismissedItemResponse])
async def list_dismissed(
    item_type: Optional[str] = Query(None, description="Filter by item type"),
    source: Optional[str] = Query(None, description="Filter by source"),
    limit: int = Query(500, le=1000),
    db: AsyncSession = Depends(get_db),
):
    """List dismissed items with optional filters."""
    query = select(DismissedItem).order_by(DismissedItem.dismissed_at.desc())

    if item_type:
        query = query.where(DismissedItem.item_type == item_type)
    if source:
        query = query.where(DismissedItem.source == source)

    query = query.limit(limit)
    result = await db.execute(query)
    return result.scalars().all()


@router.get("/check")
async def check_dismissed(
    item_type: str,
    source_ids: str = Query(..., description="Comma-separated source IDs"),
    db: AsyncSession = Depends(get_db),
):
    """Check which source_ids are dismissed (for bulk filtering)."""
    ids = [s.strip() for s in source_ids.split(",") if s.strip()]

    result = await db.execute(
        select(DismissedItem.source_id).where(
            DismissedItem.item_type == item_type,
            DismissedItem.source_id.in_(ids)
        )
    )
    dismissed_ids = set(row[0] for row in result.all())

    return {"dismissed": list(dismissed_ids)}


@router.get("/stats", response_model=DismissedStatsResponse)
async def get_stats(db: AsyncSession = Depends(get_db)):
    """Get dismissal statistics."""
    total = await db.scalar(select(func.count(DismissedItem.id)))

    # By type
    type_query = select(DismissedItem.item_type, func.count(DismissedItem.id)).group_by(DismissedItem.item_type)
    result = await db.execute(type_query)
    by_type = {row[0]: row[1] for row in result.all()}

    # By source
    source_query = select(DismissedItem.source, func.count(DismissedItem.id)).group_by(DismissedItem.source)
    result = await db.execute(source_query)
    by_source = {row[0]: row[1] for row in result.all()}

    return DismissedStatsResponse(
        total=total or 0,
        by_type=by_type,
        by_source=by_source,
    )


@router.delete("/{item_type}/{source_id}")
async def undismiss_item(item_type: str, source_id: str, db: AsyncSession = Depends(get_db)):
    """Undismiss an item (remove from dismissed)."""
    result = await db.execute(
        delete(DismissedItem).where(
            DismissedItem.item_type == item_type,
            DismissedItem.source_id == source_id
        )
    )
    await db.commit()

    if result.rowcount == 0:
        raise HTTPException(status_code=404, detail="Dismissal not found")

    return {"status": "undismissed", "item_type": item_type, "source_id": source_id}


@router.delete("/clear/{item_type}")
async def clear_dismissed(
    item_type: str,
    source: Optional[str] = Query(None, description="Optional: only clear from specific source"),
    db: AsyncSession = Depends(get_db),
):
    """Clear all dismissals of a specific type."""
    query = delete(DismissedItem).where(DismissedItem.item_type == item_type)

    if source:
        query = query.where(DismissedItem.source == source)

    result = await db.execute(query)
    await db.commit()

    return {"status": "cleared", "item_type": item_type, "source": source, "count": result.rowcount}


@router.delete("/clear-all")
async def clear_all_dismissed(db: AsyncSession = Depends(get_db)):
    """Clear ALL dismissals (use with caution)."""
    result = await db.execute(delete(DismissedItem))
    await db.commit()

    return {"status": "cleared_all", "count": result.rowcount}
