import React, { createContext, useContext, ReactNode } from "react";
import { usePlot } from "../hooks/usePlot";
import { v4 as uuidv4 } from "uuid";
import { PlotElement, NovelProject } from "@novel-ai-assistant/types";
import { toast } from "sonner";
import { SelectChangeEvent } from "@mui/material";
import { DropResult } from "react-beautiful-dnd";
import { parseAIResponseToPlotItems } from "../utils/aiResponseParser";

interface PlotContextType {
  // usePlotから取得した状態
  plotItems: PlotElement[];
  newItemTitle: string;
  newItemDescription: string;
  editItemTitle: string;
  editItemDescription: string;
  editItemStatus: "検討中" | "決定";
  isDialogOpen: boolean;
  hasUnsavedChanges: boolean;
  snackbarOpen: boolean;
  currentProject: NovelProject | null;

  // アクション
  setNewItemTitle: (title: string) => void;
  setNewItemDescription: (desc: string) => void;
  setEditItemTitle: (title: string) => void;
  setEditItemDescription: (desc: string) => void;
  setEditItemStatus: React.Dispatch<React.SetStateAction<"検討中" | "決定">>;
  setPlotItems: React.Dispatch<React.SetStateAction<PlotElement[]>>;
  setHasUnsavedChanges: React.Dispatch<React.SetStateAction<boolean>>;
  handleAddItem: () => void;
  handleDeleteItem: (id: string) => void;
  handleOpenEditDialog: (item: PlotElement) => void;
  handleCloseEditDialog: () => void;
  handleUpdateItem: () => void;
  handleDragEnd: (result: DropResult) => void;
  handleStatusChange: (
    id: string,
    event: SelectChangeEvent<"検討中" | "決定">
  ) => void;
  handleSave: () => void;
  handleCloseSnackbar: () => void;

  // AIアシスト機能（削除予定）
  applyAIPlotResponse: (aiResponse: string | PlotElement[]) => void;
}

// コンテキストの作成
const PlotContext = createContext<PlotContextType | undefined>(undefined);

// プロバイダーコンポーネント
export const PlotProvider: React.FC<{ children: ReactNode }> = ({
  children,
}) => {
  // usePlotフックからプロット関連のロジックを取得
  const {
    currentProject,
    plotItems,
    newItemTitle,
    setNewItemTitle,
    newItemDescription,
    setNewItemDescription,
    editItemTitle,
    editItemDescription,
    editItemStatus,
    isDialogOpen,
    hasUnsavedChanges,
    snackbarOpen,
    handleAddItem,
    handleDeleteItem,
    handleOpenEditDialog,
    handleCloseEditDialog,
    handleUpdateItem,
    handleDragEnd,
    handleStatusChange,
    handleSave,
    handleCloseSnackbar,
    setEditItemTitle,
    setEditItemDescription,
    setEditItemStatus,
    setPlotItems,
    setHasUnsavedChanges,
  } = usePlot();

  // AIの応答をプロットフォームに適用する関数（後方互換性のため残す）
  const applyAIPlotResponse = (aiResponse: string | PlotElement[]) => {
    try {
      let newPlotItems: PlotElement[] = [];

      // 構造化されたデータ（配列）の場合
      if (Array.isArray(aiResponse)) {
        newPlotItems = aiResponse.map(
          (item): PlotElement => ({
            id: item.id || uuidv4(),
            title: item.title || "無題のプロット",
            description: item.description || "",
            order: item.order || 0,
            status: item.status || ("検討中" as const),
          })
        );
      } else {
        // 従来の文字列レスポンスの場合（後方互換性）
        const parsedPlotItems = parseAIResponseToPlotItems(aiResponse);
        newPlotItems = parsedPlotItems.map(
          (item): PlotElement => ({
            id: uuidv4(),
            title: item.title || "無題のプロット",
            description: item.description || "",
            order: 0,
            status: "検討中" as const,
          })
        );
      }

      if (newPlotItems.length > 0) {
        // 既存のプロットアイテムと新しいプロットアイテムを結合
        setPlotItems((prevItems: PlotElement[]) => {
          const updatedItems = [...prevItems, ...newPlotItems];
          // 順序を再設定
          return updatedItems.map((item, index) => ({
            ...item,
            order: index,
          }));
        });
        setHasUnsavedChanges(true);

        // 成功メッセージを表示
        toast.success(
          `${newPlotItems.length}件のプロットアイテムを追加しました`
        );
      }
    } catch (error) {
      console.error("AIレスポンスの解析エラー:", error);
      toast.error("プロットアイテムの追加に失敗しました");
    }
  };

  // コンテキストで提供する値
  const value: PlotContextType = {
    // usePlotからの状態と関数
    plotItems,
    newItemTitle,
    newItemDescription,
    editItemTitle,
    editItemDescription,
    editItemStatus,
    isDialogOpen,
    hasUnsavedChanges,
    snackbarOpen,
    currentProject: currentProject as NovelProject | null,
    setNewItemTitle,
    setNewItemDescription,
    setEditItemTitle,
    setEditItemDescription,
    setEditItemStatus,
    setPlotItems,
    setHasUnsavedChanges,
    handleAddItem,
    handleDeleteItem,
    handleOpenEditDialog,
    handleCloseEditDialog,
    handleUpdateItem,
    handleDragEnd,
    handleStatusChange,
    handleSave,
    handleCloseSnackbar,

    // AIアシスト関連（後方互換性のため残す）
    applyAIPlotResponse,
  };

  return <PlotContext.Provider value={value}>{children}</PlotContext.Provider>;
};

// カスタムフック
export const usePlotContext = () => {
  const context = useContext(PlotContext);
  if (context === undefined) {
    throw new Error("usePlotContext must be used within a PlotProvider");
  }
  return context;
};
