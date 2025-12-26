# WorkflowBot Demo Guide

Quick guide to demonstrate WorkflowBot without Slack credentials.

## Quick Start (Demo Mode)

### Option 1: Docker (Recommended)

```bash
# Start demo with Docker
cd /home/jesse/itsjesse.dev/portfolio/workflowbot
docker-compose --profile demo up demo
```

This launches an interactive console demo.

### Option 2: Local Python

```bash
# Install dependencies
pip install -r requirements.txt

# Run demo mode
python src/main.py --demo
```

## Demo Scenarios

### Scenario 1: PTO Request

1. Select option **1** (PTO Request)
2. Enter your name (e.g., "John Doe")
3. Set start date (defaults to 7 days from now)
4. Set end date (defaults to 9 days from now)
5. Add reason (optional, e.g., "Vacation")
6. Request is created and routed to mock manager
7. Simulate approval when prompted

**Demonstrates:**
- Interactive form collection
- Date validation
- Automatic routing to manager
- Approval workflow
- Audit trail creation

### Scenario 2: Expense Approval

1. Select option **2** (Expense Approval)
2. Enter your name (e.g., "Jane Smith")
3. Enter amount (e.g., "350.00")
4. Select category (travel, meals, equipment, etc.)
5. Add description (e.g., "Client meeting expenses")
6. Request is routed based on amount
   - < $500: Manager only
   - ≥ $500: Manager + Finance

**Demonstrates:**
- Multi-level approval routing
- Amount-based conditional logic
- Category validation
- Receipt upload capability (simulated)

### Scenario 3: Employee Onboarding

1. Select option **3** (Employee Onboarding)
2. Enter new employee name
3. Enter email address
4. Enter department (e.g., "Engineering")
5. Enter role (e.g., "Software Engineer")
6. Set start date
7. System generates department-specific checklist
8. View generated tasks when prompted

**Demonstrates:**
- Dynamic checklist generation
- Department-specific workflows
- Task assignment
- Multi-stakeholder coordination (IT, HR, Manager)

### Scenario 4: View Requests

1. Select option **4** (View My Requests)
2. See table of all requests created in session
3. View status, type, and timestamps

**Demonstrates:**
- Request tracking
- Status visibility
- Request history

### Scenario 5: Pending Approvals

1. Select option **5** (View Pending Approvals)
2. See approval queue for mock manager
3. View pending items requiring action

**Demonstrates:**
- Approval queue management
- Manager dashboard view
- Action items visibility

## API Demo (Alternative)

Run the API server and explore via Swagger UI:

```bash
# Start with Docker
docker-compose up

# Or locally
uvicorn src.main:app --reload
```

Then visit:
- Swagger UI: http://localhost:8000/docs
- ReDoc: http://localhost:8000/redoc

### Key Endpoints to Test

**Create PTO Request:**
```bash
curl -X POST http://localhost:8000/api/requests \
  -H "Content-Type: application/json" \
  -d '{
    "workflow_type": "pto",
    "requester_id": "USER001",
    "requester_name": "John Doe",
    "requester_email": "john.doe@company.com",
    "title": "Vacation Request",
    "data": {
      "start_date": "2025-01-15",
      "end_date": "2025-01-17",
      "reason": "Vacation"
    }
  }'
```

**Submit for Approval:**
```bash
curl -X POST http://localhost:8000/api/requests/1/submit
```

**Get Request Status:**
```bash
curl http://localhost:8000/api/requests/1
```

**View Audit Trail:**
```bash
curl http://localhost:8000/api/audit/1
```

## Architecture Demo Points

### Database Models
- **Requests**: Core workflow data with JSONB flexibility
- **Approvals**: Multi-level approval tracking
- **Audit Logs**: Comprehensive action history
- **Workflows**: Configurable workflow definitions

### Service Layer
- **WorkflowEngine**: State machine and orchestration
- **ApprovalRouter**: Dynamic approval routing logic
- **AuditLogger**: Centralized audit logging
- **SlackBot**: Slack Bolt SDK integration (disabled in demo)

### Workflow Definitions
- **PTO Request**: Date validation, manager routing
- **Expense Approval**: Amount-based routing, receipt handling
- **Onboarding**: Checklist generation, multi-department coordination

## Production Features (Not in Demo)

When running with actual Slack credentials:

1. **Slack Commands**
   - `/pto-request` - Opens PTO form modal
   - `/submit-expense` - Opens expense form
   - `/my-requests` - View your requests
   - `/my-approvals` - View pending approvals

2. **Interactive Components**
   - Block Kit modals for data collection
   - Approve/Reject buttons
   - Status updates
   - Threaded conversations

3. **Notifications**
   - Approval request notifications
   - Decision notifications
   - Reminder messages
   - Status updates

4. **Integration Points**
   - Calendar integration for PTO
   - Email notifications
   - n8n webhook triggers
   - Celery background tasks

## Testing

Run the test suite:

```bash
# All tests
pytest

# With coverage
pytest --cov=src --cov-report=html

# Specific test
pytest tests/test_workflow.py::test_create_pto_request -v
```

Tests cover:
- Request creation and validation
- Approval workflows
- Routing logic
- Status transitions
- Error handling

## Key Metrics to Highlight

- **~2,500 lines** of production-ready code
- **3 complete workflows** implemented
- **Full CRUD API** with FastAPI
- **Comprehensive test coverage**
- **Docker containerization**
- **Database migrations ready**
- **Production monitoring hooks**
- **Rich console UI for demo**

## Talking Points

1. **Problem Solved**
   - Manual email-based processes
   - Lost requests and no accountability
   - No audit trail
   - Slow approval cycles

2. **Technical Approach**
   - Event-driven architecture
   - Async/await for performance
   - JSONB for flexible data
   - State machine for workflows
   - Comprehensive audit logging

3. **Production Readiness**
   - Docker deployment
   - Database migrations
   - Health checks
   - Error handling
   - Logging and monitoring
   - Test coverage

4. **Scalability**
   - Async database operations
   - Redis caching layer
   - Celery for background tasks
   - Connection pooling
   - Horizontal scaling ready

## Demo Flow Recommendation

1. **Start with console demo** (2-3 minutes)
   - Quick PTO request
   - Show approval flow
   - View audit trail

2. **Show API docs** (1-2 minutes)
   - Open Swagger UI
   - Highlight key endpoints
   - Show request/response schemas

3. **Walkthrough code** (3-5 minutes)
   - Models architecture
   - Workflow engine logic
   - Approval routing
   - Slack integration (explain even if not running)

4. **Highlight production features** (2 minutes)
   - Docker setup
   - Tests
   - Monitoring
   - Extensibility

Total: ~10-15 minute comprehensive demo

## Portfolio Highlights

- **Full-stack**: Backend API + Bot integration + Database
- **Real-world problem**: Process automation is common need
- **Production-ready**: Docker, tests, monitoring, docs
- **Demo-friendly**: Works without external dependencies
- **Extensible**: Easy to add new workflows
- **Clean code**: Well-organized, typed, documented
