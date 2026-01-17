from fastapi import APIRouter
from app.api.v1 import auth, users, ventures, tasks, announcements, leaves, websockets, analytics

api_router = APIRouter()
api_router.include_router(auth.router, tags=["login"])
api_router.include_router(users.router, prefix="/users", tags=["users"])
api_router.include_router(ventures.router, prefix="/ventures", tags=["ventures"])
api_router.include_router(tasks.router, prefix="/tasks", tags=["tasks"])
api_router.include_router(announcements.router, prefix="/announcements", tags=["announcements"])
api_router.include_router(leaves.router, prefix="/leaves", tags=["leaves"])
api_router.include_router(analytics.router, prefix="/analytics", tags=["analytics"])
api_router.include_router(websockets.router, tags=["websockets"])
