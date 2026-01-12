import asyncio
import websockets
import urllib.request
import sys

async def check_simulation():
    uri = "ws://127.0.0.1:8765"
    print(f"Checking Simulation ({uri})...", end=" ")
    try:
        async with websockets.connect(uri) as ws:
            print("OK")
            return True
    except Exception as e:
        print(f"FAILED: {e}")
        return False

async def check_backend_ws():
    uri = "ws://127.0.0.1:8000/ws/realtime"
    print(f"Checking Backend WS ({uri})...", end=" ")
    try:
        async with websockets.connect(uri) as ws:
            print("OK")
            return True
    except Exception as e:
        print(f"FAILED: {e}")
        return False

def check_backend_http():
    url = "http://127.0.0.1:8000/health"
    print(f"Checking Backend HTTP ({url})...", end=" ")
    try:
        with urllib.request.urlopen(url) as response:
            if response.status == 200:
                print("OK")
                return True
            else:
                print(f"FAILED (Status {response.status})")
                return False
    except Exception as e:
        print(f"FAILED: {e}")
        return False

async def run_diagnostics():
    results = []
    results.append(await check_simulation())
    results.append(check_backend_http())
    results.append(await check_backend_ws())
    
    if all(results):
        print("\nAll checks PASSED.")
    else:
        print("\nSome checks FAILED.")

if __name__ == "__main__":
    asyncio.run(run_diagnostics())
