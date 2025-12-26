"""Data transformation service."""

import re
import pandas as pd
from typing import List, Dict, Any, Callable
from ..models.mapping import FieldMapping, MappingRule, TransformationType


class DataTransformer:
    """Transform data according to field mappings."""

    def __init__(self):
        self.custom_transformations: Dict[str, Callable] = {}

    def register_transformation(self, name: str, func: Callable):
        """Register custom transformation function."""
        self.custom_transformations[name] = func

    def transform_dataframe(
        self,
        df: pd.DataFrame,
        mapping: FieldMapping,
    ) -> pd.DataFrame:
        """
        Transform DataFrame according to field mapping.

        Args:
            df: Source DataFrame
            mapping: Field mapping configuration

        Returns:
            Transformed DataFrame with target schema
        """
        # Create empty target DataFrame
        target_df = pd.DataFrame()

        # Apply each mapping rule
        for rule in mapping.mappings:
            try:
                target_df[rule.target_field] = self._apply_transformation(df, rule)
            except Exception as e:
                # Use default value or None if transformation fails
                if rule.default_value is not None:
                    target_df[rule.target_field] = rule.default_value
                else:
                    target_df[rule.target_field] = None

                print(f"Warning: Transformation failed for {rule.source_field} -> {rule.target_field}: {e}")

        # Add unmapped target fields with None
        for field in mapping.unmapped_target_fields:
            if field not in target_df.columns:
                target_df[field] = None

        return target_df

    def _apply_transformation(
        self,
        df: pd.DataFrame,
        rule: MappingRule,
    ) -> pd.Series:
        """Apply single transformation rule."""
        if rule.transformation == TransformationType.DIRECT:
            return self._transform_direct(df, rule)
        elif rule.transformation == TransformationType.CONCAT:
            return self._transform_concat(df, rule)
        elif rule.transformation == TransformationType.SPLIT:
            return self._transform_split(df, rule)
        elif rule.transformation == TransformationType.UPPERCASE:
            return self._transform_uppercase(df, rule)
        elif rule.transformation == TransformationType.LOWERCASE:
            return self._transform_lowercase(df, rule)
        elif rule.transformation == TransformationType.TRIM:
            return self._transform_trim(df, rule)
        elif rule.transformation == TransformationType.REPLACE:
            return self._transform_replace(df, rule)
        elif rule.transformation == TransformationType.REGEX:
            return self._transform_regex(df, rule)
        elif rule.transformation == TransformationType.LOOKUP:
            return self._transform_lookup(df, rule)
        elif rule.transformation == TransformationType.CUSTOM:
            return self._transform_custom(df, rule)
        else:
            return df[rule.source_field]

    def _transform_direct(self, df: pd.DataFrame, rule: MappingRule) -> pd.Series:
        """Direct copy."""
        return df[rule.source_field]

    def _transform_concat(self, df: pd.DataFrame, rule: MappingRule) -> pd.Series:
        """Concatenate multiple fields."""
        fields = [rule.source_field] + rule.additional_source_fields
        separator = rule.transformation_params.get("separator", " ")

        # Concatenate non-null values
        result = df[fields].apply(
            lambda row: separator.join(str(v) for v in row if pd.notna(v)),
            axis=1,
        )

        return result

    def _transform_split(self, df: pd.DataFrame, rule: MappingRule) -> pd.Series:
        """Split field and take specific part."""
        separator = rule.transformation_params.get("separator", " ")
        index = rule.transformation_params.get("index", 0)

        return df[rule.source_field].astype(str).str.split(separator).str[index]

    def _transform_uppercase(self, df: pd.DataFrame, rule: MappingRule) -> pd.Series:
        """Convert to uppercase."""
        return df[rule.source_field].astype(str).str.upper()

    def _transform_lowercase(self, df: pd.DataFrame, rule: MappingRule) -> pd.Series:
        """Convert to lowercase."""
        return df[rule.source_field].astype(str).str.lower()

    def _transform_trim(self, df: pd.DataFrame, rule: MappingRule) -> pd.Series:
        """Trim whitespace."""
        return df[rule.source_field].astype(str).str.strip()

    def _transform_replace(self, df: pd.DataFrame, rule: MappingRule) -> pd.Series:
        """Replace substring."""
        old = rule.transformation_params.get("old", "")
        new = rule.transformation_params.get("new", "")

        return df[rule.source_field].astype(str).str.replace(old, new)

    def _transform_regex(self, df: pd.DataFrame, rule: MappingRule) -> pd.Series:
        """Apply regex transformation."""
        pattern = rule.transformation_params.get("pattern", "")
        replacement = rule.transformation_params.get("replacement", "")

        return df[rule.source_field].astype(str).str.replace(
            pattern, replacement, regex=True
        )

    def _transform_lookup(self, df: pd.DataFrame, rule: MappingRule) -> pd.Series:
        """Lookup/map values."""
        lookup_table = rule.lookup_table or {}
        default = rule.default_value

        return df[rule.source_field].map(lookup_table).fillna(default)

    def _transform_custom(self, df: pd.DataFrame, rule: MappingRule) -> pd.Series:
        """Apply custom transformation function."""
        func_name = rule.transformation_params.get("function")

        if func_name and func_name in self.custom_transformations:
            func = self.custom_transformations[func_name]
            return df[rule.source_field].apply(func)

        return df[rule.source_field]
