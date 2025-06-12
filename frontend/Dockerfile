# --- ステージ1: ビルドステージ ---
# Node.js環境でReactアプリケーションをビルドします
FROM node:20 as builder

WORKDIR /app

# package.jsonとlockファイルを先にコピーして依存関係をインストール
COPY package*.json ./
RUN npm install

# 全てのソースコードをコピー
COPY . .

# 本番用の静的ファイル（HTML, CSS, JS）を生成
RUN npm run build

# --- ステージ2: 配信ステージ ---
# 軽量なWebサーバーであるnginxをベースにします
FROM nginx:alpine

# ビルドステージで生成された静的ファイルをnginxの公開ディレクトリにコピー
COPY --from=builder /app/dist /usr/share/nginx/html

# nginxがコンテナの80番ポートでリクエストを待ち受けるようにします
EXPOSE 80

# コンテナ起動時にnginxを起動します
CMD ["nginx", "-g", "daemon off;"]