from typing import Optional
from datetime import datetime
from pydantic import BaseModel

class TimeLogBase(BaseModel):
    task_id: int
    user_id: int
    start_time: datetime
    end_time: datetime
    duration_minutes: int

class TimeLogCreate(TimeLogBase):
    pass

class TimeLog(TimeLogBase):
    id: int

    class Config:
        from_attributes = True
