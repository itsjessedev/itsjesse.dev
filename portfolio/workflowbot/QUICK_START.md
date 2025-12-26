# WorkflowBot - Quick Start

## Fastest Demo (30 seconds)

```bash
cd /home/jesse/itsjesse.dev/portfolio/workflowbot
python src/main.py --demo
```

Select option 1, 2, or 3 to see workflows in action.

## What This Shows

**WorkflowBot** automates internal processes through Slack:
- **PTO requests** with manager approval
- **Expense approvals** with multi-level routing
- **Employee onboarding** with automated checklists

## Key Files to Review

### Core Application
- `src/main.py` - Application entry point with demo mode
- `src/config.py` - Configuration management
- `src/models/` - Database models (Request, Approval, Audit)
- `src/services/workflow_engine.py` - Workflow orchestration
- `src/services/slack_bot.py` - Slack Bolt integration

### Workflows
- `src/workflows/pto_request.py` - PTO workflow logic
- `src/workflows/expense_approval.py` - Expense approval logic
- `src/workflows/onboarding.py` - Onboarding checklist

### API
- `src/api/requests.py` - Request CRUD endpoints
- `src/api/workflows.py` - Workflow configuration
- `src/api/audit.py` - Audit trail endpoints

### Tests
- `tests/test_workflow.py` - Comprehensive workflow tests

## Tech Highlights

- **FastAPI** - Modern async Python web framework
- **SQLAlchemy** - Async ORM with PostgreSQL
- **Slack Bolt SDK** - Official Slack bot framework
- **Pydantic** - Data validation and settings
- **pytest** - Async test support
- **Docker** - Multi-service containerization

## Demo Scenarios

### 1. PTO Request (1 min)
Shows: Form validation, date calculation, manager routing, approval flow

### 2. Expense Approval (1 min)
Shows: Amount-based routing, multi-level approvals, receipt handling

### 3. Employee Onboarding (1 min)
Shows: Dynamic checklist generation, multi-stakeholder coordination

## Production Features

- Comprehensive audit logging for compliance
- Multi-level approval routing
- Slack Block Kit interactive UI
- RESTful API with OpenAPI docs
- Background task processing
- Redis caching layer
- Health check endpoints
- Error handling and logging

## Architecture

```
User → Slack → WorkflowBot → Workflow Engine → Database
                    ↓
              Approval Router → Slack Notifications
                    ↓
              Audit Logger → Audit Trail
```

## Run Options

**Demo Mode (no Slack):**
```bash
python src/main.py --demo
```

**API Server:**
```bash
uvicorn src.main:app --reload
# Visit: http://localhost:8000/docs
```

**Docker (Full Stack):**
```bash
docker-compose up
```

**Tests:**
```bash
pytest
pytest --cov=src --cov-report=html
```

## Portfolio Points

✓ **Real Problem**: Email-based processes, lost requests, no audit trail
✓ **Modern Stack**: Async Python, FastAPI, Slack Bolt, PostgreSQL
✓ **Production Ready**: Docker, tests, monitoring, error handling
✓ **Demo Friendly**: Works without Slack credentials
✓ **Well Documented**: README, DEMO guide, inline comments
✓ **Extensible**: Easy to add new workflows

## Files Overview

- **35 files** total
- **~2,500 lines** of code
- **3 workflows** implemented
- **10+ API endpoints**
- **10+ test cases**
- **Full Docker setup**

---

**Need help?** Check README.md for full documentation or DEMO.md for detailed demo guide.
