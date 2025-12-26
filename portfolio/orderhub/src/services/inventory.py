"""Inventory management service."""

from datetime import datetime
from typing import Optional

from sqlalchemy.orm import Session

from src.models.product import Product, InventoryLog


class InventoryService:
    """Service for managing inventory across platforms."""

    def __init__(self, db: Session):
        """Initialize inventory service."""
        self.db = db

    def get_product(self, sku: str) -> Optional[Product]:
        """Get product by SKU."""
        return self.db.query(Product).filter(Product.sku == sku).first()

    def update_quantity(
        self,
        sku: str,
        quantity_change: int,
        change_type: str,
        platform: Optional[str] = None,
        order_id: Optional[int] = None,
        reason: Optional[str] = None,
        notes: Optional[str] = None,
    ) -> Optional[Product]:
        """
        Update product quantity and log the change.

        Args:
            sku: Product SKU
            quantity_change: Amount to change (positive or negative)
            change_type: Type of change (sale, restock, adjustment, sync)
            platform: Platform where change originated
            order_id: Related order ID if applicable
            reason: Reason for change
            notes: Additional notes

        Returns:
            Updated product or None if not found
        """
        product = self.get_product(sku)
        if not product:
            return None

        # Record before quantity
        quantity_before = product.quantity_available

        # Update quantity
        product.quantity_available += quantity_change
        product.updated_at = datetime.utcnow()

        # Prevent negative inventory
        if product.quantity_available < 0:
            product.quantity_available = 0

        quantity_after = product.quantity_available

        # Create audit log
        log = InventoryLog(
            sku=sku,
            change_type=change_type,
            quantity_before=quantity_before,
            quantity_after=quantity_after,
            quantity_change=quantity_change,
            platform=platform,
            order_id=order_id,
            reason=reason,
            notes=notes,
        )

        self.db.add(log)
        self.db.commit()
        self.db.refresh(product)

        return product

    def reserve_inventory(self, sku: str, quantity: int, order_id: int) -> bool:
        """
        Reserve inventory for an order.

        Args:
            sku: Product SKU
            quantity: Quantity to reserve
            order_id: Order ID

        Returns:
            True if reservation successful
        """
        product = self.get_product(sku)
        if not product:
            return False

        # Check if enough available
        if product.quantity_available < quantity:
            return False

        # Move from available to reserved
        product.quantity_available -= quantity
        product.quantity_reserved += quantity
        product.updated_at = datetime.utcnow()

        # Log the reservation
        log = InventoryLog(
            sku=sku,
            change_type="reservation",
            quantity_before=product.quantity_available + quantity,
            quantity_after=product.quantity_available,
            quantity_change=-quantity,
            order_id=order_id,
            reason="Order placed",
        )

        self.db.add(log)
        self.db.commit()

        return True

    def release_reservation(self, sku: str, quantity: int, order_id: int, reason: str = "Order cancelled") -> bool:
        """
        Release reserved inventory back to available.

        Args:
            sku: Product SKU
            quantity: Quantity to release
            order_id: Order ID
            reason: Reason for release

        Returns:
            True if release successful
        """
        product = self.get_product(sku)
        if not product:
            return False

        # Move from reserved back to available
        product.quantity_reserved -= quantity
        product.quantity_available += quantity
        product.updated_at = datetime.utcnow()

        # Prevent negative reserved
        if product.quantity_reserved < 0:
            product.quantity_reserved = 0

        # Log the release
        log = InventoryLog(
            sku=sku,
            change_type="release",
            quantity_before=product.quantity_available - quantity,
            quantity_after=product.quantity_available,
            quantity_change=quantity,
            order_id=order_id,
            reason=reason,
        )

        self.db.add(log)
        self.db.commit()

        return True

    def check_reorder_needed(self, sku: str) -> bool:
        """
        Check if product needs reordering.

        Args:
            sku: Product SKU

        Returns:
            True if quantity is at or below reorder point
        """
        product = self.get_product(sku)
        if not product:
            return False

        return product.quantity_available <= product.reorder_point

    def get_inventory_logs(self, sku: str, limit: int = 50) -> list:
        """
        Get inventory change history for a product.

        Args:
            sku: Product SKU
            limit: Max number of logs to return

        Returns:
            List of inventory logs
        """
        return (
            self.db.query(InventoryLog)
            .filter(InventoryLog.sku == sku)
            .order_by(InventoryLog.created_at.desc())
            .limit(limit)
            .all()
        )
