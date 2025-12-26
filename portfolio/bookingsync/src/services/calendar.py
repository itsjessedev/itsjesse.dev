"""Google Calendar integration"""

from datetime import datetime, timedelta
from typing import List, Dict, Optional
import logging

from ..config import settings

logger = logging.getLogger(__name__)


class CalendarService:
    """Google Calendar integration service"""

    def __init__(self):
        self.demo_mode = settings.demo_mode
        self.calendar_id = settings.google_calendar_id

        if not self.demo_mode:
            try:
                from google.oauth2.credentials import Credentials
                from googleapiclient.discovery import build

                # Load credentials from file
                creds = Credentials.from_authorized_user_file(
                    settings.google_calendar_credentials_path
                )
                self.service = build('calendar', 'v3', credentials=creds)
            except Exception as e:
                logger.error(f"Failed to initialize Google Calendar: {e}")
                self.demo_mode = True

    async def get_availability(
        self,
        start_date: datetime,
        end_date: datetime,
        duration_minutes: int
    ) -> List[Dict[str, datetime]]:
        """Get available time slots"""
        if self.demo_mode:
            return self._get_mock_availability(start_date, end_date, duration_minutes)

        try:
            # Get busy times from calendar
            body = {
                'timeMin': start_date.isoformat(),
                'timeMax': end_date.isoformat(),
                'items': [{'id': self.calendar_id}]
            }

            events_result = self.service.freebusy().query(body=body).execute()
            busy_times = events_result['calendars'][self.calendar_id]['busy']

            # Convert to datetime objects
            busy_periods = [
                {
                    'start': datetime.fromisoformat(period['start'].replace('Z', '+00:00')),
                    'end': datetime.fromisoformat(period['end'].replace('Z', '+00:00'))
                }
                for period in busy_times
            ]

            # Generate available slots
            return self._generate_available_slots(
                start_date, end_date, duration_minutes, busy_periods
            )

        except Exception as e:
            logger.error(f"Error fetching availability: {e}")
            return self._get_mock_availability(start_date, end_date, duration_minutes)

    async def create_event(
        self,
        title: str,
        start_time: datetime,
        end_time: datetime,
        description: Optional[str] = None,
        attendees: Optional[List[str]] = None
    ) -> Optional[str]:
        """Create calendar event"""
        if self.demo_mode:
            logger.info(f"[DEMO] Would create calendar event: {title} at {start_time}")
            return f"demo_event_{start_time.timestamp()}"

        try:
            event = {
                'summary': title,
                'description': description or '',
                'start': {
                    'dateTime': start_time.isoformat(),
                    'timeZone': settings.business_timezone,
                },
                'end': {
                    'dateTime': end_time.isoformat(),
                    'timeZone': settings.business_timezone,
                },
                'attendees': [{'email': email} for email in (attendees or [])],
                'reminders': {
                    'useDefault': False,
                    'overrides': [
                        {'method': 'email', 'minutes': 24 * 60},
                        {'method': 'popup', 'minutes': 120},
                    ],
                },
            }

            created_event = self.service.events().insert(
                calendarId=self.calendar_id,
                body=event
            ).execute()

            return created_event.get('id')

        except Exception as e:
            logger.error(f"Error creating calendar event: {e}")
            return None

    async def update_event(
        self,
        event_id: str,
        start_time: Optional[datetime] = None,
        end_time: Optional[datetime] = None,
        description: Optional[str] = None
    ) -> bool:
        """Update calendar event"""
        if self.demo_mode:
            logger.info(f"[DEMO] Would update calendar event: {event_id}")
            return True

        try:
            event = self.service.events().get(
                calendarId=self.calendar_id,
                eventId=event_id
            ).execute()

            if start_time:
                event['start']['dateTime'] = start_time.isoformat()
            if end_time:
                event['end']['dateTime'] = end_time.isoformat()
            if description is not None:
                event['description'] = description

            self.service.events().update(
                calendarId=self.calendar_id,
                eventId=event_id,
                body=event
            ).execute()

            return True

        except Exception as e:
            logger.error(f"Error updating calendar event: {e}")
            return False

    async def delete_event(self, event_id: str) -> bool:
        """Delete calendar event"""
        if self.demo_mode:
            logger.info(f"[DEMO] Would delete calendar event: {event_id}")
            return True

        try:
            self.service.events().delete(
                calendarId=self.calendar_id,
                eventId=event_id
            ).execute()
            return True

        except Exception as e:
            logger.error(f"Error deleting calendar event: {e}")
            return False

    def _get_mock_availability(
        self,
        start_date: datetime,
        end_date: datetime,
        duration_minutes: int
    ) -> List[Dict[str, datetime]]:
        """Generate mock availability for demo mode"""
        slots = []
        current = start_date.replace(hour=9, minute=0, second=0, microsecond=0)

        while current < end_date:
            # Skip weekends
            if current.weekday() >= 5:
                current += timedelta(days=1)
                continue

            # Business hours: 9 AM - 5 PM
            day_start = current.replace(hour=9, minute=0)
            day_end = current.replace(hour=17, minute=0)

            slot_time = day_start
            while slot_time + timedelta(minutes=duration_minutes) <= day_end:
                slots.append({
                    'start': slot_time,
                    'end': slot_time + timedelta(minutes=duration_minutes)
                })
                slot_time += timedelta(minutes=30)  # 30-minute intervals

            current += timedelta(days=1)

        return slots[:20]  # Return max 20 slots for demo

    def _generate_available_slots(
        self,
        start_date: datetime,
        end_date: datetime,
        duration_minutes: int,
        busy_periods: List[Dict[str, datetime]]
    ) -> List[Dict[str, datetime]]:
        """Generate available slots excluding busy periods"""
        slots = []
        current = start_date

        while current < end_date:
            day_name = current.strftime('%A').lower()
            business_hours = settings.business_hours.get(day_name)

            if not business_hours or not business_hours['start']:
                current += timedelta(days=1)
                continue

            # Parse business hours
            start_time = datetime.strptime(business_hours['start'], '%H:%M').time()
            end_time = datetime.strptime(business_hours['end'], '%H:%M').time()

            day_start = current.replace(
                hour=start_time.hour,
                minute=start_time.minute,
                second=0,
                microsecond=0
            )
            day_end = current.replace(
                hour=end_time.hour,
                minute=end_time.minute,
                second=0,
                microsecond=0
            )

            # Generate slots for this day
            slot_time = day_start
            while slot_time + timedelta(minutes=duration_minutes) <= day_end:
                slot_end = slot_time + timedelta(minutes=duration_minutes)

                # Check if slot conflicts with busy periods
                is_available = True
                for busy in busy_periods:
                    if (slot_time < busy['end'] and slot_end > busy['start']):
                        is_available = False
                        break

                if is_available:
                    slots.append({
                        'start': slot_time,
                        'end': slot_end
                    })

                slot_time += timedelta(minutes=30)  # 30-minute intervals

            current += timedelta(days=1)

        return slots


# Singleton instance
calendar_service = CalendarService()
