"""InvoiceBot - Main application entry point."""

import logging
from pathlib import Path

from fastapi import FastAPI, Request
from fastapi.responses import HTMLResponse
from fastapi.staticfiles import StaticFiles
from fastapi.templating import Jinja2Templates

from src.api.routes import router as api_router
from src.config import settings

# Configure logging
logging.basicConfig(
    level=logging.DEBUG if settings.debug else logging.INFO,
    format="%(asctime)s - %(name)s - %(levelname)s - %(message)s",
)
logger = logging.getLogger(__name__)

# Create app
app = FastAPI(
    title="InvoiceBot",
    description="Receipt OCR to accounting automation",
    version="1.0.0",
)

# Include routes
app.include_router(api_router)

# Static files for uploaded images
uploads_dir = Path("uploads")
uploads_dir.mkdir(exist_ok=True)
app.mount("/uploads", StaticFiles(directory=str(uploads_dir)), name="uploads")

# Templates
templates_dir = Path(__file__).parent / "templates"
templates = Jinja2Templates(directory=str(templates_dir))


@app.get("/", response_class=HTMLResponse)
async def dashboard(request: Request):
    """Render the dashboard."""
    return templates.TemplateResponse(
        "dashboard.html",
        {
            "request": request,
            "demo_mode": settings.demo_mode,
        },
    )


@app.get("/health")
async def health():
    """Health check."""
    return {"status": "healthy", "demo_mode": settings.demo_mode}


@app.on_event("startup")
async def startup():
    logger.info("Starting InvoiceBot...")
    logger.info(f"Demo mode: {settings.demo_mode}")


if __name__ == "__main__":
    import uvicorn
    uvicorn.run("src.main:app", host="0.0.0.0", port=8000, reload=settings.debug)
