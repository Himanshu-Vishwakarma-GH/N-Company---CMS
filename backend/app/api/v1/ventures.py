from typing import Any, List
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from app.api.v1 import deps
from app.database import get_db
from app.models.venture import Venture
from app.schemas import venture as venture_schema

router = APIRouter()

@router.get("/", response_model=List[venture_schema.Venture])
async def read_ventures(
    db: AsyncSession = Depends(get_db),
    skip: int = 0,
    limit: int = 100,
    current_user: deps.User = Depends(deps.get_current_active_user),
) -> Any:
    """
    Retrieve ventures.
    """
    result = await db.execute(select(Venture).offset(skip).limit(limit))
    ventures = result.scalars().all()
    return ventures

@router.post("/", response_model=venture_schema.Venture)
async def create_venture(
    *,
    db: AsyncSession = Depends(get_db),
    venture_in: venture_schema.VentureCreate,
    current_user: deps.User = Depends(deps.get_current_active_admin), # Only Admin
) -> Any:
    """
    Create new venture.
    """
    venture = Venture(name=venture_in.name, description=venture_in.description)
    db.add(venture)
    await db.commit()
    await db.refresh(venture)
    return venture

@router.put("/{venture_id}", response_model=venture_schema.Venture)
async def update_venture(
    *,
    db: AsyncSession = Depends(get_db),
    venture_id: int,
    venture_in: venture_schema.VentureUpdate,
    current_user: deps.User = Depends(deps.get_current_active_admin),
) -> Any:
    """
    Update a venture.
    """
    venture = await db.get(Venture, venture_id)
    if not venture:
        raise HTTPException(
            status_code=404,
            detail="The venture with this id does not exist",
        )
    
    update_data = venture_in.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(venture, field, value)

    db.add(venture)
    await db.commit()
    await db.refresh(venture)
    return venture
