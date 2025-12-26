"""Orders API endpoints."""

from typing import List, Optional
from datetime import datetime

from fastapi import APIRouter, Depends, HTTPException, Query
from pydantic import BaseModel
from sqlalchemy.orm import Session

from src.db.database import get_db
from src.models.order import Order, OrderStatus
from src.services.aggregator import OrderAggregator

router = APIRouter()


class OrderItemResponse(BaseModel):
    """Order item response model."""
    sku: str
    name: str
    quantity: int
    unit_price: float
    total_price: float
    variant_title: Optional[str] = None


class OrderResponse(BaseModel):
    """Order response model."""
    id: str
    platform: str
    order_number: Optional[str]
    status: str
    order_date: str
    customer_name: str
    customer_email: Optional[str]
    subtotal: float
    tax: float
    shipping_cost: float
    total: float
    currency: str
    tracking_number: Optional[str] = None
    carrier: Optional[str] = None
    items: List[OrderItemResponse]


class OrderUpdateRequest(BaseModel):
    """Order update request model."""
    status: Optional[OrderStatus] = None
    tracking_number: Optional[str] = None
    carrier: Optional[str] = None


class SyncResponse(BaseModel):
    """Sync response model."""
    success: bool
    orders_synced: int
    platforms_synced: List[str]
    timestamp: datetime


@router.get("/", response_model=List[OrderResponse])
async def list_orders(
    platform: Optional[str] = Query(None, description="Filter by platform"),
    status: Optional[OrderStatus] = Query(None, description="Filter by status"),
    limit: int = Query(100, ge=1, le=500, description="Max orders to return"),
    db: Session = Depends(get_db),
):
    """
    List all orders from all platforms.

    - **platform**: Filter by specific platform (shopify, amazon, ebay, etsy)
    - **status**: Filter by order status
    - **limit**: Maximum orders to return per platform
    """
    aggregator = OrderAggregator()

    # Determine which platforms to fetch from
    platforms = [platform] if platform else None

    # Get orders from aggregator
    orders = aggregator.get_all_orders(
        limit_per_platform=limit,
        platforms=platforms
    )

    # Filter by status if specified
    if status:
        orders = [o for o in orders if o.get("status") == status.value]

    # Convert to response format
    response_orders = []
    for order in orders:
        items = [
            OrderItemResponse(
                sku=item["sku"],
                name=item["name"],
                quantity=item["quantity"],
                unit_price=float(item["unit_price"]),
                total_price=float(item["total_price"]),
                variant_title=item.get("variant_title")
            )
            for item in order.get("items", [])
        ]

        response_orders.append(OrderResponse(
            id=order["id"],
            platform=order["platform"],
            order_number=order.get("order_number"),
            status=order["status"],
            order_date=order["order_date"],
            customer_name=order["customer"]["name"],
            customer_email=order["customer"].get("email"),
            subtotal=float(order["subtotal"]),
            tax=float(order["tax"]),
            shipping_cost=float(order["shipping_cost"]),
            total=float(order["total"]),
            currency=order["currency"],
            tracking_number=order.get("tracking_number"),
            carrier=order.get("carrier"),
            items=items
        ))

    return response_orders


@router.get("/{order_id}", response_model=OrderResponse)
async def get_order(
    order_id: str,
    db: Session = Depends(get_db),
):
    """
    Get a specific order by ID.

    - **order_id**: Platform-specific order ID
    """
    # In demo mode, return from aggregator
    aggregator = OrderAggregator()
    orders = aggregator.get_all_orders(limit_per_platform=100)

    order = next((o for o in orders if o["id"] == order_id), None)
    if not order:
        raise HTTPException(status_code=404, detail="Order not found")

    items = [
        OrderItemResponse(
            sku=item["sku"],
            name=item["name"],
            quantity=item["quantity"],
            unit_price=float(item["unit_price"]),
            total_price=float(item["total_price"]),
            variant_title=item.get("variant_title")
        )
        for item in order.get("items", [])
    ]

    return OrderResponse(
        id=order["id"],
        platform=order["platform"],
        order_number=order.get("order_number"),
        status=order["status"],
        order_date=order["order_date"],
        customer_name=order["customer"]["name"],
        customer_email=order["customer"].get("email"),
        subtotal=float(order["subtotal"]),
        tax=float(order["tax"]),
        shipping_cost=float(order["shipping_cost"]),
        total=float(order["total"]),
        currency=order["currency"],
        tracking_number=order.get("tracking_number"),
        carrier=order.get("carrier"),
        items=items
    )


@router.patch("/{order_id}", response_model=OrderResponse)
async def update_order(
    order_id: str,
    update: OrderUpdateRequest,
    db: Session = Depends(get_db),
):
    """
    Update an order's status and tracking information.

    - **order_id**: Platform-specific order ID
    - **status**: New order status
    - **tracking_number**: Tracking number for shipments
    - **carrier**: Shipping carrier
    """
    # Get the order first
    aggregator = OrderAggregator()
    orders = aggregator.get_all_orders(limit_per_platform=100)

    order = next((o for o in orders if o["id"] == order_id), None)
    if not order:
        raise HTTPException(status_code=404, detail="Order not found")

    # Update on the platform
    if update.status:
        success = aggregator.sync_order_status(
            platform=order["platform"],
            order_id=order_id,
            status=update.status.value,
            tracking_number=update.tracking_number
        )

        if not success:
            raise HTTPException(status_code=500, detail="Failed to update order on platform")

        # Update local data
        order["status"] = update.status.value

    if update.tracking_number:
        order["tracking_number"] = update.tracking_number

    if update.carrier:
        order["carrier"] = update.carrier

    # Return updated order
    items = [
        OrderItemResponse(
            sku=item["sku"],
            name=item["name"],
            quantity=item["quantity"],
            unit_price=float(item["unit_price"]),
            total_price=float(item["total_price"]),
            variant_title=item.get("variant_title")
        )
        for item in order.get("items", [])
    ]

    return OrderResponse(
        id=order["id"],
        platform=order["platform"],
        order_number=order.get("order_number"),
        status=order["status"],
        order_date=order["order_date"],
        customer_name=order["customer"]["name"],
        customer_email=order["customer"].get("email"),
        subtotal=float(order["subtotal"]),
        tax=float(order["tax"]),
        shipping_cost=float(order["shipping_cost"]),
        total=float(order["total"]),
        currency=order["currency"],
        tracking_number=order.get("tracking_number"),
        carrier=order.get("carrier"),
        items=items
    )


@router.post("/sync", response_model=SyncResponse)
async def sync_orders(
    platforms: Optional[List[str]] = Query(None, description="Platforms to sync"),
    db: Session = Depends(get_db),
):
    """
    Force synchronization of orders from all platforms.

    - **platforms**: Optional list of specific platforms to sync
    """
    aggregator = OrderAggregator()

    # Get orders to trigger sync
    orders = aggregator.get_all_orders(
        limit_per_platform=100,
        platforms=platforms
    )

    # Determine which platforms were synced
    synced_platforms = list(set(order["platform"] for order in orders))

    return SyncResponse(
        success=True,
        orders_synced=len(orders),
        platforms_synced=synced_platforms,
        timestamp=datetime.utcnow()
    )
