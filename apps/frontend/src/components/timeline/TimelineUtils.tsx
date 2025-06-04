import React from "react";
import { TRPGCharacter } from "@trpg-ai-gm/types";
import {
  Event as EventIcon,
  SportsKabaddi as BattleIcon,
  Hotel as RestIcon,
  Chat as DialogueIcon,
  Explore as JourneyIcon,
  EmojiObjects as DiscoveryIcon,
  Bolt as TurningPointIcon,
  Info as InfoIcon,
  HelpOutline as MysteryIcon,
  Build as SetupIcon,
  Celebration as CelebrationIcon,
} from "@mui/icons-material";

// キャラクターの役割に応じたアイコンとカラーを定義
export const getCharacterIcon = (character: TRPGCharacter) => {
  // TRPGCharacterはroleプロパティを持たないので、characterTypeで判定
  if (character.characterType === "PC") {
    return {
      color: "#FFD700", // ゴールド
      emoji: "👑",
    };
  } else {
    // NPC
    return {
      color: "#4169E1", // ロイヤルブルー
      emoji: "🙂",
    };
  }
};

// イベント種別の定義とアイコンマッピング
export const eventTypes = [
  { value: "battle", label: "戦闘/対立", iconComponent: BattleIcon },
  { value: "rest", label: "休息/平穏", iconComponent: RestIcon },
  { value: "dialogue", label: "会話/交渉", iconComponent: DialogueIcon },
  { value: "journey", label: "移動/探索", iconComponent: JourneyIcon },
  { value: "discovery", label: "発見/啓示", iconComponent: DiscoveryIcon },
  {
    value: "turning_point",
    label: "転換点/山場",
    iconComponent: TurningPointIcon,
  },
  { value: "info", label: "情報/説明", iconComponent: InfoIcon },
  { value: "mystery", label: "謎/サスペンス", iconComponent: MysteryIcon },
  { value: "setup", label: "伏線/準備", iconComponent: SetupIcon },
  { value: "celebration", label: "祝祭/解決", iconComponent: CelebrationIcon },
  { value: "other", label: "その他", iconComponent: EventIcon },
];

export const getEventTypeIconComponent = (
  eventType?: string
): React.ElementType => {
  const foundType = eventTypes.find((et) => et.value === eventType);
  return foundType ? foundType.iconComponent : EventIcon; // デフォルトは汎用イベントアイコン
};
