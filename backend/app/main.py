import asyncio
from fastapi import FastAPI, WebSocket, WebSocketDisconnect
from contextlib import asynccontextmanager
from .database import init_db
from .bridge import DataBridge
import logging
import json
from dotenv import load_dotenv
import os
import os
from pathlib import Path
import re # [NEW] Regex for parsing AI commands

# Load environment variables from backend/.env
# Load environment variables from backend/.env
env_path = Path(__file__).parent.parent / ".env"
load_dotenv(dotenv_path=env_path)

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Global DataBridge instance
data_bridge = DataBridge()

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup
    await init_db()
    bridge_task = asyncio.create_task(data_bridge.connect())
    push_task = asyncio.create_task(push_to_frontend())
    yield
    # Shutdown
    data_bridge.stop()
    await bridge_task
    push_task.cancel()

from fastapi.middleware.cors import CORSMiddleware

app = FastAPI(title="Smart Factory Monitor", lifespan=lifespan)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # In production, replace with specific origins
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/")
async def root():
    return {"message": "Smart Factory Backend is running"}

@app.api_route("/health", methods=["GET", "HEAD"])
async def health_check():
    return {"status": "ok", "bridge_connected": data_bridge.running}

@app.post("/api/reset")
async def factory_reset():
    """Trigger full factory reset"""
    result = await data_bridge.reset_data()
    if result:
        return {"status": "Reset Successful"}
    return {"status": "Error", "message": "Reset failed"}, 500

@app.post("/api/orders/prune")
async def prune_orders():
    """Manually trigger order cleanup"""
    await data_bridge.send_command({"machine_id": "SYSTEM", "command": "prune_orders"})
    return {"status": "Orders Pruned"}

@app.get("/api/v1/latest")
async def get_latest_data():
    return data_bridge.get_latest_data()

# WebSocket for Frontend
class ConnectionManager:
    def __init__(self):
        self.active_connections: list[WebSocket] = []

    async def connect(self, websocket: WebSocket):
        await websocket.accept()
        self.active_connections.append(websocket)

    def disconnect(self, websocket: WebSocket):
        self.active_connections.remove(websocket)

    async def broadcast(self, message: str):
        for connection in self.active_connections:
            try:
                await connection.send_text(message)
            except Exception as e:
                logger.error(f"Error broadcasting to client: {e}")

manager = ConnectionManager()

@app.websocket("/ws/realtime")
async def websocket_endpoint(websocket: WebSocket):
    await manager.connect(websocket)
    logger.info("Frontend connected to WebSocket")
    try:
        while True:
            # Keep connection alive
            data = await websocket.receive_text()
    except WebSocketDisconnect:
        manager.disconnect(websocket)
        logger.info("Frontend disconnected")
    except Exception as e:
        logger.error(f"WebSocket error: {e}")
        manager.disconnect(websocket)

# Background task to push data to frontend
async def push_to_frontend():
    logger.info("Push task started")
    while True:
        try:
            if data_bridge.latest_data:
                await manager.broadcast(json.dumps(data_bridge.latest_data))
            else:
                pass
        except Exception as e:
            logger.error(f"Push task error: {e}")
        
        await asyncio.sleep(0.5) # Update frontend every 500ms

# AI Module
from .ai import AICollaborator
from pydantic import BaseModel

ai_agent = AICollaborator()

class ChatRequest(BaseModel):
    message: str
    context: dict = {}

@app.post("/api/v1/chat")
async def chat_endpoint(request: ChatRequest):
    # Inject latest factory data into context if not provided
    if not request.context:
        request.context = data_bridge.get_latest_data()
    
    response = await ai_agent.chat(request.message, request.context)
    
    # [NEW] Parse and Execute Commands
    # Pattern: [[EXECUTE:command|machine_id]]
    # [NEW] Parse and Execute Commands (Multi-Command Support)
    # Pattern: [[EXECUTE:command|machine_id]]
    # Loop to find and execute ALL commands in the response
    while True:
        match = re.search(r"\[\[EXECUTE:(.*?)\|(.*?)\]\]", response)
        if not match:
            break
            
        command = match.group(1).lower()
        machine_id = match.group(2).strip()
        logger.info(f"AI Triggered Command: {command} on {machine_id}")
        
        # Execute via Bridge
        success = await data_bridge.send_command({
            "action": "control",
            "machine_id": machine_id,
            "command": command
        })
        
        # Replace the tag with a status message so we don't match it again
        status_msg = f" (Executing {command}...)" if success else " (Command Failed)"
        response = response.replace(match.group(0), status_msg)
              
    return {"response": response}

class ControlRequest(BaseModel):
    command: str # start, stop, reset

@app.post("/api/v1/machines/{machine_id}/control")
async def control_machine(machine_id: str, request: ControlRequest):
    command_data = {
        "action": "control",
        "machine_id": machine_id,
        "command": request.command
    }
    success = await data_bridge.send_command(command_data)
    if success:
        return {"status": "success", "message": f"Command {request.command} sent to {machine_id}"}
    else:
        return {"status": "error", "message": "Failed to send command (Simulation disconnected?)"}

# Add push task to startup

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("backend.main:app", host="127.0.0.1", port=8000, reload=True)
