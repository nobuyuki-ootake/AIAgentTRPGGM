# ProgressSnackbar 使用方法

## 概要

`ProgressSnackbar`は、長時間の処理（AI 生成、ファイルアップロード、データ処理など）の進行状況をユーザーに表示するためのコンポーネントです。

## 主な機能

- **進行状況表示**: 数値による進捗率表示
- **無限プログレスバー**: 進捗が不明な処理での読み込み表示
- **位置指定**: 画面の任意の位置に表示可能
- **自動非表示無効**: ユーザーの操作でのみ閉じる
- **カスタムアクション**: 独自のボタンやアクションを追加可能

## プロパティ

```typescript
interface ProgressSnackbarProps {
  open: boolean; // 表示状態
  message: string; // 表示メッセージ
  severity: AlertProps["severity"]; // 重要度（info, success, warning, error）
  progress?: number; // 進捗率 (0-100)
  loading?: boolean; // 読み込み中フラグ
  onClose: () => void; // 閉じる処理
  action?: React.ReactNode; // カスタムアクション
  position?: string; // 表示位置
  offsetY?: number; // Y軸オフセット
}
```

## 使用例

### 1. AI 処理の進行状況表示（WritingPage）

```typescript
const [aiProgress, setAiProgress] = useState<number | undefined>(undefined);
const [showProgressSnackbar, setShowProgressSnackbar] = useState(false);

// AI処理開始時
useEffect(() => {
  if (isAiProcessing) {
    setShowProgressSnackbar(true);
    setAiProgress(undefined); // 無限プログレスバーから開始

    // 進行状況の更新
    const progressInterval = setInterval(() => {
      setAiProgress((prev) => {
        if (prev === undefined) return 10;
        if (prev >= 90) return prev;
        return prev + Math.random() * 20;
      });
    }, 1000);

    return () => clearInterval(progressInterval);
  } else {
    setShowProgressSnackbar(false);
    setAiProgress(undefined);
  }
}, [isAiProcessing]);

// コンポーネント内
<ProgressSnackbar
  open={showProgressSnackbar}
  message="AIが章を執筆しています..."
  severity="info"
  progress={aiProgress}
  loading={isAiProcessing}
  onClose={handleCloseProgressSnackbar}
  position="bottom-right"
/>;
```

### 2. キャラクター生成の進行状況（CharactersPage）

```typescript
const [isAIProcessing, setIsAIProcessing] = useState(false);
const [aiProgress, setAiProgress] = useState<number | undefined>(undefined);
const [showProgressSnackbar, setShowProgressSnackbar] = useState(false);
const [currentGeneratingCharacter, setCurrentGeneratingCharacter] =
  useState<string>("");

// AI処理開始時の処理
useEffect(() => {
  if (isAIProcessing) {
    setShowProgressSnackbar(true);
    setAiProgress(undefined); // 無限プログレスバーから開始

    // 模擬的な進行状況更新
    const progressInterval = setInterval(() => {
      setAiProgress((prev) => {
        if (prev === undefined) return 15;
        if (prev >= 85) return prev;
        return prev + Math.random() * 25;
      });
    }, 1500);

    return () => clearInterval(progressInterval);
  } else {
    setShowProgressSnackbar(false);
    setAiProgress(undefined);
    setCurrentGeneratingCharacter("");
  }
}, [isAIProcessing]);

// コンポーネント内
<ProgressSnackbar
  open={showProgressSnackbar}
  message={`AIが${currentGeneratingCharacter}を生成しています...`}
  severity="info"
  progress={aiProgress}
  loading={isAIProcessing}
  onClose={handleCloseProgressSnackbar}
  position="bottom-right"
/>;
```

### 3. 世界観生成の進行状況（WorldBuildingPage）

```typescript
const [isAIProcessing, setIsAIProcessing] = useState(false);
const [aiProgress, setAiProgress] = useState<number | undefined>(undefined);
const [showProgressSnackbar, setShowProgressSnackbar] = useState(false);

// AI処理開始時の処理
useEffect(() => {
  if (isAIProcessing) {
    setShowProgressSnackbar(true);
    setAiProgress(undefined); // 無限プログレスバーから開始

    // 模擬的な進行状況更新
    const progressInterval = setInterval(() => {
      setAiProgress((prev) => {
        if (prev === undefined) return 20;
        if (prev >= 80) return prev;
        return prev + Math.random() * 15;
      });
    }, 2000);

    return () => clearInterval(progressInterval);
  } else {
    setShowProgressSnackbar(false);
    setAiProgress(undefined);
  }
}, [isAIProcessing]);

// コンポーネント内
<ProgressSnackbar
  open={showProgressSnackbar}
  message={`AIが世界観を生成中です... ${
    aiProgress ? `${Math.round(aiProgress)}%` : ""
  }`}
  severity="info"
  progress={aiProgress}
  loading={isAIProcessing}
  onClose={handleCloseProgressSnackbar}
  position="top-center"
/>;
```

### 4. ファイルアップロードの進行状況

```typescript
<ProgressSnackbar
  open={uploadInProgress}
  message="ファイルをアップロード中..."
  severity="info"
  progress={uploadProgress}
  onClose={() => {}}
  position="bottom-center"
/>
```

### 5. エラー時の表示

```typescript
<ProgressSnackbar
  open={hasError}
  message="処理中にエラーが発生しました"
  severity="error"
  onClose={handleErrorClose}
  action={
    <Button color="inherit" size="small" onClick={handleRetry}>
      再試行
    </Button>
  }
/>
```

### 6. 成功時の表示

```typescript
<ProgressSnackbar
  open={isSuccess}
  message="処理が完了しました"
  severity="success"
  onClose={handleSuccessClose}
  position="top-center"
/>
```

## ベストプラクティス

### 1. 適切な位置の選択

- **bottom-right**: デフォルト、一般的な通知
- **bottom-center**: 重要な進行状況
- **top-center**: 成功・完了メッセージ

### 2. 進行状況の管理

```typescript
// 無限プログレスバー → 数値プログレスバーの切り替え
const [progress, setProgress] = useState<number | undefined>(undefined);

// 処理開始時は無限プログレスバー
setProgress(undefined);

// 進捗が分かる段階で数値に切り替え
setProgress(25);
```

### 3. エラーハンドリング

```typescript
const handleClose = () => {
  if (!loading) {
    setOpen(false);
  }
  // loading中は閉じることができない
};
```

### 4. メッセージの工夫

- 具体的で分かりやすいメッセージ
- 処理の種類に応じた適切な表現
- 必要に応じて残り時間の表示

## 技術的な詳細

### 1. 位置計算

コンポーネントは`position: fixed`を使用し、指定された位置に表示されます。

### 2. プログレスバーの種類

- `loading={true}`: 無限プログレスバー
- `progress={number}`: 数値プログレスバー

### 3. 自動非表示の無効化

`loading={true}`の場合、`onClose`が無効化され、ユーザーが閉じることができません。

## 注意事項

1. **削除防止**: このコンポーネントは重要な機能のため、削除しないでください
2. **型安全性**: 必須プロパティ（open, message, severity, onClose）は必ず指定してください
3. **パフォーマンス**: 長時間の処理では適切な進行状況更新を行ってください
4. **アクセシビリティ**: 適切な aria 属性とキーボードナビゲーションを考慮してください

## 関連コンポーネント

- `LoadingOverlay`: 全画面オーバーレイでの読み込み表示
- `ErrorDisplay`: エラー専用の表示コンポーネント
- `SearchableList`: 検索可能なリスト表示
