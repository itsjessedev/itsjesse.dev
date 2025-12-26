"""Validation API endpoints."""

from fastapi import APIRouter, HTTPException
from typing import List, Dict, Any
import pandas as pd

from ..models.validation import ValidationRule, ValidationResult
from ..services.validator import DataValidator

router = APIRouter(prefix="/validation", tags=["validation"])
validator = DataValidator()


@router.post("/validate-data")
async def validate_data(
    data: List[Dict[str, Any]],
    rules: List[Dict[str, Any]],
):
    """Validate data against rules."""
    try:
        # Convert to DataFrame
        df = pd.DataFrame(data)

        # Parse rules
        validation_rules = [ValidationRule(**rule) for rule in rules]

        # Validate
        result = validator.validate_dataframe(df, validation_rules)

        return result
    except Exception as e:
        raise HTTPException(
            status_code=400,
            detail=f"Validation failed: {str(e)}",
        )


@router.post("/suggest-rules")
async def suggest_validation_rules(fields: List[Dict[str, Any]]):
    """Suggest validation rules based on field types."""
    from ..models.validation import ValidationType, ValidationLevel

    suggestions = []

    for field in fields:
        field_name = field.get("name")
        field_type = field.get("type")
        is_nullable = field.get("nullable", True)

        # Required rule
        if not is_nullable:
            suggestions.append({
                "field": field_name,
                "rule_type": ValidationType.REQUIRED,
                "level": ValidationLevel.ERROR,
                "params": {},
                "message": f"{field_name} is required",
            })

        # Type-specific rules
        if field_type == "email":
            suggestions.append({
                "field": field_name,
                "rule_type": ValidationType.REGEX,
                "level": ValidationLevel.ERROR,
                "params": {
                    "pattern": r"^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$"
                },
                "message": f"{field_name} must be valid email",
            })

        elif field_type == "phone":
            suggestions.append({
                "field": field_name,
                "rule_type": ValidationType.REGEX,
                "level": ValidationLevel.WARNING,
                "params": {
                    "pattern": r"^\+?1?\d{9,15}$"
                },
                "message": f"{field_name} should be valid phone number",
            })

        elif field_type == "id":
            suggestions.append({
                "field": field_name,
                "rule_type": ValidationType.UNIQUE,
                "level": ValidationLevel.ERROR,
                "params": {},
                "message": f"{field_name} must be unique",
            })

    return {"suggestions": suggestions}


@router.post("/check-rule")
async def check_validation_rule(
    sample_value: Any,
    rule: Dict[str, Any],
):
    """Test a validation rule against a sample value."""
    from ..models.validation import ValidationIssue
    import pandas as pd

    try:
        validation_rule = ValidationRule(**rule)

        # Create sample DataFrame
        df = pd.DataFrame([{validation_rule.field: sample_value}])

        # Apply rule
        result = validator._apply_rule(df, validation_rule)

        return {
            "value": sample_value,
            "rule": validation_rule,
            "passes": len(result) == 0,
            "issues": [issue.message for issue in result],
        }
    except Exception as e:
        raise HTTPException(
            status_code=400,
            detail=f"Rule check failed: {str(e)}",
        )
