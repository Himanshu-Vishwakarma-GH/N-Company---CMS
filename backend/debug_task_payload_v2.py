import asyncio
import httpx
import json

async def debug_payload():
    async with httpx.AsyncClient() as client:
        # 1. Login
        resp = await client.post(
            "http://127.0.0.1:8000/api/v1/login/access-token",
            data={"username": "HIMAN123", "password": "himanshu123"}
        )
        if resp.status_code != 200:
            print("Login failed:", resp.text)
            return
        
        token = resp.json()["access_token"]
        headers = {"Authorization": f"Bearer {token}"}

        # 2. Get Users to find a valid Employee ID
        users_resp = await client.get("http://127.0.0.1:8000/api/v1/users/", headers=headers)
        users = users_resp.json()
        # Find Rohit
        rohit = next((u for u in users if u["emp_id"] == "EMPID01"), None)
        if not rohit:
             print("Employee not found")
             return
        
        emp_id = rohit["id"]
        print(f"Targeting Employee ID: {emp_id}")

        # 3. Payload that mimics Frontend EXACTLY
        # Frontend sends: { title, description, priority, due_date: null, assigned_to_ids: [id] }
        payload = {
            "title": "Debug Payload Task Error",
            "description": "debug",
            "priority": "MEDIUM",
            "due_date": "", # TEST INVALID DATE
            "assigned_to_ids": [emp_id]
        }

        print("Sending Payload:", json.dumps(payload, indent=2))
        
        resp = await client.post(
            "http://127.0.0.1:8000/api/v1/tasks/",
            json=payload,
            headers=headers
        )
        
        print(f"Status: {resp.status_code}")
        print("Response Body:", resp.text)

if __name__ == "__main__":
    asyncio.run(debug_payload())
