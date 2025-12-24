# 🏭 AI-Driven Smart Factory Monitor
### Next-Gen Manufacturing Digital Twin & Autonomy System

![License](https://img.shields.io/badge/license-MIT-blue.svg) ![Status](https://img.shields.io/badge/status-Live-green)

## 📖 Introduction
This platform is a cloud-native **Digital Twin Simulation & Monitoring System** designed to demonstrate the future of autonomous manufacturing. By integrating **Real-time Simulation**, **IoT Data Streaming**, and **Generative AI (Google Gemini)**, it creates a self-optimizing factory environment.

Unlike traditional dashboards that only *show* data, this system **understands** it. The embedded AI Copilot actively monitors efficiency, detects anomalies pattern, and allows natural language control of the entire production floor.

---

## 🚀 Key Features

### 🧠 AI Copilot (Google Gemini Powered)
- **Natural Language Control**: Command your factory simply by typing "Increase speed on Line A" or "Stop all cutters".
- **Anomaly Analysis**: Automatically detects sensor outliers and provides root cause analysis + action plans.
- **Autonomous Optimization**: The system proactively balances load between machines to maximize profit and minimize wear.

### ⚡ Real-Time Digital Twin
- **Live Simulation**: Simulates a complete production lifecycle including Raw Material -> Cutter -> Conveyor -> Robot Arm -> Quality Inspection -> Packing.
- **Dynamic Physics**: Machines have realistic properties like temperature, vibration (wear), and efficiency curves.
- **Visual Dashboard**: View live status, KPIs (OEE, Defect Rate, Energy Cost), and active alerts instantly.

### 🌐 Cloud-Native Architecture
- **Distributed Design**: Separated Simulation, Backend Bridge, and Frontend UI services.
- **Data Retention**: Automatic 30-day rolling window for historical data analysis.
- **Scalable**: Built on event-driven WebSocket architecture.

---

## 🛠️ Technology Stack

| Component | Technology | Description |
|-----------|------------|-------------|
| **Frontend** | Next.js, React, TailwindCSS | High-performance reactive dashboard |
| **Backend** | Python, FastAPI | RESTful API & WebSocket Bridge |
| **Simulation** | Python (AsyncIO) | Real-time physics engine & data generator |
| **AI Core** | Google Gemini Pro | Cognitive reasoning & command parsing |
| **Database** | SQLite / Postgres | Metric persistence & event logging |

---

## 🌍 Live Demo
*The system is currently deployed and accessible via:*
- **Dashboard**: [Link to Vercel Deployment]
- **API Docs**: [Link to Render Backend]/docs

*(Note: If running locally, please see the Developer Guide below)*

---

## 👨‍💻 Developer Guide (Local Setup)

If you wish to run the simulation locally:
1. **Clone the Repo**
2. **Setup Environment**:
   - Create `.env` in backend with `GOOGLE_API_KEY`.
3. **Run Services**:
   ```bash
   # Terminal 1: Simulation
   python -m simulation.main
   
   # Terminal 2: Backend
   uvicorn backend.main:app --reload
   
   # Terminal 3: Frontend
   cd frontend && npm run dev
   ```
