import { useState, useEffect, useCallback, useMemo } from "react";
import { useRecoilState } from "recoil";
import { SelectChangeEvent } from "@mui/material";
import moment from "moment";
import {
  NovelProject,
  TimelineEvent,
  Character,
  PlaceElement,
  CharacterStatus,
  PlotElement,
} from "@novel-ai-assistant/types";
import { currentProjectState } from "../store/atoms";

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
  relatedCharacterData?: Character[];
  eventType?: string;
}

// タイムライン設定の型定義
export interface TimelineSettings {
  startDate: string; // yyyy-MM-dd
}

export function useTimeline() {
  const [currentProject, setCurrentProject] =
    useRecoilState(currentProjectState);
  const [timelineEvents, setTimelineEvents] = useState<TimelineEvent[]>([]);
  const [characters, setCharacters] = useState<Character[]>([]);
  const [places, setPlaces] = useState<PlaceElement[]>([]);
  const [allPlots, setAllPlots] = useState<PlotElement[]>([]);

  // グラフ表示用のデータ
  const [timelineItems, setTimelineItems] = useState<TimelineItem[]>([]);
  const [timelineGroups, setTimelineGroups] = useState<TimelineGroup[]>([]);

  // Y軸の日付範囲と目盛り
  const [dateArray, setDateArray] = useState<string[]>([]);
  const [safeMinY, setSafeMinY] = useState<number>(0);
  const [safeMaxY, setSafeMaxY] = useState<number>(0);

  // タイムラインの設定
  const [timelineSettings, setTimelineSettings] = useState<TimelineSettings>({
    startDate: moment().format("YYYY-MM-DD"),
  });

  // 設定ダイアログの状態
  const [settingsDialogOpen, setSettingsDialogOpen] = useState(false);

  // 新しいイベント用の状態
  const [newEvent, setNewEvent] = useState<TimelineEvent>({
    id: "",
    title: "",
    description: "",
    date: moment().toISOString(),
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

      setTimelineSettings((prev) => ({
        ...prev,
        [name]: value,
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

  // 地名取得関数
  const getPlaceName = useCallback(
    (id: string): string => {
      const place = places.find((p) => p.id === id);
      return place ? place.name : "不明な場所";
    },
    [places]
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
    if (currentProject) {
      console.log(
        "[useTimeline] useEffect - START - currentProject.id:",
        currentProject.id
      );

      let projectDataToUse = { ...currentProject };

      // 最新のデータをローカルストレージから直接読み込み
      const projectId = currentProject.id;
      const projectsStr = localStorage.getItem("novelProjects");
      if (projectsStr) {
        try {
          const projects: NovelProject[] = JSON.parse(projectsStr);
          const latestProjectFromLocalStorage = projects.find(
            (p) => p.id === projectId
          );

          if (latestProjectFromLocalStorage) {
            console.log(
              "[useTimeline] Found project in localStorage:",
              latestProjectFromLocalStorage.id
            );
            if (
              latestProjectFromLocalStorage.updatedAt >
                projectDataToUse.updatedAt ||
              (latestProjectFromLocalStorage.definedCharacterStatuses &&
                latestProjectFromLocalStorage.definedCharacterStatuses.length >
                  0 &&
                (!projectDataToUse.definedCharacterStatuses ||
                  projectDataToUse.definedCharacterStatuses.length === 0))
            ) {
              console.log(
                "[useTimeline] Using project data from localStorage as it seems newer or more complete for statuses."
              );
              projectDataToUse = { ...latestProjectFromLocalStorage };
              setCurrentProject(projectDataToUse);
            }
          }
        } catch (error) {
          console.error("[useTimeline] LocalStorage parsing error:", error);
        }
      }

      setTimelineEvents(projectDataToUse.timeline || []);
      setCharacters(projectDataToUse.characters || []);
      setPlaces(projectDataToUse.worldBuilding?.places || []);
      setDefinedCharacterStatusesForDialog(
        projectDataToUse.definedCharacterStatuses || []
      );
      setAllPlots(projectDataToUse.plot || []);

      // 設定を読み込み
      if (projectDataToUse.worldBuilding?.timelineSettings?.startDate) {
        setTimelineSettings({
          startDate: projectDataToUse.worldBuilding.timelineSettings.startDate,
        });
      }
    } else {
      console.log("[useTimeline] useEffect - currentProject is null");
    }
  }, [currentProject, setCurrentProject]);

  // Y軸の日付範囲と目盛りを計算
  useEffect(() => {
    if (timelineSettings.startDate) {
      const start = moment(timelineSettings.startDate, "YYYY-MM-DD");
      const dates: string[] = [];
      // startDateから前後7日間（合計15日間）
      for (let i = -7; i <= 7; i++) {
        dates.push(start.clone().add(i, "days").format("YYYY-MM-DD"));
      }
      setDateArray(dates);
      if (dates.length > 0) {
        const minY = moment(dates[0], "YYYY-MM-DD").valueOf();
        const maxY = moment(dates[dates.length - 1], "YYYY-MM-DD")
          .add(1, "day")
          .startOf("day")
          .valueOf();
        setSafeMinY(minY);
        setSafeMaxY(maxY);
        console.log("[useTimeline] Y-axis calculation:", {
          startDate: timelineSettings.startDate,
          dates,
          minY,
          maxY,
        });
      }
    }
  }, [timelineSettings.startDate]);

  // 地名（グループ）の更新
  useEffect(() => {
    if (places.length > 0) {
      const groups: TimelineGroup[] = [{ id: "unassigned", title: "未分類" }];

      places.forEach((place) => {
        groups.push({
          id: place.id,
          title: place.name,
        });
      });

      setTimelineGroups(groups);
    }
  }, [places]);

  // ソート済みタイムラインイベント
  const sortedTimelineEvents = useMemo(() => {
    if (
      !currentProject ||
      !currentProject.plot ||
      currentProject.plot.length === 0
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
      currentProject.plot.map((p) => [p.id, p.order])
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
  }, [timelineEvents, currentProject]);

  // timelineItemsの生成
  useEffect(() => {
    if (characters && places) {
      const items = sortedTimelineEvents.map((event) => {
        const relatedCharacterData = event.relatedCharacters
          .map((charId) => characters.find((c) => c.id === charId))
          .filter((char): char is Character => char !== undefined);

        const relatedCharacterNames = relatedCharacterData
          .map((char) => char.name)
          .join(", ");

        const placeName =
          (event.placeId && places.find((p) => p.id === event.placeId)?.name) ||
          "未分類";

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
  }, [sortedTimelineEvents, characters, places]);

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

  // 変更をプロジェクトに保存する関数
  const handleSave = useCallback(async () => {
    if (currentProject) {
      const updatedProject: NovelProject = {
        ...currentProject,
        timeline: sortedTimelineEvents,
        worldBuilding: {
          ...currentProject.worldBuilding,
          timelineSettings: timelineSettings,
          places: places,
        },
        characters: characters,
        plot: allPlots,
        definedCharacterStatuses: definedCharacterStatuses,
        updatedAt: new Date(),
      };

      try {
        const projectsStr = localStorage.getItem("novelProjects");
        const projects: NovelProject[] = projectsStr
          ? JSON.parse(projectsStr)
          : [];
        const projectIndex = projects.findIndex(
          (p) => p.id === currentProject.id
        );
        if (projectIndex > -1) {
          projects[projectIndex] = updatedProject;
        } else {
          projects.push(updatedProject);
        }
        localStorage.setItem("novelProjects", JSON.stringify(projects));
        setCurrentProject(updatedProject);

        setHasUnsavedChanges(false);
        setSnackbarMessage("タイムラインが保存されました。");
        setSnackbarOpen(true);
        console.log("[useTimeline] Project saved:", updatedProject);
      } catch (error) {
        console.error(
          "[useTimeline] Error saving project to localStorage:",
          error
        );
        setSnackbarMessage("保存中にエラーが発生しました。");
        setSnackbarOpen(true);
      }
    }
  }, [
    currentProject,
    setCurrentProject,
    sortedTimelineEvents,
    timelineSettings,
    characters,
    places,
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
        // 日付をYYYY-MM-DD形式に変換してセット
        const formattedEvent = {
          ...eventToEdit,
          date: moment(eventToEdit.date).format("YYYY-MM-DD"),
        };
        setNewEvent(formattedEvent);
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
    currentProject,
    timelineEvents,
    characters,
    places,
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
