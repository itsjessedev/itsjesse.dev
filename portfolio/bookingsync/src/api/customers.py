"""Customer endpoints"""

from fastapi import APIRouter, HTTPException, Query
from typing import List
from pydantic import BaseModel

from ..models.customer import Customer, CustomerCreate, CustomerWithStats
from ..models.appointment import Appointment

router = APIRouter()


@router.get("/customers", response_model=List[Customer])
async def list_customers(
    skip: int = Query(default=0, ge=0),
    limit: int = Query(default=50, ge=1, le=100)
):
    """
    List customers

    Returns a paginated list of customers with their booking statistics.
    """
    # Demo data
    return []


@router.post("/customers", response_model=Customer)
async def create_customer(customer: CustomerCreate):
    """
    Create customer

    Creates a new customer record.
    """
    # Demo implementation
    return Customer(
        id=f"customer_{customer.email.replace('@', '_at_')}",
        email=customer.email,
        name=customer.name,
        phone=customer.phone,
        notes=customer.notes,
        created_at="2024-01-01T00:00:00Z",
        updated_at="2024-01-01T00:00:00Z",
        total_bookings=0,
        total_no_shows=0
    )


@router.get("/customers/{customer_id}", response_model=CustomerWithStats)
async def get_customer(customer_id: str):
    """
    Get customer details

    Returns detailed customer information including statistics.
    """
    raise HTTPException(
        status_code=404,
        detail="Customer not found"
    )


@router.get("/customers/{customer_id}/bookings", response_model=List[Appointment])
async def get_customer_bookings(
    customer_id: str,
    skip: int = Query(default=0, ge=0),
    limit: int = Query(default=50, ge=1, le=100)
):
    """
    Get customer booking history

    Returns all appointments for a specific customer.
    """
    return []
