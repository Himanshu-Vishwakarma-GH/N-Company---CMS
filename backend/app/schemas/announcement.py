from typing import Optional, List
from datetime import datetime
from pydantic import BaseModel, ConfigDict
from app.schemas.user import UserBase # Create dependency

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

class AnnouncementAckBase(BaseModel):
    announcement_id: int

class AnnouncementAckCreate(AnnouncementAckBase):
    pass

class AnnouncementAck(AnnouncementAckBase):
    id: int
    user_id: int
    acknowledged_at: datetime
    # Nested User for display
    user: Optional['UserBase'] = None 
    model_config = ConfigDict(from_attributes=True)

class Announcement(AnnouncementInDBBase):
    acks: List[AnnouncementAck] = []
