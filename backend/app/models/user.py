from sqlalchemy import Column, Integer, String, Boolean, Enum as PyEnum, ForeignKey
from sqlalchemy.orm import relationship
from app.database import Base
import enum

class UserRole(str, enum.Enum):
    ADMIN = "ADMIN"
    MANAGER = "MANAGER"
    EMPLOYEE = "EMPLOYEE"

class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    emp_id = Column(String, unique=True, index=True, nullable=False)
    hashed_password = Column(String, nullable=False)
    full_name = Column(String, nullable=False)
    role = Column(PyEnum(UserRole), default=UserRole.EMPLOYEE, nullable=False)
    is_active = Column(Boolean, default=True)
    
    venture_id = Column(Integer, ForeignKey("ventures.id"), nullable=True) # Nullable for Super Admins
    
    venture = relationship("Venture", back_populates="employees")
    tasks_assigned = relationship("Task", foreign_keys="[Task.assigned_to_id]", back_populates="assignee", lazy="selectin")
    tasks_created = relationship("Task", foreign_keys="[Task.created_by_id]", back_populates="creator", lazy="selectin")
    announcement_acks = relationship("AnnouncementAck", back_populates="user")
    # leaves = relationship("Leave", back_populates="user")
