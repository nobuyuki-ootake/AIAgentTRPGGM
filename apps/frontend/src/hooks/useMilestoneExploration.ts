import { useMemo, useEffect } from "react";
import { useRecoilValue } from "recoil";
import { currentCampaignState } from "../store/atoms";
import {
  CampaignMilestone,
  ExplorationAction,
  UnifiedEvent,
  QuestElement,
  EnemyCharacter,
} from "@trpg-ai-gm/types";

// 日次ランダムイベント履歴管理
interface DailyRandomEvents {
  day: number;
  usedEventIds: string[];
}

// ローカルストレージキー
const DAILY_EVENTS_KEY = "trpg-daily-random-events";

/**
 * マイルストーンベースの探索行動管理フック
 */
export const useMilestoneExploration = () => {
  const currentCampaign = useRecoilValue(currentCampaignState);

  // 現在のセッション日数を取得（セッション状態から）
  const currentDay = useMemo(() => {
    // TODO: セッション状態から現在の日数を取得
    // とりあえず1日目として扱う
    return 1;
  }, []);

  // 現在アクティブなマイルストーンを取得
  const currentMilestone = useMemo((): CampaignMilestone | null => {
    if (!currentCampaign?.milestones) {
      return null;
    }

    // 現在の日数に基づいて最も近い未達成のマイルストーンを取得
    const activeMilestones = currentCampaign.milestones
      .filter(
        (milestone) =>
          milestone.status === "pending" || milestone.status === "active",
      )
      .sort((a, b) => a.targetDay - b.targetDay);

    // 現在日数以降で最も近いマイルストーンを取得
    const result =
      activeMilestones.find((milestone) => milestone.targetDay >= currentDay) ||
      null;

    return result;
  }, [currentCampaign?.milestones, currentDay]);

  // デバッグログ出力（キャンペーン変更時のみ）
  useEffect(() => {
    console.log("🎯 [GM Debug] マイルストーンシステム状況チェック");
    console.log("🎯 [GM Debug] キャンペーン:", currentCampaign?.title);
    console.log(
      "🎯 [GM Debug] 設定済みマイルストーン数:",
      currentCampaign?.milestones?.length || 0,
    );

    if (currentMilestone) {
      console.log("🎯 [GM Debug] 選択されたマイルストーン:", {
        title: currentMilestone.title,
        targetDay: currentMilestone.targetDay,
        daysRemaining: currentMilestone.targetDay - currentDay,
        requirementsCount: currentMilestone.requirements.length,
      });
    } else {
      console.log(
        "🎯 [GM Debug] 現在日数に適用可能なマイルストーンがありません",
      );
    }
  }, [
    currentCampaign?.id,
    currentCampaign?.milestones?.length,
    currentCampaign?.title,
    currentMilestone?.id,
    currentMilestone,
    currentDay,
  ]);

  // マイルストーンから探索行動を抽出
  const milestoneExplorationActions = useMemo((): ExplorationAction[] => {
    if (!currentMilestone) return [];

    const explorationActions: ExplorationAction[] = [];

    currentMilestone.requirements.forEach((requirement) => {
      switch (requirement.type) {
        case "events":
          requirement.eventIds?.forEach((eventId) => {
            const event = currentCampaign?.timeline?.find(
              (e: UnifiedEvent) => e.id === eventId,
            );
            if (event?.explorationActions) {
              explorationActions.push(...event.explorationActions);
            }
          });
          break;

        case "quests":
          requirement.questIds?.forEach((questId) => {
            const quest = currentCampaign?.quests?.find(
              (q: QuestElement) => q.id === questId,
            );
            if (quest?.explorationActions) {
              explorationActions.push(...quest.explorationActions);
            }
          });
          break;

        case "enemies":
          requirement.enemyRequirements?.forEach((enemyReq) => {
            const enemy = currentCampaign?.enemies?.find(
              (e: EnemyCharacter) => e.id === enemyReq.enemyId,
            );
            if (enemy?.explorationActions) {
              explorationActions.push(...enemy.explorationActions);
            }
          });
          break;
      }
    });

    // 重複を除去
    const uniqueActions = explorationActions.filter(
      (action, index, self) =>
        self.findIndex((a) => a.id === action.id) === index,
    );

    return uniqueActions;
  }, [
    currentMilestone?.id,
    currentCampaign?.id,
    currentCampaign?.enemies,
    currentCampaign?.quests,
    currentCampaign?.timeline,
    currentMilestone,
  ]);

  // ランダムイベント選択ロジックと組み合わせ
  const allExplorationActions = useMemo((): ExplorationAction[] => {
    // 固定イベントの処理
    const fixedActions = milestoneExplorationActions.map((action) => ({
      ...action,
      category: action.category || ("milestone" as const),
    }));

    // ランダムイベントの処理
    let randomActions: ExplorationAction[] = [];

    console.log("🎲 [Random Debug] randomEventPoolsの状態:", {
      exists: !!currentCampaign?.randomEventPools,
      length: currentCampaign?.randomEventPools?.length || 0,
    });

    if (
      currentCampaign?.randomEventPools &&
      currentCampaign.randomEventPools.length > 0
    ) {
      const eventPool = currentCampaign.randomEventPools[0];
      const rules = eventPool.selectionRules;

      if (rules) {
        // 日次履歴の取得
        const dailyHistory = getDailyEventHistory(currentDay);

        // 利用可能なイベントを各カテゴリから取得（使用済みを除外）
        const availableBeneficial = eventPool.beneficialEvents.filter(
          (event) => !dailyHistory.usedEventIds.includes(event.id),
        );
        const availableHazard = eventPool.hazardEvents.filter(
          (event) => !dailyHistory.usedEventIds.includes(event.id),
        );
        const availableFlavor = eventPool.flavorEvents.filter(
          (event) => !dailyHistory.usedEventIds.includes(event.id),
        );

        // 重み付きランダム選択
        const selectedEvents: ExplorationAction[] = [];
        const totalWeight =
          rules.beneficialWeight + rules.hazardWeight + rules.flavorWeight;

        // 1〜3個のランダムイベントを選択
        const eventCount = Math.min(
          Math.max(
            rules.minEventsPerDay,
            Math.floor(Math.random() * rules.maxEventsPerDay) + 1,
          ),
          rules.maxEventsPerDay,
        );

        for (let i = 0; i < eventCount; i++) {
          const rand = Math.random() * totalWeight;
          let weight = 0;

          if (
            rand < (weight += rules.beneficialWeight) &&
            availableBeneficial.length > 0
          ) {
            const randomIndex = Math.floor(
              Math.random() * availableBeneficial.length,
            );
            const selectedEvent = availableBeneficial[randomIndex];
            selectedEvents.push(selectedEvent);
            availableBeneficial.splice(randomIndex, 1);
          } else if (
            rand < (weight += rules.hazardWeight) &&
            availableHazard.length > 0
          ) {
            const randomIndex = Math.floor(
              Math.random() * availableHazard.length,
            );
            const selectedEvent = availableHazard[randomIndex];
            selectedEvents.push(selectedEvent);
            availableHazard.splice(randomIndex, 1);
          } else if (availableFlavor.length > 0) {
            const randomIndex = Math.floor(
              Math.random() * availableFlavor.length,
            );
            const selectedEvent = availableFlavor[randomIndex];
            selectedEvents.push(selectedEvent);
            availableFlavor.splice(randomIndex, 1);
          }
        }

        // 使用済みイベントIDを記録
        if (selectedEvents.length > 0) {
          saveDailyEventHistory(
            currentDay,
            selectedEvents.map((e) => e.id),
          );
        }

        randomActions = selectedEvents;
      }
    }

    return [...fixedActions, ...randomActions];
  }, [
    milestoneExplorationActions,
    currentCampaign?.randomEventPools,
    currentDay,
  ]);

  // 探索行動の詳細ログ（マイルストーン変更時のみ）
  useEffect(() => {
    if (currentMilestone && milestoneExplorationActions.length > 0) {
      console.log("🎯 [GM Debug] マイルストーン探索行動抽出完了");
      console.log("🎯 [GM Debug] 対象マイルストーン:", currentMilestone.title);
      console.log(
        "🎯 [GM Debug] 要件数:",
        currentMilestone.requirements.length,
      );
      console.log(
        "🎯 [GM Debug] 固定（マイルストーン）イベント数:",
        milestoneExplorationActions.length,
      );
    }
  }, [
    currentMilestone?.id,
    milestoneExplorationActions.length,
    currentMilestone,
  ]);

  // ランダムイベントログ（組み合わせ後）
  useEffect(() => {
    if (allExplorationActions && allExplorationActions.length > 0) {
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const fixedActions = allExplorationActions.filter(
        (action) => action.category === "milestone",
      );
      const randomActions = allExplorationActions.filter(
        (action) => action.category !== "milestone",
      );

      console.log("🎯 [GM Debug] ランダムイベント数:", randomActions.length);
      console.log(
        "🎯 [GM Debug] プレイヤーに提供される探索行動の総数:",
        allExplorationActions.length,
      );

      if (randomActions.length > 0) {
        console.log(
          "🎲 [GM Debug] 本日のランダムイベント:",
          randomActions.map((action) => ({
            title: action.title,
            category: action.category,
            difficulty: action.difficulty,
          })),
        );
      }
    }
  }, [allExplorationActions]);

  // 探索行動をUI用のActionChoiceに変換（交流・会話系を除外）
  const convertToActionChoices = useMemo(() => {
    if (!allExplorationActions) return [];

    // 交流・会話系のアクションは探索タブから除外
    const explorationOnlyActions = allExplorationActions.filter(
      (action) =>
        action.actionType !== "interact" && action.actionType !== "talk",
    );

    return explorationOnlyActions.map((action): any => ({
      id: action.id,
      type: "custom" as const,
      label: action.title,
      description: action.description,
      icon: getActionTypeIcon(action.actionType),
      explorationAction: action, // 元の探索行動データを保持
      priority: action.priority || 0,
      category: action.category || "milestone",
    }));
  }, [allExplorationActions]);

  // 交流・会話系のアクションのみを抽出
  const interactionActionChoices = useMemo(() => {
    if (!allExplorationActions) return [];

    // 交流・会話系のアクションのみ抽出
    const interactionOnlyActions = allExplorationActions.filter(
      (action) =>
        action.actionType === "interact" || action.actionType === "talk",
    );

    return interactionOnlyActions.map((action): any => ({
      id: action.id,
      type: "interact" as const,
      label: action.title,
      description: action.description,
      icon: getActionTypeIcon(action.actionType),
      explorationAction: action, // 元の探索行動データを保持
      priority: action.priority || 0,
      category: action.category || "milestone",
    }));
  }, [allExplorationActions]);

  return {
    currentMilestone,
    milestoneExplorationActions,
    randomExplorationActions: allExplorationActions.filter(
      (action) => action.category !== "milestone",
    ),
    allExplorationActions,
    explorationActionChoices: convertToActionChoices,
    interactionActionChoices,
    currentDay,
  };
};

/**
 * 日次ランダムイベント履歴を取得
 */
const getDailyEventHistory = (day: number): DailyRandomEvents => {
  try {
    const stored = localStorage.getItem(DAILY_EVENTS_KEY);
    if (stored) {
      const history: DailyRandomEvents[] = JSON.parse(stored);
      const dayHistory = history.find((h) => h.day === day);
      if (dayHistory) {
        return dayHistory;
      }
    }
  } catch (error) {
    console.warn("日次イベント履歴の読み込みに失敗:", error);
  }

  return { day, usedEventIds: [] };
};

/**
 * 日次ランダムイベント履歴を保存
 */
const saveDailyEventHistory = (day: number, newEventIds: string[]): void => {
  try {
    const stored = localStorage.getItem(DAILY_EVENTS_KEY);
    let history: DailyRandomEvents[] = [];

    if (stored) {
      history = JSON.parse(stored);
    }

    const existingIndex = history.findIndex((h) => h.day === day);
    const updatedHistory = {
      day,
      usedEventIds: [...getDailyEventHistory(day).usedEventIds, ...newEventIds],
    };

    if (existingIndex >= 0) {
      history[existingIndex] = updatedHistory;
    } else {
      history.push(updatedHistory);
    }

    // 古い履歴を削除（7日以上前）
    history = history.filter((h) => h.day >= day - 7);

    localStorage.setItem(DAILY_EVENTS_KEY, JSON.stringify(history));
  } catch (error) {
    console.warn("日次イベント履歴の保存に失敗:", error);
  }
};

/**
 * 探索行動タイプに応じたアイコンを取得
 */
const getActionTypeIcon = (actionType: string) => {
  // Material-UIアイコンの動的import等は実際の実装で行う
  switch (actionType) {
    case "investigate":
      return "🔍"; // 調査
    case "search":
      return "🔎"; // 捜索
    case "interact":
      return "💬"; // 交流
    case "combat":
      return "⚔️"; // 戦闘
    case "collect":
      return "📦"; // 収集
    case "travel":
      return "🗺️"; // 移動
    case "rest":
      return "😴"; // 休息
    default:
      return "❓"; // その他
  }
};
