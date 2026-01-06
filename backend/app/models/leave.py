from sqlalchemy import Column, Integer, String, ForeignKey, DateTime, Enum as PyEnum, Date
from sqlalchemy.orm import relationship
from app.database import Base
import enum
from datetime import datetime

class LeaveStatus(str, enum.Enum):
    PENDING = "PENDING"
    APPROVED = "APPROVED"
    REJECTED = "REJECTED"

class LeaveType(str, enum.Enum):
    SICK = "SICK"
    CASUAL = "CASUAL"
    ANNUAL = "ANNUAL"
    OTHER = "OTHER"

class Leave(Base):
    __tablename__ = "leaves"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    leave_type = Column(PyEnum(LeaveType), nullable=False)
    start_date = Column(Date, nullable=False)
    end_date = Column(Date, nullable=False)
    reason = Column(String, nullable=True)
    status = Column(PyEnum(LeaveStatus), default=LeaveStatus.PENDING, nullable=False)
    
    applied_at = Column(DateTime, default=datetime.utcnow)
    reviewed_at = Column(DateTime, nullable=True)
    reviewed_by_id = Column(Integer, ForeignKey("users.id"), nullable=True)

    # user = relationship("User", foreign_keys=[user_id], back_populates="leaves")
    # reviewer = relationship("User", foreign_keys=[reviewed_by_id])

class Holiday(Base):
    __tablename__ = "holidays"
    
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, nullable=False)
    date = Column(Date, nullable=False)
    # Optional: venture_id specific holidays
    venture_id = Column(Integer, ForeignKey("ventures.id"), nullable=True)
