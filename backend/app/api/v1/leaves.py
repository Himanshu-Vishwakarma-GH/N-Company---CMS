from typing import Any, List
from fastapi import APIRouter, Depends, HTTPException, Body
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from datetime import datetime

from app.api.v1 import deps
from app.database import get_db
from app.models.leave import Leave, Holiday, LeaveStatus
from app.models.user import User, UserRole
from app.schemas import leave as leave_schema

router = APIRouter()

# --- Leaves ---

@router.get("/", response_model=List[leave_schema.Leave])
async def read_leaves(
    db: AsyncSession = Depends(get_db),
    skip: int = 0,
    limit: int = 100,
    current_user: User = Depends(deps.get_current_active_user),
) -> Any:
    """
    Retrieve leaves.
    Manager sees pending requests (or all) for their venture?
    Employee sees their own.
    """
    query = select(Leave).offset(skip).limit(limit)
    if current_user.role == UserRole.EMPLOYEE:
        query = query.where(Leave.user_id == current_user.id)
    # Manager logic: Review implementation plan. "Manager/Admin: Approve / Reject".
    # Manager should probably see all leaves of users in their venture.
    
    result = await db.execute(query)
    leaves = result.scalars().all()
    return leaves

@router.post("/", response_model=leave_schema.Leave)
async def create_leave(
    *,
    db: AsyncSession = Depends(get_db),
    leave_in: leave_schema.LeaveCreate,
    current_user: User = Depends(deps.get_current_active_user),
) -> Any:
    """
    Request leave.
    """
    leave = Leave(
        **leave_in.model_dump(),
        user_id=current_user.id
    )
    db.add(leave)
    await db.commit()
    await db.refresh(leave)
    return leave

@router.put("/{id}/status", response_model=leave_schema.Leave)
async def update_leave_status(
    *,
    db: AsyncSession = Depends(get_db),
    id: int,
    status_in: leave_schema.LeaveUpdate,
    current_user: User = Depends(deps.get_current_active_manager),
) -> Any:
    """
    Approve or Reject leave.
    """
    result = await db.execute(select(Leave).where(Leave.id == id))
    leave = result.scalars().first()
    if not leave:
        raise HTTPException(status_code=404, detail="Leave not found")
        
    leave.status = status_in.status
    leave.reviewed_at = datetime.utcnow()
    leave.reviewed_by_id = current_user.id
    
    db.add(leave)
    await db.commit()
    await db.refresh(leave)
    return leave

# --- Holidays ---

@router.get("/holidays", response_model=List[leave_schema.Holiday])
async def read_holidays(
    db: AsyncSession = Depends(get_db),
    skip: int = 0,
    limit: int = 100,
    current_user: User = Depends(deps.get_current_active_user),
) -> Any:
    result = await db.execute(select(Holiday).offset(skip).limit(limit))
    return result.scalars().all()

@router.post("/holidays", response_model=leave_schema.Holiday)
async def create_holiday(
    *,
    db: AsyncSession = Depends(get_db),
    holiday_in: leave_schema.HolidayCreate,
    current_user: User = Depends(deps.get_current_active_manager),
) -> Any:
    holiday = Holiday(**holiday_in.model_dump())
    db.add(holiday)
    await db.commit()
    await db.refresh(holiday)
    return holiday
