"""Data validation service."""

import re
import pandas as pd
from typing import List, Any, Set
from ..models.validation import (
    ValidationRule,
    ValidationResult,
    ValidationIssue,
    ValidationType,
    ValidationLevel,
)


class DataValidator:
    """Validate data against rules before migration."""

    def validate_dataframe(
        self,
        df: pd.DataFrame,
        rules: List[ValidationRule],
    ) -> ValidationResult:
        """
        Validate DataFrame against rules.

        Args:
            df: DataFrame to validate
            rules: List of validation rules

        Returns:
            ValidationResult with all issues found
        """
        result = ValidationResult(
            total_records=len(df),
            valid_records=0,
            invalid_records=0,
        )

        # Track which records have errors
        records_with_errors: Set[int] = set()

        # Apply each rule
        for rule in rules:
            if rule.field not in df.columns:
                continue

            issues = self._apply_rule(df, rule)

            for issue in issues:
                result.add_issue(issue)
                if issue.rule.level == ValidationLevel.ERROR:
                    records_with_errors.add(issue.record_index)

        # Calculate valid/invalid counts
        result.invalid_records = len(records_with_errors)
        result.valid_records = result.total_records - result.invalid_records

        return result

    def _apply_rule(
        self, df: pd.DataFrame, rule: ValidationRule
    ) -> List[ValidationIssue]:
        """Apply single validation rule to DataFrame."""
        issues = []

        if rule.rule_type == ValidationType.REQUIRED:
            issues.extend(self._validate_required(df, rule))
        elif rule.rule_type == ValidationType.TYPE:
            issues.extend(self._validate_type(df, rule))
        elif rule.rule_type == ValidationType.RANGE:
            issues.extend(self._validate_range(df, rule))
        elif rule.rule_type == ValidationType.REGEX:
            issues.extend(self._validate_regex(df, rule))
        elif rule.rule_type == ValidationType.LENGTH:
            issues.extend(self._validate_length(df, rule))
        elif rule.rule_type == ValidationType.UNIQUE:
            issues.extend(self._validate_unique(df, rule))

        return issues

    def _validate_required(
        self, df: pd.DataFrame, rule: ValidationRule
    ) -> List[ValidationIssue]:
        """Validate required fields."""
        issues = []
        null_mask = df[rule.field].isnull()

        for idx in null_mask[null_mask].index:
            issues.append(
                ValidationIssue(
                    record_index=int(idx),
                    field=rule.field,
                    rule=rule,
                    value=None,
                    message=rule.get_message(),
                )
            )

        return issues

    def _validate_type(
        self, df: pd.DataFrame, rule: ValidationRule
    ) -> List[ValidationIssue]:
        """Validate data types."""
        issues = []
        expected_type = rule.params.get("expected_type")

        if not expected_type:
            return issues

        for idx, value in df[rule.field].items():
            if pd.isna(value):
                continue

            valid = False
            if expected_type == "int":
                valid = isinstance(value, (int, pd.Int64Dtype))
            elif expected_type == "float":
                valid = isinstance(value, (float, int))
            elif expected_type == "str":
                valid = isinstance(value, str)
            elif expected_type == "bool":
                valid = isinstance(value, bool)

            if not valid:
                issues.append(
                    ValidationIssue(
                        record_index=int(idx),
                        field=rule.field,
                        rule=rule,
                        value=value,
                        message=f"{rule.get_message()}: expected {expected_type}, got {type(value).__name__}",
                    )
                )

        return issues

    def _validate_range(
        self, df: pd.DataFrame, rule: ValidationRule
    ) -> List[ValidationIssue]:
        """Validate numeric ranges."""
        issues = []
        min_val = rule.params.get("min")
        max_val = rule.params.get("max")

        for idx, value in df[rule.field].items():
            if pd.isna(value):
                continue

            try:
                numeric_value = float(value)

                if min_val is not None and numeric_value < min_val:
                    issues.append(
                        ValidationIssue(
                            record_index=int(idx),
                            field=rule.field,
                            rule=rule,
                            value=value,
                            message=f"{rule.get_message()}: {value} < {min_val}",
                        )
                    )

                if max_val is not None and numeric_value > max_val:
                    issues.append(
                        ValidationIssue(
                            record_index=int(idx),
                            field=rule.field,
                            rule=rule,
                            value=value,
                            message=f"{rule.get_message()}: {value} > {max_val}",
                        )
                    )
            except (ValueError, TypeError):
                pass

        return issues

    def _validate_regex(
        self, df: pd.DataFrame, rule: ValidationRule
    ) -> List[ValidationIssue]:
        """Validate against regex pattern."""
        issues = []
        pattern = rule.params.get("pattern")

        if not pattern:
            return issues

        regex = re.compile(pattern)

        for idx, value in df[rule.field].items():
            if pd.isna(value):
                continue

            if not regex.match(str(value)):
                issues.append(
                    ValidationIssue(
                        record_index=int(idx),
                        field=rule.field,
                        rule=rule,
                        value=value,
                        message=f"{rule.get_message()}: '{value}' does not match pattern '{pattern}'",
                    )
                )

        return issues

    def _validate_length(
        self, df: pd.DataFrame, rule: ValidationRule
    ) -> List[ValidationIssue]:
        """Validate string length."""
        issues = []
        min_len = rule.params.get("min_length")
        max_len = rule.params.get("max_length")

        for idx, value in df[rule.field].items():
            if pd.isna(value):
                continue

            value_str = str(value)
            length = len(value_str)

            if min_len is not None and length < min_len:
                issues.append(
                    ValidationIssue(
                        record_index=int(idx),
                        field=rule.field,
                        rule=rule,
                        value=value,
                        message=f"{rule.get_message()}: length {length} < {min_len}",
                    )
                )

            if max_len is not None and length > max_len:
                issues.append(
                    ValidationIssue(
                        record_index=int(idx),
                        field=rule.field,
                        rule=rule,
                        value=value,
                        message=f"{rule.get_message()}: length {length} > {max_len}",
                        )
                )

        return issues

    def _validate_unique(
        self, df: pd.DataFrame, rule: ValidationRule
    ) -> List[ValidationIssue]:
        """Validate uniqueness."""
        issues = []

        # Find duplicates
        duplicates = df[df[rule.field].duplicated(keep=False)]

        for idx, value in duplicates[rule.field].items():
            if pd.isna(value):
                continue

            issues.append(
                ValidationIssue(
                    record_index=int(idx),
                    field=rule.field,
                    rule=rule,
                    value=value,
                    message=f"{rule.get_message()}: duplicate value '{value}'",
                )
            )

        return issues
