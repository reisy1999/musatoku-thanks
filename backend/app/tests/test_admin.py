from fastapi.testclient import TestClient
from ..main import app
from ..database import SessionLocal
from .. import crud, schemas, models
import uuid


def _get_admin_token(client: TestClient) -> str:
    resp = client.post("/token", data={"username": "999999", "password": "admin"})
    assert resp.status_code == 200
    return resp.json()["access_token"]


def test_admin_delete_user():
    with TestClient(app) as client:
        token = _get_admin_token(client)
        db = SessionLocal()
        unique_emp_id = "deluser" + str(uuid.uuid4())[:8]
        new_user = crud.create_user(
            db,
            schemas.UserCreate(
                employee_id=unique_emp_id,
                name="Delete User",
                password="pass",
                department_id=2,
            ),
        )
        db.close()

        resp = client.delete(f"/admin/users/{new_user.id}", headers={"Authorization": f"Bearer {token}"})
        assert resp.status_code == 204

        db = SessionLocal()
        user = db.query(models.User).get(new_user.id)
        assert user.is_active is False
        db.close()


def test_admin_list_and_delete_posts():
    with TestClient(app) as client:
        token = _get_admin_token(client)
        db = SessionLocal()
        user = crud.get_user_by_employee_id(db, "000000")
        p1 = crud.create_post(db, schemas.PostCreate(content="admin post 1"), user.id)
        p2 = crud.create_post(db, schemas.PostCreate(content="admin post 2"), user.id)
        p1_id = p1.id
        db.close()

        resp = client.get("/admin/posts", headers={"Authorization": f"Bearer {token}"})
        assert resp.status_code == 200
        posts = resp.json()
        assert posts[0]["created_at"] >= posts[1]["created_at"]

        del_resp = client.delete(f"/admin/posts/{p1_id}", headers={"Authorization": f"Bearer {token}"})
        assert del_resp.status_code == 204

        db = SessionLocal()
        assert db.query(models.Post).get(p1_id) is None
        db.close()
