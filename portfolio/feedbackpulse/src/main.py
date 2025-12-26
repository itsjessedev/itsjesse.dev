"""FastAPI application for FeedbackPulse."""

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from .config import settings
from .api import reviews_router, analysis_router, alerts_router

# Create FastAPI app
app = FastAPI(
    title=settings.app_name,
    description="Review & Survey Analyzer - Aggregate feedback from all sources, analyze sentiment, detect trends",
    version="1.0.0",
    debug=settings.debug,
)

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Configure appropriately for production
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include routers
app.include_router(reviews_router)
app.include_router(analysis_router)
app.include_router(alerts_router)


@app.get("/")
async def root():
    """Root endpoint."""
    return {
        "name": settings.app_name,
        "version": "1.0.0",
        "description": "Review & Survey Analyzer",
        "demo_mode": settings.demo_mode,
        "endpoints": {
            "reviews": "/reviews",
            "analysis": "/analysis",
            "alerts": "/alerts",
            "docs": "/docs",
        }
    }


@app.get("/health")
async def health():
    """Health check endpoint."""
    return {
        "status": "healthy",
        "demo_mode": settings.demo_mode,
        "services": {
            "openai": "available" if settings.openai_api_key else "demo_mode",
            "google_places": "available" if settings.google_places_api_key else "demo_mode",
            "yelp": "available" if settings.yelp_api_key else "demo_mode",
        }
    }


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
