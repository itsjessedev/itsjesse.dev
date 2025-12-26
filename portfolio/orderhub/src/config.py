"""Application configuration."""

from functools import lru_cache
from typing import List

from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    """Application settings."""

    # Application
    app_name: str = "OrderHub"
    debug: bool = True
    demo_mode: bool = True
    secret_key: str = "dev-secret-key-change-in-production"

    # Database
    database_url: str = "postgresql://orderhub:orderhub@localhost:5432/orderhub"

    # Redis
    redis_url: str = "redis://localhost:6379/0"

    # CORS
    cors_origins: List[str] = ["http://localhost:3000", "http://localhost:8000"]

    # Shopify
    shopify_shop_url: str = ""
    shopify_access_token: str = ""
    shopify_api_version: str = "2024-01"

    # Amazon
    amazon_refresh_token: str = ""
    amazon_client_id: str = ""
    amazon_client_secret: str = ""
    amazon_region: str = "us-east-1"
    amazon_marketplace_id: str = "ATVPDKIKX0DER"

    # eBay
    ebay_app_id: str = ""
    ebay_cert_id: str = ""
    ebay_dev_id: str = ""
    ebay_user_token: str = ""
    ebay_environment: str = "production"

    # Etsy
    etsy_api_key: str = ""
    etsy_shop_id: str = ""
    etsy_access_token: str = ""

    # Sync settings
    sync_interval_minutes: int = 5
    max_orders_per_sync: int = 100

    # Logging
    log_level: str = "INFO"
    log_format: str = "json"

    class Config:
        """Pydantic config."""
        env_file = ".env"
        case_sensitive = False


@lru_cache()
def get_settings() -> Settings:
    """Get cached settings instance."""
    return Settings()
