from fastapi.testclient import TestClient

from tests.conftest import register_and_login


def test_register_login_and_get_current_user(client: TestClient):
    token = register_and_login(client)
    response = client.get("/auth/me", headers={"Authorization": f"Bearer {token}"})
    assert response.status_code == 200
    assert response.json()["username"] == "testuser"
    assert response.json()["email"] == "testuser@example.com"


def test_product_creation_requires_authentication(client: TestClient):
    response = client.post("/products", json={
        "name": "Test Product", "price": 100, "description": "Testing auth",
        "quantity": 1, "category_id": 1,
    })
    assert response.status_code == 401


def test_product_creation_rejects_invalid_token(client: TestClient):
    response = client.post(
        "/products",
        headers={"Authorization": "Bearer invalid-token"},
        json={"name": "Test Product", "price": 100, "description": "Testing auth", "quantity": 1, "category_id": 1},
    )
    assert response.status_code == 401


def test_registration_rejects_short_password(client: TestClient):
    response = client.post("/auth/register", json={
        "username": "newuser", "email": "newuser@example.com", "password": "short",
    })
    assert response.status_code == 422


def test_registration_rejects_invalid_email(client: TestClient):
    response = client.post("/auth/register", json={
        "username": "newuser", "email": "not-an-email", "password": "TestPassword123!",
    })
    assert response.status_code == 422


def test_duplicate_registration_returns_conflict(client: TestClient):
    register_and_login(client)
    response = client.post("/auth/register", json={
        "username": "testuser2", "email": "testuser@example.com", "password": "TestPassword123!",
    })
    assert response.status_code == 409


def test_login_rejects_wrong_password(client: TestClient):
    client.post("/auth/register", json={
        "username": "testuser", "email": "testuser@example.com", "password": "TestPassword123!",
    })
    response = client.post("/auth/login", json={"email": "testuser@example.com", "password": "WrongPassword123!"})
    assert response.status_code == 401


def test_me_requires_token(client: TestClient):
    assert client.get("/auth/me").status_code == 401
