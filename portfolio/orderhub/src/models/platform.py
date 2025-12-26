"""Platform models."""

from datetime import datetime
from enum import Enum
from typing import Optional

from sqlalchemy import Boolean, Column, DateTime, Enum as SQLEnum, Integer, String, Text
from sqlalchemy.sql import func

from src.db.database import Base


class PlatformType(str, Enum):
    """Supported e-commerce platforms."""

    SHOPIFY = "shopify"
    AMAZON = "amazon"
    EBAY = "ebay"
    ETSY = "etsy"


class PlatformConnection(Base):
    """Platform connection configuration."""

    __tablename__ = "platform_connections"

    id = Column(Integer, primary_key=True, index=True)
    platform_type = Column(SQLEnum(PlatformType), unique=True, nullable=False, index=True)
    is_active = Column(Boolean, default=True, nullable=False)

    # Encrypted credentials (in production, use encryption)
    credentials = Column(Text, nullable=False)  # JSON string

    # Sync metadata
    last_sync_at = Column(DateTime(timezone=True), nullable=True)
    last_sync_status = Column(String(50), nullable=True)
    last_error = Column(Text, nullable=True)
    orders_synced = Column(Integer, default=0)

    # Timestamps
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now(), nullable=False)


class Platform:
    """Platform metadata (not stored in DB)."""

    def __init__(
        self,
        type: PlatformType,
        name: str,
        is_connected: bool = False,
        last_sync: Optional[datetime] = None,
        orders_count: int = 0,
    ):
        self.type = type
        self.name = name
        self.is_connected = is_connected
        self.last_sync = last_sync
        self.orders_count = orders_count
