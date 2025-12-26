# BookingSync API Examples

This document provides example API calls for testing and demonstrating the BookingSync system.

## Base URL

When running locally in demo mode:
```
http://localhost:8000
```

## Interactive Documentation

FastAPI provides automatic interactive API documentation:
- **Swagger UI**: http://localhost:8000/docs
- **ReDoc**: http://localhost:8000/redoc

## API Endpoints

### 1. Health Check

```bash
curl http://localhost:8000/health
```

Response:
```json
{
  "status": "healthy",
  "demo_mode": true,
  "timestamp": "2024-01-01T00:00:00Z"
}
```

### 2. Get Availability

Check available time slots for a service:

```bash
curl -X GET "http://localhost:8000/api/availability?service_id=service_1&days_ahead=7"
```

Response:
```json
{
  "service_id": "service_1",
  "slots": [
    {
      "start": "2024-01-02T09:00:00",
      "end": "2024-01-02T10:00:00"
    },
    {
      "start": "2024-01-02T09:30:00",
      "end": "2024-01-02T10:30:00"
    }
  ],
  "total_slots": 20
}
```

### 3. Create Booking

Book an appointment:

```bash
curl -X POST "http://localhost:8000/api/bookings" \
  -H "Content-Type: application/json" \
  -d '{
    "customer_email": "john.doe@example.com",
    "customer_name": "John Doe",
    "customer_phone": "+12345678901",
    "service_id": "service_1",
    "start_time": "2024-01-02T09:00:00",
    "notes": "First time customer"
  }'
```

Response:
```json
{
  "success": true,
  "appointment": {
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "customer_id": "customer_john.doe_at_example.com",
    "service_id": "service_1",
    "start_time": "2024-01-02T09:00:00",
    "end_time": "2024-01-02T10:00:00",
    "status": "pending",
    "notes": "First time customer",
    "payment_status": "unpaid",
    "created_at": "2024-01-01T12:00:00Z",
    "updated_at": "2024-01-01T12:00:00Z"
  },
  "message": "Booking created successfully. Confirmation sent via email and SMS."
}
```

### 4. Get Booking Details

Retrieve booking information:

```bash
curl -X GET "http://localhost:8000/api/bookings/550e8400-e29b-41d4-a716-446655440000"
```

Response:
```json
{
  "id": "550e8400-e29b-41d4-a716-446655440000",
  "customer_id": "customer_john.doe_at_example.com",
  "service_id": "service_1",
  "start_time": "2024-01-02T09:00:00",
  "end_time": "2024-01-02T10:00:00",
  "status": "pending",
  "notes": "First time customer",
  "payment_status": "unpaid",
  "created_at": "2024-01-01T12:00:00Z",
  "updated_at": "2024-01-01T12:00:00Z"
}
```

### 5. Reschedule Booking

Update appointment time:

```bash
curl -X PATCH "http://localhost:8000/api/bookings/550e8400-e29b-41d4-a716-446655440000" \
  -H "Content-Type: application/json" \
  -d '{
    "start_time": "2024-01-03T14:00:00"
  }'
```

Response:
```json
{
  "success": true,
  "message": "Booking rescheduled successfully"
}
```

### 6. Cancel Booking

Cancel an appointment:

```bash
curl -X DELETE "http://localhost:8000/api/bookings/550e8400-e29b-41d4-a716-446655440000?refund=false"
```

Response:
```json
{
  "success": true,
  "message": "Booking cancelled successfully."
}
```

### 7. Create Customer

Add a new customer:

```bash
curl -X POST "http://localhost:8000/api/customers" \
  -H "Content-Type: application/json" \
  -d '{
    "email": "jane.smith@example.com",
    "name": "Jane Smith",
    "phone": "+19876543210",
    "notes": "Prefers morning appointments"
  }'
```

Response:
```json
{
  "id": "customer_jane.smith_at_example.com",
  "email": "jane.smith@example.com",
  "name": "Jane Smith",
  "phone": "+19876543210",
  "notes": "Prefers morning appointments",
  "created_at": "2024-01-01T00:00:00Z",
  "updated_at": "2024-01-01T00:00:00Z",
  "total_bookings": 0,
  "total_no_shows": 0
}
```

## Python Examples

### Using `requests` library

```python
import requests
from datetime import datetime, timedelta

BASE_URL = "http://localhost:8000"

# 1. Check availability
response = requests.get(
    f"{BASE_URL}/api/availability",
    params={
        "service_id": "service_1",
        "days_ahead": 7
    }
)
availability = response.json()
print(f"Found {availability['total_slots']} available slots")

# 2. Book first available slot
if availability['slots']:
    first_slot = availability['slots'][0]

    booking_data = {
        "customer_email": "test@example.com",
        "customer_name": "Test Customer",
        "customer_phone": "+12345678901",
        "service_id": "service_1",
        "start_time": first_slot['start'],
        "notes": "Automated booking test"
    }

    response = requests.post(
        f"{BASE_URL}/api/bookings",
        json=booking_data
    )

    result = response.json()
    if result['success']:
        appointment_id = result['appointment']['id']
        print(f"Booking created: {appointment_id}")
    else:
        print(f"Booking failed: {result['message']}")

# 3. Get booking details
response = requests.get(f"{BASE_URL}/api/bookings/{appointment_id}")
booking = response.json()
print(f"Booking status: {booking['status']}")

# 4. Cancel booking
response = requests.delete(
    f"{BASE_URL}/api/bookings/{appointment_id}",
    params={"refund": False}
)
result = response.json()
print(result['message'])
```

### Using `httpx` (async)

```python
import httpx
import asyncio

async def test_booking_flow():
    BASE_URL = "http://localhost:8000"

    async with httpx.AsyncClient() as client:
        # Get availability
        response = await client.get(
            f"{BASE_URL}/api/availability",
            params={"service_id": "service_1", "days_ahead": 7}
        )
        slots = response.json()['slots']

        # Create booking
        booking_data = {
            "customer_email": "async@example.com",
            "customer_name": "Async Customer",
            "customer_phone": "+12345678901",
            "service_id": "service_1",
            "start_time": slots[0]['start']
        }

        response = await client.post(
            f"{BASE_URL}/api/bookings",
            json=booking_data
        )

        result = response.json()
        print(f"Success: {result['success']}")

        return result['appointment']['id']

# Run async function
appointment_id = asyncio.run(test_booking_flow())
```

## JavaScript/TypeScript Examples

### Using `fetch` API

```javascript
const BASE_URL = 'http://localhost:8000';

// Get availability
async function getAvailability(serviceId, daysAhead = 7) {
  const response = await fetch(
    `${BASE_URL}/api/availability?service_id=${serviceId}&days_ahead=${daysAhead}`
  );
  return await response.json();
}

// Create booking
async function createBooking(bookingData) {
  const response = await fetch(`${BASE_URL}/api/bookings`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(bookingData),
  });
  return await response.json();
}

// Example usage
async function bookAppointment() {
  // Get available slots
  const availability = await getAvailability('service_1');
  console.log(`Found ${availability.total_slots} slots`);

  if (availability.slots.length > 0) {
    // Book the first slot
    const booking = await createBooking({
      customer_email: 'test@example.com',
      customer_name: 'Test Customer',
      customer_phone: '+12345678901',
      service_id: 'service_1',
      start_time: availability.slots[0].start,
      notes: 'Test booking from JavaScript',
    });

    if (booking.success) {
      console.log('Booking created:', booking.appointment.id);
    }
  }
}

bookAppointment();
```

### Using `axios`

```javascript
import axios from 'axios';

const api = axios.create({
  baseURL: 'http://localhost:8000',
  headers: {
    'Content-Type': 'application/json',
  },
});

// Complete booking flow
async function completeBookingFlow() {
  try {
    // 1. Get availability
    const availabilityResponse = await api.get('/api/availability', {
      params: {
        service_id: 'service_1',
        days_ahead: 7,
      },
    });

    const slots = availabilityResponse.data.slots;
    console.log(`Available slots: ${slots.length}`);

    // 2. Create booking
    const bookingResponse = await api.post('/api/bookings', {
      customer_email: 'customer@example.com',
      customer_name: 'John Doe',
      customer_phone: '+12345678901',
      service_id: 'service_1',
      start_time: slots[0].start,
      notes: 'Looking forward to the appointment',
    });

    const appointmentId = bookingResponse.data.appointment.id;
    console.log('Appointment created:', appointmentId);

    // 3. Get booking details
    const detailsResponse = await api.get(`/api/bookings/${appointmentId}`);
    console.log('Booking details:', detailsResponse.data);

    // 4. Cancel booking
    const cancelResponse = await api.delete(
      `/api/bookings/${appointmentId}`,
      { params: { refund: false } }
    );
    console.log('Cancellation:', cancelResponse.data.message);

  } catch (error) {
    console.error('Error:', error.response?.data || error.message);
  }
}

completeBookingFlow();
```

## Testing Scenarios

### Scenario 1: Happy Path

1. Check availability
2. Book an appointment
3. Receive confirmation (check logs for email/SMS)
4. View booking details
5. Success!

### Scenario 2: Reschedule

1. Create a booking
2. Update with new time
3. Check updated details
4. Receive reschedule notification

### Scenario 3: Cancellation

1. Create a booking
2. Cancel the booking
3. Receive cancellation confirmation
4. Verify calendar event removed

### Scenario 4: No Available Slots

1. Try to book a slot that's already taken
2. Receive error message
3. Get new availability
4. Book available slot

## Demo Mode Behavior

In demo mode, the system:

- Returns mock availability (Mon-Fri, 9 AM - 5 PM)
- Creates appointments in memory (lost on restart)
- Logs email/SMS instead of sending
- Simulates payment processing
- Doesn't require external API credentials

Check logs to see simulated notifications:
```
[DEMO] Would send email to john.doe@example.com: Booking Confirmed
[DEMO] Would send SMS to +12345678901: Your appointment is confirmed...
[DEMO] Would create calendar event: Consultation - John Doe at 2024-01-02T09:00:00
```

## Error Handling

### Invalid Email

```bash
curl -X POST "http://localhost:8000/api/bookings" \
  -H "Content-Type: application/json" \
  -d '{
    "customer_email": "invalid-email",
    "customer_name": "Test",
    "customer_phone": "+12345678901",
    "service_id": "service_1",
    "start_time": "2024-01-02T09:00:00"
  }'
```

Response: 422 Unprocessable Entity

### Time Slot Unavailable

```bash
curl -X POST "http://localhost:8000/api/bookings" \
  -H "Content-Type: application/json" \
  -d '{
    "customer_email": "test@example.com",
    "customer_name": "Test",
    "customer_phone": "+12345678901",
    "service_id": "service_1",
    "start_time": "2024-01-01T02:00:00"
  }'
```

Response:
```json
{
  "success": false,
  "message": "Failed to create booking. Time slot may no longer be available."
}
```

## Rate Limiting

(Not implemented in demo, but would be added for production)

## Authentication

(Not implemented in demo, but would use JWT tokens in production)

## Webhooks

(Stripe webhooks for payment confirmations would be implemented in production)

---

For more examples, see the test suite in `tests/test_booking.py`.
