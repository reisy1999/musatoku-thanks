from fastapi.testclient import TestClient
from ..main import app
from .test_admin import _get_admin_token


def _get_token(client: TestClient, username: str, password: str) -> str:
    resp = client.post("/token", data={"username": username, "password": password})
    assert resp.status_code == 200
    return resp.json()["access_token"]


def test_report_flow():
    with TestClient(app) as client:
        # user1 creates a post
        token_user1 = _get_token(client, "000001", "000001")
        headers_user1 = {"Authorization": f"Bearer {token_user1}"}
        post_resp = client.post("/posts/", json={"content": "report target"}, headers=headers_user1)
        assert post_resp.status_code == 201
        post_id = post_resp.json()["id"]

        # user2 reports the post
        token_user2 = _get_token(client, "000002", "000002")
        headers_user2 = {"Authorization": f"Bearer {token_user2}"}
        report_resp = client.post("/reports", json={"reported_post_id": post_id, "reason": "spam"}, headers=headers_user2)
        assert report_resp.status_code == 201
        report_id = report_resp.json()["id"]

        # admin retrieves reports
        admin_token = _get_admin_token(client)
        headers_admin = {"Authorization": f"Bearer {admin_token}"}
        list_resp = client.get("/admin/reports", headers=headers_admin)
        assert list_resp.status_code == 200
        reports = list_resp.json()
        target = next(r for r in reports if r["id"] == report_id)
        assert target["post_content"] == "report target"
        assert target["post_author_id"] is not None
        assert target.get("post_author_name")
        assert target.get("post_created_at")
        assert target["status"] == "pending"

        # admin updates status to deleted
        patch_resp = client.patch(
            f"/admin/reports/{report_id}",
            json={"status": "deleted"},
            headers=headers_admin,
        )
        assert patch_resp.status_code == 200
        assert patch_resp.json()["status"] == "deleted"

        # deleted posts endpoint should list the post
        deleted_list = client.get("/admin/posts/deleted", headers=headers_admin)
        assert any(p["id"] == post_id for p in deleted_list.json())

        # regular posts should not include the deleted post
        normal_admin = client.get("/admin/posts", headers=headers_admin)
        assert all(p["id"] != post_id for p in normal_admin.json())
        public_posts = client.get("/posts/")
        assert all(p["id"] != post_id for p in public_posts.json())
