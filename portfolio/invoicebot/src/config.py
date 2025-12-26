"""Application configuration."""

from pydantic_settings import BaseSettings
from pydantic import Field


class Settings(BaseSettings):
    """Settings loaded from environment."""

    # App
    demo_mode: bool = Field(default=False)
    debug: bool = Field(default=False)
    database_url: str = Field(default="sqlite:///./invoicebot.db")

    # Google Cloud Vision
    google_credentials_file: str = Field(default="google-credentials.json")

    # OpenAI
    openai_api_key: str = Field(default="")

    # QuickBooks
    qb_client_id: str = Field(default="")
    qb_client_secret: str = Field(default="")
    qb_redirect_uri: str = Field(default="http://localhost:8000/callback/quickbooks")
    qb_realm_id: str = Field(default="")

    # Email
    imap_host: str = Field(default="imap.gmail.com")
    imap_port: int = Field(default=993)
    imap_user: str = Field(default="")
    imap_password: str = Field(default="")
    check_email_interval: int = Field(default=300)

    # Confidence
    min_confidence_auto_approve: float = Field(default=0.85)
    min_confidence_show: float = Field(default=0.50)

    class Config:
        env_file = ".env"
        env_file_encoding = "utf-8"


settings = Settings()
