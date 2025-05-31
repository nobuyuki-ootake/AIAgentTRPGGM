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
import SettingTab from "../components/worldbuilding/SettingTab";
import TabPanel from "../components/worldbuilding/TabPanel";
import SocietyCultureTab from "../components/worldbuilding/SocietyCultureTab";
import GeographyEnvironmentTab from "../components/worldbuilding/GeographyEnvironmentTab";
import HistoryLegendTab from "../components/worldbuilding/HistoryLegendTab";
import MagicTechnologyTab from "../components/worldbuilding/MagicTechnologyTab";
import RulesTab from "../components/worldbuilding/RulesTab";
import PlacesTab from "../components/worldbuilding/PlacesTab";
import FreeFieldsTab from "../components/worldbuilding/FreeFieldsTab";
import CharacterStatusList from "../components/characters/CharacterStatusList";
import { useAIChatIntegration } from "../hooks/useAIChatIntegration";
import { useRecoilValue } from "recoil";
import { currentProjectState } from "../store/atoms";
import { useWorldBuildingContext } from "../contexts/WorldBuildingContext";
import { useWorldBuildingAI } from "../hooks/useWorldBuildingAI";
import { useElementAccumulator } from "../hooks/useElementAccumulator";
import { ProgressSnackbar } from "../components/ui/ProgressSnackbar";
import { toast } from "sonner";

const WorldBuildingPage: React.FC = () => {
  const currentProject = useRecoilValue(currentProjectState);
  const { resetWorldBuildingElements } = useElementAccumulator();
  const { openAIAssist } = useAIChatIntegration();

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
    hasUnsavedChanges,
    setHasUnsavedChanges,
  } = useWorldBuildingContext();

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
      if (hasUnsavedChanges || isAIProcessing) {
        event.preventDefault();
        event.returnValue = ""; // For Chrome
        return ""; // For other browsers
      }
    };

    window.addEventListener("beforeunload", handleBeforeUnload);

    return () => {
      window.removeEventListener("beforeunload", handleBeforeUnload);
    };
  }, [hasUnsavedChanges, isAIProcessing]);

  // AIアシスト機能の統合
  const handleOpenAIAssist = (): void => {
    if (!currentProject) {
      toast.error("プロジェクトがロードされていません。");
      return;
    }

    // 既にAI処理中の場合は新しい処理を開始しない
    if (isAIProcessing) {
      toast.warning("AI生成が既に実行中です。完了をお待ちください。");
      return;
    }

    // プロジェクトの設定を分析してジャンルを判定
    const synopsis = currentProject.synopsis || "";
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

    // プロジェクトの文脈に合ったデフォルトメッセージを構築
    let contextualMessage = `「${currentProject.title}」の世界観について、以下の要素を考えてください。

**必須要件:**
- 物語の舞台となる主要な場所を最低3つ生成してください
- プロットやキャラクターとの整合性を保ってください`;

    if (isModernOrFuture) {
      contextualMessage += `
- 現代・近未来設定に適した技術やシステム
- 社会制度や組織の構造
- 地理的な環境や都市の特徴`;
    } else if (isFantasy) {
      contextualMessage += `
- ファンタジー世界に適した魔法システムや伝説
- 特徴的な文化や風習
- 地理的環境や自然の特徴`;
    } else {
      contextualMessage += `
- この世界のルールや制約
- 特徴的な文化や風習
- 地理的環境や社会制度`;
    }

    contextualMessage += `

**物語のあらすじ:**
${currentProject.synopsis || "（あらすじが設定されていません）"}

**既存のプロット要素:**
${
  currentProject.plot
    ?.map((p) => `- ${p.title}: ${p.description}`)
    .join("\n") || "（プロット要素が設定されていません）"
}

**既存のキャラクター:**
${
  currentProject.characters
    ?.map((c) => `- ${c.name}: ${c.description}`)
    .join("\n") || "（キャラクターが設定されていません）"
}`;

    openAIAssist(
      "worldbuilding",
      {
        title: "AIに世界観を考えてもらう",
        description:
          "どのような世界観にしたいか、指示を入力してください。物語の雰囲気や時代背景、主要な場所などを具体的に伝えるとよいでしょう。",
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
              currentProject?.plot || [],
              currentProject?.characters || []
            );
            setHasUnsavedChanges(true);
            // 成功メッセージはuseWorldBuildingAIの通知で表示される
          } catch (error) {
            console.error("AIアシスト処理中にエラーが発生しました:", error);
            toast.error("世界観生成中にエラーが発生しました。");
          } finally {
            setIsAIProcessing(false);
          }
        },
      },
      currentProject
    );
  };

  const handleResetWorldBuilding = () => {
    if (
      window.confirm(
        "本当に世界観設定をリセットしますか？この操作は元に戻せません。"
      )
    ) {
      resetWorldBuildingElements();
      setHasUnsavedChanges(true); // Contextのセッターを使用
      // 例: setSnackbarMessage("世界観設定がリセットされました。"); setSnackbarOpen(true);
    }
  };

  if (!currentProject) {
    return (
      <Box sx={{ p: 3 }}>
        <Typography>プロジェクトが選択されていません。</Typography>
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
              {currentProject.title}
            </Typography>
            <Typography variant="subtitle1" color="text.secondary">
              世界観構築
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
              世界観をリセット
            </Button>
            <Button
              variant="contained"
              color="primary"
              startIcon={<SmartToyIcon />}
              onClick={handleOpenAIAssist}
              disabled={isAIProcessing}
            >
              AIに世界観を考えてもらう
            </Button>
            <Button
              variant="contained"
              color="success"
              startIcon={<SaveIcon />}
              onClick={handleSaveWorldBuilding}
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
                  ワールドマップ
                </Badge>
              ) : (
                "ワールドマップ"
              )
            }
            sx={{ fontWeight: tabValue === 0 ? "bold" : "normal" }}
          />
          <Tab
            label={
              updatedTabs[1] ? (
                <Badge color="secondary" variant="dot">
                  世界観設定
                </Badge>
              ) : (
                "世界観設定"
              )
            }
            sx={{ fontWeight: tabValue === 1 ? "bold" : "normal" }}
          />
          <Tab
            label={
              updatedTabs[2] ? (
                <Badge color="secondary" variant="dot">
                  ルール
                </Badge>
              ) : (
                "ルール"
              )
            }
            sx={{ fontWeight: tabValue === 2 ? "bold" : "normal" }}
          />
          <Tab
            label={
              updatedTabs[3] ? (
                <Badge color="secondary" variant="dot">
                  地名
                </Badge>
              ) : (
                "地名"
              )
            }
            sx={{ fontWeight: tabValue === 3 ? "bold" : "normal" }}
          />
          <Tab
            label={
              updatedTabs[4] ? (
                <Badge color="secondary" variant="dot">
                  社会と文化
                </Badge>
              ) : (
                "社会と文化"
              )
            }
            sx={{ fontWeight: tabValue === 4 ? "bold" : "normal" }}
          />
          <Tab
            label={
              updatedTabs[5] ? (
                <Badge color="secondary" variant="dot">
                  地理と環境
                </Badge>
              ) : (
                "地理と環境"
              )
            }
            sx={{ fontWeight: tabValue === 5 ? "bold" : "normal" }}
          />
          <Tab
            label={
              updatedTabs[6] ? (
                <Badge color="secondary" variant="dot">
                  歴史と伝説
                </Badge>
              ) : (
                "歴史と伝説"
              )
            }
            sx={{ fontWeight: tabValue === 6 ? "bold" : "normal" }}
          />
          <Tab
            label={
              updatedTabs[7] ? (
                <Badge color="secondary" variant="dot">
                  魔法と技術
                </Badge>
              ) : (
                "魔法と技術"
              )
            }
            sx={{ fontWeight: tabValue === 7 ? "bold" : "normal" }}
          />
          <Tab
            label={
              updatedTabs[8] ? (
                <Badge color="secondary" variant="dot">
                  自由記述欄
                </Badge>
              ) : (
                "自由記述欄"
              )
            }
            sx={{ fontWeight: tabValue === 8 ? "bold" : "normal" }}
          />
          <Tab
            label={
              updatedTabs[9] ? (
                <Badge color="secondary" variant="dot">
                  状態定義
                </Badge>
              ) : (
                "状態定義"
              )
            }
            sx={{ fontWeight: tabValue === 9 ? "bold" : "normal" }}
          />
        </Tabs>

        {/* ワールドマップタブ */}
        <TabPanel value={tabValue} index={0}>
          <WorldMapTab
            mapImageUrl={currentProject.worldBuilding?.worldMapImageUrl || ""}
            onMapImageUpload={handleMapImageUpload || (() => {})}
          />
        </TabPanel>

        {/* 世界観設定タブ */}
        <TabPanel value={tabValue} index={1}>
          <SettingTab settings={currentProject.worldBuilding?.setting || []} />
        </TabPanel>

        {/* ルールタブ */}
        <TabPanel value={tabValue} index={2}>
          <RulesTab />
        </TabPanel>

        {/* 地名タブ */}
        <TabPanel value={tabValue} index={3}>
          <PlacesTab />
        </TabPanel>

        {/* 社会と文化タブ */}
        <TabPanel value={tabValue} index={4}>
          <SocietyCultureTab />
        </TabPanel>

        {/* 地理と環境タブ */}
        <TabPanel value={tabValue} index={5}>
          <GeographyEnvironmentTab />
        </TabPanel>

        {/* 歴史と伝説タブ */}
        <TabPanel value={tabValue} index={6}>
          <HistoryLegendTab />
        </TabPanel>

        {/* 魔法と技術タブ */}
        <TabPanel value={tabValue} index={7}>
          <MagicTechnologyTab />
        </TabPanel>

        {/* 自由記述欄タブ */}
        <TabPanel value={tabValue} index={8}>
          <FreeFieldsTab />
        </TabPanel>

        {/* 状態定義タブ */}
        <TabPanel value={tabValue} index={9}>
          <Box sx={{ mt: 2 }}>
            <Typography variant="h6" gutterBottom>
              定義済みキャラクターステータス
            </Typography>
            <Button
              variant="contained"
              onClick={() => {
                // コンテキストから必要な関数がないので実装しない
                console.log("キャラクターステータス追加機能は未実装です");
              }}
              sx={{ mb: 2 }}
            >
              新しい状態を追加
            </Button>
            <CharacterStatusList
              statuses={[]}
              onEdit={() => {
                // コンテキストから必要な関数がないので実装しない
                console.log("キャラクターステータス編集機能は未実装です");
              }}
              onDelete={() => {
                // コンテキストから必要な関数がないので実装しない
                console.log("キャラクターステータス削除機能は未実装です");
              }}
            />
          </Box>
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
    </Box>
  );
};

export default WorldBuildingPage;
