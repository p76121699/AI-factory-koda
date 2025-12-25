import asyncio
import json
import websockets
import time
import logging
import os
from contextlib import asynccontextmanager
from fastapi import FastAPI, WebSocket, WebSocketDisconnect
from .factory import Factory
from .config import UPDATE_INTERVAL

# Configure logging
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

# Global Factory Instance
global_factory = None
connected_clients = set()

async def broadcast(data):
    if not connected_clients:
        return
    message = json.dumps(data)
    # Create a list of tasks to send messages to all clients
    tasks = [asyncio.create_task(client.send_text(message)) for client in connected_clients]
    # Wait for all tasks to complete, ignoring errors
    await asyncio.gather(*tasks, return_exceptions=True)

async def run_simulation():
    global global_factory
    global_factory = Factory()
    factory = global_factory
    logger.info("Simulation Engine Started")
    
    while True:
        start_time = time.time()
        
        # Update factory state
        factory.update(UPDATE_INTERVAL)
        
        # Prepare data
        data = factory.to_dict()
        data["timestamp"] = time.time()
        
        # Broadcast data
        await broadcast(data)
        
        # Wait for next tick
        elapsed = time.time() - start_time
        sleep_time = max(0, UPDATE_INTERVAL - elapsed)
        await asyncio.sleep(sleep_time)

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup: Start simulation loop
    task = asyncio.create_task(run_simulation())
    yield
    # Shutdown: Clean up (if needed)
    task.cancel()
    logger.info("Simulation Engine Stopped")

app = FastAPI(lifespan=lifespan)

@app.get("/")
def health_check():
    return {"status": "ok"}

@app.websocket("/")
async def websocket_endpoint(websocket: WebSocket):
    await websocket.accept()
    connected_clients.add(websocket)
    logger.info(f"Client connected. Total clients: {len(connected_clients)}")
    try:
        while True:
            message = await websocket.receive_text()
            try:
                data = json.loads(message)
                if data.get("action") == "control":
                    machine_id = data.get("machine_id")
                    command = data.get("command")
                    logger.info(f"Received control command: {command} for {machine_id}")
                    
                    if global_factory:
                        global_factory.control_machine(machine_id, command)
            except Exception as e:
                logger.error(f"Error processing message: {e}")
    except WebSocketDisconnect:
        connected_clients.remove(websocket)
        logger.info(f"Client disconnected. Total clients: {len(connected_clients)}")
    except Exception as e:
        logger.error(f"WebSocket Connection Error: {e}")
        if websocket in connected_clients:
            connected_clients.remove(websocket)

if __name__ == "__main__":
    import uvicorn
    port = int(os.environ.get("PORT", 8765))
    uvicorn.run("simulation.app.main:app", host="0.0.0.0", port=port, reload=True)
