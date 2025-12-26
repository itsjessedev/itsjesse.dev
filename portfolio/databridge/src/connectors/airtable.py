"""Airtable connector."""

import pandas as pd
from typing import List, Dict, Any, Optional
from .base import BaseConnector

try:
    from pyairtable import Api
    AIRTABLE_AVAILABLE = True
except ImportError:
    AIRTABLE_AVAILABLE = False


class AirtableConnector(BaseConnector):
    """Connector for Airtable."""

    def __init__(self, api_key: str, base_id: str, table_name: str):
        if not AIRTABLE_AVAILABLE:
            raise ImportError("pyairtable is required for Airtable connector")

        self.api_key = api_key
        self.base_id = base_id
        self.table_name = table_name
        self.api: Optional[Api] = None
        self.table = None

    def connect(self) -> bool:
        """Initialize Airtable connection."""
        try:
            self.api = Api(self.api_key)
            self.table = self.api.table(self.base_id, self.table_name)
            return True
        except Exception as e:
            print(f"Failed to connect to Airtable: {e}")
            return False

    def disconnect(self) -> bool:
        """Airtable doesn't need explicit disconnection."""
        self.api = None
        self.table = None
        return True

    def read_data(self) -> pd.DataFrame:
        """Read data from Airtable table."""
        if not self.table:
            self.connect()

        try:
            records = self.table.all()
            # Extract fields from records
            data = [record["fields"] for record in records]
            return pd.DataFrame(data)
        except Exception as e:
            print(f"Failed to read from Airtable: {e}")
            return pd.DataFrame()

    def write_data(self, df: pd.DataFrame, batch_size: int = 10) -> bool:
        """
        Write DataFrame to Airtable.

        Args:
            df: DataFrame to write
            batch_size: Number of records per batch (Airtable max is 10)
        """
        if not self.table:
            self.connect()

        try:
            # Convert DataFrame to list of dicts
            records = df.to_dict("records")

            # Write in batches (Airtable max batch size is 10)
            for i in range(0, len(records), batch_size):
                batch = records[i:i + batch_size]
                # Remove None values
                batch = [
                    {k: v for k, v in record.items() if pd.notna(v)}
                    for record in batch
                ]
                self.table.batch_create(batch)

            return True
        except Exception as e:
            print(f"Failed to write to Airtable: {e}")
            return False

    def get_schema(self) -> List[str]:
        """Get list of fields in table."""
        if not self.table:
            self.connect()

        try:
            # Get first record to determine schema
            records = self.table.all(max_records=1)
            if records:
                return list(records[0]["fields"].keys())
            return []
        except Exception as e:
            print(f"Failed to get schema from Airtable: {e}")
            return []

    def test_connection(self) -> Dict[str, Any]:
        """Test connection to Airtable."""
        try:
            if self.connect():
                # Try to get first record
                records = self.table.all(max_records=1)
                return {
                    "success": True,
                    "base_id": self.base_id,
                    "table_name": self.table_name,
                    "has_records": len(records) > 0,
                }
        except Exception as e:
            return {
                "success": False,
                "error": str(e),
            }
