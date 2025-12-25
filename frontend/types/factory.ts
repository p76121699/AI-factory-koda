export interface Machine {
    id: string;
    name: string;
    type: string;
    status: "RUNNING" | "IDLE" | "ERROR" | "OFFLINE" | "WAITING_FOR_REPAIR" | "REPAIRING";
    error_code?: string;

    // Core metrics
    temperature?: number;
    vibration?: number;
    speed?: number;
    load?: number;
    current?: number;

    // Dynamic metrics from backend
    metrics?: {
        efficiency?: number;
        speed_setting?: number;
        target_speed?: number;
        output_count?: number;
        defect_count?: number;
        energy_usage?: number;
        [key: string]: any;
    };

    // Health & Maintenance
    health_score: number;
    maint_due_hours: number;

    // Output & performance
    power?: number;
    oee?: number;

    // Type specific
    pass_rate?: number;
    jam_rate?: number;
    power_consumption?: number; // Deprecated, use power

    // New Parts Logic
    wear_level?: number; // 0-1
    parts?: {
        name: string;
        wear: number;
        status: string;
    }[];
}

export interface LineData {
    id: string;
    name: string;
    product_type: string;
    current_order?: OrderModel; // New Dynamic Order
    machines: Machine[];
}

export interface InventoryItem {
    id: string;
    name: string;
    category: "Raw Material" | "WIP" | "Finished";
    quantity: number;
    unit: string;
    safety_stock: number;
    reorder_point: number;
    status: "OK" | "LOW" | "CRITICAL";
    trend: "up" | "down" | "flat";
    cost_per_unit: number;
    total_value: number;
    last_updated: number;
}

export interface FactoryState {
    lines: LineData[];
    inventory: InventoryItem[];
    workers: Worker[];
    orders: OrderModel[];
    financials: {
        revenue: number;
        costs: number;
        profit: number;
    };
    kpi?: {
        total_output: number;
        avg_cycle_time: number;
        energy_usage: number;
        defect_rate: number;
    };
    pending_orders_count: number;
}

export interface FactoryData {
    timestamp: number;
    lines: LineData[];
    inventory: InventoryItem[];
    alerts: Alert[];
    orders: OrderModel[];
    financials: {
        revenue: number;
        costs: number;
        profit: number;
    };
    kpi?: {
        total_output: number;
        avg_cycle_time: number;
        energy_usage: number;
        defect_rate: number;
    };

}

export type PanelType = 'dashboard' | 'inventory' | 'orders' | 'production' | 'alerts' | 'ai-assistant';

export type AlertSeverity = "critical" | "high" | "medium" | "low";

export interface Alert {
    id: string;
    machineId: string;
    type: "vibration" | "system" | "blockage" | "temperature" | "power";
    severity: AlertSeverity;
    message: string;
    timestamp: number;
    count?: number;
    resolved?: boolean;
    suggested_action?: string;
    root_cause?: string;
}

export interface AlertFilterOptions {
    severity?: AlertSeverity[];
    machineId?: string[];
    type?: string[];
    timeRange?: { from: number; to: number };
}

export interface OrderModel {
    id: string;
    customer: string;
    product: string;
    quantity: number;
    progress: number;       // 0–100
    status: 'Pending' | 'Production' | 'Assembly' | 'Testing' | 'Ready';
    due: string;            // ISO date
    createdAt: string;      // ISO date
    priority: 'High' | 'Medium' | 'Low';
    notes?: string[];
    workstation?: string;
    lastEvent?: string;
}

export interface ProductionPoint {
    timestamp: string;        // ISO datetime
    lineA: number;
    lineB: number;
    lineC: number;
    cycleTimeA?: number;
    cycleTimeB?: number;
    cycleTimeC?: number;
    defectsA?: number;
    defectsB?: number;
    defectsC?: number;
    energyA?: number;
    energyB?: number;
    energyC?: number;
}

export interface EfficiencyStatus {
    name: 'Running' | 'Idle' | 'Error' | 'Maintenance' | 'Repairing';
    value: number;        // percentage
}

export interface ProductionKPI {
    totalOutput: number;
    avgCycleTime: number;
    energyUsage: number;
    defectRate: number;
    lastUpdate: string;
}
