from typing import Any
from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func
from datetime import datetime, timedelta

from app.api.v1 import deps
from app.database import get_db
from app.models.task import Task, TaskStatus
from app.models.time_log import TimeLog
from app.models.user import User

router = APIRouter()

@router.get("/dashboard")
async def get_dashboard_analytics(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(deps.get_current_active_user),
) -> Any:
    """
    Get dashboard analytics data.
    Returns task statistics and time tracking metrics.
    """
    
    # For now, show all tasks regardless of venture
    # In future can filter via joins with User table if needed
    venture_filter = []
    
    # Tasks completed count
    completed_query = select(func.count(Task.id)).where(
        Task.status == TaskStatus.COMPLETED,
        *venture_filter
    )
    completed_result = await db.execute(completed_query)
    tasks_completed = completed_result.scalar() or 0
    
    # Total tasks count
    total_query = select(func.count(Task.id)).where(*venture_filter)
    total_result = await db.execute(total_query)
    total_tasks = total_result.scalar() or 0
    
    # Tasks by status
    status_query = select(
        Task.status,
        func.count(Task.id).label('count')
    ).where(*venture_filter).group_by(Task.status)
    status_result = await db.execute(status_query)
    tasks_by_status = {row.status: row.count for row in status_result}
    
    # Total hours logged (from TimeLog)
    hours_query = select(func.sum(TimeLog.duration_minutes))
    if current_user.role == "MANAGER" and current_user.venture_id:
        # Join with Task to filter by venture
        hours_query = hours_query.join(Task).where(Task.venture_id == current_user.venture_id)
    
    hours_result = await db.execute(hours_query)
    total_minutes = hours_result.scalar() or 0
    total_hours_logged = round(total_minutes / 60, 2)
    
    # Active timers count
    active_timers_query = select(func.count(Task.id)).where(
        Task.active_timer_start.isnot(None),
        *venture_filter
    )
    active_timers_result = await db.execute(active_timers_query)
    active_timers = active_timers_result.scalar() or 0
    
    # Recent activity (last 7 days)
    seven_days_ago = datetime.utcnow() - timedelta(days=7)
    recent_query = select(
        func.date(TimeLog.start_time).label('date'),
        func.sum(TimeLog.duration_minutes).label('minutes')
    ).where(TimeLog.start_time >= seven_days_ago)
    
    recent_query = recent_query.group_by(func.date(TimeLog.start_time)).order_by(func.date(TimeLog.start_time))
    recent_result = await db.execute(recent_query)
    
    weekly_activity = [
        {
            "date": str(row.date),
            "hours": round(row.minutes / 60, 2)
        }
        for row in recent_result
    ]
    
    return {
        "tasks_completed": tasks_completed,
        "total_tasks": total_tasks,
        "tasks_by_status": tasks_by_status,
        "total_hours_logged": total_hours_logged,
        "active_timers": active_timers,
        "weekly_activity": weekly_activity,
        "completion_rate": round((tasks_completed / total_tasks * 100), 2) if total_tasks > 0 else 0
    }
