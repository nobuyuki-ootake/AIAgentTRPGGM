import { useState, useEffect, useCallback, useMemo } from "react";
import { useRecoilState } from "recoil";
import { SelectChangeEvent } from "@mui/material";
import moment from "moment";
import {
  TRPGCampaign,
  TimelineEvent,
  SessionEvent,
  TRPGCharacter,
  PlaceElement,
  BaseLocation,
  CharacterStatus,
  QuestElement,
} from "@trpg-ai-gm/types";
import { currentCampaignState } from "../store/atoms";

// タイムライングループの型定義
export interface TimelineGroup {
  id: string;
  title: string;
}

// タイムラインアイテムの型定義（表示用）
export interface TimelineItem {
  id: string;
  placeId: string;
  placeName: string;
  title: string;
  date: string; // ISOString
  dateValue: number;
  description?: string;
  relatedCharacters: string[];
  relatedCharacterNames?: string;
  relatedCharacterData?: TRPGCharacter[];
  eventType?: string;
}

// タイムライン設定の型定義
export interface TimelineSettings {
  maxDays: number; // 最大日数（例：30日間）
}

export function useTimeline() {
  const [currentCampaign, setCurrentCampaign] =
    useRecoilState(currentCampaignState);
  const [timelineEvents, setTimelineEvents] = useState<TimelineEvent[]>([]);
  const [characters, setCharacters] = useState<TRPGCharacter[]>([]);
  const [places, setPlaces] = useState<PlaceElement[]>([]);
  const [bases, setBases] = useState<BaseLocation[]>([]);
  const [allPlots, setAllPlots] = useState<QuestElement[]>([]);

  // グラフ表示用のデータ
  const [timelineItems, setTimelineItems] = useState<TimelineItem[]>([]);
  const [timelineGroups, setTimelineGroups] = useState<TimelineGroup[]>([]);

  // Y軸の日付範囲と目盛り
  const [dateArray, setDateArray] = useState<string[]>([]);
  const [safeMinY, setSafeMinY] = useState<number>(0);
  const [safeMaxY, setSafeMaxY] = useState<number>(0);

  // タイムライン設定
  const [timelineSettings, setTimelineSettings] = useState<TimelineSettings>({
    maxDays: 7,
  });

  // 設定ダイアログの状態
  const [settingsDialogOpen, setSettingsDialogOpen] = useState(false);

  // 新しいイベント用の状態
  const [newEvent, setNewEvent] = useState<TimelineEvent>({
    id: "",
    title: "",
    description: "",
    date: moment().toISOString(),
    dayNumber: 1,
    relatedCharacters: [],
    relatedPlaces: [],
    order: 0,
    eventType: "",
    postEventCharacterStatuses: {},
    relatedPlotIds: [],
  });

  // ダイアログの状態
  const [dialogOpen, setDialogOpen] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [currentEventId, setCurrentEventId] = useState<string>("");

  // スナックバーの状態
  const [snackbarOpen, setSnackbarOpen] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState("");
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);

  // キャンペーンデータの初期化
  useEffect(() => {
    if (currentCampaign) {
      // SessionEventをTimelineEventに変換
      const convertedEvents: TimelineEvent[] = (currentCampaign.timeline || []).map((sessionEvent: SessionEvent) => ({
        id: sessionEvent.id,
        title: sessionEvent.title,
        description: sessionEvent.description,
        date: sessionEvent.sessionTime || new Date().toISOString(), // sessionTimeをdateとして使用
        relatedCharacters: sessionEvent.relatedCharacters,
        relatedPlaces: sessionEvent.relatedPlaces,
        order: sessionEvent.order,
        eventType: sessionEvent.eventType,
        postEventCharacterStatuses: sessionEvent.postEventCharacterStatuses,
        relatedPlotIds: sessionEvent.relatedQuestIds || [], // relatedQuestIdsをrelatedPlotIdsにマップ
        placeId: sessionEvent.placeId,
      }));
      
      setTimelineEvents(convertedEvents);
      // キャラクターを読み込み
      setCharacters(currentCampaign.characters || []);
      // クエストを読み込み
      setAllPlots(currentCampaign.plot || []);
      // 場所を読み込み
      setPlaces(currentCampaign.worldBuilding?.places || []);
      // 拠点を読み込み
      setBases(currentCampaign.bases || []);
      // キャラクターステータスを読み込み
      setDefinedCharacterStatusesForDialog([]);
    }
  }, [currentCampaign]);

  // プロジェクトで定義済みの状態リストをuseStateで管理
  const [
    definedCharacterStatusesForDialog,
    setDefinedCharacterStatusesForDialog,
  ] = useState<CharacterStatus[]>([]);

  // イベントの場所と日時を更新
  const handleUpdateEventLocationAndDate = useCallback(
    (eventId: string, newPlaceId: string, newDate: string) => {
      setTimelineEvents((prevEvents) =>
        prevEvents.map((event) =>
          event.id === eventId
            ? { ...event, placeId: newPlaceId, date: newDate }
            : event
        )
      );
      setHasUnsavedChanges(true);
      console.log(
        `[useTimeline] Event ${eventId} updated via D&D: placeId=${newPlaceId}, date=${newDate}`
      );
    },
    []
  );

  // イベント変更ハンドラー
  const handleEventChange = useCallback(
    (
      e:
        | React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
        | SelectChangeEvent<string>,
      field?: string
    ) => {
      const target = e.target;
      const name = field || target.name;
      const value = target.value;

      // 日付フィールドの場合、ISO文字列に変換
      let processedValue = value;
      if (name === "date" && value) {
        // YYYY-MM-DD形式をISO文字列に変換
        processedValue = moment(value).toISOString();
      } else if (name === "dayNumber" && value) {
        // 日数フィールドの場合、数値に変換
        processedValue = parseInt(value, 10);
      }

      setNewEvent((prev) => ({
        ...prev,
        [name]: processedValue,
      }));
      setHasUnsavedChanges(true);
    },
    []
  );

  // キャラクター選択ハンドラー
  const handleCharactersChange = useCallback(
    (event: SelectChangeEvent<string[]>) => {
      const value = event.target.value;
      const selectedCharacterIds =
        typeof value === "string" ? value.split(",") : value;

      setNewEvent((prev) => ({
        ...prev,
        relatedCharacters: selectedCharacterIds,
      }));
      setHasUnsavedChanges(true);
    },
    []
  );

  // キャラクター状態変更ハンドラー
  const handlePostEventStatusChange = useCallback(
    (characterId: string, newStatuses: CharacterStatus[]) => {
      setNewEvent((prev) => ({
        ...prev,
        postEventCharacterStatuses: {
          ...prev.postEventCharacterStatuses,
          [characterId]: newStatuses,
        },
      }));
      setHasUnsavedChanges(true);
    },
    []
  );

  // 関連プロット変更ハンドラー
  const handleRelatedPlotsChange = useCallback((selectedPlotIds: string[]) => {
    setNewEvent((prev) => ({
      ...prev,
      relatedPlotIds: selectedPlotIds,
    }));
    setHasUnsavedChanges(true);
  }, []);

  // 設定変更ハンドラー
  const handleSettingsChange = useCallback(
    (
      e:
        | React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
        | SelectChangeEvent<string>,
      field?: string
    ) => {
      const target = e.target;
      const name = field || target.name;
      const value = target.value;

      // maxDaysフィールドの場合、数値に変換
      let processedValue = value;
      if (name === "maxDays" && value) {
        processedValue = parseInt(value, 10);
      }

      setTimelineSettings((prev) => ({
        ...prev,
        [name]: processedValue,
      }));
      setHasUnsavedChanges(true);
    },
    []
  );

  // 設定保存ハンドラー
  const handleSaveSettings = useCallback(() => {
    setSettingsDialogOpen(false);
    setSnackbarMessage("設定が保存されました。");
    setSnackbarOpen(true);
  }, []);

  // イベント保存ハンドラー
  const handleSaveEvent = useCallback(() => {
    if (!newEvent.title.trim() || !newEvent.date) {
      return;
    }

    if (isEditing && currentEventId) {
      // 既存イベントの更新
      setTimelineEvents((prevEvents) =>
        prevEvents.map((event) =>
          event.id === currentEventId
            ? { ...newEvent, id: currentEventId }
            : event
        )
      );
    } else {
      // 新規イベントの追加
      const newEventWithId = {
        ...newEvent,
        id: crypto.randomUUID(),
        order: timelineEvents.length,
      };
      setTimelineEvents((prevEvents) => [...prevEvents, newEventWithId]);
    }

    setHasUnsavedChanges(true);
    setDialogOpen(false);
    setSnackbarMessage(
      isEditing ? "イベントが更新されました。" : "イベントが追加されました。"
    );
    setSnackbarOpen(true);
  }, [newEvent, isEditing, currentEventId, timelineEvents.length]);

  // イベント削除ハンドラー
  const handleDeleteEvent = useCallback((eventId: string) => {
    setTimelineEvents((prevEvents) =>
      prevEvents.filter((event) => event.id !== eventId)
    );
    setHasUnsavedChanges(true);
    setSnackbarMessage("イベントが削除されました。");
    setSnackbarOpen(true);
  }, []);

  // タイムラインリセットハンドラー
  const handleResetTimeline = useCallback(() => {
    setTimelineEvents([]);
    setHasUnsavedChanges(true);
    setSnackbarMessage("セッション履歴がリセットされました。");
    setSnackbarOpen(true);
  }, []);

  // スナックバー閉じるハンドラー
  const handleCloseSnackbar = useCallback(() => {
    setSnackbarOpen(false);
  }, []);

  // キャラクター名取得関数
  const getCharacterName = useCallback(
    (id: string): string => {
      const character = characters.find((c) => c.id === id);
      return character ? character.name : "不明なキャラクター";
    },
    [characters]
  );

  // 地名取得関数 - 場所と拠点の両方から検索
  const getPlaceName = useCallback(
    (id: string): string => {
      // まず場所から検索
      const place = places.find((p) => p.id === id);
      if (place) return place.name;
      
      // 次に拠点から検索
      const base = bases.find((b) => b.id === id);
      if (base) return base.name;
      
      return "不明な場所";
    },
    [places, bases]
  );

  // その他の未実装関数（仮実装）
  const calculateEventPosition = useCallback((_: number, __: number) => {
    // TODO: 実装が必要な場合は後で追加
  }, []);

  const createEventFromPosition = useCallback((_: number, __: number) => {
    // TODO: 実装が必要な場合は後で追加
  }, []);

  const handleReorderEvents = useCallback((_: TimelineEvent[]) => {
    // TODO: 実装が必要な場合は後で追加
  }, []);

  // 初期データのロード
  useEffect(() => {
    if (currentCampaign) {
      console.log(
        "[useTimeline] useEffect - START - currentCampaign.id:",
        currentCampaign.id
      );

      let campaignDataToUse = { ...currentCampaign };

      // 最新のデータをローカルストレージから直接読み込み
      const campaignId = currentCampaign.id;
      const projectsStr = localStorage.getItem("novelProjects");
      if (projectsStr) {
        try {
          const projects: TRPGCampaign[] = JSON.parse(projectsStr);
          const latestProjectFromLocalStorage = projects.find(
            (p) => p.id === campaignId
          );

          if (latestProjectFromLocalStorage) {
            console.log(
              "[useTimeline] Found project in localStorage:",
              latestProjectFromLocalStorage.id
            );
            if (
              latestProjectFromLocalStorage.updatedAt >
                campaignDataToUse.updatedAt ||
              (latestProjectFromLocalStorage.definedCharacterStatuses &&
                latestProjectFromLocalStorage.definedCharacterStatuses.length >
                  0 &&
                (!campaignDataToUse.definedCharacterStatuses ||
                  campaignDataToUse.definedCharacterStatuses.length === 0))
            ) {
              console.log(
                "[useTimeline] Using campaign data from localStorage as it seems newer or more complete for statuses."
              );
              campaignDataToUse = { ...latestProjectFromLocalStorage };
              setCurrentCampaign(campaignDataToUse);
            }
          }
        } catch (error) {
          console.error("[useTimeline] LocalStorage parsing error:", error);
        }
      }

      // SessionEventをTimelineEventに変換
      const convertedEvents: TimelineEvent[] = (campaignDataToUse.timeline || []).map((sessionEvent: SessionEvent) => ({
        id: sessionEvent.id,
        title: sessionEvent.title,
        description: sessionEvent.description,
        date: sessionEvent.sessionTime || new Date().toISOString(),
        relatedCharacters: sessionEvent.relatedCharacters,
        relatedPlaces: sessionEvent.relatedPlaces,
        order: sessionEvent.order,
        eventType: sessionEvent.eventType,
        postEventCharacterStatuses: sessionEvent.postEventCharacterStatuses,
        relatedPlotIds: sessionEvent.relatedQuestIds || [],
        placeId: sessionEvent.placeId,
      }));
      setTimelineEvents(convertedEvents);
      setCharacters(campaignDataToUse.characters || []);
      setPlaces(campaignDataToUse.worldBuilding?.places || []);
      setBases(campaignDataToUse.bases || []);
      setDefinedCharacterStatusesForDialog(
        campaignDataToUse.definedCharacterStatuses || []
      );
      setAllPlots(campaignDataToUse.plot || []);

      // 設定を読み込み
      if (campaignDataToUse.worldBuilding?.timelineSettings?.startDate) {
        setTimelineSettings({
          startDate: campaignDataToUse.worldBuilding.timelineSettings.startDate,
        });
      }
    } else {
      console.log("[useTimeline] useEffect - currentCampaign is null");
    }
  }, [currentCampaign, setCurrentCampaign]);

  // Y軸の日付範囲と目盛りを計算
  useEffect(() => {
    // 日数ベースでタイムライン設定（デフォルト7日間：約1時間のプレイ時間想定）
    const maxDays = timelineSettings.maxDays;
    const dayLabels: string[] = [];
    
    // 1日目～X日目のラベルを生成
    for (let i = 1; i <= maxDays; i++) {
      dayLabels.push(`${i}日目`);
    }
    
    setDateArray(dayLabels);
    setSafeMinY(1);
    setSafeMaxY(maxDays);
    
    console.log("[useTimeline] Day-based timeline:", {
      maxDays,
      dayLabels,
      minY: 1,
      maxY: maxDays,
    });
  }, [timelineSettings.maxDays]);

  // 地名（グループ）の更新 - 場所と拠点の両方を含める
  useEffect(() => {
    const groups: TimelineGroup[] = [{ id: "unassigned", title: "未分類" }];

    // 場所を追加
    places.forEach((place) => {
      groups.push({
        id: place.id,
        title: `📍 ${place.name}`,
      });
    });

    // 拠点を追加
    bases.forEach((base) => {
      groups.push({
        id: base.id,
        title: `🏛️ ${base.name}`,
      });
    });

    setTimelineGroups(groups);
  }, [places, bases]);

  // ソート済みタイムラインイベント
  const sortedTimelineEvents = useMemo(() => {
    if (
      !currentCampaign ||
      !currentCampaign.plot ||
      currentCampaign.plot.length === 0
    ) {
      return [...timelineEvents].sort((a, b) => {
        const dateA = moment(a.date).valueOf();
        const dateB = moment(b.date).valueOf();
        if (dateA !== dateB) {
          return dateA - dateB;
        }
        return (a.order || 0) - (b.order || 0);
      });
    }

    const plotOrderMap = new Map<string, number>(
      currentCampaign.plot.map((p) => [p.id, p.order])
    );

    return [...timelineEvents].sort((a, b) => {
      const getFirstValidPlotId = (
        event: TimelineEvent
      ): string | undefined => {
        if (!event.relatedPlotIds || event.relatedPlotIds.length === 0)
          return undefined;
        return event.relatedPlotIds.find((pid) => plotOrderMap.has(pid));
      };

      const plotIdA = getFirstValidPlotId(a);
      const plotIdB = getFirstValidPlotId(b);

      const plotOrderA = plotIdA ? plotOrderMap.get(plotIdA)! : Infinity;
      const plotOrderB = plotIdB ? plotOrderMap.get(plotIdB)! : Infinity;

      if (plotOrderA !== plotOrderB) {
        return plotOrderA - plotOrderB;
      }

      const dateA = moment(a.date).valueOf();
      const dateB = moment(b.date).valueOf();
      if (dateA !== dateB) {
        return dateA - dateB;
      }
      return (a.order || 0) - (b.order || 0);
    });
  }, [timelineEvents, currentCampaign]);

  // timelineItemsの生成
  useEffect(() => {
    if (characters && (places || bases)) {
      const items = sortedTimelineEvents.map((event) => {
        const relatedCharacterData = event.relatedCharacters
          .map((charId) => characters.find((c) => c.id === charId))
          .filter((char): char is TRPGCharacter => char !== undefined);

        const relatedCharacterNames = relatedCharacterData
          .map((char) => char.name)
          .join(", ");

        let placeName = "未分類";
        if (event.placeId) {
          // 場所から検索
          const place = places.find((p) => p.id === event.placeId);
          if (place) {
            placeName = place.name;
          } else {
            // 拠点から検索
            const base = bases.find((b) => b.id === event.placeId);
            if (base) {
              placeName = base.name;
            }
          }
        }

        return {
          id: event.id,
          placeId: event.placeId || "unassigned",
          placeName,
          title: event.title,
          date: event.date,
          dateValue: moment(event.date).valueOf(),
          description: event.description,
          relatedCharacters: event.relatedCharacters,
          relatedCharacterNames,
          relatedCharacterData,
          eventType: event.eventType,
        };
      });

      setTimelineItems(items);
    }
  }, [sortedTimelineEvents, characters, places, bases]);

  // definedCharacterStatuses の計算
  const definedCharacterStatuses = useMemo(() => {
    return definedCharacterStatusesForDialog || [];
  }, [definedCharacterStatusesForDialog]);

  // イベントを一括で追加する関数
  const addTimelineEventsBatch = useCallback((newEvents: TimelineEvent[]) => {
    setTimelineEvents((prevEvents) => {
      const updatedEvents = [...prevEvents];
      let maxOrderInBatch = prevEvents.reduce(
        (max, item) => Math.max(max, item.order || 0),
        0
      );
      newEvents.forEach((newEvent) => {
        if (!updatedEvents.find((e) => e.id === newEvent.id)) {
          maxOrderInBatch++;
          updatedEvents.push({
            ...newEvent,
            order: newEvent.order || maxOrderInBatch,
          });
        }
      });
      return updatedEvents;
    });
    setHasUnsavedChanges(true);
  }, []);

  // 変更をキャンペーンに保存する関数
  const handleSave = useCallback(async () => {
    if (currentCampaign) {
      // TimelineEventをSessionEventに変換して保存
      const sessionEvents: SessionEvent[] = sortedTimelineEvents.map((event) => ({
        id: event.id,
        title: event.title,
        description: event.description,
        sessionDay: 1, // デフォルト値
        sessionTime: event.date,
        relatedCharacters: event.relatedCharacters,
        relatedPlaces: event.relatedPlaces,
        order: event.order,
        eventType: event.eventType as SessionEvent["eventType"],
        postEventCharacterStatuses: event.postEventCharacterStatuses,
        relatedQuestIds: event.relatedPlotIds,
        placeId: event.placeId,
      }));
      
      const updatedCampaign: TRPGCampaign = {
        ...currentCampaign,
        timeline: sessionEvents,
        worldBuilding: {
          ...currentCampaign.worldBuilding,
          timelineSettings: timelineSettings,
          places: places,
        },
        characters: characters,
        plot: allPlots,
        bases: bases,
        definedCharacterStatuses: definedCharacterStatuses,
        updatedAt: new Date(),
      };

      try {
        // キャンペーンを更新
        setCurrentCampaign(updatedCampaign);

        setHasUnsavedChanges(false);
        setSnackbarMessage("セッション履歴が保存されました。");
        setSnackbarOpen(true);
        console.log("[useTimeline] Campaign saved:", updatedCampaign);
      } catch (error) {
        console.error(
          "[useTimeline] Error saving campaign:",
          error
        );
        setSnackbarMessage("保存中にエラーが発生しました。");
        setSnackbarOpen(true);
      }
    }
  }, [
    currentCampaign,
    setCurrentCampaign,
    sortedTimelineEvents,
    timelineSettings,
    characters,
    places,
    bases,
    allPlots,
    definedCharacterStatuses,
  ]);

  // モーダル開閉ハンドラの実装
  const handleOpenDialog = useCallback(() => {
    setDialogOpen(true);
    setIsEditing(false);
    setCurrentEventId("");
    setNewEvent({
      id: "",
      title: "",
      description: "",
      date: moment().toISOString(),
      relatedCharacters: [],
      relatedPlaces: [],
      order: timelineEvents.length,
      eventType: "",
      postEventCharacterStatuses: {},
      relatedPlotIds: [],
    });
  }, [timelineEvents.length]);

  const handleCloseDialog = useCallback(() => {
    setDialogOpen(false);
  }, []);

  const handleOpenSettingsDialog = useCallback(() => {
    setSettingsDialogOpen(true);
  }, []);

  const handleCloseSettingsDialog = useCallback(() => {
    setSettingsDialogOpen(false);
  }, []);

  const handleEventClick = useCallback(
    (id: string) => {
      const eventToEdit = timelineEvents.find((event) => event.id === id);
      if (eventToEdit) {
        // 日付をISO形式に保持（後でフォーマットは表示時に行う）
        setNewEvent(eventToEdit);
        setIsEditing(true);
        setCurrentEventId(id);
        setDialogOpen(true);
      } else {
        console.warn(
          `[useTimeline] Event with id ${id} not found for editing.`
        );
        handleOpenDialog();
      }
    },
    [timelineEvents, handleOpenDialog]
  );

  return {
    // 状態
    currentCampaign,
    timelineEvents,
    characters,
    places,
    bases,
    timelineItems,
    timelineGroups,
    timelineSettings,
    settingsDialogOpen,
    newEvent,
    dialogOpen,
    isEditing,
    currentEventId,
    snackbarOpen,
    snackbarMessage,
    hasUnsavedChanges,
    definedCharacterStatuses,
    allPlots,
    safeMinY,
    safeMaxY,
    dateArray,

    // ハンドラー
    handleOpenDialog,
    handleOpenSettingsDialog,
    handleCloseSettingsDialog,
    handleSaveSettings,
    handleSettingsChange,
    handleCloseDialog,
    handleEventChange,
    handleCharactersChange,
    handlePostEventStatusChange,
    handleSaveEvent,
    handleDeleteEvent,
    handleResetTimeline,
    handleEventClick,
    handleSave,
    handleCloseSnackbar,
    getCharacterName,
    getPlaceName,
    calculateEventPosition,
    createEventFromPosition,
    handleReorderEvents,
    handleRelatedPlotsChange,
    handleUpdateEventLocationAndDate,
    addTimelineEventsBatch,
  };
}
