"""Configuration management."""

from pydantic_settings import BaseSettings
from typing import Literal


class Settings(BaseSettings):
    """Application settings."""

    # Demo Mode
    demo_mode: bool = True

    # Database Configuration
    access_db_path: str = ""
    access_db_driver: str = "{Microsoft Access Driver (*.mdb, *.accdb)}"

    # HubSpot Configuration
    hubspot_api_key: str = ""
    hubspot_account_id: str = ""

    # Airtable Configuration
    airtable_api_key: str = ""
    airtable_base_id: str = ""
    airtable_table_name: str = ""

    # Migration Settings
    max_batch_size: int = 1000
    enable_rollback: bool = True
    validation_level: Literal["strict", "medium", "lenient"] = "strict"

    # API Settings
    api_host: str = "0.0.0.0"
    api_port: int = 8000

    class Config:
        env_file = ".env"
        case_sensitive = False


settings = Settings()
