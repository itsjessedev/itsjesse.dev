"""Field mapping API endpoints."""

from fastapi import APIRouter, HTTPException
from typing import List, Dict, Any

from ..models.mapping import FieldMapping, MappingRule
from ..services.mapper import FieldMapper

router = APIRouter(prefix="/mappings", tags=["mappings"])
mapper = FieldMapper()


@router.post("/auto-map")
async def auto_map_fields(
    source_fields: List[str],
    target_fields: List[str],
    case_sensitive: bool = False,
    fuzzy_threshold: float = 0.8,
):
    """Automatically map fields using intelligent matching."""
    mapping = mapper.auto_map_fields(
        source_fields=source_fields,
        target_fields=target_fields,
        case_sensitive=case_sensitive,
        fuzzy_threshold=fuzzy_threshold,
    )
    return mapping


@router.post("/validate")
async def validate_mapping(mapping: FieldMapping):
    """Validate field mapping configuration."""
    issues = []

    # Check for duplicate source fields
    source_fields = [m.source_field for m in mapping.mappings]
    if len(source_fields) != len(set(source_fields)):
        issues.append("Duplicate source fields in mapping")

    # Check for duplicate target fields
    target_fields = [m.target_field for m in mapping.mappings]
    if len(target_fields) != len(set(target_fields)):
        issues.append("Duplicate target fields in mapping")

    # Check for required fields
    required_targets = [
        m.target_field for m in mapping.mappings if m.required
    ]
    missing_required = set(required_targets) - set(target_fields)
    if missing_required:
        issues.append(f"Missing required target fields: {missing_required}")

    return {
        "valid": len(issues) == 0,
        "issues": issues,
    }


@router.post("/preview-transformation")
async def preview_transformation(
    sample_data: Dict[str, Any],
    rule: MappingRule,
):
    """Preview how a transformation rule will affect sample data."""
    from ..services.transformer import DataTransformer
    import pandas as pd

    transformer = DataTransformer()

    # Create sample DataFrame
    df = pd.DataFrame([sample_data])

    try:
        result = transformer._apply_transformation(df, rule)
        return {
            "input": sample_data.get(rule.source_field),
            "output": result.iloc[0] if len(result) > 0 else None,
            "transformation": rule.transformation,
        }
    except Exception as e:
        raise HTTPException(
            status_code=400,
            detail=f"Transformation failed: {str(e)}",
        )
