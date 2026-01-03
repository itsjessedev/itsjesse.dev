"""API routers."""

from .posts import router as posts_router
from .prospects import router as prospects_router

__all__ = ["posts_router", "prospects_router"]
