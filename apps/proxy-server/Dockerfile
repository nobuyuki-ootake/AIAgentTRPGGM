# バックエンド用Dockerfile - Cloud Run対応 (turbo prune最適化)
FROM node:18-alpine AS base
RUN apk add --no-cache libc6-compat curl wget
WORKDIR /app

# Turbo CLI とpnpmをインストール
RUN npm install -g turbo pnpm

# Litestream バイナリをインストール
RUN wget https://github.com/benbjohnson/litestream/releases/download/v0.3.13/litestream-v0.3.13-linux-amd64.tar.gz \
    && tar -xzf litestream-v0.3.13-linux-amd64.tar.gz \
    && mv litestream /usr/local/bin/ \
    && rm litestream-v0.3.13-linux-amd64.tar.gz

# Turbo prune でバックエンド用に最適化されたワークスペースを作成
FROM base AS builder
COPY . .
RUN turbo prune --scope=novel-creation-agent-proxy --docker

# 依存関係のインストール (最適化されたレイヤーキャッシュ)
FROM base AS installer
WORKDIR /app

# 最初にpackage.jsonとlock fileのみコピー（キャッシュ効率化）
COPY --from=builder /app/out/json/ .
COPY --from=builder /app/out/pnpm-lock.yaml ./pnpm-lock.yaml

# 依存関係をインストール
RUN pnpm install --frozen-lockfile

# ソースコードをコピーしてビルド
COPY --from=builder /app/out/full/ .
COPY turbo.json turbo.json

# Turbo remote cache設定用の環境変数
ARG TURBO_TEAM
ENV TURBO_TEAM=$TURBO_TEAM
ARG TURBO_TOKEN
ENV TURBO_TOKEN=$TURBO_TOKEN

# typesパッケージとproxy-serverをビルド
RUN turbo run build --filter=@novel-ai-assistant/types
RUN turbo run build --filter=novel-creation-agent-proxy

# 本番環境用の軽量イメージ
FROM node:18-alpine AS runner
WORKDIR /app

# 必要なパッケージをインストール
RUN apk add --no-cache curl
RUN npm install -g pnpm

# Litestream バイナリをコピー
COPY --from=base /usr/local/bin/litestream /usr/local/bin/litestream

# ビルド済みファイルとnode_modulesをコピー
COPY --from=installer /app/apps/proxy-server/dist ./dist
COPY --from=installer /app/apps/proxy-server/package.json ./package.json
COPY --from=installer /app/node_modules ./node_modules

# データベースディレクトリ作成
RUN mkdir -p /app/data

# 非rootユーザーを作成
RUN addgroup -g 1001 -S nodejs
RUN adduser -S nextjs -u 1001

# ファイルの所有権を変更
RUN chown -R nextjs:nodejs /app
USER nextjs

# Cloud RunのPORT環境変数対応
EXPOSE 8080
ENV PORT=8080
ENV NODE_ENV=production

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
    CMD curl -f http://localhost:8080/health || exit 1

# アプリケーションを起動
CMD ["node", "dist/index.js"] 