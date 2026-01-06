import asyncio
import logging
import sys
import os

sys.path.append(os.getcwd())

from app.database import AsyncSessionLocal
from app.models.user import User, UserRole
from app.models.venture import Venture
from app.schemas.user import UserCreate
from app.core.security import get_password_hash
from app.models.venture import Venture

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

async def init_db():
    async with AsyncSessionLocal() as db:
        # Create Default Venture
        venture = await db.get(Venture, 1)
        if not venture:
            venture = Venture(id=1, name="Headquarters", description="Main Agency HQ")
            db.add(venture)
            logger.info("Created default venture")
        
        # Create Super Admin
        admin = await db.get(User, 1) # Assessing ID 1 is admin
        # Or check by emp_id
        from sqlalchemy import select
        result = await db.execute(select(User).where(User.emp_id == "ADMIN001"))
        admin = result.scalars().first()
        
        if not admin:
            admin_in = UserCreate(
                emp_id="niranjan123",
                password="himanshu123",
                full_name="Super Admin",
                role=UserRole.ADMIN,
                venture_id=1, # Changed from None to 1 to match original logic
                is_active=True
            )
            admin = User(
                emp_id=admin_in.emp_id,
                full_name=admin_in.full_name,
                hashed_password=get_password_hash(admin_in.password),
                role=admin_in.role,
                venture_id=admin_in.venture_id,
                is_active=admin_in.is_active
            )
            db.add(admin)
            logger.info(f"Created Super Admin ({admin_in.emp_id} / {admin_in.password})")
        
        await db.commit()

if __name__ == "__main__":
    asyncio.run(init_db())
