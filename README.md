# musatoku-thanks

武蔵野徳洲会病院 職員向け感謝SNSアプリ

## 開発環境の起動方法

1.  PCにDockerがインストールされていることを確認します。
2.  このフォルダのルートで、以下のコマンドを実行します。

```bash
docker-compose up --build
アクセス情報
フロントエンド画面: http://localhost:5173
バックエンドAPIドキュメント(Swagger UI): http://localhost:8000/docs
テストユーザー情報
ID: 000000
Password: pass
<!-- end list -->


---

### 4. `devcontainer.json` の設定

計画書(No. 39)の項目5に基づき、VSCodeでの開発体験を向上させるための設定を記述します。

**【ファイル】: `.devcontainer/devcontainer.json` (完成版)**
```json
{
	"name": "Musatoku Thanks",
	"dockerComposeFile": "../docker-compose.yml",
	"service": "backend",
	"workspaceFolder": "/app",
	"customizations": {
		"vscode": {
			"extensions": [
				"ms-python.python",
				"ms-python.vscode-pylance",
				"esbenp.prettier-vscode",
				"bradlc.vscode-tailwindcss",
				"ms-azuretools.vscode-docker"
			]
		}
	}
}
解説:
この設定により、VSCodeのDev Container機能を使った際に、PythonやTailwind CSS、Dockerの便利な拡張機能が自動でインストールされるようになります。

## Python依存関係

バックエンドでは `httpx` を Starlette との互換性を保つため `0.27` 未満に固定しています。
ローカルでテストを実行する際は以下のコマンドでインストールしてください。

```bash
cd backend
pip install -r requirements.txt
```

## 環境変数の設定

バックエンドでは環境変数を `.env` ファイルから読み込みます。開発開始前にサンプルファイルをコピーし、必要に応じて値を変更してください。

```bash
cp backend/.env.example backend/.env
```

`SECRET_KEY` は JWT トークンの署名に利用される重要な値です。ランダムな文字列を設定してください。
`DATABASE_URL` はローカル開発用のデータベース接続先を示します。デフォルトでは SQLite を使用しますが、環境に合わせて書き換えてください。
