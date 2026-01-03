"""API routes for post scheduling."""

from typing import Optional
from datetime import datetime, timedelta

from fastapi import APIRouter, Depends, HTTPException, Query
from pydantic import BaseModel
from sqlalchemy import select, func, and_
from sqlalchemy.ext.asyncio import AsyncSession

from ..database import get_db
from ..models import ScheduledPost

router = APIRouter(prefix="/api/schedule", tags=["scheduling"])


class CreateScheduledPost(BaseModel):
    """Request to create a scheduled post."""
    platform: str  # reddit, linkedin
    subreddit: Optional[str] = None  # Reddit only
    title: Optional[str] = None
    body: str
    category: Optional[str] = None
    scheduled_for: Optional[datetime] = None  # If None, auto-schedule


class UpdateScheduledPost(BaseModel):
    """Request to update a scheduled post."""
    title: Optional[str] = None
    body: Optional[str] = None
    subreddit: Optional[str] = None
    category: Optional[str] = None
    scheduled_for: Optional[datetime] = None
    status: Optional[str] = None


class ScheduledPostResponse(BaseModel):
    """Response for a scheduled post."""
    id: int
    platform: str
    subreddit: Optional[str]
    title: Optional[str]
    body: str
    category: Optional[str]
    status: str
    scheduled_for: datetime
    published_at: Optional[datetime]
    published_url: Optional[str]
    error_message: Optional[str]
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


class CalendarEvent(BaseModel):
    """Calendar event format for scheduled posts."""
    id: int
    title: str
    start: datetime
    platform: str
    status: str
    subreddit: Optional[str]


# Best practice posting times (in user's timezone - we'll use UTC and let frontend convert)
BEST_TIMES = {
    "linkedin": [
        {"day": 1, "hour": 7},   # Tuesday 7 AM
        {"day": 1, "hour": 12},  # Tuesday 12 PM
        {"day": 1, "hour": 17},  # Tuesday 5 PM
        {"day": 2, "hour": 7},   # Wednesday 7 AM
        {"day": 2, "hour": 12},  # Wednesday 12 PM
        {"day": 2, "hour": 17},  # Wednesday 5 PM
        {"day": 3, "hour": 7},   # Thursday 7 AM
        {"day": 3, "hour": 12},  # Thursday 12 PM
        {"day": 3, "hour": 17},  # Thursday 5 PM
    ],
    "reddit": [
        {"day": 0, "hour": 9},   # Monday 9 AM
        {"day": 0, "hour": 14},  # Monday 2 PM
        {"day": 1, "hour": 9},   # Tuesday 9 AM
        {"day": 1, "hour": 14},  # Tuesday 2 PM
        {"day": 2, "hour": 9},   # Wednesday 9 AM
        {"day": 2, "hour": 14},  # Wednesday 2 PM
        {"day": 3, "hour": 9},   # Thursday 9 AM
        {"day": 3, "hour": 14},  # Thursday 2 PM
        {"day": 4, "hour": 9},   # Friday 9 AM
    ],
}


def get_next_available_slot(platform: str, db_scheduled: list[datetime]) -> datetime:
    """Find the next available best-practice time slot."""
    now = datetime.utcnow()
    best_times = BEST_TIMES.get(platform, BEST_TIMES["reddit"])

    # Look ahead up to 2 weeks
    for days_ahead in range(14):
        check_date = now + timedelta(days=days_ahead)

        for slot in best_times:
            if check_date.weekday() == slot["day"]:
                slot_time = check_date.replace(hour=slot["hour"], minute=0, second=0, microsecond=0)

                # Must be in the future
                if slot_time <= now:
                    continue

                # Check if slot is taken
                if slot_time not in db_scheduled:
                    return slot_time

    # Fallback: next hour
    return now.replace(minute=0, second=0, microsecond=0) + timedelta(hours=1)


@router.post("/", response_model=ScheduledPostResponse)
async def create_scheduled_post(request: CreateScheduledPost, db: AsyncSession = Depends(get_db)):
    """Create a new scheduled post."""
    if request.platform not in ["reddit", "linkedin"]:
        raise HTTPException(status_code=400, detail="Platform must be 'reddit' or 'linkedin'")

    if request.platform == "reddit" and not request.subreddit:
        raise HTTPException(status_code=400, detail="Subreddit is required for Reddit posts")

    # Auto-schedule if no time provided
    scheduled_for = request.scheduled_for
    if not scheduled_for:
        # Get existing scheduled times
        existing = await db.execute(
            select(ScheduledPost.scheduled_for).where(
                ScheduledPost.platform == request.platform,
                ScheduledPost.status == "scheduled"
            )
        )
        existing_times = [row[0] for row in existing.all()]
        scheduled_for = get_next_available_slot(request.platform, existing_times)

    post = ScheduledPost(
        platform=request.platform,
        subreddit=request.subreddit,
        title=request.title,
        body=request.body,
        category=request.category,
        scheduled_for=scheduled_for,
    )
    db.add(post)
    await db.commit()
    await db.refresh(post)
    return post


@router.get("/", response_model=list[ScheduledPostResponse])
async def list_scheduled_posts(
    platform: Optional[str] = Query(None, description="Filter by platform"),
    status: Optional[str] = Query(None, description="Filter by status"),
    start_date: Optional[datetime] = Query(None, description="Filter posts scheduled after this date"),
    end_date: Optional[datetime] = Query(None, description="Filter posts scheduled before this date"),
    limit: int = Query(50, le=200),
    db: AsyncSession = Depends(get_db),
):
    """List scheduled posts with filters."""
    query = select(ScheduledPost).order_by(ScheduledPost.scheduled_for.asc())

    if platform:
        query = query.where(ScheduledPost.platform == platform)
    if status:
        query = query.where(ScheduledPost.status == status)
    if start_date:
        query = query.where(ScheduledPost.scheduled_for >= start_date)
    if end_date:
        query = query.where(ScheduledPost.scheduled_for <= end_date)

    query = query.limit(limit)
    result = await db.execute(query)
    return result.scalars().all()


@router.get("/calendar", response_model=list[CalendarEvent])
async def get_calendar(
    start_date: datetime = Query(..., description="Calendar start date"),
    end_date: datetime = Query(..., description="Calendar end date"),
    platform: Optional[str] = Query(None, description="Filter by platform"),
    db: AsyncSession = Depends(get_db),
):
    """Get scheduled posts in calendar format."""
    query = select(ScheduledPost).where(
        and_(
            ScheduledPost.scheduled_for >= start_date,
            ScheduledPost.scheduled_for <= end_date
        )
    ).order_by(ScheduledPost.scheduled_for.asc())

    if platform:
        query = query.where(ScheduledPost.platform == platform)

    result = await db.execute(query)
    posts = result.scalars().all()

    return [
        CalendarEvent(
            id=post.id,
            title=post.title or f"{post.platform.capitalize()} post",
            start=post.scheduled_for,
            platform=post.platform,
            status=post.status,
            subreddit=post.subreddit,
        )
        for post in posts
    ]


@router.get("/upcoming")
async def get_upcoming_posts(
    platform: Optional[str] = Query(None),
    limit: int = Query(10, le=50),
    db: AsyncSession = Depends(get_db),
):
    """Get upcoming scheduled posts (not yet published)."""
    query = select(ScheduledPost).where(
        ScheduledPost.status == "scheduled",
        ScheduledPost.scheduled_for >= datetime.utcnow()
    ).order_by(ScheduledPost.scheduled_for.asc())

    if platform:
        query = query.where(ScheduledPost.platform == platform)

    query = query.limit(limit)
    result = await db.execute(query)
    posts = result.scalars().all()

    return [ScheduledPostResponse.model_validate(post) for post in posts]


@router.get("/{post_id}", response_model=ScheduledPostResponse)
async def get_scheduled_post(post_id: int, db: AsyncSession = Depends(get_db)):
    """Get a specific scheduled post."""
    post = await db.get(ScheduledPost, post_id)
    if not post:
        raise HTTPException(status_code=404, detail="Scheduled post not found")
    return post


@router.patch("/{post_id}", response_model=ScheduledPostResponse)
async def update_scheduled_post(
    post_id: int,
    update: UpdateScheduledPost,
    db: AsyncSession = Depends(get_db),
):
    """Update a scheduled post."""
    post = await db.get(ScheduledPost, post_id)
    if not post:
        raise HTTPException(status_code=404, detail="Scheduled post not found")

    if post.status == "published":
        raise HTTPException(status_code=400, detail="Cannot update published posts")

    update_data = update.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(post, field, value)

    await db.commit()
    await db.refresh(post)
    return post


@router.delete("/{post_id}")
async def cancel_scheduled_post(post_id: int, db: AsyncSession = Depends(get_db)):
    """Cancel (delete) a scheduled post."""
    post = await db.get(ScheduledPost, post_id)
    if not post:
        raise HTTPException(status_code=404, detail="Scheduled post not found")

    if post.status == "published":
        raise HTTPException(status_code=400, detail="Cannot delete published posts")

    await db.delete(post)
    await db.commit()
    return {"status": "cancelled", "id": post_id}


@router.post("/{post_id}/publish")
async def publish_now(post_id: int, db: AsyncSession = Depends(get_db)):
    """Manually trigger immediate publish for a scheduled post."""
    post = await db.get(ScheduledPost, post_id)
    if not post:
        raise HTTPException(status_code=404, detail="Scheduled post not found")

    if post.status != "scheduled":
        raise HTTPException(status_code=400, detail=f"Post is already {post.status}")

    # This will be implemented with actual API calls later
    # For now, just mark as "pending_publish" for a background job
    post.status = "pending_publish"
    await db.commit()
    await db.refresh(post)

    return {"status": "pending_publish", "id": post_id, "message": "Post queued for immediate publishing"}


@router.get("/stats/summary")
async def get_scheduling_stats(db: AsyncSession = Depends(get_db)):
    """Get scheduling statistics."""
    now = datetime.utcnow()

    total = await db.scalar(select(func.count(ScheduledPost.id)))
    scheduled = await db.scalar(
        select(func.count(ScheduledPost.id)).where(ScheduledPost.status == "scheduled")
    )
    published = await db.scalar(
        select(func.count(ScheduledPost.id)).where(ScheduledPost.status == "published")
    )
    failed = await db.scalar(
        select(func.count(ScheduledPost.id)).where(ScheduledPost.status == "failed")
    )
    upcoming = await db.scalar(
        select(func.count(ScheduledPost.id)).where(
            ScheduledPost.status == "scheduled",
            ScheduledPost.scheduled_for >= now
        )
    )

    # By platform
    platform_query = select(
        ScheduledPost.platform, func.count(ScheduledPost.id)
    ).where(ScheduledPost.status == "scheduled").group_by(ScheduledPost.platform)
    result = await db.execute(platform_query)
    by_platform = {row[0]: row[1] for row in result.all()}

    return {
        "total": total or 0,
        "scheduled": scheduled or 0,
        "published": published or 0,
        "failed": failed or 0,
        "upcoming": upcoming or 0,
        "by_platform": by_platform,
    }
