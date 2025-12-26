"""Reminder models"""

from pydantic import BaseModel
from typing import Optional, Literal
from datetime import datetime
from enum import Enum


class ReminderMethod(str, Enum):
    """Reminder delivery method"""
    EMAIL = "email"
    SMS = "sms"


class ReminderStatus(str, Enum):
    """Reminder status"""
    PENDING = "pending"
    SENT = "sent"
    FAILED = "failed"
    CANCELLED = "cancelled"


class ReminderBase(BaseModel):
    """Base reminder model"""
    appointment_id: str
    method: ReminderMethod
    scheduled_for: datetime


class ReminderCreate(ReminderBase):
    """Reminder creation model"""
    pass


class Reminder(ReminderBase):
    """Full reminder model"""
    id: str
    status: ReminderStatus = ReminderStatus.PENDING
    sent_at: Optional[datetime] = None
    error_message: Optional[str] = None
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True
