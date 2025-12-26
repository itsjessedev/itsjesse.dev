"""Test migration functionality."""

import pytest
import pandas as pd
from src.services.profiler import DataProfiler
from src.services.mapper import FieldMapper
from src.services.validator import DataValidator
from src.services.transformer import DataTransformer
from src.services.migrator import MigrationOrchestrator
from src.models.mapping import MappingRule, TransformationType
from src.models.validation import ValidationRule, ValidationType, ValidationLevel


@pytest.fixture
def sample_dataframe():
    """Create sample DataFrame for testing."""
    return pd.DataFrame({
        "id": [1, 2, 3, 4, 5],
        "first_name": ["John", "Jane", "Bob", "Alice", "Charlie"],
        "last_name": ["Doe", "Smith", "Johnson", "Williams", "Brown"],
        "email": ["john@example.com", "jane@example.com", "bob@example.com",
                  "alice@example.com", "charlie@example.com"],
        "age": [30, 25, 35, 28, 42],
        "city": ["New York", "Los Angeles", "Chicago", "Houston", "Phoenix"],
    })


class TestDataProfiler:
    """Test data profiling."""

    def test_profile_dataframe(self, sample_dataframe):
        """Test DataFrame profiling."""
        profiler = DataProfiler()
        profile = profiler.profile_dataframe(sample_dataframe)

        assert profile.total_records == 5
        assert profile.total_fields == 6
        assert "id" in profile.field_types
        assert all(count == 0 for count in profile.null_counts.values())

    def test_suggest_data_types(self, sample_dataframe):
        """Test data type suggestions."""
        profiler = DataProfiler()
        profile = profiler.profile_dataframe(sample_dataframe)
        suggestions = profiler.suggest_data_types(profile)

        assert "id" in suggestions
        assert suggestions["id"] == "identifier"
        assert "email" in suggestions

    def test_identify_potential_keys(self, sample_dataframe):
        """Test primary key identification."""
        profiler = DataProfiler()
        profile = profiler.profile_dataframe(sample_dataframe)
        keys = profiler.identify_potential_keys(profile)

        assert "id" in keys
        assert "email" in keys


class TestFieldMapper:
    """Test field mapping."""

    def test_exact_match(self):
        """Test exact field matching."""
        mapper = FieldMapper()
        source_fields = ["id", "name", "email"]
        target_fields = ["id", "name", "email"]

        mapping = mapper.auto_map_fields(source_fields, target_fields)

        assert len(mapping.mappings) == 3
        assert len(mapping.unmapped_source_fields) == 0
        assert len(mapping.unmapped_target_fields) == 0

    def test_case_insensitive_match(self):
        """Test case-insensitive matching."""
        mapper = FieldMapper()
        source_fields = ["ID", "NAME", "EMAIL"]
        target_fields = ["id", "name", "email"]

        mapping = mapper.auto_map_fields(source_fields, target_fields, case_sensitive=False)

        assert len(mapping.mappings) == 3

    def test_fuzzy_match(self):
        """Test fuzzy field matching."""
        mapper = FieldMapper()
        source_fields = ["customer_id", "customer_name", "email_address"]
        target_fields = ["id", "name", "email"]

        mapping = mapper.auto_map_fields(source_fields, target_fields, fuzzy_threshold=0.5)

        assert len(mapping.mappings) > 0

    def test_semantic_match(self):
        """Test semantic field matching."""
        mapper = FieldMapper()
        source_fields = ["first_name", "last_name", "email_addr"]
        target_fields = ["firstname", "lastname", "email"]

        mapping = mapper.auto_map_fields(source_fields, target_fields)

        assert len(mapping.mappings) >= 2


class TestDataValidator:
    """Test data validation."""

    def test_required_validation(self, sample_dataframe):
        """Test required field validation."""
        validator = DataValidator()

        # Add null value
        df = sample_dataframe.copy()
        df.loc[0, "email"] = None

        rule = ValidationRule(
            field="email",
            rule_type=ValidationType.REQUIRED,
            level=ValidationLevel.ERROR,
        )

        result = validator.validate_dataframe(df, [rule])

        assert len(result.errors) == 1
        assert result.errors[0].field == "email"

    def test_regex_validation(self, sample_dataframe):
        """Test regex validation."""
        validator = DataValidator()

        # Add invalid email
        df = sample_dataframe.copy()
        df.loc[0, "email"] = "invalid-email"

        rule = ValidationRule(
            field="email",
            rule_type=ValidationType.REGEX,
            level=ValidationLevel.ERROR,
            params={"pattern": r"^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$"},
        )

        result = validator.validate_dataframe(df, [rule])

        assert len(result.errors) >= 1

    def test_range_validation(self, sample_dataframe):
        """Test range validation."""
        validator = DataValidator()

        rule = ValidationRule(
            field="age",
            rule_type=ValidationType.RANGE,
            level=ValidationLevel.ERROR,
            params={"min": 18, "max": 65},
        )

        result = validator.validate_dataframe(sample_dataframe, [rule])

        assert len(result.errors) == 0

    def test_unique_validation(self):
        """Test uniqueness validation."""
        validator = DataValidator()

        # Create DataFrame with duplicate
        df = pd.DataFrame({
            "id": [1, 2, 3, 2, 5],
        })

        rule = ValidationRule(
            field="id",
            rule_type=ValidationType.UNIQUE,
            level=ValidationLevel.ERROR,
        )

        result = validator.validate_dataframe(df, [rule])

        assert len(result.errors) > 0


class TestDataTransformer:
    """Test data transformation."""

    def test_direct_transformation(self, sample_dataframe):
        """Test direct copy transformation."""
        transformer = DataTransformer()

        from src.models.mapping import FieldMapping

        mapping = FieldMapping(
            migration_id="test",
            source_fields=["id", "email"],
            target_fields=["id", "email"],
            mappings=[
                MappingRule(
                    source_field="id",
                    target_field="id",
                    transformation=TransformationType.DIRECT,
                ),
                MappingRule(
                    source_field="email",
                    target_field="email",
                    transformation=TransformationType.DIRECT,
                ),
            ],
        )

        result = transformer.transform_dataframe(sample_dataframe, mapping)

        assert len(result) == len(sample_dataframe)
        assert list(result.columns) == ["id", "email"]

    def test_concat_transformation(self, sample_dataframe):
        """Test concatenation transformation."""
        transformer = DataTransformer()

        from src.models.mapping import FieldMapping

        mapping = FieldMapping(
            migration_id="test",
            source_fields=["first_name", "last_name"],
            target_fields=["full_name"],
            mappings=[
                MappingRule(
                    source_field="first_name",
                    target_field="full_name",
                    transformation=TransformationType.CONCAT,
                    additional_source_fields=["last_name"],
                    transformation_params={"separator": " "},
                ),
            ],
        )

        result = transformer.transform_dataframe(sample_dataframe, mapping)

        assert "full_name" in result.columns
        assert result.loc[0, "full_name"] == "John Doe"

    def test_uppercase_transformation(self, sample_dataframe):
        """Test uppercase transformation."""
        transformer = DataTransformer()

        from src.models.mapping import FieldMapping

        mapping = FieldMapping(
            migration_id="test",
            source_fields=["city"],
            target_fields=["city_upper"],
            mappings=[
                MappingRule(
                    source_field="city",
                    target_field="city_upper",
                    transformation=TransformationType.UPPERCASE,
                ),
            ],
        )

        result = transformer.transform_dataframe(sample_dataframe, mapping)

        assert result.loc[0, "city_upper"] == "NEW YORK"


class TestMigrationOrchestrator:
    """Test migration orchestration."""

    def test_create_migration(self):
        """Test migration creation."""
        orchestrator = MigrationOrchestrator()

        migration = orchestrator.create_migration(
            name="Test Migration",
            source_type="csv",
            target_type="hubspot",
            description="Test migration",
        )

        assert migration.name == "Test Migration"
        assert migration.source_type == "csv"
        assert migration.target_type == "hubspot"

    def test_full_migration_pipeline(self, sample_dataframe):
        """Test complete migration pipeline."""
        orchestrator = MigrationOrchestrator()

        migration = orchestrator.create_migration(
            name="Full Test",
            source_type="csv",
            target_type="csv",
        )

        from src.models.mapping import FieldMapping

        mapping = FieldMapping(
            migration_id=migration.id,
            source_fields=list(sample_dataframe.columns),
            target_fields=list(sample_dataframe.columns),
            mappings=[
                MappingRule(
                    source_field=col,
                    target_field=col,
                    transformation=TransformationType.DIRECT,
                )
                for col in sample_dataframe.columns
            ],
        )

        migration, transformed_df = orchestrator.execute_migration(
            migration,
            sample_dataframe,
            mapping,
        )

        assert migration.status.value == "completed"
        assert len(transformed_df) == len(sample_dataframe)
        assert migration.processed_records == len(sample_dataframe)
