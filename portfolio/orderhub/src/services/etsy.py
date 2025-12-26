"""Etsy API client."""

import random
from datetime import datetime, timedelta
from typing import List, Dict, Any, Optional

from src.config import get_settings
from src.models.order import OrderStatus

settings = get_settings()


class EtsyClient:
    """Client for Etsy Open API."""

    def __init__(
        self,
        api_key: str = "",
        shop_id: str = "",
        access_token: str = "",
    ):
        """Initialize Etsy client."""
        self.api_key = api_key or settings.etsy_api_key
        self.shop_id = shop_id or settings.etsy_shop_id
        self.access_token = access_token or settings.etsy_access_token
        self.demo_mode = settings.demo_mode or not all([
            self.api_key, self.shop_id, self.access_token
        ])

    def get_orders(self, limit: int = 50, days: int = 30) -> List[Dict[str, Any]]:
        """Fetch orders from Etsy."""
        if self.demo_mode:
            return self._get_demo_orders(limit)

        # Real implementation would use Etsy Open API v3
        # import requests
        #
        # headers = {
        #     'x-api-key': self.api_key,
        #     'Authorization': f'Bearer {self.access_token}',
        # }
        # response = requests.get(
        #     f'https://openapi.etsy.com/v3/application/shops/{self.shop_id}/receipts',
        #     headers=headers,
        #     params={'limit': limit, 'was_paid': True}
        # )
        # return [self._format_order(order) for order in response.json().get('results', [])]

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

        # Real implementation would use updateShopReceipt endpoint
        return False

    def sync_inventory(self, sku: str, quantity: int) -> bool:
        """Sync inventory quantity to Etsy."""
        if self.demo_mode:
            return True

        # Real implementation would use updateListingInventory
        return False

    def _get_demo_orders(self, limit: int = 50) -> List[Dict[str, Any]]:
        """Generate demo orders for testing."""
        demo_orders = []

        products = [
            {"sku": "ETSY-CRAFT-001", "name": "Handmade Ceramic Mug", "price": 24.99},
            {"sku": "ETSY-ART-234", "name": "Custom Portrait Print", "price": 49.99},
            {"sku": "ETSY-JEWELRY-567", "name": "Sterling Silver Necklace", "price": 89.99},
            {"sku": "ETSY-DECOR-890", "name": "Rustic Wall Hanging", "price": 39.99},
        ]

        statuses = [OrderStatus.PENDING, OrderStatus.PROCESSING, OrderStatus.SHIPPED, OrderStatus.DELIVERED]

        for i in range(min(limit, 10)):
            product = random.choice(products)
            quantity = 1  # Etsy orders often single items
            status = random.choice(statuses)

            order_date = datetime.now() - timedelta(days=random.randint(0, 30))

            order = {
                "id": f"ETSY{4000 + i}",
                "order_number": f"ETSY-{4000 + i}",
                "platform": "etsy",
                "status": status.value,
                "order_date": order_date.isoformat(),
                "customer": {
                    "name": f"Etsy Shopper {i + 1}",
                    "email": f"etsyshopper{i+1}@example.com",
                },
                "shipping_address": {
                    "line1": f"{400 + i} Artisan Lane",
                    "line2": None,
                    "city": random.choice(["Brooklyn", "Nashville", "Asheville", "Santa Fe", "Madison"]),
                    "state": random.choice(["NY", "TN", "NC", "NM", "WI"]),
                    "postal_code": f"{40000 + i}",
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
                "tax": round(product["price"] * quantity * 0.0825, 2),
                "shipping_cost": 4.99,
                "total": round(product["price"] * quantity * 1.0825 + 4.99, 2),
                "currency": "USD",
                "tracking_number": f"9205{random.randint(5000000000, 5999999999)}" if status in [OrderStatus.SHIPPED, OrderStatus.DELIVERED] else None,
                "carrier": "USPS First Class" if status in [OrderStatus.SHIPPED, OrderStatus.DELIVERED] else None,
            }

            demo_orders.append(order)

        return demo_orders

    def health_check(self) -> bool:
        """Check if Etsy connection is healthy."""
        if self.demo_mode:
            return True

        return bool(self.api_key and self.shop_id and self.access_token)
