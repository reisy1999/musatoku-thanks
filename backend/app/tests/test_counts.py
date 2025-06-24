from fastapi.testclient import TestClient
from ..main import app
from ..database import SessionLocal
from .. import crud


def _get_token(client: TestClient, username: str, password: str) -> str:
    resp = client.post("/token", data={"username": username, "password": password})
    assert resp.status_code == 200
    return resp.json()["access_token"]


def test_create_post_updates_counters():
    with TestClient(app) as client:
        db = SessionLocal()
        author = crud.get_user_by_employee_id(db, "000001")
        mentioned = crud.get_user_by_employee_id(db, "000002")
        author_before = author.expressed_count
        mentioned_before = mentioned.appreciated_count
        mentioned_id = mentioned.id
        db.close()

        token = _get_token(client, "000001", "000001")
        headers = {"Authorization": f"Bearer {token}"}
        resp = client.post(
            "/posts/",
            json={"content": "count test", "mention_user_ids": [mentioned_id]},
            headers=headers,
        )
        assert resp.status_code == 201

        db = SessionLocal()
        author_after = crud.get_user_by_employee_id(db, "000001").expressed_count
        mentioned_after = crud.get_user_by_employee_id(db, "000002").appreciated_count
        db.close()

        assert author_after == author_before + 1
        assert mentioned_after == mentioned_before + 1


def test_like_unlike_updates_author_likes_received():
    with TestClient(app) as client:
        token_author = _get_token(client, "000001", "000001")
        headers_author = {"Authorization": f"Bearer {token_author}"}
        post_resp = client.post("/posts/", json={"content": "like count"}, headers=headers_author)
        assert post_resp.status_code == 201
        post_id = post_resp.json()["id"]

        token_other = _get_token(client, "000002", "000002")
        headers_other = {"Authorization": f"Bearer {token_other}"}

        db = SessionLocal()
        likes_before = crud.get_user_by_employee_id(db, "000001").likes_received
        db.close()

        like_resp = client.post(f"/posts/{post_id}/like", headers=headers_other)
        assert like_resp.status_code == 204

        db = SessionLocal()
        likes_after = crud.get_user_by_employee_id(db, "000001").likes_received
        db.close()
        assert likes_after == likes_before + 1

        unlike_resp = client.delete(f"/posts/{post_id}/like", headers=headers_other)
        assert unlike_resp.status_code == 204

        db = SessionLocal()
        likes_final = crud.get_user_by_employee_id(db, "000001").likes_received
        db.close()
        assert likes_final == likes_before

