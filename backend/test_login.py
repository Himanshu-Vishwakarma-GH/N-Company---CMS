import httpx
import asyncio

async def test_login():
    url = "http://localhost:8000/api/v1/login/access-token"
    # The API expects form-data for OAuth2
    payload = {
        "username": "niranjan123",
        "password": "himanshu123"
    }
    
    print(f"Attempting login to {url} with {payload['username']}...")
    try:
        async with httpx.AsyncClient() as client:
            response = await client.post(url, data=payload)
            print(f"Status Code: {response.status_code}")
            print(f"Response: {response.text}")
            
            if response.status_code == 200:
                print("✅ Login Successful!")
            else:
                print("❌ Login Failed.")
    except Exception as e:
        print(f"❌ Connection Error: {e}")

if __name__ == "__main__":
    asyncio.run(test_login())
