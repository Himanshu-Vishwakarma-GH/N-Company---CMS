from sqlalchemy import Column, Integer, String
from sqlalchemy.orm import relationship
from app.database import Base

class Venture(Base):
    __tablename__ = "ventures"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, unique=True, index=True, nullable=False)
    description = Column(String, nullable=True)

    employees = relationship("User", back_populates="venture")
    # tasks = relationship("Task", back_populates="venture") # Optional: Link tasks to ventures directly or via users
