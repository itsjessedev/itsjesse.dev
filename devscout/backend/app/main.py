"""Reddit Scout API - Find relevant posts and generate responses."""

from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import PlainTextResponse

from .database import init_db
from .routers import posts_router


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Initialize database on startup."""
    await init_db()
    yield


app = FastAPI(
    title="Reddit Scout",
    description="Find relevant Reddit posts and generate responses",
    version="1.0.0",
    lifespan=lifespan,
    # Disable docs for stealth
    docs_url=None,
    redoc_url=None,
    openapi_url=None,
)

# CORS for frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["https://rscout.junipr.io", "http://localhost:3000", "http://localhost:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# Stealth headers middleware
@app.middleware("http")
async def add_stealth_headers(request, call_next):
    """Add headers to prevent indexing."""
    response = await call_next(request)
    response.headers["X-Robots-Tag"] = "noindex, nofollow, noarchive, nosnippet"
    return response


# Robots.txt - block everything
@app.get("/robots.txt", response_class=PlainTextResponse)
async def robots_txt():
    """Serve robots.txt that blocks all crawlers."""
    return """User-agent: *
Disallow: /

# No indexing, no archiving, no nothing
User-agent: Googlebot
Disallow: /

User-agent: Bingbot
Disallow: /

User-agent: *
Disallow: /
"""


# Health check
@app.get("/health")
async def health():
    """Health check endpoint."""
    return {"status": "ok"}


# Register routers
app.include_router(posts_router)
