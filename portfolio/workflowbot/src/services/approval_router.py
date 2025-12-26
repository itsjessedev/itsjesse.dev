"""Approval routing logic."""
from typing import List, Dict, Any


class ApprovalRouter:
    """Service for routing approvals to appropriate approvers."""

    def __init__(self):
        """Initialize approval router."""
        self.routing_rules = {
            "pto": self._route_pto,
            "expense": self._route_expense,
            "onboarding": self._route_onboarding,
        }

    def route(
        self,
        workflow_type: str,
        request_data: Dict[str, Any],
        requester_id: str
    ) -> List[Dict[str, str]]:
        """
        Route request to appropriate approvers.

        Args:
            workflow_type: Type of workflow
            request_data: Request data
            requester_id: Requester user ID

        Returns:
            List of approvers with id, name, email
        """
        handler = self.routing_rules.get(workflow_type)
        if not handler:
            raise ValueError(f"Unknown workflow type: {workflow_type}")

        return handler(request_data, requester_id)

    def _route_pto(
        self,
        request_data: Dict[str, Any],
        requester_id: str
    ) -> List[Dict[str, str]]:
        """Route PTO requests."""
        days = request_data.get("days", 0)

        # Simple routing: manager for short requests, manager + HR for long
        manager = self._get_manager(requester_id)
        approvers = [manager]

        if days > 3:
            # Long PTO requires HR approval too
            hr = self._get_hr_approver()
            approvers.append(hr)

        return approvers

    def _route_expense(
        self,
        request_data: Dict[str, Any],
        requester_id: str
    ) -> List[Dict[str, str]]:
        """Route expense requests."""
        amount = request_data.get("amount", 0)

        # Simple routing: manager for small, manager + finance for large
        manager = self._get_manager(requester_id)
        approvers = [manager]

        if amount >= 500:
            # Large expenses require finance approval
            finance = self._get_finance_approver()
            approvers.append(finance)

        return approvers

    def _route_onboarding(
        self,
        request_data: Dict[str, Any],
        requester_id: str
    ) -> List[Dict[str, str]]:
        """Route onboarding requests."""
        # Onboarding typically goes to IT and HR
        return [
            self._get_it_approver(),
            self._get_hr_approver()
        ]

    def _get_manager(self, user_id: str) -> Dict[str, str]:
        """Get user's manager. In demo, returns mock manager."""
        # In production, this would query an employee directory
        return {
            "id": "MGR001",
            "name": "Sarah Johnson",
            "email": "sarah.johnson@company.com"
        }

    def _get_hr_approver(self) -> Dict[str, str]:
        """Get HR approver."""
        return {
            "id": "HR001",
            "name": "Michael Chen",
            "email": "michael.chen@company.com"
        }

    def _get_finance_approver(self) -> Dict[str, str]:
        """Get finance approver."""
        return {
            "id": "FIN001",
            "name": "Lisa Rodriguez",
            "email": "lisa.rodriguez@company.com"
        }

    def _get_it_approver(self) -> Dict[str, str]:
        """Get IT approver."""
        return {
            "id": "IT001",
            "name": "David Park",
            "email": "david.park@company.com"
        }
