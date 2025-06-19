from fastapi.testclient import TestClient
from ..main import app


def _get_token(client: TestClient, username: str, password: str) -> str:
    resp = client.post("/token", data={"username": username, "password": password})
    assert resp.status_code == 200
    return resp.json()["access_token"]


def test_like_unlike_flow():
    with TestClient(app) as client:
        token = _get_token(client, "000001", "000001")
        headers = {"Authorization": f"Bearer {token}"}

        post_resp = client.post("/posts/", json={"content": "like me"}, headers=headers)
        assert post_resp.status_code == 201
        post_id = post_resp.json()["id"]

        like_resp = client.post(f"/posts/{post_id}/like", headers=headers)
        assert like_resp.status_code == 204

        posts = client.get("/posts/", headers=headers).json()
        target = next(p for p in posts if p["id"] == post_id)
        assert target["like_count"] == 1
        assert target["liked_by_me"] is True

        # liking again should be idempotent
        like_resp2 = client.post(f"/posts/{post_id}/like", headers=headers)
        assert like_resp2.status_code == 204
        posts = client.get("/posts/", headers=headers).json()
        target = next(p for p in posts if p["id"] == post_id)
        assert target["like_count"] == 1

        unlike_resp = client.delete(f"/posts/{post_id}/like", headers=headers)
        assert unlike_resp.status_code == 204
        posts = client.get("/posts/", headers=headers).json()
        target = next(p for p in posts if p["id"] == post_id)
        assert target["like_count"] == 0
        assert target["liked_by_me"] is False

        # unauthorized like
        unauth = client.post(f"/posts/{post_id}/like")
        assert unauth.status_code == 401
