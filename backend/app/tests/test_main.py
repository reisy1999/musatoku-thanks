from fastapi.testclient import TestClient
from ..main import app  # main.pyからFastAPIアプリをインポート
from ..database import SessionLocal
from .. import crud, schemas, models

def test_read_main():
    """
    FastAPIのドキュメントページ(/docs)が正常に表示されることをテストします。
    これが通れば、アプリが正常に起動している証拠になります。
    """
    with TestClient(app) as client:
        response = client.get("/docs")
        assert response.status_code == 200


def test_post_timestamp_timezone():
    """created_at field should include timezone info"""
    # obtain token for default user
    with TestClient(app) as client:
        token_resp = client.post(
            "/token",
            data={"username": "000000", "password": "pass"},
        )
        assert token_resp.status_code == 200
        token = token_resp.json()["access_token"]

        headers = {"Authorization": f"Bearer {token}"}
        post_resp = client.post(
            "/posts/",
            json={"content": "timezone test"},
            headers=headers,
        )
        assert post_resp.status_code == 201
        created_at = post_resp.json()["created_at"]

        assert created_at.endswith("Z") or "+" in created_at

        from datetime import datetime

        # ensure ISO 8601 can be parsed and includes tzinfo
        parsed = datetime.fromisoformat(created_at.replace("Z", "+00:00"))
        assert parsed.tzinfo is not None


def test_user_department_name():
    """/users/me should include the department name"""
    with TestClient(app) as client:
        token_resp = client.post(
            "/token",
            data={"username": "000000", "password": "pass"},
        )
        assert token_resp.status_code == 200
        token = token_resp.json()["access_token"]

        headers = {"Authorization": f"Bearer {token}"}
        user_resp = client.get("/users/me", headers=headers)
        assert user_resp.status_code == 200
        assert user_resp.json().get("department_name") == "テスト部署"


def test_post_mentions():
    """posts can mention users"""
    with TestClient(app) as client:
        # login
        token_resp = client.post(
            "/token",
            data={"username": "000000", "password": "pass"},
        )
        assert token_resp.status_code == 200
        token = token_resp.json()["access_token"]

        headers = {"Authorization": f"Bearer {token}"}

        # get current user id
        me_resp = client.get("/users/me", headers=headers)
        assert me_resp.status_code == 200
        user_id = me_resp.json()["id"]

        # create post mentioning the current user
        post_resp = client.post(
            "/posts/",
            json={"content": "hello", "mention_user_ids": [user_id]},
            headers=headers,
        )
        assert post_resp.status_code == 201
        assert user_id in post_resp.json().get("mention_user_ids", [])


def test_get_posts_mentioned():
    """/posts/mentioned returns posts mentioning the current user"""
    with TestClient(app) as client:
        token_resp = client.post(
            "/token",
            data={"username": "000000", "password": "pass"},
        )
        assert token_resp.status_code == 200
        token = token_resp.json()["access_token"]

        headers = {"Authorization": f"Bearer {token}"}

        me_resp = client.get("/users/me", headers=headers)
        assert me_resp.status_code == 200
        user_id = me_resp.json()["id"]

        mention_resp = client.post(
            "/posts/",
            json={"content": "mention timeline", "mention_user_ids": [user_id]},
            headers=headers,
        )
        assert mention_resp.status_code == 201
        mention_id = mention_resp.json()["id"]

        non_mention_resp = client.post(
            "/posts/",
            json={"content": "no mention"},
            headers=headers,
        )
        assert non_mention_resp.status_code == 201
        non_mention_id = non_mention_resp.json()["id"]

        timeline_resp = client.get("/posts/mentioned", headers=headers)
        assert timeline_resp.status_code == 200
        posts = timeline_resp.json()

        ids = [p["id"] for p in posts]
        assert mention_id in ids
        assert non_mention_id not in ids

        # ensure posts are sorted by created_at descending
        created_times = [p["created_at"] for p in posts]
        assert created_times == sorted(created_times, reverse=True)


def test_user_search_endpoint():
    """/users/search should support partial matches and limit results"""
    with TestClient(app) as client:
        # ensure startup initialized departments
        db = SessionLocal()
        created = []
        # create users that should match the query
        for i in range(12):
            user_in = schemas.UserCreate(
                employee_id=f"alpha{i:03d}",
                name=f"AlphaUser{i}",
                password="pass",
                department_id=2 if i % 2 == 0 else 3,
            )
            created.append(crud.create_user(db, user_in))
        # create some users that should not match
        for i in range(3):
            user_in = schemas.UserCreate(
                employee_id=f"beta{i:03d}",
                name=f"BetaUser{i}",
                password="pass",
                department_id=2,
            )
            created.append(crud.create_user(db, user_in))
        db.commit()

        # short query should return empty list
        resp_short = client.get("/users/search?query=a")
        assert resp_short.status_code == 200
        assert resp_short.json() == []

        # partial match query - should only include Alpha users and be limited to 10 results
        resp = client.get("/users/search", params={"query": "Alpha"})
        assert resp.status_code == 200
        results = resp.json()
        assert len(results) == 10
        assert all("Alpha" in u["name"] for u in results)
        assert all(u["department_name"] in ["2A病棟", "3B病棟"] for u in results)
        for u in results:
            assert {"id", "name", "department_name"}.issubset(u.keys())

        # ensure non-matching query returns empty list
        resp_none = client.get("/users/search", params={"query": "Unknown"})
        assert resp_none.status_code == 200
        assert resp_none.json() == []

        # cleanup created users
        for user in created:
            db.delete(db.query(models.User).get(user.id))
        db.commit()
        db.close()
