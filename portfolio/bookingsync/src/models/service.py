"""Service models"""

from pydantic import BaseModel, Field
from typing import Optional
from datetime import datetime


class ServiceBase(BaseModel):
    """Base service model"""
    name: str = Field(..., min_length=1, max_length=200)
    description: Optional[str] = None
    duration_minutes: int = Field(..., gt=0, le=480)  # Max 8 hours
    price_cents: int = Field(..., ge=0)
    deposit_cents: int = Field(default=0, ge=0)
    buffer_minutes: int = Field(default=15, ge=0)
    is_active: bool = True


class ServiceCreate(ServiceBase):
    """Service creation model"""
    pass


class ServiceUpdate(BaseModel):
    """Service update model"""
    name: Optional[str] = Field(None, min_length=1, max_length=200)
    description: Optional[str] = None
    duration_minutes: Optional[int] = Field(None, gt=0, le=480)
    price_cents: Optional[int] = Field(None, ge=0)
    deposit_cents: Optional[int] = Field(None, ge=0)
    buffer_minutes: Optional[int] = Field(None, ge=0)
    is_active: Optional[bool] = None


class Service(ServiceBase):
    """Full service model"""
    id: str
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True

    @property
    def price_display(self) -> str:
        """Format price for display"""
        dollars = self.price_cents / 100
        return f"${dollars:.2f}"

    @property
    def deposit_display(self) -> str:
        """Format deposit for display"""
        dollars = self.deposit_cents / 100
        return f"${dollars:.2f}"
