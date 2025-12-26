"""OrderHub FastAPI application."""

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from src.api import api_router
from src.config import get_settings
from src.db.database import init_db

settings = get_settings()

# Create FastAPI app
app = FastAPI(
    title=settings.app_name,
    description="Multi-Platform E-commerce Aggregator",
    version="1.0.0",
    debug=settings.debug,
)

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include API routes
app.include_router(api_router, prefix="/api")


@app.on_event("startup")
async def startup_event():
    """Initialize database on startup."""
    init_db()
    print(f"OrderHub started in {'DEMO' if settings.demo_mode else 'PRODUCTION'} mode")


@app.get("/")
async def root():
    """Root endpoint."""
    return {
        "app": settings.app_name,
        "version": "1.0.0",
        "demo_mode": settings.demo_mode,
        "docs": "/docs",
        "api": "/api"
    }


@app.get("/health")
async def health_check():
    """Health check endpoint."""
    return {
        "status": "healthy",
        "demo_mode": settings.demo_mode
    }


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(
        "src.main:app",
        host="0.0.0.0",
        port=8000,
        reload=settings.debug
    )
