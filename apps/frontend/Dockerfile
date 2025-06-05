# フロントエンド用Dockerfile - Cloud Run対応
FROM node:18-alpine AS builder
RUN apk add --no-cache libc6-compat
WORKDIR /app

# pnpm インストール  
RUN npm install -g pnpm

# package.json ファイルを先にコピー（キャッシュ効率化）
COPY package.json pnpm-lock.yaml ./
COPY apps/frontend/package.json ./apps/frontend/
COPY apps/proxy-server/package.json ./apps/proxy-server/
COPY packages ./packages

# 依存関係をインストール
RUN pnpm install --frozen-lockfile

# 残りのソースコードをコピー
COPY apps/frontend ./apps/frontend/
COPY turbo.json ./

# フロントエンドをビルド
RUN cd apps/frontend && pnpm run build

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