import { useState, useEffect } from "react";
import { useRecoilState } from "recoil";
import { currentProjectState } from "../store/atoms";
import { PlotElement, NovelProject } from "@novel-ai-assistant/types";
import { v4 as uuidv4 } from "uuid";
import { SelectChangeEvent } from "@mui/material";
import { DropResult } from "react-beautiful-dnd";

export function usePlot() {
  const [currentProject, setCurrentProject] =
    useRecoilState(currentProjectState);
  const [plotItems, setPlotItems] = useState<PlotElement[]>([]);
  const [newItemTitle, setNewItemTitle] = useState("");
  const [newItemDescription, setNewItemDescription] = useState("");
  const [editItemId, setEditItemId] = useState<string | null>(null);
  const [editItemTitle, setEditItemTitle] = useState("");
  const [editItemDescription, setEditItemDescription] = useState("");
  const [editItemStatus, setEditItemStatus] = useState<"決定" | "検討中">(
    "検討中"
  );
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [snackbarOpen, setSnackbarOpen] = useState(false);

  // プロジェクトからプロットアイテムを読み込み
  useEffect(() => {
    if (currentProject?.plot) {
      // orderでソートしてから設定
      setPlotItems([...currentProject.plot].sort((a, b) => a.order - b.order));
    }
  }, [currentProject]);

  // プロットアイテムを追加
  const handleAddItem = () => {
    if (!newItemTitle.trim()) return;

    const newItem: PlotElement = {
      id: uuidv4(),
      title: newItemTitle.trim(),
      description: newItemDescription.trim(),
      order: plotItems.length,
      status: "検討中",
    };

    setPlotItems([...plotItems, newItem]);
    setNewItemTitle("");
    setNewItemDescription("");
    setHasUnsavedChanges(true);
  };

  // プロットアイテムを削除
  const handleDeleteItem = (id: string) => {
    const updatedItems = plotItems.filter((item) => item.id !== id);

    // 順序を再設定
    const reorderedItems = updatedItems.map((item, index) => ({
      ...item,
      order: index,
    }));

    setPlotItems(reorderedItems);
    setHasUnsavedChanges(true);
  };

  // 編集ダイアログを開く
  const handleOpenEditDialog = (item: PlotElement) => {
    setEditItemId(item.id);
    setEditItemTitle(item.title);
    setEditItemDescription(item.description);
    setEditItemStatus(item.status);
    setIsDialogOpen(true);
  };

  // 編集ダイアログを閉じる
  const handleCloseEditDialog = () => {
    setIsDialogOpen(false);
    setEditItemId(null);
  };

  // プロットアイテムを更新
  const handleUpdateItem = () => {
    if (!editItemId || !editItemTitle.trim()) return;

    const updatedItems = plotItems.map((item) => {
      if (item.id === editItemId) {
        return {
          ...item,
          title: editItemTitle.trim(),
          description: editItemDescription.trim(),
          status: editItemStatus,
        };
      }
      return item;
    });

    setPlotItems(updatedItems);
    setIsDialogOpen(false);
    setEditItemId(null);
    setHasUnsavedChanges(true);
  };

  // ドラッグアンドドロップによる順序変更
  const handleDragEnd = (result: DropResult) => {
    // ドロップ先がない場合は何もしない
    if (!result.destination) return;

    // 順序が変わっていなければ何もしない
    if (result.destination.index === result.source.index) return;

    // 項目の新しい順序を作成
    const items = Array.from(plotItems);
    const [reorderedItem] = items.splice(result.source.index, 1);
    items.splice(result.destination.index, 0, reorderedItem);

    // 順序番号を再設定
    const updatedItems = items.map((item, index) => ({
      ...item,
      order: index,
    }));

    setPlotItems(updatedItems);
    setHasUnsavedChanges(true);
  };

  // ステータス変更
  const handleStatusChange = (
    id: string,
    event: SelectChangeEvent<"決定" | "検討中">
  ) => {
    const status = event.target.value as "決定" | "検討中";
    const updatedItems = plotItems.map((item) => {
      if (item.id === id) {
        return { ...item, status };
      }
      return item;
    });

    setPlotItems(updatedItems);
    setHasUnsavedChanges(true);
  };

  // プロジェクトに保存
  const handleSave = () => {
    if (currentProject) {
      setCurrentProject({
        ...currentProject,
        plot: plotItems,
        updatedAt: new Date(),
      });
      setHasUnsavedChanges(false);
      setSnackbarOpen(true);

      // ローカルストレージにも保存
      const projectsStr = localStorage.getItem("novelProjects");
      if (projectsStr) {
        try {
          const projects = JSON.parse(projectsStr);
          const updatedProjects = projects.map((p: NovelProject) =>
            p.id === currentProject.id
              ? {
                  ...p,
                  plot: plotItems,
                  updatedAt: new Date(),
                }
              : p
          );
          localStorage.setItem(
            "novelProjects",
            JSON.stringify(updatedProjects)
          );
        } catch (error) {
          console.error("ローカルストレージへの保存に失敗しました", error);
        }
      }
    }
  };

  // スナックバーを閉じる
  const handleCloseSnackbar = () => {
    setSnackbarOpen(false);
  };

  return {
    currentProject,
    plotItems,
    newItemTitle,
    setNewItemTitle,
    newItemDescription,
    setNewItemDescription,
    editItemId,
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
  };
}
