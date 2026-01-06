import asyncio
import httpx

async def debug_task():
    async with httpx.AsyncClient() as client:
        # 1. Login
        resp = await client.post(
            "http://127.0.0.1:8000/api/v1/login/access-token",
            data={"username": "niranjan123", "password": "himanshu123"}
        )
        if resp.status_code != 200:
            print("Login failed:", resp.text)
            return
        
        token = resp.json()["access_token"]
        headers = {"Authorization": f"Bearer {token}"}

        # 2. Try Create Task
        # Simulating the payload from frontend
        payload = {
            "title": "Debug Task",
            "description": "Testing validation",
            "priority": "MEDIUM",
            "due_date": None, # Simulating sanitized empty date
            "assigned_to_ids": [1] # Assuming user ID 1 exists (Admin), or I'll pick another if needed. User 1 is admin.
        }

        print("Sending payload:", payload)
        resp = await client.post(
            "http://127.0.0.1:8000/api/v1/tasks/",
            json=payload,
            headers=headers
        )
        
        print(f"Status: {resp.status_code}")
        print("Response:", resp.text)

if __name__ == "__main__":
    asyncio.run(debug_task())
