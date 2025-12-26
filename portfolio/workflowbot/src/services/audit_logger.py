"""Audit logging service."""
from typing import Optional
from sqlalchemy.ext.asyncio import AsyncSession

from src.models.audit import AuditLog, AuditAction


class AuditLogger:
    """Service for creating audit log entries."""

    def __init__(self, db: AsyncSession):
        """Initialize audit logger."""
        self.db = db

    async def log(
        self,
        action: AuditAction,
        request_id: Optional[int] = None,
        actor_id: Optional[str] = None,
        actor_name: Optional[str] = None,
        actor_type: str = "system",
        description: Optional[str] = None,
        data: Optional[dict] = None,
    ) -> AuditLog:
        """
        Create an audit log entry.

        Args:
            action: The action being logged
            request_id: Associated request ID
            actor_id: ID of the actor performing the action
            actor_name: Name of the actor
            actor_type: Type of actor (user, system, bot)
            description: Human-readable description
            data: Additional context data

        Returns:
            AuditLog: Created audit log entry
        """
        log_entry = AuditLog.create_log(
            action=action,
            request_id=request_id,
            actor_id=actor_id,
            actor_name=actor_name,
            actor_type=actor_type,
            description=description,
            data=data or {}
        )

        self.db.add(log_entry)
        await self.db.commit()
        await self.db.refresh(log_entry)

        return log_entry

    async def log_request_created(
        self,
        request_id: int,
        requester_id: str,
        requester_name: str,
        workflow_type: str
    ):
        """Log request creation."""
        return await self.log(
            action=AuditAction.REQUEST_CREATED,
            request_id=request_id,
            actor_id=requester_id,
            actor_name=requester_name,
            actor_type="user",
            description=f"Created {workflow_type} request",
            data={"workflow_type": workflow_type}
        )

    async def log_request_submitted(
        self,
        request_id: int,
        requester_id: str,
        requester_name: str
    ):
        """Log request submission."""
        return await self.log(
            action=AuditAction.REQUEST_SUBMITTED,
            request_id=request_id,
            actor_id=requester_id,
            actor_name=requester_name,
            actor_type="user",
            description="Submitted request for approval"
        )

    async def log_approval_decision(
        self,
        request_id: int,
        approver_id: str,
        approver_name: str,
        approved: bool,
        comments: Optional[str] = None
    ):
        """Log approval decision."""
        action = AuditAction.APPROVAL_APPROVED if approved else AuditAction.APPROVAL_REJECTED
        description = f"{'Approved' if approved else 'Rejected'} request"

        return await self.log(
            action=action,
            request_id=request_id,
            actor_id=approver_id,
            actor_name=approver_name,
            actor_type="user",
            description=description,
            data={"comments": comments} if comments else {}
        )

    async def log_notification_sent(
        self,
        request_id: int,
        recipient_id: str,
        recipient_name: str,
        notification_type: str
    ):
        """Log notification sent."""
        return await self.log(
            action=AuditAction.NOTIFICATION_SENT,
            request_id=request_id,
            actor_id="system",
            actor_name="WorkflowBot",
            actor_type="bot",
            description=f"Sent {notification_type} notification to {recipient_name}",
            data={"recipient_id": recipient_id, "notification_type": notification_type}
        )

    async def log_workflow_step(
        self,
        request_id: int,
        step_name: str,
        status: str,
        data: Optional[dict] = None
    ):
        """Log workflow step completion."""
        return await self.log(
            action=AuditAction.WORKFLOW_STEP_COMPLETED,
            request_id=request_id,
            actor_id="system",
            actor_name="WorkflowBot",
            actor_type="bot",
            description=f"Completed workflow step: {step_name}",
            data={"step": step_name, "status": status, **(data or {})}
        )
