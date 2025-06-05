# フロントエンド用Dockerfile - Cloud Run対応 (turbo prune最適化)
FROM node:18-alpine AS base
RUN apk add --no-cache libc6-compat
WORKDIR /app

# Turbo CLI をインストール
RUN npm install -g turbo

# Turbo prune でフロントエンド用に最適化されたワークスペースを作成
FROM base AS builder
COPY . .
RUN turbo prune --scope=trpg-ai-gm-frontend --docker

# 依存関係のインストール (最適化されたレイヤーキャッシュ)
FROM base AS installer
WORKDIR /app

# 最初にpackage.jsonとlock fileのみコピー（キャッシュ効率化）
COPY --from=builder /app/out/json/ .
COPY --from=builder /app/out/pnpm-lock.yaml ./pnpm-lock.yaml

# pnpm インストール
RUN npm install -g pnpm
RUN pnpm install --frozen-lockfile

# ソースコードをコピーしてビルド
COPY --from=builder /app/out/full/ .
COPY turbo.json turbo.json

# Turbo remote cache設定用の環境変数
ARG TURBO_TEAM
ENV TURBO_TEAM=$TURBO_TEAM
ARG TURBO_TOKEN
ENV TURBO_TOKEN=$TURBO_TOKEN

# フロントエンドをビルド
RUN turbo run build --filter=trpg-ai-gm-frontend

# 本番環境用の軽量イメージ
FROM nginx:alpine AS runner
WORKDIR /usr/share/nginx/html

# ビルド済みファイルをコピー
COPY --from=installer /app/apps/frontend/dist ./

# Nginx設定をコピー
COPY apps/frontend/nginx.conf /etc/nginx/nginx.conf

# Cloud Runのポート設定
EXPOSE 8080

# Cloud RunのPORT環境変数に対応
CMD ["sh", "-c", "nginx -g 'daemon off;'"]