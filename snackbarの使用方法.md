# Snackbar の使用方法

## 概要

このプロジェクトでは、ユーザーへの通知やフィードバック表示に Snackbar コンポーネントを使用しています。

## 基本的な使用方法

### 1. 成功通知

```tsx
<Snackbar
  open={showSuccess}
  autoHideDuration={3000}
  onClose={() => setShowSuccess(false)}
>
  <Alert severity="success">操作が完了しました！</Alert>
</Snackbar>
```

### 2. エラー通知

```tsx
<Snackbar
  open={showError}
  autoHideDuration={6000}
  onClose={() => setShowError(false)}
>
  <Alert severity="error">エラーが発生しました</Alert>
</Snackbar>
```

### 3. プログレス表示（ProgressSnackbar）

```tsx
<ProgressSnackbar
  open={showProgress}
  message="処理中です..."
  severity="info"
  progress={progressValue}
  loading={isProcessing}
  onClose={() => setShowProgress(false)}
  position="bottom-right"
/>
```

## 注意事項とベストプラクティス

### 1. プログレスバーの表示タイミング

**問題**: AI アシストパネルが開いた瞬間からプログレスバーが表示される

**原因**: パネルを開く処理の中で、実際の生成処理開始前にプログレスバーの状態を初期化している

**解決方法**:

- パネル開始時にはプログレスバーを表示しない
- 実際の処理（AI 生成）が開始されたタイミングでプログレスバーを表示する
- `onProgress`コールバックの初回呼び出し時にプログレスバーを表示開始する

```tsx
// ❌ 悪い例：パネル開始時に即座に表示
const handleOpenAIAssist = async () => {
  // プログレスバーを即座に表示（ユーザーが混乱する）
  setShowProgressSnackbar(true);
  setIsAIProcessing(true);

  await openAIAssist(/* ... */);
};

// ✅ 良い例：実際の処理開始時に表示
const handleOpenAIAssist = async () => {
  await openAIAssist("characters", {
    onProgress: (current, total, currentCharacterName) => {
      // 初回のプログレス更新時にプログレスバーを表示開始
      if (!showProgressSnackbar) {
        setIsAIProcessing(true);
        setShowProgressSnackbar(true);
      }

      // プログレス更新処理
      const progress =
        total > 0 ? Math.round((current / total) * 100) : undefined;
      setProgressValue(progress);
      setProgressMessage(`処理中... (${current}/${total})`);
    },
    // ...
  });
};
```

### 2. 適切な表示時間

- 成功通知: 3 秒程度
- エラー通知: 6 秒程度（ユーザーが読む時間を考慮）
- プログレス表示: 処理完了まで、完了後は 2-3 秒で自動非表示

### 3. ユーザビリティの考慮

- 処理中はプログレスバーを閉じられないようにする
- 完了後は適切な成功/エラーメッセージを表示
- 複数の Snackbar が同時に表示されないよう制御する

## トラブルシューティング

### よくある問題

1. **プログレスバーが予期せず表示される**

   - 表示タイミングを確認し、実際の処理開始時のみ表示するよう修正

2. **Snackbar が閉じられない**

   - `loading`プロパティが true の間は閉じられない仕様を確認

3. **複数の Snackbar が重複表示される**
   - 状態管理を見直し、適切に前の Snackbar を閉じてから新しいものを表示
