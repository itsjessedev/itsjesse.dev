"""Slack bot integration using Bolt SDK."""
from typing import Optional
from slack_bolt.async_app import AsyncApp
from slack_bolt.adapter.fastapi.async_handler import AsyncSlackRequestHandler

from src.config import settings


class SlackBot:
    """Slack bot wrapper using Bolt SDK."""

    def __init__(self):
        """Initialize Slack bot."""
        if not settings.slack_configured:
            self.app = None
            self.handler = None
            return

        self.app = AsyncApp(
            token=settings.slack_bot_token,
            signing_secret=settings.slack_signing_secret
        )

        self.handler = AsyncSlackRequestHandler(self.app)
        self._register_handlers()

    def _register_handlers(self):
        """Register Slack event and command handlers."""
        if not self.app:
            return

        # Commands
        self.app.command("/pto-request")(self.handle_pto_command)
        self.app.command("/submit-expense")(self.handle_expense_command)
        self.app.command("/my-requests")(self.handle_my_requests_command)
        self.app.command("/my-approvals")(self.handle_my_approvals_command)

        # Interactive components
        self.app.action("approve_request")(self.handle_approve_action)
        self.app.action("reject_request")(self.handle_reject_action)
        self.app.view("pto_submission")(self.handle_pto_submission)
        self.app.view("expense_submission")(self.handle_expense_submission)

    async def handle_pto_command(self, ack, command, client):
        """Handle /pto-request command."""
        await ack()

        # Open modal with PTO request form
        await client.views_open(
            trigger_id=command["trigger_id"],
            view=self._get_pto_modal()
        )

    async def handle_expense_command(self, ack, command, client):
        """Handle /submit-expense command."""
        await ack()

        # Open modal with expense form
        await client.views_open(
            trigger_id=command["trigger_id"],
            view=self._get_expense_modal()
        )

    async def handle_my_requests_command(self, ack, say, command):
        """Handle /my-requests command."""
        await ack()

        user_id = command["user_id"]
        # In production, query database for user's requests
        await say(f"<@{user_id}>, showing your recent requests...")

    async def handle_my_approvals_command(self, ack, say, command):
        """Handle /my-approvals command."""
        await ack()

        user_id = command["user_id"]
        # In production, query database for pending approvals
        await say(f"<@{user_id}>, showing your pending approvals...")

    async def handle_approve_action(self, ack, body, client):
        """Handle approval button click."""
        await ack()

        # Extract request ID from action
        request_id = body["actions"][0]["value"]

        # In production: update database and notify requester
        user = body["user"]["id"]
        await client.chat_postMessage(
            channel=user,
            text=f"Request {request_id} approved!"
        )

    async def handle_reject_action(self, ack, body, client):
        """Handle rejection button click."""
        await ack()

        # Open modal for rejection reason
        request_id = body["actions"][0]["value"]

        await client.views_open(
            trigger_id=body["trigger_id"],
            view=self._get_rejection_modal(request_id)
        )

    async def handle_pto_submission(self, ack, body, view, client):
        """Handle PTO form submission."""
        await ack()

        # Extract form values
        values = view["state"]["values"]
        start_date = values["start_date"]["start_date_input"]["selected_date"]
        end_date = values["end_date"]["end_date_input"]["selected_date"]
        reason = values["reason"]["reason_input"]["value"]

        user_id = body["user"]["id"]

        # In production: create request in database, route to manager
        await client.chat_postMessage(
            channel=user_id,
            text=f"PTO request submitted for {start_date} to {end_date}. Your manager will be notified."
        )

    async def handle_expense_submission(self, ack, body, view, client):
        """Handle expense form submission."""
        await ack()

        # Extract form values
        values = view["state"]["values"]
        amount = values["amount"]["amount_input"]["value"]
        category = values["category"]["category_select"]["selected_option"]["value"]
        description = values["description"]["description_input"]["value"]

        user_id = body["user"]["id"]

        # In production: create request, upload receipt, route for approval
        await client.chat_postMessage(
            channel=user_id,
            text=f"Expense of ${amount} submitted for approval. Category: {category}"
        )

    async def send_approval_request(
        self,
        approver_id: str,
        request_id: int,
        title: str,
        description: str
    ):
        """Send approval request to approver."""
        if not self.app:
            return

        await self.app.client.chat_postMessage(
            channel=approver_id,
            text=f"New approval request: {title}",
            blocks=[
                {
                    "type": "section",
                    "text": {
                        "type": "mrkdwn",
                        "text": f"*{title}*\n{description}"
                    }
                },
                {
                    "type": "actions",
                    "elements": [
                        {
                            "type": "button",
                            "text": {"type": "plain_text", "text": "Approve"},
                            "style": "primary",
                            "action_id": "approve_request",
                            "value": str(request_id)
                        },
                        {
                            "type": "button",
                            "text": {"type": "plain_text", "text": "Reject"},
                            "style": "danger",
                            "action_id": "reject_request",
                            "value": str(request_id)
                        }
                    ]
                }
            ]
        )

    def _get_pto_modal(self):
        """Get PTO request modal definition."""
        return {
            "type": "modal",
            "callback_id": "pto_submission",
            "title": {"type": "plain_text", "text": "PTO Request"},
            "submit": {"type": "plain_text", "text": "Submit"},
            "blocks": [
                {
                    "type": "input",
                    "block_id": "start_date",
                    "element": {
                        "type": "datepicker",
                        "action_id": "start_date_input",
                        "placeholder": {"type": "plain_text", "text": "Select start date"}
                    },
                    "label": {"type": "plain_text", "text": "Start Date"}
                },
                {
                    "type": "input",
                    "block_id": "end_date",
                    "element": {
                        "type": "datepicker",
                        "action_id": "end_date_input",
                        "placeholder": {"type": "plain_text", "text": "Select end date"}
                    },
                    "label": {"type": "plain_text", "text": "End Date"}
                },
                {
                    "type": "input",
                    "block_id": "reason",
                    "element": {
                        "type": "plain_text_input",
                        "action_id": "reason_input",
                        "multiline": True,
                        "placeholder": {"type": "plain_text", "text": "Reason for time off (optional)"}
                    },
                    "label": {"type": "plain_text", "text": "Reason"},
                    "optional": True
                }
            ]
        }

    def _get_expense_modal(self):
        """Get expense request modal definition."""
        return {
            "type": "modal",
            "callback_id": "expense_submission",
            "title": {"type": "plain_text", "text": "Submit Expense"},
            "submit": {"type": "plain_text", "text": "Submit"},
            "blocks": [
                {
                    "type": "input",
                    "block_id": "amount",
                    "element": {
                        "type": "plain_text_input",
                        "action_id": "amount_input",
                        "placeholder": {"type": "plain_text", "text": "0.00"}
                    },
                    "label": {"type": "plain_text", "text": "Amount ($)"}
                },
                {
                    "type": "input",
                    "block_id": "category",
                    "element": {
                        "type": "static_select",
                        "action_id": "category_select",
                        "options": [
                            {"text": {"type": "plain_text", "text": "Travel"}, "value": "travel"},
                            {"text": {"type": "plain_text", "text": "Meals"}, "value": "meals"},
                            {"text": {"type": "plain_text", "text": "Equipment"}, "value": "equipment"},
                            {"text": {"type": "plain_text", "text": "Other"}, "value": "other"}
                        ]
                    },
                    "label": {"type": "plain_text", "text": "Category"}
                },
                {
                    "type": "input",
                    "block_id": "description",
                    "element": {
                        "type": "plain_text_input",
                        "action_id": "description_input",
                        "multiline": True
                    },
                    "label": {"type": "plain_text", "text": "Description"}
                }
            ]
        }

    def _get_rejection_modal(self, request_id: str):
        """Get rejection reason modal."""
        return {
            "type": "modal",
            "callback_id": "rejection_submission",
            "title": {"type": "plain_text", "text": "Reject Request"},
            "submit": {"type": "plain_text", "text": "Submit"},
            "private_metadata": request_id,
            "blocks": [
                {
                    "type": "input",
                    "block_id": "reason",
                    "element": {
                        "type": "plain_text_input",
                        "action_id": "reason_input",
                        "multiline": True
                    },
                    "label": {"type": "plain_text", "text": "Reason for rejection"}
                }
            ]
        }


# Global bot instance
slack_bot = SlackBot()
