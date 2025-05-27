import React, { useState } from "react";
import { Button } from "./button";
import { Wand } from "lucide-react";
import { Spinner } from "./spinner";
import { HelpTooltip } from "./HelpTooltip";

export interface AIAssistButtonProps {
  /**
   * ボタンクリック時に実行される関数
   * プロミスを返す必要があります
   */
  onAssist: () => Promise<void>;

  /**
   * ボタンのテキスト
   * @default "AIに項目を埋めてもらう"
   */
  text?: string;

  /**
   * ボタンのバリアント
   * @default "outline"
   */
  variant?:
    | "default"
    | "destructive"
    | "outline"
    | "secondary"
    | "ghost"
    | "link";

  /**
   * ボタンの幅
   * @default "auto"
   */
  width?: string;

  /**
   * ボタンを無効にするかどうか
   * @default false
   */
  disabled?: boolean;

  /**
   * 追加のクラス名
   */
  className?: string;

  /**
   * 外部からローディング状態を制御する場合に指定
   * @default false
   */
  isLoading?: boolean;

  /**
   * ヒントテキスト（ツールチップに表示）
   */
  helpText?: string;

  /**
   * ヒントを表示するかどうか
   * @default false
   */
  showHelp?: boolean;
}

/**
 * AIアシスタントボタンコンポーネント
 * フォームやモーダルで使用するための共通ボタン
 */
export const AIAssistButton: React.FC<AIAssistButtonProps> = ({
  onAssist,
  text = "AIに項目を埋めてもらう",
  variant = "outline",
  width = "auto",
  disabled = false,
  className = "",
  isLoading: externalIsLoading,
  helpText,
  showHelp = false,
}) => {
  const [internalIsLoading, setInternalIsLoading] = useState(false);
  const [isHovered, setIsHovered] = useState(false);
  const effectiveIsLoading =
    externalIsLoading !== undefined ? externalIsLoading : internalIsLoading;

  const handleClick = async () => {
    if (effectiveIsLoading) return;

    setInternalIsLoading(true);
    try {
      await onAssist();
    } catch (error) {
      console.error("AIアシスト処理エラー:", error);
    } finally {
      setInternalIsLoading(false);
    }
  };

  const buttonContent = (
    <Button
      variant={variant}
      onClick={handleClick}
      disabled={disabled || effectiveIsLoading}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      className={`
        flex items-center gap-2 
        transition-all duration-200 ease-in-out
        ${effectiveIsLoading ? "animate-pulse" : ""}
        ${
          isHovered && !effectiveIsLoading
            ? "transform scale-105 shadow-lg"
            : ""
        }
        ${width === "full" ? "w-full" : ""} 
        ${className}
      `}
      style={{
        transform:
          isHovered && !effectiveIsLoading ? "scale(1.05)" : "scale(1)",
        transition: "transform 0.2s ease-in-out, box-shadow 0.2s ease-in-out",
      }}
    >
      <span
        className={`
          transition-transform duration-200 ease-in-out
          ${effectiveIsLoading ? "animate-spin" : ""}
          ${isHovered && !effectiveIsLoading ? "transform rotate-12" : ""}
        `}
      >
        {effectiveIsLoading ? (
          <Spinner className="h-4 w-4" />
        ) : (
          <Wand className="h-4 w-4" />
        )}
      </span>
      <span className="transition-all duration-200 ease-in-out">
        {effectiveIsLoading ? "AI生成中..." : text}
      </span>
      {showHelp && helpText && (
        <HelpTooltip title={helpText} placement="top" inline size="small" />
      )}
    </Button>
  );

  return buttonContent;
};
