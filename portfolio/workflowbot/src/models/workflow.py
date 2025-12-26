"""Workflow definition models."""
import enum
from datetime import datetime

from sqlalchemy import Column, String, DateTime, Enum, JSON, Integer, ForeignKey, Text, Boolean
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func

from src.db.database import Base


class WorkflowStepType(str, enum.Enum):
    """Workflow step type enumeration."""
    FORM = "form"
    APPROVAL = "approval"
    ACTION = "action"
    NOTIFICATION = "notification"
    CONDITION = "condition"
    PARALLEL = "parallel"
    DELAY = "delay"


class Workflow(Base):
    """Workflow definition model."""

    __tablename__ = "workflows"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(100), unique=True, nullable=False, index=True)
    display_name = Column(String(200), nullable=False)
    description = Column(Text)

    # Workflow type and category
    workflow_type = Column(String(50), nullable=False, index=True)
    category = Column(String(50))

    # Configuration
    enabled = Column(Boolean, default=True)
    config = Column(JSON, default=dict)

    # Version control
    version = Column(Integer, default=1)

    # Timestamps
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

    # Relationships
    steps = relationship("WorkflowStep", back_populates="workflow", cascade="all, delete-orphan")

    def __repr__(self):
        return f"<Workflow(id={self.id}, name={self.name}, type={self.workflow_type})>"


class WorkflowStep(Base):
    """Workflow step model."""

    __tablename__ = "workflow_steps"

    id = Column(Integer, primary_key=True, index=True)
    workflow_id = Column(Integer, ForeignKey("workflows.id", ondelete="CASCADE"), nullable=False)

    name = Column(String(100), nullable=False)
    display_name = Column(String(200))
    description = Column(Text)

    step_type = Column(Enum(WorkflowStepType), nullable=False)
    order = Column(Integer, nullable=False)

    # Step configuration
    config = Column(JSON, default=dict)

    # Conditional execution
    condition = Column(Text)  # Expression to evaluate
    required = Column(Boolean, default=True)

    # Timeout and retry
    timeout = Column(Integer)  # Seconds
    max_retries = Column(Integer, default=0)

    # Relationships
    workflow = relationship("Workflow", back_populates="steps")

    def __repr__(self):
        return f"<WorkflowStep(id={self.id}, workflow={self.workflow_id}, name={self.name}, type={self.step_type})>"
