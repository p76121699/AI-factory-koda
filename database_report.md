# Database Report: Smart Factory System

## 1. Overview
This project utilizes a lightweight, file-based relational database to store persistent monitoring data and event logs.

- **Database Engine**: [SQLite](https://www.sqlite.org/index.html)
- **File Location**: `backend/factory.db`
- **ORM Library**: [SQLAlchemy](https://www.sqlalchemy.org/) (AsyncIO + aiosqlite)
- **Configuration File**: `backend/database.py`

---

## 2. Schema Structure
The database consists of two primary tables defined in `backend/models.py`.

### Table 1: `events`
Records critical system occurrences, including alarms, anomalies, and operational logs.

| Column Name | Data Type | Description |
| :--- | :--- | :--- |
| `id` | `Integer` | **Primary Key**. Auto-incrementing unique identifier. |
| `timestamp` | `DateTime` | UTC timestamp of when the event occurred. Indexed. |
| `machine_id` | `String` | Identifier of the machine involved (e.g., `L1-CUT-01`). Indexed. |
| `type` | `String` | Category of the event (e.g., `ANOMALY`, `ALERT`, `INFO`). |
| `severity` | `String` | Urgency level (`low`, `medium`, `high`, `critical`). |
| `message` | `String` | Human-readable description of the event. |
| `details` | `String` | Extended data, typically stored as a JSON string. |

### Table 2: `machine_states`
Stores time-series snapshots of machine health metrics for historical analysis.

| Column Name | Data Type | Description |
| :--- | :--- | :--- |
| `id` | `Integer` | **Primary Key**. Auto-incrementing unique identifier. |
| `timestamp` | `DateTime` | UTC timestamp of the snapshot. |
| `machine_id` | `String` | Identifier of the machine. Indexed. |
| `status` | `String` | Operational state (e.g., `RUNNING`, `IDLE`, `ERROR`). |
| `temperature` | `Float` | Machine core temperature (°C). |
| `vibration` | `Float` | Vibration level (mm/s²). |
| `speed` | `Float` | Current operating speed (RPM or m/s). |
| `load` | `Float` | Current load percentage (0-100%). |
| `power` | `Float` | Power consumption (kW). |

---

## 3. Data Access Patterns

### Write Operations
*   **Source**: `backend/bridge.py`
*   **Trigger**:
    *   **Anomalies**: When the `AnomalyDetector` identifies an outlier, a new row is inserted into the `events` table.
    *   **State Snapshots**: (Optional) Periodic snapshots of machine metrics can be written to `machine_states`.

### Read Operations
*   **Source**: `backend/main.py` (API) & `backend/bridge.py` (Internal)
*   **Usage**:
    *   **Data Maintenance**: The `cleanup_old_data` routine queries timestamps to identify and delete obsolete records.
    *   **API**: Historical data endpoints (if implemented) verify specific machine history.

### Data Retention Policy
To prevent the SQLite file from growing indefinitely on constrained hosting environments (e.g., Render/Vercel):
*   **Strategy**: A scheduled background task runs every hour.
*   **Logic**: Deletes all records in `events` and `machine_states` where `timestamp < 30 days ago`.
*   **Implementation**: Located in `backend/bridge.py` -> `cleanup_old_data()`.
