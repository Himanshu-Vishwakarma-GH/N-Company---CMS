import requests
import time

BASE_URL = "http://localhost:8000/api/v1"

def login(email, password):
    response = requests.post(f"{BASE_URL}/login/access-token", data={"username": email, "password": password})
    if response.status_code == 200:
        return response.json()["access_token"]
    print(f"Login Failed: {response.text}")
    return None

def verify_timer():
    print("--- Verifying Timer Logic ---")
    
    # 1. Login as Admin/Manager
    # niranjan123 is the default admin created in initial_data.py
    token = login("niranjan123", "himanshu123")
    if not token:
        return

    headers = {"Authorization": f"Bearer {token}"}

    # 2. Create Task
    task_payload = {
        "title": "Timer Test Task",
        "priority": "MEDIUM",
        "assigned_to_ids": [] # Self assign or create unassigned
    }
    
    res = requests.post(f"{BASE_URL}/tasks/", json=task_payload, headers=headers)
    if res.status_code != 200:
        print(f"Task Creation Failed: {res.text}")
        return
    
    tasks = res.json()
    task_id = tasks[0]["id"]
    print(f"Task Created: {task_id}")

    # 3. Start Timer
    print("Starting Timer...")
    res = requests.post(f"{BASE_URL}/tasks/{task_id}/timer/start", headers=headers)
    if res.status_code != 200:
        print(f"Start Timer Failed: {res.text}")
        return
    
    task_data = res.json()
    if not task_data.get("active_timer_start"):
        print("ERROR: active_timer_start is null")
        return
    print(f"Timer Started at: {task_data['active_timer_start']}")

    # 4. Wait
    time.sleep(2)

    # 5. Stop Timer
    print("Stopping Timer...")
    res = requests.post(f"{BASE_URL}/tasks/{task_id}/timer/stop", headers=headers)
    if res.status_code != 200:
        print(f"Stop Timer Failed: {res.text}")
        return
    
    task_data = res.json()
    if task_data.get("active_timer_start") is not None:
        print("ERROR: active_timer_start IS NOT null after stop")
        return
    
    # Check TimeLogs
    # Need to fetch task again with full details? The response should contain time_logs if I updated schema correctly?
    # Schema 'Task' has time_logs: List[TimeLog].
    
    print("Verifying Logs...")
    logs = task_data.get("time_logs", [])
    if not logs:
        print("ERROR: No time_logs returned in task response")
        # Try fetching task explicitly
        res = requests.get(f"{BASE_URL}/tasks/", headers=headers)
        # Find task
        found = False
        for t in res.json():
            if t['id'] == task_id:
                print(f"Log Count: {len(t.get('time_logs', []))}")
                found = True
                break
        if not found:
            print("Task not found in list")
    else:
        print(f"Log Count: {len(logs)}")
        print(f"Last Log Duration: {logs[-1]['duration_minutes']} min (approx)")

    print("--- Timer Verification SUCCESS ---")

if __name__ == "__main__":
    verify_timer()
