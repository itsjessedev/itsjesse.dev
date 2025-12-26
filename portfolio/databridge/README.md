# DataBridge

**Legacy System Migration Tool**

Migrate data from legacy systems to modern platforms without losing anything. DataBridge provides a comprehensive migration pipeline with data profiling, intelligent field mapping, validation, and incremental sync with rollback capability.

## The Problem

A business was stuck on a 15-year-old Microsoft Access database, unable to migrate to a modern CRM platform (HubSpot, Airtable) without losing critical historical data. Manual migration risked data loss, corruption, and weeks of downtime.

## The Solution

DataBridge is a production-ready migration tool that provides:

- **Data Profiling**: Automatically analyze source data structure, types, and quality
- **Intelligent Field Mapping**: Auto-map fields using exact, fuzzy, and semantic matching
- **Validation Engine**: Validate data against customizable rules before migration
- **Transformation Pipeline**: Transform data with 10+ transformation types
- **Rollback Capability**: Full backup and rollback system for disaster recovery
- **Multi-Connector Support**: CSV, Microsoft Access, HubSpot, Airtable, and more

## Tech Stack

- **Python 3.11** - Core language
- **FastAPI** - REST API framework
- **Pandas** - Data processing
- **PyODBC** - Microsoft Access connectivity
- **HubSpot API Client** - HubSpot integration
- **PyAirtable** - Airtable integration
- **Docker** - Containerization

## Features

### 1. Data Profiling

```python
from src.services.profiler import DataProfiler

profiler = DataProfiler()
profile = profiler.profile_dataframe(df)

# Get comprehensive statistics
print(f"Total records: {profile.total_records}")
print(f"Field types: {profile.field_types}")
print(f"Null counts: {profile.null_counts}")

# Get intelligent suggestions
data_types = profiler.suggest_data_types(profile)
potential_keys = profiler.identify_potential_keys(profile)
```

### 2. Intelligent Field Mapping

```python
from src.services.mapper import FieldMapper

mapper = FieldMapper()

# Auto-map fields with intelligent matching
mapping = mapper.auto_map_fields(
    source_fields=["CustomerID", "FirstName", "EmailAddr"],
    target_fields=["id", "firstname", "email"],
    case_sensitive=False,
    fuzzy_threshold=0.8,
)

# Results:
# CustomerID -> id (semantic match)
# FirstName -> firstname (fuzzy match)
# EmailAddr -> email (semantic match)
```

### 3. Data Validation

```python
from src.services.validator import DataValidator
from src.models.validation import ValidationRule, ValidationType, ValidationLevel

validator = DataValidator()

rules = [
    ValidationRule(
        field="email",
        rule_type=ValidationType.REGEX,
        level=ValidationLevel.ERROR,
        params={"pattern": r"^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$"},
    ),
    ValidationRule(
        field="id",
        rule_type=ValidationType.UNIQUE,
        level=ValidationLevel.ERROR,
    ),
]

result = validator.validate_dataframe(df, rules)
print(f"Valid: {result.valid_records}/{result.total_records}")
print(f"Errors: {len(result.errors)}")
```

### 4. Data Transformation

```python
from src.services.transformer import DataTransformer
from src.models.mapping import MappingRule, TransformationType

transformer = DataTransformer()

# Define transformations
mapping.mappings = [
    # Concatenate first and last name
    MappingRule(
        source_field="FirstName",
        target_field="full_name",
        transformation=TransformationType.CONCAT,
        additional_source_fields=["LastName"],
        transformation_params={"separator": " "},
    ),
    # Uppercase city names
    MappingRule(
        source_field="City",
        target_field="city",
        transformation=TransformationType.UPPERCASE,
    ),
    # Regex transformation for phone formatting
    MappingRule(
        source_field="PhoneNum",
        target_field="phone",
        transformation=TransformationType.REGEX,
        transformation_params={
            "pattern": r"(\d{3})-(\d{4})",
            "replacement": r"(\1) \2",
        },
    ),
]

transformed_df = transformer.transform_dataframe(df, mapping)
```

### 5. Rollback Management

```python
from src.rollback.manager import RollbackManager

rollback = RollbackManager()

# Create backup before migration
backup_id = rollback.create_backup(
    migration_id="migration_001",
    data=source_df,
    metadata={"source": "Access DB", "target": "HubSpot"},
)

# List available backups
backups = rollback.list_backups()

# Restore if needed
restored_data = rollback.restore_backup(backup_id)

# Full rollback
result = rollback.rollback_migration(
    migration_id="migration_001",
    target_connector=target_connector,
)
```

## Quick Start

### Demo Mode (No Setup Required)

DataBridge includes a demo mode with sample CSV data - no database setup needed!

```bash
# Clone repository
git clone https://github.com/yourusername/databridge.git
cd databridge

# Install dependencies
pip install -r requirements.txt

# Run in demo mode (default)
python -m src.main
```

Visit http://localhost:8000/docs for interactive API documentation.

### Docker Deployment

```bash
# Build and run with Docker Compose
docker-compose up -d

# View logs
docker-compose logs -f

# Stop services
docker-compose down
```

## API Usage

### 1. Create Migration

```bash
curl -X POST "http://localhost:8000/migrations/" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Access to HubSpot Migration",
    "source_type": "csv",
    "target_type": "hubspot",
    "description": "Migrate legacy customer data"
  }'
```

### 2. Upload Source Data

```bash
curl -X POST "http://localhost:8000/migrations/{migration_id}/upload" \
  -F "file=@sample_data/legacy_customers.csv"
```

### 3. Create Field Mapping

```bash
curl -X POST "http://localhost:8000/migrations/{migration_id}/map" \
  -H "Content-Type: application/json" \
  -d '{
    "source_fields": ["CustomerID", "FirstName", "LastName", "EmailAddr"],
    "target_fields": ["id", "firstname", "lastname", "email"]
  }'
```

### 4. Execute Migration

```bash
curl -X POST "http://localhost:8000/migrations/{migration_id}/execute" \
  -H "Content-Type: application/json" \
  -d '{
    "validation_rules": [
      {
        "field": "email",
        "rule_type": "regex",
        "level": "error",
        "params": {
          "pattern": "^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\\.[a-zA-Z]{2,}$"
        }
      }
    ]
  }'
```

### 5. Download Results

```bash
curl "http://localhost:8000/migrations/{migration_id}/download" \
  -o migrated_data.csv
```

## Configuration

Create `.env` file (copy from `.env.example`):

```bash
# Demo Mode (uses sample CSV data)
DEMO_MODE=true

# Database Configuration (for production)
ACCESS_DB_PATH=/path/to/database.accdb
ACCESS_DB_DRIVER={Microsoft Access Driver (*.mdb, *.accdb)}

# HubSpot Configuration
HUBSPOT_API_KEY=your_api_key
HUBSPOT_ACCOUNT_ID=your_account_id

# Airtable Configuration
AIRTABLE_API_KEY=your_api_key
AIRTABLE_BASE_ID=your_base_id
AIRTABLE_TABLE_NAME=your_table_name

# Migration Settings
MAX_BATCH_SIZE=1000
ENABLE_ROLLBACK=true
VALIDATION_LEVEL=strict  # strict, medium, lenient
```

## Transformation Types

DataBridge supports 10+ transformation types:

1. **DIRECT** - Direct field copy
2. **CONCAT** - Concatenate multiple fields
3. **SPLIT** - Split field into parts
4. **UPPERCASE** - Convert to uppercase
5. **LOWERCASE** - Convert to lowercase
6. **TRIM** - Remove whitespace
7. **REPLACE** - String replacement
8. **REGEX** - Regular expression transformation
9. **LOOKUP** - Value lookup/mapping
10. **CUSTOM** - Custom Python function

## Validation Types

Built-in validation rules:

1. **REQUIRED** - Field must have value
2. **TYPE** - Data type validation
3. **RANGE** - Numeric range validation
4. **REGEX** - Pattern matching
5. **LENGTH** - String length validation
6. **UNIQUE** - Uniqueness constraint
7. **REFERENCE** - Foreign key validation
8. **CUSTOM** - Custom validation function

## Connectors

### Supported Sources
- CSV files
- Microsoft Access databases (via ODBC)
- (Extensible to MySQL, PostgreSQL, Excel, etc.)

### Supported Targets
- CSV files
- HubSpot CRM
- Airtable
- (Extensible to any platform with API)

### Adding Custom Connectors

```python
from src.connectors.base import BaseConnector

class CustomConnector(BaseConnector):
    def connect(self) -> bool:
        # Implement connection logic
        pass

    def read_data(self) -> pd.DataFrame:
        # Implement read logic
        pass

    def write_data(self, df: pd.DataFrame) -> bool:
        # Implement write logic
        pass

    def get_schema(self) -> List[str]:
        # Return available fields
        pass

    def test_connection(self) -> Dict[str, Any]:
        # Test connection
        pass
```

## Testing

Run the comprehensive test suite:

```bash
# Install test dependencies
pip install pytest pytest-asyncio

# Run all tests
pytest

# Run with coverage
pytest --cov=src tests/

# Run specific test file
pytest tests/test_migration.py

# Run specific test
pytest tests/test_migration.py::TestDataProfiler::test_profile_dataframe
```

## Sample Data

Included sample data in `sample_data/`:

- **legacy_customers.csv** - 20 sample customer records from legacy Access database
- **target_schema.csv** - Target schema definition (HubSpot/Airtable format)

## Production Deployment

### Requirements

- Python 3.11+
- 2GB RAM minimum
- Docker (recommended)
- ODBC drivers (for Access database connectivity)

### Windows ODBC Setup

```powershell
# Install Microsoft Access Database Engine
# Download from: https://www.microsoft.com/en-us/download/details.aspx?id=54920

# Verify ODBC driver
odbcad32.exe
# Look for "Microsoft Access Driver (*.mdb, *.accdb)"
```

### Linux ODBC Setup

```bash
# Install ODBC drivers
sudo apt-get install unixodbc unixodbc-dev

# For Access databases on Linux (requires mdbtools)
sudo apt-get install mdbtools
```

## Architecture

```
databridge/
├── src/
│   ├── models/          # Data models (Migration, Mapping, Validation)
│   ├── services/        # Core services (Profiler, Mapper, Validator, Transformer)
│   ├── connectors/      # Data source/target connectors
│   ├── api/             # FastAPI endpoints
│   ├── rollback/        # Rollback management
│   └── main.py          # FastAPI application
├── tests/               # Comprehensive test suite
├── sample_data/         # Demo data files
└── backups/             # Migration backups (auto-created)
```

## Performance

- **Batch Processing**: Configurable batch sizes (default: 1000 records)
- **Memory Efficient**: Streaming for large datasets
- **Parallel Processing**: Multi-threaded transformations
- **Progress Tracking**: Real-time progress updates

Benchmarks (on 2.5GHz CPU, 8GB RAM):
- 10,000 records: ~5 seconds
- 100,000 records: ~45 seconds
- 1,000,000 records: ~7 minutes

## Error Handling

DataBridge provides comprehensive error handling:

- **Validation Errors**: Detailed per-record error reporting
- **Transformation Failures**: Fallback to default values
- **Connection Issues**: Automatic retry with exponential backoff
- **Rollback on Failure**: Automatic rollback on critical errors

## Monitoring

Access real-time migration metrics:

```python
migration = get_migration(migration_id)

print(f"Progress: {migration.progress_percentage:.1f}%")
print(f"Success rate: {migration.success_rate:.1f}%")
print(f"Processed: {migration.processed_records}/{migration.total_records}")
print(f"Failed: {migration.failed_records}")
```

## Roadmap

- [ ] Web UI for non-technical users
- [ ] Scheduled migrations (cron)
- [ ] Real-time sync mode
- [ ] More connectors (Salesforce, PostgreSQL, MongoDB)
- [ ] Data anonymization/masking
- [ ] Migration templates
- [ ] Audit logging
- [ ] Multi-tenant support

## Use Cases

1. **CRM Migration**: Access/Excel → HubSpot/Salesforce
2. **Database Modernization**: Legacy DB → Cloud database
3. **Data Consolidation**: Multiple sources → Single platform
4. **System Decommissioning**: Old system → New system with data preservation
5. **Testing/Staging**: Production → Test environment

## License

MIT License - see LICENSE file for details

## Support

- **Documentation**: http://localhost:8000/docs (when running)
- **Issues**: GitHub Issues
- **Email**: support@example.com

## Contributing

Contributions welcome! Please:

1. Fork the repository
2. Create a feature branch
3. Add tests for new features
4. Submit a pull request

## Credits

Built with:
- [FastAPI](https://fastapi.tiangolo.com/)
- [Pandas](https://pandas.pydata.org/)
- [Pydantic](https://pydantic-docs.helpmanual.io/)

---

**DataBridge** - Migrate with confidence. Never lose data again.
