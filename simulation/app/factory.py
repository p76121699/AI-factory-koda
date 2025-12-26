import time
import random
from typing import List, Dict, Any, Optional
from .models import *
from .config import *

class ProductionLine:
    def __init__(self, id: str, name: str, product_type: str = "Generic Unit"):
        self.id = id
        self.name = name
        self.product_type = product_type
        self.current_order: Optional[Dict[str, Any]] = None # Track active order
        self.machines: List[Machine] = []
        self._init_machines()
        
    def _init_machines(self):
        # Order matters for flow: Cutter -> Conveyor -> Robot -> Inspector -> Packer
        self.machines.append(Cutter(id=f"{self.id}-CUT-01", name="Cutter", type="Cutter", line_id=self.id))
        self.machines.append(Conveyor(id=f"{self.id}-CON-01", name="Conveyor", type="Conveyor", line_id=self.id))
        self.machines.append(RobotArm(id=f"{self.id}-ROB-01", name="Robot Arm", type="RobotArm", line_id=self.id))
        self.machines.append(Inspector(id=f"{self.id}-INS-01", name="Inspector", type="Inspector", line_id=self.id))
        self.machines.append(Packer(id=f"{self.id}-PAC-01", name="Packer", type="Packer", line_id=self.id))

    def get_machine(self, machine_id: str) -> Optional[Machine]:
        return next((m for m in self.machines if m.id == machine_id), None)

    def update(self, dt: float):
        # Move Products between buffers (Flow Logic)
        for i in range(len(self.machines) - 1):
            curr_m = self.machines[i]
            next_m = self.machines[i+1]
            
            # If current machine has output and next machine is not full (simplified infinite buffer for now)
            while curr_m.output_buffer:
                product = curr_m.output_buffer.pop(0)
                next_m.input_buffer.append(product)
                
        # Update individual machines
        for m in self.machines:
            m.update(dt)

    def to_dict(self) -> Dict[str, Any]:
        return {
            "id": self.id,
            "name": self.name,
            "product_type": self.product_type,
            "current_order": self.current_order,
            "machines": [m.to_dict() for m in self.machines]
        }

class Factory:
    def __init__(self):
        self.lines: List[ProductionLine] = [
            ProductionLine("L1", "Line A", "Smart Watch Pro"),
            ProductionLine("L2", "Line B", "Smart Watch X1"),
            ProductionLine("L3", "Line C", "Sensor Module")
        ]
        self.workers: List[Worker] = [
            Worker(id=f"W-{i+1}", name=f"Worker {i+1}", location="HUB") 
            for i in range(WORKER_COUNT)
        ]
        self.inventory: List[InventoryItem] = self._init_inventory()
        self.raw_material_source: int = 10000 # Infinite pool for simulation (Deprecated by auto-restock)
        self.finished_products: List[Product] = []
        self.orders: List[Dict[str, Any]] = self._init_orders()
        self.total_revenue: float = 0.0
        self.total_costs: float = 0.0
        self.total_energy_kwh: float = 0.0 # [NEW] Real Energy Tracking
        self.cash_balance: float = INITIAL_CAPITAL
        self.asset_history: List[Dict[str, float]] = [] # Track daily/hourly assets
        
    def _init_inventory(self) -> List[InventoryItem]:
        items = []
        # 1. Raw Materials from DB
        for key, data in MATERIALS_DB.items():
            items.append(InventoryItem(
                id=key, 
                name=data["name"], 
                category=data["category"], 
                quantity=data["safety_stock"] * 2, # Start with double safety stock
                unit="pcs",
                safety_stock=data["safety_stock"],
                reorder_point=data["safety_stock"],
                cost_per_unit=data["cost"]
            ))
            
        # 2. Finished Goods (Placeholder for outputs)
        items.append(InventoryItem(id="FIN-001", name="Finished Unit", category="Finished", quantity=0, cost_per_unit=50.0))
        return items

    def get_machine(self, machine_id: str) -> Optional[Machine]:
        for line in self.lines:
            m = line.get_machine(machine_id)
            if m: return m
        return None

    def reset(self):
        """Hard Factory Reset"""
        self.cash_balance = INITIAL_CAPITAL
        self.total_costs = 0.0
        self.total_revenue = 0.0
        self.total_energy_kwh = 0.0
        self.orders = []
        self.finished_products = []
        self.inventory = self._init_inventory()
        self.asset_history = []
        
        # Reset Machines & Workers
        self.workers = [
            Worker(id=f"W-{i+1}", name=f"Worker {i+1}", location="HUB") 
            for i in range(WORKER_COUNT)
        ]
        # Re-init Lines
        self.lines = [
            ProductionLine("L1", "Line A", "Smart Watch Pro"),
            ProductionLine("L2", "Line B", "Smart Watch X1"),
            ProductionLine("L3", "Line C", "Sensor Module")
        ]

    def prune_orders(self):
        """Clean up old finished orders"""
        now = time.time()
        # Remove Ready orders older than 24 hours (86400s)
        self.orders = [
            o for o in self.orders 
            if not (o.get("status") == "Ready" and (now - o.get("completed_at", 0)) > 86400)
        ]

    def _dispatch_orders(self):
        # Assign Pending/Assembly orders to available lines
        # "Assembly" here is treated as "In Production" for simplicity if not already assigned
        active_orders = [o for o in self.orders if o["status"] in ["Pending", "Assembly", "Production"]]
        
        for line in self.lines:
            # If line is free
            if line.current_order is None:
                # Find an order that matches this line's capability
                # (Or if we are flexible, just the first unassigned one)
                # Let's match product_type for realism as requested
                
                # [LOAD BALANCING] Allow ANY line to take ANY order
                # Filter for orders that are NOT currently assigned to other lines
                assigned_ids = [l.current_order["id"] for l in self.lines if l.current_order]
                
                # Pick highest priority / first available order
                candidate = next((o for o in active_orders 
                                  if o["id"] not in assigned_ids), None)
                
                if candidate:
                    line.current_order = candidate
                    # DYNAMIC RETOOLING: Line adapts to the product
                    line.product_type = candidate["product"] 
                    if candidate["status"] == "Pending":
                        candidate["status"] = "Production"
                    
                    # [FIX] Update display to show ACTUAL line (Load Balancing) - Always update when assigned
                    candidate["description"] = f"Production: {line.id}"
            
            # Check if current order is finished
            elif line.current_order["status"] == "Ready" or line.current_order["progress"] >= 100:
                 line.current_order = None

    def update(self, dt: float):
        current_time = time.time()
        
        # 0. Eco-System: Dispatch Orders & Auto-Restock
        self._dispatch_orders()
        self._check_and_restock_inventory()
        
        # 1. Feed Raw Materials to Cutters (Based on Recipe)
        for line in self.lines:
            if not line.current_order:
                continue # Skip idle lines
                
            cutter = line.machines[0]
            if len(cutter.input_buffer) >= 5:
                continue

            # Recipe Check
            recipe = RECIPES.get(line.product_type, RECIPES["Generic Unit"])
            can_produce = True
            
            # Verify Stocks
            for mat_id, qty_needed in recipe.items():
                item = next((i for i in self.inventory if i.id == mat_id), None)
                if not item or item.quantity < qty_needed:
                    can_produce = False
                    break
            
            if can_produce:
                # Consume Materials
                for mat_id, qty_needed in recipe.items():
                    item = next((i for i in self.inventory if i.id == mat_id), None)
                    item.quantity -= qty_needed
                
                # Spawn Product
                p = Product(id=f"P-{int(time.time()*100)%10000}", type=line.product_type)
                p.order_id = line.current_order["id"] 
                cutter.input_buffer.append(p)

        # 2. Update Lines (Machine logic)
        for line in self.lines:
            line.update(dt)
            
            # Collect Finished Products from Packers
            packer = line.machines[-1]
            while packer.output_buffer:
                prod = packer.output_buffer.pop(0)
                self.finished_products.append(prod)
                
                # Update Finished Goods Inventory (Generic)
                fin_item = next((i for i in self.inventory if i.category == "Finished"), None)
                if fin_item: fin_item.quantity += 1
                
                # Consume Packaging
                pkg_item = next((i for i in self.inventory if i.id == "PACKAGING"), None)
                if pkg_item and pkg_item.quantity > 0:
                     pkg_item.quantity -= 1
                
                # Fulfill the specific order assigned to this line
                if line.current_order:
                     self._process_order_fulfillment(line.current_order)
                
        # 3. Worker Logic (Dispatch & Patrol)
        self._update_workers(dt, current_time)
        
        # 4. Economy & Orders
        self._generate_new_orders()

    def _check_and_restock_inventory(self):
        for item in self.inventory:
            if item.category == "Raw Material" and item.quantity <= item.reorder_point:
                # Auto-Purchase
                data = MATERIALS_DB.get(item.id)
                amount = data["restock_amount"] if data else 500
                cost = amount * item.cost_per_unit
                
                if self.cash_balance >= cost:
                    self.cash_balance -= cost
                    self.total_costs += cost
                    item.quantity += amount
                    # print(f"DEBUG: Auto-restocked {amount} {item.name}. Cost: ${cost}")
                else:
                    # Bankrupt? Or Debt? Let's allow debt for simulation flow
                    self.cash_balance -= cost
                    self.total_costs += cost
                    item.quantity += amount


    def _process_order_fulfillment(self, order: Dict[str, Any]):
        fulfilled = order.get("fulfilled", 0) + 1
        order["fulfilled"] = fulfilled
        # Simple Logic: 1 Unit = 1 Quantity
        order["progress"] = min(100, int((fulfilled / order["quantity"]) * 100))
        
        # Track Production Revenue (Accrual)
        self.total_revenue += PRODUCT_PRICE
        
        if order["progress"] >= 100:
            order["status"] = "Ready"
            if "completed_at" not in order: order["completed_at"] = time.time()
            # Cash Settlement (Payment received)
            order_value = order["quantity"] * PRODUCT_PRICE
            self.cash_balance += order_value
            
            # Reduce Inv (Shipment)
            # Find generic finished item
            fin = next((i for i in self.inventory if i.category == "Finished"), None)
            if fin:
                fin.quantity = max(0, fin.quantity - order["quantity"])

    def _init_orders(self) -> List[Dict[str, Any]]:
        # Initialize with no orders, let the system generate them naturally based on time
        return []

    def _generate_new_orders(self):
        # 2. Random New Orders
        if random.random() < 0.0025: # Increased from 0.001 (User req: "Increase a little bit")
             new_id = f"ORD-{int(time.time())}"
             products = ["Smart Watch Pro", "Smart Watch X1", "Sensor Module"]
             self.orders.append({
                 "id": new_id,
                 "customer": f"Client {random.randint(100, 999)}",
                 "product": random.choice(products),
                 "quantity": random.randint(100, 1000),
                 "progress": 0,
                 "status": "Pending",
                 "due": "2024-02-01",
                 "fulfilled": 0
             })

    def _update_workers(self, dt: float, current_time: float):
        # Update Operational Costs (Wages)
        wages = (WORKER_HOURLY_WAGE / 3600.0) * dt * len(self.workers)
        self.total_costs += wages
        self.cash_balance -= wages
        
        # Power & Energy Costs
        # [FIX] Real Energy Calculation
        energy_this_tick = 0.0
        for line in self.lines:
            for m in line.machines:
                 if m.status == "RUNNING":
                     # Base load + Speed load
                     # Assumed: Machine uses ~0.5kW idle/support, + 1kW per 1000 speed/efficiency units roughly
                     # Simplified: 2.0 kW per machine running avg
                     power_kw = 2.0 
                     
                     # Detailed per type override
                     if m.type == "Cutter": power_kw = 3.0 + (m.metrics.get("speed", 1000)/1000.0)
                     elif m.type == "Conveyor": power_kw = 0.5 + m.metrics.get("speed", 1.0)
                     
                     energy_kwh = power_kw * (dt / 3600.0) # kW * hours
                     energy_this_tick += energy_kwh
        
        self.total_energy_kwh += energy_this_tick
        self.total_costs += (energy_this_tick * ENERGY_COST_PER_KWH)
        self.cash_balance -= (energy_this_tick * ENERGY_COST_PER_KWH)

        # Identify broken machines
        broken_machines = []
        high_wear_machines = []
        for line in self.lines:
            for m in line.machines:
                if m.status in ["ERROR", "WAITING_FOR_REPAIR"]:
                    broken_machines.append(m)
                elif m.status != "REPAIRING":
                    # Check for high wear
                    for p in m.parts:
                        if p.wear > 0.8:
                            high_wear_machines.append(m)
                            break

        # [FIX] Enhanced Dispatch Logic (Interrupt Patrols)
        
        # 1. Identify Urgent Tasks
        urgent_repairs = [m for m in broken_machines if m.status == "WAITING_FOR_REPAIR"]
        
        # 2. Map current targets to avoid double booking
        claimed_targets = set()
        for w in self.workers:
            if w.target_location:
                claimed_targets.add(w.target_location)
        
        # 3. Assign IDLE workers first
        # [FIX] Refactored Logic: Update -> Repair -> Dispatch
        
        # 1. Update Movement & Timers
        for worker in self.workers:
            worker.update(dt, current_time)

        # 2. Check for Arrivals & Start Repairs
        # ... (rest of logic implied, handled in other view, we are just bridging the gap to control_machine) ... 
        # Wait, I cannot skip lines if I am replacing a block.
        # I need to be careful. The target block starts at 172 and ends at 448? That's too huge.
        # I should make separate edits.
        # Edit 1: Remove duplicate _generate_new_orders.
        # Edit 2: Update control_machine.
        pass

        # Update Operational Costs (Wages)
        self.total_costs += (WORKER_HOURLY_WAGE / 3600.0) * dt * len(self.workers)
        


        # Identify broken machines
        broken_machines = []
        high_wear_machines = []
        for line in self.lines:
            for m in line.machines:
                if m.status in ["ERROR", "WAITING_FOR_REPAIR"]:
                    broken_machines.append(m)
                elif m.status != "REPAIRING":
                    # Check for high wear
                    for p in m.parts:
                        if p.wear > 0.8:
                            high_wear_machines.append(m)
                            break

        # [FIX] Enhanced Dispatch Logic (Interrupt Patrols)
        
        # 1. Identify Urgent Tasks
        urgent_repairs = [m for m in broken_machines if m.status == "WAITING_FOR_REPAIR"]
        
        # 2. Map current targets to avoid double booking
        claimed_targets = set()
        for w in self.workers:
            if w.target_location:
                claimed_targets.add(w.target_location)
        
        # 3. Assign IDLE workers first
        # [FIX] Refactored Logic: Update -> Repair -> Dispatch
        
        # 1. Update Movement & Timers
        for worker in self.workers:
            worker.update(dt, current_time)

        # 2. Check for Arrivals & Start Repairs
        # If a worker just arrived (IDLE at location), see if they should work.
        for worker in self.workers:
            if worker.state == "IDLE" and worker.location:
                machine = self.get_machine(worker.location)
                if machine:
                    started_work = False
                    
                    if machine.status == "WAITING_FOR_REPAIR":
                        # Reactive Repair
                        worker.start_job(REPAIR_TIME_BASE, current_time)
                        machine.status = "REPAIRING"
                        self.total_costs += REPAIR_COST
                        started_work = True
                        
                    elif machine.status != "REPAIRING":
                        # Check for Preventive Maintenance Opportunity
                        needs_preventive = False
                        for p in machine.parts:
                            if p.wear > 0.8:
                                needs_preventive = True
                                break
                        
                        if needs_preventive:
                            # Preventive Service
                            worker.start_job(REPAIR_TIME_BASE * 0.5, current_time)
                            machine.status = "REPAIRING"
                            self.total_costs += REPAIR_COST * 0.5
                            started_work = True

                    elif machine.status == "REPAIRING":
                         # Already being repaired by someone else? Or just finished?
                         # Ideally specific logic, but for now Machine.reset handles finish.
                         pass
                    
                    # If finished previous job (just turned IDLE from WORKING), reset machine
                    # But wait, worker.update switches WORKING -> IDLE when done.
                    # So if we are here and *were* repairing, we should reset the machine.
                    # How do we know we *functionally* processed the repair? 
                    # Sim logic: Start Job -> Wait -> End Job (IDLE). 
                    # If we are IDLE at a REPAIRING machine, and we aren't starting new work,
                    # it implies we just finished? 
                    # Actually, let's explicit check: if machine is REPAIRING and no one is WORKING on it?
                    # No, worker.update just finished.
                    pass

        # Handle Repair Completion (Machine Reset)
        # We need to find machines that are REPAIRING but have no active worker working on them?
        # Or simply: if a worker just finished (transited WORKING->IDLE), we reset the machine.
        # But we don't track state change explicitly. 
        # Easier: Check all REPAIRING machines. If no worker is WORKING on it, it's done.
        
        working_on_machines = set()
        for w in self.workers:
            if w.state == "WORKING" and w.location:
                working_on_machines.add(w.location)
        
        for line in self.lines:
            for m in line.machines:
                if m.status == "REPAIRING":
                    if m.id not in working_on_machines:
                        # Repair Finished
                        m.reset()

        # 3. Dispatch & Redirect Logic
        
        # Identify urgent tasks again (status might have changed due to step 2)
        broken_machines = []
        high_wear_machines = []
        for line in self.lines:
            for m in line.machines:
                if m.status in ["ERROR", "WAITING_FOR_REPAIR"]:
                    broken_machines.append(m)
                elif m.status != "REPAIRING":
                    for p in m.parts:
                        if p.wear > 0.8:
                            high_wear_machines.append(m)
                            break

        urgent_repairs = [m for m in broken_machines if m.status == "WAITING_FOR_REPAIR"]
        
        claimed_targets = set()
        for w in self.workers:
            if w.target_location:
                claimed_targets.add(w.target_location)
            if w.state == "WORKING" and w.location:
                claimed_targets.add(w.location) # Don't send more workers to where one is working

        for worker in self.workers:
            if worker.state == "IDLE":
                target = None
                # Try urgent first
                for m in urgent_repairs:
                    if m.id not in claimed_targets:
                        target = m
                        break
                
                # Try preventive next
                if not target:
                    for m in high_wear_machines:
                         if m.id not in claimed_targets:
                             target = m
                             break
                
                if target:
                    self._dispatch_worker(worker, target, current_time)
                    claimed_targets.add(target.id)
                else:
                    self._patrol_worker(worker, current_time)

            elif worker.state == "MOVING":
                # Interrupt / Redirect Logic
                current_target_urgent = False
                for m in urgent_repairs:
                     if m.id == worker.target_location:
                         current_target_urgent = True
                         break
                
                if not current_target_urgent:
                    unclaimed_urgent = [m for m in urgent_repairs if m.id not in claimed_targets]
                    if unclaimed_urgent:
                        new_target = unclaimed_urgent[0]
                        print(f"DEBUG: Redirecting {worker.id} from {worker.target_location} into {new_target.id}")
                        self._dispatch_worker(worker, new_target, current_time)
                        claimed_targets.add(new_target.id)

    def _patrol_worker(self, worker: Worker, current_time: float):
        # Sequential Logic: Find current index in topology and move to next
        # Topology: Hub -> L1M1 -> L1M2 ... -> L1M5 -> L2M1 ...
        all_machines = []
        for line in self.lines:
            all_machines.extend(line.machines)
            
        current_idx = -1
        if worker.location and worker.location != "HUB":
            for i, m in enumerate(all_machines):
                if m.id == worker.location:
                    current_idx = i
                    break
        
        # Move to next (Loop around)
        next_idx = (current_idx + 1) % len(all_machines)
        target_machine = all_machines[next_idx]
        
        # Move
        distance = self._calculate_hops(worker.location, target_machine.id)
        self._move_worker(worker, target_machine.id, distance, current_time)

    def _dispatch_worker(self, worker: Worker, target_machine: Machine, current_time: float):
        # Calculate Hops
        hops = self._calculate_hops(worker.location, target_machine.id)
        
        # Calculate Time: Sum of Gaussian noise per hop
        total_time = 0
        for _ in range(max(1, hops)): # At least 1 hop
             noise = max(0, random.gauss(TRAVEL_NOISE_MEAN, TRAVEL_NOISE_STD))
             total_time += (WORKER_SPEED_BASE + noise)
             
        worker.state = "MOVING"
        worker.target_location = target_machine.id
        worker.task_end_time = current_time + total_time

    def _move_worker(self, worker: Worker, target_id: str, hops: int, current_time: float):
         # Generic move helper
         total_time = 0
         for _ in range(max(1, hops)): 
             noise = max(0, random.gauss(TRAVEL_NOISE_MEAN, TRAVEL_NOISE_STD))
             total_time += (WORKER_SPEED_BASE + noise)
         worker.state = "MOVING"
         worker.target_location = target_id
         worker.task_end_time = current_time + total_time

    def _calculate_hops(self, start_loc: str, end_loc: str) -> int:
        if start_loc == end_loc: return 0
        # Simplified: Random 1-3 for neighboring, 3-6 for far
        return random.randint(1, 4)

    def control_machine(self, machine_id: str, command: str):
        # [NEW] Handle System Commands
        if machine_id == "SYSTEM":
            if command == "reset":
                self.reset()
                return True
            if command == "prune_orders":
                self.prune_orders()
                return True

        print(f"DEBUG: Factory.control_machine received: {machine_id} -> {command}") # Debug Log
        m = self.get_machine(machine_id)
        if m:
            if command == "start": m.status = "RUNNING"
            elif command == "stop": m.status = "IDLE"
            elif command == "reset": 
                print(f"DEBUG: Processing RESET for {m.id}. Status was {m.status}")
                if m.status == "ERROR":
                    m.status = "WAITING_FOR_REPAIR"
                else:
                    m.reset()
            elif command == "maintenance":
                m.status = "WAITING_FOR_REPAIR"
                print(f"DEBUG: Manual Maintenance Triggered for {m.id}")
            elif command.startswith("set_speed:"):
                # Parse value "set_speed:1500"
                try:
                    val = float(command.split(":")[1])
                    
                    # [SMART MAPPING for Absolute Set]
                    if m.type == "Cutter":
                        m.metrics["speed_setting"] = val
                    elif m.type == "Conveyor":
                        m.metrics["target_speed"] = val / 800.0  
                    elif m.type in ["RobotArm", "Inspector", "Packer"]:
                        m.metrics["efficiency"] = val / 10.0
                    
                    # Backup
                    m.metrics["speed_setting"] = val
                except:
                    pass

            elif command.startswith("adjust_speed:"):
                # Relative Adjustment: "adjust_speed:500" or "adjust_speed:-200"
                try:
                    delta = float(command.split(":")[1])
                    
                    if m.type == "Cutter":
                        # RPM Adjustment
                        current = m.metrics.get("speed_setting", 1000.0)
                        new_val = max(500, min(6000, current + delta))
                        m.metrics["speed_setting"] = new_val
                        print(f"DEBUG: {m.id} RPM adjusted {delta} -> {new_val}")
                        
                    elif m.type == "Conveyor":
                        # m/s Adjustment (Direct value, e.g. 0.5)
                        current = m.metrics.get("target_speed", 1.2)
                        new_val = max(0.5, min(5.0, current + delta))
                        m.metrics["target_speed"] = new_val
                        print(f"DEBUG: {m.id} Speed adjusted {delta}m/s -> {new_val}m/s")
                        
                    elif m.type in ["RobotArm", "Inspector", "Packer"]:
                        # Efficiency % Adjustment (Direct value, e.g. 10 for 10%)
                        current = m.metrics.get("efficiency", 100.0)
                        new_val = max(50.0, min(300.0, current + delta))
                        m.metrics["efficiency"] = new_val
                        print(f"DEBUG: {m.id} Efficiency adjusted {delta}% -> {new_val}%")

                except Exception as e:
                    print(f"DEBUG: Error processing adjust_speed: {e}")
                    pass
            return True
        return False

    def to_dict(self) -> Dict[str, Any]:
        # Aggregate KPIs on the fly
        total_output = 0
        total_defects = 0
        total_energy = 0.0 
        machine_count = 0
        total_cycle_time = 0.0
        total_efficiency = 0.0
        
        for line in self.lines:
            for m in line.machines:
                machine_count += 1
                # Output comes from Packers
                if m.type == "Packer":
                    total_output += m.metrics.get("packed_count", 0)
                
                # Defects come from Inspectors
                if m.type == "Inspector":
                     total_defects += m.metrics.get("fail_count", 0)
                
                # Efficiency Accumulation
                # Use speed ratio for Cutter/Conveyor as proxy for efficiency?
                # Or just use "efficiency" metric if present, else 100?
                # Robot/Inspector/Packer use 'efficiency' directly.
                # Cutter/Conveyor use 'speed' / 'speed_setting' (3000 = 100%?)
                if m.type == "Cutter":
                     eff = (m.metrics.get("speed", 0) / 3000.0) * 100.0
                elif m.type == "Conveyor":
                     eff = (m.metrics.get("speed", 0) / 1.2) * 100.0
                else:
                     eff = m.metrics.get("efficiency", 0)
                
                total_efficiency += eff
                
        avg_efficiency = total_efficiency / max(1, machine_count)
        
        # Fallback if energy not tracked in machine
        # Fallback if energy not tracked in machine
        if total_energy == 0:
             total_energy = self.total_energy_kwh

        avg_cycle_time = 4.2 # Mock baseline
        if total_output > 0:
             avg_cycle_time = 4.0 + (random.random() * 0.5)

        defect_rate = 0.0
        if total_output + total_defects > 0:
            defect_rate = (total_defects / (total_output + total_defects)) * 100.0
            
        # Assets Calculation
        inv_value = sum([i.quantity * i.cost_per_unit for i in self.inventory])
        total_assets = self.cash_balance + inv_value

        return {
            "lines": [l.to_dict() for l in self.lines],
            "inventory": [i.to_dict() for i in self.inventory],
            "workers": [w.to_dict() for w in self.workers],
            "orders": self.orders,
            "financials": {
                "revenue": round(self.total_revenue, 2),
                "costs": round(self.total_costs, 2),
                "profit": round(self.total_revenue - self.total_costs, 2),
                "cash": round(self.cash_balance, 2),
                "assets": round(total_assets, 2)
            },
            "kpi": {
                "total_output": total_output,
                "avg_cycle_time": round(avg_cycle_time, 2),
                "energy_usage": int(total_energy),
                "defect_rate": round(defect_rate, 2),
                "avg_efficiency": round(avg_efficiency, 1)
            },
            "pending_orders_count": len([o for o in self.orders if o["status"] == "Pending" or o["status"] == "Production"])
        }
