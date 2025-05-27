import React, { useState, useEffect, useCallback } from "react";
import {
  Box,
  Paper,
  Button,
  Snackbar,
  Alert,
  Typography,
  Divider,
} from "@mui/material";
import { Settings as SettingsIcon } from "@mui/icons-material";
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
import { useTimeline } from "../hooks/useTimeline";
import TimelineEventDialog from "../components/timeline/TimelineEventDialog";
import TimelineSettingsDialog from "../components/timeline/TimelineSettingsDialog";
import TimelineEventList from "../components/timeline/TimelineEventList";
import TimelineChart from "../components/timeline/TimelineChart";
import { useAIChatIntegration } from "../hooks/useAIChatIntegration";
import { useTimelineAI } from "../hooks/useTimelineAI";
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

  const { eventSeeds, error: aiError, generateEventSeeds } = useTimelineAI();

  const { openAIAssist } = useAIChatIntegration();

  const [aiErrorSnackbarOpen, setAiErrorSnackbarOpen] = useState(false);
  const [aiErrorMessage, setAiErrorMessage] = useState("");
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
        prompt += `プロット「${targetPlot.title}」において、`;
      } else if (allPlots && allPlots.length > 0) {
        // フォールバック: selectedPlotId がない場合や見つからなかった場合
        const fallbackPlot = allPlots.find((p) => p.title) || allPlots[0];
        prompt += `プロット「${fallbackPlot.title}」において、`;
      } else {
        prompt += "物語の次の展開として、";
      }

      if (characters && characters.length > 0) {
        const mainChars = characters
          .slice(0, 2)
          .map((c) => c.name)
          .filter((name) => name)
          .join("と");
        if (mainChars) {
          prompt += `${mainChars}が関わる重要な出来事を3つ提案してください。`;
        } else {
          prompt += "登場人物が関わる重要な出来事を3つ提案してください。";
        }
      } else {
        prompt += "何らかの重要な出来事を3つ提案してください。";
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
          "プロットを参照して、タイムラインに必要なイベントを生成します。",
        defaultMessage: dynamicPrompt,
        customControls: {
          plotSelection: true,
        },
        onComplete: async (result) => {
          // イベント生成完了時の処理
          console.log("イベント生成完了:", result);
          // 実際のAI生成処理を実行
          await generateEventSeeds({
            prompt: result.content,
            plotId: null, // プロット選択機能は後で実装
            allPlots: allPlots,
            characters: characters,
            places: places,
          });
        },
      },
      null // currentProjectは不要
    );
  };

  useEffect(() => {
    if (eventSeeds && eventSeeds.length > 0) {
      console.log("AIによって生成されたイベントの種:", eventSeeds);
      setReviewableEventSeeds(eventSeeds);
      setEventSeedReviewDialogOpen(true);
    }
  }, [eventSeeds]);

  useEffect(() => {
    if (aiError) {
      console.error("AI処理エラー:", aiError);
      setAiErrorMessage(aiError.message || "AI処理中にエラーが発生しました。");
      setAiErrorSnackbarOpen(true);
    }
  }, [aiError]);

  const handleCloseAiErrorSnackbar = () => {
    setAiErrorSnackbarOpen(false);
    setAiErrorMessage("");
  };

  const handleConfirmEventSeeds = (selectedSeeds: TimelineEventSeed[]) => {
    console.log("ユーザーが選択したイベントの種:", selectedSeeds);
    const newEvents: TimelineEvent[] = selectedSeeds.map(
      (seed, index) => convertSeedToTimelineEvent(seed, timelineEvents, index) // ★ timelineItems の代わりに timelineEvents を使用
    );
    if (newEvents.length > 0) {
      addTimelineEventsBatch(newEvents);
    }
    setEventSeedReviewDialogOpen(false);
  };

  console.log(
    "[TimelinePage] definedCharacterStatuses from useTimeline:",
    definedCharacterStatuses
  );

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
              <Typography variant="h5">タイムライン</Typography>
              <Button
                variant="outlined"
                color="primary"
                startIcon={<SettingsIcon />}
                onClick={handleOpenSettingsDialog}
                size="small"
              >
                タイムライン設定
              </Button>
            </Box>
            <Divider />
          </Box>

          <Paper elevation={1} sx={{ p: 2, mb: 2 }}>
            <TimelineEventList
              timelineItems={timelineItems}
              onAddEvent={handleOpenDialog}
              onAIAssist={handleOpenAIAssistModal}
              onEditEvent={handleEventClick}
              hasUnsavedChanges={hasUnsavedChanges}
              onSave={handleSave}
              getCharacterNameById={getCharacterName}
              getPlaceNameById={getPlaceName}
            />
          </Paper>

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

          {places && places.length > 0 && dateArray && dateArray.length > 0 && (
            <TimelineChart
              timelineEvents={timelineEvents}
              places={places}
              plots={allPlots}
              dateArray={dateArray}
              safeMinY={safeMinY}
              safeMaxY={safeMaxY}
              onEventClick={handleEventClick}
            />
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
          <Snackbar
            open={aiErrorSnackbarOpen}
            autoHideDuration={6000}
            onClose={handleCloseAiErrorSnackbar}
          >
            <Alert
              onClose={handleCloseAiErrorSnackbar}
              severity="error"
              sx={{ width: "100%" }}
            >
              {aiErrorMessage}
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
