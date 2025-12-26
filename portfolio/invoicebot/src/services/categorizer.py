"""AI-powered receipt categorization using OpenAI."""

import json
import logging
import re
from datetime import datetime

from openai import OpenAI

from src.config import settings

logger = logging.getLogger(__name__)

# Standard expense categories
CATEGORIES = [
    "Office Supplies",
    "Office Equipment",
    "Software & Subscriptions",
    "Travel",
    "Meals & Entertainment",
    "Utilities",
    "Professional Services",
    "Marketing & Advertising",
    "Shipping & Postage",
    "Vehicle Expenses",
    "Insurance",
    "Repairs & Maintenance",
    "Other",
]

EXTRACTION_PROMPT = """You are an expert at reading receipts and extracting expense information.
Given the raw text from a receipt, extract the following information in JSON format:

{
  "vendor": "The store or company name",
  "amount": 0.00,  // The total amount as a number
  "date": "YYYY-MM-DD",  // The transaction date
  "category": "Category name",  // One of the predefined categories
  "description": "Brief description of purchase",
  "confidence": 0.95  // Your confidence in the extraction (0.0 to 1.0)
}

Predefined categories:
- Office Supplies
- Office Equipment
- Software & Subscriptions
- Travel
- Meals & Entertainment
- Utilities
- Professional Services
- Marketing & Advertising
- Shipping & Postage
- Vehicle Expenses
- Insurance
- Repairs & Maintenance
- Other

If you cannot determine a field with confidence, use null for that field and lower your confidence score.
Return ONLY the JSON object, no additional text.
"""


class CategorizationService:
    """Service for categorizing and structuring receipt data using AI."""

    def __init__(self):
        self._client = None

    def _init_client(self):
        """Initialize OpenAI client."""
        if settings.demo_mode:
            return

        if settings.openai_api_key:
            self._client = OpenAI(api_key=settings.openai_api_key)
            logger.info("OpenAI client initialized")

    def categorize(self, raw_text: str, ocr_data: dict | None = None) -> dict:
        """Categorize a receipt from its raw text."""
        if settings.demo_mode and ocr_data:
            # In demo mode, return the pre-extracted data from OCR mock
            return {
                "vendor": ocr_data.get("vendor", "Unknown Vendor"),
                "amount": ocr_data.get("amount", 0.0),
                "date": ocr_data.get("date", datetime.now().strftime("%Y-%m-%d")),
                "category": ocr_data.get("category", "Other"),
                "description": f"Purchase from {ocr_data.get('vendor', 'Unknown')}",
                "confidence": ocr_data.get("confidence", 0.8),
            }

        if not self._client:
            self._init_client()

        if not self._client:
            # Fallback to basic extraction
            return self._basic_extraction(raw_text)

        try:
            response = self._client.chat.completions.create(
                model="gpt-4-turbo-preview",
                messages=[
                    {"role": "system", "content": EXTRACTION_PROMPT},
                    {"role": "user", "content": f"Receipt text:\n\n{raw_text}"},
                ],
                temperature=0.1,
                response_format={"type": "json_object"},
            )

            result = json.loads(response.choices[0].message.content)

            # Validate and clean
            result["amount"] = float(result.get("amount") or 0.0)
            result["confidence"] = float(result.get("confidence") or 0.5)

            if result.get("category") not in CATEGORIES:
                result["category"] = "Other"

            logger.info(f"Categorized: {result['vendor']} - ${result['amount']}")
            return result

        except Exception as e:
            logger.error(f"AI categorization failed: {e}")
            return self._basic_extraction(raw_text)

    def _basic_extraction(self, raw_text: str) -> dict:
        """Basic extraction when AI is unavailable."""
        # Try to find amounts
        amount_pattern = r'\$?(\d+\.\d{2})'
        amounts = re.findall(amount_pattern, raw_text)
        amount = float(amounts[-1]) if amounts else 0.0

        # Try to find dates
        date_patterns = [
            r'(\d{1,2}/\d{1,2}/\d{4})',
            r'(\d{4}-\d{2}-\d{2})',
            r'(\w+ \d{1,2}, \d{4})',
        ]
        date = None
        for pattern in date_patterns:
            match = re.search(pattern, raw_text)
            if match:
                date = match.group(1)
                break

        # First line is often the vendor
        lines = [l.strip() for l in raw_text.split('\n') if l.strip()]
        vendor = lines[0] if lines else "Unknown"

        return {
            "vendor": vendor,
            "amount": amount,
            "date": date or datetime.now().strftime("%Y-%m-%d"),
            "category": "Other",
            "description": f"Purchase from {vendor}",
            "confidence": 0.4,
        }


# Singleton
categorizer = CategorizationService()
