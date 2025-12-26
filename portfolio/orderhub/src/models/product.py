"""Product and inventory models."""

from datetime import datetime
from decimal import Decimal

from sqlalchemy import Column, DateTime, Integer, Numeric, String, Text
from sqlalchemy.sql import func

from src.db.database import Base


class Product(Base):
    """Product catalog with inventory tracking."""

    __tablename__ = "products"

    id = Column(Integer, primary_key=True, index=True)

    # Product identification
    sku = Column(String(100), unique=True, nullable=False, index=True)
    name = Column(String(255), nullable=False)
    description = Column(Text, nullable=True)

    # Inventory
    quantity_available = Column(Integer, default=0, nullable=False)
    quantity_reserved = Column(Integer, default=0, nullable=False)
    reorder_point = Column(Integer, default=10, nullable=False)
    reorder_quantity = Column(Integer, default=50, nullable=False)

    # Pricing
    cost = Column(Numeric(10, 2), nullable=True)
    price = Column(Numeric(10, 2), nullable=True)

    # Product details
    weight = Column(Numeric(10, 2), nullable=True)  # in pounds
    weight_unit = Column(String(10), default="lb", nullable=False)
    category = Column(String(100), nullable=True)
    brand = Column(String(100), nullable=True)

    # Images
    image_url = Column(String(512), nullable=True)

    # Platform sync status
    shopify_product_id = Column(String(100), nullable=True)
    amazon_asin = Column(String(20), nullable=True)
    ebay_item_id = Column(String(100), nullable=True)
    etsy_listing_id = Column(String(100), nullable=True)

    # Timestamps
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now(), nullable=False)
    last_synced_at = Column(DateTime(timezone=True), nullable=True)


class InventoryLog(Base):
    """Audit trail for inventory changes."""

    __tablename__ = "inventory_logs"

    id = Column(Integer, primary_key=True, index=True)

    # Product reference
    sku = Column(String(100), nullable=False, index=True)

    # Change details
    change_type = Column(String(50), nullable=False)  # sale, restock, adjustment, sync
    quantity_before = Column(Integer, nullable=False)
    quantity_after = Column(Integer, nullable=False)
    quantity_change = Column(Integer, nullable=False)

    # Context
    platform = Column(String(20), nullable=True)
    order_id = Column(Integer, nullable=True)
    reason = Column(String(255), nullable=True)
    notes = Column(Text, nullable=True)

    # Timestamp
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)
