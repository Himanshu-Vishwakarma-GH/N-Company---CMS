import requests
import time

BASE_URL = "http://localhost:8000/api/v1"

def login(username, password):
    res = requests.post(f"{BASE_URL}/login/access-token", data={"username": username, "password": password})
    if res.status_code == 200:
        return res.json()["access_token"]
    print(f"Login Failed [{username}]: {res.text}")
    return None

def verify():
    print("--- Verifying Announcement Acks ---")
    
    # 1. Login as Admin to Create
    admin_token = login("niranjan123", "himanshu123")
    if not admin_token: return
    headers_admin = {"Authorization": f"Bearer {admin_token}"}

    # 2. Login as Employee to Acknowledge
    # Using HIMAN123 (Manager) as employee context or any other user
    emp_token = login("HIMAN123", "himanshu123") 
    if not emp_token: return
    headers_emp = {"Authorization": f"Bearer {emp_token}"}

    # 3. Create Announcement
    payload = {
        "title": f"Ack Test {time.time()}",
        "content": "Please acknowledge this."
    }
    res = requests.post(f"{BASE_URL}/announcements/", json=payload, headers=headers_admin)
    if res.status_code != 200:
        print(f"Create Failed: {res.text}")
        return
    ann_id = res.json()["id"]
    print(f"Announcement Created: {ann_id}")

    # 4. Acknowledge as Employee
    print("Acknowledging...")
    res = requests.post(f"{BASE_URL}/announcements/{ann_id}/acknowledge", headers=headers_emp)
    if res.status_code != 200:
        print(f"Ack Failed: {res.text}")
        return
    print("Acknowledged.")

    # 5. Verify Admin sees the Ack with User Name
    print("Fetching List as Admin...")
    res = requests.get(f"{BASE_URL}/announcements/", headers=headers_admin)
    data = res.json()
    
    target = next((a for a in data if a["id"] == ann_id), None)
    if not target:
        print("Announcement not found in list")
        return

    acks = target.get("acks", [])
    print(f"Acks Count: {len(acks)}")
    
    if not acks:
        print("FAILURE: No acks found but one was just created.")
        return

    first_ack = acks[0]
    user = first_ack.get("user")
    if not user:
        print("FAILURE: Ack found but 'user' field is missing/null.")
        print(f"Ack Data: {first_ack}")
    else:
        print(f"SUCCESS: Read Receipt found for User: {user.get('full_name')} ({user.get('emp_id')})")

if __name__ == "__main__":
    verify()
