/**
 * ProgressSnackbar - 進行状況表示コンポーネント
 *
 * 【重要】このコンポーネントは削除しないでください
 *
 * 用途:
 * - AI生成処理の進行状況表示
 * - ファイルアップロードの進行状況表示
 * - 長時間処理のユーザーフィードバック
 *
 * 使用箇所:
 * - WritingPage: AI章執筆の進行状況
 * - その他の長時間処理が必要な画面
 *
 * 特徴:
 * - 数値進捗率表示と無限プログレスバーの両方に対応
 * - 位置指定可能（bottom-right, bottom-center, top-center等）
 * - loading中は強制的に表示継続（ユーザーが閉じることができない）
 * - カスタムアクション（ボタン等）の追加可能
 */
import React from "react";
import {
  Alert,
  AlertProps,
  LinearProgress,
  Box,
  Button,
  IconButton,
  Paper,
} from "@mui/material";
import { Close as CloseIcon } from "@mui/icons-material";

interface ProgressSnackbarProps {
  open: boolean;
  message: string;
  severity: AlertProps["severity"];
  progress?: number; // 進捗率 (0-100)
  loading?: boolean; // 読み込み中かどうか
  onClose: () => void;
  action?: React.ReactNode; // カスタムアクション（ボタンなど）
  position?:
    | "bottom-right"
    | "bottom-left"
    | "top-right"
    | "top-left"
    | "bottom-center"
    | "top-center"; // 表示位置
  offsetY?: number; // 追加のY軸オフセット（単位: px）
}

/**
 * プログレスバー付きのSnackbarコンポーネント
 * - loading=true の場合は無限プログレスバー表示
 * - progress に値が設定されている場合は進捗率を表示
 * - 常にユーザーのインタラクションでのみ閉じる
 * - 自動非表示を完全に無効化
 */
export const ProgressSnackbar: React.FC<ProgressSnackbarProps> = ({
  open,
  message,
  severity = "info",
  progress,
  loading = false,
  onClose,
  action,
  position = "bottom-right", // デフォルトは右下
  offsetY = 0, // デフォルトは追加オフセットなし
}) => {
  // 閉じるボタンの表示内容をseverityに応じて変更
  const defaultAction =
    severity === "error" ? (
      <Button color="inherit" size="small" onClick={onClose}>
        閉じる
      </Button>
    ) : (
      <IconButton size="small" color="inherit" onClick={onClose}>
        <CloseIcon fontSize="small" />
      </IconButton>
    );

  // 進捗バーを表示するかどうか
  const showProgress = loading || typeof progress === "number";

  // ロード中はonCloseを無効化（閉じるボタンをクリックしても閉じない）
  const handleClose = loading ? undefined : onClose;

  // 表示されていない場合は何も描画しない
  if (!open) return null;

  // 位置に応じたスタイルを設定
  const getPositionStyle = () => {
    switch (position) {
      case "bottom-left":
        return { bottom: 16 + offsetY, left: 16 };
      case "top-right":
        return { top: 16 + offsetY, right: 16 };
      case "top-left":
        return { top: 16 + offsetY, left: 16 };
      case "bottom-center":
        return {
          bottom: 16 + offsetY,
          left: "50%",
          transform: "translateX(-50%)",
        };
      case "top-center":
        return {
          top: 16 + offsetY,
          left: "50%",
          transform: "translateX(-50%)",
        };
      case "bottom-right":
      default:
        return { bottom: 16 + offsetY, right: 16 };
    }
  };

  return (
    <Paper
      sx={{
        position: "fixed",
        zIndex: 2000,
        maxWidth: "90%",
        boxShadow: 3,
        ...getPositionStyle(),
      }}
    >
      <Alert
        onClose={handleClose}
        severity={severity}
        variant="filled"
        sx={{ width: "100%" }}
        action={action || defaultAction}
      >
        <Box sx={{ width: "100%" }}>
          {message}
          {showProgress && (
            <Box sx={{ width: "100%", mt: 1 }}>
              <LinearProgress
                variant={
                  typeof progress === "number" ? "determinate" : "indeterminate"
                }
                value={typeof progress === "number" ? progress : undefined}
              />
            </Box>
          )}
        </Box>
      </Alert>
    </Paper>
  );
};
