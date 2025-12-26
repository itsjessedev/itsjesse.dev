"""Configuration settings for FeedbackPulse."""

from pydantic_settings import BaseSettings
from typing import Optional


class Settings(BaseSettings):
    """Application settings."""

    # Application
    app_name: str = "FeedbackPulse"
    debug: bool = False
    demo_mode: bool = False

    # API Keys
    openai_api_key: Optional[str] = None
    google_places_api_key: Optional[str] = None
    yelp_api_key: Optional[str] = None

    # Database
    database_url: str = "sqlite:///./feedbackpulse.db"

    # Analysis Settings
    sentiment_threshold_negative: float = 0.3
    sentiment_threshold_positive: float = 0.7
    keyword_min_frequency: int = 3
    trend_window_days: int = 7

    # Alert Settings
    alert_negative_threshold: int = 5  # Number of negative reviews to trigger alert
    alert_trend_change_percent: float = 20.0  # % change to trigger alert

    class Config:
        env_file = ".env"
        case_sensitive = False


settings = Settings()
