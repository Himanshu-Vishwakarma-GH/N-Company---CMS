import pytest
from httpx import AsyncClient

@pytest.mark.asyncio
async def test_root(client: AsyncClient):
    response = await client.get("/")
    assert response.status_code == 200
    assert response.json() == {"message": "Agency Operations CMS API"}

@pytest.mark.asyncio
async def test_login(client: AsyncClient, create_test_data):
    # Test Admin Login
    response = await client.post(
        "/api/v1/login/access-token",
        data={"username": "ADMIN001", "password": "password"}
    )
    assert response.status_code == 200
    assert "access_token" in response.json()

@pytest.mark.asyncio
async def test_create_user(client: AsyncClient, create_test_data):
    # Login as Manager
    login_res = await client.post(
        "/api/v1/login/access-token",
        data={"username": "MGR001", "password": "password"}
    )
    token = login_res.json()["access_token"]
    headers = {"Authorization": f"Bearer {token}"}

    # Create Employee
    response = await client.post(
        "/api/v1/users/",
        headers=headers,
        json={
            "emp_id": "EMP_NEW",
            "password": "password",
            "full_name": "New Employee",
            "role": "EMPLOYEE",
            "venture_id": 1
        }
    )
    assert response.status_code == 200
    assert response.json()["emp_id"] == "EMP_NEW"

@pytest.mark.asyncio
async def test_create_task(client: AsyncClient, create_test_data):
    # Login as Manager
    login_res = await client.post(
        "/api/v1/login/access-token",
        data={"username": "MGR001", "password": "password"}
    )
    token = login_res.json()["access_token"]
    headers = {"Authorization": f"Bearer {token}"}
    
    # Get Employee ID (EMP001 is created in fixture, but we need its ID)
    # Actually create_test_data returns objects, but they might be detached.
    # We can fetch users list
    users_res = await client.get("/api/v1/users/", headers=headers)
    users = users_res.json()
    emp = next(u for u in users if u["emp_id"] == "EMP001")

    # Create Task
    response = await client.post(
        "/api/v1/tasks/",
        headers=headers,
        json={
            "title": "New Task",
            "description": "Do something",
            "assigned_to_id": emp["id"],
            "priority": "HIGH"
        }
    )
    assert response.status_code == 200
    assert response.json()["title"] == "New Task"
    assert response.json()["status"] == "ASSIGNED"

@pytest.mark.asyncio
async def test_employee_task_view(client: AsyncClient, create_test_data):
    # Login as Employee
    login_res = await client.post(
        "/api/v1/login/access-token",
        data={"username": "EMP001", "password": "password"}
    )
    token = login_res.json()["access_token"]
    headers = {"Authorization": f"Bearer {token}"}
    
    # Should see tasks (empty initially unless we create one)
    response = await client.get("/api/v1/tasks/", headers=headers)
    assert response.status_code == 200
    assert isinstance(response.json(), list)

@pytest.mark.asyncio
async def test_announcements(client: AsyncClient, create_test_data):
    # Login as Admin
    login_res = await client.post(
        "/api/v1/login/access-token",
        data={"username": "ADMIN001", "password": "password"}
    )
    token = login_res.json()["access_token"]
    headers = {"Authorization": f"Bearer {token}"}

    # Create Announcement
    response = await client.post(
        "/api/v1/announcements/",
        headers=headers,
        json={
            "title": "Big News",
            "content": "We turn profitable!"
        }
    )
    assert response.status_code == 200
    ann_id = response.json()["id"]

    # Login as Employee and Acknowledge
    emp_login = await client.post(
        "/api/v1/login/access-token",
        data={"username": "EMP001", "password": "password"}
    )
    emp_token = emp_login.json()["access_token"]
    emp_headers = {"Authorization": f"Bearer {emp_token}"}
    
    ack_res = await client.post(
        f"/api/v1/announcements/{ann_id}/acknowledge",
        headers=emp_headers
    )
    assert ack_res.status_code == 200
    assert ack_res.json()["user_id"] is not None
