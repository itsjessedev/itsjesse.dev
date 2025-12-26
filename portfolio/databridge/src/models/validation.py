"""Validation models."""

from enum import Enum
from typing import Dict, List, Optional, Any
from pydantic import BaseModel, Field


class ValidationLevel(str, Enum):
    """Validation severity level."""
    ERROR = "error"
    WARNING = "warning"
    INFO = "info"


class ValidationType(str, Enum):
    """Validation rule types."""
    REQUIRED = "required"
    TYPE = "type"
    RANGE = "range"
    REGEX = "regex"
    LENGTH = "length"
    UNIQUE = "unique"
    REFERENCE = "reference"
    CUSTOM = "custom"


class ValidationRule(BaseModel):
    """Validation rule."""
    field: str
    rule_type: ValidationType
    level: ValidationLevel = ValidationLevel.ERROR
    params: Dict[str, Any] = Field(default_factory=dict)
    message: Optional[str] = None

    def get_message(self, value: Any = None) -> str:
        """Get validation message."""
        if self.message:
            return self.message

        messages = {
            ValidationType.REQUIRED: f"Field '{self.field}' is required",
            ValidationType.TYPE: f"Field '{self.field}' has invalid type",
            ValidationType.RANGE: f"Field '{self.field}' is out of range",
            ValidationType.REGEX: f"Field '{self.field}' does not match pattern",
            ValidationType.LENGTH: f"Field '{self.field}' has invalid length",
            ValidationType.UNIQUE: f"Field '{self.field}' must be unique",
            ValidationType.REFERENCE: f"Field '{self.field}' references invalid value",
        }
        return messages.get(self.rule_type, f"Validation failed for '{self.field}'")


class ValidationIssue(BaseModel):
    """Single validation issue."""
    record_index: int
    field: str
    rule: ValidationRule
    value: Any
    message: str


class ValidationResult(BaseModel):
    """Validation results."""
    total_records: int
    valid_records: int
    invalid_records: int
    issues: List[ValidationIssue] = Field(default_factory=list)

    # Group issues by level
    errors: List[ValidationIssue] = Field(default_factory=list)
    warnings: List[ValidationIssue] = Field(default_factory=list)
    info: List[ValidationIssue] = Field(default_factory=list)

    @property
    def success_rate(self) -> float:
        """Calculate success rate."""
        if self.total_records == 0:
            return 0.0
        return (self.valid_records / self.total_records) * 100

    @property
    def has_errors(self) -> bool:
        """Check if there are any errors."""
        return len(self.errors) > 0

    def add_issue(self, issue: ValidationIssue):
        """Add validation issue."""
        self.issues.append(issue)

        if issue.rule.level == ValidationLevel.ERROR:
            self.errors.append(issue)
        elif issue.rule.level == ValidationLevel.WARNING:
            self.warnings.append(issue)
        else:
            self.info.append(issue)
