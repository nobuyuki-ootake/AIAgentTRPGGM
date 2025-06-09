import React, { useState, useEffect } from "react";
import {
  Box,
  Typography,
  Paper,
  Tabs,
  Tab,
  Button,
  Snackbar,
  Badge,
} from "@mui/material";
import {
  SmartToy as SmartToyIcon,
  DeleteSweep as DeleteSweepIcon,
  Save as SaveIcon,
} from "@mui/icons-material";
import WorldMapTab from "../components/worldbuilding/WorldMapTab";
import TabPanel from "../components/worldbuilding/TabPanel";
import LocationTab from "../components/worldbuilding/LocationTab";
import BaseTab from "../components/worldbuilding/BaseTab";
import { useAIChatIntegration } from "../hooks/useAIChatIntegration";
import { useRecoilValue } from "recoil";
import { currentCampaignState } from "../store/atoms";
import { useWorldBuildingContext } from "../contexts/WorldBuildingContext";
import { useWorldBuildingAI } from "../hooks/useWorldBuildingAI";
import { useElementAccumulator } from "../hooks/useElementAccumulator";
import { ProgressSnackbar } from "../components/ui/ProgressSnackbar";
import { UnsavedChangesDialog } from "../components/common/UnsavedChangesDialog";
import { useUnsavedChanges } from "../hooks/useUnsavedChanges";
import { toast } from "sonner";

const WorldBuildingPage: React.FC = () => {
  const currentCampaign = useRecoilValue(currentCampaignState);
  const { resetWorldBuildingElements } = useElementAccumulator();
  const { openAIAssist } = useAIChatIntegration();

  // 未保存データ管理フック
  const {
    hasUnsavedChanges: unsavedChangesHook,
    setUnsavedChanges,
    markAsSaved,
    checkBeforeLeave,
  } = useUnsavedChanges();

  // コンテキストから状態とハンドラ関数を取得
  const {
    tabValue,
    snackbarOpen,
    snackbarMessage,
    handleTabChange,
    handleMapImageUpload,
    handleSaveWorldBuilding,
    handleCloseSnackbar,
    updatedTabs,
    notificationOpen,
    notificationMessage,
    setNotificationOpen,
    hasUnsavedChanges: contextHasUnsavedChanges,
    setHasUnsavedChanges: setContextHasUnsavedChanges,
  } = useWorldBuildingContext();

  // 警告ダイアログの状態
  const [showUnsavedDialog, setShowUnsavedDialog] = useState(false);
  const [pendingAction, setPendingAction] = useState<(() => void) | null>(null);

  const {
    generateWorldBuildingBatch,
    notificationOpen: worldBuildingNotificationOpen,
    setNotificationOpen: setWorldBuildingNotificationOpen,
    aiGenerationProgress,
    currentElement,
  } = useWorldBuildingAI();

  const [isAIProcessing, setIsAIProcessing] = useState(false);

  // AI処理の進行状況管理
  const [aiProgress, setAiProgress] = useState<number | undefined>(undefined);
  const [showProgressSnackbar, setShowProgressSnackbar] = useState(false);

  // 未保存データの状態を同期
  useEffect(() => {
    setUnsavedChanges(contextHasUnsavedChanges || false);
  }, [contextHasUnsavedChanges, setUnsavedChanges]);

  // ナビゲーション試行時のイベントリスナー
  useEffect(() => {
    const handleModeChangeAttempt = (event: Event) => {
      const customEvent = event as CustomEvent;
      
      // 未保存データがある場合はナビゲーションを阻止
      if (unsavedChangesHook || contextHasUnsavedChanges) {
        event.preventDefault();
        
        // 移動先に応じたアクションを準備
        const targetMode = customEvent.detail?.mode;
        setPendingAction(() => () => {
          // 強制的にナビゲーションを実行
          if (targetMode === "home") {
            // ホームに戻る処理
            window.location.href = "/";
          } else {
            // 他のモードに変更する処理
            const newEvent = new CustomEvent("forceMode Change", {
              detail: { mode: targetMode }
            });
            document.dispatchEvent(newEvent);
          }
        });
        setShowUnsavedDialog(true);
        return false;
      }
      
      return true;
    };

    document.addEventListener("modeChangeAttempt", handleModeChangeAttempt);
    
    return () => {
      document.removeEventListener("modeChangeAttempt", handleModeChangeAttempt);
    };
  }, [unsavedChangesHook, contextHasUnsavedChanges]);

  // 拡張された保存ハンドラー
  const handleSaveWithConfirmation = async () => {
    try {
      await handleSaveWorldBuilding();
      markAsSaved(); // 保存成功時に未保存状態をリセット
      toast.success("データが正常に保存されました");
    } catch (error) {
      console.error("Save error:", error);
      toast.error("保存中にエラーが発生しました");
    }
  };

  // 安全なナビゲーション関数
  const handleSafeNavigation = (action: () => void) => {
    const canLeave = checkBeforeLeave(action);
    if (!canLeave) {
      setPendingAction(() => action);
      setShowUnsavedDialog(true);
    }
  };

  // 未保存ダイアログのハンドラー
  const handleSaveAndContinue = async () => {
    try {
      await handleSaveWithConfirmation();
      setShowUnsavedDialog(false);
      
      // 未保存状態を明示的にリセット
      markAsSaved();
      setContextHasUnsavedChanges?.(false);
      
      // 少し遅延してからナビゲーションを実行（状態更新を確実にする）
      setTimeout(() => {
        if (pendingAction) {
          pendingAction();
          setPendingAction(null);
        }
      }, 100);
    } catch (error) {
      console.error("Save and continue error:", error);
    }
  };

  const handleContinueWithoutSaving = () => {
    // 未保存状態を強制的にリセット
    markAsSaved();
    setContextHasUnsavedChanges?.(false);
    setShowUnsavedDialog(false);
    
    // 少し遅延してからナビゲーションを実行（beforeunloadイベントを回避）
    setTimeout(() => {
      if (pendingAction) {
        pendingAction();
        setPendingAction(null);
      }
    }, 100);
  };

  const handleDialogClose = () => {
    setShowUnsavedDialog(false);
    setPendingAction(null);
  };

  // useWorldBuildingAIの通知が表示された時にAI処理状態をリセット
  useEffect(() => {
    if (worldBuildingNotificationOpen && isAIProcessing) {
      setIsAIProcessing(false);
    }
  }, [worldBuildingNotificationOpen, isAIProcessing]);

  // AI処理の進行状況管理
  useEffect(() => {
    if (isAIProcessing) {
      setShowProgressSnackbar(true);
      setAiProgress(undefined); // 無限プログレスバーから開始

      // 模擬的な進行状況更新（実際のAI APIから進行状況を取得する場合は置き換え）
      const progressInterval = setInterval(() => {
        setAiProgress((prev) => {
          if (prev === undefined) return 20;
          if (prev >= 80) return prev;
          return prev + Math.random() * 15;
        });
      }, 2000);

      return () => clearInterval(progressInterval);
    } else {
      setShowProgressSnackbar(false);
      setAiProgress(undefined);
    }
  }, [isAIProcessing]);

  const handleCloseProgressSnackbar = () => {
    if (!isAIProcessing) {
      setShowProgressSnackbar(false);
    }
  };

  useEffect(() => {
    const handleBeforeUnload = (event: BeforeUnloadEvent) => {
      if (unsavedChangesHook || contextHasUnsavedChanges || isAIProcessing) {
        event.preventDefault();
        event.returnValue = ""; // For Chrome
        return ""; // For other browsers
      }
    };

    window.addEventListener("beforeunload", handleBeforeUnload);

    return () => {
      window.removeEventListener("beforeunload", handleBeforeUnload);
    };
  }, [unsavedChangesHook, contextHasUnsavedChanges, isAIProcessing]);

  // AIアシスト機能の統合
  const handleOpenAIAssist = (): void => {
    if (!currentCampaign) {
      toast.error("キャンペーンがロードされていません。");
      return;
    }

    // 既にAI処理中の場合は新しい処理を開始しない
    if (isAIProcessing) {
      toast.warning("AI生成が既に実行中です。完了をお待ちください。");
      return;
    }

    // キャンペーンの設定を分析してジャンルを判定
    const synopsis = currentCampaign.synopsis || "";
    const isModernOrFuture =
      synopsis.includes("近未来") ||
      synopsis.includes("現代") ||
      synopsis.includes("AI") ||
      synopsis.includes("テクノロジー") ||
      synopsis.includes("科学");
    const isFantasy =
      synopsis.includes("魔法") ||
      synopsis.includes("ファンタジー") ||
      synopsis.includes("剣") ||
      synopsis.includes("魔王");

    // キャンペーンの文脈に合ったデフォルトメッセージを構築
    let contextualMessage = `「${currentCampaign.title}」の場所情報について、以下の要素を考えてください。

**必須要件:**
- 拠点（NPC、アイテム取引がある場所）を2-3箇所生成してください
- 探索地域（冒険、モンスター遭遇がある場所）を2-3箇所生成してください
- 各場所に適した行動選択肢を含めてください
- プロットやキャラクターとの整合性を保ってください`;

    if (isModernOrFuture) {
      contextualMessage += `
- 現代・近未来設定に適した施設や場所
- 都市エリアと科学技術関連の場所
- 交通機関や通信設備を考慮した配置`;
    } else if (isFantasy) {
      contextualMessage += `
- ファンタジー世界に適した魔法関連施設
- 自然環境や神秘的な場所
- 冒険者が活動しやすい拠点と探索地域`;
    } else {
      contextualMessage += `
- この世界観に適した特色のある場所
- 各場所の独自性と役割分担
- キャラクターが活動しやすい環境設計`;
    }

    contextualMessage += `

**キャンペーンのあらすじ:**
${currentCampaign.synopsis || "（あらすじが設定されていません）"}

**既存のクエスト要素:**
${
  currentCampaign.plot
    ?.map((p) => `- ${p.title}: ${p.description}`)
    .join("\n") || "（クエスト要素が設定されていません）"
}

**既存のキャラクター:**
${
  currentCampaign.characters
    ?.map((c) => `- ${c.name}: ${c.description}`)
    .join("\n") || "（キャラクターが設定されていません）"
}`;

    openAIAssist(
      "worldbuilding",
      {
        title: "AIに場所を生成してもらう",
        description:
          "どのような場所を作りたいか、指示を入力してください。拠点や探索地域の特徴、用途、雰囲気などを具体的に伝えるとよいでしょう。",
        defaultMessage: contextualMessage,
        supportsBatchGeneration: true,
        onComplete: async (result) => {
          console.log("世界観生成完了:", result);

          // 重複実行チェック
          if (isAIProcessing) {
            console.warn(
              "AI処理が既に実行中のため、新しい処理をスキップします"
            );
            return;
          }

          setIsAIProcessing(true);
          try {
            await generateWorldBuildingBatch(
              result.content as string,
              currentCampaign?.plot || [],
              currentCampaign?.characters || []
            );
            setUnsavedChanges(true);
            // 成功メッセージはuseWorldBuildingAIの通知で表示される
          } catch (error) {
            console.error("AIアシスト処理中にエラーが発生しました:", error);
            toast.error("世界観生成中にエラーが発生しました。");
          } finally {
            setIsAIProcessing(false);
          }
        },
      },
      currentCampaign
    );
  };

  const handleResetWorldBuilding = () => {
    if (
      window.confirm(
        "本当に世界観設定をリセットしますか？この操作は元に戻せません。"
      )
    ) {
      resetWorldBuildingElements();
      setUnsavedChanges(true); // Contextのセッターを使用
      // 例: setSnackbarMessage("世界観設定がリセットされました。"); setSnackbarOpen(true);
    }
  };

  if (!currentCampaign) {
    return (
      <Box sx={{ p: 3, textAlign: 'center', py: 8 }}>
        <Typography variant="h5" gutterBottom color="text.secondary">
          キャンペーンが選択されていません
        </Typography>
        <Typography variant="body1" sx={{ mb: 3 }} color="text.secondary">
          世界観構築を行うには、まずキャンペーンを選択してください。
        </Typography>
        <Button 
          variant="contained" 
          onClick={() => window.location.href = '/'}
          sx={{ mt: 2 }}
        >
          ホームに戻ってキャンペーンを選択
        </Button>
      </Box>
    );
  }

  return (
    <Box sx={{ p: { xs: 1, sm: 2, md: 3 }, maxWidth: "1200px", mx: "auto" }}>
      <Paper elevation={2} sx={{ p: 2, mb: 3 }}>
        <Box
          sx={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            flexWrap: "wrap",
            gap: 1,
          }}
        >
          <Box>
            <Typography variant="h4" gutterBottom>
              {currentCampaign.title}
            </Typography>
            <Typography variant="subtitle1" color="text.secondary">
              場所情報設定
            </Typography>
          </Box>
          <Box sx={{ display: "flex", gap: 1, alignItems: "center" }}>
            <Button
              variant="contained"
              color="secondary"
              startIcon={<DeleteSweepIcon />}
              onClick={handleResetWorldBuilding}
              disabled={isAIProcessing}
            >
              場所情報をリセット
            </Button>
            <Button
              variant="contained"
              color="primary"
              startIcon={<SmartToyIcon />}
              onClick={handleOpenAIAssist}
              disabled={isAIProcessing}
            >
              AIに場所を生成してもらう
            </Button>
            <Button
              variant="contained"
              color="success"
              startIcon={<SaveIcon />}
              onClick={handleSaveWithConfirmation}
              disabled={isAIProcessing}
            >
              保存
            </Button>
          </Box>
        </Box>
      </Paper>

      <Paper
        sx={{
          mb: 3,
          borderRadius: "8px",
          boxShadow: "0 4px 8px rgba(0, 0, 0, 0.1)",
          position: "sticky",
          top: 0,
          zIndex: 10,
          backgroundColor: "background.paper",
        }}
      >
        <Tabs
          value={tabValue}
          onChange={handleTabChange}
          variant="scrollable"
          scrollButtons="auto"
          allowScrollButtonsMobile
          aria-label="world building tabs"
          sx={{
            ".MuiTabs-flexContainer": {
              gap: 1,
            },
            ".MuiTab-root": {
              minWidth: "120px",
              px: 2,
              whiteSpace: "nowrap",
            },
            ".MuiTabs-scrollButtons": {
              "&.Mui-disabled": { opacity: 0.3 },
            },
            mb: 1,
          }}
        >
          <Tab
            label={
              updatedTabs[0] ? (
                <Badge color="secondary" variant="dot">
                  拠点
                </Badge>
              ) : (
                "拠点"
              )
            }
            sx={{ fontWeight: tabValue === 0 ? "bold" : "normal" }}
          />
          <Tab
            label={
              updatedTabs[1] ? (
                <Badge color="secondary" variant="dot">
                  場所
                </Badge>
              ) : (
                "場所"
              )
            }
            sx={{ fontWeight: tabValue === 1 ? "bold" : "normal" }}
          />
          <Tab
            label={
              updatedTabs[2] ? (
                <Badge color="secondary" variant="dot">
                  ワールドマップ
                </Badge>
              ) : (
                "ワールドマップ"
              )
            }
            sx={{ fontWeight: tabValue === 2 ? "bold" : "normal" }}
          />
        </Tabs>

        {/* 拠点タブ */}
        <TabPanel value={tabValue} index={0}>
          <BaseTab />
        </TabPanel>

        {/* 場所タブ */}
        <TabPanel value={tabValue} index={1}>
          <LocationTab />
        </TabPanel>

        {/* ワールドマップタブ */}
        <TabPanel value={tabValue} index={2}>
          <WorldMapTab
            mapImageUrl={currentCampaign.worldBuilding?.worldMapImageUrl || ""}
            onMapImageUpload={handleMapImageUpload || (() => {})}
          />
        </TabPanel>
      </Paper>

      <Snackbar
        open={snackbarOpen || false}
        autoHideDuration={6000}
        onClose={handleCloseSnackbar || (() => {})}
        message={snackbarMessage || ""}
      />

      <Snackbar
        open={notificationOpen || false}
        autoHideDuration={6000}
        onClose={() => setNotificationOpen && setNotificationOpen(false)}
        message={notificationMessage || ""}
      />

      <Snackbar
        open={worldBuildingNotificationOpen || false}
        autoHideDuration={6000}
        onClose={() =>
          setWorldBuildingNotificationOpen &&
          setWorldBuildingNotificationOpen(false)
        }
        message="世界観の生成が完了しました！"
        action={
          <Button
            color="inherit"
            size="small"
            onClick={() =>
              setWorldBuildingNotificationOpen &&
              setWorldBuildingNotificationOpen(false)
            }
          >
            閉じる
          </Button>
        }
      />

      <ProgressSnackbar
        open={showProgressSnackbar || isAIProcessing}
        message={
          isAIProcessing && currentElement
            ? `${currentElement}`
            : `AIが世界観を生成中です... ${
                aiProgress ? `${Math.round(aiProgress)}%` : ""
              }`
        }
        severity="info"
        progress={
          aiGenerationProgress !== undefined ? aiGenerationProgress : aiProgress
        }
        loading={isAIProcessing}
        onClose={handleCloseProgressSnackbar}
        position="top-center"
      />

      {/* 未保存データ警告ダイアログ */}
      <UnsavedChangesDialog
        open={showUnsavedDialog}
        onClose={handleDialogClose}
        onSaveAndContinue={handleSaveAndContinue}
        onContinueWithoutSaving={handleContinueWithoutSaving}
        title="未保存の世界観データがあります"
        message="拠点や場所の編集内容が保存されていません。続行する前に保存しますか？"
      />
    </Box>
  );
};

export default WorldBuildingPage;
