"""FastAPI application."""

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from .api import migrations_router, mappings_router, validation_router
from .config import settings

app = FastAPI(
    title="DataBridge",
    description="Legacy System Migration Tool",
    version="1.0.0",
)

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include routers
app.include_router(migrations_router)
app.include_router(mappings_router)
app.include_router(validation_router)


@app.get("/")
async def root():
    """Root endpoint."""
    return {
        "name": "DataBridge",
        "version": "1.0.0",
        "description": "Legacy System Migration Tool",
        "demo_mode": settings.demo_mode,
    }


@app.get("/health")
async def health_check():
    """Health check endpoint."""
    return {"status": "healthy"}


if __name__ == "__main__":
    import uvicorn

    uvicorn.run(
        "src.main:app",
        host=settings.api_host,
        port=settings.api_port,
        reload=True,
    )
