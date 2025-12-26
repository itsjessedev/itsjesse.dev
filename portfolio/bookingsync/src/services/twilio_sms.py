"""Twilio SMS service"""

from typing import Optional
import logging

from ..config import settings

logger = logging.getLogger(__name__)


class TwilioSMSService:
    """Twilio SMS integration"""

    def __init__(self):
        self.demo_mode = settings.demo_mode
        self.from_number = settings.twilio_phone_number

        if not self.demo_mode:
            try:
                from twilio.rest import Client
                self.client = Client(
                    settings.twilio_account_sid,
                    settings.twilio_auth_token
                )
            except Exception as e:
                logger.error(f"Failed to initialize Twilio: {e}")
                self.demo_mode = True

    async def send_sms(
        self,
        to_number: str,
        message: str
    ) -> bool:
        """Send SMS message"""
        if self.demo_mode:
            logger.info(f"[DEMO] Would send SMS to {to_number}: {message}")
            return True

        try:
            message = self.client.messages.create(
                body=message,
                from_=self.from_number,
                to=to_number
            )

            logger.info(f"SMS sent successfully. SID: {message.sid}")
            return True

        except Exception as e:
            logger.error(f"Error sending SMS: {e}")
            return False

    async def send_reminder(
        self,
        to_number: str,
        appointment_time: str,
        service_name: str,
        business_name: Optional[str] = None
    ) -> bool:
        """Send appointment reminder SMS"""
        business = business_name or settings.business_name

        message = (
            f"Reminder: You have a {service_name} appointment "
            f"scheduled for {appointment_time} with {business}. "
            f"Reply CONFIRM to confirm or CANCEL to cancel."
        )

        return await self.send_sms(to_number, message)

    async def send_confirmation(
        self,
        to_number: str,
        appointment_time: str,
        service_name: str,
        business_name: Optional[str] = None
    ) -> bool:
        """Send booking confirmation SMS"""
        business = business_name or settings.business_name

        message = (
            f"Your {service_name} appointment with {business} "
            f"is confirmed for {appointment_time}. "
            f"We'll send you a reminder 24 hours before."
        )

        return await self.send_sms(to_number, message)

    async def send_cancellation(
        self,
        to_number: str,
        appointment_time: str,
        service_name: str,
        business_name: Optional[str] = None
    ) -> bool:
        """Send cancellation confirmation SMS"""
        business = business_name or settings.business_name

        message = (
            f"Your {service_name} appointment with {business} "
            f"scheduled for {appointment_time} has been cancelled. "
            f"Visit our website to rebook."
        )

        return await self.send_sms(to_number, message)


# Singleton instance
twilio_service = TwilioSMSService()
