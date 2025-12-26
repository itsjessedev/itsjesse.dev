"""Booking service - core business logic"""

from datetime import datetime, timedelta
from typing import List, Dict, Optional
import logging
from uuid import uuid4

from ..config import settings
from ..models.appointment import AppointmentCreate, Appointment, AppointmentStatus
from .calendar import calendar_service
from .twilio_sms import twilio_service
from .email_sender import email_service
from .stripe_payments import stripe_service

logger = logging.getLogger(__name__)


class BookingService:
    """Core booking logic"""

    def __init__(self):
        self.demo_mode = settings.demo_mode
        # In-memory storage for demo mode
        self._demo_appointments: Dict[str, dict] = {}
        self._demo_customers: Dict[str, dict] = {}
        self._demo_services: Dict[str, dict] = {
            'service_1': {
                'id': 'service_1',
                'name': 'Consultation',
                'duration_minutes': 60,
                'price_cents': 10000,
                'deposit_cents': 2500
            }
        }

    async def get_availability(
        self,
        service_id: str,
        start_date: datetime,
        days_ahead: int = 7
    ) -> List[Dict[str, datetime]]:
        """Get available time slots for a service"""
        # Get service details
        service = self._demo_services.get(service_id) if self.demo_mode else None
        if not service:
            logger.error(f"Service not found: {service_id}")
            return []

        duration_minutes = service['duration_minutes']
        end_date = start_date + timedelta(days=days_ahead)

        # Get availability from calendar
        slots = await calendar_service.get_availability(
            start_date, end_date, duration_minutes
        )

        # Filter out slots too soon (min booking notice)
        min_notice = timedelta(hours=settings.min_booking_notice_hours)
        now = datetime.now()

        available_slots = [
            slot for slot in slots
            if slot['start'] >= now + min_notice
        ]

        return available_slots

    async def create_booking(
        self,
        appointment_data: AppointmentCreate,
        customer_data: dict,
        service_data: dict
    ) -> Optional[Appointment]:
        """Create a new booking"""
        # Validate time slot is available
        slots = await self.get_availability(
            appointment_data.service_id,
            appointment_data.start_time,
            days_ahead=1
        )

        is_available = any(
            slot['start'] == appointment_data.start_time
            for slot in slots
        )

        if not is_available:
            logger.error("Time slot not available")
            return None

        # Calculate end time
        end_time = appointment_data.start_time + timedelta(
            minutes=service_data['duration_minutes']
        )

        # Create appointment
        appointment_id = str(uuid4())
        appointment = {
            'id': appointment_id,
            'customer_id': customer_data['id'],
            'service_id': appointment_data.service_id,
            'start_time': appointment_data.start_time,
            'end_time': end_time,
            'notes': appointment_data.notes,
            'status': AppointmentStatus.PENDING,
            'created_at': datetime.now(),
            'updated_at': datetime.now(),
            'payment_status': 'unpaid',
            'google_calendar_event_id': None
        }

        # Process payment if required
        if appointment_data.payment_method and service_data.get('deposit_cents', 0) > 0:
            payment_intent_id = await stripe_service.create_deposit_payment(
                deposit_cents=service_data['deposit_cents'],
                total_cents=service_data['price_cents'],
                customer_email=customer_data['email'],
                appointment_id=appointment_id
            )

            if payment_intent_id:
                appointment['payment_intent_id'] = payment_intent_id
                appointment['payment_status'] = 'deposit_paid'

        # Create calendar event
        calendar_event_id = await calendar_service.create_event(
            title=f"{service_data['name']} - {customer_data['name']}",
            start_time=appointment_data.start_time,
            end_time=end_time,
            description=appointment_data.notes or '',
            attendees=[customer_data['email']]
        )

        if calendar_event_id:
            appointment['google_calendar_event_id'] = calendar_event_id

        # Store appointment (demo mode)
        if self.demo_mode:
            self._demo_appointments[appointment_id] = appointment

        # Send confirmation
        await self._send_confirmation(appointment, customer_data, service_data)

        # Schedule reminders
        await self._schedule_reminders(appointment, customer_data, service_data)

        # Convert to Appointment model
        return Appointment(**appointment)

    async def cancel_booking(
        self,
        appointment_id: str,
        customer_data: dict,
        service_data: dict,
        refund: bool = False
    ) -> bool:
        """Cancel a booking"""
        appointment = self._demo_appointments.get(appointment_id) if self.demo_mode else None

        if not appointment:
            logger.error(f"Appointment not found: {appointment_id}")
            return False

        # Update status
        appointment['status'] = AppointmentStatus.CANCELLED
        appointment['cancelled_at'] = datetime.now()
        appointment['updated_at'] = datetime.now()

        # Delete calendar event
        if appointment.get('google_calendar_event_id'):
            await calendar_service.delete_event(
                appointment['google_calendar_event_id']
            )

        # Process refund if requested
        if refund and appointment.get('payment_intent_id'):
            await stripe_service.refund_payment(
                appointment['payment_intent_id']
            )

        # Send cancellation notification
        await self._send_cancellation(appointment, customer_data, service_data)

        return True

    async def reschedule_booking(
        self,
        appointment_id: str,
        new_start_time: datetime,
        customer_data: dict,
        service_data: dict
    ) -> bool:
        """Reschedule a booking"""
        appointment = self._demo_appointments.get(appointment_id) if self.demo_mode else None

        if not appointment:
            logger.error(f"Appointment not found: {appointment_id}")
            return False

        # Validate new time slot
        slots = await self.get_availability(
            appointment['service_id'],
            new_start_time,
            days_ahead=1
        )

        is_available = any(
            slot['start'] == new_start_time
            for slot in slots
        )

        if not is_available:
            logger.error("New time slot not available")
            return False

        # Update appointment
        new_end_time = new_start_time + timedelta(
            minutes=service_data['duration_minutes']
        )

        appointment['start_time'] = new_start_time
        appointment['end_time'] = new_end_time
        appointment['updated_at'] = datetime.now()

        # Update calendar event
        if appointment.get('google_calendar_event_id'):
            await calendar_service.update_event(
                appointment['google_calendar_event_id'],
                start_time=new_start_time,
                end_time=new_end_time
            )

        # Reschedule reminders
        await self._schedule_reminders(appointment, customer_data, service_data)

        return True

    async def _send_confirmation(
        self,
        appointment: dict,
        customer: dict,
        service: dict
    ):
        """Send booking confirmation"""
        # Email
        await email_service.send_confirmation(
            to_email=customer['email'],
            customer_name=customer['name'],
            appointment_time=appointment['start_time'],
            service_name=service['name']
        )

        # SMS
        await twilio_service.send_confirmation(
            to_number=customer['phone'],
            appointment_time=appointment['start_time'].strftime('%A, %B %d at %I:%M %p'),
            service_name=service['name']
        )

    async def _send_cancellation(
        self,
        appointment: dict,
        customer: dict,
        service: dict
    ):
        """Send cancellation notification"""
        # Email
        await email_service.send_cancellation(
            to_email=customer['email'],
            customer_name=customer['name'],
            appointment_time=appointment['start_time'],
            service_name=service['name']
        )

        # SMS
        await twilio_service.send_cancellation(
            to_number=customer['phone'],
            appointment_time=appointment['start_time'].strftime('%A, %B %d at %I:%M %p'),
            service_name=service['name']
        )

    async def _schedule_reminders(
        self,
        appointment: dict,
        customer: dict,
        service: dict
    ):
        """Schedule reminders for appointment"""
        for reminder in settings.reminder_schedule:
            reminder_time = appointment['start_time'] - timedelta(
                hours=reminder['hours_before']
            )

            # Only schedule future reminders
            if reminder_time > datetime.now():
                logger.info(
                    f"[DEMO] Would schedule {reminder['methods']} reminder "
                    f"for {reminder_time}"
                )


# Singleton instance
booking_service = BookingService()
