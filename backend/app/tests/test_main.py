from fastapi.testclient import TestClient
from ..main import app  # main.pyからFastAPIアプリをインポート

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
