"""Main application entry point."""
import argparse
import asyncio
from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from src.config import settings
from src.db.database import init_db
from src.api import requests, workflows, audit
from src.services.slack_bot import slack_bot


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Application lifespan manager."""
    # Startup
    print("Starting WorkflowBot...")

    if settings.is_demo_mode:
        print("Running in DEMO MODE - Slack integration disabled")
        print("To run with Slack, set SLACK_BOT_TOKEN and SLACK_APP_TOKEN")
    else:
        print("Running in PRODUCTION MODE with Slack integration")

    # Initialize database
    await init_db()
    print("Database initialized")

    yield

    # Shutdown
    print("Shutting down WorkflowBot...")


# Create FastAPI app
app = FastAPI(
    title=settings.app_name,
    description="Slack/Teams Process Automation Bot",
    version="1.0.0",
    lifespan=lifespan
)

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include routers
app.include_router(requests.router)
app.include_router(workflows.router)
app.include_router(audit.router)

# Slack event handler
if slack_bot.handler and not settings.is_demo_mode:
    from fastapi import Request
    from slack_bolt.adapter.fastapi.async_handler import AsyncSlackRequestHandler

    @app.post("/slack/events")
    async def slack_events(req: Request):
        """Handle Slack events."""
        return await slack_bot.handler.handle(req)


@app.get("/")
async def root():
    """Root endpoint."""
    return {
        "app": settings.app_name,
        "version": "1.0.0",
        "mode": "demo" if settings.is_demo_mode else "production",
        "docs": "/docs",
        "health": "/health"
    }


@app.get("/health")
async def health():
    """Health check endpoint."""
    return {
        "status": "healthy",
        "mode": "demo" if settings.is_demo_mode else "production",
        "slack_configured": settings.slack_configured
    }


@app.get("/health/db")
async def health_db():
    """Database health check."""
    from src.db.database import async_engine
    from sqlalchemy import text

    try:
        async with async_engine.connect() as conn:
            await conn.execute(text("SELECT 1"))
        return {"status": "healthy"}
    except Exception as e:
        return {"status": "unhealthy", "error": str(e)}


@app.get("/health/slack")
async def health_slack():
    """Slack health check."""
    if settings.is_demo_mode:
        return {"status": "disabled", "mode": "demo"}

    if not settings.slack_configured:
        return {"status": "unconfigured"}

    # In production, test Slack connection
    return {"status": "healthy"}


async def run_demo():
    """Run interactive demo mode."""
    from rich.console import Console
    from rich.panel import Panel
    from rich.table import Table
    from rich.prompt import Prompt, Confirm
    from datetime import datetime, timedelta

    console = Console()

    console.print(Panel.fit(
        "[bold cyan]WorkflowBot - Demo Mode[/bold cyan]\n"
        "Interactive console demo of Slack/Teams automation",
        border_style="cyan"
    ))

    # Initialize database
    await init_db()
    console.print("[green]✓[/green] Database initialized\n")

    from src.db.database import AsyncSessionLocal
    from src.services.workflow_engine import WorkflowEngine
    from src.services.approval_router import ApprovalRouter

    async with AsyncSessionLocal() as db:
        engine = WorkflowEngine(db)
        router = ApprovalRouter()

        while True:
            console.print("\n[bold]Available Workflows:[/bold]")
            console.print("1. PTO Request")
            console.print("2. Expense Approval")
            console.print("3. Employee Onboarding")
            console.print("4. View My Requests")
            console.print("5. View Pending Approvals")
            console.print("6. Exit")

            choice = Prompt.ask("\nSelect workflow", choices=["1", "2", "3", "4", "5", "6"])

            if choice == "6":
                console.print("\n[yellow]Thanks for trying WorkflowBot![/yellow]")
                break

            elif choice == "1":
                # PTO Request
                console.print("\n[bold cyan]PTO Request Workflow[/bold cyan]")

                requester_name = Prompt.ask("Your name", default="John Doe")
                requester_id = "USER001"

                start_date = Prompt.ask(
                    "Start date",
                    default=(datetime.now() + timedelta(days=7)).strftime("%Y-%m-%d")
                )
                end_date = Prompt.ask(
                    "End date",
                    default=(datetime.now() + timedelta(days=9)).strftime("%Y-%m-%d")
                )
                reason = Prompt.ask("Reason (optional)", default="Vacation")

                # Create request
                request = await engine.create_request(
                    workflow_type="pto",
                    requester_id=requester_id,
                    requester_name=requester_name,
                    requester_email=f"{requester_name.lower().replace(' ', '.')}@company.com",
                    title=f"PTO Request: {start_date} to {end_date}",
                    data={"start_date": start_date, "end_date": end_date, "reason": reason}
                )

                console.print(f"\n[green]✓[/green] Request created (ID: {request.id})")

                # Route and submit
                approvers = router.route("pto", request.data, requester_id)
                request = await engine.submit_request(request.id, approvers)

                console.print(f"[green]✓[/green] Submitted for approval to: {approvers[0]['name']}")

                # Simulate approval
                if Confirm.ask("\nSimulate manager approval?"):
                    approval = request.approvals[0]
                    await engine.approve_request(approval.id, approval.approver_id, "Approved")
                    console.print("[green]✓[/green] Request approved!")

            elif choice == "2":
                # Expense Approval
                console.print("\n[bold cyan]Expense Approval Workflow[/bold cyan]")

                requester_name = Prompt.ask("Your name", default="Jane Smith")
                requester_id = "USER002"

                amount = Prompt.ask("Amount ($)", default="350.00")
                category = Prompt.ask(
                    "Category",
                    choices=["travel", "meals", "equipment", "software", "other"],
                    default="travel"
                )
                description = Prompt.ask("Description", default="Client meeting expenses")

                # Create request
                request = await engine.create_request(
                    workflow_type="expense",
                    requester_id=requester_id,
                    requester_name=requester_name,
                    requester_email=f"{requester_name.lower().replace(' ', '.')}@company.com",
                    title=f"Expense Reimbursement: ${amount}",
                    data={"amount": amount, "category": category, "description": description}
                )

                console.print(f"\n[green]✓[/green] Expense request created (ID: {request.id})")

                # Route and submit
                approvers = router.route("expense", request.data, requester_id)
                request = await engine.submit_request(request.id, approvers)

                console.print(f"[green]✓[/green] Submitted for approval")
                for approver in approvers:
                    console.print(f"  → {approver['name']} ({approver['id']})")

            elif choice == "3":
                # Onboarding
                console.print("\n[bold cyan]Employee Onboarding Workflow[/bold cyan]")

                employee_name = Prompt.ask("New employee name", default="Alex Johnson")
                employee_email = Prompt.ask("Email", default="alex.johnson@company.com")
                department = Prompt.ask("Department", default="Engineering")
                role = Prompt.ask("Role", default="Software Engineer")
                start_date = Prompt.ask(
                    "Start date",
                    default=(datetime.now() + timedelta(days=14)).strftime("%Y-%m-%d")
                )

                # Create request
                request = await engine.create_request(
                    workflow_type="onboarding",
                    requester_id="HR001",
                    requester_name="HR Team",
                    requester_email="hr@company.com",
                    title=f"Onboard: {employee_name}",
                    data={
                        "employee_name": employee_name,
                        "employee_email": employee_email,
                        "department": department,
                        "role": role,
                        "start_date": start_date
                    }
                )

                console.print(f"\n[green]✓[/green] Onboarding workflow created (ID: {request.id})")
                console.print(f"[green]✓[/green] Generated {len(request.data.get('checklist', []))} tasks")

                # Show checklist
                if Confirm.ask("\nShow checklist?"):
                    table = Table(title="Onboarding Checklist")
                    table.add_column("Task", style="cyan")
                    table.add_column("Assignee", style="green")
                    table.add_column("Priority", style="yellow")

                    for task in request.data.get("checklist", [])[:5]:
                        table.add_row(
                            task["task"],
                            task["assignee"],
                            task["priority"]
                        )

                    console.print(table)

            elif choice == "4":
                # View requests
                console.print("\n[bold cyan]My Requests[/bold cyan]")

                requests = await engine.get_user_requests("USER001")

                if not requests:
                    console.print("[yellow]No requests found[/yellow]")
                else:
                    table = Table(title="My Requests")
                    table.add_column("ID", style="cyan")
                    table.add_column("Type", style="green")
                    table.add_column("Title", style="white")
                    table.add_column("Status", style="yellow")
                    table.add_column("Created", style="dim")

                    for req in requests[:10]:
                        table.add_row(
                            str(req.id),
                            req.workflow_type,
                            req.title,
                            req.status.value,
                            req.created_at.strftime("%Y-%m-%d %H:%M")
                        )

                    console.print(table)

            elif choice == "5":
                # View approvals
                console.print("\n[bold cyan]Pending Approvals[/bold cyan]")

                approvals = await engine.get_pending_approvals("MGR001")

                if not approvals:
                    console.print("[yellow]No pending approvals[/yellow]")
                else:
                    table = Table(title="Pending Approvals")
                    table.add_column("ID", style="cyan")
                    table.add_column("Request", style="white")
                    table.add_column("Requester", style="green")
                    table.add_column("Created", style="dim")

                    for approval in approvals[:10]:
                        req = approval.request
                        table.add_row(
                            str(approval.id),
                            req.title,
                            req.requester_name,
                            req.created_at.strftime("%Y-%m-%d %H:%M")
                        )

                    console.print(table)


def main():
    """Main entry point."""
    parser = argparse.ArgumentParser(description="WorkflowBot - Slack/Teams Process Automation")
    parser.add_argument("--demo", action="store_true", help="Run in demo mode")
    parser.add_argument("--host", default="0.0.0.0", help="Host to bind to")
    parser.add_argument("--port", type=int, default=8000, help="Port to bind to")

    args = parser.parse_args()

    if args.demo:
        # Run demo mode
        asyncio.run(run_demo())
    else:
        # Run FastAPI server
        import uvicorn
        uvicorn.run(
            "src.main:app",
            host=args.host,
            port=args.port,
            reload=settings.debug
        )


if __name__ == "__main__":
    main()
