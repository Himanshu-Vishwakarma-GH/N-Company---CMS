from typing import Optional
from datetime import date, datetime
from pydantic import BaseModel, ConfigDict
from app.models.leave import LeaveType, LeaveStatus

class LeaveBase(BaseModel):
    leave_type: Optional[LeaveType] = None
    start_date: Optional[date] = None
    end_date: Optional[date] = None
    reason: Optional[str] = None

class LeaveCreate(LeaveBase):
    leave_type: LeaveType
    start_date: date
    end_date: date

class LeaveUpdate(BaseModel):
    status: LeaveStatus
    # Manager can add rejection reason logic here if needed, but for MVP just status

class LeaveInDBBase(LeaveBase):
    id: int
    user_id: int
    status: LeaveStatus
    applied_at: datetime
    reviewed_at: Optional[datetime] = None
    reviewed_by_id: Optional[int] = None
    model_config = ConfigDict(from_attributes=True)

class Leave(LeaveInDBBase):
    pass

class HolidayBase(BaseModel):
    name: Optional[str] = None
    date: Optional[date] = None
    venture_id: Optional[int] = None

class HolidayCreate(HolidayBase):
    name: str
    date: date

class Holiday(HolidayBase):
    id: int
    model_config = ConfigDict(from_attributes=True)
