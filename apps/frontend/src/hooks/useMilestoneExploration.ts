import { useMemo } from 'react';
import { useRecoilValue } from 'recoil';
import { currentCampaignState } from '../store/atoms';
import {
  CampaignMilestone,
  ExplorationAction,
  UnifiedEvent,
  QuestElement,
  EnemyCharacter
} from '@trpg-ai-gm/types';

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
    if (!currentCampaign?.milestones) return null;

    // 現在の日数に基づいて最も近い未達成のマイルストーンを取得
    const activeMilestones = currentCampaign.milestones
      .filter(milestone => 
        milestone.status === 'pending' || milestone.status === 'active'
      )
      .sort((a, b) => a.targetDay - b.targetDay);

    // 現在日数以降で最も近いマイルストーンを取得
    return activeMilestones.find(milestone => milestone.targetDay >= currentDay) || null;
  }, [currentCampaign?.milestones, currentDay]);

  // マイルストーンから探索行動を抽出
  const milestoneExplorationActions = useMemo((): ExplorationAction[] => {
    if (!currentMilestone) return [];

    const explorationActions: ExplorationAction[] = [];

    currentMilestone.requirements.forEach((requirement) => {
      switch (requirement.type) {
        case 'events':
          requirement.eventIds?.forEach(eventId => {
            const event = currentCampaign?.timeline?.find((e: UnifiedEvent) => e.id === eventId);
            if (event?.explorationActions) {
              explorationActions.push(...event.explorationActions);
            }
          });
          break;

        case 'quests':
          requirement.questIds?.forEach(questId => {
            const quest = currentCampaign?.quests?.find((q: QuestElement) => q.id === questId);
            if (quest?.explorationActions) {
              explorationActions.push(...quest.explorationActions);
            }
          });
          break;

        case 'enemies':
          requirement.enemyRequirements?.forEach(enemyReq => {
            const enemy = currentCampaign?.enemies?.find((e: EnemyCharacter) => e.id === enemyReq.enemyId);
            if (enemy?.explorationActions) {
              explorationActions.push(...enemy.explorationActions);
            }
          });
          break;
      }
    });

    // 重複を除去
    return explorationActions.filter((action, index, self) => 
      self.findIndex(a => a.id === action.id) === index
    );
  }, [currentMilestone, currentCampaign]);

  // 探索行動をUI用のActionChoiceに変換
  const convertToActionChoices = useMemo(() => {
    return milestoneExplorationActions.map((action): any => ({
      id: action.id,
      type: 'custom' as const,
      label: action.title,
      description: action.description,
      icon: getActionTypeIcon(action.actionType),
      explorationAction: action, // 元の探索行動データを保持
      priority: action.priority || 0,
    }));
  }, [milestoneExplorationActions]);

  return {
    currentMilestone,
    milestoneExplorationActions,
    explorationActionChoices: convertToActionChoices,
    currentDay,
  };
};

/**
 * 探索行動タイプに応じたアイコンを取得
 */
const getActionTypeIcon = (actionType: string) => {
  // Material-UIアイコンの動的import等は実際の実装で行う
  switch (actionType) {
    case 'investigate':
      return '🔍'; // 調査
    case 'search':
      return '🔎'; // 捜索
    case 'interact':
      return '💬'; // 交流
    case 'combat':
      return '⚔️'; // 戦闘
    case 'collect':
      return '📦'; // 収集
    case 'travel':
      return '🗺️'; // 移動
    case 'rest':
      return '😴'; // 休息
    default:
      return '❓'; // その他
  }
};