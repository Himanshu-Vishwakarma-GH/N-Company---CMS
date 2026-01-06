from sqlalchemy import Column, Integer, String, Enum as PyEnum, ForeignKey, DateTime, Integer
from sqlalchemy.orm import relationship
from app.database import Base
import enum
from datetime import datetime

class TaskStatus(str, enum.Enum):
    ASSIGNED = "ASSIGNED"
    IN_PROGRESS = "IN_PROGRESS"
    REVIEW = "REVIEW"
    COMPLETED = "COMPLETED"

class TaskPriority(str, enum.Enum):
    LOW = "LOW"
    MEDIUM = "MEDIUM"
    HIGH = "HIGH"
    URGENT = "URGENT"

class Task(Base):
    __tablename__ = "tasks"

    id = Column(Integer, primary_key=True, index=True)
    title = Column(String, nullable=False)
    description = Column(String, nullable=True)
    status = Column(PyEnum(TaskStatus), default=TaskStatus.ASSIGNED, nullable=False)
    priority = Column(PyEnum(TaskPriority), default=TaskPriority.MEDIUM, nullable=False)
    due_date = Column(DateTime, nullable=True)
    progress = Column(Integer, default=0) # 0 to 100
    
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    assigned_to_id = Column(Integer, ForeignKey("users.id"), nullable=True) # Can be null if assigned to a role (future scope)
    created_by_id = Column(Integer, ForeignKey("users.id"), nullable=False)

    assignee = relationship("User", foreign_keys=[assigned_to_id], back_populates="tasks_assigned", lazy="selectin")
    creator = relationship("User", foreign_keys=[created_by_id], back_populates="tasks_created", lazy="selectin")
