# フロントエンド用Dockerfile - Cloud Run対応
FROM node:18-alpine AS builder
RUN apk add --no-cache libc6-compat
WORKDIR /app

# pnpm インストール  
RUN npm install -g pnpm@10.10.0

# 全てのファイルをコピー（簡単な方法）
COPY . .

# 依存関係をインストール
RUN pnpm install --frozen-lockfile

# フロントエンドをビルド（TypeScriptチェックをスキップ）
RUN cd apps/frontend && pnpm run build:docker

# 本番環境用の軽量イメージ
FROM nginx:alpine AS runner
WORKDIR /usr/share/nginx/html

# ビルド済みファイルをコピー
COPY --from=builder /app/apps/frontend/dist ./

# Nginx設定をコピー
COPY apps/frontend/nginx.conf /etc/nginx/nginx.conf

# Cloud Runのポート設定
EXPOSE 8080

# Cloud RunのPORT環境変数に対応
CMD ["sh", "-c", "nginx -g 'daemon off;'"]