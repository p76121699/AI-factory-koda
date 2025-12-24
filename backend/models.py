from sqlalchemy import Column, Integer, String, Float, DateTime, ForeignKey
from sqlalchemy.sql import func
from .database import Base

class Event(Base):
    __tablename__ = "events"

    id = Column(Integer, primary_key=True, index=True)
    timestamp = Column(DateTime(timezone=True), server_default=func.now())
    machine_id = Column(String, index=True)
    type = Column(String) # ANOMALY, ALERT, INFO
    severity = Column(String) # LOW, MEDIUM, HIGH, CRITICAL
    message = Column(String)
    details = Column(String) # JSON string for extra details

class MachineState(Base):
    __tablename__ = "machine_states"

    id = Column(Integer, primary_key=True, index=True)
    timestamp = Column(DateTime(timezone=True), server_default=func.now())
    machine_id = Column(String, index=True)
    status = Column(String)
    # Store key metrics as generic columns or specific ones
    temperature = Column(Float, nullable=True)
    vibration = Column(Float, nullable=True)
    speed = Column(Float, nullable=True)
    load = Column(Float, nullable=True)
    power = Column(Float, nullable=True)
