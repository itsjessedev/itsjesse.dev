# BookingSync - System Architecture

## High-Level Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                        CLIENT LAYER                             │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  ┌──────────────────┐         ┌──────────────────┐             │
│  │  React Widget    │         │   Mobile App     │             │
│  │  (TypeScript)    │         │  (Future)        │             │
│  └────────┬─────────┘         └────────┬─────────┘             │
│           │                            │                        │
│           └────────────┬───────────────┘                        │
│                        │                                        │
└────────────────────────┼────────────────────────────────────────┘
                         │ HTTP/REST
┌────────────────────────┼────────────────────────────────────────┐
│                        │   API LAYER (FastAPI)                  │
├────────────────────────┼────────────────────────────────────────┤
│                        │                                        │
│  ┌─────────────────────▼────────────────────┐                  │
│  │         API Gateway / Routing            │                  │
│  │  - CORS handling                         │                  │
│  │  - Request validation                    │                  │
│  │  - Rate limiting (future)                │                  │
│  └───┬──────────────┬──────────────┬────────┘                  │
│      │              │              │                            │
│  ┌───▼──────┐  ┌───▼──────┐  ┌───▼──────┐                     │
│  │Bookings  │  │Availability│ │Customers│                      │
│  │Endpoints │  │ Endpoints  │ │Endpoints│                      │
│  └───┬──────┘  └───┬──────┘  └───┬──────┘                     │
│      │              │              │                            │
└──────┼──────────────┼──────────────┼────────────────────────────┘
       │              │              │
┌──────┼──────────────┼──────────────┼────────────────────────────┐
│      │   BUSINESS LOGIC LAYER      │                            │
├──────┼──────────────┼──────────────┼────────────────────────────┤
│      │              │              │                            │
│  ┌───▼──────────────▼──────────────▼────────┐                  │
│  │        Booking Service                    │                  │
│  │  - Availability checking                  │                  │
│  │  - Booking creation/update/cancel         │                  │
│  │  - Business rules enforcement             │                  │
│  └───┬───────────────┬───────────────┬───────┘                  │
│      │               │               │                          │
│  ┌───▼─────┐    ┌───▼─────┐    ┌───▼─────┐                    │
│  │Reminder │    │Calendar │    │Payment  │                     │
│  │Service  │    │Service  │    │Service  │                     │
│  └───┬─────┘    └───┬─────┘    └───┬─────┘                    │
│      │               │               │                          │
└──────┼───────────────┼───────────────┼──────────────────────────┘
       │               │               │
┌──────┼───────────────┼───────────────┼──────────────────────────┐
│      │   INTEGRATION LAYER           │                          │
├──────┼───────────────┼───────────────┼──────────────────────────┤
│      │               │               │                          │
│  ┌───▼─────┐    ┌───▼─────┐    ┌───▼─────┐    ┌──────────┐   │
│  │ Twilio  │    │ Google  │    │ Stripe  │    │  SMTP    │   │
│  │  SMS    │    │Calendar │    │Payments │    │  Email   │   │
│  └─────────┘    └─────────┘    └─────────┘    └──────────┘   │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
       │               │               │               │
┌──────┼───────────────┼───────────────┼───────────────┼──────────┐
│      │   DATA LAYER  │               │               │          │
├──────┼───────────────┼───────────────┼───────────────┼──────────┤
│      │               │               │               │          │
│  ┌───▼───────────────▼───────────────▼───────────────▼───────┐ │
│  │                    Database (PostgreSQL/SQLite)           │ │
│  │  - Appointments                                           │ │
│  │  - Customers                                              │ │
│  │  - Services                                               │ │
│  │  - Reminders                                              │ │
│  └───────────────────────────────────────────────────────────┘ │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘

       ┌──────────────────────────────────────┐
       │   BACKGROUND JOBS (APScheduler)      │
       ├──────────────────────────────────────┤
       │  - Process pending reminders         │
       │  - Sync calendar events              │
       │  - Generate analytics                │
       │  - Cleanup old data                  │
       └──────────────────────────────────────┘
```

## Component Details

### Client Layer

**React Booking Widget**
- Single-page booking flow
- Real-time availability display
- Form validation
- Responsive design
- Customizable theming

### API Layer (FastAPI)

**API Endpoints**
- `/api/availability` - Get available time slots
- `/api/bookings` - CRUD operations for appointments
- `/api/customers` - Customer management

**Features**
- Automatic OpenAPI documentation
- Request/response validation (Pydantic)
- Async request handling
- CORS middleware

### Business Logic Layer

**Booking Service**
```python
BookingService
├── get_availability()      # Check free slots
├── create_booking()        # Create appointment
├── cancel_booking()        # Cancel with notifications
└── reschedule_booking()    # Update appointment time
```

**Reminder Service**
```python
ReminderService
├── send_reminder()         # Send single reminder
└── process_pending_reminders() # Batch processing
```

**Calendar Service**
```python
CalendarService
├── get_availability()      # Query Google Calendar
├── create_event()          # Add calendar event
├── update_event()          # Modify event
└── delete_event()          # Remove event
```

### Integration Layer

**External Services**

1. **Google Calendar API**
   - OAuth 2.0 authentication
   - FreeBusy queries for availability
   - Event CRUD operations
   - Attendee invitations

2. **Twilio SMS**
   - SMS notifications
   - Delivery status tracking
   - Two-way messaging (future)

3. **Stripe Payments**
   - Payment intents
   - Deposit handling
   - Refund processing
   - Webhook handling

4. **SMTP Email**
   - HTML email templates
   - Calendar attachments (iCal)
   - Delivery tracking

### Data Layer

**Database Schema**

```sql
-- Customers
CREATE TABLE customers (
    id VARCHAR PRIMARY KEY,
    email VARCHAR UNIQUE NOT NULL,
    name VARCHAR NOT NULL,
    phone VARCHAR NOT NULL,
    notes TEXT,
    total_bookings INT DEFAULT 0,
    total_no_shows INT DEFAULT 0,
    created_at TIMESTAMP,
    updated_at TIMESTAMP
);

-- Services
CREATE TABLE services (
    id VARCHAR PRIMARY KEY,
    name VARCHAR NOT NULL,
    description TEXT,
    duration_minutes INT NOT NULL,
    price_cents INT NOT NULL,
    deposit_cents INT DEFAULT 0,
    buffer_minutes INT DEFAULT 15,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP,
    updated_at TIMESTAMP
);

-- Appointments
CREATE TABLE appointments (
    id VARCHAR PRIMARY KEY,
    customer_id VARCHAR REFERENCES customers(id),
    service_id VARCHAR REFERENCES services(id),
    start_time TIMESTAMP NOT NULL,
    end_time TIMESTAMP NOT NULL,
    status VARCHAR NOT NULL,
    notes TEXT,
    payment_status VARCHAR DEFAULT 'unpaid',
    payment_intent_id VARCHAR,
    google_calendar_event_id VARCHAR,
    confirmed_at TIMESTAMP,
    cancelled_at TIMESTAMP,
    completed_at TIMESTAMP,
    created_at TIMESTAMP,
    updated_at TIMESTAMP
);

-- Reminders
CREATE TABLE reminders (
    id VARCHAR PRIMARY KEY,
    appointment_id VARCHAR REFERENCES appointments(id),
    method VARCHAR NOT NULL,
    scheduled_for TIMESTAMP NOT NULL,
    status VARCHAR DEFAULT 'pending',
    sent_at TIMESTAMP,
    error_message TEXT,
    created_at TIMESTAMP,
    updated_at TIMESTAMP
);
```

## Data Flow

### Booking Creation Flow

```
User fills form
      │
      ▼
Frontend validates input
      │
      ▼
POST /api/bookings
      │
      ▼
API validates request (Pydantic)
      │
      ▼
BookingService.create_booking()
      │
      ├─► Check availability (CalendarService)
      │
      ├─► Process payment (StripeService) [if deposit required]
      │
      ├─► Create calendar event (CalendarService)
      │
      ├─► Save to database
      │
      ├─► Send confirmation (EmailService + TwilioService)
      │
      └─► Schedule reminders (ReminderService)
      │
      ▼
Return appointment ID
      │
      ▼
Frontend shows confirmation
```

### Reminder Processing Flow

```
APScheduler triggers job (every 5 min)
      │
      ▼
Query pending reminders (due <= now)
      │
      ▼
For each reminder:
      │
      ├─► Fetch appointment details
      │
      ├─► Fetch customer details
      │
      ├─► Send via appropriate method:
      │   ├─► Email (EmailService)
      │   └─► SMS (TwilioService)
      │
      ├─► Update reminder status
      │
      └─► Log result
```

## Deployment Architecture

### Development

```
┌────────────────────────────────┐
│  Local Machine                 │
│  ┌──────────────────────────┐  │
│  │  FastAPI (uvicorn)       │  │
│  │  Port 8000               │  │
│  └──────────────────────────┘  │
│  ┌──────────────────────────┐  │
│  │  React Dev Server        │  │
│  │  Port 3000               │  │
│  └──────────────────────────┘  │
│  ┌──────────────────────────┐  │
│  │  SQLite Database         │  │
│  └──────────────────────────┘  │
└────────────────────────────────┘
```

### Production (Docker)

```
┌────────────────────────────────────────────────┐
│  Docker Host                                   │
│  ┌──────────────────────────────────────────┐  │
│  │  Nginx Reverse Proxy                     │  │
│  │  - SSL/TLS termination                   │  │
│  │  - Load balancing                        │  │
│  │  Port 80/443                             │  │
│  └──────────────┬───────────────────────────┘  │
│                 │                              │
│  ┌──────────────▼───────────────────────────┐  │
│  │  FastAPI Container                       │  │
│  │  - Gunicorn + Uvicorn workers            │  │
│  │  - Port 8000 (internal)                  │  │
│  └──────────────────────────────────────────┘  │
│                                                │
│  ┌──────────────────────────────────────────┐  │
│  │  React Container (static files)          │  │
│  │  - Nginx serving build                   │  │
│  │  - Port 3000 (internal)                  │  │
│  └──────────────────────────────────────────┘  │
│                                                │
│  ┌──────────────────────────────────────────┐  │
│  │  PostgreSQL Container                    │  │
│  │  - Persistent volume                     │  │
│  │  - Port 5432 (internal)                  │  │
│  └──────────────────────────────────────────┘  │
│                                                │
│  ┌──────────────────────────────────────────┐  │
│  │  Redis Container (future)                │  │
│  │  - Session storage                       │  │
│  │  - Cache layer                           │  │
│  └──────────────────────────────────────────┘  │
└────────────────────────────────────────────────┘
```

## Security Considerations

### Authentication & Authorization
- API key authentication (production)
- JWT tokens for customer access
- Role-based access control (admin vs customer)

### Data Protection
- Environment variables for secrets
- Encrypted database connections
- HTTPS only in production
- Sanitized error messages (no data leaks)

### API Security
- Rate limiting per IP
- Request validation (Pydantic)
- SQL injection prevention (ORM)
- XSS protection (React escaping)

### Payment Security
- PCI compliance via Stripe
- No credit card storage
- Secure webhook verification
- Refund audit trail

## Performance Optimization

### Caching Strategy
- Redis cache for availability queries
- Calendar data TTL: 5 minutes
- Customer data TTL: 1 hour

### Database Optimization
- Indexes on foreign keys
- Composite index: (customer_id, start_time)
- Connection pooling
- Query optimization

### Async Operations
- Non-blocking I/O for external APIs
- Background tasks for reminders
- Concurrent calendar queries

## Monitoring & Logging

### Application Logs
```python
logging.info("Booking created", extra={
    "appointment_id": id,
    "customer_id": customer_id,
    "service_id": service_id
})
```

### Metrics to Track
- Booking conversion rate
- No-show rate
- Average response time
- API error rate
- Integration uptime

### Alerting
- Failed payment processing
- Calendar sync errors
- Email/SMS delivery failures
- High error rate threshold

## Scalability

### Horizontal Scaling
- Stateless API design
- Multiple FastAPI workers
- Load balancer distribution

### Vertical Scaling
- Database connection pooling
- Worker process tuning
- Memory optimization

### Future Enhancements
- Multi-region deployment
- CDN for static assets
- Database read replicas
- Message queue (RabbitMQ/Celery)

## Technology Choices

### Why FastAPI?
- Automatic API documentation
- Type hints and validation
- Async support out of the box
- High performance (Starlette + Pydantic)

### Why React?
- Component reusability
- Rich ecosystem
- TypeScript support
- Easy embedding

### Why PostgreSQL?
- ACID compliance
- JSON support
- Full-text search
- Mature and reliable

### Why Docker?
- Consistent environments
- Easy deployment
- Service isolation
- Version control for infrastructure
