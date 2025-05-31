# AI エージェント実装方針

## 1. 概要

本プロジェクトでは、小説創作を AI が支援する共創型エージェントを実装する。ユーザーは創作プロセスの各段階（プロット構成、キャラクター設計、執筆など）で特定の要素を選択し、AI エージェントに質問・提案を求めることができる。

## 2. 現在の実装状況

現在、以下のコンポーネントの実装を開始している：

- **選択可能な要素（SelectableElement）**: ユーザーがプロット項目、キャラクター、章などをチェックボックスで選択できるコンポーネント
- **Recoil による状態管理**: 選択された要素、チャット履歴、チャットパネルの表示状態などを管理するアトム

## 3. エージェント機能構成

### 3.1 選択型コンテキスト機能

- プロット、キャラクター、章、世界観の各要素にチェックボックスを設置
- 選択された要素はハイライト表示され、AI との対話コンテキストに自動的に追加される
- 複数要素の組み合わせ選択が可能（例：あるキャラクターとあるプロット項目を同時に選択）

### 3.2 AI チャットパネル

- 画面右側または下部に配置するフローティングパネル
- 選択された要素の表示領域、メッセージ入力欄、送信ボタン、履歴表示で構成
- 折りたたみ可能で、必要なときだけ表示させることができる

### 3.3 役割別 AI エージェント

以下の役割を持つ AI エージェントを実装：

1. **プロットアドバイザー**

   - 物語構造の改善提案
   - 矛盾点や弱点の指摘
   - プロット展開のアイデア提供

2. **キャラクターデザイナー**

   - キャラクター設定の深堀り
   - 性格や背景の一貫性チェック
   - キャラクター間の関係性提案

3. **文体エディター**

   - 表現や描写の改善提案
   - 文章の流れや読みやすさの向上
   - 語彙や表現の多様化

4. **世界観構築アシスタント**
   - 世界のルール・設定の一貫性確認
   - 詳細な背景設定の提案
   - 文化・歴史・地理の発展アイデア

## 4. 技術実装方針

### 4.1 フロントエンド実装

- **Recoil による状態管理**:

  - 選択された要素: `selectedElementsState`
  - チャット履歴: `aiChatHistoryState`
  - メッセージ入力: `currentMessageState`
  - AI 処理状態: `aiLoadingState`
  - チャットパネル表示: `aiChatPanelOpenState`

- **コンポーネント構成**:
  - `SelectableElement`: 選択可能な要素を表示
  - `AIChatPanel`: AI との対話インターフェース
  - `SelectedContext`: 選択された要素の表示
  - `ChatHistory`: 会話履歴の表示
  - `AIResponseRenderer`: AI からの返答を適切に表示

### 4.2 バックエンド連携

- **API ルート**:

  - `/api/ai/chat`: AI エージェントとの対話用エンドポイント
  - `/api/ai/apply`: AI 提案を選択して適用するエンドポイント

- **プロンプトエンジニアリング**:

  - システムプロンプトにエージェントの役割を定義
  - 選択された要素を JSON で整形してコンテキストに含める
  - ユーザーメッセージと組み合わせて API リクエストを構成

- **OpenAI/Claude API 活用**:

  - 選択された役割に応じた適切なシステムプロンプトを設定
  - Function Calling を活用して構造化された提案を生成
  - ストリーミングレスポンスで即時表示

- **RDB（PostgreSQL/MySQL 等）によるユーザー・トークン・API キー管理**:
  - ユーザーごとに API キーを暗号化して RDB に保存
  - ユーザーの認証トークンも RDB で管理し、有効期限（例：30 日）を持たせる
  - API リクエスト時はトークン検証 →OK なら RDB から API キーを取得し外部 API へリクエスト
  - Redis はキャッシュ用途に限定

### 4.3 UI/UX 設計

- **チェックボックス連携**:

  - 各要素にチェックボックスを追加し、視覚的に選択状態を表示
  - 選択状態に合わせて背景色やボーダーを変更

- **チャットパネル挙動**:

  - 最初は折りたたまれた状態
  - 要素選択時に自動展開のオプション
  - ドラッグ可能な位置調整

- **レスポンシブ対応**:
  - モバイル表示時はフルスクリーンモーダルとして表示
  - デスクトップではサイドパネルとして表示

## 5. 実装ロードマップ

### フェーズ 1: 基本機能実装

- ✅ 選択可能な要素コンポーネント実装
- ✅ Recoil 状態管理設定
- AI チャットパネル実装
- 選択コンテキスト表示機能

### フェーズ 2: AI 連携機能

- OpenAI/Claude API 連携
- プロンプト設計
- レスポンス処理・表示

### フェーズ 3: 拡張機能

- 複数役割エージェント切り替え
- 提案適用機能
- 会話履歴保存・検索

### フェーズ 4: 改善・最適化

- UX 改善
- プロンプト最適化
- パフォーマンス向上

## 6. 課題と対応策

### 6.1 API 利用コスト

- **課題**: API コールが増加するとコストが増大
- **対策**:
  - キャッシュ機構の実装
  - 類似質問の検出と再利用
  - トークン数最適化

### 6.2 ユーザー体験

- **課題**: 複雑な選択肢や機能が混乱を招く可能性
- **対策**:
  - 段階的な機能導入
  - チュートリアル実装
  - 簡潔な UI デザイン

### 6.3 プロンプト設計

- **課題**: 効果的なレスポンスを引き出すプロンプト設計
- **対策**:
  - プロンプトの A/B テスト
  - フィードバックに基づく継続的改善
  - ドメイン特化テンプレート開発

### 6.4 セキュリティ設計（追加）

- API キーは RDB に**暗号化して保存**
- トークンには**有効期限（例：30 日）**を持たせる
- トークン検証に合格したユーザーのみ API キー取得・利用が可能
- 暗号化鍵は環境変数で安全に管理
- Redis はキャッシュ用途に限定

## 7. 将来的な拡張計画

- **RDB による多様なユーザー管理・分析基盤**: ユーザー属性や利用履歴の分析、課金・権限管理なども RDB で拡張可能
- **マルチモーダル対応**: 画像生成との連携（キャラクターイメージなど）
- **協調型エージェント**: 複数エージェント間での議論機能
- **学習機能**: ユーザー好みの学習と適応
- **執筆スタイル分析**: ユーザーの文体を分析し、それに合わせた提案

## 8. 実装アプローチの比較分析

AI エージェント実装のためには複数のアプローチが考えられる。以下に主要なアプローチを比較分析し、本プロジェクトにおける最適な選択肢を検討する。

### 8.1 カスタム実装（独自開発）

**メリット**:

- 要件に完全に合致したカスタマイズが可能
- サードパーティ依存がないため長期的な安定性が確保できる
- パフォーマンスを最適化しやすい

**デメリット**:

- 開発工数が大きい
- エージェント機能の実装に専門知識が必要
- メンテナンスコストが高い

### 8.2 LangChain ベースの実装

**メリット**:

- エージェント機能の実装が容易
- 豊富なコンポーネントとインテグレーション
- 活発なコミュニティサポート

**デメリット**:

- ライブラリの頻繁な更新による Breaking Changes
- 柔軟性に制限がある場合がある
- オーバーヘッドが大きくなる可能性

### 8.3 Dify のようなノーコードツール

**メリット**:

- 開発速度が非常に速い
- 技術的な障壁が低く、非エンジニアも参加可能
- ビジュアルインターフェースによる直感的な開発

**デメリット**:

- カスタマイズ性に制限がある
- 複雑なロジックの実装が難しい
- プラットフォーム依存のリスク

### 8.4 AutoGen や CrewAI のような専用エージェントフレームワーク

**メリット**:

- エージェント間協調に特化した機能
- 役割ベースのエージェント設計をサポート
- マルチステップの推論や計画立案に強み

**デメリット**:

- 比較的新しいフレームワークで安定性に懸念
- 学習曲線が急
- 特定のユースケースに最適化されている場合がある

### 8.5 クラウドサービス（Bedrock Agent や Azure AI Agent）

**メリット**:

- スケーラビリティが高い
- インフラ管理の負担が少ない
- セキュリティやコンプライアンス対応が容易

**デメリット**:

- コストが高くなる可能性
- ベンダーロックインのリスク
- カスタマイズ性に制限

## 9. 推奨アプローチ

本プロジェクトの現状と要件を考慮し、以下の**ハイブリッドアプローチ**を推奨する：

1. **基本フレームワーク**: React + TypeScript + Recoil による独自実装をベースとする

2. **エージェント機能**: LLM API を直接利用し、Function Calling を活用した軽量なエージェント機能を実装

   - 理由: 最も柔軟性が高く、本プロジェクト固有の要件に対応しやすい
   - サードパーティ依存を最小限に抑え、長期的な安定性を確保

3. **プロトタイピング**: 初期検証段階では Dify などのノーコードツールを活用し、素早く概念実証を行う

   - UI や UX の検証を効率的に行い、本実装へのインサイトを得る

4. **特定機能の補完**: 必要に応じて LangChain や LangGraph の特定モジュールを活用

   - 例: 複雑なワークフロー管理や RAG 機能など

5. **将来展望**: 協調型エージェント機能の拡張時には AutoGen などの専用フレームワークの採用を検討

このハイブリッドアプローチにより、開発効率とカスタマイズ性のバランスを取りながら、将来的な拡張性も確保することができる。また、特定のフレームワークやサービスへの過度な依存を避けることで、技術的負債のリスクを軽減できる。

## 10. LLM API 通信方法の比較分析

AI エージェントと LLM API（OpenAI、Claude、Google Gemini 等）の通信方法について、複数のアプローチを比較検討し、本プロジェクトに最適な方法を選定する。

### 10.1 フロントエンドでの API キー管理と直接通信

**メリット**:

- 実装が最も簡単で迅速に開発可能
- バックエンド開発やインフラストラクチャが不要
- ユーザー固有の API キーを使用するため、ユーザー間で使用量が分離される

**デメリット**:

- **重大なセキュリティリスク**: クライアントサイドのコードから API キーが漏洩する可能性が高い
- ネットワークリクエストから API キーが漏洩する可能性がある
- 使用量の制限やモニタリングが難しい
- ブラウザの同一オリジンポリシーによる CORS 問題が発生する可能性がある

### 10.2 バックエンドプロキシを利用した通信

**メリット**:

- API キーをサーバーサイドで保護できる
- リクエストの検証、フィルタリング、ログ記録が可能
- 使用量の制限やモニタリングが容易
- キャッシュ機能を実装して API コスト削減が可能
- 複数の LLM API（OpenAI、Claude、Gemini）を統一的に扱える

**デメリット**:

- バックエンドサーバーの実装と維持が必要
- すべてのユーザーが同じ API キーを共有する場合、コスト管理が複雑になる
- サーバーのスケーリングが必要になる場合がある

## 11. API 通信の推奨アプローチ

現在の要件と状況を考慮し、**Mastra を活用したバックエンドプロキシ方式**を推奨する。理由は以下の通り：

1. **セキュリティの確保**:

   - API キーを安全に管理
   - リクエストの検証とフィルタリング
   - レート制限による過負荷防止

2. **パフォーマンスの最適化**:

   - レスポンスのキャッシュ機能
   - データの整形と最適化
   - 複数 API の統合管理

3. **運用管理の効率化**:

   - 一元化されたログ管理
   - モニタリングとアラート機能
   - ヘルスチェックによる可用性確保

4. **拡張性の確保**:
   - 新しい AI API の追加が容易
   - 認証・認可機能の拡張
   - カスタムミドルウェアの追加

### 11.1 Mastra の具体的な実装例

## 12. データベース導入に関する検討

本プロジェクトでは、現時点においてデータベース（DB）の導入は不要と判断している。以下にその理由と将来的な検討事項を示す。

### 12.1 データベース不要の理由

1. **ユーザーデータの管理方針**:

   - ユーザー作成コンテンツ（プロジェクト、プロット、キャラクターなど）はエクスポート機能を提供し、ユーザー自身がローカルに保存
   - 必要に応じてファイルをインポートし、作業を再開できる仕組みを提供
   - サーバー側でのデータ永続化は行わない設計

2. **シンプルな実装アプローチ**:

   - データ保存機能を盛り込まないことで、バックエンド実装を最小限に抑制
   - セキュリティやプライバシーに関するリスクを低減
   - メンテナンスコストの削減

3. **オフライン作業のサポート**:
   - インターネット接続がない環境でも基本機能が利用可能
   - ユーザーがデータの管理権限を完全に保持

### 12.2 データベースなしでの実装方法

1. **ローカルストレージの活用**:

   - ブラウザのローカルストレージまたは IndexedDB を使用した一時的なデータ保存
   - セッション間での作業状態の維持
   - エクスポート/インポート機能との連携

2. **ファイルベースのデータ交換**:

   - JSON 形式でのプロジェクトデータのエクスポート
   - インポート機能による作業再開
   - バージョン管理のためのメタデータ付与

3. **AI 会話履歴の管理**:
   - セッション内でのみ会話履歴を保持
   - 必要に応じてエクスポートファイルに含める選択肢を提供

### 12.3 将来的な拡張可能性

将来的な機能拡張によってはデータベース導入が検討される可能性がある。以下のような場合に再検討を行う：

1. **ユーザー認証機能の追加**:

   - ユーザーアカウント管理が必要になった場合
   - 複数デバイス間でのデータ同期機能を実装する場合

2. **協調機能の実装**:

   - 複数ユーザーによる共同編集機能を追加する場合
   - 共有プロジェクトやテンプレートライブラリを実装する場合

3. **高度な分析機能**:

   - ユーザーの使用パターンを分析して AI の提案を改善する場合
   - 匿名化された事例集や知識ベースを構築する場合

4. **有料プラン導入**:
   - 課金システムを導入し、利用量に応じた料金体系を実装する場合

現時点では、シンプルさとユーザー自身によるデータ管理の透明性を優先し、データベース不要のアプローチを採用する。これにより、開発コストの低減とプライバシー保護の両立を図る。

## 13. RDB を用いた API キー管理・連携設計

### 13.1 API エンドポイント設計

| メソッド | パス                         | 概要                            | 備考     |
| -------- | ---------------------------- | ------------------------------- | -------- |
| GET      | /api/user/api-keys           | 登録済み API キー一覧取得       | 認証必須 |
| POST     | /api/user/api-keys           | API キー登録・更新              | 認証必須 |
| DELETE   | /api/user/api-keys/:provider | 指定プロバイダーの API キー削除 | 認証必須 |

- すべての API キー管理エンドポイントは`Authorization: Bearer <token>`必須
- トークンは RDB で有効期限付きで管理

### 13.2 暗号化実装例（Node.js/TypeScript）

```typescript
import crypto from "crypto";

const ENCRYPTION_KEY = process.env.API_KEY_SECRET!; // 32バイト
const IV_LENGTH = 16;

export function encrypt(text: string): string {
  const iv = crypto.randomBytes(IV_LENGTH);
  const cipher = crypto.createCipheriv(
    "aes-256-cbc",
    Buffer.from(ENCRYPTION_KEY),
    iv
  );
  let encrypted = cipher.update(text, "utf8");
  encrypted = Buffer.concat([encrypted, cipher.final()]);
  return iv.toString("hex") + ":" + encrypted.toString("hex");
}

export function decrypt(text: string): string {
  const [ivHex, encryptedHex] = text.split(":");
  const iv = Buffer.from(ivHex, "hex");
  const encryptedText = Buffer.from(encryptedHex, "hex");
  const decipher = crypto.createDecipheriv(
    "aes-256-cbc",
    Buffer.from(ENCRYPTION_KEY),
    iv
  );
  let decrypted = decipher.update(encryptedText);
  decrypted = Buffer.concat([decrypted, decipher.final()]);
  return decrypted.toString("utf8");
}
```

- `.env`に`API_KEY_SECRET=32文字のランダム英数字`を必ず設定

### 13.3 バックエンド API 実装例（Express/TypeScript）

```typescript
// APIキー登録・更新
app.post("/api/user/api-keys", authMiddleware, async (req, res) => {
  const { provider, apiKey } = req.body;
  const userId = req.user.id;
  const encrypted = encrypt(apiKey);
  await pool.query(
    `INSERT INTO user_api_keys (user_id, provider, api_key)
     VALUES ($1, $2, $3)
     ON CONFLICT (user_id, provider) DO UPDATE SET api_key = $3, updated_at = NOW()`,
    [userId, provider, encrypted]
  );
  res.json({ success: true });
});

// APIキー取得
app.get("/api/user/api-keys", authMiddleware, async (req, res) => {
  const userId = req.user.id;
  const result = await pool.query(
    `SELECT provider, api_key FROM user_api_keys WHERE user_id = $1`,
    [userId]
  );
  const keys = result.rows.map((row) => ({
    provider: row.provider,
    apiKey: decrypt(row.api_key),
  }));
  res.json(keys);
});

// APIキー削除
app.delete("/api/user/api-keys/:provider", authMiddleware, async (req, res) => {
  const userId = req.user.id;
  const provider = req.params.provider;
  await pool.query(
    `DELETE FROM user_api_keys WHERE user_id = $1 AND provider = $2`,
    [userId, provider]
  );
  res.json({ success: true });
});
```

### 13.4 フロント連携設計

- **マイページ/設定画面**に「API キー管理」セクション
  - 各プロバイダー（OpenAI, Gemini, Claude 等）ごとに
    - API キーの登録・更新フォーム
    - 現在の登録状況表示
    - 削除ボタン

#### フロントエンドの API 呼び出し例（Next.js/React）

```typescript
// APIキー登録
await fetch("/api/user/api-keys", {
  method: "POST",
  headers: {
    "Content-Type": "application/json",
    Authorization: `Bearer ${token}`,
  },
  body: JSON.stringify({ provider: "openai", apiKey: "sk-..." }),
});

// APIキー取得
const res = await fetch("/api/user/api-keys", {
  headers: { Authorization: `Bearer ${token}` },
});
const keys = await res.json();

// APIキー削除
await fetch("/api/user/api-keys/openai", {
  method: "DELETE",
  headers: { Authorization: `Bearer ${token}` },
});
```

### 13.5 セキュリティ・運用上の注意

- 暗号化鍵（API_KEY_SECRET）は**絶対に Git 等に含めず、環境変数で管理**
- API キーの復号は**必要な時のみ**（外部 API リクエスト直前のみ）
- トークン失効・有効期限切れ時は**401 エラー**で即時拒否
- 監査ログやアクセスログも必要に応じて実装

## 14. DB マイグレーションスクリプト例

### 14.1 PostgreSQL 用マイグレーション例

```sql
-- ユーザートークン管理テーブル
CREATE TABLE user_tokens (
  id SERIAL PRIMARY KEY,
  user_id VARCHAR(64) NOT NULL,
  token VARCHAR(256) NOT NULL,
  expires_at TIMESTAMP NOT NULL, -- 30日後
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(user_id, token)
);

-- APIキー管理テーブル
CREATE TABLE user_api_keys (
  id SERIAL PRIMARY KEY,
  user_id VARCHAR(64) NOT NULL,
  provider VARCHAR(32) NOT NULL, -- 'openai', 'gemini', 'claude' など
  api_key TEXT NOT NULL,         -- 暗号化済みAPIキー
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(user_id, provider)
);
```

---

## 15. フロントエンド UI 設計詳細

### 15.1 API キー管理画面（マイページ/設定）

- **セクション名例**：「外部 AI API キー管理」
- **UI 要素例**：
  - 各プロバイダーごとにカードまたはリスト表示
    - プロバイダー名（OpenAI, Gemini, Claude など）
    - API キー入力欄（type="password"、マスキング表示）
    - 「登録/更新」ボタン
    - 「削除」ボタン
    - 現在の登録状況（例：「登録済み」「未登録」）
  - API キーの説明・注意書き（例：「API キーは暗号化され安全に保存されます」）
  - 保存・削除時はトースト通知でフィードバック

#### 画面レイアウト例（擬似コード）

```tsx
// Next.js + React + shadcn/ui, Tailwind CSS想定

<section className="max-w-xl mx-auto p-4">
  <h2 className="text-lg font-bold mb-4">外部AI APIキー管理</h2>
  {providers.map((provider) => (
    <div key={provider} className="mb-6 border rounded p-4">
      <div className="flex items-center mb-2">
        <span className="font-semibold mr-2">{providerNameMap[provider]}</span>
        {apiKeys[provider] ? (
          <span className="text-green-600 text-xs">登録済み</span>
        ) : (
          <span className="text-gray-400 text-xs">未登録</span>
        )}
      </div>
      <input
        type="password"
        className="input input-bordered w-full mb-2"
        value={inputValues[provider] || ""}
        onChange={(e) => setInputValue(provider, e.target.value)}
        placeholder="APIキーを入力"
      />
      <div className="flex gap-2">
        <button
          onClick={() => handleSave(provider)}
          className="btn btn-primary"
        >
          登録/更新
        </button>
        {apiKeys[provider] && (
          <button
            onClick={() => handleDelete(provider)}
            className="btn btn-error"
          >
            削除
          </button>
        )}
      </div>
    </div>
  ))}
  <p className="text-xs text-gray-500 mt-4">
    APIキーは暗号化され安全に保存されます。キーは必要な時のみ復号されます。
  </p>
</section>
```

- **UX ポイント**：
  - 入力欄は type="password"でマスキング
  - 保存・削除時はローディング/完了トースト表示
  - API キーはフロントで保持せず、都度 API 経由で取得/更新/削除
  - エラー時は明確なメッセージ表示

---

これにより、**DB マイグレーション・フロント UI 設計**もドキュメント化されました。
