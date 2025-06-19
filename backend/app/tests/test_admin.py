from fastapi.testclient import TestClient
from ..main import app
from ..database import SessionLocal
from .. import crud, schemas, models
import jaconv
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
        user_id = user.id
        user_name = user.name
        dept_id = user.department_id
        dept_name = user.department.name if user.department else None
        p1 = crud.create_post(
            db,
            schemas.PostCreate(
                content="admin post 1",
                mention_user_ids=[user_id],
                mention_department_ids=[user.department_id],
            ),
            user_id,
        )
        p2 = crud.create_post(
            db,
            schemas.PostCreate(
                content="admin post 2",
                mention_user_ids=[user_id],
                mention_department_ids=[user.department_id],
            ),
            user_id,
        )
        p1_id = p1.id
        db.close()

        resp = client.get("/admin/posts", headers={"Authorization": f"Bearer {token}"})
        assert resp.status_code == 200
        posts = resp.json()
        assert posts[0]["created_at"] >= posts[1]["created_at"]
        assert posts[0]["author_name"] == user_name
        assert user_id in posts[0]["mention_user_ids"]
        assert dept_id in posts[0]["mention_department_ids"]
        assert user_name in posts[0]["mention_user_names"]
        assert posts[0]["mention_department_names"] == [
            jaconv.z2h(dept_name, kana=True, ascii=False, digit=False)
        ]

        del_resp = client.delete(f"/admin/posts/{p1_id}", headers={"Authorization": f"Bearer {token}"})
        assert del_resp.status_code == 204

        db = SessionLocal()
        assert db.query(models.Post).get(p1_id) is None
        db.close()


def test_admin_list_departments():
    with TestClient(app) as client:
        token = _get_admin_token(client)

        resp = client.get("/admin/departments", headers={"Authorization": f"Bearer {token}"})
        assert resp.status_code == 200
        depts = resp.json()
        expected = jaconv.z2h("テスト部署", kana=True, ascii=False, digit=False)
        assert any(d["name"] == expected for d in depts)


def test_delete_department_with_refs():
    with TestClient(app) as client:
        token = _get_admin_token(client)
        resp = client.delete(
            "/admin/departments/2",
            headers={"Authorization": f"Bearer {token}"},
        )
        assert resp.status_code == 400

