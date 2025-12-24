from typing import Dict, Any, List, Optional
from .schemas import MachineData

class AnomalyDetector:
    def __init__(self):
        # Define thresholds
        self.thresholds = {
            "Cutter": {
                "temperature": {"warning": 95.0, "critical": 110.0},
                "vibration": {"warning": 8.0, "critical": 12.0}
            },
            "RobotArm": {
                "current": {"warning": 20.0, "critical": 25.0}
            },
            "Packer": {
                "jam_rate": {"warning": 0.5, "critical": 0.8}
            }
        }

    def detect(self, machine_data: Dict[str, Any]) -> List[Dict[str, Any]]:
        anomalies = []
        m_type = machine_data.get("type")
        
        if m_type not in self.thresholds:
            # Still check generic fields like status/wear for all machines
            pass
            
        thresholds = self.thresholds.get(m_type, {})
        
        # 0. Global Check: Ignore if Under Repair
        status = machine_data.get("status")
        if status in ["WAITING_FOR_REPAIR", "REPAIRING"]:
            return []
            
        # 1. Global Check: Machine Status
        if status == "ERROR":
             anomalies.append({
                "machine_id": machine_data["id"],
                "type": "system_failure",
                "severity": "critical",
                "message": f"machine failure: Status is {status}"
            })
            
        # 1. Global Check: Part Wear
        wear = machine_data.get("wear_level")
        if wear is not None:
            if wear >= 1.0:
                 anomalies.append({
                    "machine_id": machine_data["id"],
                    "type": "part_failure",
                    "severity": "critical",
                    "message": f"wear critical: {wear:.2f} >= 1.0"
                })
            elif wear > 0.8:
                 anomalies.append({
                     "machine_id": machine_data["id"],
                     "type": "wear_warning",
                     "severity": "warning",
                     "message": f"wear high: {wear:.2f} > 0.8"
                 })
        
        for metric, limits in thresholds.items():
            val = machine_data.get(metric)
            if val is None: continue
            
            # Critical Check
            if val > limits["critical"]:
                anomalies.append({
                    "machine_id": machine_data["id"],
                    "type": "physics_violation",
                    "severity": "critical",
                    "message": f"{metric} critical: {val:.1f} > {limits['critical']}"
                })
            # Warning Check (Proactive - 85% of critical)
            elif val > (limits["critical"] * 0.85):
                anomalies.append({
                     "machine_id": machine_data["id"],
                     "type": "pre_emptive_warning",
                     "severity": "warning",
                     "message": f"{metric} warning: {val:.1f} approaching {limits['critical']}"
                })
                
        return anomalies
