"""Data profiling service."""

import pandas as pd
from typing import Dict, List, Any
from ..models.migration import DataProfile


class DataProfiler:
    """Profile source data to understand structure and quality."""

    def profile_dataframe(self, df: pd.DataFrame, sample_size: int = 10) -> DataProfile:
        """
        Profile a pandas DataFrame.

        Args:
            df: DataFrame to profile
            sample_size: Number of sample values to collect per field

        Returns:
            DataProfile with comprehensive statistics
        """
        total_records = len(df)
        total_fields = len(df.columns)

        # Field types
        field_types = {col: str(df[col].dtype) for col in df.columns}

        # Null counts
        null_counts = df.isnull().sum().to_dict()

        # Unique value counts
        unique_counts = df.nunique().to_dict()

        # Sample values (first n non-null values)
        sample_values = {}
        for col in df.columns:
            non_null = df[col].dropna()
            samples = non_null.head(sample_size).tolist()
            sample_values[col] = samples

        # Field statistics
        field_statistics = {}
        for col in df.columns:
            stats: Dict[str, Any] = {
                "null_percentage": (null_counts[col] / total_records * 100) if total_records > 0 else 0,
                "unique_percentage": (unique_counts[col] / total_records * 100) if total_records > 0 else 0,
            }

            # Numeric statistics
            if pd.api.types.is_numeric_dtype(df[col]):
                stats.update({
                    "min": float(df[col].min()) if not df[col].isna().all() else None,
                    "max": float(df[col].max()) if not df[col].isna().all() else None,
                    "mean": float(df[col].mean()) if not df[col].isna().all() else None,
                    "median": float(df[col].median()) if not df[col].isna().all() else None,
                    "std": float(df[col].std()) if not df[col].isna().all() else None,
                })

            # String statistics
            elif pd.api.types.is_string_dtype(df[col]) or df[col].dtype == object:
                non_null = df[col].dropna()
                if len(non_null) > 0:
                    lengths = non_null.astype(str).str.len()
                    stats.update({
                        "min_length": int(lengths.min()),
                        "max_length": int(lengths.max()),
                        "avg_length": float(lengths.mean()),
                    })

            field_statistics[col] = stats

        return DataProfile(
            total_records=total_records,
            total_fields=total_fields,
            field_types=field_types,
            null_counts=null_counts,
            unique_counts=unique_counts,
            sample_values=sample_values,
            field_statistics=field_statistics,
        )

    def suggest_data_types(self, profile: DataProfile) -> Dict[str, str]:
        """
        Suggest optimal data types based on profile.

        Args:
            profile: Data profile

        Returns:
            Dictionary mapping field names to suggested types
        """
        suggestions = {}

        for field, dtype in profile.field_types.items():
            stats = profile.field_statistics.get(field, {})
            unique_pct = stats.get("unique_percentage", 0)

            # High uniqueness suggests ID or unique identifier
            if unique_pct > 95:
                suggestions[field] = "identifier"
            # Low uniqueness suggests categorical
            elif unique_pct < 10:
                suggestions[field] = "categorical"
            # Numeric types
            elif "int" in dtype.lower():
                suggestions[field] = "integer"
            elif "float" in dtype.lower():
                suggestions[field] = "float"
            # String types
            else:
                max_length = stats.get("max_length", 0)
                if max_length > 500:
                    suggestions[field] = "text"
                else:
                    suggestions[field] = "string"

        return suggestions

    def identify_potential_keys(self, profile: DataProfile) -> List[str]:
        """
        Identify potential primary key fields.

        Args:
            profile: Data profile

        Returns:
            List of field names that could serve as primary keys
        """
        potential_keys = []

        for field in profile.field_types.keys():
            stats = profile.field_statistics.get(field, {})
            unique_pct = stats.get("unique_percentage", 0)
            null_pct = stats.get("null_percentage", 0)

            # Good primary key: high uniqueness, no nulls
            if unique_pct == 100 and null_pct == 0:
                potential_keys.append(field)

        return potential_keys
