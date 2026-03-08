import asyncio
import json
import websockets
import logging
import os
import gzip # [NEW]
import base64 # [NEW]
from sqlalchemy.ext.asyncio import AsyncSession
from .database import AsyncSessionLocal
from .models import Event, MachineState
from .anomaly import AnomalyDetector
from .ai import AICollaborator
import uuid
import time

logger = logging.getLogger(__name__)

class DataBridge:
    def __init__(self, simulation_url: str = None):
        self.simulation_url = simulation_url or os.getenv("SIMULATION_URL", "ws://127.0.0.1:8765")
        self.detector = AnomalyDetector()
        self.ai = AICollaborator()
        self.latest_data = {}
        self.active_alerts = {} # map machine_id + metric -> Alert Dict
        self.last_autonomy_check = 0
        self.last_cleanup = 0
        self.last_snapshot = 0 # [NEW] Historian Timer
        self.action_history = [] # List of {timestamp, machine_id, command, resulting_temp?}
        self.running = False
        self.running = False
        self.autonomy_enabled = True # [NEW] Persist Autonomy State (In-memory for now, could be DB)
        self.running = False
        self.autonomy_enabled = True # [NEW] Persist Autonomy State (In-memory for now, could be DB)
        self.running = False
        self.autonomy_enabled = False # [FIX] Default to PAUSED (Safety First)
        self.safety_locks = {} # [NEW] machine_id -> timestamp (release time)
        self.ai_history = [] # [NEW] Broadcastable AI Actions
        self.ai_analysis_enabled = False # [NEW] User toggle for anomaly AI analysis
        self.last_autonomy_action = {} # [NEW] machine_id -> timestamp (cooldown)
        self.ai_is_running = False # [NEW] Async Lock for AI Cycle

    def set_autonomy(self, enabled: bool):
        self.autonomy_enabled = enabled
        logger.info(f"Autonomy System Set to: {enabled}")

    def get_autonomy(self) -> bool:
        return self.autonomy_enabled

    def set_ai_analysis(self, enabled: bool):
        self.ai_analysis_enabled = enabled
        logger.info(f"AI Anomaly Analysis Set to: {enabled}")

    def get_ai_analysis(self) -> bool:
        return self.ai_analysis_enabled

    async def reset_data(self):
        """Hard Factory Reset: Clear DB and Simulation"""
        try:
            # 1. Clear Database
            async with AsyncSessionLocal() as session:
                from sqlalchemy import text
                # Truncate tables (SQLite uses DELETE, Postgres uses TRUNCATE)
                # For compatibility, let's use DELETE
                from .models import Event, MachineState
                from sqlalchemy import delete
                
                await session.execute(delete(Event))
                await session.execute(delete(MachineState))
                await session.commit()
                logger.warning("Database Cleared via Reset")

            # 2. Reset In-Memory State
            self.active_alerts = {}
            self.command_history = {}
            self.latest_data = {}
            self.action_history = []
            
            # 3. Send Reset to Simulation
            await self.send_command({"machine_id": "SYSTEM", "command": "reset"})
            
            return True
        except Exception as e:
            logger.error(f"Reset Failed: {e}")
            return False

    async def cleanup_old_data(self):
        """Delete data older than 30 days"""
        try:
            # 7 days in seconds = 7 * 24 * 3600 = 604800
            retention_period = 604800
            # retention_period = 60 # Test: 1 minute
            
            cutoff_date = time.time() - retention_period
            
            # Since SQLAlchemy uses DateTime objects, we might need to handle this carefully if using raw SQL or ORM.
            # But the requirement is simple. Let's use raw SQL for efficiency or a simple delete.
            # Note: models.py uses DateTime(timezone=True) with server_default=func.now()
            # We can rely on the DB to handle the comparison if we pass a datetime.datetime object.
            
            from datetime import datetime, timedelta, timezone
            cutoff_dt = datetime.now(timezone.utc) - timedelta(days=7)
            
            async with AsyncSessionLocal() as session:
                from sqlalchemy import delete
                from .models import Event, MachineState
                
                # Delete old EVENTS
                await session.execute(delete(Event).where(Event.timestamp < cutoff_dt))
                
                # Delete old MACHINE STATES
                await session.execute(delete(MachineState).where(MachineState.timestamp < cutoff_dt))
                
                await session.commit()
                logger.info(f"Data Cleanup Completed (Cutoff: {cutoff_dt})")
                
        except Exception as e:
            logger.error(f"Cleanup Error: {e}")

    async def connect(self):
        self.running = True
        while self.running:
            try:
                async with websockets.connect(self.simulation_url) as websocket:
                    logger.info(f"Connected to Simulation at {self.simulation_url}")
                    self.websocket = websocket # Store connection
                    async for message in websocket:
                         # [FIX] Handle Base64 Encoded Gzip (Robust)
                        if isinstance(message, str) and message.startswith("GZIP::"):
                            try:
                                b64_data = message[6:] # Strip 'GZIP::'
                                compressed = base64.b64decode(b64_data)
                                json_str = gzip.decompress(compressed).decode('utf-8')
                            except Exception as e:
                                logger.error(f"GZIP/Base64 Error: {e}")
                                continue
                                
                        # [Legacy] Decompress Gzip if raw binary
                        elif isinstance(message, bytes):
                            try:
                                json_str = gzip.decompress(message).decode('utf-8')
                            except Exception as e:
                                logger.error(f"Decompression error: {e}")
                                continue
                        else:
                            json_str = message
                            
                        data = json.loads(json_str)
                        await self.process_data(data)
            except Exception as e:
                logger.error(f"Connection error: {e}. Retrying in 5s...")
                self.websocket = None
                await asyncio.sleep(5)

    async def send_command(self, command: dict):
        if hasattr(self, 'websocket') and self.websocket:
            try:
                # [FIX] Ensure protocol matches simulation/main.py expectations
                payload = command.copy()
                if "action" not in payload:
                    payload["action"] = "control"
                
                await self.websocket.send(json.dumps(payload))
                logger.info(f"Sent command to simulation: {payload}")
                
                # [FIX] Update Command Lock for Manual/API commands too
                if not hasattr(self, 'command_history'): self.command_history = {}
                m_id = command.get("machine_id")
                if m_id:
                    self.command_history[m_id] = time.time()
                    
                return True
            except Exception as e:
                logger.error(f"Error sending command: {e}")
                return False
        else:
            logger.warning("Cannot send command: Simulation not connected")
            return False

    async def process_data(self, data: dict):
        logger.info("Bridge received data from simulation")
        timestamp = data.get("timestamp")
        
        # Prepare list for frontend
        self.latest_data = data # [FIX] Update IMMEDIATELY to unblock UI
        current_alerts = []

        if not hasattr(self, 'command_history'): 
             self.command_history = {} # machine_id -> timestamp

        async with AsyncSessionLocal() as session:
            for line in data.get("lines", []):
                for machine in line.get("machines", []):
                    # 1. Anomaly Detection
                    
                    # [FIX] Check Grace Period (Command Lock)
                    last_cmd_time = self.command_history.get(machine['id'], 0)
                    if (timestamp - last_cmd_time) < 5.0: # 5 Seconds Grace
                        # Skip detection while machine is reacting
                        anomalies = []
                    else:
                        anomalies = self.detector.detect(machine)
                    
                    for anomaly in anomalies:
                        # [FIX] Create stable key: machine_id + metric (e.g. "L1-CUT-01_temperature")
                        metric_name = anomaly['message'].split(" ")[0].lower()
                        anomaly_key = f"{anomaly['machine_id']}_{metric_name}"
                        
                        # Check if we already have this active
                        existing_alert = self.active_alerts.get(anomaly_key)
                        
                        if existing_alert:
                            # Update existing
                            # If it was marked resolved but anomaly persists after grace period, un-resolve it?
                            # Or creates new one? 
                            # If grace period passed, it's a new (or persisting) issue.
                            if existing_alert['resolved']:
                                # Reactivate it
                                existing_alert['resolved'] = False
                                existing_alert['count'] += 1
                                existing_alert['timestamp'] = timestamp * 1000
                                existing_alert['created_at'] = timestamp * 1000 # [FIX] Reset start time to prevent instant re-resolve loop
                            else:
                                existing_alert['timestamp'] = timestamp * 1000 # JS ms
                                existing_alert['count'] = existing_alert.get('count', 1) + 1
                                
                            # Update message (value might change)
                            existing_alert['message'] = anomaly['message']
                            current_alerts.append(existing_alert)
                        else:
                            # New Alert
                            new_alert = {
                                "id": str(uuid.uuid4()),
                                "machineId": anomaly['machine_id'],
                                "type": "system",
                                "severity": anomaly['severity'].lower(),
                                "message": anomaly['message'],
                                "timestamp": timestamp * 1000,
                                "created_at": timestamp * 1000,
                                "count": 1,
                                "resolved": False
                            }
                            
                            # AI Analysis for High/Critical OR Persistent Warnings
                            if self.ai_analysis_enabled and new_alert['severity'] in ['high', 'critical', 'warning']:
                                # Fire-and-forget AI analysis
                                asyncio.create_task(self._run_ai_analysis(anomaly, anomaly_key, new_alert['id']))

                            self.active_alerts[anomaly_key] = new_alert
                            current_alerts.append(new_alert)
                            
                            # Save event to DB
                            try:
                                event = Event(
                                    machine_id=anomaly["machine_id"],
                                    type=anomaly["type"],
                                    severity=anomaly["severity"],
                                    message=anomaly["message"],
                                    details=anomaly.get("details", "")
                                )
                                session.add(event)
                                logger.warning(f"New Anomaly: {anomaly['message']}")
                            except Exception as e:
                                logger.error(f"DB Error: {e}")
            
            await session.commit()

        # [NEW] Auto-Resolve Logic
        current_time_ms = timestamp * 1000
        AUTO_RESOLVE_DELAY_MS = 15000 # 15 Seconds (Faster)

        # Cleanup Loop
        keys_to_delete = []

        for key, alert in list(self.active_alerts.items()):
            
            # 0. Delayed Cleanup Logic
            if alert['resolved']:
                resolved_time = alert.get('resolved_at', 0)
                if (current_time_ms - resolved_time) > 10000: # Keep resolved for 10s
                    keys_to_delete.append(key)
                else:
                     current_alerts.append(alert) # Still show resolved
                continue

            # Auto-resolve if:
            # 1. Critical/Warning with AI help
            # 2. OR Critical Machine Failure (Fast-track)
            
            has_suggestion = 'suggested_action' in alert
            is_critical_failure = alert['severity'] == 'critical' and "machine failure" in alert['message'].lower()
            
            if (not alert['resolved'] and (has_suggestion or is_critical_failure)):
                
                # Check Time Decay
                start_time = alert.get('created_at', alert['timestamp'])
                if (current_time_ms - start_time) > AUTO_RESOLVE_DELAY_MS:
                     if is_critical_failure and not has_suggestion:
                         action = "emergency reset"
                     else:
                         action = alert.get('suggested_action', '').lower()
                     
                     # [NEW] Check Autonomy Flag for Alerts
                     # Allow CRITICAL FAILURES (Emergency Stop) even if Autonomy is OFF
                     if not self.autonomy_enabled and not is_critical_failure:
                         logger.info(f"Skipping Auto-Resolve for Alert {alert['id']} (Autonomy Disabled)")
                         continue
                     
                     machine_id = alert['machineId']
                     
                     logger.info(f"Alert {alert['id']} ({alert['severity']}) is stale. AI taking action: {action}")
                     
                     
                     # Map AI response or Alert Type to specific commands
                     command = None
                     msg_lower = alert.get('message', '').lower()
                     
                     # [FIX] Only process Ignore if it's NOT a critical failure
                     if "ignore" in action and not is_critical_failure:
                         # [FIX] Explicit Ignore = Resolve without command
                         alert['resolved'] = True
                         alert['resolved_at'] = current_time_ms
                         
                         current_suggestion = alert.get('suggested_action', '')
                         if "(Auto-Ignored)" not in current_suggestion:
                            alert['suggested_action'] = current_suggestion + " (Auto-Ignored)"
                         continue

                     if is_critical_failure or "reset" in action or "machine failure" in msg_lower:
                         command = "reset"
                     elif "stop" in action or "halt" in action: 
                         command = "stop"
                     
                     # Specific Logic based on Metric (from message)
                     elif "temperature" in msg_lower:
                         # Overheating -> Significant slow down
                         command = "set_speed:500"
                     elif "vibration" in msg_lower:
                         # Vibration -> Moderate slow down
                         command = "set_speed:1500"
                     elif "current" in msg_lower or "load" in msg_lower:
                         # High Load -> Reduce speed/load
                         command = "set_speed:1000"
                     elif "wear" in msg_lower:
                         pass # Wear needs maintenance, slowing down helps delay failure
                         command = "set_speed:1000"
                     elif "speed" in action or "slow" in action:
                         command = "set_speed:1200" # Fallback
                     elif "maintenance" in action:
                          command = "set_speed:1000"
                     
                     if command:
                         logger.info(f"Auto-Resolve Executing: {command} for {alert['machineId']}")
                     
                     if command:
                         # Execute
                         await self.send_command({
                             "machine_id": machine_id, 
                             "command": command
                         })
                         
                         # Update Command History (Lock)
                         try:
                             self.command_history[machine_id] = time.time()
                             
                             # [NEW] Log to AI History (So it shows on Dashboard)
                             entry = {
                                 "timestamp": time.time(),
                                 "machine_id": machine_id,
                                 "command": command,
                                 "reason": f"Safety Intervention: {action}",
                                 "type": "safety"
                             }
                             self.ai_history.append(entry)
                             logger.info(f"✅ SAFETY LOG ADDED: {entry}")
                             
                             if len(self.ai_history) > 20: self.ai_history.pop(0)

                         except Exception as e:
                             logger.error(f"❌ FAILED to write Safety Log: {e}")

                         # Update Alert
                         alert['resolved'] = True
                         alert['resolved_at'] = current_time_ms
                         
                         # [FIX] Prevent duplicate suffix and KeyError
                         if "Auto-Executed" not in alert.get('suggested_action', ''):
                            alert['suggested_action'] = alert.get('suggested_action', '') + " (Auto-Executed)"
                         
                         # DO NOT DELETE IMMEDIATELY
                         # keys_to_delete.append(key) -> Handled by Cleanup Loop next tick
                         
                     else:
                         logger.warning(f"AI suggested '{action}' but no mapping found.")
        
        # Apply Deletions
        for key in keys_to_delete:
            del self.active_alerts[key]

        # [NEW] Periodic AI Autonomy Check (Global Optimization)
        if self.autonomy_enabled and (current_time_ms - self.last_autonomy_check) > 10000: # Every 10 Seconds
            self.last_autonomy_check = current_time_ms
            
            # Build Context
            pending_orders = len([o for o in data.get("orders", []) if o["status"] != "Ready"])
            
            # Simplified Machine States for AI
            machines_summary = []
            for line in data.get("lines", []):
                for m in line.get("machines", []):
                    machines_summary.append({
                        "id": m["id"],
                        "status": m["status"],
                        "temp": m.get("temperature", 0),
                        "speed": m.get("speed", 0),
                        "efficiency": m.get("efficiency", 100),
                        "wear": max([p.get("wear", 0) for p in m.get("parts", [])], default=0.0),
                        "safety_mode": m["id"] in self.safety_locks # [NEW] Inject Safety State
                    })
            
            context = {
                "pending_orders": pending_orders,
                "machines": machines_summary,
                "cash": data.get("financials", {}).get("cash", 0)
            }
            
            # [FIX] Prevent AI Pile-up: Check if AI is already running
            if not self.ai_is_running:
                 asyncio.create_task(self._run_autonomy_cycle(context))
            else:
                 logger.warning("⚠️ AI Autonomy Cycle skipped (Previous cycle still running)")


        # [NEW] Data Cleanup (Every hour check)
        if (current_time_ms - self.last_cleanup) > 3600000: # 1 Hour
             self.last_cleanup = current_time_ms
             asyncio.create_task(self.cleanup_old_data())

        # [NEW] Historical Data Snapshot (Every 60s)
        # We don't save 1Hz (Too much), but we save 1-min aggregations for trends.
        if (current_time_ms - self.last_snapshot) > 60000: 
             self.last_snapshot = current_time_ms
             asyncio.create_task(self._save_historical_snapshot(data))


        # Attach alerts to data
        data['alerts'] = current_alerts
        data['autonomy_enabled'] = self.autonomy_enabled # [NEW] Broadcast state
        data['ai_analysis_enabled'] = self.ai_analysis_enabled # [NEW] Broadcast state
        # self.latest_data = data # Moved to top
        # logger.info("Bridge updated latest_data")

    async def _run_ai_analysis(self, anomaly: dict, anomaly_key: str, alert_id: str):
        """
        Background task to run AI analysis and update the active alert.
        """
        try:
            logger.info(f"Starting AI analysis for Alert {alert_id}...")
            ai_response_str = await self.ai.analyze_anomaly(anomaly)
            
            # Parse JSON
            try:
                ai_data = json.loads(ai_response_str)
                suggested_action = ai_data.get('suggested_action', 'Check Manual')
                root_cause = ai_data.get('root_cause', 'Unknown')
            except:
                suggested_action = "Unclear AI response"
                root_cause = "Parsing Error"
            
            # Update the active alert in memory
            if anomaly_key in self.active_alerts:
                self.active_alerts[anomaly_key]['suggested_action'] = suggested_action
                self.active_alerts[anomaly_key]['root_cause'] = root_cause
                logger.info(f"AI Analysis complete for {alert_id}: {suggested_action}")
                
        except Exception as e:
            logger.error(f"AI Background Task failed: {e}")

    async def _run_autonomy_cycle(self, context: dict):
        """
        Runs the AI autonomy loop to optimize factory parameters.
        """
        if self.ai_is_running: return
        self.ai_is_running = True
        
        try:
            # logger.info("Running AI Autonomy Cycle...")
            result = await self.ai.evaluate_autonomy(context)
            
            # [DEBUG] Force print AI output to diagnose "Loss of Control"
            logger.info(f"DEBUG AI RAW: {result}")
            
            # [NEW] Check Autonomy Flag
            if not self.autonomy_enabled:
                # Still run analysis for logging, but DO NOT execute actions
                if result.get("action_needed"):
                    logger.info("AI Autonomy Logic triggerd, but system is DISABLED. Skipping actions.")
                return

            if result.get("action_needed"):
                actions = result.get("actions", [])
                
                # Fallback for legacy single command structure
                if not actions and result.get("suggested_command"):
                     actions = [{
                         "command": result.get("suggested_command"),
                         "machine_id": result.get("target_machine_id"),
                         "reason": result.get("reason", "Optimization")
                     }]

                for action in actions:
                    cmd = action.get("command")
                    mid = action.get("machine_id")
                    reason = action.get("reason", "Optimization")
                    
                    # [NEW] Check Safety Lock
                    if mid in self.safety_locks:
                        if time.time() < self.safety_locks[mid]:
                            logger.info(f"🚫 Autonomy Blocked: {mid} is Safety Locked (Cooling Down)")
                            continue
                        else:
                             del self.safety_locks[mid] # Expired

                    # [NEW] Stability Check (Cooldown) to prevent jitter
                    if mid in self.last_autonomy_action:
                        time_since_last = time.time() - self.last_autonomy_action[mid]
                        if time_since_last < 30.0: # 30 Seconds Cooldown
                             logger.info(f"⏳ Autonomy Cooldown: {mid} adjusted recently ({int(time_since_last)}s ago). Waiting for stability.")
                             continue

                    if cmd and mid:
                        logger.info(f"🦾 AI AUTONOMY ACTION: {cmd} on {mid} | Reason: {reason}")
                        
                        # Execute Command
                        await self.send_command({
                            "machine_id": mid,
                            "command": cmd
                        })
                        
                        # 1. Update Internal History
                        self.action_history.append({
                            "timestamp": time.time(),
                            "machine_id": mid,
                            "command": cmd
                        })
                        if len(self.action_history) > 500: self.action_history.pop(0)

                        # 2. Smart Cooldown Logic (Stability)
                        # Rule: Always apply cooldown for Autonomy actions to prevent jitter
                        self.last_autonomy_action[mid] = time.time()
                        
                        logger.info(f"⏳ Cooldown set for {mid}. Waiting 30s before next AI adjust.")

                        # 3. Update Broadcast History (Visual Log)
                        action_entry = {
                            "timestamp": time.time(),
                            "machine_id": mid,
                            "command": cmd,
                            "reason": reason,
                            "type": "autonomy"
                        }
                        self.ai_history.append(action_entry)
                        
                        # Keep Broadcast Log short
                        if len(self.ai_history) > 20: self.ai_history.pop(0)
                        
                        logger.info(f"✅ Logged to AI History. Total entries: {len(self.ai_history)}")
                        if len(self.ai_history) > 20: self.ai_history.pop(0)

                        # [FIX] Cap History to prevent Memory Leak
                        if len(self.action_history) > 500:
                             self.action_history.pop(0)

                        # [FIX] Cap History to prevent Memory Leak
                        if len(self.action_history) > 500:
                             self.action_history.pop(0)
                    
                    # Notify Frontend via Alert (Optional, or just log event)
                    # We could inject a special "AI Action" alert or notification.
        except Exception as e:
            logger.error(f"Autonomy Cycle Error: {e}")
        finally:
            self.ai_is_running = False

    async def _save_historical_snapshot(self, data: dict):
        """
        Persist a snapshot of machine states to SQL for historical trending.
        Strategy: Downsampling (1Hz -> 1/60Hz)
        """
        try:
            async with AsyncSessionLocal() as session:
                for line in data.get("lines", []):
                    for m in line.get("machines", []):
                        # Extract metrics safely
                        metrics = m.get("metrics", {})
                        
                        state = MachineState(
                            machine_id=m["id"],
                            status=m["status"],
                            temperature=metrics.get("temperature"),
                            vibration=metrics.get("vibration"),
                            speed=metrics.get("speed"),
                            load=metrics.get("load"),
                            power=metrics.get("current") # Using current as proxy for power in simplified model
                        )
                        session.add(state)
                
                await session.commit()
                # logger.info("✅ Historical Snapshot Saved")
                
        except Exception as e:
            logger.error(f"Snapshot Error: {e}")


    def get_latest_data(self):
        data = self.latest_data.copy()
        data['ai_history'] = list(reversed(self.ai_history)) # Newest first
        return data

    def stop(self):
        self.running = False
