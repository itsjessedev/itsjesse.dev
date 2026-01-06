"""API routers."""

from .posts import router as posts_router
from .prospects import router as prospects_router
from .dismissals import router as dismissals_router
from .scheduling import router as scheduling_router
from .comments import router as comments_router
from .linkedin import router as linkedin_router
from .persistence import router as persistence_router
from .linkedin_comments import router as linkedin_comments_router

__all__ = [
    "posts_router",
    "prospects_router",
    "dismissals_router",
    "scheduling_router",
    "comments_router",
    "linkedin_router",
    "persistence_router",
    "linkedin_comments_router",
]
