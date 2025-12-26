"""Order aggregation service."""

from typing import List, Dict, Any, Optional
from datetime import datetime

from src.services.shopify import ShopifyClient
from src.services.amazon import AmazonClient
from src.services.ebay import EbayClient
from src.services.etsy import EtsyClient


class OrderAggregator:
    """Aggregate orders from multiple platforms."""

    def __init__(self):
        """Initialize aggregator with all platform clients."""
        self.shopify = ShopifyClient()
        self.amazon = AmazonClient()
        self.ebay = EbayClient()
        self.etsy = EtsyClient()

    def get_all_orders(
        self,
        limit_per_platform: int = 50,
        platforms: Optional[List[str]] = None
    ) -> List[Dict[str, Any]]:
        """
        Fetch and aggregate orders from all platforms.

        Args:
            limit_per_platform: Max orders to fetch per platform
            platforms: List of platforms to fetch from (None = all)

        Returns:
            Aggregated list of orders sorted by date (newest first)
        """
        all_orders = []

        # Determine which platforms to query
        active_platforms = platforms or ["shopify", "amazon", "ebay", "etsy"]

        # Fetch from each platform
        if "shopify" in active_platforms:
            try:
                shopify_orders = self.shopify.get_orders(limit=limit_per_platform)
                all_orders.extend(shopify_orders)
            except Exception as e:
                print(f"Error fetching Shopify orders: {e}")

        if "amazon" in active_platforms:
            try:
                amazon_orders = self.amazon.get_orders(limit=limit_per_platform)
                all_orders.extend(amazon_orders)
            except Exception as e:
                print(f"Error fetching Amazon orders: {e}")

        if "ebay" in active_platforms:
            try:
                ebay_orders = self.ebay.get_orders(limit=limit_per_platform)
                all_orders.extend(ebay_orders)
            except Exception as e:
                print(f"Error fetching eBay orders: {e}")

        if "etsy" in active_platforms:
            try:
                etsy_orders = self.etsy.get_orders(limit=limit_per_platform)
                all_orders.extend(etsy_orders)
            except Exception as e:
                print(f"Error fetching Etsy orders: {e}")

        # Sort by order date (newest first)
        all_orders.sort(
            key=lambda x: datetime.fromisoformat(x["order_date"]),
            reverse=True
        )

        return all_orders

    def get_platform_stats(self) -> Dict[str, Any]:
        """Get statistics for each platform."""
        stats = {
            "shopify": {
                "connected": self.shopify.health_check(),
                "orders_count": 0,
            },
            "amazon": {
                "connected": self.amazon.health_check(),
                "orders_count": 0,
            },
            "ebay": {
                "connected": self.ebay.health_check(),
                "orders_count": 0,
            },
            "etsy": {
                "connected": self.etsy.health_check(),
                "orders_count": 0,
            },
        }

        # Count orders per platform
        try:
            all_orders = self.get_all_orders()
            for order in all_orders:
                platform = order.get("platform")
                if platform in stats:
                    stats[platform]["orders_count"] += 1
        except Exception as e:
            print(f"Error getting platform stats: {e}")

        return stats

    def sync_order_status(
        self,
        platform: str,
        order_id: str,
        status: str,
        tracking_number: Optional[str] = None
    ) -> bool:
        """
        Update order status on specific platform.

        Args:
            platform: Platform name (shopify, amazon, ebay, etsy)
            order_id: Platform-specific order ID
            status: New order status
            tracking_number: Optional tracking number for shipments

        Returns:
            True if update successful
        """
        client_map = {
            "shopify": self.shopify,
            "amazon": self.amazon,
            "ebay": self.ebay,
            "etsy": self.etsy,
        }

        client = client_map.get(platform)
        if not client:
            raise ValueError(f"Unknown platform: {platform}")

        return client.update_order_status(order_id, status, tracking_number)

    def sync_inventory_across_platforms(self, sku: str, quantity: int) -> Dict[str, bool]:
        """
        Sync inventory quantity across all platforms.

        Args:
            sku: Product SKU
            quantity: New quantity

        Returns:
            Dict of platform: success status
        """
        results = {}

        clients = {
            "shopify": self.shopify,
            "amazon": self.amazon,
            "ebay": self.ebay,
            "etsy": self.etsy,
        }

        for platform, client in clients.items():
            try:
                results[platform] = client.sync_inventory(sku, quantity)
            except Exception as e:
                print(f"Error syncing inventory to {platform}: {e}")
                results[platform] = False

        return results
