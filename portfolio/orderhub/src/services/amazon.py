"""Amazon SP-API client."""

import random
from datetime import datetime, timedelta
from typing import List, Dict, Any, Optional

from src.config import get_settings
from src.models.order import OrderStatus

settings = get_settings()


class AmazonClient:
    """Client for Amazon SP-API."""

    def __init__(
        self,
        refresh_token: str = "",
        client_id: str = "",
        client_secret: str = "",
        region: str = "us-east-1",
    ):
        """Initialize Amazon SP-API client."""
        self.refresh_token = refresh_token or settings.amazon_refresh_token
        self.client_id = client_id or settings.amazon_client_id
        self.client_secret = client_secret or settings.amazon_client_secret
        self.region = region or settings.amazon_region
        self.marketplace_id = settings.amazon_marketplace_id
        self.demo_mode = settings.demo_mode or not all([
            self.refresh_token, self.client_id, self.client_secret
        ])

    def get_orders(self, limit: int = 50, created_after: Optional[datetime] = None) -> List[Dict[str, Any]]:
        """Fetch orders from Amazon."""
        if self.demo_mode:
            return self._get_demo_orders(limit)

        # Real implementation would use Amazon SP-API
        # from sp_api.api import Orders
        # from sp_api.base import Marketplaces
        #
        # orders_api = Orders(
        #     refresh_token=self.refresh_token,
        #     marketplace=Marketplaces[self.region.upper().replace('-', '_')]
        # )
        # response = orders_api.get_orders(CreatedAfter=created_after, MaxResultsPerPage=limit)
        # return [self._format_order(order) for order in response.payload.get('Orders', [])]

        return []

    def get_order(self, order_id: str) -> Optional[Dict[str, Any]]:
        """Fetch a single order by ID."""
        if self.demo_mode:
            orders = self._get_demo_orders(1)
            if orders:
                orders[0]["id"] = order_id
                return orders[0]
            return None

        return None

    def update_order_status(self, order_id: str, status: str, tracking_number: Optional[str] = None) -> bool:
        """Update order fulfillment status."""
        if self.demo_mode:
            return True

        # Real implementation would use FulfillmentInbound or FulfillmentOutbound APIs
        return False

    def sync_inventory(self, sku: str, quantity: int) -> bool:
        """Sync inventory quantity to Amazon."""
        if self.demo_mode:
            return True

        # Real implementation would use FBAInventory API
        return False

    def _get_demo_orders(self, limit: int = 50) -> List[Dict[str, Any]]:
        """Generate demo orders for testing."""
        demo_orders = []

        products = [
            {"sku": "AMZ-BOOK-001", "name": "Bestselling Novel", "price": 19.99},
            {"sku": "AMZ-ELECT-123", "name": "Wireless Earbuds", "price": 79.99},
            {"sku": "AMZ-HOME-456", "name": "Kitchen Appliance", "price": 129.99},
            {"sku": "AMZ-TOY-789", "name": "Educational Toy Set", "price": 34.99},
        ]

        statuses = [OrderStatus.PENDING, OrderStatus.PROCESSING, OrderStatus.SHIPPED, OrderStatus.DELIVERED]

        for i in range(min(limit, 15)):
            product = random.choice(products)
            quantity = random.randint(1, 2)
            status = random.choice(statuses)

            order_date = datetime.now() - timedelta(days=random.randint(0, 30))

            order = {
                "id": f"AMZ{2000 + i}-{random.randint(1000000, 9999999)}",
                "order_number": f"AMZ-{2000 + i}",
                "platform": "amazon",
                "status": status.value,
                "order_date": order_date.isoformat(),
                "customer": {
                    "name": f"Amazon Customer {i + 1}",
                    "email": None,  # Amazon doesn't provide customer emails
                },
                "shipping_address": {
                    "line1": f"{200 + i} Commerce Boulevard",
                    "line2": None,
                    "city": random.choice(["Seattle", "Dallas", "Miami", "Denver", "Boston"]),
                    "state": random.choice(["WA", "TX", "FL", "CO", "MA"]),
                    "postal_code": f"{20000 + i}",
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
                "tax": round(product["price"] * quantity * 0.08, 2),
                "shipping_cost": 0,  # Amazon handles shipping
                "total": round(product["price"] * quantity * 1.08, 2),
                "currency": "USD",
                "tracking_number": f"TBA{random.randint(100000000, 999999999)}" if status in [OrderStatus.SHIPPED, OrderStatus.DELIVERED] else None,
                "carrier": "Amazon Logistics" if status in [OrderStatus.SHIPPED, OrderStatus.DELIVERED] else None,
            }

            demo_orders.append(order)

        return demo_orders

    def health_check(self) -> bool:
        """Check if Amazon connection is healthy."""
        if self.demo_mode:
            return True

        return bool(self.refresh_token and self.client_id and self.client_secret)
