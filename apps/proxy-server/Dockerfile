# モノレポ対応のマルチステージビルド
FROM node:20-alpine AS base

# pnpmのインストール
RUN npm install -g pnpm

# ワークディレクトリの設定
WORKDIR /app

# ルートのpackage.jsonとpnpm-workspace.yamlをコピー
COPY package.json pnpm-workspace.yaml pnpm-lock.yaml ./

# パッケージディレクトリの構造を作成
COPY packages/types/package.json ./packages/types/
COPY apps/proxy-server/package.json ./apps/proxy-server/

# 依存関係のインストール
RUN pnpm install --frozen-lockfile

# ソースコードのコピー
COPY packages/ ./packages/
COPY apps/proxy-server/ ./apps/proxy-server/

# 共有パッケージのビルド
RUN pnpm run build --filter=@novel-ai-assistant/types

# プロキシサーバーのビルド
RUN cd apps/proxy-server && pnpm run build

# 本番用ステージ
FROM node:20-alpine AS production

RUN npm install -g pnpm

WORKDIR /app

# 必要なファイルのみコピー
COPY --from=base /app/package.json /app/pnpm-workspace.yaml /app/pnpm-lock.yaml ./
COPY --from=base /app/packages/types/package.json ./packages/types/
COPY --from=base /app/packages/types/dist/ ./packages/types/dist/
COPY --from=base /app/apps/proxy-server/package.json ./apps/proxy-server/
COPY --from=base /app/apps/proxy-server/dist/ ./apps/proxy-server/dist/

# 本番用依存関係のインストール
RUN pnpm install --prod --frozen-lockfile

# 環境変数の設定
ENV NODE_ENV=production
ENV PORT=3001

# ポートの公開
EXPOSE 3001

# アプリケーションの起動
CMD ["sh", "-c", "cd apps/proxy-server && pnpm start"] 