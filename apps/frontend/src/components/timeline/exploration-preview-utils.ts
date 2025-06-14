// 探索行動プレビューユーティリティ
import { 
  ExplorationAction, 
  MilestoneRequirement, 
  UnifiedEvent, 
  QuestElement, 
  EnemyCharacter 
} from "@trpg-ai-gm/types";

export interface ExplorationPreviewData {
  totalActions: number;
  actionsByType: Record<string, number>;
  estimatedDays: number;
  actions: ExplorationAction[];
}

/**
 * マイルストーンの要件から探索行動プレビューを生成
 */
export const generateExplorationPreview = (
  requirements: MilestoneRequirement[],
  timelineEvents?: UnifiedEvent[],
  availableQuests?: QuestElement[],
  availableEnemies?: EnemyCharacter[]
): ExplorationPreviewData => {
  const explorationActions: ExplorationAction[] = [];
  
  requirements.forEach((requirement) => {
    switch (requirement.type) {
      case "events":
        requirement.eventIds?.forEach(eventId => {
          const event = timelineEvents?.find(e => e.id === eventId);
          if (event?.explorationActions) {
            explorationActions.push(...event.explorationActions);
          }
        });
        break;
        
      case "quests":
        requirement.questIds?.forEach(questId => {
          const quest = availableQuests?.find(q => q.id === questId);
          if (quest?.explorationActions) {
            explorationActions.push(...quest.explorationActions);
          }
        });
        break;
        
      case "enemies":
        requirement.enemyRequirements?.forEach(enemyReq => {
          const enemy = availableEnemies?.find(e => e.id === enemyReq.enemyId);
          if (enemy?.explorationActions) {
            explorationActions.push(...enemy.explorationActions);
          }
        });
        break;
    }
  });
  
  // 重複を除去してユニークな探索行動のみ
  const uniqueActions = explorationActions.filter((action, index, self) => 
    self.findIndex(a => a.id === action.id) === index
  );
  
  // タイプ別の集計
  const actionsByType: Record<string, number> = {};
  let totalTimeRequired = 0;
  
  uniqueActions.forEach(action => {
    actionsByType[action.actionType] = (actionsByType[action.actionType] || 0) + 1;
    totalTimeRequired += action.prerequisites?.timeRequired || 60; // デフォルト1時間
  });
  
  // 推定日数を計算（1日8時間活動と仮定）
  const estimatedDays = Math.ceil(totalTimeRequired / (8 * 60));
  
  return {
    totalActions: uniqueActions.length,
    actionsByType,
    estimatedDays,
    actions: uniqueActions
  };
};

/**
 * 探索行動タイプの日本語名取得
 */
export const getActionTypeLabel = (actionType: string): string => {
  const labels: Record<string, string> = {
    investigate: "調査・探索",
    search: "捜索・発見", 
    interact: "交流・会話",
    combat: "戦闘・討伐",
    collect: "収集・取得",
    travel: "移動・探検",
    rest: "休息・準備",
    other: "その他"
  };
  return labels[actionType] || actionType;
};

/**
 * 探索難易度の日本語名取得
 */
export const getDifficultyLabel = (difficulty: string): string => {
  const labels: Record<string, string> = {
    easy: "簡単",
    normal: "普通", 
    hard: "困難",
    extreme: "極困難"
  };
  return labels[difficulty] || difficulty;
};