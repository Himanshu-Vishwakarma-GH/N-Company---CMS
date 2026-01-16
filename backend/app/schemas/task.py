from typing import Optional, List
from datetime import datetime
from pydantic import BaseModel, ConfigDict
from app.models.task import TaskStatus, TaskPriority

class TaskBase(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None
    status: Optional[TaskStatus] = TaskStatus.ASSIGNED
    priority: Optional[TaskPriority] = TaskPriority.MEDIUM
    due_date: Optional[datetime] = None
    progress: Optional[int] = 0
    assigned_to_id: Optional[int] = None

class TaskCreate(TaskBase):
    title: str
    assigned_to_ids: List[int] = [] # Changed from single ID to list
    assigned_to_id: Optional[int] = None # Optional now

class TaskUpdate(TaskBase):
    pass

class TaskInDBBase(TaskBase):
    id: int
    created_at: datetime
    updated_at: datetime
    created_by_id: int
    model_config = ConfigDict(from_attributes=True)

class TaskAssignee(BaseModel):
    id: int
    full_name: str
    model_config = ConfigDict(from_attributes=True)

from app.schemas.time_log import TimeLog

# ...

class Task(TaskInDBBase):
    assignee: Optional[TaskAssignee] = None
    time_logs: List[TimeLog] = []
    active_timer_start: Optional[datetime] = None
