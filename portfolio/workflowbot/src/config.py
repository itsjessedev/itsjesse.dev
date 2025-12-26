"""Application configuration management."""
from typing import Optional
from pydantic import Field, field_validator
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    """Application settings."""

    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        case_sensitive=False,
        extra="ignore"
    )

    # Application
    app_name: str = "WorkflowBot"
    environment: str = "development"
    debug: bool = False
    secret_key: str = Field(..., min_length=32)

    # Server
    host: str = "0.0.0.0"
    port: int = 8000

    # Database
    database_url: str = Field(..., description="PostgreSQL connection string")
    database_pool_size: int = 10
    database_max_overflow: int = 20

    # Slack
    slack_bot_token: Optional[str] = None
    slack_app_token: Optional[str] = None
    slack_signing_secret: Optional[str] = None

    # Demo Mode
    demo_mode: bool = False

    # Redis
    redis_url: str = "redis://localhost:6379/0"

    # Celery
    celery_broker_url: str = "redis://localhost:6379/0"
    celery_result_backend: str = "redis://localhost:6379/1"

    # n8n Integration
    n8n_webhook_url: Optional[str] = None
    n8n_api_key: Optional[str] = None

    # Logging
    log_level: str = "INFO"
    log_format: str = "json"

    # CORS
    cors_origins: list[str] = ["http://localhost:3000", "http://localhost:8000"]

    # Monitoring
    sentry_dsn: Optional[str] = None
    metrics_enabled: bool = True

    # Email
    smtp_host: str = "smtp.gmail.com"
    smtp_port: int = 587
    smtp_user: Optional[str] = None
    smtp_password: Optional[str] = None
    smtp_from: str = "workflowbot@example.com"

    # Calendar
    google_calendar_credentials: Optional[str] = None
    calendar_id: Optional[str] = None

    # File Storage
    upload_dir: str = "/tmp/workflowbot/uploads"
    max_upload_size: int = 10485760  # 10MB

    # Workflow Settings
    default_approval_timeout: int = 86400  # 24 hours
    max_approval_reminders: int = 3
    reminder_interval: int = 28800  # 8 hours

    # Feature Flags
    feature_onboarding: bool = True
    feature_expenses: bool = True
    feature_pto: bool = True
    feature_analytics: bool = True

    @field_validator("cors_origins", mode="before")
    @classmethod
    def parse_cors_origins(cls, v):
        """Parse CORS origins from string or list."""
        if isinstance(v, str):
            return [origin.strip() for origin in v.split(",")]
        return v

    @property
    def is_production(self) -> bool:
        """Check if running in production."""
        return self.environment == "production"

    @property
    def is_demo_mode(self) -> bool:
        """Check if running in demo mode."""
        return self.demo_mode or not self.slack_bot_token

    @property
    def slack_configured(self) -> bool:
        """Check if Slack is properly configured."""
        return bool(
            self.slack_bot_token
            and self.slack_app_token
            and self.slack_signing_secret
        )


# Global settings instance
settings = Settings()
