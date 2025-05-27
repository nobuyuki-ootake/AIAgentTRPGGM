import React, {
  createContext,
  useContext,
  ReactNode,
  useState,
  MutableRefObject,
} from "react";
import { useWriting } from "../hooks/useWriting";
import { Descendant, Editor } from "slate";
import { AlertColor } from "@mui/material";
import {
  Chapter,
  TimelineEvent,
  NovelProject,
  Character,
  WorldBuildingElement,
} from "@novel-ai-assistant/types";
import { aiAgentApi } from "../api/aiAgent";
import { convertTextToSlateValue } from "../utils/slateUtils";
import { serializeToText } from "../utils/editorUtils";

// AIによる章生成関数のパラメータ型
export interface AIChapterGenerationParams {
  chapterTitle: string;
  relatedEvents: Pick<TimelineEvent, "id" | "title" | "description">[];
  charactersInChapter: Pick<
    Character,
    "id" | "name" | "description" | "role"
  >[];
  selectedLocations: Pick<
    WorldBuildingElement,
    "id" | "name" | "description"
  >[];
  userInstructions?: string;
  targetChapterLength?: "short" | "medium" | "long";
  model?: string;
}

// Contextで提供する値の型定義
export interface WritingContextType {
  // 状態
  editorValue: Descendant[];
  currentChapter: Chapter | null;
  currentProject: NovelProject | null;
  currentChapterId: string | null;
  timelineEvents: TimelineEvent[];
  newChapterDialogOpen: boolean;
  newChapterTitle: string;
  newChapterSynopsis: string;
  assignEventsDialogOpen: boolean;
  selectedEvents: string[];
  eventDetailDialogOpen: boolean;
  selectedEvent: TimelineEvent | null;

  // ページ管理 (改ページマーカー用)
  currentPageInEditor: number;
  totalPagesInEditor: number;
  editorRef: MutableRefObject<Editor | null>;
  editorKey: number;

  // AI関連の状態
  isAiProcessing: boolean;
  aiUserInstructions: string;
  aiTargetLength: "short" | "medium" | "long" | "";

  // AI執筆確認ダイアログの状態
  aiOverwriteConfirmOpen: boolean;
  pendingAiParams: AIChapterGenerationParams | null;

  // Snackbar関連の状態
  snackbarOpen: boolean;
  snackbarMessage: string;
  snackbarSeverity: AlertColor;

  // アクション
  handleEditorChange: (value: Descendant[]) => void;
  handleChapterSelect: (chapterId: string) => void;
  handleOpenNewChapterDialog: () => void;
  handleCloseNewChapterDialog: () => void;
  setNewChapterTitle: React.Dispatch<React.SetStateAction<string>>;
  setNewChapterSynopsis: React.Dispatch<React.SetStateAction<string>>;
  handleCreateChapter: () => void;
  handleOpenAssignEventsDialog: () => void;
  handleCloseAssignEventsDialog: () => void;
  handleToggleEvent: (eventId: string) => void;
  handleAssignEvents: () => void;
  handleOpenEventDetailDialog: (eventId: string) => void;
  handleCloseEventDetailDialog: () => void;
  handleAddEventToChapter: (eventId: string) => void;
  handleAddNewEvent: (event: TimelineEvent) => void;
  handleSaveContent: () => void;
  handleRemoveEventFromChapter: (eventId: string) => void;

  // ページ管理 (改ページマーカー用)
  handleAddPageBreak: () => void;
  handlePreviousPageInEditor: () => void;
  handleNextPageInEditor: () => void;

  // AI関連のアクション
  setIsAiProcessing: React.Dispatch<React.SetStateAction<boolean>>;
  setAiUserInstructions: React.Dispatch<React.SetStateAction<string>>;
  setAiTargetLength: React.Dispatch<
    React.SetStateAction<"short" | "medium" | "long" | "">
  >;
  generateChapterByAI: (params: AIChapterGenerationParams) => Promise<void>;
  startAiGeneration: (params: AIChapterGenerationParams) => void;

  // AI執筆確認ダイアログのアクション
  handleOpenAiOverwriteConfirm: (params: AIChapterGenerationParams) => void;
  handleCloseAiOverwriteConfirm: () => void;
  handleConfirmAiOverwrite: () => Promise<void>;

  // Snackbar関連のアクション
  showSnackbar: (message: string, severity: AlertColor) => void;
  closeSnackbar: () => void;

  // 新しいプロパティを追加
  updateCurrentPageFromSelection: () => void;
}

// コンテキストの作成
const WritingContext = createContext<WritingContextType | undefined>(undefined);

// プロバイダーコンポーネント
export const WritingProvider: React.FC<{ children: ReactNode }> = ({
  children,
}) => {
  const {
    editorValue,
    currentChapter,
    currentProject,
    currentChapterId,
    timelineEvents,
    newChapterDialogOpen,
    newChapterTitle,
    newChapterSynopsis,
    assignEventsDialogOpen,
    eventDetailDialogOpen,
    selectedEvent,
    selectedEvents,
    currentPageInEditor,
    totalPagesInEditor,
    editorRef,
    editorKey,
    handleEditorChange,
    handleChapterSelect,
    handleOpenNewChapterDialog,
    handleCloseNewChapterDialog,
    handleCreateChapter,
    setNewChapterTitle,
    setNewChapterSynopsis,
    handleOpenAssignEventsDialog,
    handleCloseAssignEventsDialog,
    handleToggleEvent,
    handleAssignEvents,
    handleOpenEventDetailDialog,
    handleCloseEventDetailDialog,
    handleSaveContent,
    handleAddEventToChapter,
    handleRemoveEventFromChapter,
    handleAddNewEvent,
    handleAddPageBreak,
    handlePreviousPageInEditor,
    handleNextPageInEditor,
    updateCurrentPageFromSelection,
  } = useWriting();

  // AI関連のstate
  const [isAiProcessing, setIsAiProcessing] = useState(false);
  const [aiUserInstructions, setAiUserInstructions] = useState("");
  const [aiTargetLength, setAiTargetLength] = useState<
    "short" | "medium" | "long" | ""
  >("");

  // AI執筆確認ダイアログのstate
  const [aiOverwriteConfirmOpen, setAiOverwriteConfirmOpen] = useState(false);
  const [pendingAiParams, setPendingAiParams] =
    useState<AIChapterGenerationParams | null>(null);

  // Snackbarのstate
  const [snackbarOpen, setSnackbarOpen] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState("");
  const [snackbarSeverity, setSnackbarSeverity] = useState<AlertColor>("info");

  const showSnackbar = (message: string, severity: AlertColor) => {
    setSnackbarMessage(message);
    setSnackbarSeverity(severity);
    setSnackbarOpen(true);
  };

  const closeSnackbar = () => {
    setSnackbarOpen(false);
  };

  // AIによる章本文生成
  const generateChapterByAI = async (params: AIChapterGenerationParams) => {
    setIsAiProcessing(true);
    try {
      console.log("AIに章本文生成リクエスト送信中...", params);

      const response = await aiAgentApi.generateChapterContent(
        params.chapterTitle,
        params.relatedEvents,
        params.charactersInChapter,
        params.selectedLocations,
        params.userInstructions,
        params.targetChapterLength || undefined,
        "gemini-1.5-pro"
      );

      console.log("AIからのレスポンス受信:", response);
      console.log("レスポンスのcontentプロパティ:", response.content);
      console.log("contentの型:", typeof response.content);

      if (response.content && typeof response.content === "string") {
        console.log("content文字列の長さ:", response.content.length);
        console.log(
          "content文字列の最初の100文字:",
          response.content.substring(0, 100)
        );

        const newEditorValue = convertTextToSlateValue(response.content);
        console.log("Slate変換後のデータ:", newEditorValue);

        if (handleEditorChange) {
          console.log("React stateを通じてエディタ更新を実行中...");

          // React stateのみを更新（Slateエディタの直接操作は避ける）
          handleEditorChange(newEditorValue);
          console.log("React state (editorValue) 更新完了");

          console.log("エディタ更新完了");
        } else {
          console.error("handleEditorChange が undefined です");
        }
        showSnackbar("AIによる本文生成が完了しました。", "success");
      } else {
        console.warn(
          "AIからのレスポンス形式が不正か、コンテントがありません。",
          response
        );
        console.warn("response.content:", response.content);
        console.warn("typeof response.content:", typeof response.content);
        showSnackbar(
          "AIからのレスポンス形式が不正か、内容が空でした。",
          "warning"
        );
      }
    } catch (error) {
      console.error("AIによる章本文生成エラー:", error);
      console.error("エラーの詳細:", {
        message: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined,
        name: error instanceof Error ? error.name : undefined,
      });
      const message = error instanceof Error ? error.message : String(error);
      showSnackbar(
        `AIによる章本文生成中にエラーが発生しました: ${message}`,
        "error"
      );
    } finally {
      setIsAiProcessing(false);
    }
  };

  // 内容チェック付きのAI執筆開始関数
  const startAiGeneration = (params: AIChapterGenerationParams) => {
    // 現在のエディタ内容をチェック
    const currentText = serializeToText(editorValue).trim();

    if (currentText && currentText !== "") {
      // 内容がある場合は確認ダイアログを表示
      handleOpenAiOverwriteConfirm(params);
    } else {
      // 内容が空の場合は直接実行
      generateChapterByAI(params);
    }
  };

  // AI執筆確認ダイアログのアクション
  const handleOpenAiOverwriteConfirm = (params: AIChapterGenerationParams) => {
    setAiOverwriteConfirmOpen(true);
    setPendingAiParams(params);
  };

  const handleCloseAiOverwriteConfirm = () => {
    setAiOverwriteConfirmOpen(false);
    setPendingAiParams(null);
  };

  const handleConfirmAiOverwrite = async () => {
    if (pendingAiParams) {
      await generateChapterByAI(pendingAiParams);
      handleCloseAiOverwriteConfirm();
    }
  };

  const value: WritingContextType = {
    editorValue,
    currentChapter,
    currentProject,
    currentChapterId,
    timelineEvents,
    newChapterDialogOpen,
    newChapterTitle,
    newChapterSynopsis,
    assignEventsDialogOpen,
    eventDetailDialogOpen,
    selectedEvent,
    selectedEvents,
    currentPageInEditor,
    totalPagesInEditor,
    editorRef,
    editorKey,
    handleEditorChange,
    handleChapterSelect,
    handleOpenNewChapterDialog,
    handleCloseNewChapterDialog,
    handleCreateChapter,
    setNewChapterTitle,
    setNewChapterSynopsis,
    handleOpenAssignEventsDialog,
    handleCloseAssignEventsDialog,
    handleToggleEvent,
    handleAssignEvents,
    handleOpenEventDetailDialog,
    handleCloseEventDetailDialog,
    handleSaveContent,
    handleAddEventToChapter,
    handleRemoveEventFromChapter,
    handleAddNewEvent,
    handleAddPageBreak,
    handlePreviousPageInEditor,
    handleNextPageInEditor,

    // AI関連の状態とアクション
    isAiProcessing,
    aiUserInstructions,
    aiTargetLength,
    setIsAiProcessing,
    setAiUserInstructions,
    setAiTargetLength,
    generateChapterByAI,
    startAiGeneration,

    // AI執筆確認ダイアログの状態とアクション
    aiOverwriteConfirmOpen,
    pendingAiParams,
    handleOpenAiOverwriteConfirm,
    handleCloseAiOverwriteConfirm,
    handleConfirmAiOverwrite,

    // Snackbar関連の状態とアクション
    snackbarOpen,
    snackbarMessage,
    snackbarSeverity,
    showSnackbar,
    closeSnackbar,

    // 新しいプロパティを追加
    updateCurrentPageFromSelection,
  };

  return (
    <WritingContext.Provider value={value}>{children}</WritingContext.Provider>
  );
};

// カスタムフック
export const useWritingContext = () => {
  const context = useContext(WritingContext);
  if (context === undefined) {
    throw new Error("useWritingContext must be used within a WritingProvider");
  }
  return context;
};
