from fastapi.testclient import TestClient
from ..main import app # main.pyからFastAPIアプリをインポート

client = TestClient(app)

def test_read_main():
    """
    FastAPIのドキュメントページ(/docs)が正常に表示されることをテストします。
    これが通れば、アプリが正常に起動している証拠になります。
    """
    response = client.get("/docs")
    assert response.status_code == 200