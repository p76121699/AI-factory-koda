# Smart Factory Monitoring System - User Manual

## 1. Introduction
Welcome to the Smart Factory Monitoring System. This system provides real-time visibility into your factory's operations, including machine status, production metrics, and AI-powered insights.

## 2. Getting Started

### 2.1 System Requirements
- Modern Web Browser (Chrome, Firefox, Edge)
- Network connection to the Factory Server

### 2.2 Accessing the Dashboard
Open your web browser and navigate to: `http://localhost:3000`

## 3. Dashboard Features

### 3.1 Overview Panel
The main screen shows all production lines (Line A, B, C).
- **Green Indicator**: System Online & Connected.
- **Red Indicator**: Disconnected (Check backend server).

### 3.2 Machine Cards
Each machine is represented by a card showing:
- **Status**: RUNNING (Green), IDLE (Gray), ERROR (Red).
- **Metrics**: Real-time values for Temperature, Vibration, Speed, etc.
- **Alerts**: Values exceeding safety thresholds are highlighted in Red.

### 3.3 AI Copilot
Click the **Message Icon** (bottom right) to open the AI Assistant.
- **Ask Questions**: "How is Line A performing?", "Any anomalies?"
- **Context**: The AI automatically knows the current state of the factory.

## 4. Troubleshooting

### 4.1 "Loading Factory Data..." Stuck
- Ensure the Backend Server is running (`port 8000`).
- Ensure the Simulation is running (`port 8765`).
- Refresh the page.

### 4.2 AI Not Responding
- Check if the API Key is configured in the backend.
- Verify internet connection.

## 5. Support
For technical support, contact the IT Department or system administrator.
