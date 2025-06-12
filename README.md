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