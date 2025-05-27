import React from "react";
import {
  Box,
  Typography,
  Paper,
  Button,
  Alert,
  Snackbar,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText,
  DialogActions,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  TextField,
  CircularProgress,
  Stack,
} from "@mui/material";
import AddIcon from "@mui/icons-material/Add";
import SaveIcon from "@mui/icons-material/Save";
import SmartToyIcon from "@mui/icons-material/SmartToy";
import { useWritingContext, WritingProvider } from "../contexts/WritingContext";
import { useAIChatIntegration } from "../hooks/useAIChatIntegration";
import { AIAssistButton } from "../components/ui/AIAssistButton";
import LoadingOverlay from "../components/ui/LoadingOverlay";
import ErrorDisplay from "../components/ui/ErrorDisplay";
import { ProgressSnackbar } from "../components/ui/ProgressSnackbar";
import { NovelProject, TimelineEvent } from "@novel-ai-assistant/types";
import VerticalContentEditorWrapper from "../components/editor/VerticalContentEditorWrapper";
import ChapterList from "../components/writing/ChapterList";
import RelatedEventsList from "../components/writing/RelatedEventsList";
import NewChapterDialog from "../components/writing/NewChapterDialog";
import AssignEventsDialog from "../components/writing/AssignEventsDialog";
import EventDetailDialog from "../components/writing/EventDetailDialog";

// WritingPageの実装コンポーネント
const WritingPageContent: React.FC = () => {
  const {
    editorValue,
    currentChapter,
    currentProject,
    currentChapterId,
    timelineEvents,
    isAiProcessing,
    aiUserInstructions,
    aiTargetLength,
    setAiUserInstructions,
    setAiTargetLength,
    aiOverwriteConfirmOpen,
    handleCloseAiOverwriteConfirm,
    handleConfirmAiOverwrite,
    handleOpenAiOverwriteConfirm,
    generateChapterByAI,
    handleEditorChange,
    handleChapterSelect,
    snackbarOpen,
    snackbarMessage,
    snackbarSeverity,
    editorRef,
    updateCurrentPageFromSelection,
    currentPageInEditor,
    totalPagesInEditor,
    editorKey,
    handleAddPageBreak,
    handlePreviousPageInEditor,
    handleNextPageInEditor,
    newChapterDialogOpen,
    newChapterTitle,
    newChapterSynopsis,
    handleOpenNewChapterDialog,
    handleCloseNewChapterDialog,
    setNewChapterTitle,
    setNewChapterSynopsis,
    handleCreateChapter,
    assignEventsDialogOpen,
    selectedEvents,
    eventDetailDialogOpen,
    selectedEvent,
    handleOpenAssignEventsDialog,
    handleCloseAssignEventsDialog,
    handleToggleEvent,
    handleAssignEvents,
    handleOpenEventDetailDialog,
    handleCloseEventDetailDialog,
    handleAddEventToChapter,
    handleAddNewEvent,
    handleSaveContent,
    closeSnackbar,
  } = useWritingContext();

  const { openAIAssist } = useAIChatIntegration();

  // エラー状態の管理
  const [error, setError] = React.useState<Error | string | null>(null);

  // AI処理の進行状況管理
  const [aiProgress, setAiProgress] = React.useState<number | undefined>(
    undefined
  );
  const [showProgressSnackbar, setShowProgressSnackbar] = React.useState(false);

  // AI処理開始時の処理
  React.useEffect(() => {
    if (isAiProcessing) {
      setShowProgressSnackbar(true);
      setAiProgress(undefined); // 無限プログレスバーから開始

      // 模擬的な進行状況更新（実際のAI APIから進行状況を取得する場合は置き換え）
      const progressInterval = setInterval(() => {
        setAiProgress((prev) => {
          if (prev === undefined) return 10;
          if (prev >= 90) return prev;
          return prev + Math.random() * 20;
        });
      }, 1000);

      return () => clearInterval(progressInterval);
    } else {
      setShowProgressSnackbar(false);
      setAiProgress(undefined);
    }
  }, [isAiProcessing]);

  const handleCloseProgressSnackbar = () => {
    if (!isAiProcessing) {
      setShowProgressSnackbar(false);
    }
  };

  // キャラクター名を取得する関数
  const getCharacterName = (characterId: string) => {
    const characters = (currentProject as NovelProject)?.characters || [];
    const character = characters.find(
      (c: { id: string }) => c.id === characterId
    );
    return character ? character.name : characterId;
  };

  // 場所名を取得する関数
  const getPlaceName = (placeId: string) => {
    const places =
      (currentProject as NovelProject)?.worldBuilding?.places || [];
    const place = places.find((p: { id: string }) => p.id === placeId);
    return place ? place.name : placeId;
  };

  // イベントが既に章に割り当てられているかチェックする関数
  const isEventAlreadyInChapter = (eventId: string) => {
    return currentChapter?.relatedEvents?.includes(eventId) ?? false;
  };

  // AI章生成機能（ローカル実装）
  const localHandleGenerateChapterByAI = async (): Promise<void> => {
    if (!currentChapter || !currentProject) {
      setError("章またはプロジェクトが選択されていません");
      return;
    }

    try {
      setError(null); // エラーをクリア

      // 関連イベントの詳細を取得
      const relatedEventDetails =
        currentChapter.relatedEvents
          ?.map((eventId) =>
            timelineEvents?.find((event) => event.id === eventId)
          )
          .filter((event): event is TimelineEvent => !!event) || [];

      // 関連キャラクターの詳細を取得
      const characterIdsInEvents = new Set<string>();
      relatedEventDetails.forEach((event) => {
        event.relatedCharacters?.forEach((charId) =>
          characterIdsInEvents.add(charId)
        );
      });

      const charactersInChapter = Array.from(characterIdsInEvents)
        .map((charId) => {
          const char = currentProject.characters?.find((c) => c.id === charId);
          return char
            ? {
                id: char.id,
                name: char.name,
                description: char.description,
                role: char.role || ("supporting" as const),
              }
            : null;
        })
        .filter((char): char is NonNullable<typeof char> => char !== null);

      // 関連場所の詳細を取得
      const locationIdsInEvents = new Set<string>();
      relatedEventDetails.forEach((event) => {
        event.relatedPlaces?.forEach((placeId) =>
          locationIdsInEvents.add(placeId)
        );
        if (event.placeId) locationIdsInEvents.add(event.placeId);
      });

      const selectedLocations = Array.from(locationIdsInEvents)
        .map((placeId) => {
          const place = currentProject.worldBuilding?.places?.find(
            (p) => p.id === placeId
          );
          return place
            ? {
                id: place.id,
                name: place.name,
                description: place.description,
              }
            : null;
        })
        .filter(
          (location): location is NonNullable<typeof location> =>
            location !== null
        );

      // AI生成パラメータを構築
      const aiParams = {
        chapterTitle: currentChapter.title,
        relatedEvents: relatedEventDetails.map((event) => ({
          id: event.id,
          title: event.title,
          description: event.description,
        })),
        charactersInChapter,
        selectedLocations,
        userInstructions: aiUserInstructions,
        targetChapterLength: aiTargetLength || "medium",
        model: "gpt-4", // デフォルトモデル
      };

      // 既存の内容がある場合は上書き確認
      const hasContent =
        editorValue &&
        Array.isArray(editorValue) &&
        editorValue.length > 0 &&
        editorValue.some((node) => {
          if ("children" in node && Array.isArray(node.children)) {
            return node.children.some((child) => {
              return "text" in child && child.text && child.text.trim() !== "";
            });
          }
          return false;
        });

      if (hasContent) {
        // 上書き確認ダイアログを表示
        handleOpenAiOverwriteConfirm(aiParams);
      } else {
        // 直接生成開始
        await generateChapterByAI(aiParams);
      }
    } catch (err) {
      console.error("AI章生成エラー:", err);
      setError(err instanceof Error ? err : "AI章生成中にエラーが発生しました");
    }
  };

  // AIChatPanelからAI章生成機能を利用（既存の関数を改良）
  const handleOpenAIAssist = async (): Promise<void> => {
    if (!currentChapter || !currentProject) return;

    // 関連イベントの詳細を取得
    const relatedEventDetails =
      currentChapter.relatedEvents
        ?.map((eventId) =>
          timelineEvents?.find((event) => event.id === eventId)
        )
        .filter((event): event is TimelineEvent => !!event)
        .map((event) => `- ${event.title}: ${event.description}`)
        .join("\n") || "関連イベントなし";

    // 関連キャラクターの詳細を取得
    const characterIdsInEvents = new Set<string>();
    currentChapter.relatedEvents?.forEach((eventId) => {
      const event = timelineEvents?.find((e) => e.id === eventId);
      event?.relatedCharacters?.forEach((charId) =>
        characterIdsInEvents.add(charId)
      );
    });

    const charactersInfo =
      Array.from(characterIdsInEvents)
        .map((charId) => {
          const char = currentProject.characters?.find((c) => c.id === charId);
          return char ? `- ${char.name}: ${char.description}` : null;
        })
        .filter(Boolean)
        .join("\n") || "関連キャラクターなし";

    // 関連場所の詳細を取得
    const locationIdsInEvents = new Set<string>();
    currentChapter.relatedEvents?.forEach((eventId) => {
      const event = timelineEvents?.find((e) => e.id === eventId);
      event?.relatedPlaces?.forEach((placeId) =>
        locationIdsInEvents.add(placeId)
      );
      if (event?.placeId) locationIdsInEvents.add(event.placeId);
    });

    const locationsInfo =
      Array.from(locationIdsInEvents)
        .map((placeId) => {
          const place = currentProject.worldBuilding?.places?.find(
            (p) => p.id === placeId
          );
          return place ? `- ${place.name}: ${place.description}` : null;
        })
        .filter(Boolean)
        .join("\n") || "関連場所なし";

    const defaultMessage = `「${currentChapter.title}」の章を執筆してください。

【章の情報】
タイトル: ${currentChapter.title}
あらすじ: ${currentChapter.synopsis || "未設定"}

【関連イベント】
${relatedEventDetails}

【登場キャラクター】
${charactersInfo}

【舞台となる場所】
${locationsInfo}

【追加指示】
${aiUserInstructions || "特になし"}

【希望する長さ】
${
  aiTargetLength === "short"
    ? "短め"
    : aiTargetLength === "medium"
    ? "普通"
    : aiTargetLength === "long"
    ? "長め"
    : "指定なし"
}

上記の情報を参考に、物語の流れに沿った章を執筆してください。`;

    openAIAssist(
      "writing",
      {
        title: "AI章執筆アシスト",
        description:
          "章の情報、関連イベント、キャラクター、場所を参考に章を執筆します。",
        defaultMessage,
        onComplete: (result) => {
          if (result && result.content) {
            // 生成された内容をエディターに設定
            // 既存の内容がある場合は上書き確認を表示
            const hasContent =
              editorValue &&
              Array.isArray(editorValue) &&
              editorValue.length > 0;
            if (hasContent) {
              // 上書き確認ダイアログを表示する処理
              // WritingContextの機能を利用
              console.log("Generated content:", result.content);
              // 実際の実装では、生成された内容を一時保存して上書き確認後に適用
            } else {
              // エディターの値を更新（型に応じて適切に変換）
              console.log("Setting generated content:", result.content);
              // handleEditorChangeの実装に依存するため、ここではログのみ
            }
          }
        },
      },
      currentProject
    );
  };

  if (!currentProject) {
    return (
      <Box sx={{ p: 3 }}>
        <Typography>プロジェクトが選択されていません。</Typography>
      </Box>
    );
  }

  return (
    <Box
      sx={{
        p: 2,
        display: "flex",
        flexDirection: "column",
        height: "calc(100vh - 112px)",
        position: "relative",
      }}
    >
      {/* エラー表示 */}
      {error && (
        <Box sx={{ mb: 2 }}>
          <ErrorDisplay
            error={error}
            variant="alert"
            showRetry={true}
            onRetry={() => setError(null)}
            onDismiss={() => setError(null)}
          />
        </Box>
      )}

      <Paper elevation={2} sx={{ p: 2, mb: 2 }}>
        <Box
          sx={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
          }}
        >
          <Box>
            <Typography variant="h4" gutterBottom>
              {(currentProject as NovelProject).title}
            </Typography>
            {currentChapter && (
              <Typography variant="h5" color="text.secondary">
                {currentChapter.title}
              </Typography>
            )}
          </Box>
          <Box sx={{ display: "flex", gap: 1, alignItems: "center" }}>
            {currentChapter && (
              <Button
                variant="contained"
                color="success"
                startIcon={<SaveIcon />}
                onClick={handleSaveContent}
                disabled={isAiProcessing}
              >
                保存
              </Button>
            )}
            <>
              <FormControl size="small" sx={{ minWidth: 120 }}>
                <InputLabel id="ai-target-length-label">章の長さ</InputLabel>
                <Select
                  labelId="ai-target-length-label"
                  value={aiTargetLength}
                  label="章の長さ"
                  onChange={(e) =>
                    setAiTargetLength(
                      e.target.value as "short" | "medium" | "long" | ""
                    )
                  }
                  disabled={isAiProcessing}
                >
                  <MenuItem value="">
                    <em>指定なし</em>
                  </MenuItem>
                  <MenuItem value="short">短め</MenuItem>
                  <MenuItem value="medium">普通</MenuItem>
                  <MenuItem value="long">長め</MenuItem>
                </Select>
              </FormControl>
              <TextField
                label="AIへの追加指示"
                size="small"
                variant="outlined"
                value={aiUserInstructions}
                onChange={(e) => setAiUserInstructions(e.target.value)}
                disabled={isAiProcessing}
                sx={{ flexGrow: 1, minWidth: 150 }}
              />
              <Button
                variant="contained"
                color="primary"
                startIcon={
                  isAiProcessing ? (
                    <CircularProgress size={20} color="inherit" />
                  ) : (
                    <SmartToyIcon />
                  )
                }
                onClick={localHandleGenerateChapterByAI}
                disabled={isAiProcessing || !currentChapter}
                sx={{ whiteSpace: "nowrap" }}
              >
                AIに執筆してもらう
              </Button>
              <AIAssistButton
                onAssist={handleOpenAIAssist}
                text="AIチャットで執筆"
                variant="outline"
                disabled={!currentChapter}
              />
            </>
            <Button
              variant="contained"
              startIcon={<AddIcon />}
              onClick={handleOpenNewChapterDialog}
              disabled={isAiProcessing}
            >
              新規章作成
            </Button>
          </Box>
        </Box>
      </Paper>

      <Stack
        direction={{ xs: "column", md: "row" }}
        spacing={2}
        sx={{ flexGrow: 1, overflow: "hidden" }}
      >
        <Box
          sx={{
            width: { xs: "100%", md: "25%" },
            display: "flex",
            flexDirection: "column",
          }}
        >
          <ChapterList
            chapters={(currentProject as NovelProject).chapters}
            currentChapterId={currentChapterId}
            onSelectChapter={handleChapterSelect}
          />

          {currentChapter && (
            <Box sx={{ mt: 2, flexGrow: 1, overflowY: "auto" }}>
              <RelatedEventsList
                events={timelineEvents || []}
                relatedEventIds={currentChapter.relatedEvents || []}
                onViewEvent={handleOpenEventDetailDialog}
                onAssignEvents={handleOpenAssignEventsDialog}
              />
            </Box>
          )}
        </Box>

        <Box
          sx={{
            width: { xs: "100%", md: "75%" },
            display: "flex",
            flexDirection: "column",
          }}
        >
          {currentChapter ? (
            <>
              <Paper sx={{ mb: 2 }}>
                <Box
                  sx={{
                    display: "flex",
                    justifyContent: "center",
                    alignItems: "center",
                    mt: 1,
                    gap: 1,
                  }}
                >
                  <Button
                    onClick={handlePreviousPageInEditor}
                    disabled={currentPageInEditor <= 1}
                  >
                    前のページ
                  </Button>
                  <Typography>
                    {currentPageInEditor} / {totalPagesInEditor}
                  </Typography>
                  <Button
                    onClick={handleNextPageInEditor}
                    disabled={currentPageInEditor >= totalPagesInEditor}
                  >
                    次のページ
                  </Button>
                  <Button onClick={handleAddPageBreak} startIcon={<AddIcon />}>
                    改ページ追加
                  </Button>
                </Box>
              </Paper>

              <Box
                sx={{ flexGrow: 1, display: "flex", flexDirection: "column" }}
              >
                <VerticalContentEditorWrapper
                  value={editorValue}
                  onChange={handleEditorChange}
                  editorRef={editorRef}
                  editorKey={editorKey}
                  onSelectionChange={updateCurrentPageFromSelection}
                />
              </Box>
            </>
          ) : (
            <Paper elevation={1} sx={{ p: 3, textAlign: "center" }}>
              <Typography variant="h6" color="text.secondary" gutterBottom>
                章が選択されていません
              </Typography>
              <Typography variant="body1" sx={{ mb: 2 }}>
                左側のリストから章を選択するか、新しい章を作成してください。
              </Typography>
              <Button
                variant="outlined"
                startIcon={<AddIcon />}
                onClick={handleOpenNewChapterDialog}
              >
                新規章作成
              </Button>
            </Paper>
          )}
        </Box>
      </Stack>

      {/* ダイアログコンポーネント */}
      <NewChapterDialog
        open={newChapterDialogOpen}
        title={newChapterTitle}
        synopsis={newChapterSynopsis}
        onClose={handleCloseNewChapterDialog}
        onTitleChange={setNewChapterTitle}
        onSynopsisChange={setNewChapterSynopsis}
        onCreateChapter={handleCreateChapter}
      />

      <AssignEventsDialog
        open={assignEventsDialogOpen}
        events={timelineEvents || []}
        selectedEvents={selectedEvents}
        characters={(currentProject as NovelProject).characters || []}
        places={(currentProject as NovelProject).worldBuilding?.places || []}
        allPlots={(currentProject as NovelProject).plot || []}
        onClose={handleCloseAssignEventsDialog}
        onToggle={handleToggleEvent}
        onSave={handleAssignEvents}
        onViewEventDetails={handleOpenEventDetailDialog}
        onAddNewEvent={handleAddNewEvent}
        getCharacterName={getCharacterName}
        getPlaceName={getPlaceName}
      />

      <EventDetailDialog
        open={eventDetailDialogOpen}
        event={selectedEvent}
        onClose={handleCloseEventDetailDialog}
        onAddToChapter={
          selectedEvent && !isEventAlreadyInChapter(selectedEvent.id)
            ? () => handleAddEventToChapter(selectedEvent.id)
            : undefined
        }
        isAlreadyInChapter={
          selectedEvent ? isEventAlreadyInChapter(selectedEvent.id) : false
        }
        getCharacterName={getCharacterName}
        getPlaceName={getPlaceName}
      />

      {/* 確認ダイアログ */}
      <Dialog
        open={aiOverwriteConfirmOpen}
        onClose={handleCloseAiOverwriteConfirm}
        aria-labelledby="ai-overwrite-dialog-title"
        aria-describedby="ai-overwrite-dialog-description"
      >
        <DialogTitle id="ai-overwrite-dialog-title">
          内容の上書き確認
        </DialogTitle>
        <DialogContent>
          <DialogContentText id="ai-overwrite-dialog-description">
            この操作により現在の章の内容を上書きします。よろしいですか？
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseAiOverwriteConfirm} color="primary">
            キャンセル
          </Button>
          <Button
            onClick={handleConfirmAiOverwrite}
            color="primary"
            variant="contained"
            disabled={isAiProcessing}
          >
            上書きする
          </Button>
        </DialogActions>
      </Dialog>

      {/* Snackbar */}
      <Snackbar
        open={snackbarOpen}
        autoHideDuration={6000}
        onClose={closeSnackbar}
        anchorOrigin={{ vertical: "bottom", horizontal: "left" }}
      >
        <Alert onClose={closeSnackbar} severity={snackbarSeverity}>
          {snackbarMessage}
        </Alert>
      </Snackbar>

      {/* AI処理中のローディングオーバーレイ */}
      <LoadingOverlay
        open={isAiProcessing}
        message="AIが章を執筆しています..."
        variant="overlay"
      />

      <ProgressSnackbar
        open={showProgressSnackbar}
        message="AIが章を執筆しています..."
        severity="info"
        progress={aiProgress}
        loading={isAiProcessing}
        onClose={handleCloseProgressSnackbar}
        position="bottom-right"
      />
    </Box>
  );
};

// ラッパーコンポーネント
const WritingPage: React.FC = () => {
  return (
    <WritingProvider>
      <WritingPageContent />
    </WritingProvider>
  );
};

export default WritingPage;
