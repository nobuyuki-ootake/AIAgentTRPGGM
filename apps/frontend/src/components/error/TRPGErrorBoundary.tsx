import React from "react";
import { ErrorBoundary } from "./ErrorBoundary";
import { Box, Typography, Button, Paper } from "@mui/material";
import { SportsEsports as DiceIcon, Campaign as CampaignIcon } from "@mui/material/icons";

interface TRPGErrorBoundaryProps {
  children: React.ReactNode;
  section: "campaign" | "character" | "timeline" | "worldbuilding" | "session" | "dice" | "ai";
  onError?: (error: Error, errorInfo: React.ErrorInfo) => void;
}

const getTRPGErrorMessages = (section: string) => {
  switch (section) {
    case "campaign":
      return {
        title: "キャンペーンデータエラー",
        message: "キャンペーンの読み込み中にエラーが発生しました。データが破損している可能性があります。",
        suggestions: [
          "キャンペーンデータのバックアップから復元する",
          "新しいキャンペーンを作成する",
          "データベースの整合性をチェックする",
        ],
      };
    case "character":
      return {
        title: "キャラクターデータエラー",
        message: "キャラクターシートの処理中にエラーが発生しました。",
        suggestions: [
          "キャラクターデータを再読み込みする",
          "キャラクターシートをリセットする",
          "能力値の計算を確認する",
        ],
      };
    case "timeline":
      return {
        title: "タイムラインエラー",
        message: "タイムラインイベントの処理中にエラーが発生しました。",
        suggestions: [
          "イベントデータを確認する",
          "タイムラインを再構築する",
          "イベントの依存関係をチェックする",
        ],
      };
    case "worldbuilding":
      return {
        title: "世界観構築エラー",
        message: "世界観データの処理中にエラーが発生しました。",
        suggestions: [
          "世界観データを再読み込みする",
          "データの整合性を確認する",
          "マップデータをリセットする",
        ],
      };
    case "session":
      return {
        title: "セッションエラー",
        message: "TRPGセッションの実行中にエラーが発生しました。",
        suggestions: [
          "セッション状態を保存する",
          "プレイヤーの接続を確認する",
          "ゲーム状態をリセットする",
        ],
      };
    case "dice":
      return {
        title: "ダイスロールエラー",
        message: "ダイスの処理中にエラーが発生しました。",
        suggestions: [
          "ダイス設定を確認する",
          "乱数生成器をリセットする",
          "手動でダイス結果を入力する",
        ],
      };
    case "ai":
      return {
        title: "AIアシスタントエラー",
        message: "AI機能の処理中にエラーが発生しました。",
        suggestions: [
          "AIサービスの接続を確認する",
          "APIキーを再設定する",
          "手動で内容を入力する",
        ],
      };
    default:
      return {
        title: "TRPGシステムエラー",
        message: "TRPGシステムでエラーが発生しました。",
        suggestions: [
          "アプリケーションを再読み込みする",
          "データを確認する",
          "システム管理者に連絡する",
        ],
      };
  }
};

const TRPGErrorFallback: React.FC<{
  section: string;
  onRetry: () => void;
  onGoHome: () => void;
}> = ({ section, onRetry, onGoHome }) => {
  const errorInfo = getTRPGErrorMessages(section);

  return (
    <Box sx={{ p: 3, textAlign: "center" }}>
      <Paper elevation={2} sx={{ p: 4, maxWidth: 600, mx: "auto" }}>
        <Box sx={{ mb: 3 }}>
          {section === "dice" ? (
            <DiceIcon sx={{ fontSize: 48, color: "error.main", mb: 2 }} />
          ) : (
            <CampaignIcon sx={{ fontSize: 48, color: "error.main", mb: 2 }} />
          )}
        </Box>

        <Typography variant="h5" gutterBottom color="error">
          {errorInfo.title}
        </Typography>

        <Typography variant="body1" sx={{ mb: 3 }}>
          {errorInfo.message}
        </Typography>

        <Box sx={{ mb: 3, textAlign: "left" }}>
          <Typography variant="h6" gutterBottom>
            推奨される対処法:
          </Typography>
          <ul>
            {errorInfo.suggestions.map((suggestion, index) => (
              <li key={index}>
                <Typography variant="body2">{suggestion}</Typography>
              </li>
            ))}
          </ul>
        </Box>

        <Box sx={{ display: "flex", gap: 2, justifyContent: "center" }}>
          <Button variant="contained" onClick={onRetry}>
            再試行
          </Button>
          <Button variant="outlined" onClick={onGoHome}>
            ホームに戻る
          </Button>
        </Box>
      </Paper>
    </Box>
  );
};

export const TRPGErrorBoundary: React.FC<TRPGErrorBoundaryProps> = ({
  children,
  section,
  onError,
}) => {
  const handleError = (error: Error, errorInfo: React.ErrorInfo) => {
    // Log TRPG-specific error context
    console.error(`TRPG ${section} Error:`, {
      section,
      error: error.message,
      stack: error.stack,
      componentStack: errorInfo.componentStack,
      timestamp: new Date().toISOString(),
    });

    // Call parent error handler if provided
    if (onError) {
      onError(error, errorInfo);
    }
  };

  return (
    <ErrorBoundary
      section={`TRPG ${section}`}
      onError={handleError}
      showDetails={process.env.NODE_ENV === "development"}
      fallback={
        <TRPGErrorFallback
          section={section}
          onRetry={() => window.location.reload()}
          onGoHome={() => (window.location.href = "/")}
        />
      }
    >
      {children}
    </ErrorBoundary>
  );
};

export default TRPGErrorBoundary;