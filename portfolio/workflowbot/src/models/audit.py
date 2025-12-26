"""Audit log model for tracking all actions."""
import enum
from datetime import datetime

from sqlalchemy import Column, String, DateTime, Enum, JSON, Integer, ForeignKey, Text
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func

from src.db.database import Base


class AuditAction(str, enum.Enum):
    """Audit action enumeration."""
    # Request actions
    REQUEST_CREATED = "request_created"
    REQUEST_SUBMITTED = "request_submitted"
    REQUEST_UPDATED = "request_updated"
    REQUEST_CANCELLED = "request_cancelled"
    REQUEST_COMPLETED = "request_completed"

    # Approval actions
    APPROVAL_REQUESTED = "approval_requested"
    APPROVAL_APPROVED = "approval_approved"
    APPROVAL_REJECTED = "approval_rejected"
    APPROVAL_REMINDER_SENT = "approval_reminder_sent"

    # Workflow actions
    WORKFLOW_STARTED = "workflow_started"
    WORKFLOW_STEP_COMPLETED = "workflow_step_completed"
    WORKFLOW_COMPLETED = "workflow_completed"
    WORKFLOW_FAILED = "workflow_failed"

    # Notification actions
    NOTIFICATION_SENT = "notification_sent"
    NOTIFICATION_FAILED = "notification_failed"

    # System actions
    SYSTEM_ACTION = "system_action"
    ERROR_OCCURRED = "error_occurred"


class AuditLog(Base):
    """Audit log model for comprehensive action tracking."""

    __tablename__ = "audit_logs"

    id = Column(Integer, primary_key=True, index=True)
    request_id = Column(Integer, ForeignKey("requests.id", ondelete="CASCADE"), index=True)

    action = Column(Enum(AuditAction), nullable=False, index=True)

    # Actor (who performed the action)
    actor_id = Column(String(100), index=True)
    actor_name = Column(String(200))
    actor_type = Column(String(50))  # user, system, bot

    # Action details
    description = Column(Text)
    data = Column(JSON, default=dict)  # Additional context

    # Metadata
    ip_address = Column(String(45))
    user_agent = Column(String(500))

    # Timestamp
    timestamp = Column(DateTime(timezone=True), server_default=func.now(), nullable=False, index=True)

    # Relationships
    request = relationship("Request", back_populates="audit_logs")

    def __repr__(self):
        return f"<AuditLog(id={self.id}, action={self.action}, actor={self.actor_name}, timestamp={self.timestamp})>"

    @classmethod
    def create_log(
        cls,
        action: AuditAction,
        request_id: int = None,
        actor_id: str = None,
        actor_name: str = None,
        actor_type: str = "system",
        description: str = None,
        data: dict = None
    ):
        """
        Factory method to create audit log entries.

        Args:
            action: The action being logged
            request_id: Associated request ID
            actor_id: ID of the actor performing the action
            actor_name: Name of the actor
            actor_type: Type of actor (user, system, bot)
            description: Human-readable description
            data: Additional context data

        Returns:
            AuditLog: New audit log instance
        """
        return cls(
            request_id=request_id,
            action=action,
            actor_id=actor_id,
            actor_name=actor_name,
            actor_type=actor_type,
            description=description,
            data=data or {}
        )
