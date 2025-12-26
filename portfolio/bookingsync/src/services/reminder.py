"""Reminder service - scheduled reminder jobs"""

from datetime import datetime
from typing import List
import logging

from ..models.reminder import Reminder, ReminderMethod, ReminderStatus
from .twilio_sms import twilio_service
from .email_sender import email_service

logger = logging.getLogger(__name__)


class ReminderService:
    """Reminder scheduling and delivery"""

    async def send_reminder(
        self,
        reminder: Reminder,
        appointment_data: dict,
        customer_data: dict,
        service_data: dict
    ) -> bool:
        """Send a reminder"""
        try:
            if reminder.method == ReminderMethod.EMAIL:
                success = await email_service.send_reminder(
                    to_email=customer_data['email'],
                    customer_name=customer_data['name'],
                    appointment_time=appointment_data['start_time'],
                    service_name=service_data['name']
                )

            elif reminder.method == ReminderMethod.SMS:
                success = await twilio_service.send_reminder(
                    to_number=customer_data['phone'],
                    appointment_time=appointment_data['start_time'].strftime(
                        '%A, %B %d at %I:%M %p'
                    ),
                    service_name=service_data['name']
                )

            else:
                logger.error(f"Unknown reminder method: {reminder.method}")
                return False

            if success:
                reminder.status = ReminderStatus.SENT
                reminder.sent_at = datetime.now()
            else:
                reminder.status = ReminderStatus.FAILED
                reminder.error_message = "Failed to send"

            return success

        except Exception as e:
            logger.error(f"Error sending reminder: {e}")
            reminder.status = ReminderStatus.FAILED
            reminder.error_message = str(e)
            return False

    async def process_pending_reminders(self, reminders: List[Reminder]):
        """Process all pending reminders"""
        for reminder in reminders:
            if reminder.status == ReminderStatus.PENDING:
                if reminder.scheduled_for <= datetime.now():
                    # Fetch appointment, customer, and service data
                    # Then send reminder
                    logger.info(f"Processing reminder {reminder.id}")


# Singleton instance
reminder_service = ReminderService()
