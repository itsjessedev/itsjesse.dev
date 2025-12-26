"""Migration models."""

from datetime import datetime
from enum import Enum
from typing import Dict, List, Optional, Any
from pydantic import BaseModel, Field


class MigrationStatus(str, Enum):
    """Migration status."""
    PENDING = "pending"
    PROFILING = "profiling"
    MAPPING = "mapping"
    VALIDATING = "validating"
    TRANSFORMING = "transforming"
    MIGRATING = "migrating"
    COMPLETED = "completed"
    FAILED = "failed"
    ROLLED_BACK = "rolled_back"


class MigrationStep(BaseModel):
    """Individual migration step."""
    name: str
    status: MigrationStatus
    started_at: Optional[datetime] = None
    completed_at: Optional[datetime] = None
    error: Optional[str] = None
    metrics: Dict[str, Any] = Field(default_factory=dict)


class Migration(BaseModel):
    """Migration job."""
    id: str
    name: str
    description: Optional[str] = None
    source_type: str
    target_type: str
    status: MigrationStatus = MigrationStatus.PENDING

    # Metadata
    created_at: datetime = Field(default_factory=datetime.utcnow)
    started_at: Optional[datetime] = None
    completed_at: Optional[datetime] = None

    # Progress tracking
    total_records: int = 0
    processed_records: int = 0
    failed_records: int = 0

    # Steps
    steps: List[MigrationStep] = Field(default_factory=list)

    # Configuration
    config: Dict[str, Any] = Field(default_factory=dict)

    # Results
    errors: List[str] = Field(default_factory=list)
    warnings: List[str] = Field(default_factory=list)

    @property
    def progress_percentage(self) -> float:
        """Calculate progress percentage."""
        if self.total_records == 0:
            return 0.0
        return (self.processed_records / self.total_records) * 100

    @property
    def success_rate(self) -> float:
        """Calculate success rate."""
        if self.processed_records == 0:
            return 0.0
        successful = self.processed_records - self.failed_records
        return (successful / self.processed_records) * 100


class DataProfile(BaseModel):
    """Data profiling results."""
    total_records: int
    total_fields: int
    field_types: Dict[str, str]
    null_counts: Dict[str, int]
    unique_counts: Dict[str, int]
    sample_values: Dict[str, List[Any]]
    field_statistics: Dict[str, Dict[str, Any]]
