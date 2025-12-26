"""CSV file connector."""

import pandas as pd
from typing import List, Dict, Any, Optional
from pathlib import Path
from .base import BaseConnector


class CSVConnector(BaseConnector):
    """Connector for CSV files."""

    def __init__(self, file_path: str, encoding: str = "utf-8"):
        self.file_path = Path(file_path)
        self.encoding = encoding
        self.df: Optional[pd.DataFrame] = None

    def connect(self) -> bool:
        """CSV files don't need connection."""
        return self.file_path.exists()

    def disconnect(self) -> bool:
        """CSV files don't need disconnection."""
        self.df = None
        return True

    def read_data(self) -> pd.DataFrame:
        """Read CSV file into DataFrame."""
        self.df = pd.read_csv(self.file_path, encoding=self.encoding)
        return self.df

    def write_data(self, df: pd.DataFrame, output_path: Optional[str] = None) -> bool:
        """Write DataFrame to CSV file."""
        try:
            target_path = Path(output_path) if output_path else self.file_path
            df.to_csv(target_path, index=False, encoding=self.encoding)
            return True
        except Exception as e:
            print(f"Failed to write CSV: {e}")
            return False

    def get_schema(self) -> List[str]:
        """Get list of columns."""
        if self.df is None:
            self.read_data()
        return list(self.df.columns) if self.df is not None else []

    def test_connection(self) -> Dict[str, Any]:
        """Test if file exists and is readable."""
        try:
            if not self.file_path.exists():
                return {
                    "success": False,
                    "error": "File not found",
                }

            # Try to read first few rows
            pd.read_csv(self.file_path, nrows=5, encoding=self.encoding)

            return {
                "success": True,
                "file_path": str(self.file_path),
                "file_size": self.file_path.stat().st_size,
            }
        except Exception as e:
            return {
                "success": False,
                "error": str(e),
            }
