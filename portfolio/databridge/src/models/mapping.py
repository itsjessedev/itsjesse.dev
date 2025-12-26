"""Field mapping models."""

from enum import Enum
from typing import Dict, List, Optional, Any
from pydantic import BaseModel, Field


class TransformationType(str, Enum):
    """Transformation types."""
    DIRECT = "direct"  # Direct copy
    CONCAT = "concat"  # Concatenate fields
    SPLIT = "split"  # Split field
    UPPERCASE = "uppercase"
    LOWERCASE = "lowercase"
    TRIM = "trim"
    REPLACE = "replace"
    REGEX = "regex"
    LOOKUP = "lookup"  # Value lookup/mapping
    CUSTOM = "custom"  # Custom function


class MappingRule(BaseModel):
    """Single field mapping rule."""
    source_field: str
    target_field: str
    transformation: TransformationType = TransformationType.DIRECT
    transformation_params: Dict[str, Any] = Field(default_factory=dict)
    required: bool = False
    default_value: Optional[Any] = None

    # For concat/split operations
    additional_source_fields: List[str] = Field(default_factory=list)

    # For lookup transformations
    lookup_table: Optional[Dict[str, Any]] = None


class FieldMapping(BaseModel):
    """Complete field mapping configuration."""
    migration_id: str
    source_fields: List[str]
    target_fields: List[str]
    mappings: List[MappingRule]

    # Unmapped fields
    unmapped_source_fields: List[str] = Field(default_factory=list)
    unmapped_target_fields: List[str] = Field(default_factory=list)

    # Auto-mapping configuration
    auto_map_enabled: bool = True
    case_sensitive: bool = False
    fuzzy_match_threshold: float = 0.8

    def get_mapping_for_source(self, source_field: str) -> Optional[MappingRule]:
        """Get mapping rule for source field."""
        for mapping in self.mappings:
            if mapping.source_field == source_field:
                return mapping
        return None

    def get_mapping_for_target(self, target_field: str) -> Optional[MappingRule]:
        """Get mapping rule for target field."""
        for mapping in self.mappings:
            if mapping.target_field == target_field:
                return mapping
        return None
