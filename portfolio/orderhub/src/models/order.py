"""Order models."""

from datetime import datetime
from decimal import Decimal
from enum import Enum
from typing import List, Optional

from sqlalchemy import (
    Column,
    DateTime,
    Enum as SQLEnum,
    ForeignKey,
    Integer,
    Numeric,
    String,
    Text,
)
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func

from src.db.database import Base


class OrderStatus(str, Enum):
    """Order fulfillment status."""

    PENDING = "pending"
    PROCESSING = "processing"
    SHIPPED = "shipped"
    DELIVERED = "delivered"
    CANCELLED = "cancelled"
    REFUNDED = "refunded"


class Order(Base):
    """Unified order from any platform."""

    __tablename__ = "orders"

    id = Column(Integer, primary_key=True, index=True)

    # Platform reference
    platform = Column(String(20), nullable=False, index=True)
    platform_order_id = Column(String(255), nullable=False, index=True)
    platform_order_number = Column(String(100), nullable=True)

    # Order details
    status = Column(SQLEnum(OrderStatus), default=OrderStatus.PENDING, nullable=False, index=True)
    order_date = Column(DateTime(timezone=True), nullable=False, index=True)

    # Customer information
    customer_name = Column(String(255), nullable=False)
    customer_email = Column(String(255), nullable=True)

    # Shipping address
    shipping_address_line1 = Column(String(255), nullable=True)
    shipping_address_line2 = Column(String(255), nullable=True)
    shipping_city = Column(String(100), nullable=True)
    shipping_state = Column(String(100), nullable=True)
    shipping_postal_code = Column(String(20), nullable=True)
    shipping_country = Column(String(100), nullable=True)

    # Financial
    subtotal = Column(Numeric(10, 2), nullable=False)
    tax = Column(Numeric(10, 2), default=Decimal("0.00"), nullable=False)
    shipping_cost = Column(Numeric(10, 2), default=Decimal("0.00"), nullable=False)
    total = Column(Numeric(10, 2), nullable=False)
    currency = Column(String(3), default="USD", nullable=False)

    # Fulfillment
    tracking_number = Column(String(255), nullable=True)
    carrier = Column(String(100), nullable=True)
    shipped_at = Column(DateTime(timezone=True), nullable=True)
    delivered_at = Column(DateTime(timezone=True), nullable=True)

    # Notes
    customer_notes = Column(Text, nullable=True)
    internal_notes = Column(Text, nullable=True)

    # Timestamps
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now(), nullable=False)
    synced_at = Column(DateTime(timezone=True), nullable=True)

    # Relationships
    items = relationship("OrderItem", back_populates="order", cascade="all, delete-orphan")


class OrderItem(Base):
    """Individual items in an order."""

    __tablename__ = "order_items"

    id = Column(Integer, primary_key=True, index=True)
    order_id = Column(Integer, ForeignKey("orders.id", ondelete="CASCADE"), nullable=False, index=True)

    # Product reference
    sku = Column(String(100), nullable=False, index=True)
    product_name = Column(String(255), nullable=False)

    # Quantity and pricing
    quantity = Column(Integer, nullable=False)
    unit_price = Column(Numeric(10, 2), nullable=False)
    total_price = Column(Numeric(10, 2), nullable=False)

    # Additional details
    variant_title = Column(String(255), nullable=True)
    product_image_url = Column(String(512), nullable=True)

    # Timestamps
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)

    # Relationships
    order = relationship("Order", back_populates="items")
