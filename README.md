# musatoku-thanks

## 1. プロジェクト概要

`musatoku-thanks` は、病院スタッフ向けの感謝SNS（ソーシャルネットワーキングサービス）です。医療従事者がお互いに感謝とサポートを表明できるプラットフォームを提供し、前向きで励みになる職場環境を育むことを目的としています。

このプロジェクトは主に2つのコンポーネントで構成されています。APIリクエストとデータ管理を処理する **FastAPI** バックエンドと、ユーザーインターフェースを提供する **React**（ViteとTypeScriptで構築）フロントエンドです。

## 2. リポジトリ構造

このリポジトリは、バックエンドとフロントエンドのコードを明確に分離し、Docker設定ファイルとともに構成されています。

* `/backend`
    * FastAPIアプリケーションのコードが含まれています。
    * バックエンドのDockerイメージをビルドするための `Dockerfile` が含まれています。
    * `requirements.txt` にはすべてのPythonの依存関係がリストされています。
* `/frontend`
    * ViteとTypeScriptで構築されたReactクライアントアプリケーションが格納されています。
    * フロントエンドのDockerイメージをビルドするための `Dockerfile` が含まれています。
    * `package.json` はNode.jsの依存関係を管理します。
* `docker-compose.yml`
    * 複数のコンテナからなるDockerアプリケーションを定義し、バックエンドとフロントエンドの両方のサービスをオーケストレーションします。
* `docker-compose.override.yml`
    * （開発環境専用）開発目的で `docker-compose.yml` の設定を上書きするために使用され、ホットリロードなどを有効にします。

## 3. 要件

`musatoku-thanks` をセットアップして実行するには、主に以下のものが必要です。

* **Docker と Docker Compose (推奨):** 最新の安定版を使用することを推奨します。
    * Dockerのインストールは `docker --version` で確認できます。
    * Docker Composeは `docker compose version` (Docker Compose V2の場合) または `docker-compose --version` (Docker Compose V1の場合) で確認できます。

**オプションのローカルツール (テスト実行や個別のサービス実行用):**

* **Python:** バックエンド開発やテスト実行に推奨されます。
    * Python 3.9 以降を推奨します。Pythonのインストールは `python --version` で確認できます。
* **Node.js/npm:** フロントエンド開発に推奨されます。
    * Node.js 18.x 以降、npm 8.x 以降を推奨します。Node.jsのインストールは `node --version`、npmは `npm --version` で確認できます。

**注:** 初回セットアップ時にDockerイメージのプルや依存関係のインストールを行うため、アクティブなインターネット接続が必要です。

## 4. セットアップ / クイックスタート

アプリケーションを迅速に起動して実行するには、以下の手順に従ってください。

### 環境変数

ローカル設定を定義するために、サンプル `.env` ファイルをコピーします。

```bash
cp backend/.env.example backend/.env
````

セキュリティ上の理由から `SECRET_KEY` を調整し（例えば、強力な新しいキーを生成してください）、`DATABASE_URL` をお好みのデータベース接続文字列に設定する必要があります。デフォルトの `sqlite:///./musatoku.db` は、`backend` ディレクトリ内のSQLiteデータベースファイルを使用します。

### コンテナの起動

`--build` フラグを付けてDocker Composeを実行します。

```bash
docker-compose up --build
```

このコマンドはいくつかの処理を実行します:

  * （必要に応じて、または `Dockerfile` が変更された場合に）バックエンドとフロントエンドの両方のサービスの新しいDockerイメージをビルドします。
  * サービス間の通信に必要なDockerネットワークを作成します。
  * 定義されているすべてのサービス（バックエンド、フロントエンド）をデタッチモード（バックグラウンドで実行）で起動します。
    初回実行時、または `/backend` や `/frontend` の `Dockerfile` が変更された場合は、`--build` を使用してください。

`docker-compose.yml` で定義されているすべての実行中のサービスを停止し、それらのコンテナ、ネットワーク、およびボリュームを削除するには、以下を使用します。

```bash
docker-compose down
```

### アプリケーションへのアクセス

サービスが実行されたら、以下のURLでアプリケーションにアクセスできます。

  * **フロントエンド (React/Vite):** [http://localhost:5173](https://www.google.com/search?q=http://localhost:5173)
      * これはReactシングルページアプリケーションを提供する開発サーバーです。
  * **API ドキュメント (FastAPI Swagger UI):** [http://localhost:8000/docs](https://www.google.com/search?q=http://localhost:8000/docs)
      * ブラウザから直接APIエンドポイントをテストし、理解するためのインタラクティブなドキュメントを提供します。

### デフォルトのテストユーザー

迅速なテストおよび開発目的のために、初期アカウントが提供されています。

  * **ID:** `000000`
  * **パスワード:** `pass`

**重要:** このテストユーザーは初期開発専用であり、本番環境では使用しないでください。

## 5\. 開発ワークフロー

このセクションでは、プロジェクトの作業方法、個別のサービスの実行、開発機能の活用について説明します。

### サービスを個別に実行する

特に特定のパートのより速い開発サイクルを実現するために、Docker Composeなしでフロントエンドまたはバックエンドを個別に実行したい場合があります。

#### フロントエンド

```bash
cd frontend
npm install
npm run dev
```

  * `npm install` は、フロントエンドに必要なすべてのNode.jsの依存関係をインストールします。
  * `npm run dev` はVite開発サーバーを起動し、コード変更を保存すると即座に更新されるホットモジュールリプレイスメント (HMR) を提供します。

#### バックエンド

```bash
cd backend
python -m venv .venv
source .venv/bin/activate  # Windowsの場合: .venv\Scripts\activate
pip install -r requirements.txt
uvicorn app.main:app --reload
```

  * `python -m venv .venv` は、プロジェクトの依存関係をシステム全体のPythonインストールから分離するためのPython仮想環境を作成します。
  * `source .venv/bin/activate` (またはWindowsの `.venv\Scripts\activate`) は仮想環境をアクティベートします。
  * `pip install -r requirements.txt` は、`requirements.txt` に指定されたすべてのPythonの依存関係を仮想環境にインストールします。
  * `uvicorn app.main:app --reload` はUvicornを使用してFastAPIアプリケーションを実行します。`--reload` フラグは、コードの変更が検出されるたびにサーバーを自動的にリロードするため、開発に非常に便利です。

### Docker ホットリロード

`docker-compose.override.yml` ファイルは、Dockerを使用して開発する際にホットリロードを有効にする上で重要な役割を果たします。これは `docker-compose.yml` と連携して以下の機能を提供します。

  * ローカルのソースコードディレクトリを対応するコンテナに直接マウントします（例：`/backend` をバックエンドコンテナに、`/frontend` をフロントエンドコンテナに）。これにより、ローカルファイルに行った変更が実行中のコンテナ内に即座に反映されます。
  * また、`docker-compose.yml` のデフォルトのコマンドや設定を上書きして、コンテナ化されたアプリケーション内でホットリロード機能を有効にする場合があります（例：バックエンドサーバーに `--reload` フラグを渡したり、フロントエンド開発サーバーがアクティブであることを保証したりします）。

このセットアップにより、分離されたDocker環境の恩恵を受けながら、ホットリロードの迅速なフィードバックサイクルを享受できます。

### VS Code Devcontainer

このリポジトリは、VS Code Dev Containersを使用した開発をサポートしており、Dockerコンテナ内で一貫性のある事前設定された開発環境を提供します。

  * **Devcontainerとは:** Dev Containerは、Dockerコンテナ内で実行され、VS Codeと直接統合された、フル機能の開発環境です。
  * **利点:**
      * **一貫した環境:** すべての開発者がまったく同じ環境を使用するため、「私のマシンでは動作するのに」という問題を回避できます。
      * **ツールがプリインストール済み:** 必要なすべての依存関係、ライブラリ、およびツール（リンター、フォーマッター、データベースクライアントなど）がコンテナ内にプリインストールされています。
      * **ホストシステムからの分離:** プロジェクト固有の依存関係からホストマシンをクリーンに保ちます。
  * **使用方法:**
    1.  VS Codeの **Remote - Containers** 拡張機能をインストールします。
    2.  VS Codeでこのリポジトリを開きます。
    3.  VS Codeから「コンテナで再度開く (Reopen in Container)」のプロンプトが表示されます。これを受け入れます。

コンテナで開くと、必要なすべてのツールと依存関係が事前設定され利用可能になり、手動でのセットアップなしにすぐにコーディングを開始できます。

## 6\. 環境変数

`backend/.env.example` ファイルには、FastAPIバックエンドで使用される主要な環境変数がリストされています。

```makefile
SECRET_KEY                # JWT署名キー。セキュリティ上極めて重要です。本番環境では強力でユニークなキーを生成してください。
ALGORITHM=HS256           # JWT署名に使用されるアルゴリズム。
ACCESS_TOKEN_EXPIRE_MINUTES=30 # アクセストークンの有効期限（分）。
DATABASE_URL=sqlite:///./musatoku.db   # データベース接続文字列。SQLite（開発用）、PostgreSQL、MySQLなど。
```

## 7\. テストの実行

バックエンドのテストは `backend/app/tests` にあります。

テストを実行するには、バックエンドのDockerコンテナ内で実行するか、ローカルのPython仮想環境で実行します（「開発ワークフロー」の「サービスを個別に実行する」を参照）。

`backend` ディレクトリ内での典型的なコマンド（仮想環境をセットアップし、要件をインストールした後）：

```bash
cd backend
pip install -r requirements.txt # すべてのテスト依存関係がインストールされていることを確認
pytest
```

## 8\. ディレクトリの詳細 / コード構造

重要なモジュールとその役割の概要です。

  * `backend/app/models.py`: データベーススキーマ（例：ユーザー、投稿、感謝メッセージ）を表すSQLAlchemyモデルを定義します。
  * `backend/app/crud.py`: データベースモデルと対話するためのCreate、Read、Update、Delete (CRUD) 操作が含まれています。
  * `backend/app/routers/`: さまざまなAPIルートモジュールが格納されています。
      * `backend/app/routers/admin/`: 特に管理者のみがアクセスできるAPI（ユーザー管理やコンテンツモデレーションツールなど）が含まれています。
  * `frontend/src`: Reactアプリケーションの主要なソースディレクトリで、コンポーネント、ページ、アプリケーションロジックが含まれています。

## 9\. 貢献ガイドライン (オプション)

`musatoku-thanks` に貢献したい場合は、以下の点を考慮してください（詳細なガイドラインは後で追加される可能性があります）。

  * **コーディングスタイル:** 既存のコードスタイルに従ってください。PythonにはBlack、TypeScript/ReactにはESLint/Prettierを使用しています。
  * **コミットメッセージ:** 明確で簡潔なコミットメッセージを使用し、できればConventional Commitsスタイル（例：`feat: 新機能の追加`、`fix: バグの解決`）に従ってください。
  * **ブランチワークフロー:** `main` から派生したフィーチャーブランチで作業し、レビューのためにプルリクエストを提出してください。

## 10\. トラブルシューティング / FAQ

セットアップ中の一般的な問題とその解決策をいくつか紹介します。

  * **ポートの競合:** `http://localhost:5173` または `http://localhost:8000` がすでにシステムで使用されている場合、Docker Composeの起動に失敗する可能性があります。
      * **解決策:** 競合しているアプリケーションを終了するか、`docker-compose.yml` のポートマッピングを変更してください。
  * **環境変数の不足:** `.env` ファイルのコピーまたは設定を忘れると、バックエンドが設定エラーで起動しない可能性があります。
      * **解決策:** `cp backend/.env.example backend/.env` が実行されていること、および `backend/.env` に有効な設定、特に `SECRET_KEY` と `DATABASE_URL` が含まれていることを確認してください。
  * **Dockerの問題:** Docker Desktop（またはDockerデーモン）が実行されていることを確認してください。
      * **解決策:** Docker Desktopを起動してください。`docker logs <container_name>` を使用して、特定の`Docker`エラーメッセージのログを確認してください。
* **`npm install` または `pip install` エラー:** これは通常、ネットワークの問題またはキャッシュの破損を示します。
      * **解決策:** npmキャッシュをクリアするか（`npm cache clean --force`）、pipキャッシュをクリアしてみてください。アクティブなインターネット接続があることを確認してください。

## 11\. ユーザーCSVインポート

管理者は `/admin/users/import` エンドポイントからCSVファイルをアップロードしてユーザーを一括作成できます。CSVには以下のヘッダーを含めてください。

```
user_id,name,display_name,department,email
```

`display_name` 列がない場合は `name` の値がそのまま表示名として使用されます。サンプルファイル `backend/users_import_template.csv` も参考にしてください。
CSVファイルは必ず **UTF-8 エンコーディング** で保存してください。その他のエンコード形式では文字化けが発生します。

## 12. データベーススキーマの更新

`users` テーブルに以下の3カラムが追加されました。

- `appreciated_count` INTEGER NOT NULL DEFAULT 0
- `expressed_count` INTEGER NOT NULL DEFAULT 0
- `likes_received` INTEGER NOT NULL DEFAULT 0

新規データベースを作成する場合は、アプリ起動時の `Base.metadata.create_all()` により自動的にこれらのカラムが含まれます。既存データベースを使用している場合は手動でカラムを追加してください。SQLite の例を以下に示します。

```sql
ALTER TABLE users ADD COLUMN appreciated_count INTEGER NOT NULL DEFAULT 0;
ALTER TABLE users ADD COLUMN expressed_count INTEGER NOT NULL DEFAULT 0;
ALTER TABLE users ADD COLUMN likes_received INTEGER NOT NULL DEFAULT 0;
```

他のデータベースを利用している場合も同様に `ALTER TABLE` コマンドを実行して追加してください。

## 13. ユーザー統計の更新

各ユーザーには以下の統計情報が記録されます。

- **appreciated_count**: 他のユーザーからメンションされて感謝された回数。
- **expressed_count**: 自分が投稿で感謝を表明した回数。
- **likes_received**: 自分の投稿が「いいね」された累計数。

投稿を作成すると、著者の `expressed_count` が1増加し、メンションされたユーザーの `appreciated_count` も1ずつ増加します。また投稿に「いいね」が付くと、その投稿の著者の `likes_received` が増え、いいねを取り消すと減少します。これらの統計は `/users/me` API や管理者向けユーザー一覧で確認できます。

既存デプロイメントでこの機能を利用するには、前節の `ALTER TABLE` コマンドを実行して3カラムを追加してください。
