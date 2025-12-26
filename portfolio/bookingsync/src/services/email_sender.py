"""Email service"""

from typing import Optional, List
import logging
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from datetime import datetime

from ..config import settings

logger = logging.getLogger(__name__)


class EmailService:
    """Email sending service"""

    def __init__(self):
        self.demo_mode = settings.demo_mode
        self.from_email = settings.smtp_from_email
        self.from_name = settings.smtp_from_name

        if not self.demo_mode:
            try:
                import aiosmtplib
                self.smtp = aiosmtplib
            except Exception as e:
                logger.error(f"Failed to initialize email service: {e}")
                self.demo_mode = True

    async def send_email(
        self,
        to_email: str,
        subject: str,
        body_html: str,
        body_text: Optional[str] = None
    ) -> bool:
        """Send email"""
        if self.demo_mode:
            logger.info(f"[DEMO] Would send email to {to_email}: {subject}")
            return True

        try:
            message = MIMEMultipart('alternative')
            message['Subject'] = subject
            message['From'] = f"{self.from_name} <{self.from_email}>"
            message['To'] = to_email

            # Add plain text version
            if body_text:
                part1 = MIMEText(body_text, 'plain')
                message.attach(part1)

            # Add HTML version
            part2 = MIMEText(body_html, 'html')
            message.attach(part2)

            # Send via SMTP
            await self.smtp.send(
                message,
                hostname=settings.smtp_host,
                port=settings.smtp_port,
                username=settings.smtp_username,
                password=settings.smtp_password,
                use_tls=True
            )

            logger.info(f"Email sent successfully to {to_email}")
            return True

        except Exception as e:
            logger.error(f"Error sending email: {e}")
            return False

    async def send_reminder(
        self,
        to_email: str,
        customer_name: str,
        appointment_time: datetime,
        service_name: str,
        business_name: Optional[str] = None
    ) -> bool:
        """Send appointment reminder email"""
        business = business_name or settings.business_name
        time_str = appointment_time.strftime('%A, %B %d, %Y at %I:%M %p')

        subject = f"Reminder: Your {service_name} appointment with {business}"

        html = f"""
        <html>
          <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
            <h2>Appointment Reminder</h2>
            <p>Hi {customer_name},</p>
            <p>This is a reminder about your upcoming appointment:</p>
            <div style="background-color: #f4f4f4; padding: 15px; margin: 20px 0; border-left: 4px solid #007bff;">
              <p style="margin: 0;"><strong>Service:</strong> {service_name}</p>
              <p style="margin: 0;"><strong>Date & Time:</strong> {time_str}</p>
              <p style="margin: 0;"><strong>Business:</strong> {business}</p>
            </div>
            <p>If you need to reschedule or cancel, please contact us as soon as possible.</p>
            <p>We look forward to seeing you!</p>
            <p>Best regards,<br>{business}</p>
          </body>
        </html>
        """

        text = f"""
        Appointment Reminder

        Hi {customer_name},

        This is a reminder about your upcoming appointment:

        Service: {service_name}
        Date & Time: {time_str}
        Business: {business}

        If you need to reschedule or cancel, please contact us as soon as possible.

        We look forward to seeing you!

        Best regards,
        {business}
        """

        return await self.send_email(to_email, subject, html, text)

    async def send_confirmation(
        self,
        to_email: str,
        customer_name: str,
        appointment_time: datetime,
        service_name: str,
        business_name: Optional[str] = None
    ) -> bool:
        """Send booking confirmation email"""
        business = business_name or settings.business_name
        time_str = appointment_time.strftime('%A, %B %d, %Y at %I:%M %p')

        subject = f"Booking Confirmed: {service_name} with {business}"

        html = f"""
        <html>
          <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
            <h2>Booking Confirmation</h2>
            <p>Hi {customer_name},</p>
            <p>Your appointment has been successfully booked!</p>
            <div style="background-color: #f4f4f4; padding: 15px; margin: 20px 0; border-left: 4px solid #28a745;">
              <p style="margin: 0;"><strong>Service:</strong> {service_name}</p>
              <p style="margin: 0;"><strong>Date & Time:</strong> {time_str}</p>
              <p style="margin: 0;"><strong>Business:</strong> {business}</p>
            </div>
            <p>We'll send you a reminder 24 hours before your appointment.</p>
            <p>If you need to reschedule or cancel, please contact us as soon as possible.</p>
            <p>Best regards,<br>{business}</p>
          </body>
        </html>
        """

        text = f"""
        Booking Confirmation

        Hi {customer_name},

        Your appointment has been successfully booked!

        Service: {service_name}
        Date & Time: {time_str}
        Business: {business}

        We'll send you a reminder 24 hours before your appointment.

        If you need to reschedule or cancel, please contact us as soon as possible.

        Best regards,
        {business}
        """

        return await self.send_email(to_email, subject, html, text)

    async def send_cancellation(
        self,
        to_email: str,
        customer_name: str,
        appointment_time: datetime,
        service_name: str,
        business_name: Optional[str] = None
    ) -> bool:
        """Send cancellation confirmation email"""
        business = business_name or settings.business_name
        time_str = appointment_time.strftime('%A, %B %d, %Y at %I:%M %p')

        subject = f"Appointment Cancelled: {service_name}"

        html = f"""
        <html>
          <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
            <h2>Appointment Cancelled</h2>
            <p>Hi {customer_name},</p>
            <p>Your appointment has been cancelled:</p>
            <div style="background-color: #f4f4f4; padding: 15px; margin: 20px 0; border-left: 4px solid #dc3545;">
              <p style="margin: 0;"><strong>Service:</strong> {service_name}</p>
              <p style="margin: 0;"><strong>Date & Time:</strong> {time_str}</p>
              <p style="margin: 0;"><strong>Business:</strong> {business}</p>
            </div>
            <p>If you'd like to rebook, please visit our website or contact us.</p>
            <p>Best regards,<br>{business}</p>
          </body>
        </html>
        """

        text = f"""
        Appointment Cancelled

        Hi {customer_name},

        Your appointment has been cancelled:

        Service: {service_name}
        Date & Time: {time_str}
        Business: {business}

        If you'd like to rebook, please visit our website or contact us.

        Best regards,
        {business}
        """

        return await self.send_email(to_email, subject, html, text)


# Singleton instance
email_service = EmailService()
