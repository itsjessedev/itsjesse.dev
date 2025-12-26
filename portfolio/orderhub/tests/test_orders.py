"""Tests for order aggregation."""

import pytest
from fastapi.testclient import TestClient

from src.main import app
from src.services.aggregator import OrderAggregator
from src.services.shopify import ShopifyClient
from src.services.amazon import AmazonClient
from src.services.ebay import EbayClient
from src.services.etsy import EtsyClient

client = TestClient(app)


class TestPlatformClients:
    """Test individual platform clients."""

    def test_shopify_demo_orders(self):
        """Test Shopify client returns demo orders."""
        shopify = ShopifyClient()
        orders = shopify.get_orders(limit=10)

        assert len(orders) > 0
        assert all(order["platform"] == "shopify" for order in orders)
        assert all("id" in order for order in orders)
        assert all("customer" in order for order in orders)

    def test_amazon_demo_orders(self):
        """Test Amazon client returns demo orders."""
        amazon = AmazonClient()
        orders = amazon.get_orders(limit=10)

        assert len(orders) > 0
        assert all(order["platform"] == "amazon" for order in orders)

    def test_ebay_demo_orders(self):
        """Test eBay client returns demo orders."""
        ebay = EbayClient()
        orders = ebay.get_orders(limit=10)

        assert len(orders) > 0
        assert all(order["platform"] == "ebay" for order in orders)

    def test_etsy_demo_orders(self):
        """Test Etsy client returns demo orders."""
        etsy = EtsyClient()
        orders = etsy.get_orders(limit=10)

        assert len(orders) > 0
        assert all(order["platform"] == "etsy" for order in orders)


class TestOrderAggregator:
    """Test order aggregation service."""

    def test_get_all_orders(self):
        """Test aggregating orders from all platforms."""
        aggregator = OrderAggregator()
        orders = aggregator.get_all_orders(limit_per_platform=10)

        assert len(orders) > 0

        # Verify we have orders from multiple platforms
        platforms = set(order["platform"] for order in orders)
        assert len(platforms) > 1

    def test_platform_filter(self):
        """Test filtering orders by platform."""
        aggregator = OrderAggregator()
        orders = aggregator.get_all_orders(
            limit_per_platform=10,
            platforms=["shopify"]
        )

        assert all(order["platform"] == "shopify" for order in orders)

    def test_order_sorting(self):
        """Test orders are sorted by date (newest first)."""
        aggregator = OrderAggregator()
        orders = aggregator.get_all_orders(limit_per_platform=10)

        from datetime import datetime
        dates = [datetime.fromisoformat(order["order_date"]) for order in orders]

        # Verify descending order
        assert dates == sorted(dates, reverse=True)

    def test_platform_stats(self):
        """Test platform statistics."""
        aggregator = OrderAggregator()
        stats = aggregator.get_platform_stats()

        assert "shopify" in stats
        assert "amazon" in stats
        assert "ebay" in stats
        assert "etsy" in stats

        assert all(stats[p]["connected"] for p in stats)


class TestOrdersAPI:
    """Test orders API endpoints."""

    def test_list_orders(self):
        """Test GET /api/orders endpoint."""
        response = client.get("/api/orders?limit=20")
        assert response.status_code == 200

        data = response.json()
        assert isinstance(data, list)
        assert len(data) > 0

        # Verify order structure
        order = data[0]
        assert "id" in order
        assert "platform" in order
        assert "status" in order
        assert "customer_name" in order
        assert "total" in order
        assert "items" in order

    def test_filter_by_platform(self):
        """Test filtering orders by platform."""
        response = client.get("/api/orders?platform=shopify&limit=10")
        assert response.status_code == 200

        data = response.json()
        assert all(order["platform"] == "shopify" for order in data)

    def test_filter_by_status(self):
        """Test filtering orders by status."""
        response = client.get("/api/orders?status=shipped&limit=20")
        assert response.status_code == 200

        data = response.json()
        if len(data) > 0:
            assert all(order["status"] == "shipped" for order in data)

    def test_sync_orders(self):
        """Test POST /api/orders/sync endpoint."""
        response = client.post("/api/orders/sync")
        assert response.status_code == 200

        data = response.json()
        assert data["success"] is True
        assert data["orders_synced"] > 0
        assert len(data["platforms_synced"]) > 0


class TestPlatformsAPI:
    """Test platforms API endpoints."""

    def test_list_platforms(self):
        """Test GET /api/platforms endpoint."""
        response = client.get("/api/platforms")
        assert response.status_code == 200

        data = response.json()
        assert "platforms" in data
        assert "total_orders" in data

        platforms = data["platforms"]
        assert len(platforms) == 4

        platform_types = {p["type"] for p in platforms}
        assert platform_types == {"shopify", "amazon", "ebay", "etsy"}

    def test_platform_health_check(self):
        """Test platform health check endpoint."""
        response = client.get("/api/platforms/shopify/health")
        assert response.status_code == 200

        data = response.json()
        assert data["platform"] == "shopify"
        assert "healthy" in data
        assert "demo_mode" in data


class TestAppEndpoints:
    """Test main application endpoints."""

    def test_root_endpoint(self):
        """Test GET / endpoint."""
        response = client.get("/")
        assert response.status_code == 200

        data = response.json()
        assert data["app"] == "OrderHub"
        assert "version" in data

    def test_health_check(self):
        """Test GET /health endpoint."""
        response = client.get("/health")
        assert response.status_code == 200

        data = response.json()
        assert data["status"] == "healthy"

    def test_openapi_docs(self):
        """Test OpenAPI documentation is accessible."""
        response = client.get("/docs")
        assert response.status_code == 200
