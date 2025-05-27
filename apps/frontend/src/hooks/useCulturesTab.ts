import { useState, useEffect, useCallback } from "react";
import { v4 as uuidv4 } from "uuid";
import { CultureElement } from "@novel-ai-assistant/types";
import { useElementAccumulator } from "./useElementAccumulator";

export function useCulturesTab() {
  // コンテキストから必要な機能を取得
  const {
    getCurrentProjectState,
    updateProjectState,
    addPendingCulture,
    pendingCultures,
    saveAllPendingElements,
    markTabAsUpdated,
  } = useElementAccumulator();

  // 状態管理
  const [cultures, setCultures] = useState<CultureElement[]>([]);
  const [currentCulture, setCurrentCulture] = useState<CultureElement | null>(
    null
  );
  const [dialogOpen, setDialogOpen] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [newValue, setNewValue] = useState("");

  // プロジェクトから文化を読み込む
  useEffect(() => {
    const currentProject = getCurrentProjectState();
    if (currentProject?.worldBuilding?.cultures) {
      setCultures(currentProject.worldBuilding.cultures);
    }
  }, [getCurrentProjectState]);

  // 未保存の文化をUIに反映
  useEffect(() => {
    if (pendingCultures.length > 0) {
      // 既存の文化とペンディング中の文化を結合
      const allCultures = [...cultures];

      // ペンディング文化を追加（既存のものは上書き）
      pendingCultures.forEach((pendingCulture: CultureElement) => {
        const existingIndex = allCultures.findIndex(
          (c) => c.id === pendingCulture.id
        );
        if (existingIndex >= 0) {
          allCultures[existingIndex] = pendingCulture;
        } else {
          allCultures.push(pendingCulture);
        }
      });

      setCultures(allCultures);
    }
  }, [pendingCultures, cultures]);

  // 新規文化作成ダイアログを開く
  const handleOpenNewDialog = useCallback(() => {
    setCurrentCulture({
      id: uuidv4(),
      name: "",
      description: "",
      values: [],
      customText: "",
      beliefs: "",
      history: "",
      features: "",
      importance: "",
      relations: "",
      socialStructure: "",
      customs: [],
      type: "culture",
      originalType: "culture",
    });
    setIsEditing(false);
    setDialogOpen(true);
  }, []);

  // 文化編集ダイアログを開く
  const handleEdit = useCallback((culture: CultureElement) => {
    setCurrentCulture({ ...culture });
    setIsEditing(true);
    setDialogOpen(true);
  }, []);

  // 文化を削除
  const handleDelete = useCallback(
    (id: string) => {
      const updatedCultures = cultures.filter((culture) => culture.id !== id);
      setCultures(updatedCultures);
      const project = getCurrentProjectState();
      if (!project) return;
      const updatedWorldBuilding = {
        ...project.worldBuilding,
        cultures: updatedCultures,
      };
      // 世界観データを更新
      updateProjectState({
        ...project,
        worldBuilding: updatedWorldBuilding,
      });
      // タブを更新済みとマーク
      markTabAsUpdated(5); // 文化タブのインデックス
    },
    [cultures, markTabAsUpdated, updateProjectState, getCurrentProjectState]
  );

  // ダイアログを閉じる
  const handleCloseDialog = useCallback(() => {
    setDialogOpen(false);
    setCurrentCulture(null);
    setNewValue("");
  }, []);

  // 文化の保存
  const handleSaveCulture = useCallback(() => {
    if (!currentCulture) return;

    // 文化を保存（編集または新規追加）
    if (isEditing) {
      const updatedCultures = cultures.map((culture) =>
        culture.id === currentCulture.id ? currentCulture : culture
      );
      setCultures(updatedCultures);

      const project = getCurrentProjectState();
      if (!project) return;
      const updatedWorldBuilding = {
        ...project.worldBuilding,
        cultures: updatedCultures,
      };
      // 世界観データを更新
      updateProjectState({
        ...project,
        worldBuilding: updatedWorldBuilding,
      });
    } else {
      // 新しい文化を保存
      addPendingCulture(currentCulture);

      // すぐに保存
      saveAllPendingElements();
    }

    // タブを更新済みとマーク
    markTabAsUpdated(5); // 文化タブのインデックス

    // ダイアログを閉じる
    handleCloseDialog();
  }, [
    currentCulture,
    isEditing,
    cultures,
    updateProjectState,
    addPendingCulture,
    saveAllPendingElements,
    markTabAsUpdated,
    handleCloseDialog,
    getCurrentProjectState,
  ]);

  // 入力フィールドの変更を処理
  const handleInputChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
      if (!currentCulture) return;

      setCurrentCulture({
        ...currentCulture,
        [e.target.name]: e.target.value,
      });
    },
    [currentCulture]
  );

  // 価値観の追加
  const handleAddValue = useCallback(() => {
    if (!currentCulture || !newValue.trim()) return;

    setCurrentCulture({
      ...currentCulture,
      values: [...currentCulture.values, newValue.trim()],
    });
    setNewValue("");
  }, [currentCulture, newValue]);

  // 価値観の削除
  const handleRemoveValue = useCallback(
    (index: number) => {
      if (!currentCulture) return;

      const updatedValues = [...currentCulture.values];
      updatedValues.splice(index, 1);

      setCurrentCulture({
        ...currentCulture,
        values: updatedValues,
      });
    },
    [currentCulture]
  );

  return {
    cultures,
    currentCulture,
    dialogOpen,
    isEditing,
    newValue,
    handleOpenNewDialog,
    handleEdit,
    handleDelete,
    handleCloseDialog,
    handleSaveCulture,
    handleInputChange,
    handleAddValue,
    handleRemoveValue,
    setNewValue,
  };
}
