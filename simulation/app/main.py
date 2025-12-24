import asyncio
import json
import websockets
import time
import logging
import os
from .factory import Factory
from .config import UPDATE_INTERVAL
from fastapi import FastAPI
import uvicorn

# Configure logging
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

connected_clients = set()

async def register(websocket):
    connected_clients.add(websocket)
    logger.info(f"Client connected. Total clients: {len(connected_clients)}")
    try:
        async for message in websocket:
            try:
                data = json.loads(message)
                if data.get("action") == "control":
                    machine_id = data.get("machine_id")
                    command = data.get("command")
                    logger.info(f"Received control command: {command} for {machine_id}")
                    # We need access to the factory instance. 
                    # Since factory is created in run_simulation, we need a way to access it.
                    # Let's make factory global or pass it around.
                    # For simplicity, we'll use a global variable or singleton pattern here.
                    if global_factory:
                        global_factory.control_machine(machine_id, command)
            except Exception as e:
                logger.error(f"Error processing message: {e}")
    finally:
        connected_clients.remove(websocket)
        logger.info(f"Client disconnected. Total clients: {len(connected_clients)}")

async def broadcast(data):
    if not connected_clients:
        return
    message = json.dumps(data)
    # Create a list of tasks to send messages to all clients
    tasks = [asyncio.create_task(client.send(message)) for client in connected_clients]
    # Wait for all tasks to complete, ignoring errors
    await asyncio.gather(*tasks, return_exceptions=True)

global_factory = None

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

app = FastAPI()
@app.get("/")
def health_check():
    return {"status": "ok"}

async def main():
    # Start WebSocket server
    port = int(os.environ.get("PORT", 8765))
    server = await websockets.serve(register, "0.0.0.0", port)
    logger.info(f"WebSocket server listening on ws://0.0.0.0:{port}")
    
    # Run simulation loop
    await run_simulation()

if __name__ == "__main__":
    try:
        asyncio.run(main())
    except KeyboardInterrupt:
        logger.info("Simulation stopped by user")
