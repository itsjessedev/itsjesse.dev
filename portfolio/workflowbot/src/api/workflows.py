"""Workflow configuration API endpoints."""
from typing import List
from fastapi import APIRouter
from pydantic import BaseModel

router = APIRouter(prefix="/api/workflows", tags=["workflows"])


class WorkflowInfo(BaseModel):
    """Workflow information schema."""
    type: str
    name: str
    description: str
    enabled: bool


@router.get("", response_model=List[WorkflowInfo])
async def list_workflows():
    """List available workflows."""
    return [
        {
            "type": "pto",
            "name": "PTO Request",
            "description": "Submit time-off requests for manager approval",
            "enabled": True
        },
        {
            "type": "expense",
            "name": "Expense Approval",
            "description": "Submit expenses for reimbursement approval",
            "enabled": True
        },
        {
            "type": "onboarding",
            "name": "Employee Onboarding",
            "description": "Onboard new employees with automated checklist",
            "enabled": True
        }
    ]
