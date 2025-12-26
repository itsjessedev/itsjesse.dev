"""Availability endpoints"""

from fastapi import APIRouter, HTTPException, Query
from typing import List
from datetime import datetime, timedelta
from pydantic import BaseModel

from ..services.booking import booking_service

router = APIRouter()


class TimeSlot(BaseModel):
    """Available time slot"""
    start: datetime
    end: datetime


class AvailabilityResponse(BaseModel):
    """Availability response"""
    service_id: str
    slots: List[TimeSlot]
    total_slots: int


@router.get("/availability", response_model=AvailabilityResponse)
async def get_availability(
    service_id: str = Query(..., description="Service ID"),
    start_date: datetime = Query(
        default=None,
        description="Start date (defaults to today)"
    ),
    days_ahead: int = Query(
        default=7,
        ge=1,
        le=30,
        description="Number of days to check (1-30)"
    )
):
    """
    Get available time slots for a service

    Returns available booking slots for the specified service and date range.
    In demo mode, returns mock availability (Mon-Fri, 9 AM - 5 PM).
    """
    if start_date is None:
        start_date = datetime.now()

    try:
        slots = await booking_service.get_availability(
            service_id=service_id,
            start_date=start_date,
            days_ahead=days_ahead
        )

        time_slots = [
            TimeSlot(start=slot['start'], end=slot['end'])
            for slot in slots
        ]

        return AvailabilityResponse(
            service_id=service_id,
            slots=time_slots,
            total_slots=len(time_slots)
        )

    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Error fetching availability: {str(e)}"
        )
