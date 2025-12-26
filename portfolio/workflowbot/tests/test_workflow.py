"""Test workflow functionality."""
import pytest
from datetime import datetime, timedelta
from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession
from sqlalchemy.ext.asyncio import async_sessionmaker

from src.db.database import Base
from src.services.workflow_engine import WorkflowEngine
from src.services.approval_router import ApprovalRouter
from src.workflows.pto_request import PTORequestWorkflow
from src.workflows.expense_approval import ExpenseApprovalWorkflow
from src.models.request import RequestStatus
from src.models.approval import ApprovalStatus


# Test database URL
TEST_DATABASE_URL = "sqlite+aiosqlite:///:memory:"


@pytest.fixture
async def db_session():
    """Create test database session."""
    engine = create_async_engine(TEST_DATABASE_URL, echo=False)

    # Create tables
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)

    # Create session
    async_session = async_sessionmaker(
        engine, class_=AsyncSession, expire_on_commit=False
    )

    async with async_session() as session:
        yield session

    # Drop tables
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.drop_all)

    await engine.dispose()


@pytest.mark.asyncio
async def test_create_pto_request(db_session):
    """Test creating a PTO request."""
    engine = WorkflowEngine(db_session)

    request = await engine.create_request(
        workflow_type="pto",
        requester_id="USER001",
        requester_name="Test User",
        requester_email="test@example.com",
        title="Test PTO",
        data={
            "start_date": (datetime.now() + timedelta(days=7)).isoformat(),
            "end_date": (datetime.now() + timedelta(days=9)).isoformat(),
            "reason": "Vacation"
        }
    )

    assert request.id is not None
    assert request.workflow_type == "pto"
    assert request.status == RequestStatus.DRAFT


@pytest.mark.asyncio
async def test_submit_pto_request(db_session):
    """Test submitting a PTO request."""
    engine = WorkflowEngine(db_session)
    router = ApprovalRouter()

    # Create request
    request = await engine.create_request(
        workflow_type="pto",
        requester_id="USER001",
        requester_name="Test User",
        requester_email="test@example.com",
        title="Test PTO",
        data={
            "start_date": (datetime.now() + timedelta(days=7)).isoformat(),
            "end_date": (datetime.now() + timedelta(days=9)).isoformat(),
            "days": 3
        }
    )

    # Route approvers
    approvers = router.route("pto", request.data, request.requester_id)

    # Submit
    request = await engine.submit_request(request.id, approvers)

    assert request.status == RequestStatus.PENDING
    assert len(request.approvals) > 0
    assert request.approvals[0].status == ApprovalStatus.PENDING


@pytest.mark.asyncio
async def test_approve_request(db_session):
    """Test approving a request."""
    engine = WorkflowEngine(db_session)
    router = ApprovalRouter()

    # Create and submit request
    request = await engine.create_request(
        workflow_type="pto",
        requester_id="USER001",
        requester_name="Test User",
        requester_email="test@example.com",
        title="Test PTO",
        data={
            "start_date": (datetime.now() + timedelta(days=7)).isoformat(),
            "end_date": (datetime.now() + timedelta(days=9)).isoformat(),
            "days": 2
        }
    )

    approvers = router.route("pto", request.data, request.requester_id)
    request = await engine.submit_request(request.id, approvers)

    # Approve
    approval = request.approvals[0]
    await engine.approve_request(
        approval.id,
        approval.approver_id,
        "Approved for testing"
    )

    # Verify
    request = await engine.get_request(request.id)
    assert request.status == RequestStatus.APPROVED
    assert request.approvals[0].status == ApprovalStatus.APPROVED


@pytest.mark.asyncio
async def test_reject_request(db_session):
    """Test rejecting a request."""
    engine = WorkflowEngine(db_session)
    router = ApprovalRouter()

    # Create and submit request
    request = await engine.create_request(
        workflow_type="pto",
        requester_id="USER001",
        requester_name="Test User",
        requester_email="test@example.com",
        title="Test PTO",
        data={
            "start_date": (datetime.now() + timedelta(days=7)).isoformat(),
            "end_date": (datetime.now() + timedelta(days=9)).isoformat(),
            "days": 2
        }
    )

    approvers = router.route("pto", request.data, request.requester_id)
    request = await engine.submit_request(request.id, approvers)

    # Reject
    approval = request.approvals[0]
    await engine.reject_request(
        approval.id,
        approval.approver_id,
        "Not enough coverage"
    )

    # Verify
    request = await engine.get_request(request.id)
    assert request.status == RequestStatus.REJECTED
    assert request.approvals[0].status == ApprovalStatus.REJECTED


def test_pto_validation():
    """Test PTO request validation."""
    # Valid request
    valid, error = PTORequestWorkflow.validate_request({
        "start_date": (datetime.now() + timedelta(days=7)).isoformat(),
        "end_date": (datetime.now() + timedelta(days=9)).isoformat()
    })
    assert valid is True

    # Missing field
    valid, error = PTORequestWorkflow.validate_request({
        "start_date": (datetime.now() + timedelta(days=7)).isoformat()
    })
    assert valid is False

    # Invalid date range
    valid, error = PTORequestWorkflow.validate_request({
        "start_date": (datetime.now() + timedelta(days=9)).isoformat(),
        "end_date": (datetime.now() + timedelta(days=7)).isoformat()
    })
    assert valid is False


def test_expense_validation():
    """Test expense request validation."""
    # Valid request
    valid, error = ExpenseApprovalWorkflow.validate_request({
        "amount": "100.50",
        "category": "travel",
        "description": "Client meeting transportation"
    })
    assert valid is True

    # Invalid amount
    valid, error = ExpenseApprovalWorkflow.validate_request({
        "amount": "-50",
        "category": "travel",
        "description": "Test"
    })
    assert valid is False

    # Invalid category
    valid, error = ExpenseApprovalWorkflow.validate_request({
        "amount": "100",
        "category": "invalid",
        "description": "Test description here"
    })
    assert valid is False


def test_approval_routing():
    """Test approval routing logic."""
    router = ApprovalRouter()

    # Small PTO - manager only
    approvers = router.route("pto", {"days": 2}, "USER001")
    assert len(approvers) == 1

    # Large PTO - manager + HR
    approvers = router.route("pto", {"days": 5}, "USER001")
    assert len(approvers) == 2

    # Small expense - manager only
    approvers = router.route("expense", {"amount": 200}, "USER001")
    assert len(approvers) == 1

    # Large expense - manager + finance
    approvers = router.route("expense", {"amount": 800}, "USER001")
    assert len(approvers) == 2
