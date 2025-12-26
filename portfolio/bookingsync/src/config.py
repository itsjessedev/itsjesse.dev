"""Application configuration"""

from pydantic_settings import BaseSettings
from typing import List, Dict, Any
import os


class Settings(BaseSettings):
    """Application settings"""

    # Demo mode
    demo_mode: bool = os.getenv("DEMO_MODE", "false").lower() == "true"

    # Database
    database_url: str = "sqlite:///./bookingsync.db"

    # Google Calendar
    google_calendar_credentials_path: str = ""
    google_calendar_id: str = ""

    # Twilio
    twilio_account_sid: str = ""
    twilio_auth_token: str = ""
    twilio_phone_number: str = ""

    # Email
    smtp_host: str = "smtp.gmail.com"
    smtp_port: int = 587
    smtp_username: str = ""
    smtp_password: str = ""
    smtp_from_email: str = "noreply@bookingsync.com"
    smtp_from_name: str = "BookingSync"

    # Stripe
    stripe_api_key: str = ""
    stripe_webhook_secret: str = ""
    stripe_publishable_key: str = ""

    # Application
    secret_key: str = "dev-secret-key-change-in-production"
    api_host: str = "0.0.0.0"
    api_port: int = 8000
    debug: bool = True

    # CORS
    cors_origins: str = "http://localhost:3000"

    @property
    def cors_origins_list(self) -> List[str]:
        return [origin.strip() for origin in self.cors_origins.split(",")]

    # Business settings
    business_name: str = "BookingSync Demo"
    business_timezone: str = "America/New_York"
    appointment_buffer_minutes: int = 15
    min_booking_notice_hours: int = 2
    max_booking_days_ahead: int = 30

    # Reminder settings
    reminder_hours_before: str = "24,2"

    @property
    def reminder_schedule(self) -> List[Dict[str, Any]]:
        """Parse reminder hours into schedule"""
        hours = [int(h.strip()) for h in self.reminder_hours_before.split(",")]
        schedule = []
        for h in hours:
            methods = ['email', 'sms'] if h >= 24 else ['sms']
            schedule.append({
                'hours_before': h,
                'methods': methods
            })
        return schedule

    # Business hours (Mon-Fri, 9 AM - 5 PM by default)
    business_hours: Dict[str, Dict[str, str]] = {
        'monday': {'start': '09:00', 'end': '17:00'},
        'tuesday': {'start': '09:00', 'end': '17:00'},
        'wednesday': {'start': '09:00', 'end': '17:00'},
        'thursday': {'start': '09:00', 'end': '17:00'},
        'friday': {'start': '09:00', 'end': '17:00'},
        'saturday': {'start': None, 'end': None},
        'sunday': {'start': None, 'end': None},
    }

    class Config:
        env_file = ".env"
        case_sensitive = False


settings = Settings()
