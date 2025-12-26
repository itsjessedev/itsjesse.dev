"""Inventory API endpoints."""

from typing import List, Optional

from fastapi import APIRouter, Depends, HTTPException, Query
from pydantic import BaseModel
from sqlalchemy.orm import Session

from src.db.database import get_db
from src.models.product import Product, InventoryLog
from src.services.inventory import InventoryService
from src.services.aggregator import OrderAggregator

router = APIRouter()


class ProductResponse(BaseModel):
    """Product response model."""
    sku: str
    name: str
    description: Optional[str]
    quantity_available: int
    quantity_reserved: int
    reorder_point: int
    reorder_quantity: int
    price: Optional[float]
    cost: Optional[float]
    needs_reorder: bool

    class Config:
        from_attributes = True


class InventoryUpdateRequest(BaseModel):
    """Inventory update request model."""
    quantity: int
    sync_platforms: bool = True


class InventoryLogResponse(BaseModel):
    """Inventory log response model."""
    id: int
    sku: str
    change_type: str
    quantity_before: int
    quantity_after: int
    quantity_change: int
    platform: Optional[str]
    order_id: Optional[int]
    reason: Optional[str]
    created_at: str

    class Config:
        from_attributes = True


class PlatformSyncResponse(BaseModel):
    """Platform sync response model."""
    sku: str
    quantity: int
    platforms_synced: dict


@router.get("/", response_model=List[ProductResponse])
async def list_inventory(
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=500),
    low_stock: bool = Query(False, description="Show only low stock items"),
    db: Session = Depends(get_db),
):
    """
    List all products in inventory.

    - **skip**: Number of records to skip
    - **limit**: Max records to return
    - **low_stock**: Filter for items at or below reorder point
    """
    query = db.query(Product)

    if low_stock:
        query = query.filter(Product.quantity_available <= Product.reorder_point)

    products = query.offset(skip).limit(limit).all()

    return [
        ProductResponse(
            sku=p.sku,
            name=p.name,
            description=p.description,
            quantity_available=p.quantity_available,
            quantity_reserved=p.quantity_reserved,
            reorder_point=p.reorder_point,
            reorder_quantity=p.reorder_quantity,
            price=float(p.price) if p.price else None,
            cost=float(p.cost) if p.cost else None,
            needs_reorder=p.quantity_available <= p.reorder_point
        )
        for p in products
    ]


@router.get("/{sku}", response_model=ProductResponse)
async def get_product(
    sku: str,
    db: Session = Depends(get_db),
):
    """
    Get a specific product by SKU.

    - **sku**: Product SKU
    """
    service = InventoryService(db)
    product = service.get_product(sku)

    if not product:
        raise HTTPException(status_code=404, detail="Product not found")

    return ProductResponse(
        sku=product.sku,
        name=product.name,
        description=product.description,
        quantity_available=product.quantity_available,
        quantity_reserved=product.quantity_reserved,
        reorder_point=product.reorder_point,
        reorder_quantity=product.reorder_quantity,
        price=float(product.price) if product.price else None,
        cost=float(product.cost) if product.cost else None,
        needs_reorder=product.quantity_available <= product.reorder_point
    )


@router.patch("/{sku}", response_model=ProductResponse)
async def update_inventory(
    sku: str,
    update: InventoryUpdateRequest,
    db: Session = Depends(get_db),
):
    """
    Update inventory quantity for a product.

    - **sku**: Product SKU
    - **quantity**: New quantity (absolute, not delta)
    - **sync_platforms**: Whether to sync to all platforms
    """
    service = InventoryService(db)
    product = service.get_product(sku)

    if not product:
        raise HTTPException(status_code=404, detail="Product not found")

    # Calculate change
    quantity_change = update.quantity - product.quantity_available

    # Update inventory
    updated_product = service.update_quantity(
        sku=sku,
        quantity_change=quantity_change,
        change_type="adjustment",
        reason="Manual update via API"
    )

    # Sync to platforms if requested
    if update.sync_platforms:
        aggregator = OrderAggregator()
        aggregator.sync_inventory_across_platforms(sku, update.quantity)

    return ProductResponse(
        sku=updated_product.sku,
        name=updated_product.name,
        description=updated_product.description,
        quantity_available=updated_product.quantity_available,
        quantity_reserved=updated_product.quantity_reserved,
        reorder_point=updated_product.reorder_point,
        reorder_quantity=updated_product.reorder_quantity,
        price=float(updated_product.price) if updated_product.price else None,
        cost=float(updated_product.cost) if updated_product.cost else None,
        needs_reorder=updated_product.quantity_available <= updated_product.reorder_point
    )


@router.post("/sync", response_model=PlatformSyncResponse)
async def sync_inventory(
    sku: str = Query(..., description="Product SKU"),
    quantity: int = Query(..., description="Quantity to sync"),
    db: Session = Depends(get_db),
):
    """
    Sync inventory across all platforms.

    - **sku**: Product SKU
    - **quantity**: Quantity to sync to all platforms
    """
    service = InventoryService(db)
    product = service.get_product(sku)

    if not product:
        raise HTTPException(status_code=404, detail="Product not found")

    # Sync to all platforms
    aggregator = OrderAggregator()
    results = aggregator.sync_inventory_across_platforms(sku, quantity)

    return PlatformSyncResponse(
        sku=sku,
        quantity=quantity,
        platforms_synced=results
    )


@router.get("/{sku}/logs", response_model=List[InventoryLogResponse])
async def get_inventory_logs(
    sku: str,
    limit: int = Query(50, ge=1, le=500),
    db: Session = Depends(get_db),
):
    """
    Get inventory change history for a product.

    - **sku**: Product SKU
    - **limit**: Max logs to return
    """
    service = InventoryService(db)
    logs = service.get_inventory_logs(sku, limit)

    return [
        InventoryLogResponse(
            id=log.id,
            sku=log.sku,
            change_type=log.change_type,
            quantity_before=log.quantity_before,
            quantity_after=log.quantity_after,
            quantity_change=log.quantity_change,
            platform=log.platform,
            order_id=log.order_id,
            reason=log.reason,
            created_at=log.created_at.isoformat()
        )
        for log in logs
    ]
