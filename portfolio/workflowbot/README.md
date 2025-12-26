# WorkflowBot

**Slack/Teams Process Automation Bot**

Automate internal processes like PTO requests, expense approvals, and employee onboarding through Slack/Teams integration with audit trails and approval routing.

## Problem

Internal processes lived in email chains, requests got lost, there was no audit trail, and managers struggled to track outstanding approvals. Manual routing meant delays and no visibility into request status.

## Solution

WorkflowBot provides a Slack bot that:
- Handles structured requests through interactive forms
- Routes approvals to appropriate managers
- Tracks request status in real-time
- Maintains comprehensive audit logs
- Sends automated notifications
- Provides reporting and analytics

## Tech Stack

- **Backend:** Python, FastAPI
- **Bot Framework:** Slack Bolt SDK
- **Database:** PostgreSQL with SQLAlchemy ORM
- **Workflow Engine:** Custom workflow engine with n8n integration
- **Containerization:** Docker, Docker Compose
- **Testing:** pytest

## Features

### Core Workflows

1. **PTO Request Workflow**
   - Submit time-off request via Slack
   - Auto-route to manager
   - Handle approval/rejection
   - Calendar integration
   - Balance tracking

2. **Expense Approval Workflow**
   - Submit expense with receipt
   - Multi-level approvals (manager → finance)
   - Budget validation
   - Status tracking
   - Reimbursement notifications

3. **Onboarding Workflow**
   - New hire checklist
   - Equipment requests
   - Access provisioning
   - Task assignments
   - Progress tracking

### Key Features

- **Interactive Forms:** Slack Block Kit UI for data collection
- **Approval Routing:** Dynamic routing based on request type, amount, department
- **Audit Trail:** Complete history of all actions and state changes
- **Status Tracking:** Real-time request status visibility
- **Notifications:** Automated reminders and updates
- **Analytics:** Request metrics and approval times
- **Demo Mode:** Console-based demo when Slack not configured

## Quick Start

### Demo Mode (No Slack Required)

Run the bot in console demo mode to see workflows in action:

```bash
# Install dependencies
pip install -r requirements.txt

# Run demo mode
python src/main.py --demo

# Or with Docker
docker-compose up demo
```

Demo mode simulates Slack interactions in your terminal, perfect for portfolio demonstrations.

### Production Setup

#### Prerequisites

- Python 3.11+
- PostgreSQL 14+
- Slack workspace with bot token
- (Optional) n8n instance for advanced workflows

#### 1. Slack App Setup

1. Create a new Slack app at https://api.slack.com/apps
2. Enable Socket Mode
3. Add Bot Token Scopes:
   - `chat:write`
   - `commands`
   - `im:history`
   - `im:read`
   - `im:write`
   - `users:read`
4. Install app to workspace
5. Copy Bot Token and App Token

#### 2. Environment Configuration

```bash
cp .env.example .env
# Edit .env with your credentials
```

Required variables:
```env
SLACK_BOT_TOKEN=xoxb-your-bot-token
SLACK_APP_TOKEN=xapp-your-app-token
DATABASE_URL=postgresql://user:password@localhost:5432/workflowbot
SECRET_KEY=your-secret-key
```

#### 3. Database Setup

```bash
# With Docker
docker-compose up -d postgres

# Without Docker
createdb workflowbot
python src/db/migrations.py
```

#### 4. Run the Application

```bash
# Development
uvicorn src.main:app --reload

# Production with Docker
docker-compose up -d
```

## Usage

### PTO Request Example

1. In Slack, type: `/pto-request`
2. Fill out the interactive form:
   - Start date
   - End date
   - Reason (optional)
3. Submit → Auto-routed to manager
4. Manager receives notification with approve/deny buttons
5. Requester notified of decision
6. Calendar updated automatically

### Expense Approval Example

1. Type: `/submit-expense`
2. Fill out form:
   - Amount
   - Category
   - Description
   - Upload receipt
3. Routes to manager (< $500) or manager + finance (≥ $500)
4. Track status: `/my-expenses`
5. Receive reimbursement notification

### Onboarding Workflow

1. HR triggers: `/onboard @new-employee`
2. Creates checklist:
   - Equipment order
   - Email account setup
   - Access provisioning
   - Training assignments
3. Assigns tasks to IT, HR, Manager
4. Tracks completion
5. Sends welcome message when complete

## API Documentation

FastAPI provides automatic API documentation:

- Swagger UI: http://localhost:8000/docs
- ReDoc: http://localhost:8000/redoc

### Key Endpoints

- `POST /api/requests` - Create new request
- `GET /api/requests/{id}` - Get request status
- `POST /api/requests/{id}/approve` - Approve request
- `POST /api/requests/{id}/reject` - Reject request
- `GET /api/audit/{request_id}` - Get audit trail
- `GET /api/workflows` - List available workflows

## Architecture

### Workflow Engine

Custom workflow engine supporting:
- State machine-based workflows
- Dynamic approval routing
- Parallel and sequential steps
- Conditional logic
- Timeout handling
- Error recovery

### Database Schema

```
requests
├── id (PK)
├── workflow_type
├── requester_id
├── status
├── data (JSONB)
├── created_at
└── updated_at

approvals
├── id (PK)
├── request_id (FK)
├── approver_id
├── status
├── comments
└── decided_at

audit_logs
├── id (PK)
├── request_id (FK)
├── action
├── actor_id
├── data (JSONB)
└── timestamp
```

### Slack Integration

- **Socket Mode:** Real-time bidirectional communication
- **Block Kit:** Rich interactive UIs
- **Slash Commands:** Quick access to workflows
- **Interactive Components:** Buttons, modals, select menus
- **Events:** User actions, message handling

## Testing

```bash
# Run all tests
pytest

# With coverage
pytest --cov=src --cov-report=html

# Specific test file
pytest tests/test_workflow.py -v
```

## Deployment

### Docker Deployment

```bash
# Build and run
docker-compose up -d

# View logs
docker-compose logs -f workflowbot

# Scale workers
docker-compose up -d --scale worker=3
```

### Environment-Specific Configs

- **Development:** `.env.development`
- **Staging:** `.env.staging`
- **Production:** `.env.production`

### Health Checks

- Application: `GET /health`
- Database: `GET /health/db`
- Slack: `GET /health/slack`

## Configuration

### Workflow Configuration

Workflows are configurable via YAML or database:

```yaml
pto_request:
  name: "PTO Request"
  steps:
    - name: "submit"
      type: "form"
      fields:
        - start_date
        - end_date
        - reason
    - name: "manager_approval"
      type: "approval"
      approvers: ["${manager}"]
      timeout: 24h
    - name: "calendar_update"
      type: "action"
      handler: "update_calendar"
```

### Approval Rules

Define routing logic:

```python
approval_rules = {
    "expense": [
        {"condition": "amount < 500", "approvers": ["manager"]},
        {"condition": "amount >= 500", "approvers": ["manager", "finance"]},
    ],
    "pto": [
        {"condition": "days <= 3", "approvers": ["manager"]},
        {"condition": "days > 3", "approvers": ["manager", "hr"]},
    ]
}
```

## Development

### Project Structure

```
src/
├── main.py              # FastAPI app + Slack bot entry
├── config.py            # Settings and configuration
├── models/              # SQLAlchemy models
│   ├── request.py
│   ├── workflow.py
│   ├── approval.py
│   └── audit.py
├── services/            # Business logic
│   ├── slack_bot.py     # Slack Bolt app
│   ├── workflow_engine.py
│   ├── approval_router.py
│   └── audit_logger.py
├── workflows/           # Workflow definitions
│   ├── pto_request.py
│   ├── expense_approval.py
│   └── onboarding.py
├── api/                 # API endpoints
│   ├── requests.py
│   ├── workflows.py
│   └── audit.py
└── db/                  # Database utilities
    └── database.py
```

### Adding New Workflows

1. Create workflow definition in `src/workflows/`
2. Define state machine and steps
3. Implement approval routing logic
4. Add Slack command/interaction handlers
5. Register in workflow registry
6. Add tests

### Code Style

- **Formatting:** black, isort
- **Linting:** flake8, pylint
- **Type Checking:** mypy
- **Documentation:** Google-style docstrings

## Monitoring

### Metrics

- Request volume by workflow type
- Average approval time
- Rejection rates
- SLA compliance
- Bot response time

### Logging

Structured logging with correlation IDs:

```python
logger.info(
    "Request approved",
    extra={
        "request_id": request.id,
        "workflow": request.workflow_type,
        "approver": approver.id,
        "duration": approval_time
    }
)
```

## Security

- **Authentication:** Slack signature verification
- **Authorization:** Role-based access control
- **Encryption:** Database encryption at rest
- **Secrets:** Environment variables, never committed
- **Audit:** All actions logged with actor and timestamp

## Performance

- **Database:** Connection pooling, read replicas
- **Caching:** Redis for session data and frequently accessed configs
- **Async:** Asyncio for I/O operations
- **Background Jobs:** Celery for long-running tasks

## Future Enhancements

- [ ] Microsoft Teams integration
- [ ] Mobile app for approvals
- [ ] Advanced analytics dashboard
- [ ] Custom workflow builder UI
- [ ] Integration marketplace (Jira, GitHub, etc.)
- [ ] SLA monitoring and escalation
- [ ] Natural language processing for requests
- [ ] Multilingual support

## License

MIT License - See LICENSE file for details

## Author

Jesse Eldridge
- Portfolio: https://itsjesse.dev
- Email: jesse@example.com
- GitHub: @jesse-eldridge

## Acknowledgments

- Slack Bolt SDK team for excellent documentation
- FastAPI for the amazing framework
- SQLAlchemy for robust ORM

---

**Note:** This is a portfolio project demonstrating production-ready bot development, workflow automation, and Slack integration. Demo mode available for evaluation without Slack credentials.
