# 公式のPython 3.11イメージをベースとして使用します
FROM python:3.11

# コンテナ内の作業ディレクトリを設定します
WORKDIR /app

# まずはrequirements.txtだけをコピーして、ライブラリをインストールします
# (この手順を分けることで、コード変更のたびにライブラリを再インストールする無駄を防ぎます)
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# アプリケーションのコード全体をコピーします
COPY ./app /app/app

# コンテナが起動したときに実行されるコマンド
# uvicornサーバーを起動し、どのIPからのアクセスも受け付けるようにします
# --reloadフラグで、コードが変更されたら自動でサーバーを再起動してくれます
CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000", "--reload"]
