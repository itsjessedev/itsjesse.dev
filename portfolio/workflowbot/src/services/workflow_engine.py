"""Workflow execution engine."""
from typing import Optional, Dict, Any, List
from datetime import datetime
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from src.models.request import Request, RequestStatus
from src.models.approval import Approval, ApprovalStatus
from src.models.audit import AuditAction
from src.services.audit_logger import AuditLogger


class WorkflowEngine:
    """Engine for executing workflow logic."""

    def __init__(self, db: AsyncSession):
        """Initialize workflow engine."""
        self.db = db
        self.audit = AuditLogger(db)

    async def create_request(
        self,
        workflow_type: str,
        requester_id: str,
        requester_name: str,
        requester_email: str,
        title: str,
        description: Optional[str] = None,
        data: Optional[Dict[str, Any]] = None,
        priority: str = "normal"
    ) -> Request:
        """
        Create a new workflow request.

        Args:
            workflow_type: Type of workflow (pto, expense, onboarding)
            requester_id: User ID of requester
            requester_name: Name of requester
            requester_email: Email of requester
            title: Request title
            description: Request description
            data: Request data
            priority: Request priority

        Returns:
            Request: Created request
        """
        request = Request(
            workflow_type=workflow_type,
            requester_id=requester_id,
            requester_name=requester_name,
            requester_email=requester_email,
            title=title,
            description=description,
            data=data or {},
            priority=priority,
            status=RequestStatus.DRAFT
        )

        self.db.add(request)
        await self.db.commit()
        await self.db.refresh(request)

        # Log creation
        await self.audit.log_request_created(
            request_id=request.id,
            requester_id=requester_id,
            requester_name=requester_name,
            workflow_type=workflow_type
        )

        return request

    async def submit_request(
        self,
        request_id: int,
        approvers: List[Dict[str, str]]
    ) -> Request:
        """
        Submit a request and create approval records.

        Args:
            request_id: Request ID
            approvers: List of approvers with id, name, email

        Returns:
            Request: Updated request
        """
        # Get request
        result = await self.db.execute(
            select(Request).where(Request.id == request_id)
        )
        request = result.scalar_one()

        # Update status
        request.status = RequestStatus.PENDING
        request.submitted_at = datetime.utcnow()

        # Create approval records
        for i, approver in enumerate(approvers):
            approval = Approval(
                request_id=request.id,
                approver_id=approver["id"],
                approver_name=approver["name"],
                approver_email=approver.get("email"),
                step=f"approval_{i + 1}",
                level=i + 1,
                status=ApprovalStatus.PENDING
            )
            self.db.add(approval)

        await self.db.commit()
        await self.db.refresh(request)

        # Log submission
        await self.audit.log_request_submitted(
            request_id=request.id,
            requester_id=request.requester_id,
            requester_name=request.requester_name
        )

        # Log approval requests
        for approver in approvers:
            await self.audit.log(
                action=AuditAction.APPROVAL_REQUESTED,
                request_id=request.id,
                actor_id="system",
                actor_name="WorkflowBot",
                actor_type="bot",
                description=f"Requested approval from {approver['name']}",
                data={"approver_id": approver["id"]}
            )

        return request

    async def approve_request(
        self,
        approval_id: int,
        approver_id: str,
        comments: Optional[str] = None
    ) -> Approval:
        """
        Approve a request.

        Args:
            approval_id: Approval ID
            approver_id: ID of approver
            comments: Optional comments

        Returns:
            Approval: Updated approval
        """
        result = await self.db.execute(
            select(Approval).where(Approval.id == approval_id)
        )
        approval = result.scalar_one()

        # Verify approver
        if approval.approver_id != approver_id:
            raise ValueError("Approver mismatch")

        # Update approval
        approval.status = ApprovalStatus.APPROVED
        approval.comments = comments
        approval.decided_at = datetime.utcnow()

        await self.db.commit()
        await self.db.refresh(approval)

        # Log decision
        await self.audit.log_approval_decision(
            request_id=approval.request_id,
            approver_id=approver_id,
            approver_name=approval.approver_name,
            approved=True,
            comments=comments
        )

        # Check if all approvals are complete
        await self._check_request_completion(approval.request_id)

        return approval

    async def reject_request(
        self,
        approval_id: int,
        approver_id: str,
        comments: Optional[str] = None
    ) -> Approval:
        """
        Reject a request.

        Args:
            approval_id: Approval ID
            approver_id: ID of approver
            comments: Optional comments

        Returns:
            Approval: Updated approval
        """
        result = await self.db.execute(
            select(Approval).where(Approval.id == approval_id)
        )
        approval = result.scalar_one()

        # Verify approver
        if approval.approver_id != approver_id:
            raise ValueError("Approver mismatch")

        # Update approval
        approval.status = ApprovalStatus.REJECTED
        approval.comments = comments
        approval.decided_at = datetime.utcnow()

        # Update request status
        result = await self.db.execute(
            select(Request).where(Request.id == approval.request_id)
        )
        request = result.scalar_one()
        request.status = RequestStatus.REJECTED
        request.completed_at = datetime.utcnow()

        await self.db.commit()
        await self.db.refresh(approval)

        # Log decision
        await self.audit.log_approval_decision(
            request_id=approval.request_id,
            approver_id=approver_id,
            approver_name=approval.approver_name,
            approved=False,
            comments=comments
        )

        return approval

    async def _check_request_completion(self, request_id: int):
        """Check if all approvals are complete and update request status."""
        result = await self.db.execute(
            select(Request).where(Request.id == request_id)
        )
        request = result.scalar_one()

        # Check if all approvals are decided
        pending = [a for a in request.approvals if a.is_pending]

        if not pending:
            # All approvals decided
            rejected = [a for a in request.approvals if a.is_rejected]

            if rejected:
                request.status = RequestStatus.REJECTED
            else:
                request.status = RequestStatus.APPROVED

            request.completed_at = datetime.utcnow()
            await self.db.commit()

            # Log completion
            await self.audit.log(
                action=AuditAction.REQUEST_COMPLETED,
                request_id=request.id,
                actor_id="system",
                actor_name="WorkflowBot",
                actor_type="bot",
                description=f"Request {request.status.value}"
            )

    async def get_request(self, request_id: int) -> Optional[Request]:
        """Get request by ID."""
        result = await self.db.execute(
            select(Request).where(Request.id == request_id)
        )
        return result.scalar_one_or_none()

    async def get_user_requests(
        self,
        user_id: str,
        status: Optional[RequestStatus] = None
    ) -> List[Request]:
        """Get requests for a user."""
        query = select(Request).where(Request.requester_id == user_id)

        if status:
            query = query.where(Request.status == status)

        query = query.order_by(Request.created_at.desc())

        result = await self.db.execute(query)
        return list(result.scalars().all())

    async def get_pending_approvals(self, approver_id: str) -> List[Approval]:
        """Get pending approvals for an approver."""
        result = await self.db.execute(
            select(Approval).where(
                Approval.approver_id == approver_id,
                Approval.status == ApprovalStatus.PENDING
            )
        )
        return list(result.scalars().all())
