import asyncio
import httpx
from sqlalchemy import select
from app.database import AsyncSessionLocal, engine
# Import all models to ensure mapper configuration works
from app.models.user import User
from app.models.venture import Venture
from app.models.task import Task
from app.models.leave import Leave
from app.models.announcement import Announcement
from app.core import security

engine.echo = False

async def reset_and_test():
    # 1. Reset Password
    new_password = "employee123"
    async with AsyncSessionLocal() as session:
        result = await session.execute(select(User).where(User.emp_id == "EMPID01"))
        user = result.scalars().first()
        if not user:
            print("❌ User EMPID01 not found!")
            return
        
        print(f"User found: {user.emp_id}")
        user.hashed_password = security.get_password_hash(new_password)
        session.add(user)
        await session.commit()
        print(f"✅ Password reset to '{new_password}'")

    # 2. Test Login
    async with httpx.AsyncClient() as client:
        response = await client.post(
            "http://127.0.0.1:8000/api/v1/login/access-token",
            data={
                "username": "EMPID01", # OAuth2 expects username field
                "password": new_password
            }
        )
        
        if response.status_code == 200:
            print("✅ Login Successful!")
            print("Token:", response.json()["access_token"])
        else:
            print(f"❌ Login Failed: {response.status_code}")
            print(response.text)

if __name__ == "__main__":
    asyncio.run(reset_and_test())
