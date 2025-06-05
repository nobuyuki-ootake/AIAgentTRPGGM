# 手動起動手順

## 問題
pnpmのワークスペースインストールが正しく完了していないため、viteが見つからない

## 解決方法

### オプション1: fix-install.batを実行（推奨）
```bash
fix-install.bat
```
これにより、shamefully-hoistオプションで全ての依存関係がルートnode_modulesにインストールされます。

### オプション2: 各ディレクトリで個別にnpmを使用

#### 1. Typesパッケージのビルド
```bash
cd packages\types
npm install
npm run build
```

#### 2. Frontendの起動
```bash
cd apps\frontend
npm install vite @vitejs/plugin-react --save-dev
npx vite
```

#### 3. Proxy Serverの起動（別ターミナル）
```bash
cd apps\proxy-server
npm install
npm run dev
```

### オプション3: quick-start.batを実行
最小限の依存関係でフロントエンドを起動：
```bash
quick-start.bat
```

## 確認事項
- Frontend: http://localhost:5173
- Proxy Server: http://localhost:3001