import asyncio
import httpx
import time
from datetime import datetime

async def inject_data():
    print("⏳ Waiting 15s allowing browser to login...")
    await asyncio.sleep(15)
    
    async with httpx.AsyncClient() as client:
        # 1. Login as Admin/Manager
        resp = await client.post(
            "http://127.0.0.1:8000/api/v1/login/access-token",
            data={"username": "niranjan123", "password": "himanshu123"}
        )
        token = resp.json()["access_token"]
        headers = {"Authorization": f"Bearer {token}"}
        
        # 2. Get Employee ID (EMPID01) to assign task
        # We know EMPID01 exists from previous steps. We need its numeric ID.
        # Assuming ID 3 based on debug logs. Or I can fetch it.
        users_resp = await client.get("http://127.0.0.1:8000/api/v1/users/", headers=headers)
        users = users_resp.json()
        target_uid = next((u["id"] for u in users if u["emp_id"] == "EMPID01"), None)
        
        if not target_uid:
            print("❌ Target employee EMPID01 not found.")
            return

        print(f"✅ Found Employee ID: {target_uid}")

        # 3. Create Task
        print("Creating Task...")
        task_payload = {
            "title": "Realtime Browser Test Task",
            "description": "This task should appear automatically.",
            "priority": "HIGH",
            "due_date": None,
            "assigned_to_ids": [target_uid]
        }
        await client.post("http://127.0.0.1:8000/api/v1/tasks/", json=task_payload, headers=headers)
        print("✅ Task Created.")

        # 4. Create Announcement
        print("Creating Announcement...")
        ann_payload = {
            "title": "Realtime Browser Test Announcement",
            "content": "This announcement should appear automatically.",
            "is_public": True
        }
        await client.post("http://127.0.0.1:8000/api/v1/announcements/", json=ann_payload, headers=headers)
        print("✅ Announcement Created.")

if __name__ == "__main__":
    asyncio.run(inject_data())
