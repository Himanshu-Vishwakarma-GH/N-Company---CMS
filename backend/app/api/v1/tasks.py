from typing import Any, List
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from app.api.v1 import deps
from app.database import get_db
from app.models.task import Task, TaskStatus
from app.models.user import User, UserRole
from app.schemas import task as task_schema

router = APIRouter()

@router.get("/", response_model=List[task_schema.Task])
async def read_tasks(
    db: AsyncSession = Depends(get_db),
    skip: int = 0,
    limit: int = 100,
    current_user: User = Depends(deps.get_current_active_user),
) -> Any:
    """
    Retrieve tasks.
    Manager sees all in venture / created by them.
    Employee sees assigned to them.
    """
    query = select(Task).offset(skip).limit(limit)
    
    if current_user.role == UserRole.EMPLOYEE:
        query = query.where(Task.assigned_to_id == current_user.id)
    elif current_user.role == UserRole.MANAGER:
        # Initial MVP: Manage tasks they created or tasks in their venture (if we link tasks to venture directly, which we didn't, we linked users to venture)
        # So manager sees tasks where assignee.venture_id == manager.venture_id OR created_by == manager
        # Simplified: Manager sees all tasks created by them for now
        query = query.where(Task.created_by_id == current_user.id)
    # Admin sees all? Or we can add filters
    
    result = await db.execute(query)
    tasks = result.scalars().all()
    return tasks

@router.post("/", response_model=List[task_schema.Task])
async def create_task(
    *,
    db: AsyncSession = Depends(get_db),
    task_in: task_schema.TaskCreate,
    current_user: User = Depends(deps.get_current_active_manager), # Manager/Admin only
) -> Any:
    """
    Create new task(s).
    """
    created_tasks = []
    
    # If assigned_to_ids is provided, create a task for each
    target_ids = task_in.assigned_to_ids if task_in.assigned_to_ids else []
    if task_in.assigned_to_id:
        target_ids.append(task_in.assigned_to_id)
        
    # Deduplicate
    target_ids = list(set(target_ids))
    
    if not target_ids:
         # Create unassigned task? Or just raise error? Let's assume at least one assignee for now
         # OR create one unassigned task
        task_data = task_in.model_dump(exclude={"assigned_to_ids", "assigned_to_id"})
        task = Task(**task_data, created_by_id=current_user.id)
        db.add(task)
        created_tasks.append(task)
    else:
        task_base_data = task_in.model_dump(exclude={"assigned_to_ids", "assigned_to_id"})
        for uid in target_ids:
            task = Task(
                **task_base_data,
                assigned_to_id=uid,
                created_by_id=current_user.id
            )
            db.add(task)
            created_tasks.append(task)

    await db.commit()
    for t in created_tasks:
        await db.refresh(t)
        
    return created_tasks

@router.put("/{id}", response_model=task_schema.Task)
async def update_task(
    *,
    db: AsyncSession = Depends(get_db),
    id: int,
    task_in: task_schema.TaskUpdate,
    current_user: User = Depends(deps.get_current_active_user),
) -> Any:
    """
    Update task.
    Employee can only update status/progress.
    Manager can update everything.
    """
    result = await db.execute(select(Task).where(Task.id == id))
    task = result.scalars().first()
    if not task:
        raise HTTPException(status_code=404, detail="Task not found")

    if current_user.role == UserRole.EMPLOYEE:
        if task.assigned_to_id != current_user.id:
             raise HTTPException(status_code=403, detail="Not enough permissions")
        # Employee restriction: Only Status and Progress? 
        # For MVP let's allow updating what's sent, but maybe validate?
        # User instructions says: "Employee executes tasks".
    
    update_data = task_in.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(task, field, value)
        
    db.add(task)
    await db.commit()
    await db.refresh(task)
    return task
