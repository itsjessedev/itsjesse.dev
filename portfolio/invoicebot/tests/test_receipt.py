"""Tests for receipt processing."""

import os
os.environ["DEMO_MODE"] = "true"

import pytest
from src.services.ocr import ocr_service
from src.services.categorizer import categorizer, CATEGORIES
from src.services.receipt_service import receipt_service, ReceiptStatus


class TestOCR:
    """Tests for OCR service."""

    def test_extract_demo(self):
        result = ocr_service.extract_text("dummy.jpg")
        assert "raw_text" in result
        assert "confidence" in result
        assert len(result["raw_text"]) > 0


class TestCategorizer:
    """Tests for AI categorization."""

    def test_categorize_demo(self):
        ocr_data = {
            "vendor": "Test Store",
            "amount": 50.00,
            "date": "2024-01-15",
            "category": "Office Supplies",
            "confidence": 0.9,
        }
        result = categorizer.categorize("raw text", ocr_data)
        assert result["vendor"] == "Test Store"
        assert result["amount"] == 50.00
        assert result["category"] in CATEGORIES

    def test_basic_extraction(self):
        text = """Store Name
Jan 15, 2024
Total: $25.99"""
        result = categorizer._basic_extraction(text)
        assert result["amount"] == 25.99
        assert result["vendor"] == "Store Name"


class TestReceiptService:
    """Tests for receipt processing service."""

    @pytest.mark.asyncio
    async def test_process_upload(self):
        receipt = await receipt_service.process_upload(
            "test.jpg",
            b"fake image bytes"
        )
        assert receipt.id is not None
        assert receipt.status in [ReceiptStatus.APPROVED, ReceiptStatus.REVIEW]
        assert receipt.vendor is not None

    def test_approve_receipt(self):
        # Create a receipt first
        import asyncio
        receipt = asyncio.get_event_loop().run_until_complete(
            receipt_service.process_upload("test2.jpg", b"bytes")
        )
        receipt.status = ReceiptStatus.REVIEW

        approved = receipt_service.approve_receipt(receipt.id)
        assert approved is not None
        assert approved.status == ReceiptStatus.APPROVED

    def test_reject_receipt(self):
        import asyncio
        receipt = asyncio.get_event_loop().run_until_complete(
            receipt_service.process_upload("test3.jpg", b"bytes")
        )

        rejected = receipt_service.reject_receipt(receipt.id, "Invalid receipt")
        assert rejected is not None
        assert rejected.status == ReceiptStatus.REJECTED
