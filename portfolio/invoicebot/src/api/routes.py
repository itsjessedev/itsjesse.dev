"""API routes for receipt management."""

from fastapi import APIRouter, HTTPException, UploadFile, File
from pydantic import BaseModel

from src.services.receipt_service import receipt_service, ReceiptStatus

router = APIRouter(prefix="/api")


class ReceiptUpdate(BaseModel):
    """Request to update receipt fields."""
    vendor: str | None = None
    amount: float | None = None
    date: str | None = None
    category: str | None = None
    description: str | None = None


class RejectRequest(BaseModel):
    """Request to reject a receipt."""
    reason: str | None = None


class APIResponse(BaseModel):
    """Standard API response."""
    status: str
    message: str
    data: dict | None = None


@router.get("/receipts")
async def list_receipts() -> APIResponse:
    """List all receipts."""
    receipts = receipt_service.all_receipts
    return APIResponse(
        status="success",
        message=f"Found {len(receipts)} receipts",
        data={"receipts": receipts},
    )


@router.get("/receipts/{receipt_id}")
async def get_receipt(receipt_id: str) -> APIResponse:
    """Get a specific receipt."""
    receipt = receipt_service.get_receipt(receipt_id)
    if not receipt:
        raise HTTPException(status_code=404, detail="Receipt not found")

    return APIResponse(
        status="success",
        message="Receipt found",
        data={"receipt": receipt.to_dict()},
    )


@router.post("/receipts")
async def upload_receipt(file: UploadFile = File(...)) -> APIResponse:
    """Upload and process a new receipt."""
    if not file.filename:
        raise HTTPException(status_code=400, detail="No file provided")

    # Validate file type
    allowed_types = {"image/jpeg", "image/png", "image/gif", "image/webp", "application/pdf"}
    if file.content_type and file.content_type not in allowed_types:
        raise HTTPException(status_code=400, detail="Invalid file type")

    file_bytes = await file.read()
    receipt = await receipt_service.process_upload(file.filename, file_bytes)

    return APIResponse(
        status=receipt.status.value,
        message=f"Receipt {receipt.id} processed",
        data={"receipt": receipt.to_dict()},
    )


@router.post("/receipts/{receipt_id}/approve")
async def approve_receipt(receipt_id: str, updates: ReceiptUpdate | None = None) -> APIResponse:
    """Approve a receipt with optional corrections."""
    receipt = receipt_service.approve_receipt(
        receipt_id,
        updates.model_dump(exclude_none=True) if updates else None,
    )
    if not receipt:
        raise HTTPException(status_code=404, detail="Receipt not found")

    return APIResponse(
        status="success",
        message=f"Receipt {receipt_id} approved",
        data={"receipt": receipt.to_dict()},
    )


@router.post("/receipts/{receipt_id}/reject")
async def reject_receipt(receipt_id: str, request: RejectRequest | None = None) -> APIResponse:
    """Reject a receipt."""
    receipt = receipt_service.reject_receipt(
        receipt_id,
        request.reason if request else None,
    )
    if not receipt:
        raise HTTPException(status_code=404, detail="Receipt not found")

    return APIResponse(
        status="success",
        message=f"Receipt {receipt_id} rejected",
        data={"receipt": receipt.to_dict()},
    )


@router.post("/receipts/{receipt_id}/sync")
async def sync_receipt(receipt_id: str) -> APIResponse:
    """Sync an approved receipt to accounting."""
    receipt = receipt_service.sync_to_accounting(receipt_id)
    if not receipt:
        raise HTTPException(status_code=400, detail="Receipt not found or not approved")

    return APIResponse(
        status="success",
        message=f"Receipt synced as {receipt.accounting_id}",
        data={"receipt": receipt.to_dict()},
    )


@router.get("/queue")
async def get_review_queue() -> APIResponse:
    """Get receipts pending review."""
    queue = receipt_service.review_queue
    return APIResponse(
        status="success",
        message=f"{len(queue)} receipts pending review",
        data={"queue": queue},
    )


@router.get("/categories")
async def list_categories() -> APIResponse:
    """List available expense categories."""
    from src.services.categorizer import CATEGORIES
    return APIResponse(
        status="success",
        message=f"Found {len(CATEGORIES)} categories",
        data={"categories": CATEGORIES},
    )
