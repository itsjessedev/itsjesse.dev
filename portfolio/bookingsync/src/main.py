"""BookingSync FastAPI application"""

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
import logging

from .config import settings
from .api import bookings, availability, customers

# Configure logging
logging.basicConfig(
    level=logging.INFO if settings.debug else logging.WARNING,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)

logger = logging.getLogger(__name__)

# Create FastAPI app
app = FastAPI(
    title="BookingSync API",
    description="Appointment automation system with online booking and automated reminders",
    version="1.0.0",
    debug=settings.debug
)

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins_list,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include routers
app.include_router(bookings.router, prefix="/api", tags=["bookings"])
app.include_router(availability.router, prefix="/api", tags=["availability"])
app.include_router(customers.router, prefix="/api", tags=["customers"])


@app.get("/")
async def root():
    """Root endpoint"""
    return {
        "name": "BookingSync API",
        "version": "1.0.0",
        "demo_mode": settings.demo_mode,
        "docs": "/docs"
    }


@app.get("/health")
async def health_check():
    """Health check endpoint"""
    return {
        "status": "healthy",
        "demo_mode": settings.demo_mode,
        "timestamp": "2024-01-01T00:00:00Z"
    }


if __name__ == "__main__":
    import uvicorn

    logger.info(
        f"Starting BookingSync API on {settings.api_host}:{settings.api_port}"
    )
    logger.info(f"Demo Mode: {settings.demo_mode}")

    uvicorn.run(
        "src.main:app",
        host=settings.api_host,
        port=settings.api_port,
        reload=settings.debug
    )
