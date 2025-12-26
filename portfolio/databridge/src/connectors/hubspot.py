"""HubSpot CRM connector."""

import pandas as pd
from typing import List, Dict, Any, Optional
from .base import BaseConnector

try:
    from hubspot import HubSpot
    from hubspot.crm.contacts import SimplePublicObjectInput
    HUBSPOT_AVAILABLE = True
except ImportError:
    HUBSPOT_AVAILABLE = False


class HubSpotConnector(BaseConnector):
    """Connector for HubSpot CRM."""

    def __init__(self, api_key: str):
        if not HUBSPOT_AVAILABLE:
            raise ImportError("hubspot-api-client is required for HubSpot connector")

        self.api_key = api_key
        self.client: Optional[HubSpot] = None

    def connect(self) -> bool:
        """Initialize HubSpot client."""
        try:
            self.client = HubSpot(access_token=self.api_key)
            return True
        except Exception as e:
            print(f"Failed to initialize HubSpot client: {e}")
            return False

    def disconnect(self) -> bool:
        """HubSpot API doesn't need explicit disconnection."""
        self.client = None
        return True

    def read_data(self, object_type: str = "contacts", limit: int = 100) -> pd.DataFrame:
        """
        Read data from HubSpot.

        Args:
            object_type: Type of object to read (contacts, companies, deals, etc.)
            limit: Maximum number of records to retrieve
        """
        if not self.client:
            self.connect()

        # This is a simplified implementation
        # In production, you'd implement pagination and handle different object types

        try:
            if object_type == "contacts":
                response = self.client.crm.contacts.basic_api.get_page(limit=limit)
                contacts = []
                for contact in response.results:
                    contacts.append(contact.properties)
                return pd.DataFrame(contacts)
            else:
                raise ValueError(f"Unsupported object type: {object_type}")
        except Exception as e:
            print(f"Failed to read from HubSpot: {e}")
            return pd.DataFrame()

    def write_data(self, df: pd.DataFrame, object_type: str = "contacts", batch_size: int = 100) -> bool:
        """
        Write DataFrame to HubSpot.

        Args:
            df: DataFrame to write
            object_type: Type of object to create
            batch_size: Number of records to write per batch
        """
        if not self.client:
            self.connect()

        try:
            if object_type == "contacts":
                # Write in batches
                for i in range(0, len(df), batch_size):
                    batch = df.iloc[i:i + batch_size]

                    for _, row in batch.iterrows():
                        properties = row.to_dict()
                        # Remove None values
                        properties = {k: str(v) for k, v in properties.items() if pd.notna(v)}

                        contact_input = SimplePublicObjectInput(properties=properties)
                        self.client.crm.contacts.basic_api.create(
                            simple_public_object_input=contact_input
                        )

                return True
            else:
                raise ValueError(f"Unsupported object type: {object_type}")
        except Exception as e:
            print(f"Failed to write to HubSpot: {e}")
            return False

    def get_schema(self, object_type: str = "contacts") -> List[str]:
        """Get available properties for object type."""
        if not self.client:
            self.connect()

        try:
            if object_type == "contacts":
                properties = self.client.crm.properties.core_api.get_all(
                    object_type="contacts"
                )
                return [prop.name for prop in properties.results]
            else:
                raise ValueError(f"Unsupported object type: {object_type}")
        except Exception as e:
            print(f"Failed to get schema from HubSpot: {e}")
            return []

    def test_connection(self) -> Dict[str, Any]:
        """Test connection to HubSpot."""
        try:
            if self.connect():
                # Try to get account info
                account_info = self.client.settings.users.users_api.get_page()
                return {
                    "success": True,
                    "user_count": len(account_info.results),
                }
        except Exception as e:
            return {
                "success": False,
                "error": str(e),
            }
