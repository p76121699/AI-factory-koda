# Simulation Configuration

# Time Settings
UPDATE_INTERVAL = 1.0  # Seconds between updates
SIMULATION_SPEED = 1.0 # Time multiplier

# Worker Settings
WORKER_COUNT = 3
WORKER_SPEED_BASE = 5.0  # Seconds to move between adjacent nodes
TRAVEL_NOISE_MEAN = 0.0
TRAVEL_NOISE_STD = 1.0   # Standard deviation for travel noise (Gaussian)
REPAIR_TIME_BASE = 15.0  # Base time to repair a machine

# Machine Physics
THRESHOLD_VARIANCE = 0.1 # +/- 10% randomization for thresholds
FAILURE_CHANCE_BASE = 0.00001 # Base probability per tick (Reduced to prevent loop)
FAILURE_EXPONENT = 4.0   # How sharply failure risk rises near threshold (Exponential)

# Thresholds (Base values, will be randomized per machine)
base_thresholds = {
    "Cutter": {
        "temperature": {"critical": 100.0, "safe_max": 90.0},
        "vibration": {"critical": 10.0, "safe_max": 8.0}
    },
    "RobotArm": {
        "current": {"critical": 20.0, "safe_max": 18.0}
    },
    "Conveyor": {
        "speed": {"critical": 2.0, "safe_max": 1.5}
    },
    "Inspector": {},
    "Packer": {
        "jam_rate": {"critical": 0.5, "safe_max": 0.3}
    }
}

# Economy
PRODUCT_PRICE = 150.0
WORKER_HOURLY_WAGE = 25.0
REPAIR_COST = 500.0
ENERGY_COST_PER_KWH = 0.15
INITIAL_CAPITAL = 50000.0

# Inventory & Recipes
MATERIALS_DB = {
    "RAW_METAL": {"name": "Metal Sheet", "cost": 15.0, "category": "Raw Material", "safety_stock": 200, "restock_amount": 500},
    "RAW_PLASTIC": {"name": "Plastic Pellets", "cost": 5.0, "category": "Raw Material", "safety_stock": 500, "restock_amount": 1000},
    "PACKAGING": {"name": "Cardboard Box", "cost": 1.0, "category": "Raw Material", "safety_stock": 300, "restock_amount": 1000},
    "COMPONENT_SENSOR": {"name": "Sensor Unit", "cost": 45.0, "category": "Raw Material", "safety_stock": 100, "restock_amount": 200},
    "COMPONENT_SCREEN": {"name": "OLED Screen", "cost": 30.0, "category": "Raw Material", "safety_stock": 100, "restock_amount": 200},
}

# Production Recipes (Inputs required at start of line - Cutter)
# Output is "Intermediate Product"
RECIPES = {
    "Generic Unit": {"RAW_METAL": 1, "RAW_PLASTIC": 1},
    "Smart Watch Pro": {"RAW_METAL": 2, "COMPONENT_SCREEN": 1},
    "Smart Watch X1": {"RAW_PLASTIC": 2, "COMPONENT_SCREEN": 1},
    "Sensor Module": {"RAW_PLASTIC": 1, "COMPONENT_SENSOR": 1}
}

# Packaging Recipe (Consumed at Packer)
PACKING_REQUIREMENT = {"PACKAGING": 1}
