from typing import Optional
from datetime import datetime
from pydantic import BaseModel, ConfigDict

class AnnouncementBase(BaseModel):
    title: Optional[str] = None
    content: Optional[str] = None
    is_active: Optional[bool] = True

class AnnouncementCreate(AnnouncementBase):
    title: str
    content: str

class AnnouncementUpdate(AnnouncementBase):
    pass

class AnnouncementInDBBase(AnnouncementBase):
    id: int
    created_at: datetime
    model_config = ConfigDict(from_attributes=True)

class Announcement(AnnouncementInDBBase):
    pass

class AnnouncementAckBase(BaseModel):
    announcement_id: int

class AnnouncementAckCreate(AnnouncementAckBase):
    pass

class AnnouncementAck(AnnouncementAckBase):
    id: int
    user_id: int
    acknowledged_at: datetime
    model_config = ConfigDict(from_attributes=True)
