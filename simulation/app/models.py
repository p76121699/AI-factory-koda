import random
import time
import math
from dataclasses import dataclass, field
from typing import Dict, Any, Optional, List, Tuple
from .config import *

@dataclass
class Part:
    name: str # e.g., "Blade", "Motor", "Belt"
    wear: float = 0.0 # 0.0 to 1.0 (1.0 = Broken)
    wear_rate: float = 0.0005 # Base wear per second at normal speed
    
    def to_dict(self):
        return {
            "name": self.name,
            "wear": round(self.wear, 3),
            "status": "CRITICAL" if self.wear > 0.8 else "OK"
        }

@dataclass
class Product:
    id: str
    type: str # "Smart Watch X1"
    stage: str = "Raw Material" # "Cutter", "Conveyor", "Finished"
    quality: float = 1.0 # 1.0 = Perfect, 0.0 = Scrap
    created_at: float = field(default_factory=time.time)
    history: List[str] = field(default_factory=list)

    def move_to(self, stage: str):
        self.stage = stage
        self.history.append(f"{time.time()}:{stage}")

@dataclass
class Worker:
    id: str
    name: str
    location: str # Machine ID or "Hub"
    state: str = "IDLE" # IDLE, MOVING, WORKING
    target_location: Optional[str] = None
    task_end_time: float = 0.0
    
    # Navigation state
    path: List[str] = field(default_factory=list) # List of machine IDs to visit
    
    def update(self, dt: float, current_time: float):
        if self.state == "MOVING":
            if current_time >= self.task_end_time:
                # Arrived at node
                self.location = self.target_location
                
                if self.path:
                    # Continue to next node in path
                    next_stop = self.path.pop(0)
                    self.move_to_node(next_stop, current_time)
                else:
                    # Arrived at final destination
                    self.state = "IDLE" # Caller will switch this to WORKING if needed
                    self.target_location = None

        elif self.state == "WORKING":
            if current_time >= self.task_end_time:
                self.state = "IDLE"

    def move_to_node(self, target_id: str, current_time: float):
        """Calculates travel time for ONE hop with Gaussian noise."""
        self.state = "MOVING"
        self.target_location = target_id
        
        # Calculate travel time: Base + Gaussian Noise
        noise = max(0, random.gauss(TRAVEL_NOISE_MEAN, TRAVEL_NOISE_STD))
        travel_time = WORKER_SPEED_BASE + noise
        
        self.task_end_time = current_time + travel_time

    def start_job(self, duration: float, current_time: float):
        self.state = "WORKING"
        self.task_end_time = current_time + duration
        
    def to_dict(self):
        return {
            "id": self.id,
            "name": self.name,
            "location": self.location,
            "state": self.state,
            "target": self.target_location
        }

@dataclass
class Machine:
    id: str
    name: str
    type: str
    line_id: str
    
    # State
    status: str = "IDLE" # IDLE, RUNNING, ERROR, MAINTENANCE, STARVED, BLOCKED
    last_fault_reason: str = "None" # Reason for last ERROR
    health_score: float = 100.0
    metrics: Dict[str, float] = field(default_factory=dict)
    
    # Physics & thresholds (Randomized on init)
    thresholds: Dict[str, float] = field(default_factory=dict)
    
    # Parts [NEW]
    parts: List[Part] = field(default_factory=list)
    
    # Buffers
    
    # Buffers
    # Buffers
    input_buffer: List[Product] = field(default_factory=list)
    output_buffer: List[Product] = field(default_factory=list)
    capacity: int = 5 # [NEW] Max input buffer size
    processing_product: Optional[Product] = None
    process_timer: float = 0.0
    process_duration: float = 2.0 # Seconds to process one item
    
    def __post_init__(self):
        self._init_thresholds()
        
    def _init_thresholds(self):
        # Apply randomization to base thresholds
        base = base_thresholds.get(self.type, {})
        for key, limits in base.items():
            # Randomize +/- 10%
            factor = random.uniform(1.0 - THRESHOLD_VARIANCE, 1.0 + THRESHOLD_VARIANCE)
            self.thresholds[f"{key}_critical"] = limits["critical"] * factor
            self.thresholds[f"{key}_safe"] = limits.get("safe_max", limits["critical"] * 0.8) * factor

    def calculate_failure_risk(self) -> Tuple[bool, str]:
        """Returns (True, Reason) if machine breaks down."""
        # [FIX] Do not trigger new errors if already waiting for repair or repairing
        if self.status in ["WAITING_FOR_REPAIR", "REPAIRING", "ERROR"]:
            return False, "None"
            
        risk_accumulated = 0.0
        primary_cause = "Unknown"
        max_risk = 0.0
        
        for metric, value in self.metrics.items():
            crit = self.thresholds.get(f"{metric}_critical")
            if crit:
                # Exponential risk curve
                ratio = value / crit
                if ratio > 0.8: # Track major contributors
                    if ratio > max_risk:
                        max_risk = ratio
                        primary_cause = f"{metric} ({value:.1f} > {crit:.1f})"
                
                if ratio > 1.0: ratio = 1.0
                risk_accumulated += (ratio ** FAILURE_EXPONENT)
                
        # Final probability check
        # NEW: Check Parts
        for part in self.parts:
            if part.wear >= 1.0:
                return True, f"{part.name} Failure (Wear 100%)"
        
        prob = FAILURE_CHANCE_BASE * (1 + risk_accumulated * 100)
        if random.random() < prob:
            print(f"DEBUG: {self.id} FAILED! Reason: {primary_cause}. Prob: {prob:.6f}. RiskAcc: {risk_accumulated:.4f}")
            return True, primary_cause
        return False, "None"

    def reset(self):
        """Resets the machine state and metrics to safe defaults."""
        self.status = "IDLE"
        self.last_fault_reason = "None"
        self.health_score = 100.0
        
        # Reset physics metrics to safe values
        if "temperature" in self.metrics: self.metrics["temperature"] = 25.0
        if "vibration" in self.metrics: self.metrics["vibration"] = 0.0
        if "speed" in self.metrics: self.metrics["speed"] = 0.0
        if "load" in self.metrics: self.metrics["load"] = 0.0
        if "current" in self.metrics: self.metrics["current"] = 0.0
        
        # [CRITICAL] Reset Parts to prevent immediate re-failure
        for p in self.parts:
            p.wear = 0.0
            
        # Clear buffers logic can remain as is (maybe keep products to avoid loss)

    def update(self, dt: float):
        pass # Override by subclasses

    def to_dict(self) -> Dict[str, Any]:
        # [FIX] Dynamic Health Score based on Parts
        max_wear = max([p.wear for p in self.parts]) if self.parts else 0.0
        self.health_score = max(0.0, 100.0 * (1.0 - max_wear))

        base = {
            "id": self.id,
            "name": self.name,
            "type": self.type,
            "status": self.status,
            "last_fault": self.last_fault_reason,
            "health_score": round(self.health_score, 1),
            "metrics": self.metrics,
            "input_count": len(self.input_buffer),
            "input_count": len(self.input_buffer),
            "output_count": len(self.output_buffer),
            "wear_level": max_wear
        }
        # Flatten metrics for easier frontend consumption
        base.update(self.metrics)
        base["parts"] = [p.to_dict() for p in self.parts]
        return base

@dataclass
class Cutter(Machine):
    def __post_init__(self):
        super().__post_init__()
        self.parts = [Part(name="Blade", wear_rate=0.00075)]

    def update(self, dt: float):
        if self.status == "RUNNING":
            # Simulate Physics
            # Speed Control: Use setting or default 3000
            target_speed = self.metrics.get("speed_setting", 1500.0)
            
            # Actual Speed = Target + Noise
            self.metrics["speed"] = target_speed + random.randint(-50, 50)
            
            # Temperature Rise is proportional to Speed^2 (Physics!)
            # Base rise at 3000rpm = ~1.5 degrees/sec
            heat_factor = (self.metrics["speed"] / 1500.0) ** 2
            
            temp = self.metrics.get("temperature", 25.0)
            heating = (random.uniform(0.8, 1.8) * heat_factor) * dt
            
            # [FIX] Newton's Law of Cooling: Rate is proportional to difference from ambient (25.0)
            # Cooling coefficient needs to be enough to cool down when speed is low
            cooling = (temp - 25.0) * 0.03 * dt 
            
            self.metrics["temperature"] = max(25.0, temp + heating - cooling)
            
            # Additional Mock Metrics
            self.metrics["vibration"] = random.uniform(0.1, 2.5) + (temp / 100.0) * (self.metrics["speed"] / 1500.0)
            self.metrics["tool_wear"] = self.metrics.get("tool_wear", 0.0) + (0.001 * dt * heat_factor)
            
            # Update Parts
            for p in self.parts:
                p.wear += p.wear_rate * (self.metrics["speed"] / 1500.0) * dt
            
            # Check Failure
            failed, reason = self.calculate_failure_risk()
            if failed:
                self.status = "ERROR"
                self.last_fault_reason = reason
                return

            # Processing Logic
            if self.processing_product:
                # [FIX] Production Speed is proportional to RPM
                # If speed is 3000, factor is 1.0. If 1500, factor is 0.5 (slower).
                speed_factor = max(0.1, self.metrics["speed"] / 1500.0)
                self.process_timer -= dt * speed_factor
                
                if self.process_timer <= 0:
                    # Finish
                    self.output_buffer.append(self.processing_product)
                    self.processing_product = None
            elif self.input_buffer:
                # Start new
                self.processing_product = self.input_buffer.pop(0)
                self.process_timer = self.process_duration
            else:
                self.status = "STARVED"
        
        elif self.status == "IDLE":
             # Cooling down
             temp = self.metrics.get("temperature", 25.0)
             self.metrics["temperature"] = max(25.0, temp - 1.0 * dt)
             self.metrics["speed"] = max(0.0, self.metrics.get("speed", 0.0) - 500 * dt) # Decelerate
             
             if self.input_buffer:
                 self.status = "RUNNING"
                 
        elif self.status == "ERROR":
             # Physics continue even in error (Spin down)
             current_speed = self.metrics.get("speed", 0.0)
             self.metrics["speed"] = max(0.0, current_speed - 200 * dt) # Friction stops it
             
             # Cool down slowly
             temp = self.metrics.get("temperature", 25.0)
             self.metrics["temperature"] = max(25.0, temp - 0.5 * dt)


@dataclass
class Conveyor(Machine):
    process_duration: float = 5.0
    capacity: int = 10 # [NEW] Larger buffer for conveyor
    
    def __post_init__(self):
        super().__post_init__()
        # [FIX] Significantly reduced wear rates (10x slower) to prevent rapid breakdown
        self.parts = [Part(name="Belt", wear_rate=0.0001), Part(name="Motor", wear_rate=0.00005)]
    
    def update(self, dt: float):
        if self.status == "RUNNING":
             metrics = self.metrics
             # Real load = items on belt (input buffer) + item being processed
             current_load = len(self.input_buffer) + (1 if self.processing_product else 0)
             metrics["load"] = current_load
             
             # Dynamic Speed: Heavy load slows down the belt slightly
             # Base Speed from AI setting (default 1.2)
             base_speed = self.metrics.get("target_speed", 0.8)
             
             jitter = random.uniform(-0.02, 0.02)
             # Apply load friction
             self.speed = max(0.5, base_speed - (current_load * 0.05) + jitter)
             self.metrics["speed"] = self.speed

             # Wear increases with load
             # [FIX] Cap load factor clearly to prevent explosion
             load_factor = min(3.0, 1.0 + (current_load * 0.1)) 
             for p in self.parts:
                 # [FIX] Clamp wear at 1.0 (100%)
                 p.wear = min(1.0, p.wear + p.wear_rate * dt * load_factor)
             
             if self.processing_product:
                # [FIX] Throughput proportional to speed (Base 1.2 m/s)
                speed_factor = max(0.1, self.metrics["speed"] / 0.8)
                self.process_timer -= dt * speed_factor
                
                if self.process_timer <= 0:
                    self.metrics["load_count"] = self.metrics.get("load_count", 0) + 1
                    self.output_buffer.append(self.processing_product)
                    self.processing_product = None
             elif self.input_buffer:
                self.processing_product = self.input_buffer.pop(0)
                self.process_timer = self.process_duration
             else:
                self.status = "STARVED"
        
        elif self.status in ["IDLE", "STARVED"]:
            self.speed = 0.0
            self.metrics["speed"] = 0.0
            if self.input_buffer:
                self.status = "RUNNING"
        
        else:
            # [FIX] Ensure speed is 0 for any other state (ERROR, FAULT, etc.)
            self.speed = 0.0
            self.metrics["speed"] = 0.0
            
            # Reduce wear significantly when idle
            for p in self.parts:
                 p.wear += 0.0 # No wear when idle
                 
            failed, reason = self.calculate_failure_risk()
            if failed:
                self.status = "ERROR"
                self.last_fault_reason = reason

@dataclass
class RobotArm(Machine):
    process_duration: float = 3.0
    
    def __post_init__(self):
        super().__post_init__()
        self.parts = [Part(name="Servos", wear_rate=0.0001), Part(name="Gripper", wear_rate=0.0003)]
    def update(self, dt: float):
        if self.status == "RUNNING":
            load = self.metrics.get("load", 0.0)
            if self.processing_product:
                self.metrics["load"] = 8.0 # High load when working
                self.metrics["current"] = 12.5 + random.uniform(-0.5, 0.5)
                
                for p in self.parts:
                    p.wear += p.wear_rate * 1.5 * dt # High wear under load
            else:
                self.metrics["load"] = 2.0
                self.metrics["current"] = 2.0 + random.uniform(-0.1, 0.1)
                
            self.metrics["cycles"] = self.metrics.get("cycles", 0) # Increment on finish
                
            failed, reason = self.calculate_failure_risk()
            if failed:
                self.status = "ERROR"
                self.last_fault_reason = reason
                return

            if self.processing_product:
                # [FIX] Throughput proportional to efficiency (100% base)
                eff = self.metrics.get("efficiency", 80.0)
                self.process_timer -= dt * (eff / 80.0)
                
                if self.process_timer <= 0:
                    self.output_buffer.append(self.processing_product)
                    self.processing_product = None
                    self.metrics["cycles"] = self.metrics.get("cycles", 0) + 1
            elif self.input_buffer:
                self.processing_product = self.input_buffer.pop(0)
                self.process_timer = self.process_duration
                # Default efficiency fluctuates slightly
                self.metrics["efficiency"] = 100.0 + random.randint(-5, 5)
            else:
                self.status = "STARVED"

        elif self.status in ["IDLE", "STARVED"]:
            if self.input_buffer:
                self.status = "RUNNING"

@dataclass
class Inspector(Machine):
    process_duration: float = 2.0
    
    def __post_init__(self):
        super().__post_init__()
        self.parts = [Part(name="Camera", wear_rate=0.0001), Part(name="Light", wear_rate=0.0005)]
    
    def update(self, dt: float):
        if self.status == "RUNNING":
             # Camera wears only when running
             for p in self.parts:
                 p.wear += p.wear_rate * dt
             
             if self.processing_product:
                # [FIX] Throughput proportional to efficiency/speed
                eff = self.metrics.get("speed", 100.0) # Using 'speed' metric 
                self.process_timer -= dt * (eff / 100.0)

                if self.process_timer <= 0:
                    # Random defect check
                    if random.random() < 0.05:
                        self.processing_product.quality = 0.0 # Defect
                        self.metrics["fail_count"] = self.metrics.get("fail_count", 0) + 1
                    else:
                        self.metrics["pass_count"] = self.metrics.get("pass_count", 0) + 1
                    
                    # Update Rate
                    total = self.metrics.get("pass_count", 0) + self.metrics.get("fail_count", 0)
                    if total > 0:
                        self.metrics["pass_rate"] = (self.metrics.get("pass_count", 0) / total) * 100.0
                        
                    self.output_buffer.append(self.processing_product)
                    self.processing_product = None
             elif self.input_buffer:
                self.processing_product = self.input_buffer.pop(0)
                self.process_timer = self.process_duration
             else:
                self.status = "STARVED"

        elif self.status in ["IDLE", "STARVED"]:
            if self.input_buffer:
                self.status = "RUNNING"

@dataclass
class Packer(Machine):
    process_duration: float = 2.0
    
    def __post_init__(self):
        super().__post_init__()
        self.parts = [Part(name="Pneumatics", wear_rate=0.0005)]
    def update(self, dt: float):
        if self.status == "RUNNING":
            for p in self.parts:
                p.wear += p.wear_rate * dt

            failed, reason = self.calculate_failure_risk()
            if failed:
                self.status = "ERROR"
                self.last_fault_reason = reason
                return
                
            if self.processing_product:
                # [FIX] Throughput proportional to efficiency
                eff = self.metrics.get("efficiency", 100.0)
                self.process_timer -= dt * (eff / 100.0)
                
                if self.process_timer <= 0:
                    # Finished product!
                    self.output_buffer.append(self.processing_product)
                    self.processing_product = None
                    self.metrics["packed_count"] = self.metrics.get("packed_count", 0) + 1
                    self.metrics["jam_rate"] = 0.0 # Mock jam rate
            elif self.input_buffer:
                self.processing_product = self.input_buffer.pop(0)
                self.process_timer = self.process_duration
            else:
                self.status = "STARVED"

        elif self.status in ["IDLE", "STARVED"]:
            if self.input_buffer:
                self.status = "RUNNING"

@dataclass
class InventoryItem:
    # Kept for backward compatibility with frontend
    id: str
    name: str
    quantity: int
    category: str
    unit: str = "pcs"
    safety_stock: int = 0
    reorder_point: int = 0
    status: str = "OK"
    trend: str = "flat"
    cost_per_unit: float = 10.0
    last_updated: float = field(default_factory=time.time)
    
    def to_dict(self):
        return {
            "id": self.id,
            "name": self.name,
            "quantity": self.quantity,
            "category": self.category,
            "unit": self.unit,
            "safety_stock": self.safety_stock,
            "reorder_point": self.reorder_point,
            "status": self.status,
            "trend": self.trend,
            "cost_per_unit": self.cost_per_unit,
            "total_value": round(self.quantity * self.cost_per_unit, 2),
            "last_updated": self.last_updated
        }
