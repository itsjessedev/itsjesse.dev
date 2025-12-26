"""Customer models"""

from pydantic import BaseModel, EmailStr, Field
from typing import Optional
from datetime import datetime


class CustomerBase(BaseModel):
    """Base customer model"""
    email: EmailStr
    name: str = Field(..., min_length=1, max_length=200)
    phone: str = Field(..., pattern=r'^\+?1?\d{10,15}$')
    notes: Optional[str] = None


class CustomerCreate(CustomerBase):
    """Customer creation model"""
    pass


class CustomerUpdate(BaseModel):
    """Customer update model"""
    email: Optional[EmailStr] = None
    name: Optional[str] = Field(None, min_length=1, max_length=200)
    phone: Optional[str] = Field(None, pattern=r'^\+?1?\d{10,15}$')
    notes: Optional[str] = None


class Customer(CustomerBase):
    """Full customer model"""
    id: str
    created_at: datetime
    updated_at: datetime
    total_bookings: int = 0
    total_no_shows: int = 0

    class Config:
        from_attributes = True


class CustomerWithStats(Customer):
    """Customer with statistics"""
    no_show_rate: float = 0.0
    last_booking_date: Optional[datetime] = None
