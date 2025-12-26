"""Expense approval workflow."""
from decimal import Decimal, InvalidOperation
from typing import Dict, Any


class ExpenseApprovalWorkflow:
    """Expense approval workflow handler."""

    CATEGORIES = ["travel", "meals", "equipment", "software", "training", "other"]

    @staticmethod
    def validate_request(data: Dict[str, Any]) -> tuple[bool, str]:
        """
        Validate expense request data.

        Args:
            data: Request data

        Returns:
            Tuple of (is_valid, error_message)
        """
        required_fields = ["amount", "category", "description"]

        for field in required_fields:
            if field not in data:
                return False, f"Missing required field: {field}"

        # Validate amount
        try:
            amount = Decimal(str(data["amount"]))
            if amount <= 0:
                return False, "Amount must be greater than 0"
        except (InvalidOperation, ValueError):
            return False, "Invalid amount format"

        # Validate category
        if data["category"] not in ExpenseApprovalWorkflow.CATEGORIES:
            return False, f"Invalid category. Must be one of: {', '.join(ExpenseApprovalWorkflow.CATEGORIES)}"

        # Validate description
        if len(data["description"].strip()) < 10:
            return False, "Description must be at least 10 characters"

        return True, ""

    @staticmethod
    def format_summary(data: Dict[str, Any]) -> str:
        """Format expense request summary."""
        amount = Decimal(str(data["amount"]))
        category = data["category"]
        description = data["description"]

        summary = f"Expense Reimbursement: ${amount:.2f}\n"
        summary += f"Category: {category.title()}\n"
        summary += f"Description: {description}"

        if "receipt_url" in data:
            summary += f"\nReceipt: {data['receipt_url']}"

        return summary

    @staticmethod
    def prepare_request_data(raw_data: Dict[str, Any]) -> Dict[str, Any]:
        """Prepare and enrich request data."""
        # Convert amount to Decimal for precision
        amount = Decimal(str(raw_data["amount"]))

        return {
            **raw_data,
            "amount": float(amount),
            "workflow_type": "expense"
        }

    @staticmethod
    def requires_finance_approval(amount: float) -> bool:
        """Check if expense requires finance team approval."""
        return amount >= 500.0

    @staticmethod
    def get_approval_threshold(category: str) -> float:
        """Get approval threshold for category."""
        thresholds = {
            "travel": 1000.0,
            "equipment": 500.0,
            "software": 300.0,
            "training": 1000.0,
            "meals": 100.0,
            "other": 200.0
        }

        return thresholds.get(category, 200.0)
