"""Employee onboarding workflow."""
from datetime import datetime
from typing import Dict, Any, List


class OnboardingWorkflow:
    """Employee onboarding workflow handler."""

    @staticmethod
    def validate_request(data: Dict[str, Any]) -> tuple[bool, str]:
        """
        Validate onboarding request data.

        Args:
            data: Request data

        Returns:
            Tuple of (is_valid, error_message)
        """
        required_fields = ["employee_name", "employee_email", "department", "start_date"]

        for field in required_fields:
            if field not in data:
                return False, f"Missing required field: {field}"

        # Validate email
        if "@" not in data["employee_email"]:
            return False, "Invalid email address"

        # Validate start date
        try:
            start_date = datetime.fromisoformat(data["start_date"])
            if start_date < datetime.now():
                return False, "Start date cannot be in the past"
        except (ValueError, TypeError):
            return False, "Invalid start date format"

        return True, ""

    @staticmethod
    def generate_checklist(data: Dict[str, Any]) -> List[Dict[str, Any]]:
        """Generate onboarding checklist based on department and role."""
        department = data.get("department", "").lower()
        role = data.get("role", "").lower()

        # Base checklist for all employees
        checklist = [
            {
                "task": "Create email account",
                "assignee": "IT",
                "priority": "high",
                "estimated_hours": 0.5
            },
            {
                "task": "Setup workstation",
                "assignee": "IT",
                "priority": "high",
                "estimated_hours": 2
            },
            {
                "task": "Provide building access badge",
                "assignee": "Facilities",
                "priority": "high",
                "estimated_hours": 0.5
            },
            {
                "task": "Complete new hire paperwork",
                "assignee": "HR",
                "priority": "high",
                "estimated_hours": 1
            },
            {
                "task": "Setup benefits enrollment",
                "assignee": "HR",
                "priority": "medium",
                "estimated_hours": 1
            },
            {
                "task": "Schedule orientation session",
                "assignee": "HR",
                "priority": "medium",
                "estimated_hours": 4
            }
        ]

        # Department-specific tasks
        if "engineering" in department or "dev" in department:
            checklist.extend([
                {
                    "task": "Setup GitHub account",
                    "assignee": "Engineering",
                    "priority": "high",
                    "estimated_hours": 0.5
                },
                {
                    "task": "Provide development environment access",
                    "assignee": "Engineering",
                    "priority": "high",
                    "estimated_hours": 1
                },
                {
                    "task": "Assign onboarding buddy",
                    "assignee": "Engineering Manager",
                    "priority": "medium",
                    "estimated_hours": 0
                }
            ])

        if "sales" in department or "marketing" in department:
            checklist.extend([
                {
                    "task": "Setup CRM access",
                    "assignee": "Sales Ops",
                    "priority": "high",
                    "estimated_hours": 0.5
                },
                {
                    "task": "Provide sales training materials",
                    "assignee": "Sales Enablement",
                    "priority": "medium",
                    "estimated_hours": 1
                }
            ])

        # Equipment based on role
        if "manager" in role or "director" in role or "vp" in role:
            checklist.append({
                "task": "Setup conference room booking access",
                "assignee": "IT",
                "priority": "medium",
                "estimated_hours": 0.5
            })

        return checklist

    @staticmethod
    def format_summary(data: Dict[str, Any]) -> str:
        """Format onboarding request summary."""
        name = data["employee_name"]
        email = data["employee_email"]
        department = data["department"]
        start_date = data["start_date"]
        role = data.get("role", "Not specified")

        summary = f"New Employee Onboarding: {name}\n"
        summary += f"Email: {email}\n"
        summary += f"Department: {department}\n"
        summary += f"Role: {role}\n"
        summary += f"Start Date: {start_date}"

        return summary

    @staticmethod
    def prepare_request_data(raw_data: Dict[str, Any]) -> Dict[str, Any]:
        """Prepare and enrich request data."""
        checklist = OnboardingWorkflow.generate_checklist(raw_data)

        return {
            **raw_data,
            "checklist": checklist,
            "workflow_type": "onboarding",
            "total_tasks": len(checklist),
            "completed_tasks": 0
        }
