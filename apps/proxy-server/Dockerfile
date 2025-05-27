FROM node:20-alpine

WORKDIR /app

# パッケージのインストール
COPY package.json ./
RUN npm install -g pnpm && pnpm install

# ソースコードのコピー
COPY . .

# デバッグ用：ファイルリストの表示
RUN ls -la && mkdir -p dist

# ビルド処理
RUN pnpm run build && ls -la dist

# 環境変数の設定
ENV NODE_ENV=production
ENV PORT=3001

# ポートの公開
EXPOSE 3001

# アプリケーションの起動
CMD ["pnpm", "start"] 