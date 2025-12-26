"""Appointment models"""

from pydantic import BaseModel, Field
from typing import Optional
from datetime import datetime
from enum import Enum


class AppointmentStatus(str, Enum):
    """Appointment status"""
    PENDING = "pending"
    CONFIRMED = "confirmed"
    CANCELLED = "cancelled"
    COMPLETED = "completed"
    NO_SHOW = "no_show"


class AppointmentBase(BaseModel):
    """Base appointment model"""
    customer_id: str
    service_id: str
    start_time: datetime
    notes: Optional[str] = None


class AppointmentCreate(AppointmentBase):
    """Appointment creation model"""
    payment_method: Optional[str] = None  # For deposit/full payment


class AppointmentUpdate(BaseModel):
    """Appointment update model"""
    start_time: Optional[datetime] = None
    notes: Optional[str] = None
    status: Optional[AppointmentStatus] = None


class Appointment(AppointmentBase):
    """Full appointment model"""
    id: str
    status: AppointmentStatus = AppointmentStatus.PENDING
    end_time: datetime
    created_at: datetime
    updated_at: datetime
    confirmed_at: Optional[datetime] = None
    cancelled_at: Optional[datetime] = None
    completed_at: Optional[datetime] = None

    # Payment info
    payment_status: str = "unpaid"  # unpaid, deposit_paid, paid
    payment_intent_id: Optional[str] = None

    # Calendar sync
    google_calendar_event_id: Optional[str] = None

    class Config:
        from_attributes = True


class AppointmentWithDetails(Appointment):
    """Appointment with customer and service details"""
    customer_name: str
    customer_email: str
    customer_phone: str
    service_name: str
    service_duration_minutes: int
    service_price_cents: int
