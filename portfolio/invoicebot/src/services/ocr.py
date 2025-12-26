"""OCR service for extracting text from receipt images."""

import logging
from pathlib import Path
import random

from src.config import settings

logger = logging.getLogger(__name__)


# Demo OCR results
DEMO_RECEIPTS = [
    {
        "raw_text": """STARBUCKS #12345
123 Main Street
Seattle, WA 98101

Date: 01/15/2024
Time: 08:23 AM

Grande Latte          5.75
Blueberry Muffin      3.25

Subtotal              9.00
Tax                   0.83
TOTAL                 9.83

VISA ****1234
Thank you for visiting!""",
        "vendor": "Starbucks",
        "amount": 9.83,
        "date": "2024-01-15",
        "category": "Meals & Entertainment",
    },
    {
        "raw_text": """OFFICE DEPOT
456 Business Blvd
Austin, TX 78701

01/18/2024 2:45 PM

HP Printer Paper (2)  24.99
Stapler               12.99
Pens (12 pack)         8.49

Subtotal             46.47
Tax                   3.83
TOTAL               $50.30

Card: AMEX ****5678""",
        "vendor": "Office Depot",
        "amount": 50.30,
        "date": "2024-01-18",
        "category": "Office Supplies",
    },
    {
        "raw_text": """UBER
Trip on Jan 20, 2024

Pickup: 123 Office Park
Dropoff: Airport Terminal B

Distance: 15.2 mi
Time: 25 min

Fare:              $32.50
Service Fee:        $3.25
Total:             $35.75

Charged to Visa 4321""",
        "vendor": "Uber",
        "amount": 35.75,
        "date": "2024-01-20",
        "category": "Travel",
    },
    {
        "raw_text": """AMAZON.COM
Order #123-4567890

Ship to: John Smith
123 Home St, City, ST

Items:
USB-C Cable (2)       15.99
Laptop Stand          45.00
Webcam HD             89.99

Subtotal            150.98
Shipping              FREE
Tax                  12.45
Order Total        $163.43

Payment: Visa ****9999""",
        "vendor": "Amazon",
        "amount": 163.43,
        "date": "2024-01-22",
        "category": "Office Equipment",
    },
]


class OCRService:
    """Service for extracting text from images using OCR."""

    def __init__(self):
        self._client = None

    def _init_client(self):
        """Initialize Google Cloud Vision client."""
        if settings.demo_mode:
            return

        try:
            from google.cloud import vision
            self._client = vision.ImageAnnotatorClient()
            logger.info("Google Cloud Vision client initialized")
        except Exception as e:
            logger.warning(f"Could not initialize Vision client: {e}")

    def extract_text(self, image_path: str) -> dict:
        """Extract text from an image file."""
        if settings.demo_mode:
            # Return random demo receipt
            demo = random.choice(DEMO_RECEIPTS).copy()
            demo["confidence"] = random.uniform(0.75, 0.98)
            logger.info(f"Demo mode: Returning mock OCR result for {image_path}")
            return demo

        if not self._client:
            self._init_client()

        if not self._client:
            raise RuntimeError("OCR client not available")

        try:
            from google.cloud import vision

            with open(image_path, "rb") as f:
                content = f.read()

            image = vision.Image(content=content)
            response = self._client.text_detection(image=image)

            if response.error.message:
                raise Exception(response.error.message)

            texts = response.text_annotations
            if not texts:
                return {"raw_text": "", "confidence": 0.0}

            # First annotation contains the full text
            full_text = texts[0].description
            confidence = sum(t.confidence for t in texts[1:]) / len(texts[1:]) if len(texts) > 1 else 0.8

            logger.info(f"Extracted {len(full_text)} characters from {image_path}")

            return {
                "raw_text": full_text,
                "confidence": confidence,
            }

        except Exception as e:
            logger.error(f"OCR extraction failed: {e}")
            raise

    def extract_from_bytes(self, image_bytes: bytes) -> dict:
        """Extract text from image bytes."""
        if settings.demo_mode:
            demo = random.choice(DEMO_RECEIPTS).copy()
            demo["confidence"] = random.uniform(0.75, 0.98)
            return demo

        # Save temporarily and process
        import tempfile
        with tempfile.NamedTemporaryFile(suffix=".jpg", delete=False) as f:
            f.write(image_bytes)
            temp_path = f.name

        try:
            return self.extract_text(temp_path)
        finally:
            Path(temp_path).unlink(missing_ok=True)


# Singleton
ocr_service = OCRService()
