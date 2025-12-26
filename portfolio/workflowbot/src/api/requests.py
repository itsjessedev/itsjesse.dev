"""Request API endpoints."""
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from pydantic import BaseModel, Field

from src.db.database import get_db
from src.models.request import Request, RequestStatus
from src.services.workflow_engine import WorkflowEngine
from src.services.approval_router import ApprovalRouter
from src.workflows.pto_request import PTORequestWorkflow
from src.workflows.expense_approval import ExpenseApprovalWorkflow
from src.workflows.onboarding import OnboardingWorkflow

router = APIRouter(prefix="/api/requests", tags=["requests"])


class CreateRequestSchema(BaseModel):
    """Schema for creating a request."""
    workflow_type: str = Field(..., description="Type of workflow")
    requester_id: str = Field(..., description="User ID of requester")
    requester_name: str = Field(..., description="Name of requester")
    requester_email: str = Field(..., description="Email of requester")
    title: str = Field(..., description="Request title")
    description: Optional[str] = Field(None, description="Request description")
    data: dict = Field(..., description="Request data")
    priority: str = Field("normal", description="Request priority")


class RequestResponse(BaseModel):
    """Schema for request response."""
    id: int
    workflow_type: str
    requester_id: str
    requester_name: str
    status: str
    title: str
    description: Optional[str]
    data: dict
    created_at: str
    updated_at: Optional[str]

    model_config = {"from_attributes": True}


class ApprovalDecisionSchema(BaseModel):
    """Schema for approval decision."""
    approver_id: str
    comments: Optional[str] = None


@router.post("", response_model=RequestResponse, status_code=status.HTTP_201_CREATED)
async def create_request(
    request_data: CreateRequestSchema,
    db: AsyncSession = Depends(get_db)
):
    """Create a new workflow request."""
    engine = WorkflowEngine(db)

    # Validate workflow type
    workflows = {
        "pto": PTORequestWorkflow,
        "expense": ExpenseApprovalWorkflow,
        "onboarding": OnboardingWorkflow
    }

    workflow_cls = workflows.get(request_data.workflow_type)
    if not workflow_cls:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Unknown workflow type: {request_data.workflow_type}"
        )

    # Validate request data
    is_valid, error = workflow_cls.validate_request(request_data.data)
    if not is_valid:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=error
        )

    # Prepare data
    prepared_data = workflow_cls.prepare_request_data(request_data.data)

    # Create request
    request = await engine.create_request(
        workflow_type=request_data.workflow_type,
        requester_id=request_data.requester_id,
        requester_name=request_data.requester_name,
        requester_email=request_data.requester_email,
        title=request_data.title,
        description=request_data.description,
        data=prepared_data,
        priority=request_data.priority
    )

    return request


@router.post("/{request_id}/submit", response_model=RequestResponse)
async def submit_request(
    request_id: int,
    db: AsyncSession = Depends(get_db)
):
    """Submit a request for approval."""
    engine = WorkflowEngine(db)
    router_service = ApprovalRouter()

    # Get request
    request = await engine.get_request(request_id)
    if not request:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Request not found"
        )

    # Route approvals
    approvers = router_service.route(
        workflow_type=request.workflow_type,
        request_data=request.data,
        requester_id=request.requester_id
    )

    # Submit request
    request = await engine.submit_request(request_id, approvers)

    return request


@router.get("/{request_id}", response_model=RequestResponse)
async def get_request(
    request_id: int,
    db: AsyncSession = Depends(get_db)
):
    """Get request by ID."""
    engine = WorkflowEngine(db)
    request = await engine.get_request(request_id)

    if not request:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Request not found"
        )

    return request


@router.get("", response_model=List[RequestResponse])
async def list_requests(
    requester_id: Optional[str] = None,
    status: Optional[str] = None,
    db: AsyncSession = Depends(get_db)
):
    """List requests with optional filtering."""
    engine = WorkflowEngine(db)

    if requester_id:
        request_status = RequestStatus(status) if status else None
        requests = await engine.get_user_requests(requester_id, request_status)
    else:
        # In production, implement proper pagination and filtering
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="requester_id is required"
        )

    return requests


@router.post("/{request_id}/approve", response_model=RequestResponse)
async def approve_request(
    request_id: int,
    decision: ApprovalDecisionSchema,
    db: AsyncSession = Depends(get_db)
):
    """Approve a request."""
    engine = WorkflowEngine(db)

    # Get request
    request = await engine.get_request(request_id)
    if not request:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Request not found"
        )

    # Find pending approval for this approver
    pending = [
        a for a in request.pending_approvals
        if a.approver_id == decision.approver_id
    ]

    if not pending:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="No pending approval found for this approver"
        )

    # Approve
    await engine.approve_request(
        pending[0].id,
        decision.approver_id,
        decision.comments
    )

    # Return updated request
    request = await engine.get_request(request_id)
    return request


@router.post("/{request_id}/reject", response_model=RequestResponse)
async def reject_request(
    request_id: int,
    decision: ApprovalDecisionSchema,
    db: AsyncSession = Depends(get_db)
):
    """Reject a request."""
    engine = WorkflowEngine(db)

    # Get request
    request = await engine.get_request(request_id)
    if not request:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Request not found"
        )

    # Find pending approval for this approver
    pending = [
        a for a in request.pending_approvals
        if a.approver_id == decision.approver_id
    ]

    if not pending:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="No pending approval found for this approver"
        )

    # Reject
    await engine.reject_request(
        pending[0].id,
        decision.approver_id,
        decision.comments
    )

    # Return updated request
    request = await engine.get_request(request_id)
    return request
