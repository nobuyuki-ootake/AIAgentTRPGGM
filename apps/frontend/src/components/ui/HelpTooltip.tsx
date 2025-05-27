import React from "react";
import { Tooltip, IconButton, Box } from "@mui/material";
import { HelpOutline as HelpIcon } from "@mui/icons-material";

export interface HelpTooltipProps {
  /**
   * ツールチップに表示するヒントテキスト
   */
  title: string;

  /**
   * ツールチップの配置位置
   * @default "top"
   */
  placement?:
    | "bottom-end"
    | "bottom-start"
    | "bottom"
    | "left-end"
    | "left-start"
    | "left"
    | "right-end"
    | "right-start"
    | "right"
    | "top-end"
    | "top-start"
    | "top";

  /**
   * アイコンのサイズ
   * @default "small"
   */
  size?: "small" | "medium" | "large";

  /**
   * アイコンの色
   * @default "action"
   */
  color?: "inherit" | "action" | "disabled" | "primary" | "secondary";

  /**
   * 追加のクラス名
   */
  className?: string;

  /**
   * インライン表示するかどうか
   * @default false
   */
  inline?: boolean;

  /**
   * ツールチップの最大幅
   * @default 300
   */
  maxWidth?: number;

  /**
   * ツールチップを開くまでの遅延時間（ミリ秒）
   * @default 500
   */
  enterDelay?: number;

  /**
   * ツールチップを閉じるまでの遅延時間（ミリ秒）
   * @default 200
   */
  leaveDelay?: number;
}

/**
 * ヒント機能を提供するツールチップコンポーネント
 * ?アイコンをホバーすることでヒントテキストを表示します
 */
export const HelpTooltip: React.FC<HelpTooltipProps> = ({
  title,
  placement = "top",
  size = "small",
  color = "action",
  className = "",
  inline = false,
  maxWidth = 300,
  enterDelay = 500,
  leaveDelay = 200,
}) => {
  const iconSize = {
    small: "0.875rem",
    medium: "1rem",
    large: "1.25rem",
  }[size];

  return (
    <Tooltip
      title={title}
      placement={placement}
      enterDelay={enterDelay}
      leaveDelay={leaveDelay}
      arrow
      className={className}
      componentsProps={{
        tooltip: {
          sx: {
            maxWidth: maxWidth,
            fontSize: "0.75rem",
            lineHeight: 1.4,
            padding: "8px 12px",
            backgroundColor: "rgba(97, 97, 97, 0.95)",
            "& .MuiTooltip-arrow": {
              color: "rgba(97, 97, 97, 0.95)",
            },
          },
        },
      }}
    >
      {inline ? (
        <Box
          component="span"
          sx={{
            display: "inline-flex",
            alignItems: "center",
            cursor: "help",
            ml: 0.5,
          }}
        >
          <HelpIcon
            color={color}
            sx={{
              fontSize: iconSize,
              transition: "all 0.2s ease-in-out",
              "&:hover": {
                transform: "scale(1.1)",
                color: color === "action" ? "primary.main" : undefined,
              },
            }}
          />
        </Box>
      ) : (
        <IconButton
          size="small"
          sx={{
            padding: "2px",
            "&:hover": {
              backgroundColor: "action.hover",
            },
          }}
        >
          <HelpIcon
            color={color}
            sx={{
              fontSize: iconSize,
              transition: "all 0.2s ease-in-out",
              "&:hover": {
                transform: "scale(1.1)",
                color: color === "action" ? "primary.main" : undefined,
              },
            }}
          />
        </IconButton>
      )}
    </Tooltip>
  );
};
