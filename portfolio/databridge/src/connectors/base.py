"""Base connector interface."""

from abc import ABC, abstractmethod
from typing import List, Dict, Any
import pandas as pd


class BaseConnector(ABC):
    """Base class for all data connectors."""

    @abstractmethod
    def connect(self) -> bool:
        """Establish connection to data source."""
        pass

    @abstractmethod
    def disconnect(self) -> bool:
        """Close connection to data source."""
        pass

    @abstractmethod
    def read_data(self) -> pd.DataFrame:
        """Read data from source into DataFrame."""
        pass

    @abstractmethod
    def write_data(self, df: pd.DataFrame) -> bool:
        """Write DataFrame to target."""
        pass

    @abstractmethod
    def get_schema(self) -> List[str]:
        """Get list of available fields."""
        pass

    @abstractmethod
    def test_connection(self) -> Dict[str, Any]:
        """Test connection and return status."""
        pass
