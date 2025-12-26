"""Microsoft Access database connector."""

import pandas as pd
from typing import List, Dict, Any, Optional
from .base import BaseConnector

try:
    import pyodbc
    PYODBC_AVAILABLE = True
except ImportError:
    PYODBC_AVAILABLE = False


class AccessConnector(BaseConnector):
    """Connector for Microsoft Access databases."""

    def __init__(self, db_path: str, driver: str = "{Microsoft Access Driver (*.mdb, *.accdb)}"):
        if not PYODBC_AVAILABLE:
            raise ImportError("pyodbc is required for Access connector")

        self.db_path = db_path
        self.driver = driver
        self.connection: Optional[pyodbc.Connection] = None
        self.table_name: Optional[str] = None

    def connect(self) -> bool:
        """Establish connection to Access database."""
        try:
            conn_str = f"DRIVER={self.driver};DBQ={self.db_path};"
            self.connection = pyodbc.connect(conn_str)
            return True
        except Exception as e:
            print(f"Failed to connect to Access database: {e}")
            return False

    def disconnect(self) -> bool:
        """Close connection to Access database."""
        if self.connection:
            self.connection.close()
            self.connection = None
        return True

    def read_data(self, table_name: Optional[str] = None, query: Optional[str] = None) -> pd.DataFrame:
        """
        Read data from Access database.

        Args:
            table_name: Name of table to read
            query: Custom SQL query (overrides table_name)
        """
        if not self.connection:
            self.connect()

        if query:
            return pd.read_sql(query, self.connection)
        elif table_name:
            self.table_name = table_name
            return pd.read_sql(f"SELECT * FROM [{table_name}]", self.connection)
        else:
            raise ValueError("Must provide either table_name or query")

    def write_data(self, df: pd.DataFrame, table_name: Optional[str] = None) -> bool:
        """Write DataFrame to Access database."""
        if not self.connection:
            self.connect()

        target_table = table_name or self.table_name
        if not target_table:
            raise ValueError("Must provide table_name")

        try:
            df.to_sql(target_table, self.connection, if_exists="append", index=False)
            return True
        except Exception as e:
            print(f"Failed to write to Access database: {e}")
            return False

    def get_schema(self, table_name: Optional[str] = None) -> List[str]:
        """Get list of columns in table."""
        if not self.connection:
            self.connect()

        target_table = table_name or self.table_name
        if not target_table:
            raise ValueError("Must provide table_name")

        cursor = self.connection.cursor()
        columns = [column[3] for column in cursor.columns(table=target_table)]
        return columns

    def list_tables(self) -> List[str]:
        """List all tables in database."""
        if not self.connection:
            self.connect()

        cursor = self.connection.cursor()
        tables = [table.table_name for table in cursor.tables(tableType="TABLE")]
        return tables

    def test_connection(self) -> Dict[str, Any]:
        """Test connection to Access database."""
        try:
            if self.connect():
                tables = self.list_tables()
                self.disconnect()
                return {
                    "success": True,
                    "db_path": self.db_path,
                    "tables": tables,
                    "table_count": len(tables),
                }
        except Exception as e:
            return {
                "success": False,
                "error": str(e),
            }
