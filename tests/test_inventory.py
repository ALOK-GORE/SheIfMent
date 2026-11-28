from fastapi.testclient import TestClient

from tests.conftest import register_and_login


def setup_inventory(client: TestClient):
    token = register_and_login(client)
    headers = {"Authorization": f"Bearer {token}"}
    category = client.post("/categories", headers=headers, json={"name": "Electronics"})
    assert category.status_code == 201, category.text
    return headers, category.json()["id"]


def test_product_crud_and_pagination(client: TestClient):
    headers, category_id = setup_inventory(client)
    product = client.post("/products", headers=headers, json={
        "name": "Keyboard", "description": "Mechanical keyboard", "price": 120,
        "quantity": 5, "category_id": category_id,
    })
    assert product.status_code == 201, product.text
    product_id = product.json()["id"]
    assert product.json()["category"]["name"] == "Electronics"

    listing = client.get(f"/products?skip=0&limit=10&category_id={category_id}&max_price=200")
    assert listing.status_code == 200
    assert len(listing.json()) == 1

    updated = client.put(f"/products/{product_id}", headers=headers, json={
        "name": "Keyboard Pro", "description": "Updated keyboard", "price": 150,
        "quantity": 3, "category_id": category_id,
    })
    assert updated.status_code == 200, updated.text
    assert updated.json()["name"] == "Keyboard Pro"

    deleted = client.delete(f"/products/{product_id}", headers=headers)
    assert deleted.status_code == 204
    assert client.get(f"/products/{product_id}").status_code == 404


def test_missing_product_and_category_return_404(client: TestClient):
    assert client.get("/products/999").status_code == 404
    assert client.get("/categories/999").status_code == 404


def test_tag_can_be_attached_to_product(client: TestClient):
    headers, category_id = setup_inventory(client)
    product = client.post("/products", headers=headers, json={
        "name": "Mouse", "description": "Wireless mouse", "price": 40,
        "quantity": 10, "category_id": category_id,
    })
    tag = client.post("/tags", headers=headers, json={"name": "Accessories"})
    assert tag.status_code == 201, tag.text
    response = client.post(f"/products/{product.json()['id']}/tags/{tag.json()['id']}", headers=headers)
    assert response.status_code == 200, response.text
    assert response.json()["tags"][0]["name"] == "Accessories"


def test_duplicate_category_returns_conflict(client: TestClient):
    headers, _ = setup_inventory(client)
    response = client.post("/categories", headers=headers, json={"name": "Electronics"})
    assert response.status_code == 409


def test_product_rejects_unknown_category(client: TestClient):
    headers, _ = setup_inventory(client)
    response = client.post("/products", headers=headers, json={
        "name": "Speaker", "description": "Bluetooth speaker", "price": 80,
        "quantity": 4, "category_id": 999,
    })
    assert response.status_code == 404


def test_category_cannot_be_deleted_while_products_use_it(client: TestClient):
    headers, category_id = setup_inventory(client)
    product = client.post("/products", headers=headers, json={
        "name": "Monitor", "description": "External monitor", "price": 220,
        "quantity": 2, "category_id": category_id,
    })
    assert product.status_code == 201
    response = client.delete(f"/categories/{category_id}", headers=headers)
    assert response.status_code == 409
