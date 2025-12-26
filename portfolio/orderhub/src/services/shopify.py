"""Shopify API client."""

import random
from datetime import datetime, timedelta
from typing import List, Dict, Any, Optional

from src.config import get_settings
from src.models.order import OrderStatus

settings = get_settings()


class ShopifyClient:
    """Client for Shopify Admin API."""

    def __init__(self, shop_url: str = "", access_token: str = ""):
        """Initialize Shopify client."""
        self.shop_url = shop_url or settings.shopify_shop_url
        self.access_token = access_token or settings.shopify_access_token
        self.api_version = settings.shopify_api_version
        self.demo_mode = settings.demo_mode or not (self.shop_url and self.access_token)

    def get_orders(self, limit: int = 50, status: Optional[str] = None) -> List[Dict[str, Any]]:
        """Fetch orders from Shopify."""
        if self.demo_mode:
            return self._get_demo_orders(limit)

        # Real implementation would use Shopify API
        # import shopify
        # shopify.ShopifyResource.set_site(f"https://{self.shop_url}/admin/api/{self.api_version}")
        # shopify.Session.setup(api_key=settings.shopify_api_key, secret=settings.shopify_api_secret)
        # orders = shopify.Order.find(limit=limit, status=status)
        # return [self._format_order(order) for order in orders]

        return []

    def get_order(self, order_id: str) -> Optional[Dict[str, Any]]:
        """Fetch a single order by ID."""
        if self.demo_mode:
            orders = self._get_demo_orders(1)
            if orders:
                orders[0]["id"] = order_id
                return orders[0]
            return None

        # Real implementation
        return None

    def update_order_status(self, order_id: str, status: str, tracking_number: Optional[str] = None) -> bool:
        """Update order fulfillment status."""
        if self.demo_mode:
            return True

        # Real implementation would update via Shopify API
        return False

    def sync_inventory(self, sku: str, quantity: int) -> bool:
        """Sync inventory quantity to Shopify."""
        if self.demo_mode:
            return True

        # Real implementation would update inventory levels
        return False

    def _get_demo_orders(self, limit: int = 50) -> List[Dict[str, Any]]:
        """Generate demo orders for testing."""
        demo_orders = []

        products = [
            {"sku": "WIDGET-001", "name": "Premium Widget", "price": 29.99},
            {"sku": "GADGET-042", "name": "Smart Gadget Pro", "price": 149.99},
            {"sku": "TOOL-123", "name": "Professional Tool Set", "price": 89.99},
            {"sku": "ACC-999", "name": "Deluxe Accessory Kit", "price": 39.99},
        ]

        statuses = [OrderStatus.PENDING, OrderStatus.PROCESSING, OrderStatus.SHIPPED, OrderStatus.DELIVERED]

        for i in range(min(limit, 20)):
            product = random.choice(products)
            quantity = random.randint(1, 3)
            status = random.choice(statuses)

            order_date = datetime.now() - timedelta(days=random.randint(0, 30))

            order = {
                "id": f"SHOP{1000 + i}",
                "order_number": f"#{1000 + i}",
                "platform": "shopify",
                "status": status.value,
                "order_date": order_date.isoformat(),
                "customer": {
                    "name": f"Customer {i + 1}",
                    "email": f"customer{i+1}@example.com",
                },
                "shipping_address": {
                    "line1": f"{100 + i} Main Street",
                    "line2": f"Apt {i + 1}" if i % 3 == 0 else None,
                    "city": random.choice(["New York", "Los Angeles", "Chicago", "Houston", "Phoenix"]),
                    "state": random.choice(["NY", "CA", "IL", "TX", "AZ"]),
                    "postal_code": f"{10000 + i}",
                    "country": "US",
                },
                "items": [
                    {
                        "sku": product["sku"],
                        "name": product["name"],
                        "quantity": quantity,
                        "unit_price": product["price"],
                        "total_price": product["price"] * quantity,
                    }
                ],
                "subtotal": product["price"] * quantity,
                "tax": round(product["price"] * quantity * 0.0875, 2),
                "shipping_cost": 5.99 if product["price"] * quantity < 50 else 0,
                "total": round(product["price"] * quantity * 1.0875 + (5.99 if product["price"] * quantity < 50 else 0), 2),
                "currency": "USD",
                "tracking_number": f"1Z999AA1{i:08d}" if status in [OrderStatus.SHIPPED, OrderStatus.DELIVERED] else None,
                "carrier": "UPS" if status in [OrderStatus.SHIPPED, OrderStatus.DELIVERED] else None,
            }

            demo_orders.append(order)

        return demo_orders

    def health_check(self) -> bool:
        """Check if Shopify connection is healthy."""
        if self.demo_mode:
            return True

        # Real implementation would test API connection
        return bool(self.shop_url and self.access_token)
