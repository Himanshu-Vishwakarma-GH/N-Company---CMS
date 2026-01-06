from typing import Optional
from pydantic import BaseModel, ConfigDict

class VentureBase(BaseModel):
    name: Optional[str] = None
    description: Optional[str] = None

class VentureCreate(VentureBase):
    name: str

class VentureUpdate(VentureBase):
    pass

class VentureInDBBase(VentureBase):
    id: int
    model_config = ConfigDict(from_attributes=True)

class Venture(VentureInDBBase):
    pass
