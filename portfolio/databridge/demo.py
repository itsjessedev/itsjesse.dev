#!/usr/bin/env python3
"""
DataBridge Demo Script

Demonstrates the complete migration pipeline using sample data.
Run this script to see DataBridge in action without any setup.
"""

import pandas as pd
from pathlib import Path

from src.services.profiler import DataProfiler
from src.services.mapper import FieldMapper
from src.services.validator import DataValidator
from src.services.transformer import DataTransformer
from src.services.migrator import MigrationOrchestrator
from src.models.mapping import MappingRule, TransformationType
from src.models.validation import ValidationRule, ValidationType, ValidationLevel
from src.connectors.csv import CSVConnector


def print_section(title: str):
    """Print section header."""
    print(f"\n{'=' * 60}")
    print(f"  {title}")
    print(f"{'=' * 60}\n")


def demo_data_profiling():
    """Demonstrate data profiling capabilities."""
    print_section("1. DATA PROFILING")

    # Load sample data
    connector = CSVConnector("sample_data/legacy_customers.csv")
    df = connector.read_data()

    print(f"Loaded {len(df)} records from legacy_customers.csv")
    print(f"\nFirst 3 records:")
    print(df.head(3).to_string())

    # Profile the data
    profiler = DataProfiler()
    profile = profiler.profile_dataframe(df)

    print(f"\nData Profile:")
    print(f"  Total Records: {profile.total_records}")
    print(f"  Total Fields: {profile.total_fields}")
    print(f"\n  Field Types:")
    for field, dtype in list(profile.field_types.items())[:5]:
        print(f"    {field}: {dtype}")

    print(f"\n  Null Percentages:")
    for field, stats in list(profile.field_statistics.items())[:5]:
        null_pct = stats.get("null_percentage", 0)
        print(f"    {field}: {null_pct:.1f}%")

    # Suggest data types
    suggestions = profiler.suggest_data_types(profile)
    print(f"\n  Suggested Data Types:")
    for field, suggestion in list(suggestions.items())[:5]:
        print(f"    {field}: {suggestion}")

    # Identify potential keys
    keys = profiler.identify_potential_keys(profile)
    print(f"\n  Potential Primary Keys: {', '.join(keys)}")

    return df


def demo_field_mapping(df):
    """Demonstrate intelligent field mapping."""
    print_section("2. INTELLIGENT FIELD MAPPING")

    source_fields = list(df.columns)
    target_fields = [
        "id", "firstname", "lastname", "email", "phone",
        "address", "city", "state", "postal_code",
        "created_date", "last_activity", "lifetime_value"
    ]

    print(f"Source Fields ({len(source_fields)}):")
    print(f"  {', '.join(source_fields)}")
    print(f"\nTarget Fields ({len(target_fields)}):")
    print(f"  {', '.join(target_fields)}")

    # Auto-map fields
    mapper = FieldMapper()
    mapping = mapper.auto_map_fields(
        source_fields=source_fields,
        target_fields=target_fields,
        case_sensitive=False,
        fuzzy_threshold=0.7,
    )

    print(f"\nAuto-Mapped Fields ({len(mapping.mappings)}):")
    for rule in mapping.mappings:
        print(f"  {rule.source_field} → {rule.target_field}")

    if mapping.unmapped_source_fields:
        print(f"\nUnmapped Source Fields:")
        print(f"  {', '.join(mapping.unmapped_source_fields)}")

    if mapping.unmapped_target_fields:
        print(f"\nUnmapped Target Fields:")
        print(f"  {', '.join(mapping.unmapped_target_fields)}")

    return mapping


def demo_validation(df):
    """Demonstrate data validation."""
    print_section("3. DATA VALIDATION")

    # Define validation rules
    rules = [
        ValidationRule(
            field="EmailAddr",
            rule_type=ValidationType.REQUIRED,
            level=ValidationLevel.ERROR,
            message="Email is required",
        ),
        ValidationRule(
            field="EmailAddr",
            rule_type=ValidationType.REGEX,
            level=ValidationLevel.ERROR,
            params={
                "pattern": r"^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$"
            },
            message="Email must be valid",
        ),
        ValidationRule(
            field="CustomerID",
            rule_type=ValidationType.UNIQUE,
            level=ValidationLevel.ERROR,
            message="Customer ID must be unique",
        ),
        ValidationRule(
            field="TotalSpent",
            rule_type=ValidationType.RANGE,
            level=ValidationLevel.WARNING,
            params={"min": 0, "max": 1000000},
            message="Total spent seems unusual",
        ),
    ]

    print(f"Applying {len(rules)} validation rules:")
    for rule in rules:
        print(f"  - {rule.field}: {rule.rule_type.value}")

    # Validate data
    validator = DataValidator()
    result = validator.validate_dataframe(df, rules)

    print(f"\nValidation Results:")
    print(f"  Total Records: {result.total_records}")
    print(f"  Valid Records: {result.valid_records}")
    print(f"  Invalid Records: {result.invalid_records}")
    print(f"  Success Rate: {result.success_rate:.1f}%")
    print(f"\n  Errors: {len(result.errors)}")
    print(f"  Warnings: {len(result.warnings)}")

    if result.errors:
        print(f"\n  Sample Errors:")
        for error in result.errors[:3]:
            print(f"    Record {error.record_index}: {error.message}")

    return result


def demo_transformation(df, mapping):
    """Demonstrate data transformation."""
    print_section("4. DATA TRANSFORMATION")

    # Add transformation rules
    mapping.mappings = [
        # Direct mappings
        MappingRule(
            source_field="CustomerID",
            target_field="id",
            transformation=TransformationType.DIRECT,
        ),
        MappingRule(
            source_field="FirstName",
            target_field="firstname",
            transformation=TransformationType.DIRECT,
        ),
        MappingRule(
            source_field="LastName",
            target_field="lastname",
            transformation=TransformationType.DIRECT,
        ),
        MappingRule(
            source_field="EmailAddr",
            target_field="email",
            transformation=TransformationType.LOWERCASE,
        ),
        MappingRule(
            source_field="PhoneNum",
            target_field="phone",
            transformation=TransformationType.DIRECT,
        ),
        MappingRule(
            source_field="StreetAddress",
            target_field="address",
            transformation=TransformationType.TRIM,
        ),
        MappingRule(
            source_field="City",
            target_field="city",
            transformation=TransformationType.DIRECT,
        ),
        MappingRule(
            source_field="State",
            target_field="state",
            transformation=TransformationType.UPPERCASE,
        ),
        MappingRule(
            source_field="ZipCode",
            target_field="postal_code",
            transformation=TransformationType.DIRECT,
        ),
        MappingRule(
            source_field="DateCreated",
            target_field="created_date",
            transformation=TransformationType.DIRECT,
        ),
        MappingRule(
            source_field="LastPurchase",
            target_field="last_activity",
            transformation=TransformationType.DIRECT,
        ),
        MappingRule(
            source_field="TotalSpent",
            target_field="lifetime_value",
            transformation=TransformationType.DIRECT,
        ),
    ]

    print(f"Applying {len(mapping.mappings)} transformations:")
    transformation_types = {}
    for rule in mapping.mappings:
        t_type = rule.transformation.value
        transformation_types[t_type] = transformation_types.get(t_type, 0) + 1

    for t_type, count in transformation_types.items():
        print(f"  {t_type}: {count}")

    # Transform data
    transformer = DataTransformer()
    transformed_df = transformer.transform_dataframe(df, mapping)

    print(f"\nTransformation Complete:")
    print(f"  Input: {len(df)} records, {len(df.columns)} fields")
    print(f"  Output: {len(transformed_df)} records, {len(transformed_df.columns)} fields")

    print(f"\nTransformed Data (first 3 records):")
    print(transformed_df.head(3).to_string())

    return transformed_df


def demo_full_migration(df):
    """Demonstrate full migration pipeline."""
    print_section("5. COMPLETE MIGRATION PIPELINE")

    orchestrator = MigrationOrchestrator()

    # Create migration
    migration = orchestrator.create_migration(
        name="Legacy Access to Modern CRM",
        source_type="Microsoft Access",
        target_type="HubSpot/Airtable",
        description="Complete customer data migration with validation and transformation",
    )

    print(f"Migration Created:")
    print(f"  ID: {migration.id}")
    print(f"  Name: {migration.name}")
    print(f"  Status: {migration.status.value}")

    # Define mapping
    from src.models.mapping import FieldMapping

    source_fields = list(df.columns)
    target_fields = [
        "id", "firstname", "lastname", "email", "phone",
        "address", "city", "state", "postal_code",
        "created_date", "last_activity", "lifetime_value"
    ]

    mapper = FieldMapper()
    base_mapping = mapper.auto_map_fields(source_fields, target_fields)

    # Add transformations
    base_mapping.mappings = [
        MappingRule(source_field="CustomerID", target_field="id", transformation=TransformationType.DIRECT),
        MappingRule(source_field="FirstName", target_field="firstname", transformation=TransformationType.DIRECT),
        MappingRule(source_field="LastName", target_field="lastname", transformation=TransformationType.DIRECT),
        MappingRule(source_field="EmailAddr", target_field="email", transformation=TransformationType.LOWERCASE),
        MappingRule(source_field="PhoneNum", target_field="phone", transformation=TransformationType.DIRECT),
        MappingRule(source_field="StreetAddress", target_field="address", transformation=TransformationType.TRIM),
        MappingRule(source_field="City", target_field="city", transformation=TransformationType.DIRECT),
        MappingRule(source_field="State", target_field="state", transformation=TransformationType.UPPERCASE),
        MappingRule(source_field="ZipCode", target_field="postal_code", transformation=TransformationType.DIRECT),
        MappingRule(source_field="DateCreated", target_field="created_date", transformation=TransformationType.DIRECT),
        MappingRule(source_field="LastPurchase", target_field="last_activity", transformation=TransformationType.DIRECT),
        MappingRule(source_field="TotalSpent", target_field="lifetime_value", transformation=TransformationType.DIRECT),
    ]

    # Define validation rules
    validation_rules = [
        ValidationRule(
            field="EmailAddr",
            rule_type=ValidationType.REQUIRED,
            level=ValidationLevel.ERROR,
        ),
        ValidationRule(
            field="CustomerID",
            rule_type=ValidationType.UNIQUE,
            level=ValidationLevel.ERROR,
        ),
    ]

    # Execute migration
    print(f"\nExecuting migration pipeline...")
    migration, transformed_df = orchestrator.execute_migration(
        migration=migration,
        df=df,
        mapping=base_mapping,
        validation_rules=validation_rules,
    )

    print(f"\nMigration Complete:")
    print(f"  Status: {migration.status.value}")
    print(f"  Total Records: {migration.total_records}")
    print(f"  Processed: {migration.processed_records}")
    print(f"  Success Rate: {migration.success_rate:.1f}%")
    print(f"  Steps Completed: {len(migration.steps)}")

    print(f"\nPipeline Steps:")
    for step in migration.steps:
        print(f"  {step.name}: {step.status.value}")
        if step.metrics:
            for key, value in list(step.metrics.items())[:3]:
                print(f"    {key}: {value}")

    # Save results
    output_path = "sample_data/migrated_output.csv"
    output_connector = CSVConnector(output_path)
    output_connector.write_data(transformed_df)
    print(f"\nResults saved to: {output_path}")

    return migration, transformed_df


def main():
    """Run complete demo."""
    print("\n" + "=" * 60)
    print("  DATABRIDGE DEMO")
    print("  Legacy System Migration Tool")
    print("=" * 60)

    try:
        # Demo 1: Data Profiling
        df = demo_data_profiling()

        # Demo 2: Field Mapping
        mapping = demo_field_mapping(df)

        # Demo 3: Validation
        validation_result = demo_validation(df)

        # Demo 4: Transformation
        transformed_df = demo_transformation(df, mapping)

        # Demo 5: Full Migration Pipeline
        migration, final_df = demo_full_migration(df)

        print_section("DEMO COMPLETE")
        print("DataBridge successfully demonstrated:")
        print("  ✓ Data profiling and analysis")
        print("  ✓ Intelligent field mapping")
        print("  ✓ Comprehensive validation")
        print("  ✓ Flexible transformations")
        print("  ✓ Complete migration pipeline")
        print(f"\nMigrated {len(final_df)} records successfully!")
        print("\nNext Steps:")
        print("  1. Check sample_data/migrated_output.csv")
        print("  2. Run the API: python -m src.main")
        print("  3. Visit http://localhost:8000/docs")
        print("  4. Deploy with: docker-compose up")

    except Exception as e:
        print(f"\nError during demo: {e}")
        import traceback
        traceback.print_exc()
        return 1

    return 0


if __name__ == "__main__":
    exit(main())
