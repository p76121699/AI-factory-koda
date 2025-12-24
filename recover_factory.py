import requests
import time

API_URL = "http://127.0.0.1:8000/api/v1/machines"

def reset_machine(machine_id):
    url = f"{API_URL}/{machine_id}/control"
    try:
        response = requests.post(url, json={"command": "reset"})
        if response.status_code == 200:
            print(f"[SUCCESS] Machine {machine_id}: {response.json()}")
        else:
            print(f"[ERROR] Machine {machine_id}: {response.text}")
    except Exception as e:
        print(f"[FAIL] Machine {machine_id}: {e}")

if __name__ == "__main__":
    print("Starting Factory Recovery...")
    ids = ["01", "02", "03", "04", "05"]
    for mid in ids:
        reset_machine(mid)
        time.sleep(0.5)
    print("Recovery Commands Sent.")
