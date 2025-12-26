"""Approval model for tracking approval decisions."""
import enum
from datetime import datetime
from typing import Optional

from sqlalchemy import Column, String, DateTime, Enum, Integer, ForeignKey, Text, Boolean
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func

from src.db.database import Base


class ApprovalStatus(str, enum.Enum):
    """Approval status enumeration."""
    PENDING = "pending"
    APPROVED = "approved"
    REJECTED = "rejected"
    SKIPPED = "skipped"


class Approval(Base):
    """Approval model for tracking individual approvals."""

    __tablename__ = "approvals"

    id = Column(Integer, primary_key=True, index=True)
    request_id = Column(Integer, ForeignKey("requests.id", ondelete="CASCADE"), nullable=False, index=True)

    # Approver info
    approver_id = Column(String(100), nullable=False, index=True)
    approver_name = Column(String(200), nullable=False)
    approver_email = Column(String(200))

    # Approval details
    status = Column(
        Enum(ApprovalStatus),
        default=ApprovalStatus.PENDING,
        nullable=False,
        index=True
    )

    step = Column(String(50), nullable=False)  # Which approval step this is
    level = Column(Integer, default=1)  # For multi-level approvals
    required = Column(Boolean, default=True)  # Is this approval required?

    # Decision details
    comments = Column(Text)
    decided_at = Column(DateTime(timezone=True))

    # Timestamps
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

    # Reminders
    reminder_count = Column(Integer, default=0)
    last_reminder_at = Column(DateTime(timezone=True))

    # Relationships
    request = relationship("Request", back_populates="approvals")

    def __repr__(self):
        return f"<Approval(id={self.id}, request_id={self.request_id}, approver={self.approver_name}, status={self.status})>"

    @property
    def is_pending(self) -> bool:
        """Check if approval is pending."""
        return self.status == ApprovalStatus.PENDING

    @property
    def is_approved(self) -> bool:
        """Check if approval was approved."""
        return self.status == ApprovalStatus.APPROVED

    @property
    def is_rejected(self) -> bool:
        """Check if approval was rejected."""
        return self.status == ApprovalStatus.REJECTED

    @property
    def needs_reminder(self) -> bool:
        """Check if approval needs a reminder."""
        from src.config import settings
        if not self.is_pending:
            return False
        if self.reminder_count >= settings.max_approval_reminders:
            return False
        if not self.last_reminder_at:
            return True

        time_since_reminder = datetime.now() - self.last_reminder_at
        return time_since_reminder.total_seconds() >= settings.reminder_interval
