from datetime import datetime
from pydantic import BaseModel
from typing import Optional

class TaskBase(BaseModel):
    due_date: Optional[datetime] = None

try:
    # Test YYYY-MM-DD string
    m = TaskBase(due_date="2026-03-05")
    print("✅ Parsed successfully:", m.due_date)
except Exception as e:
    print("❌ Failed:", e)
