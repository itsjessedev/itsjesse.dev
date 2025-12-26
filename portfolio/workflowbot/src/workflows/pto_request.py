"""PTO request workflow."""
from datetime import datetime, timedelta
from typing import Dict, Any


class PTORequestWorkflow:
    """PTO request workflow handler."""

    @staticmethod
    def validate_request(data: Dict[str, Any]) -> tuple[bool, str]:
        """
        Validate PTO request data.

        Args:
            data: Request data

        Returns:
            Tuple of (is_valid, error_message)
        """
        required_fields = ["start_date", "end_date"]

        for field in required_fields:
            if field not in data:
                return False, f"Missing required field: {field}"

        # Parse dates
        try:
            start = datetime.fromisoformat(data["start_date"])
            end = datetime.fromisoformat(data["end_date"])
        except (ValueError, TypeError):
            return False, "Invalid date format"

        # Validate date range
        if end < start:
            return False, "End date must be after start date"

        if start < datetime.now():
            return False, "Start date cannot be in the past"

        return True, ""

    @staticmethod
    def calculate_days(data: Dict[str, Any]) -> int:
        """Calculate number of PTO days."""
        start = datetime.fromisoformat(data["start_date"])
        end = datetime.fromisoformat(data["end_date"])

        # Simple calculation: count weekdays
        days = 0
        current = start
        while current <= end:
            if current.weekday() < 5:  # Monday-Friday
                days += 1
            current += timedelta(days=1)

        return days

    @staticmethod
    def format_summary(data: Dict[str, Any]) -> str:
        """Format PTO request summary."""
        start = data["start_date"]
        end = data["end_date"]
        days = PTORequestWorkflow.calculate_days(data)
        reason = data.get("reason", "Not specified")

        summary = f"PTO Request: {start} to {end} ({days} days)\n"
        summary += f"Reason: {reason}"

        return summary

    @staticmethod
    def prepare_request_data(raw_data: Dict[str, Any]) -> Dict[str, Any]:
        """Prepare and enrich request data."""
        # Calculate days
        days = PTORequestWorkflow.calculate_days(raw_data)

        return {
            **raw_data,
            "days": days,
            "workflow_type": "pto"
        }
