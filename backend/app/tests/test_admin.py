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
                display_name="Delete User",
                password="pass",
                department_id=2,
            ),
        )
        db.close()

        resp = client.delete(
            f"/admin/users/{new_user.id}", headers={"Authorization": f"Bearer {token}"}
        )
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

        del_resp = client.delete(
            f"/admin/posts/{p1_id}", headers={"Authorization": f"Bearer {token}"}
        )
        assert del_resp.status_code == 204

        db = SessionLocal()
        assert db.query(models.Post).get(p1_id) is None
        db.close()


def test_admin_list_departments():
    with TestClient(app) as client:
        token = _get_admin_token(client)

        resp = client.get(
            "/admin/departments", headers={"Authorization": f"Bearer {token}"}
        )
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


def test_import_users():
    with TestClient(app) as client:
        token = _get_admin_token(client)
        unique_id = "imp" + str(uuid.uuid4())[:8]
        csv_data = (
            "user_id,name,display_name,department,email\n"
            f"{unique_id},kana1,Import User,ImportedDept,imp1@example.com\n"
            "000000,Existing,Existing,ImportedDept,existing@example.com\n"
            ",Missing,,ImportedDept,missing@example.com\n"
        )
        files = {"file": ("users.csv", csv_data, "text/csv")}
        resp = client.post(
            "/admin/users/import",
            files=files,
            headers={"Authorization": f"Bearer {token}"},
        )
        assert resp.status_code == 200
        result = resp.json()
        assert result["added"] == 1
        assert result["skipped"] == 2

        db = SessionLocal()
        created = crud.get_user_by_employee_id(db, unique_id)
        assert created is not None
        assert created.display_name == "Import User"
        assert created.department.name == "ImportedDept"
        db.close()


def test_import_users_invalid_encoding():
    """Import should fail for non UTF-8 encoded files"""
    with TestClient(app) as client:
        token = _get_admin_token(client)
        csv_data = (
            "user_id,name,display_name,department,email\n"
            "e001,\u30c6\u30b9\u30c8,Test,General,test@example.com\n"
        )
        encoded = csv_data.encode("shift_jis")
        files = {"file": ("users.csv", encoded, "text/csv")}
        resp = client.post(
            "/admin/users/import",
            files=files,
            headers={"Authorization": f"Bearer {token}"},
        )
        assert resp.status_code == 400
        assert "UTF-8" in resp.json().get("detail", "")


def test_export_users():
    with TestClient(app) as client:
        token = _get_admin_token(client)

        resp = client.get(
            "/admin/users/export", headers={"Authorization": f"Bearer {token}"}
        )
        assert resp.status_code == 200
        assert resp.headers["content-type"].startswith("text/csv")
        assert "charset=utf-8" in resp.headers["content-type"].lower()
        csv_lines = resp.text.strip().splitlines()
        assert csv_lines[0] == "id,employee_id,display_name,kana_name,department_name,is_admin,is_active"

        db = SessionLocal()
        user = crud.get_user_by_employee_id(db, "000000")
        db.close()
        # ensure the CSV contains the default user
        assert any(str(user.id) in line and user.employee_id in line for line in csv_lines[1:])


def test_admin_list_users_logged_in_naive_timestamp():
    """Users endpoint should handle naive last_seen timestamps"""
    with TestClient(app) as client:
        token = _get_admin_token(client)
        db = SessionLocal()
        unique_emp_id = "naive" + str(uuid.uuid4())[:8]
        new_user = crud.create_user(
            db,
            schemas.UserCreate(
                employee_id=unique_emp_id,
                name="Naive",
                display_name="Naive",
                password="pass",
                department_id=2,
            ),
        )
        # set last_seen without tzinfo
        from datetime import datetime, timedelta

        user_id = new_user.id
        user = db.query(models.User).get(user_id)
        user.last_seen = datetime.utcnow() - timedelta(minutes=1)
        db.add(user)
        db.commit()
        db.close()

        resp = client.get("/admin/users", headers={"Authorization": f"Bearer {token}"})
        assert resp.status_code == 200
        users = resp.json()
        assert any(u["id"] == user_id and u["is_logged_in"] for u in users)
