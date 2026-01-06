import logging
import asyncio
logging.getLogger('sqlalchemy.engine').setLevel(logging.WARNING)
from sqlalchemy import select
from app.database import AsyncSessionLocal, engine
from app.models.user import User
from app.models.venture import Venture
from app.models.task import Task
from app.models.leave import Leave
from app.models.announcement import Announcement

engine.echo = False

# logging.basicConfig() 
# logger = logging.getLogger(__name__)

async def main():
    async with AsyncSessionLocal() as session:
        result = await session.execute(select(User))
        users = result.scalars().all()
        print(f"Found {len(users)} users:")
        for u in users:
            print(f"ID: {u.id} | EmpID: {u.emp_id} | Role: {u.role} | Active: {u.is_active} | HashStart: {u.hashed_password[:20]}")

if __name__ == "__main__":
    import sys
    import os
    sys.path.append(os.getcwd())
    asyncio.run(main())
