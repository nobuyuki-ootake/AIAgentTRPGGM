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
  History as HistoryIcon 
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
import { useAIChatIntegration } from "../hooks/useAIChatIntegration";
import EventSeedReviewDialog from "../components/timeline/EventSeedReviewDialog";
import {
  TimelineEventSeed,
  TimelineEvent,
  // NovelProject, // Unused
  // PlotElement, // Unused
  // Character, // Unused
  // CharacterStatus, // Unused
  // PlaceElement, // Unused
} from "@novel-ai-assistant/types";
import moment from "moment";
import TimelineEventCard from "../components/timeline/TimelineEventCard";
// import { TimelineProvider } from "../contexts/TimelineContext"; // Unused and path error

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
  const currentCampaign = useRecoilValue(currentCampaignState);
  const [developerMode, setDeveloperMode] = useRecoilState(developerModeState);

  const {
    timelineItems, // これは TimelineItem[] であり、TimelineChart など表示系で使われる
    timelineEvents, // ★追加: useTimeline から TimelineEvent[] を取得 (状態そのもの)
    characters,
    places, // ★ useTimeline から places (PlaceElement[]) を再度取得
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
      | { placeId: string; placeTitle?: string; type?: string } // placeTitleとtypeはオプショナルかもしれない
      | undefined;

    if (!dropTargetData || !activatorEvent) {
      console.error(
        "[TimelinePage] Missing dropTargetData or activatorEvent for drag and drop operation.",
        { dropTargetData, activatorEvent }
      );
      return;
    }

    const { placeId: targetPlaceId } = dropTargetData;

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
        alert("エラー: イベント移動処理の関数が見つかりません。");
      }
    } else if (
      draggedItemType === "event-seed" &&
      droppedOnItemType === "timeline-place-column"
    ) {
      const seed = active.data.current?.seed as TimelineEventSeed | undefined;
      if (!seed) {
        console.error(
          "[TimelinePage] Event seed data is missing for 'event-seed' type."
        );
        return;
      }
      const finalDateForSeed =
        estimatedDateString || seed.estimatedTime || new Date().toISOString();
      const targetRelatedPlotIds =
        seed.relatedPlotIds && seed.relatedPlotIds.length > 0
          ? seed.relatedPlotIds
          : allPlots && allPlots.length > 0
          ? [allPlots[0].id]
          : [];
      const newTimelineEvent = convertSeedToTimelineEvent(
        seed,
        timelineEvents,
        0,
        finalDateForSeed,
        targetPlaceId,
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

  console.log(
    "[TimelinePage] definedCharacterStatuses from useTimeline:",
    definedCharacterStatuses
  );

  // セッション履歴ビューのコンポーネント
  const SessionHistoryView: React.FC = () => {
    // 実際のセッション履歴データがある場合の表示
    const sessionHistory = currentCampaign?.sessions || [];
    
    return (
      <Box>
        <Box sx={{ mb: 3, display: 'flex', alignItems: 'center', gap: 2 }}>
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
              <Typography variant="body2" color="text.secondary" align="center" sx={{ mt: 1 }}>
                TRPGセッションを開始すると、ここに履歴が表示されます。
              </Typography>
            </CardContent>
          </Card>
        ) : (
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            {sessionHistory.map((session, index) => (
              <Card key={session.id || index}>
                <CardContent>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                    <Typography variant="h6">
                      セッション {index + 1}: {session.title || `Session ${index + 1}`}
                    </Typography>
                    <Chip 
                      label={session.status || 'Completed'} 
                      color={session.status === 'active' ? 'success' : 'default'}
                      size="small"
                    />
                  </Box>
                  
                  <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                    日時: {session.date ? new Date(session.date).toLocaleDateString('ja-JP') : '未設定'}
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
                      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                        {session.events.slice(0, 3).map((event, eventIndex) => (
                          <Box key={eventIndex} sx={{ pl: 2, borderLeft: '2px solid #e0e0e0' }}>
                            <Typography variant="body2" fontWeight="medium">
                              {event.title || `イベント ${eventIndex + 1}`}
                            </Typography>
                            {event.description && (
                              <Typography variant="caption" color="text.secondary">
                                {event.description.length > 100 
                                  ? `${event.description.substring(0, 100)}...` 
                                  : event.description}
                              </Typography>
                            )}
                          </Box>
                        ))}
                        {session.events.length > 3 && (
                          <Typography variant="caption" color="text.secondary" sx={{ pl: 2 }}>
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
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
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
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      {developerMode ? <DeveloperModeIcon /> : <PlayIcon />}
                      {developerMode ? '開発者モード' : 'プレイモード'}
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
                  ? '🛠️ 開発者モード: イベント管理・シナリオ設計を行います'
                  : '🎮 プレイモード: セッション履歴を閲覧します'
                }
              </Typography>
            </Box>
            
            <Divider />
          </Box>

          {/* 開発者モード: イベント管理・シナリオ設計 */}
          {developerMode ? (
            <>
              <Paper elevation={1} sx={{ p: 2, mb: 2 }}>
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

              {places && places.length > 0 && dateArray && dateArray.length > 0 && (
                <TimelineChart
                  timelineEvents={timelineEvents}
                  places={places}
                  plots={allPlots}
                  dateArray={dateArray}
                  safeMinY={safeMinY}
                  safeMaxY={safeMaxY}
                  onEventClick={handleEventClick}
                  onDeleteEvent={handleDeleteEvent}
                />
              )}
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
                  definedCharacterStatuses={definedCharacterStatuses}
                  onEventChange={handleEventChange}
                  onSave={handleSaveEvent}
                  onCharactersChange={handleCharactersChange}
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
            </>
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
