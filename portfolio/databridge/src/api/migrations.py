"""Migration API endpoints."""

from fastapi import APIRouter, HTTPException, UploadFile, File
from typing import Dict, Any, Optional, List
import pandas as pd
import io

from ..models.migration import Migration, MigrationStatus
from ..models.mapping import FieldMapping
from ..models.validation import ValidationRule
from ..services.migrator import MigrationOrchestrator
from ..connectors.csv import CSVConnector
from ..config import settings

router = APIRouter(prefix="/migrations", tags=["migrations"])

# In-memory storage for demo
migrations_db: Dict[str, Migration] = {}
mappings_db: Dict[str, FieldMapping] = {}
data_cache: Dict[str, pd.DataFrame] = {}

orchestrator = MigrationOrchestrator()


@router.post("/", response_model=Migration)
async def create_migration(
    name: str,
    source_type: str,
    target_type: str,
    description: Optional[str] = None,
):
    """Create new migration job."""
    migration = orchestrator.create_migration(
        name=name,
        source_type=source_type,
        target_type=target_type,
        description=description,
    )
    migrations_db[migration.id] = migration
    return migration


@router.get("/{migration_id}", response_model=Migration)
async def get_migration(migration_id: str):
    """Get migration by ID."""
    migration = migrations_db.get(migration_id)
    if not migration:
        raise HTTPException(status_code=404, detail="Migration not found")
    return migration


@router.get("/", response_model=List[Migration])
async def list_migrations():
    """List all migrations."""
    return list(migrations_db.values())


@router.post("/{migration_id}/upload")
async def upload_source_data(
    migration_id: str,
    file: UploadFile = File(...),
):
    """Upload source data CSV file."""
    migration = migrations_db.get(migration_id)
    if not migration:
        raise HTTPException(status_code=404, detail="Migration not found")

    try:
        # Read CSV file
        contents = await file.read()
        df = pd.read_csv(io.BytesIO(contents))

        # Cache data
        data_cache[migration_id] = df

        # Profile data
        migration = orchestrator.profile_data(migration, df)
        migrations_db[migration_id] = migration

        return {
            "status": "success",
            "records": len(df),
            "fields": list(df.columns),
        }
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Failed to process file: {str(e)}")


@router.post("/{migration_id}/map")
async def create_mapping(
    migration_id: str,
    source_fields: List[str],
    target_fields: List[str],
):
    """Create field mapping for migration."""
    migration = migrations_db.get(migration_id)
    if not migration:
        raise HTTPException(status_code=404, detail="Migration not found")

    migration, mapping = orchestrator.map_fields(
        migration, source_fields, target_fields
    )

    migrations_db[migration_id] = migration
    mappings_db[migration_id] = mapping

    return mapping


@router.post("/{migration_id}/execute")
async def execute_migration(
    migration_id: str,
    validation_rules: Optional[List[Dict[str, Any]]] = None,
):
    """Execute migration pipeline."""
    migration = migrations_db.get(migration_id)
    if not migration:
        raise HTTPException(status_code=404, detail="Migration not found")

    mapping = mappings_db.get(migration_id)
    if not mapping:
        raise HTTPException(status_code=400, detail="No mapping configured")

    df = data_cache.get(migration_id)
    if df is None:
        raise HTTPException(status_code=400, detail="No source data uploaded")

    # Parse validation rules if provided
    rules = []
    if validation_rules:
        rules = [ValidationRule(**rule) for rule in validation_rules]

    # Execute migration
    migration, transformed_df = orchestrator.execute_migration(
        migration, df, mapping, rules
    )

    # Cache transformed data
    data_cache[f"{migration_id}_transformed"] = transformed_df

    migrations_db[migration_id] = migration

    return {
        "migration": migration,
        "preview": transformed_df.head(10).to_dict("records"),
        "total_records": len(transformed_df),
    }


@router.get("/{migration_id}/download")
async def download_results(migration_id: str):
    """Download transformed data as CSV."""
    transformed_df = data_cache.get(f"{migration_id}_transformed")
    if transformed_df is None:
        raise HTTPException(status_code=404, detail="No transformed data available")

    # Convert to CSV
    csv_buffer = io.StringIO()
    transformed_df.to_csv(csv_buffer, index=False)

    return {
        "filename": f"migration_{migration_id}_results.csv",
        "content": csv_buffer.getvalue(),
    }


@router.delete("/{migration_id}")
async def delete_migration(migration_id: str):
    """Delete migration and associated data."""
    if migration_id not in migrations_db:
        raise HTTPException(status_code=404, detail="Migration not found")

    # Clean up
    del migrations_db[migration_id]
    mappings_db.pop(migration_id, None)
    data_cache.pop(migration_id, None)
    data_cache.pop(f"{migration_id}_transformed", None)

    return {"status": "deleted"}
