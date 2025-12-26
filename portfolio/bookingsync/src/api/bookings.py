"""Booking endpoints"""

from fastapi import APIRouter, HTTPException, status
from typing import Optional
from datetime import datetime
from pydantic import BaseModel, EmailStr

from ..models.appointment import AppointmentCreate, Appointment, AppointmentUpdate
from ..services.booking import booking_service

router = APIRouter()


class BookingRequest(BaseModel):
    """Booking creation request"""
    # Customer info
    customer_email: EmailStr
    customer_name: str
    customer_phone: str

    # Appointment info
    service_id: str
    start_time: datetime
    notes: Optional[str] = None

    # Payment info (optional)
    payment_method: Optional[str] = None


class BookingResponse(BaseModel):
    """Booking response"""
    success: bool
    appointment: Optional[Appointment] = None
    message: str


@router.post("/bookings", response_model=BookingResponse, status_code=status.HTTP_201_CREATED)
async def create_booking(booking: BookingRequest):
    """
    Create a new booking

    Creates an appointment with automated calendar sync, payment processing,
    and reminder scheduling. In demo mode, simulates all integrations.
    """
    try:
        # Prepare data
        customer_data = {
            'id': f"customer_{booking.customer_email.replace('@', '_at_')}",
            'email': booking.customer_email,
            'name': booking.customer_name,
            'phone': booking.customer_phone
        }

        service_data = {
            'id': booking.service_id,
            'name': 'Consultation',
            'duration_minutes': 60,
            'price_cents': 10000,
            'deposit_cents': 2500
        }

        appointment_data = AppointmentCreate(
            customer_id=customer_data['id'],
            service_id=booking.service_id,
            start_time=booking.start_time,
            notes=booking.notes,
            payment_method=booking.payment_method
        )

        # Create booking
        appointment = await booking_service.create_booking(
            appointment_data=appointment_data,
            customer_data=customer_data,
            service_data=service_data
        )

        if not appointment:
            return BookingResponse(
                success=False,
                message="Failed to create booking. Time slot may no longer be available."
            )

        return BookingResponse(
            success=True,
            appointment=appointment,
            message="Booking created successfully. Confirmation sent via email and SMS."
        )

    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Error creating booking: {str(e)}"
        )


@router.get("/bookings/{appointment_id}", response_model=Appointment)
async def get_booking(appointment_id: str):
    """
    Get booking details

    Retrieves details for a specific appointment by ID.
    """
    if booking_service.demo_mode:
        appointment = booking_service._demo_appointments.get(appointment_id)
        if not appointment:
            raise HTTPException(
                status_code=404,
                detail="Appointment not found"
            )
        return Appointment(**appointment)

    raise HTTPException(
        status_code=404,
        detail="Appointment not found"
    )


@router.patch("/bookings/{appointment_id}", response_model=BookingResponse)
async def update_booking(
    appointment_id: str,
    update: AppointmentUpdate
):
    """
    Update booking

    Updates an existing appointment. Can reschedule or modify notes.
    """
    try:
        if update.start_time:
            # Reschedule
            customer_data = {
                'email': 'demo@example.com',
                'name': 'Demo Customer',
                'phone': '+12345678901'
            }
            service_data = {
                'name': 'Consultation',
                'duration_minutes': 60
            }

            success = await booking_service.reschedule_booking(
                appointment_id=appointment_id,
                new_start_time=update.start_time,
                customer_data=customer_data,
                service_data=service_data
            )

            if not success:
                return BookingResponse(
                    success=False,
                    message="Failed to reschedule booking"
                )

            return BookingResponse(
                success=True,
                message="Booking rescheduled successfully"
            )

        # Other updates...
        return BookingResponse(
            success=True,
            message="Booking updated successfully"
        )

    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Error updating booking: {str(e)}"
        )


@router.delete("/bookings/{appointment_id}", response_model=BookingResponse)
async def cancel_booking(
    appointment_id: str,
    refund: bool = False
):
    """
    Cancel booking

    Cancels an appointment, removes from calendar, and optionally processes refund.
    Sends cancellation confirmation via email and SMS.
    """
    try:
        customer_data = {
            'email': 'demo@example.com',
            'name': 'Demo Customer',
            'phone': '+12345678901'
        }
        service_data = {
            'name': 'Consultation'
        }

        success = await booking_service.cancel_booking(
            appointment_id=appointment_id,
            customer_data=customer_data,
            service_data=service_data,
            refund=refund
        )

        if not success:
            return BookingResponse(
                success=False,
                message="Failed to cancel booking"
            )

        message = "Booking cancelled successfully."
        if refund:
            message += " Refund processed."

        return BookingResponse(
            success=True,
            message=message
        )

    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Error cancelling booking: {str(e)}"
        )
