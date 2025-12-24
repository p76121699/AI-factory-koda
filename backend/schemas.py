from pydantic import BaseModel
from typing import Optional, Dict, Any
from datetime import datetime

class EventCreate(BaseModel):
    machine_id: str
    type: str
    severity: str
    message: str
    details: Optional[str] = None

class EventRead(EventCreate):
    id: int
    timestamp: datetime

    class Config:
        from_attributes = True

class MachineData(BaseModel):
    id: str
    name: str
    type: str
    status: str
    last_update: float
    # Dynamic fields
    temperature: Optional[float] = None
    vibration: Optional[float] = None
    speed: Optional[float] = None
    tool_wear: Optional[float] = None
    load: Optional[float] = None
    current: Optional[float] = None
    cycles: Optional[int] = None
    pass_count: Optional[int] = None
    fail_count: Optional[int] = None
    pass_rate: Optional[float] = None
    packed_count: Optional[int] = None
    jam_rate: Optional[float] = None
