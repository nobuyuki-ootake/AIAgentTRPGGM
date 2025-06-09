import React, { useState, useCallback } from "react";
import {
  Box,
  Paper,
  Button,
  Snackbar,
  Alert,
  Typography,
  Divider,
  Switch,
  FormControlLabel,
  Chip,
  Card,
  CardContent,
} from "@mui/material";
import {
  Settings as SettingsIcon,
  DeveloperMode as DeveloperModeIcon,
  PlayArrow as PlayIcon,
  History as HistoryIcon,
} from "@mui/icons-material";
import {
  DndContext,
  closestCenter,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
  DragStartEvent,
  DragOverlay,
} from "@dnd-kit/core";
import { useRecoilValue, useRecoilState } from "recoil";
import { currentCampaignState, developerModeState } from "../store/atoms";
import { useTimeline } from "../hooks/useTimeline";
import TimelineEventDialog from "../components/timeline/TimelineEventDialog";
import TimelineSettingsDialog from "../components/timeline/TimelineSettingsDialog";
import TimelineEventList from "../components/timeline/TimelineEventList";
import TimelineChart from "../components/timeline/TimelineChart";
import TimelineDayList from "../components/timeline/TimelineDayList";
import { useAIChatIntegration } from "../hooks/useAIChatIntegration";
import EventSeedReviewDialog from "../components/timeline/EventSeedReviewDialog";
import {
  TimelineEventSeed,
  TimelineEvent,
  PlaceElement,
  BaseLocation,
  ClearCondition,
  EventCondition,
  // TRPGCampaign, // Unused
  // PlotElement, // Unused
  // Character, // Unused
  // CharacterStatus, // Unused
} from "@trpg-ai-gm/types";
import moment from "moment";
import TimelineEventCard from "../components/timeline/TimelineEventCard";
import TimelineEventResultHandler, {
  EventResult,
} from "../components/timeline/TimelineEventResultHandler";
import WorldStateManager from "../components/world/WorldStateManager";
import ClearConditionDialog from "../components/timeline/ClearConditionDialog";
// import { TimelineProvider } from "../contexts/TimelineContext"; // Unused and path error
// TypeScript test: error detection working properly

const convertSeedToTimelineEvent = (
  seed: TimelineEventSeed,
  currentTimelineEvents: TimelineEvent[], // TimelineItem[] から TimelineEvent[] に変更
  indexInBatch: number,
  targetDate?: string,
  targetPlaceId?: string,
  targetRelatedPlotIds?: string[]
): TimelineEvent => {
  const maxOrder = currentTimelineEvents.reduce(
    (max, item) => Math.max(max, item.order || 0), // item.order を参照 (TimelineEventにはorderがある)
    0
  );
  return {
    id: crypto.randomUUID(),
    title: seed.eventName,
    description: seed.description || "",
    date: targetDate || seed.estimatedTime || new Date().toISOString(),
    relatedCharacters: seed.characterIds || [],
    relatedPlaces: targetPlaceId ? [targetPlaceId] : seed.relatedPlaceIds || [],
    placeId:
      targetPlaceId ||
      (seed.relatedPlaceIds && seed.relatedPlaceIds[0]) ||
      undefined,
    order: maxOrder + 1 + indexInBatch,
    eventType: undefined,
    relatedPlotIds: targetRelatedPlotIds || seed.relatedPlotIds || [],
  };
};

const TimelinePage: React.FC = () => {
  const [currentCampaign, setCurrentCampaign] =
    useRecoilState(currentCampaignState);
  const [developerMode, setDeveloperMode] = useRecoilState(developerModeState);

  const {
    timelineItems, // これは TimelineItem[] であり、TimelineChart など表示系で使われる
    timelineEvents, // ★追加: useTimeline から TimelineEvent[] を取得 (状態そのもの)
    characters,
    places, // ★ useTimeline から places (PlaceElement[]) を再度取得
    bases, // ★ useTimeline から bases (BaseLocation[]) を追加
    hasUnsavedChanges,
    dialogOpen,
    isEditing,
    newEvent,
    settingsDialogOpen,
    timelineSettings,
    snackbarOpen,
    snackbarMessage,
    dateArray,
    safeMinY,
    safeMaxY,
    definedCharacterStatuses,
    handleOpenDialog,
    handleCloseDialog,
    handleEventChange,
    handleCharactersChange,
    handleSaveEvent,
    handleDeleteEvent,
    handleResetTimeline,
    handleOpenSettingsDialog,
    handleCloseSettingsDialog,
    handleSaveSettings,
    handleSettingsChange,
    handleEventClick,
    handleSave,
    handleCloseSnackbar,
    getCharacterName,
    getPlaceName,
    handlePostEventStatusChange,
    addTimelineEventsBatch,
    allPlots,
    handleRelatedPlotsChange,
    handleUpdateEventLocationAndDate,
  } = useTimeline();

  const { openAIAssist, closeAIAssist } = useAIChatIntegration();

  const [reviewableEventSeeds, setReviewableEventSeeds] = useState<
    TimelineEventSeed[]
  >([]);
  const [eventSeedReviewDialogOpen, setEventSeedReviewDialogOpen] =
    useState(false);

  const [activeDragItem, setActiveDragItem] = useState<TimelineEvent | null>(
    null
  );

  // Event result handler state
  const [eventResultDialogOpen, setEventResultDialogOpen] = useState(false);
  const [selectedEventForResult, setSelectedEventForResult] =
    useState<TimelineEvent | null>(null);
  const [worldState, setWorldState] = useState<any>(null);

  // Clear condition dialog state
  const [clearConditionDialogOpen, setClearConditionDialogOpen] =
    useState(false);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    })
  );

  const generateDynamicDefaultPrompt = useCallback(
    (selectedPlotId?: string | null): string => {
      let prompt = "例: ";
      let targetPlot = null;

      if (selectedPlotId && allPlots) {
        targetPlot = allPlots.find((p) => p.id === selectedPlotId);
      }

      if (targetPlot) {
        prompt += `クエスト「${targetPlot.title}」において、`;
      } else if (allPlots && allPlots.length > 0) {
        // フォールバック: selectedPlotId がない場合や見つからなかった場合
        const fallbackPlot = allPlots.find((p) => p.title) || allPlots[0];
        prompt += `クエスト「${fallbackPlot.title}」において、`;
      } else {
        prompt += "TRPGセッションの次の展開として、";
      }

      if (characters && characters.length > 0) {
        const mainChars = characters
          .slice(0, 2)
          .map((c) => c.name)
          .filter((name) => name)
          .join("と");
        if (mainChars) {
          prompt += `${mainChars}が関わるイベントを3つ提案してください。エンカウンター、NPCとの会話、クエストの進展など。`;
        } else {
          prompt += "パーティーが関わるイベントを3つ提案してください。";
        }
      } else {
        prompt += "イベントを3つ提案してください。";
      }
      return prompt;
    },
    [allPlots, characters]
  );

  const handleDragStart = (event: DragStartEvent) => {
    const { active } = event;
    if (active.data.current?.eventData) {
      setActiveDragItem(active.data.current.eventData as TimelineEvent);
    } else if (active.data.current?.seed) {
      const seed = active.data.current.seed as TimelineEventSeed;
      const tempEventFromSeed: TimelineEvent = {
        id: `drag-overlay-seed-${crypto.randomUUID()}`,
        title: seed.eventName,
        description: seed.description || "",
        date: seed.estimatedTime || new Date().toISOString(),
        relatedCharacters: seed.characterIds || [],
        relatedPlaces: seed.relatedPlaceIds || [],
        placeId:
          seed.relatedPlaceIds && seed.relatedPlaceIds.length > 0
            ? seed.relatedPlaceIds[0]
            : undefined,
        order: 0,
        eventType: undefined,
        relatedPlotIds: seed.relatedPlotIds || [],
      };
      setActiveDragItem(tempEventFromSeed);
    } else {
      setActiveDragItem(null);
    }
  };

  const handleDragEnd = (event: DragEndEvent) => {
    setActiveDragItem(null);
    const { active, over, activatorEvent } = event;

    if (!over) {
      console.log("[TimelinePage] Drag ended, but not over a droppable area.");
      return;
    }
    console.log("[TimelinePage] DragEndEvent details:", {
      activeId: active.id,
      overId: over.id,
      overRect: over.rect,
      activatorEventCoordinates: {
        clientY: (activatorEvent as MouseEvent)?.clientY,
        clientX: (activatorEvent as MouseEvent)?.clientX,
        pageY: (activatorEvent as MouseEvent)?.pageY,
        pageX: (activatorEvent as MouseEvent)?.pageX,
        screenY: (activatorEvent as MouseEvent)?.screenY,
        screenX: (activatorEvent as MouseEvent)?.screenX,
        target: activatorEvent.target,
      },
      draggedItemType: active.data.current?.type,
      droppedOnItemType: over.data.current?.type,
      activeData: active.data.current,
    });

    const draggedItemType = active.data.current?.type as string;
    const originalEventId = active.data.current?.originalEventId as
      | string
      | undefined;
    const draggedEventData = active.data.current?.eventData as
      | TimelineEvent
      | undefined;

    const droppedOnItemType = over.data.current?.type as string;
    const dropTargetData = over.data.current as
      | {
          placeId?: string;
          placeTitle?: string;
          type?: string;
          date?: string;
          dayKey?: string;
        } // 日付ドロップ用のプロパティを追加
      | undefined;

    if (!dropTargetData || !activatorEvent) {
      console.error(
        "[TimelinePage] Missing dropTargetData or activatorEvent for drag and drop operation.",
        { dropTargetData, activatorEvent }
      );
      return;
    }

    const { placeId: targetPlaceId, date: targetDate } = dropTargetData;

    // 日付計算ロジック (共通化)
    let estimatedDateString: string | undefined = undefined;
    const columnRect = over.rect;
    const columnTop: number | undefined = columnRect.top;
    const columnHeight: number | undefined = columnRect.height;
    console.log("[TimelinePage] Using over.rect for column geometry:", {
      top: columnTop,
      height: columnHeight,
    });

    // active要素の中心Y座標を使用する新しい試み
    let dropYCoordinate: number | undefined = undefined;
    if (active.rect.current.translated) {
      dropYCoordinate =
        active.rect.current.translated.top +
        active.rect.current.translated.height / 2;
      console.log(
        "[TimelinePage] Using active.rect.current.translated for drop Y coordinate:",
        {
          translatedTop: active.rect.current.translated.top,
          translatedHeight: active.rect.current.translated.height,
          calculatedDropY: dropYCoordinate,
        }
      );
    } else {
      console.warn(
        "[TimelinePage] active.rect.current.translated is not available. Falling back to activatorEvent.clientY if possible."
      );
      // フォールバックとして元のclientYを使用 (activatorEvent が MouseEvent の場合のみ)
      if (
        activatorEvent instanceof MouseEvent &&
        typeof activatorEvent.clientY === "number"
      ) {
        dropYCoordinate = activatorEvent.clientY;
        console.log(
          "[TimelinePage] Fallback to activatorEvent.clientY:",
          dropYCoordinate
        );
      }
    }

    if (
      dropYCoordinate !== undefined && // dropYInClient から dropYCoordinate に変更
      columnTop !== undefined && // columnTop が undefined でないことを確認
      columnHeight !== undefined &&
      columnHeight > 0 && // columnHeight が undefined でなく、0より大きいことを確認
      dateArray &&
      dateArray.length > 0 &&
      safeMinY !== undefined &&
      safeMaxY !== undefined &&
      safeMinY < safeMaxY
    ) {
      const relativeYInColumn = dropYCoordinate - columnTop; // dropYInClient から dropYCoordinate に変更
      let yPercentInColumn = (relativeYInColumn / columnHeight) * 100;
      yPercentInColumn = Math.max(0, Math.min(100, yPercentInColumn));

      const totalDuration = safeMaxY - safeMinY;
      const estimatedTimestamp =
        safeMinY + totalDuration * (yPercentInColumn / 100);
      estimatedDateString = moment(estimatedTimestamp)
        .utc()
        .startOf("day")
        .toISOString();

      console.log(
        `[TimelinePage] Drop Y: ${dropYCoordinate}, Column Top: ${columnTop}, Column Height: ${columnHeight}, Y%: ${yPercentInColumn}, Estimated Date: ${estimatedDateString}`
      );
    } else {
      console.warn(
        "[TimelinePage] Could not accurately determine date from drop. Conditions not met:",
        {
          dropYCoordinate, // dropYInClient から dropYCoordinate に変更
          columnTop,
          columnHeight,
          dateArrayLength: dateArray?.length,
          safeMinY,
          safeMaxY,
        }
      );
      // フォールバックとして、現在の日付やアイテムが元々持っていた日付を使うなどの処理が必要かもしれない
    }

    if (
      (draggedItemType === "list-timeline-event" ||
        draggedItemType === "chart-timeline-event") &&
      droppedOnItemType === "timeline-place-column"
    ) {
      if (!originalEventId || !draggedEventData) {
        console.error(
          "[TimelinePage] Original event ID or event data is missing from dragged item."
        );
        return;
      }

      const dateBeforeFinal_new = estimatedDateString;
      const finalDate =
        estimatedDateString ||
        draggedEventData.date ||
        new Date().toISOString();
      console.log("[TimelinePage] Event Drop - Date Calculation Details:", {
        estimatedDateString,
        originalEventDate: draggedEventData.date,
        dateBeforeFinal: dateBeforeFinal_new,
        finalDate,
        draggedItemType,
      });

      if (handleUpdateEventLocationAndDate) {
        handleUpdateEventLocationAndDate(
          originalEventId,
          targetPlaceId,
          finalDate
        );
        console.log(
          `[TimelinePage] Updating event ${originalEventId} (type: ${draggedItemType}) to place ${targetPlaceId} at date ${finalDate}`
        );
      } else {
        console.error(
          "[TimelinePage] handleUpdateEventLocationAndDate is not available from useTimeline."
        );
        console.error("エラー: イベント移動処理の関数が見つかりません。");
      }
    } else if (
      (draggedItemType === "list-timeline-event" ||
        draggedItemType === "chart-timeline-event" ||
        draggedItemType === "day-list-timeline-event") &&
      droppedOnItemType === "timeline-day"
    ) {
      // 日付への直接ドロップ処理
      if (!originalEventId || !draggedEventData) {
        console.error(
          "[TimelinePage] Original event ID or event data is missing from dragged item."
        );
        return;
      }

      const finalDate =
        targetDate || draggedEventData.date || new Date().toISOString();

      if (handleUpdateEventLocationAndDate) {
        // 場所IDは既存のものを保持し、日付のみ更新
        handleUpdateEventLocationAndDate(
          originalEventId,
          draggedEventData.placeId, // 既存の場所IDを保持
          finalDate
        );
        console.log(
          `[TimelinePage] Updating event ${originalEventId} to date ${finalDate}`
        );
      } else {
        console.error(
          "[TimelinePage] handleUpdateEventLocationAndDate is not available."
        );
      }
    } else if (
      draggedItemType === "event-seed" &&
      (droppedOnItemType === "timeline-place-column" ||
        droppedOnItemType === "timeline-day")
    ) {
      const seed = active.data.current?.seed as TimelineEventSeed | undefined;
      if (!seed) {
        console.error(
          "[TimelinePage] Event seed data is missing for 'event-seed' type."
        );
        return;
      }
      const finalDateForSeed =
        targetDate ||
        estimatedDateString ||
        seed.estimatedTime ||
        new Date().toISOString();
      const targetRelatedPlotIds =
        seed.relatedPlotIds && seed.relatedPlotIds.length > 0
          ? seed.relatedPlotIds
          : allPlots && allPlots.length > 0
          ? [allPlots[0].id]
          : [];

      // 日付ドロップの場合、場所IDをseedから取得するか、デフォルト場所を使用
      const finalPlaceId =
        targetPlaceId ||
        (seed.relatedPlaceIds && seed.relatedPlaceIds.length > 0
          ? seed.relatedPlaceIds[0]
          : places && places.length > 0
          ? places[0].id
          : bases && bases.length > 0
          ? bases[0].id
          : undefined);

      const newTimelineEvent = convertSeedToTimelineEvent(
        seed,
        timelineEvents,
        0,
        finalDateForSeed,
        finalPlaceId,
        targetRelatedPlotIds
      );
      addTimelineEventsBatch([newTimelineEvent]);
      console.log(
        `[TimelinePage] Adding new event from seed ${seed.eventName} to place ${targetPlaceId} at date ${finalDateForSeed}`
      );
    } else {
      console.log("[TimelinePage] Unhandled drag and drop scenario.", {
        draggedItemType,
        droppedOnItemType,
        activeData: active.data.current,
        overData: over.data.current,
      });
    }
  };

  // AIアシスト機能の統合
  const handleOpenAIAssistModal = (): void => {
    const dynamicPrompt = generateDynamicDefaultPrompt();

    openAIAssist(
      "timeline",
      {
        title: "AIイベント生成アシスト",
        description:
          "クエストを参照して、タイムラインに必要なイベントを生成します。",
        defaultMessage: dynamicPrompt,
        customControls: {
          plotSelection: true,
        },
        onComplete: (result) => {
          // AIAssistTabで生成されたTimelineEventSeedを受け取る
          console.log("タイムラインイベント生成完了:", result);
          if (result.content && Array.isArray(result.content)) {
            const eventSeeds = result.content as TimelineEventSeed[];
            setReviewableEventSeeds(eventSeeds);
            setEventSeedReviewDialogOpen(true);
          }
        },
      },
      currentCampaign // キャンペーンデータを渡す
    );
  };

  const handleConfirmEventSeeds = (selectedSeeds: TimelineEventSeed[]) => {
    console.log("ユーザーが選択したイベントの種:", selectedSeeds);
    const newEvents: TimelineEvent[] = selectedSeeds.map((seed, index) =>
      convertSeedToTimelineEvent(seed, timelineEvents, index)
    );
    if (newEvents.length > 0) {
      addTimelineEventsBatch(newEvents);
    }
    setEventSeedReviewDialogOpen(false);

    // イベントシード登録後にAIアシストパネルを閉じる
    closeAIAssist();
  };

  // Event result handlers
  const handleEventResultClick = (event: TimelineEvent) => {
    setSelectedEventForResult(event);
    setEventResultDialogOpen(true);
  };

  const handleEventResultSubmit = (result: EventResult) => {
    console.log("Event result submitted:", result);

    // Convert event result to world state change format
    const worldStateChange = {
      eventId: result.eventId,
      eventName: result.eventName,
      eventType: result.eventType,
      success:
        result.outcome === "success" || result.outcome === "partial_success",
      playerActions: result.playerActions,
      consequences: result.consequences,
      affectedLocations: result.affectedLocations,
    };

    // Apply to world state if WorldStateManager is available
    if (worldState) {
      // This would trigger world state changes
      console.log("Applying world state changes:", worldStateChange);
    }

    // Update the event with result information
    // This could be added to the timeline event for reference
    setEventResultDialogOpen(false);
    setSelectedEventForResult(null);
  };

  const handleWorldStateChange = (newState: any) => {
    setWorldState(newState);
  };

  const handleWorldStateSuggestion = (
    suggestion: string,
    priority: "low" | "medium" | "high"
  ) => {
    console.log(`World state suggestion (${priority}):`, suggestion);
    // Could show a snackbar or notification
  };

  // 日付指定でのイベント追加
  const handleAddEventToDay = (date: string) => {
    // 新しいイベント作成時の初期値として日付を設定
    handleEventChange("date", date);
    if (places && places.length > 0) {
      handleEventChange("placeId", places[0].id);
    } else if (bases && bases.length > 0) {
      handleEventChange("placeId", bases[0].id);
    }
    handleOpenDialog();
  };

  // クリア条件設定ダイアログを開く
  const handleOpenClearConditionDialog = () => {
    setClearConditionDialogOpen(true);
  };

  // クリア条件設定ダイアログを閉じる
  const handleCloseClearConditionDialog = () => {
    setClearConditionDialogOpen(false);
  };

  // クリア条件を保存
  const handleSaveClearConditions = (clearConditions: ClearCondition[]) => {
    if (!currentCampaign) return;

    setCurrentCampaign({
      ...currentCampaign,
      clearConditions: clearConditions,
    });

    console.log("クリア条件を保存しました:", clearConditions);
  };

  // イベント条件を変更
  const handleEventConditionsChange = (conditions: EventCondition[]) => {
    // イベントの条件を更新
    handleEventChange({ target: { value: conditions } } as any, "conditions");
  };

  console.log(
    "[TimelinePage] definedCharacterStatuses from useTimeline:",
    definedCharacterStatuses
  );

  // 🧪 **タイムラインクエスト・イベント表示コンポーネント**
  const QuestTimelineView: React.FC = () => {
    const quests = currentCampaign?.quests || [];
    const questsByDay = quests.reduce((acc, quest) => {
      const day = quest.scheduledDay || 1;
      if (!acc[day]) acc[day] = [];
      acc[day].push(quest);
      return acc;
    }, {} as Record<number, typeof quests>);

    const maxDay = Math.max(...Object.keys(questsByDay).map(Number), 7);
    const daysArray = Array.from({ length: maxDay }, (_, i) => i + 1);

    return (
      <Box>
        <Box sx={{ mb: 3, display: "flex", alignItems: "center", gap: 2 }}>
          <SettingsIcon color="primary" />
          <Typography variant="h6">タイムラインイベント管理</Typography>
          <Chip
            label={`${quests.length} イベント`}
            color="primary"
            variant="outlined"
          />
        </Box>

        {quests.length === 0 ? (
          <Card>
            <CardContent>
              <Typography variant="body1" color="text.secondary" align="center">
                タイムラインイベントが設定されていません。
              </Typography>
              <Typography
                variant="body2"
                color="text.secondary"
                align="center"
                sx={{ mt: 1 }}
              >
                TRPGセッションを開始すると、サンプルイベントが自動で追加されます。
              </Typography>
            </CardContent>
          </Card>
        ) : (
          <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
            {daysArray.map((day) => (
              <Card
                key={day}
                sx={{
                  border: questsByDay[day]
                    ? "2px solid #1976d2"
                    : "1px solid #e0e0e0",
                }}
              >
                <CardContent>
                  <Box
                    sx={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                      mb: 2,
                    }}
                  >
                    <Typography variant="h6">{day}日目</Typography>
                    <Chip
                      label={
                        questsByDay[day]
                          ? `${questsByDay[day].length}イベント`
                          : "空き"
                      }
                      color={questsByDay[day] ? "primary" : "default"}
                      size="small"
                    />
                  </Box>

                  {questsByDay[day] ? (
                    <Box
                      sx={{ display: "flex", flexDirection: "column", gap: 2 }}
                    >
                      {questsByDay[day].map((quest) => (
                        <Box
                          key={quest.id}
                          sx={{
                            p: 2,
                            border: "1px solid #e0e0e0",
                            borderRadius: 1,
                            bgcolor:
                              quest.difficulty >= 3 ? "#fff3e0" : "#f5f5f5",
                          }}
                        >
                          <Box
                            sx={{
                              display: "flex",
                              justifyContent: "space-between",
                              alignItems: "center",
                              mb: 1,
                            }}
                          >
                            <Typography variant="subtitle1" fontWeight="bold">
                              {quest.title}
                            </Typography>
                            <Box sx={{ display: "flex", gap: 1 }}>
                              <Chip
                                label={quest.questType}
                                color={
                                  quest.questType === "メイン"
                                    ? "primary"
                                    : "secondary"
                                }
                                size="small"
                              />
                              <Chip
                                label={`難易度 ${quest.difficulty}`}
                                color={
                                  quest.difficulty >= 3 ? "warning" : "success"
                                }
                                size="small"
                              />
                            </Box>
                          </Box>

                          <Typography variant="body2" sx={{ mb: 1 }}>
                            <strong>場所:</strong> {quest.location}
                          </Typography>

                          <Typography variant="body2" sx={{ mb: 1 }}>
                            {quest.description}
                          </Typography>

                          {quest.rewards && quest.rewards.length > 0 && (
                            <Box sx={{ mt: 1 }}>
                              <Typography
                                variant="caption"
                                color="text.secondary"
                              >
                                報酬: {quest.rewards.join(", ")}
                              </Typography>
                            </Box>
                          )}
                        </Box>
                      ))}
                    </Box>
                  ) : (
                    <Typography
                      variant="body2"
                      color="text.secondary"
                      sx={{ fontStyle: "italic" }}
                    >
                      この日にはイベントが設定されていません
                    </Typography>
                  )}
                </CardContent>
              </Card>
            ))}
          </Box>
        )}
      </Box>
    );
  };

  // セッション履歴ビューのコンポーネント
  const SessionHistoryView: React.FC = () => {
    // 実際のセッション履歴データがある場合の表示
    const sessionHistory = currentCampaign?.sessions || [];

    return (
      <Box>
        <Box sx={{ mb: 3, display: "flex", alignItems: "center", gap: 2 }}>
          <HistoryIcon color="primary" />
          <Typography variant="h6">セッション履歴</Typography>
          <Chip
            label={`${sessionHistory.length} セッション`}
            color="primary"
            variant="outlined"
          />
        </Box>

        {sessionHistory.length === 0 ? (
          <Card>
            <CardContent>
              <Typography variant="body1" color="text.secondary" align="center">
                まだセッションが実行されていません。
              </Typography>
              <Typography
                variant="body2"
                color="text.secondary"
                align="center"
                sx={{ mt: 1 }}
              >
                TRPGセッションを開始すると、ここに履歴が表示されます。
              </Typography>
            </CardContent>
          </Card>
        ) : (
          <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
            {sessionHistory.map((session, index) => (
              <Card key={session.id || index}>
                <CardContent>
                  <Box
                    sx={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                      mb: 2,
                    }}
                  >
                    <Typography variant="h6">
                      セッション {index + 1}:{" "}
                      {session.title || `Session ${index + 1}`}
                    </Typography>
                    <Chip
                      label={session.status || "Completed"}
                      color={
                        session.status === "active" ? "success" : "default"
                      }
                      size="small"
                    />
                  </Box>

                  <Typography
                    variant="body2"
                    color="text.secondary"
                    sx={{ mb: 2 }}
                  >
                    日時:{" "}
                    {session.date
                      ? new Date(session.date).toLocaleDateString("ja-JP")
                      : "未設定"}
                  </Typography>

                  {session.description && (
                    <Typography variant="body2" sx={{ mb: 2 }}>
                      {session.description}
                    </Typography>
                  )}

                  {session.events && session.events.length > 0 && (
                    <Box>
                      <Typography variant="subtitle2" sx={{ mb: 1 }}>
                        主要イベント ({session.events.length}件):
                      </Typography>
                      <Box
                        sx={{
                          display: "flex",
                          flexDirection: "column",
                          gap: 1,
                        }}
                      >
                        {session.events.slice(0, 3).map((event, eventIndex) => (
                          <Box
                            key={eventIndex}
                            sx={{ pl: 2, borderLeft: "2px solid #e0e0e0" }}
                          >
                            <Typography variant="body2" fontWeight="medium">
                              {event.title || `イベント ${eventIndex + 1}`}
                            </Typography>
                            {event.description && (
                              <Typography
                                variant="caption"
                                color="text.secondary"
                              >
                                {event.description.length > 100
                                  ? `${event.description.substring(0, 100)}...`
                                  : event.description}
                              </Typography>
                            )}
                          </Box>
                        ))}
                        {session.events.length > 3 && (
                          <Typography
                            variant="caption"
                            color="text.secondary"
                            sx={{ pl: 2 }}
                          >
                            ...他 {session.events.length - 3} 件
                          </Typography>
                        )}
                      </Box>
                    </Box>
                  )}
                </CardContent>
              </Card>
            ))}
          </Box>
        )}
      </Box>
    );
  };

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCenter}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
    >
      <Box sx={{ p: 3 }}>
        <Paper sx={{ p: 3 }}>
          <Box sx={{ mb: 3 }}>
            <Box
              sx={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                mb: 2,
              }}
            >
              <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
                <Typography variant="h5">タイムライン</Typography>
                <FormControlLabel
                  control={
                    <Switch
                      checked={developerMode}
                      onChange={(e) => setDeveloperMode(e.target.checked)}
                      color="primary"
                    />
                  }
                  label={
                    <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                      {developerMode ? <DeveloperModeIcon /> : <PlayIcon />}
                      {developerMode ? "開発者モード" : "プレイモード"}
                    </Box>
                  }
                />
              </Box>

              {developerMode && (
                <Button
                  variant="outlined"
                  color="primary"
                  startIcon={<SettingsIcon />}
                  onClick={handleOpenSettingsDialog}
                  size="small"
                >
                  タイムライン設定
                </Button>
              )}
            </Box>

            {/* モード説明 */}
            <Box sx={{ mb: 2 }}>
              <Typography variant="body2" color="text.secondary">
                {developerMode
                  ? "🛠️ 開発者モード: イベント管理・シナリオ設計を行います"
                  : "🎮 プレイモード: セッション履歴を閲覧します"}
              </Typography>
            </Box>

            <Divider />
          </Box>

          {/* 開発者モード: イベント管理・シナリオ設計 */}
          {developerMode ? (
            <>
              {/* 🧪 クエスト・タイムラインイベント表示 - ユーザー要望により非表示 */}
              {/* <Box sx={{ mb: 3 }}>
                <QuestTimelineView />
              </Box> */}

              {/* 横向き2パネルレイアウト */}
              <Box
                sx={{
                  display: "flex",
                  gap: 3,
                  height: "70vh",
                  minHeight: "500px",
                }}
              >
                {/* 左パネル: イベントリスト */}
                <Paper
                  elevation={1}
                  sx={{
                    flex: "0 0 400px",
                    p: 2,
                    display: "flex",
                    flexDirection: "column",
                    overflow: "hidden",
                  }}
                >
                  <TimelineEventList
                    timelineItems={timelineItems}
                    onAddEvent={handleOpenDialog}
                    onAIAssist={handleOpenAIAssistModal}
                    onEditEvent={handleEventClick}
                    hasUnsavedChanges={hasUnsavedChanges}
                    onSave={handleSave}
                    onDeleteEvent={handleDeleteEvent}
                    onResetTimeline={handleResetTimeline}
                    getCharacterNameById={getCharacterName}
                    getPlaceNameById={getPlaceName}
                  />
                </Paper>

                {/* 右パネル: 日付ベースのタイムライン */}
                <Paper
                  elevation={1}
                  sx={{
                    flex: 1,
                    p: 2,
                    display: "flex",
                    flexDirection: "column",
                    overflow: "hidden",
                  }}
                >
                  {dateArray && dateArray.length > 0 && (
                    <TimelineDayList
                      timelineEvents={timelineEvents}
                      places={[...(places || []), ...(bases || [])]} // placesとbasesを統合
                      plots={allPlots}
                      dateArray={dateArray}
                      onEventClick={handleEventClick}
                      onDeleteEvent={handleDeleteEvent}
                      onEventResultClick={handleEventResultClick}
                      onAddEventToDay={handleAddEventToDay}
                      onClearConditionClick={handleOpenClearConditionDialog}
                    />
                  )}
                </Paper>
              </Box>

              {/* 従来のチャート表示（参考用・必要に応じて削除） */}
              {/* {(places && places.length > 0 || bases && bases.length > 0) && dateArray && dateArray.length > 0 && (
                <TimelineChart
                  timelineEvents={timelineEvents}
                  places={[...(places || []), ...(bases || [])]} // placesとbasesを統合
                  plots={allPlots}
                  dateArray={dateArray}
                  safeMinY={safeMinY}
                  safeMaxY={safeMaxY}
                  onEventClick={handleEventClick}
                  onDeleteEvent={handleDeleteEvent}
                  onEventResultClick={handleEventResultClick}
                />
              )} */}
            </>
          ) : (
            /* プレイモード: セッション履歴閲覧 */
            <SessionHistoryView />
          )}

          {/* 開発者モード専用のダイアログ・モーダル */}
          {developerMode && (
            <>
              <TimelineSettingsDialog
                open={settingsDialogOpen}
                onClose={handleCloseSettingsDialog}
                timelineSettings={timelineSettings}
                onSettingsChange={handleSettingsChange}
                onSave={handleSaveSettings}
              />

              {dialogOpen && (
                <TimelineEventDialog
                  open={dialogOpen}
                  onClose={handleCloseDialog}
                  newEvent={newEvent}
                  isEditing={isEditing}
                  characters={characters}
                  places={[...(places || []), ...(bases || [])]}
                  items={currentCampaign?.items || []}
                  definedCharacterStatuses={definedCharacterStatuses}
                  onEventChange={handleEventChange}
                  onSave={handleSaveEvent}
                  onCharactersChange={handleCharactersChange}
                  onEventResultsChange={(results) => {
                    handleEventChange(
                      { target: { value: results } } as any,
                      "results"
                    );
                  }}
                  onEventConditionsChange={handleEventConditionsChange}
                  getCharacterName={getCharacterName}
                  getPlaceName={getPlaceName}
                  onPostEventStatusChange={handlePostEventStatusChange}
                  allPlots={allPlots}
                  onRelatedPlotsChange={handleRelatedPlotsChange}
                />
              )}

              {reviewableEventSeeds.length > 0 && (
                <EventSeedReviewDialog
                  open={eventSeedReviewDialogOpen}
                  onClose={() => setEventSeedReviewDialogOpen(false)}
                  eventSeeds={reviewableEventSeeds}
                  onConfirm={handleConfirmEventSeeds}
                />
              )}

              <ClearConditionDialog
                open={clearConditionDialogOpen}
                onClose={handleCloseClearConditionDialog}
                onSave={handleSaveClearConditions}
                existingConditions={currentCampaign?.clearConditions || []}
                availableItems={
                  currentCampaign?.items?.filter(
                    (item) => item.type === "key_item"
                  ) || []
                }
                availableQuests={allPlots || []}
                availableCharacters={
                  characters?.map((c) => ({ id: c.id, name: c.name })) || []
                }
                availableLocations={[
                  ...(places?.map((p) => ({ id: p.id, name: p.name })) || []),
                  ...(bases?.map((b) => ({ id: b.id, name: b.name })) || []),
                ]}
              />
            </>
          )}

          {/* プレイモード: 世界状態管理 */}
          {!developerMode && (
            <Box sx={{ mt: 3 }}>
              <WorldStateManager
                campaign={currentCampaign}
                locations={[...(places || []), ...(bases || [])]} // placesとbasesを統合
                onStateChange={handleWorldStateChange}
                onSuggestion={handleWorldStateSuggestion}
              />
            </Box>
          )}

          <Snackbar
            open={snackbarOpen}
            autoHideDuration={6000}
            onClose={handleCloseSnackbar}
          >
            <Alert
              onClose={handleCloseSnackbar}
              severity="success"
              sx={{ width: "100%" }}
            >
              {snackbarMessage}
            </Alert>
          </Snackbar>

          {/* Event Result Handler Dialog */}
          <TimelineEventResultHandler
            open={eventResultDialogOpen}
            event={selectedEventForResult}
            onClose={() => setEventResultDialogOpen(false)}
            onSubmit={handleEventResultSubmit}
            availableLocations={[
              ...(places?.map((p) => ({ id: p.id, name: p.name })) || []),
              ...(bases?.map((b) => ({ id: b.id, name: b.name })) || []),
            ]}
            availableFactions={
              currentCampaign?.factions?.map((f) => ({
                id: f.id,
                name: f.name,
              })) || []
            }
            availableItems={currentCampaign?.items || []}
          />
        </Paper>
      </Box>
      <DragOverlay dropAnimation={null}>
        {activeDragItem ? (
          <TimelineEventCard
            event={activeDragItem}
            onEdit={() => {
              /* Overlay内では機能しない */
            }}
            dndContextType="overlay"
          />
        ) : null}
      </DragOverlay>
    </DndContext>
  );
};

export default TimelinePage;
