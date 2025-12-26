"""Request model for tracking workflow requests."""
import enum
from datetime import datetime
from typing import Optional

from sqlalchemy import Column, String, DateTime, Enum, JSON, Integer, Text
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func

from src.db.database import Base


class RequestStatus(str, enum.Enum):
    """Request status enumeration."""
    DRAFT = "draft"
    PENDING = "pending"
    APPROVED = "approved"
    REJECTED = "rejected"
    CANCELLED = "cancelled"
    COMPLETED = "completed"


class Request(Base):
    """Request model for workflow requests."""

    __tablename__ = "requests"

    id = Column(Integer, primary_key=True, index=True)
    workflow_type = Column(String(50), nullable=False, index=True)
    requester_id = Column(String(100), nullable=False, index=True)
    requester_name = Column(String(200), nullable=False)
    requester_email = Column(String(200))

    status = Column(
        Enum(RequestStatus),
        default=RequestStatus.DRAFT,
        nullable=False,
        index=True
    )

    # JSONB for flexible data storage
    data = Column(JSON, nullable=False, default=dict)

    # Metadata
    title = Column(String(200), nullable=False)
    description = Column(Text)
    priority = Column(String(20), default="normal")

    # Timestamps
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
    submitted_at = Column(DateTime(timezone=True))
    completed_at = Column(DateTime(timezone=True))

    # Relationships
    approvals = relationship("Approval", back_populates="request", cascade="all, delete-orphan")
    audit_logs = relationship("AuditLog", back_populates="request", cascade="all, delete-orphan")

    def __repr__(self):
        return f"<Request(id={self.id}, type={self.workflow_type}, status={self.status})>"

    @property
    def is_pending(self) -> bool:
        """Check if request is pending approval."""
        return self.status == RequestStatus.PENDING

    @property
    def is_approved(self) -> bool:
        """Check if request is approved."""
        return self.status == RequestStatus.APPROVED

    @property
    def is_rejected(self) -> bool:
        """Check if request is rejected."""
        return self.status == RequestStatus.REJECTED

    @property
    def is_completed(self) -> bool:
        """Check if request is completed."""
        return self.status == RequestStatus.COMPLETED

    @property
    def pending_approvals(self) -> list:
        """Get pending approvals for this request."""
        from src.models.approval import ApprovalStatus
        return [
            approval for approval in self.approvals
            if approval.status == ApprovalStatus.PENDING
        ]
