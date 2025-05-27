import React from "react";
import {
  Star as StarIcon,
  Psychology as PsychologyIcon,
  EmojiPeople as EmojiPeopleIcon,
  Person as PersonIcon,
} from "@mui/icons-material";
import { SvgIconProps } from "@mui/material";

/**
 * キャラクターアイコンの設定インターフェース
 */
export interface CharacterIconConfig {
  icon: React.ComponentType<SvgIconProps>;
  color: string;
  emoji: string;
  label: string;
}

/**
 * キャラクターの役割に応じたアイコンとカラーの定義
 */
export const characterIcons: Record<string, CharacterIconConfig> = {
  protagonist: {
    icon: StarIcon,
    color: "#FFD700", // ゴールド
    emoji: "👑",
    label: "主人公",
  },
  antagonist: {
    icon: PsychologyIcon,
    color: "#DC143C", // クリムゾン
    emoji: "😈",
    label: "敵役",
  },
  supporting: {
    icon: EmojiPeopleIcon,
    color: "#4169E1", // ロイヤルブルー
    emoji: "🙂",
    label: "脇役",
  },
  default: {
    icon: PersonIcon,
    color: "#808080", // グレー
    emoji: "👤",
    label: "その他",
  },
};

/**
 * 利用可能な絵文字リスト
 */
export const availableEmojis = [
  "👑",
  "😈",
  "🙂",
  "👤",
  "🦸",
  "🦹",
  "🧙",
  "👸",
  "🤴",
  "👩‍🚀",
  "👨‍🚀",
  "👩‍🔬",
  "👨‍🔬",
  "🧝",
  "🧛",
  "🧟",
  "🧞",
  "🥷",
  "🧚",
  "🧜",
  "🧝‍♀️",
  "🧙‍♂️",
  "🦊",
  "🐱",
  "🐶",
  "🐺",
  "🦁",
  "🐯",
];

/**
 * 絵文字をデータURLに変換する
 */
export const emojiToDataUrl = (emoji: string): string => {
  return `data:text/plain;charset=utf-8,${encodeURIComponent(emoji)}`;
};

/**
 * データURLから絵文字を抽出する
 */
export const dataUrlToEmoji = (dataUrl: string): string | null => {
  if (!dataUrl || !dataUrl.startsWith("data:text/plain;charset=utf-8,")) {
    return null;
  }
  return decodeURIComponent(dataUrl.split(",")[1]);
};
