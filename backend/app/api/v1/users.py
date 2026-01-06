from typing import Any, List
from fastapi import APIRouter, Body, Depends, HTTPException, status
from fastapi.encoders import jsonable_encoder
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from app.api.v1 import deps
from app.core import security
from app.database import get_db
from app.models.user import User, UserRole
from app.schemas import user as user_schema

router = APIRouter()

@router.get("/", response_model=List[user_schema.User])
async def read_users(
    db: AsyncSession = Depends(get_db),
    skip: int = 0,
    limit: int = 100,
    current_user: User = Depends(deps.get_current_active_manager),
) -> Any:
    """
    Retrieve users.
    """
    query = select(User).offset(skip).limit(limit)
    
    if current_user.role == UserRole.MANAGER:
         # Manager can only see users in their venture
         if current_user.venture_id:
             query = query.where(User.venture_id == current_user.venture_id)
         else:
             # If Manager has no venture, return empty or self?
             # Should probably filter by venture_id is null? Or just their own?
             # For now let's assume Managers must have a venture
             query = query.where(User.venture_id == -1) # No results

    result = await db.execute(query)
    users = result.scalars().all()
    return users

@router.post("/", response_model=user_schema.User)
async def create_user(
    *,
    db: AsyncSession = Depends(get_db),
    user_in: user_schema.UserCreate,
    current_user: User = Depends(deps.get_current_active_manager),
) -> Any:
    """
    Create new user.
    """
    # Check permissions
    if current_user.role == UserRole.MANAGER:
        if user_in.role == UserRole.ADMIN:
             raise HTTPException(
                status_code=403,
                detail="Managers cannot create Admins",
            )
        # Force venture_id to match manager's venture
        if user_in.venture_id != current_user.venture_id:
             raise HTTPException(
                status_code=403,
                detail="Managers can only create users in their own venture",
            )
    
    # Check if user exists
    result = await db.execute(select(User).where(User.emp_id == user_in.emp_id))
    existing_user = result.scalars().first()
    if existing_user:
        raise HTTPException(
            status_code=400,
            detail="The user with this Employee ID already exists in the system.",
        )
    
    user = User(
        emp_id=user_in.emp_id,
        hashed_password=security.get_password_hash(user_in.password),
        full_name=user_in.full_name,
        role=user_in.role,
        venture_id=user_in.venture_id,
        is_active=user_in.is_active,
    )
    db.add(user)
    await db.commit()
    await db.refresh(user)
    return user

@router.put("/{user_id}", response_model=user_schema.User)
async def update_user(
    *,
    db: AsyncSession = Depends(get_db),
    user_id: int,
    user_in: user_schema.UserUpdate,
    current_user: User = Depends(deps.get_current_active_manager),
) -> Any:
    """
    Update a user.
    """
    user = await db.get(User, user_id)
    if not user:
        raise HTTPException(
            status_code=404,
            detail="The user with this id does not exist in the system",
        )
    
    # Permission checks for Managers
    if current_user.role == UserRole.MANAGER:
        # Cannot edit Admins
        if user.role == UserRole.ADMIN:
             raise HTTPException(status_code=403, detail="Managers cannot edit Admins")
        
        # Cannot edit users in other ventures
        if user.venture_id != current_user.venture_id:
             raise HTTPException(status_code=403, detail="Managers cannot edit users in other ventures")
             
        # Cannot promote to Admin
        if user_in.role == UserRole.ADMIN:
             raise HTTPException(status_code=403, detail="Managers cannot promote to Admin")

        # Cannot change venture ID (must stay in manager's venture)
        if user_in.venture_id != current_user.venture_id:
             # Just ignore or raise? Let's force it to remain same if passed, or allow if it matches.
             # If they try to change it to something else:
             if user_in.venture_id is not None and user_in.venture_id != current_user.venture_id:
                 raise HTTPException(status_code=403, detail="Managers cannot move users to other ventures")
    
    update_data = user_in.model_dump(exclude_unset=True)
    if "password" in update_data and update_data["password"]:
        hashed_password = security.get_password_hash(update_data["password"])
        del update_data["password"]
        update_data["hashed_password"] = hashed_password
        
    for field, value in update_data.items():
        setattr(user, field, value)

    db.add(user)
    await db.commit()
    await db.refresh(user)
    return user

@router.get("/me", response_model=user_schema.User)
async def read_user_me(
    current_user: User = Depends(deps.get_current_active_user),
) -> Any:
    """
    Get current user.
    """
    return current_user
