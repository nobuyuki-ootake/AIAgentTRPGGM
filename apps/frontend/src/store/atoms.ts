import { NovelProject, PlaceElement } from "@novel-ai-assistant/types";
import {
  atom,
  // RecoilEnv, // 未使用のためコメントアウト (または削除)
  // DefaultValue, // 未使用のためコメントアウト
} from "recoil";

// 現在選択されているプロジェクトのID
export const currentProjectIdState = atom<string | null>({
  key: "currentProjectId",
  default: null,
});

// 現在のプロジェクト
export const currentProjectState = atom<NovelProject | null>({
  key: "currentProject",
  default: null,
});

// アプリの現在のモード（プロット、キャラクター、章など）
export type AppMode =
  | "synopsis"
  | "plot"
  | "characters"
  | "worldbuilding"
  | "timeline"
  | "writing"
  | "feedback";

export const appModeState = atom<AppMode>({
  key: "appMode",
  default: "synopsis",
});

// 現在選択されている章のID
export const currentChapterIdState = atom<string | null>({
  key: "currentChapterId",
  default: null,
});

// AIアシスタントとの会話履歴
export interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: Date;
}

export const chatHistoryState = atom<Message[]>({
  key: "chatHistory",
  default: [],
});

// サイドバーの開閉状態
export const sidebarOpenState = atom<boolean>({
  key: "sidebarOpen",
  default: true,
});

// チャットパネルの開閉状態
export const chatPanelOpenState = atom<boolean>({
  key: "chatPanelOpen",
  default: true,
});

// AIエージェント連携機能用のステート

// AIチャットパネルの表示状態
export const aiChatPanelOpenState = atom<boolean>({
  key: "aiChatPanelOpen",
  default: false,
});

// 選択された要素のID一覧を格納するステート
export interface SelectedElement {
  id: string;
  type: "plot" | "character" | "chapter" | "worldbuilding";
  content: {
    title: string;
    description?: string;
    [key: string]: string | number | boolean | string[] | undefined | null; // より具体的な型
  };
}

export const selectedElementsState = atom<SelectedElement[]>({
  key: "selectedElements",
  default: [],
});

// AIチャットの会話履歴
export interface ChatMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: Date;
}

export const aiChatHistoryState = atom<ChatMessage[]>({
  key: "aiChatHistory",
  default: [],
});

// 現在のメッセージ入力
export const currentMessageState = atom<string>({
  key: "currentMessage",
  default: "",
});

// AIリクエスト処理中の状態
export const aiLoadingState = atom<boolean>({
  key: "aiLoading",
  default: false,
});

// AIチャットパネルのアクティブなタブ
export type AIChatTabType = "chat" | "assist" | "settings";
export const aiChatTabState = atom<AIChatTabType>({
  key: "aiChatTab",
  default: "chat",
});

// AI統合機能用の新しい型定義
export type AIChatMode = "chat" | "assist";

export type PageContext =
  | "characters"
  | "plot"
  | "timeline"
  | "worldbuilding"
  | "writing"
  | "synopsis"
  | "plot-item";

export interface ResponseData {
  content: string;
  metadata?: Record<string, unknown>;
}

export interface AssistConfig {
  title: string;
  description: string;
  defaultMessage: string;
  supportsBatchGeneration?: boolean;
  customControls?: {
    targetLength?: "short" | "medium" | "long" | "";
    userInstructions?: string;
    plotSelection?: boolean;
  };
  onComplete?: (result: ResponseData) => void;
  onGenerate?: (params: Record<string, unknown>) => Promise<void>;
}

export interface AIChatContext {
  mode: AIChatMode;
  pageContext: PageContext;
  projectData: NovelProject | null;
  selectedElements: SelectedElement[];
  assistConfig?: AssistConfig;
}

export const aiChatContextState = atom<AIChatContext>({
  key: "aiChatContextState",
  default: {
    mode: "chat",
    pageContext: "characters",
    projectData: null,
    selectedElements: [],
  },
});

// 世界観構築画面のタブ更新状態を管理するアトム
export const worldBuildingUpdatedTabsState = atom<{ [key: number]: boolean }>({
  key: "worldBuildingUpdatedTabsState",
  default: {},
});

// 世界観構築画面の強制更新カウンターを管理するアトム
export const worldBuildingForceUpdateCounterState = atom<number>({
  key: "worldBuildingForceUpdateCounterState",
  default: 0,
});

export const pendingPlacesState = atom<PlaceElement[]>({
  key: "pendingPlacesState",
  default: [],
});
