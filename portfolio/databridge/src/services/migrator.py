"""Migration orchestration service."""

import uuid
from datetime import datetime
from typing import Optional, List
import pandas as pd

from ..models.migration import Migration, MigrationStatus, MigrationStep
from ..models.mapping import FieldMapping
from ..models.validation import ValidationRule
from .profiler import DataProfiler
from .mapper import FieldMapper
from .validator import DataValidator
from .transformer import DataTransformer


class MigrationOrchestrator:
    """Orchestrate the entire migration process."""

    def __init__(self):
        self.profiler = DataProfiler()
        self.mapper = FieldMapper()
        self.validator = DataValidator()
        self.transformer = DataTransformer()

    def create_migration(
        self,
        name: str,
        source_type: str,
        target_type: str,
        description: Optional[str] = None,
    ) -> Migration:
        """Create new migration job."""
        return Migration(
            id=str(uuid.uuid4()),
            name=name,
            description=description,
            source_type=source_type,
            target_type=target_type,
            status=MigrationStatus.PENDING,
        )

    def profile_data(self, migration: Migration, df: pd.DataFrame) -> Migration:
        """Profile source data."""
        step = MigrationStep(
            name="profile_data",
            status=MigrationStatus.PROFILING,
            started_at=datetime.utcnow(),
        )

        try:
            profile = self.profiler.profile_dataframe(df)

            step.metrics = {
                "total_records": profile.total_records,
                "total_fields": profile.total_fields,
                "field_types": profile.field_types,
            }
            step.status = MigrationStatus.COMPLETED
            step.completed_at = datetime.utcnow()

            migration.total_records = profile.total_records

        except Exception as e:
            step.status = MigrationStatus.FAILED
            step.error = str(e)
            migration.errors.append(f"Profiling failed: {e}")

        migration.steps.append(step)
        return migration

    def map_fields(
        self,
        migration: Migration,
        source_fields: List[str],
        target_fields: List[str],
        custom_mapping: Optional[FieldMapping] = None,
    ) -> tuple[Migration, FieldMapping]:
        """Map source fields to target fields."""
        step = MigrationStep(
            name="map_fields",
            status=MigrationStatus.MAPPING,
            started_at=datetime.utcnow(),
        )

        try:
            if custom_mapping:
                mapping = custom_mapping
            else:
                mapping = self.mapper.auto_map_fields(source_fields, target_fields)

            mapping.migration_id = migration.id

            step.metrics = {
                "mapped_fields": len(mapping.mappings),
                "unmapped_source": len(mapping.unmapped_source_fields),
                "unmapped_target": len(mapping.unmapped_target_fields),
            }
            step.status = MigrationStatus.COMPLETED
            step.completed_at = datetime.utcnow()

            if mapping.unmapped_source_fields:
                migration.warnings.append(
                    f"Unmapped source fields: {', '.join(mapping.unmapped_source_fields)}"
                )

        except Exception as e:
            step.status = MigrationStatus.FAILED
            step.error = str(e)
            migration.errors.append(f"Mapping failed: {e}")
            mapping = FieldMapping(
                migration_id=migration.id,
                source_fields=source_fields,
                target_fields=target_fields,
                mappings=[],
            )

        migration.steps.append(step)
        return migration, mapping

    def validate_data(
        self,
        migration: Migration,
        df: pd.DataFrame,
        rules: List[ValidationRule],
    ) -> Migration:
        """Validate data against rules."""
        step = MigrationStep(
            name="validate_data",
            status=MigrationStatus.VALIDATING,
            started_at=datetime.utcnow(),
        )

        try:
            result = self.validator.validate_dataframe(df, rules)

            step.metrics = {
                "total_records": result.total_records,
                "valid_records": result.valid_records,
                "invalid_records": result.invalid_records,
                "error_count": len(result.errors),
                "warning_count": len(result.warnings),
            }
            step.status = MigrationStatus.COMPLETED
            step.completed_at = datetime.utcnow()

            if result.has_errors:
                migration.warnings.append(
                    f"Validation found {len(result.errors)} errors"
                )

        except Exception as e:
            step.status = MigrationStatus.FAILED
            step.error = str(e)
            migration.errors.append(f"Validation failed: {e}")

        migration.steps.append(step)
        return migration

    def transform_data(
        self,
        migration: Migration,
        df: pd.DataFrame,
        mapping: FieldMapping,
    ) -> tuple[Migration, pd.DataFrame]:
        """Transform data according to mapping."""
        step = MigrationStep(
            name="transform_data",
            status=MigrationStatus.TRANSFORMING,
            started_at=datetime.utcnow(),
        )

        transformed_df = pd.DataFrame()

        try:
            transformed_df = self.transformer.transform_dataframe(df, mapping)

            step.metrics = {
                "input_records": len(df),
                "output_records": len(transformed_df),
                "input_fields": len(df.columns),
                "output_fields": len(transformed_df.columns),
            }
            step.status = MigrationStatus.COMPLETED
            step.completed_at = datetime.utcnow()

        except Exception as e:
            step.status = MigrationStatus.FAILED
            step.error = str(e)
            migration.errors.append(f"Transformation failed: {e}")

        migration.steps.append(step)
        return migration, transformed_df

    def execute_migration(
        self,
        migration: Migration,
        df: pd.DataFrame,
        mapping: FieldMapping,
        validation_rules: Optional[List[ValidationRule]] = None,
    ) -> tuple[Migration, pd.DataFrame]:
        """
        Execute complete migration pipeline.

        Args:
            migration: Migration job
            df: Source DataFrame
            mapping: Field mapping
            validation_rules: Optional validation rules

        Returns:
            Updated migration and transformed DataFrame
        """
        migration.status = MigrationStatus.MIGRATING
        migration.started_at = datetime.utcnow()

        # Step 1: Profile data
        migration = self.profile_data(migration, df)
        if migration.status == MigrationStatus.FAILED:
            return migration, pd.DataFrame()

        # Step 2: Validate if rules provided
        if validation_rules:
            migration = self.validate_data(migration, df, validation_rules)

        # Step 3: Transform data
        migration, transformed_df = self.transform_data(migration, df, mapping)
        if migration.status == MigrationStatus.FAILED:
            return migration, pd.DataFrame()

        # Mark as completed
        migration.status = MigrationStatus.COMPLETED
        migration.completed_at = datetime.utcnow()
        migration.processed_records = len(transformed_df)

        return migration, transformed_df
