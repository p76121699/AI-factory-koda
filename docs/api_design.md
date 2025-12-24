# Smart Factory API Design

## Overview
Base URL: `/api/v1`

## Endpoints

### System
- `GET /health`: Check system status.

### Machines & Production Lines
- `GET /lines`: Get list of production lines (A, B, C) and their status.
- `GET /machines`: Get list of all machines.
- `GET /machines/{machine_id}`: Get detailed status of a specific machine.

### Real-time Data (WebSocket)
- `WS /ws/realtime`: Stream of real-time sensor data from the simulation/backend.
    - **Client Message**: `{"action": "subscribe", "lines": ["A"]}`
    - **Server Message**: `{"type": "update", "data": {...}}` or `{"type": "alert", "data": {...}}`

### Simulation Control
- `POST /simulation/start`: Start the factory simulation.
- `POST /simulation/stop`: Stop the simulation.
- `POST /simulation/config`: Configure simulation parameters (e.g., speed, fault rate).
    - Body: `{"speed_multiplier": 1.0, "fault_probability": 0.05}`

### AI Copilot
- `POST /chat`: Send a message to the AI assistant.
    - Body: `{"message": "What is the status of Line A?", "context": {...}}`
    - Response: `{"response": "Line A is running normally...", "actions": [...]}`

### Events & Alerts
- `GET /events`: Get historical events/alerts.
    - Query Params: `start_time`, `end_time`, `severity`, `machine_id`
