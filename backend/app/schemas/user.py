from typing import Optional
from pydantic import BaseModel, ConfigDict
from app.models.user import UserRole

# Shared properties
class UserBase(BaseModel):
    emp_id: Optional[str] = None
    full_name: Optional[str] = None
    role: Optional[UserRole] = UserRole.EMPLOYEE
    is_active: Optional[bool] = True
    venture_id: Optional[int] = None

# Properties to receive via API on creation
class UserCreate(UserBase):
    emp_id: str
    password: str
    full_name: str
    role: UserRole

# Properties to receive via API on update
class UserUpdate(UserBase):
    password: Optional[str] = None

class UserInDBBase(UserBase):
    id: int
    model_config = ConfigDict(from_attributes=True)

# Additional properties to return via API
class User(UserInDBBase):
    pass

class UserInDB(UserInDBBase):
    hashed_password: str
