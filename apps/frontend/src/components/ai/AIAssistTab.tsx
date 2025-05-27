import React, { useState } from "react";
import {
  Box,
  Typography,
  TextField,
  Button,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Checkbox,
  FormControlLabel,
  LinearProgress,
  Alert,
  Snackbar,
} from "@mui/material";
import { useRecoilValue, useRecoilState } from "recoil";
import { aiChatContextState, currentProjectState } from "../../store/atoms";
import { PlotElement } from "@novel-ai-assistant/types";
import { HelpTooltip } from "../ui/HelpTooltip";
import {
  generateSynopsisContent,
  generateCharacterContent,
  generatePlotContent,
  generateWorldBuildingContent,
  generateTimelineContent,
  generateGenericContent,
} from "../../utils/aiGenerationHelpers";

// エラーの種類を定義
type ErrorType = "network" | "validation" | "ai_service" | "unknown";

interface AIError {
  type: ErrorType;
  message: string;
  details?: string;
}

// API エラーの型定義
interface APIError extends Error {
  status?: number;
  code?: string;
  details?: string;
}

// 型ガード関数
const isAPIError = (error: unknown): error is APIError => {
  return error instanceof Error && ("status" in error || "code" in error);
};

export const AIAssistTab: React.FC = () => {
  const [context, setContext] = useRecoilState(aiChatContextState);
  const currentProject = useRecoilValue(currentProjectState);
  const [userInput, setUserInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [batchGeneration, setBatchGeneration] = useState(false);
  const [error, setError] = useState<AIError | null>(null);
  const [showSuccess, setShowSuccess] = useState(false);

  const { assistConfig } = context;

  // エラーメッセージの生成
  const getErrorMessage = (error: AIError): string => {
    switch (error.type) {
      case "network":
        return "ネットワークエラーが発生しました。インターネット接続を確認してください。";
      case "validation":
        return "入力内容に問題があります。内容を確認してください。";
      case "ai_service":
        return "AI サービスでエラーが発生しました。しばらく時間をおいて再試行してください。";
      default:
        return "予期しないエラーが発生しました。";
    }
  };

  // エラーのクリア
  const clearError = () => setError(null);

  // 入力値の検証
  const validateInput = (): AIError | null => {
    if (!assistConfig) {
      return {
        type: "validation",
        message: "アシスト設定が見つかりません。",
      };
    }

    if (!assistConfig.defaultMessage && !userInput.trim()) {
      return {
        type: "validation",
        message: "プロンプトまたは追加指示を入力してください。",
      };
    }

    return null;
  };

  // アシスト設定がない場合の表示
  if (!assistConfig) {
    return (
      <Box sx={{ p: 2, textAlign: "center" }}>
        <Typography color="text.secondary">
          アシスト機能を使用するには、各画面のAIアシストボタンをクリックしてください。
        </Typography>
      </Box>
    );
  }

  // 生成処理
  const handleGenerate = async () => {
    // エラーをクリア
    clearError();

    // 入力値の検証
    const validationError = validateInput();
    if (validationError) {
      setError(validationError);
      return;
    }

    if (!assistConfig.onGenerate && !assistConfig.onComplete) {
      setError({
        type: "validation",
        message: "生成機能が設定されていません。",
      });
      return;
    }

    setIsLoading(true);
    setProgress(0);

    let progressInterval: NodeJS.Timeout | null = null;

    try {
      // プログレス更新のシミュレーション
      progressInterval = setInterval(() => {
        setProgress((prev) => Math.min(prev + 10, 90));
      }, 200);

      if (assistConfig.onGenerate) {
        // WritingPage用の特別処理
        await assistConfig.onGenerate({
          message: userInput || assistConfig.defaultMessage,
          customControls: assistConfig.customControls,
          batchGeneration,
        });
      } else if (assistConfig.onComplete) {
        // 他の画面用の処理 - 実際のAI API呼び出しを実装
        let result;
        const message = userInput || assistConfig.defaultMessage;

        // ページコンテキストに応じてAPIを呼び出し
        const projectDataAsRecord = context.projectData
          ? (context.projectData as unknown as Record<string, unknown>)
          : {};

        switch (context.pageContext) {
          case "synopsis":
            // あらすじ生成の場合
            result = await generateSynopsisContent(
              message,
              projectDataAsRecord
            );
            break;
          case "characters":
            // キャラクター生成の場合
            result = await generateCharacterContent(
              message,
              projectDataAsRecord,
              batchGeneration
            );
            break;
          case "plot":
            // プロット生成の場合
            result = await generatePlotContent(message, projectDataAsRecord);
            break;
          case "worldbuilding":
            // 世界観生成の場合
            result = await generateWorldBuildingContent(
              message,
              projectDataAsRecord,
              batchGeneration
            );
            break;
          case "timeline":
            // タイムライン生成の場合
            result = await generateTimelineContent(
              message,
              projectDataAsRecord
            );
            break;
          default:
            // その他の場合は汎用的なAI応答
            result = await generateGenericContent(message, projectDataAsRecord);
            break;
        }

        assistConfig.onComplete({
          content: result,
          metadata: {
            pageContext: context.pageContext,
            timestamp: new Date().toISOString(),
          },
        });
      }

      setProgress(100);
      setShowSuccess(true);

      // 完了後にチャットタブに切り替え
      setTimeout(() => {
        setContext((prev) => ({ ...prev, mode: "chat" }));
      }, 1000);
    } catch (error: unknown) {
      console.error("AI生成エラー:", error);

      // エラーの種類を判定
      let errorType: ErrorType = "unknown";
      const errorMessage = "予期しないエラーが発生しました。";

      if (isAPIError(error)) {
        if (error.status === 400 || error.code === "VALIDATION_ERROR") {
          errorType = "validation";
        } else if (
          (error.status && error.status >= 500) ||
          error.code === "AI_SERVICE_ERROR"
        ) {
          errorType = "ai_service";
        } else {
          errorType = "network";
        }

        setError({
          type: errorType,
          message: error.message || errorMessage,
          details: error.details,
        });
      } else {
        setError({
          type: errorType,
          message: errorMessage,
        });
      }
    } finally {
      if (progressInterval) {
        clearInterval(progressInterval);
      }
      setIsLoading(false);
      setProgress(0);
    }
  };

  // カスタムコントロールの更新
  const updateCustomControl = (key: string, value: unknown) => {
    setContext((prev) => ({
      ...prev,
      assistConfig: {
        ...prev.assistConfig!,
        customControls: {
          ...prev.assistConfig!.customControls,
          [key]: value,
        },
      },
    }));
  };

  return (
    <Box sx={{ p: 2 }}>
      {/* タイトルと説明 */}
      <Typography variant="h6" gutterBottom>
        {assistConfig.title}
      </Typography>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
        {assistConfig.description}
      </Typography>

      {/* エラー表示 */}
      {error && (
        <Alert severity="error" sx={{ mb: 2 }} onClose={clearError}>
          <Typography variant="body2" fontWeight="medium">
            {getErrorMessage(error)}
          </Typography>
          {error.details && (
            <Typography variant="caption" sx={{ mt: 1, display: "block" }}>
              詳細: {error.details}
            </Typography>
          )}
        </Alert>
      )}

      {/* デフォルトプロンプト表示 */}
      {assistConfig.defaultMessage && (
        <Box
          sx={{ mb: 2, p: 2, bgcolor: "background.default", borderRadius: 1 }}
        >
          <Typography variant="caption" color="text.secondary">
            基本プロンプト:
          </Typography>
          <Typography variant="body2" sx={{ mt: 1, whiteSpace: "pre-wrap" }}>
            {assistConfig.defaultMessage}
          </Typography>
        </Box>
      )}

      {/* カスタムコントロール */}
      {assistConfig.customControls && (
        <Box sx={{ mb: 2 }}>
          {/* 章の長さ設定（WritingPage用） */}
          {assistConfig.customControls.targetLength !== undefined && (
            <FormControl fullWidth sx={{ mb: 2 }}>
              <InputLabel>
                章の長さ
                <HelpTooltip
                  title="短め: 1000-2000文字程度&#10;普通: 2000-4000文字程度&#10;長め: 4000文字以上&#10;&#10;指定なしの場合、AIが文脈に応じて適切な長さを決定します"
                  placement="right"
                  inline
                  size="small"
                />
              </InputLabel>
              <Select
                value={assistConfig.customControls.targetLength || ""}
                label="章の長さ"
                onChange={(e) =>
                  updateCustomControl("targetLength", e.target.value)
                }
                disabled={isLoading}
              >
                <MenuItem value="">
                  <em>指定なし</em>
                </MenuItem>
                <MenuItem value="short">短め</MenuItem>
                <MenuItem value="medium">普通</MenuItem>
                <MenuItem value="long">長め</MenuItem>
              </Select>
            </FormControl>
          )}

          {/* プロット選択 */}
          {assistConfig.customControls.plotSelection &&
            currentProject?.plot && (
              <FormControl fullWidth sx={{ mb: 2 }}>
                <InputLabel>
                  関連プロット (任意)
                  <HelpTooltip
                    title="特定のプロット要素に関連する内容を生成したい場合に選択してください。&#10;選択したプロットの内容を参考にして、より一貫性のある生成を行います。"
                    placement="right"
                    inline
                    size="small"
                  />
                </InputLabel>
                <Select label="関連プロット (任意)" disabled={isLoading}>
                  <MenuItem value="">
                    <em>指定なし</em>
                  </MenuItem>
                  {currentProject.plot.map((plot: PlotElement) => (
                    <MenuItem key={plot.id} value={plot.id}>
                      {plot.title}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            )}
        </Box>
      )}

      {/* ユーザー入力 */}
      <Box sx={{ mb: 2 }}>
        <Box sx={{ display: "flex", alignItems: "center", mb: 1 }}>
          <Typography variant="body2" component="label">
            追加の指示 (任意)
          </Typography>
          <HelpTooltip
            title="効果的な指示の例：&#10;• 「明るく前向きなキャラクターにして」&#10;• 「中世ヨーロッパ風の設定で」&#10;• 「主人公との関係性を重視して」&#10;• 「コメディ要素を含めて」&#10;&#10;具体的で明確な指示ほど、期待に近い結果が得られます。"
            placement="top"
            maxWidth={300}
            inline
          />
        </Box>
        <TextField
          fullWidth
          multiline
          rows={4}
          placeholder="AIへの追加指示を入力してください..."
          value={userInput}
          onChange={(e) => setUserInput(e.target.value)}
          disabled={isLoading}
          error={error?.type === "validation"}
          helperText={error?.type === "validation" ? error.message : ""}
        />
      </Box>

      {/* バッチ生成オプション */}
      {assistConfig.supportsBatchGeneration && (
        <FormControlLabel
          control={
            <Checkbox
              checked={batchGeneration}
              onChange={(e) => setBatchGeneration(e.target.checked)}
              disabled={isLoading}
            />
          }
          label={
            <Box sx={{ display: "flex", alignItems: "center" }}>
              1つずつ詳細に生成（より詳細な情報を取得）
              <HelpTooltip
                title="チェックON: 各要素を個別に詳細生成（時間がかかるが高品質）&#10;チェックOFF: 複数要素を一括生成（高速だが簡潔）&#10;&#10;例：キャラクター3人の場合&#10;ON → 1人ずつ詳細な背景・性格・関係性を生成&#10;OFF → 3人を一度に基本情報のみ生成"
                placement="top"
                maxWidth={350}
                inline
              />
            </Box>
          }
          sx={{ mb: 2 }}
        />
      )}

      {/* プログレス表示 */}
      {isLoading && (
        <Box sx={{ mb: 2 }}>
          <LinearProgress variant="determinate" value={progress} />
          <Typography variant="caption" color="text.secondary" sx={{ mt: 1 }}>
            生成中... {progress}%
          </Typography>
        </Box>
      )}

      {/* アクションボタン */}
      <Box sx={{ display: "flex", gap: 1 }}>
        <Button
          variant="contained"
          onClick={handleGenerate}
          disabled={isLoading}
          fullWidth
        >
          {isLoading ? "生成中..." : "生成"}
        </Button>
        <Button
          variant="outlined"
          onClick={() => setContext((prev) => ({ ...prev, mode: "chat" }))}
          disabled={isLoading}
        >
          キャンセル
        </Button>
      </Box>

      {/* 成功通知スナックバー */}
      <Snackbar
        open={showSuccess}
        autoHideDuration={3000}
        onClose={() => setShowSuccess(false)}
        anchorOrigin={{ vertical: "bottom", horizontal: "center" }}
      >
        <Alert
          onClose={() => setShowSuccess(false)}
          severity="success"
          sx={{ width: "100%" }}
        >
          AI生成が完了しました！
        </Alert>
      </Snackbar>
    </Box>
  );
};
