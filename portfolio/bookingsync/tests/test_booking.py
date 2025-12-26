"""Booking service tests"""

import pytest
from datetime import datetime, timedelta
from httpx import AsyncClient

from src.main import app


@pytest.mark.asyncio
async def test_health_check():
    """Test health check endpoint"""
    async with AsyncClient(app=app, base_url="http://test") as client:
        response = await client.get("/health")
        assert response.status_code == 200
        assert response.json()["status"] == "healthy"


@pytest.mark.asyncio
async def test_get_availability():
    """Test availability endpoint"""
    async with AsyncClient(app=app, base_url="http://test") as client:
        response = await client.get(
            "/api/availability",
            params={
                "service_id": "service_1",
                "days_ahead": 7
            }
        )
        assert response.status_code == 200
        data = response.json()
        assert "slots" in data
        assert data["service_id"] == "service_1"
        assert data["total_slots"] > 0


@pytest.mark.asyncio
async def test_create_booking():
    """Test booking creation"""
    async with AsyncClient(app=app, base_url="http://test") as client:
        # First get available slots
        availability_response = await client.get(
            "/api/availability",
            params={
                "service_id": "service_1",
                "days_ahead": 7
            }
        )
        slots = availability_response.json()["slots"]
        assert len(slots) > 0

        # Book the first available slot
        first_slot = slots[0]
        booking_data = {
            "customer_email": "test@example.com",
            "customer_name": "Test Customer",
            "customer_phone": "+12345678901",
            "service_id": "service_1",
            "start_time": first_slot["start"],
            "notes": "Test booking"
        }

        response = await client.post("/api/bookings", json=booking_data)
        assert response.status_code == 201
        data = response.json()
        assert data["success"] is True
        assert data["appointment"] is not None
        assert data["appointment"]["customer_id"] is not None


@pytest.mark.asyncio
async def test_get_booking():
    """Test getting booking details"""
    async with AsyncClient(app=app, base_url="http://test") as client:
        # Create a booking first
        availability_response = await client.get(
            "/api/availability",
            params={"service_id": "service_1", "days_ahead": 7}
        )
        slots = availability_response.json()["slots"]

        booking_data = {
            "customer_email": "test@example.com",
            "customer_name": "Test Customer",
            "customer_phone": "+12345678901",
            "service_id": "service_1",
            "start_time": slots[0]["start"],
        }

        create_response = await client.post("/api/bookings", json=booking_data)
        appointment_id = create_response.json()["appointment"]["id"]

        # Get the booking
        response = await client.get(f"/api/bookings/{appointment_id}")
        assert response.status_code == 200
        data = response.json()
        assert data["id"] == appointment_id


@pytest.mark.asyncio
async def test_cancel_booking():
    """Test booking cancellation"""
    async with AsyncClient(app=app, base_url="http://test") as client:
        # Create a booking first
        availability_response = await client.get(
            "/api/availability",
            params={"service_id": "service_1", "days_ahead": 7}
        )
        slots = availability_response.json()["slots"]

        booking_data = {
            "customer_email": "test@example.com",
            "customer_name": "Test Customer",
            "customer_phone": "+12345678901",
            "service_id": "service_1",
            "start_time": slots[0]["start"],
        }

        create_response = await client.post("/api/bookings", json=booking_data)
        appointment_id = create_response.json()["appointment"]["id"]

        # Cancel the booking
        response = await client.delete(f"/api/bookings/{appointment_id}")
        assert response.status_code == 200
        data = response.json()
        assert data["success"] is True


@pytest.mark.asyncio
async def test_create_customer():
    """Test customer creation"""
    async with AsyncClient(app=app, base_url="http://test") as client:
        customer_data = {
            "email": "newcustomer@example.com",
            "name": "New Customer",
            "phone": "+19876543210",
            "notes": "VIP customer"
        }

        response = await client.post("/api/customers", json=customer_data)
        assert response.status_code == 200
        data = response.json()
        assert data["email"] == customer_data["email"]
        assert data["name"] == customer_data["name"]
        assert data["total_bookings"] == 0
