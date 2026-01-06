import pytest
import sys
import os

sys.path.append(os.getcwd())

from typing import AsyncGenerator, Generator
from httpx import AsyncClient
from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession
from sqlalchemy.orm import sessionmaker

from app.main import app
from app.database import get_db, Base
from app.core.security import get_password_hash
from app.models.user import User, UserRole
from app.models.venture import Venture
from app.models.task import Task
from app.models.announcement import Announcement, AnnouncementAck
from app.models.leave import Leave, Holiday

from sqlalchemy.orm import configure_mappers
configure_mappers()

# Use SQLite for tests to avoid Postgres dependency during CI/Test
SQLALCHEMY_DATABASE_URL = "sqlite+aiosqlite:///:memory:"

engine = create_async_engine(
    SQLALCHEMY_DATABASE_URL, connect_args={"check_same_thread": False}
)

TestingSessionLocal = sessionmaker(
    engine, class_=AsyncSession, expire_on_commit=False
)

# event_loop fixture removed in favor of pytest.ini asyncio_mode=auto

@pytest.fixture(scope="function")
async def db_session() -> AsyncGenerator[AsyncSession, None]:
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)

    async with TestingSessionLocal() as session:
        yield session
        # Cleanup
        await session.rollback()

    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.drop_all)

from httpx import AsyncClient, ASGITransport

@pytest.fixture(scope="function")
async def client(db_session: AsyncSession) -> AsyncGenerator[AsyncClient, None]:
    async def override_get_db():
        yield db_session

    app.dependency_overrides[get_db] = override_get_db
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as c:
        yield c
    app.dependency_overrides.clear()

@pytest.fixture
async def create_test_data(db_session: AsyncSession):
    # Venture
    venture = Venture(id=1, name="Test Venture", description="Test")
    db_session.add(venture)
    
    # Admin
    admin = User(
        emp_id="ADMIN001",
        full_name="Admin User",
        hashed_password=get_password_hash("password"),
        role=UserRole.ADMIN,
        venture_id=1
    )
    db_session.add(admin)
    
    # Manager
    manager = User(
        emp_id="MGR001",
        full_name="Manager User",
        hashed_password=get_password_hash("password"),
        role=UserRole.MANAGER,
        venture_id=1
    )
    db_session.add(manager)
    
    # Employee
    employee = User(
        emp_id="EMP001",
        full_name="Employee User",
        hashed_password=get_password_hash("password"),
        role=UserRole.EMPLOYEE,
        venture_id=1
    )
    db_session.add(employee)
    
    await db_session.commit()
    return {"venture": venture, "admin": admin, "manager": manager, "employee": employee}
