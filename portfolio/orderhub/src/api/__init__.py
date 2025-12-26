"""API routes package."""

from fastapi import APIRouter

from src.api import inventory, orders, platforms

api_router = APIRouter()

api_router.include_router(orders.router, prefix="/orders", tags=["orders"])
api_router.include_router(inventory.router, prefix="/inventory", tags=["inventory"])
api_router.include_router(platforms.router, prefix="/platforms", tags=["platforms"])

__all__ = ["api_router"]
