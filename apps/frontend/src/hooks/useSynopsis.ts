import { useState, useEffect, useCallback } from "react";
import { useRecoilState } from "recoil";
import { currentProjectState, appModeState, AppMode } from "../store/atoms";

export function useSynopsis() {
  const [currentProject, setCurrentProject] =
    useRecoilState(currentProjectState);
  const [, setAppMode] = useRecoilState(appModeState);
  const [synopsis, setSynopsis] = useState("");
  const [originalSynopsis, setOriginalSynopsis] = useState("");
  const [isEditing, setIsEditing] = useState(false);
  const [showAlertDialog, setShowAlertDialog] = useState(false);
  const [navigationIntent, setNavigationIntent] = useState<{
    type: string;
    destination?: string;
  } | null>(null);

  // 初期データのロード
  useEffect(() => {
    if (currentProject) {
      setSynopsis(currentProject.synopsis || "");
      setOriginalSynopsis(currentProject.synopsis || "");
    }
  }, [currentProject]);

  // 編集開始時の処理
  const handleStartEditing = () => {
    setIsEditing(true);
    setOriginalSynopsis(synopsis); // 編集前の状態を保存
  };

  // 変更検知
  const hasUnsavedChanges = isEditing && synopsis !== originalSynopsis;

  // シノプシスの変更ハンドラ
  const handleSynopsisChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSynopsis(e.target.value);
  };

  // 保存ハンドラ
  const handleSave = () => {
    if (currentProject) {
      setCurrentProject({
        ...currentProject,
        synopsis,
        updatedAt: new Date(),
      });
      setIsEditing(false);
      setOriginalSynopsis(synopsis); // 保存後は元の状態を更新
    }
  };

  // キャンセルハンドラ
  const handleCancel = () => {
    if (hasUnsavedChanges) {
      setShowAlertDialog(true);
      setNavigationIntent({ type: "cancel" });
    } else {
      setSynopsis(originalSynopsis);
      setIsEditing(false);
    }
  };

  // ナビゲーションハンドラ（サイドメニュー切替時）
  const handleNavigation = useCallback(
    (destination: string) => {
      if (hasUnsavedChanges) {
        setShowAlertDialog(true);
        setNavigationIntent({ type: "navigation", destination });
      } else {
        setAppMode(destination as AppMode);
      }
    },
    [hasUnsavedChanges, setAppMode]
  );

  // アラートダイアログのキャンセル
  const handleDialogCancel = () => {
    setShowAlertDialog(false);
    setNavigationIntent(null);
  };

  // アラートダイアログの続行（保存せずに移動）
  const handleDialogContinue = () => {
    setShowAlertDialog(false);

    if (!navigationIntent) return;

    if (navigationIntent.type === "cancel") {
      setSynopsis(originalSynopsis);
      setIsEditing(false);
    } else if (
      navigationIntent.type === "navigation" &&
      navigationIntent.destination
    ) {
      setIsEditing(false);
      setAppMode(navigationIntent.destination as AppMode);
    }

    setNavigationIntent(null);
  };

  // ページ離脱時の警告
  useEffect(() => {
    // F5更新や戻るボタン押下時の処理
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (hasUnsavedChanges) {
        e.preventDefault();
        e.returnValue = "";
        return "";
      }
    };

    // サイドメニュークリック時のカスタムイベント
    const handleModeChangeAttempt = (e: CustomEvent) => {
      if (hasUnsavedChanges) {
        e.preventDefault();
        handleNavigation(e.detail.mode);
      }
    };

    // イベントリスナーの登録
    window.addEventListener("beforeunload", handleBeforeUnload);
    document.addEventListener(
      "modeChangeAttempt",
      handleModeChangeAttempt as EventListener
    );

    return () => {
      window.removeEventListener("beforeunload", handleBeforeUnload);
      document.removeEventListener(
        "modeChangeAttempt",
        handleModeChangeAttempt as EventListener
      );
    };
  }, [hasUnsavedChanges, handleNavigation]);

  return {
    currentProject,
    synopsis,
    isEditing,
    showAlertDialog,
    hasUnsavedChanges,
    handleStartEditing,
    handleSynopsisChange,
    handleSave,
    handleCancel,
    handleDialogCancel,
    handleDialogContinue,
  };
}
