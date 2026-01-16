from typing import Any, List
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from app.api.v1 import deps
from app.database import get_db
from app.models.announcement import Announcement, AnnouncementAck
from app.models.user import User, UserRole
from app.schemas import announcement as announcement_schema

router = APIRouter()

from sqlalchemy.orm import selectinload

@router.get("/", response_model=List[announcement_schema.Announcement])
async def read_announcements(
    db: AsyncSession = Depends(get_db),
    skip: int = 0,
    limit: int = 100,
    current_user: User = Depends(deps.get_current_active_user),
) -> Any:
    """
    Retrieve announcements with acknowledgements.
    """
    # Eager load acks and the nested user within acks
    query = select(Announcement)\
        .options(selectinload(Announcement.acks).selectinload(AnnouncementAck.user))\
        .filter(Announcement.is_active == True)\
        .offset(skip).limit(limit)
    
    result = await db.execute(query)
    return result.scalars().all()

@router.post("/", response_model=announcement_schema.Announcement)
async def create_announcement(
    *,
    db: AsyncSession = Depends(get_db),
    announcement_in: announcement_schema.AnnouncementCreate,
    current_user: User = Depends(deps.get_current_active_manager), # Manager/Admin
) -> Any:
    """
    Create announcement.
    """
    try:
        announcement = Announcement(**announcement_in.model_dump())
        db.add(announcement)
        await db.commit()
        await db.refresh(announcement)
        
        # Manually construct Pydantic model to avoid Greenlet/LazyLoad error
        return announcement_schema.Announcement(
            id=announcement.id,
            title=announcement.title,
            content=announcement.content,
            is_active=announcement.is_active,
            created_at=announcement.created_at,
            acks=[] 
        )
    except Exception as e:
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/{id}/acknowledge", response_model=announcement_schema.AnnouncementAck)
async def acknowledge_announcement(
    *,
    db: AsyncSession = Depends(get_db),
    id: int,
    current_user: User = Depends(deps.get_current_active_user),
) -> Any:
    """
    Acknowledge an announcement.
    """
    # Check if already acknowledged
    result = await db.execute(select(AnnouncementAck).where(
        AnnouncementAck.announcement_id == id,
        AnnouncementAck.user_id == current_user.id
    ))
    if result.scalars().first():
        raise HTTPException(status_code=400, detail="Already acknowledged")
    
    ack = AnnouncementAck(announcement_id=id, user_id=current_user.id)
    db.add(ack)
    await db.commit()
    await db.refresh(ack)
    return ack
