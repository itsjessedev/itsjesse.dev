"""Audit log API endpoints."""
from typing import List
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from pydantic import BaseModel

from src.db.database import get_db
from src.models.audit import AuditLog

router = APIRouter(prefix="/api/audit", tags=["audit"])


class AuditLogResponse(BaseModel):
    """Audit log response schema."""
    id: int
    request_id: int
    action: str
    actor_id: str
    actor_name: str
    actor_type: str
    description: str
    data: dict
    timestamp: str

    model_config = {"from_attributes": True}


@router.get("/{request_id}", response_model=List[AuditLogResponse])
async def get_audit_trail(
    request_id: int,
    db: AsyncSession = Depends(get_db)
):
    """Get audit trail for a request."""
    result = await db.execute(
        select(AuditLog)
        .where(AuditLog.request_id == request_id)
        .order_by(AuditLog.timestamp.asc())
    )

    logs = result.scalars().all()

    if not logs:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="No audit logs found for this request"
        )

    return logs
