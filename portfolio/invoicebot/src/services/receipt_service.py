"""Main receipt processing service."""

import logging
from dataclasses import dataclass, field
from datetime import datetime
from enum import Enum
from pathlib import Path
from typing import Any
import uuid

from src.config import settings
from src.services.ocr import ocr_service
from src.services.categorizer import categorizer

logger = logging.getLogger(__name__)


class ReceiptStatus(str, Enum):
    """Status of a receipt in the processing pipeline."""
    PENDING = "pending"      # Just uploaded, not processed
    PROCESSING = "processing"  # OCR/AI in progress
    REVIEW = "review"        # Needs human review
    APPROVED = "approved"    # Ready to sync
    SYNCED = "synced"        # Pushed to accounting
    REJECTED = "rejected"    # Marked as invalid


@dataclass
class Receipt:
    """A processed receipt."""
    id: str
    filename: str
    status: ReceiptStatus
    created_at: datetime
    vendor: str | None = None
    amount: float | None = None
    date: str | None = None
    category: str | None = None
    description: str | None = None
    confidence: float = 0.0
    raw_text: str | None = None
    image_path: str | None = None
    synced_at: datetime | None = None
    accounting_id: str | None = None
    notes: str | None = None

    def to_dict(self) -> dict[str, Any]:
        return {
            "id": self.id,
            "filename": self.filename,
            "status": self.status.value,
            "created_at": self.created_at.isoformat(),
            "vendor": self.vendor,
            "amount": self.amount,
            "date": self.date,
            "category": self.category,
            "description": self.description,
            "confidence": self.confidence,
            "synced_at": self.synced_at.isoformat() if self.synced_at else None,
            "accounting_id": self.accounting_id,
            "notes": self.notes,
        }

    @property
    def needs_review(self) -> bool:
        return self.confidence < settings.min_confidence_auto_approve


class ReceiptService:
    """Service for managing receipts through the processing pipeline."""

    def __init__(self):
        self._receipts: dict[str, Receipt] = {}
        self._uploads_dir = Path("uploads")
        self._uploads_dir.mkdir(exist_ok=True)

    @property
    def all_receipts(self) -> list[dict[str, Any]]:
        """Get all receipts sorted by date."""
        return [r.to_dict() for r in sorted(
            self._receipts.values(),
            key=lambda x: x.created_at,
            reverse=True,
        )]

    @property
    def review_queue(self) -> list[dict[str, Any]]:
        """Get receipts pending review."""
        return [
            r.to_dict() for r in self._receipts.values()
            if r.status == ReceiptStatus.REVIEW
        ]

    def get_receipt(self, receipt_id: str) -> Receipt | None:
        """Get a specific receipt."""
        return self._receipts.get(receipt_id)

    async def process_upload(self, filename: str, file_bytes: bytes) -> Receipt:
        """Process an uploaded receipt image."""
        receipt_id = str(uuid.uuid4())[:8].upper()

        # Save file
        file_ext = Path(filename).suffix or ".jpg"
        saved_path = self._uploads_dir / f"{receipt_id}{file_ext}"
        saved_path.write_bytes(file_bytes)

        receipt = Receipt(
            id=receipt_id,
            filename=filename,
            status=ReceiptStatus.PROCESSING,
            created_at=datetime.now(),
            image_path=str(saved_path),
        )
        self._receipts[receipt_id] = receipt

        try:
            # Run OCR
            logger.info(f"Processing receipt {receipt_id}: OCR")
            ocr_result = ocr_service.extract_text(str(saved_path))
            receipt.raw_text = ocr_result.get("raw_text", "")

            # Categorize with AI
            logger.info(f"Processing receipt {receipt_id}: Categorization")
            extracted = categorizer.categorize(receipt.raw_text, ocr_result)

            receipt.vendor = extracted.get("vendor")
            receipt.amount = extracted.get("amount")
            receipt.date = extracted.get("date")
            receipt.category = extracted.get("category")
            receipt.description = extracted.get("description")
            receipt.confidence = extracted.get("confidence", 0.0)

            # Determine status based on confidence
            if receipt.confidence >= settings.min_confidence_auto_approve:
                receipt.status = ReceiptStatus.APPROVED
                logger.info(f"Receipt {receipt_id} auto-approved (confidence: {receipt.confidence:.2f})")
            elif receipt.confidence >= settings.min_confidence_show:
                receipt.status = ReceiptStatus.REVIEW
                logger.info(f"Receipt {receipt_id} needs review (confidence: {receipt.confidence:.2f})")
            else:
                receipt.status = ReceiptStatus.REVIEW
                receipt.notes = "Low confidence - please verify all fields"

        except Exception as e:
            logger.exception(f"Failed to process receipt {receipt_id}")
            receipt.status = ReceiptStatus.REVIEW
            receipt.notes = f"Processing error: {str(e)}"

        return receipt

    def approve_receipt(self, receipt_id: str, updates: dict | None = None) -> Receipt | None:
        """Approve a receipt, optionally with corrections."""
        receipt = self._receipts.get(receipt_id)
        if not receipt:
            return None

        if updates:
            if "vendor" in updates:
                receipt.vendor = updates["vendor"]
            if "amount" in updates:
                receipt.amount = float(updates["amount"])
            if "date" in updates:
                receipt.date = updates["date"]
            if "category" in updates:
                receipt.category = updates["category"]
            if "description" in updates:
                receipt.description = updates["description"]

        receipt.status = ReceiptStatus.APPROVED
        logger.info(f"Receipt {receipt_id} approved")
        return receipt

    def reject_receipt(self, receipt_id: str, reason: str | None = None) -> Receipt | None:
        """Reject a receipt."""
        receipt = self._receipts.get(receipt_id)
        if not receipt:
            return None

        receipt.status = ReceiptStatus.REJECTED
        receipt.notes = reason
        logger.info(f"Receipt {receipt_id} rejected: {reason}")
        return receipt

    def sync_to_accounting(self, receipt_id: str) -> Receipt | None:
        """Sync an approved receipt to accounting software."""
        receipt = self._receipts.get(receipt_id)
        if not receipt or receipt.status != ReceiptStatus.APPROVED:
            return None

        if settings.demo_mode:
            # Simulate sync
            receipt.accounting_id = f"QB-{uuid.uuid4().hex[:8].upper()}"
            receipt.synced_at = datetime.now()
            receipt.status = ReceiptStatus.SYNCED
            logger.info(f"Demo: Receipt {receipt_id} synced as {receipt.accounting_id}")
            return receipt

        # TODO: Implement actual QuickBooks/Xero sync
        # For now, mark as synced in demo
        receipt.status = ReceiptStatus.SYNCED
        receipt.synced_at = datetime.now()
        return receipt


# Singleton
receipt_service = ReceiptService()
