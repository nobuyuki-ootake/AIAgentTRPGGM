import {
  CampaignMilestone,
  MilestoneRequirement,
  TRPGCampaign,
  UnifiedEvent,
  QuestElement,
  EnemyCharacter,
  Item,
  PartyInventoryItem,
  MilestoneCheckResult,
  MilestoneProgress
} from '@trpg-ai-gm/types';

/**
 * マイルストーン達成判定ユーティリティ
 */
export class MilestoneAchievementChecker {
  private campaign: TRPGCampaign;
  private currentDay: number;

  constructor(campaign: TRPGCampaign, currentDay: number) {
    this.campaign = campaign;
    this.currentDay = currentDay;
  }

  /**
   * 特定のマイルストーンの達成状況を詳細にチェック
   */
  checkMilestoneAchievement(milestone: CampaignMilestone): MilestoneProgress {
    const requirementProgress: Record<number, any> = {};
    let totalRequirements = 0;
    let completedRequirements = 0;

    milestone.requirements.forEach((requirement, index) => {
      totalRequirements++;
      const progress = this.checkRequirementProgress(requirement);
      
      requirementProgress[index] = {
        type: requirement.type,
        completed: progress.completed,
        progress: progress.progress,
        details: progress.details
      };

      if (progress.completed) {
        completedRequirements++;
      }
    });

    // 全体進捗の計算
    let overallProgress: number;
    if (milestone.completionMode === 'all') {
      // 全条件達成が必要
      overallProgress = (completedRequirements / totalRequirements) * 100;
    } else {
      // 部分達成モード
      const requiredCount = milestone.requirements.find(req => req.requiredCount)?.requiredCount || totalRequirements;
      overallProgress = Math.min(100, (completedRequirements / requiredCount) * 100);
    }

    return {
      milestoneId: milestone.id,
      requirements: requirementProgress,
      overallProgress,
      estimatedCompletionDay: this.estimateCompletionDay(milestone, overallProgress)
    };
  }

  /**
   * 個別の達成条件の進捗をチェック
   */
  private checkRequirementProgress(requirement: MilestoneRequirement): {
    completed: boolean;
    progress: number;
    details: string;
  } {
    switch (requirement.type) {
      case 'events':
        return this.checkEventRequirement(requirement);
      case 'quests':
        return this.checkQuestRequirement(requirement);
      case 'items':
        return this.checkItemRequirement(requirement);
      case 'enemies':
        return this.checkEnemyRequirement(requirement);
      default:
        return { completed: false, progress: 0, details: '不明な条件タイプ' };
    }
  }

  /**
   * イベント達成条件のチェック
   */
  private checkEventRequirement(requirement: MilestoneRequirement): {
    completed: boolean;
    progress: number;
    details: string;
  } {
    if (!requirement.eventIds || requirement.eventIds.length === 0) {
      return { completed: false, progress: 0, details: 'イベントが指定されていません' };
    }

    const completedEvents = requirement.eventIds.filter(eventId => {
      const event = this.campaign.timeline?.find((e: UnifiedEvent) => e.id === eventId);
      return event && (event.outcome === 'success' || event.outcome === 'partial');
    });

    const progress = (completedEvents.length / requirement.eventIds.length) * 100;
    const completed = completedEvents.length === requirement.eventIds.length;

    return {
      completed,
      progress,
      details: `イベント ${completedEvents.length}/${requirement.eventIds.length} 完了`
    };
  }

  /**
   * クエスト達成条件のチェック
   */
  private checkQuestRequirement(requirement: MilestoneRequirement): {
    completed: boolean;
    progress: number;
    details: string;
  } {
    if (!requirement.questIds || requirement.questIds.length === 0) {
      return { completed: false, progress: 0, details: 'クエストが指定されていません' };
    }

    const completedQuests = requirement.questIds.filter(questId => {
      const quest = this.campaign.quests?.find((q: QuestElement) => q.id === questId);
      return quest && quest.status === '完了';
    });

    const progress = (completedQuests.length / requirement.questIds.length) * 100;
    const completed = completedQuests.length === requirement.questIds.length;

    return {
      completed,
      progress,
      details: `クエスト ${completedQuests.length}/${requirement.questIds.length} 完了`
    };
  }

  /**
   * アイテム収集条件のチェック
   */
  private checkItemRequirement(requirement: MilestoneRequirement): {
    completed: boolean;
    progress: number;
    details: string;
  } {
    if (!requirement.itemRequirements || requirement.itemRequirements.length === 0) {
      return { completed: false, progress: 0, details: 'アイテムが指定されていません' };
    }

    const partyInventory = this.campaign.partyInventory || [];
    let completedItems = 0;
    const itemDetails: string[] = [];

    requirement.itemRequirements.forEach(itemReq => {
      const inventoryItem = partyInventory.find(
        item => item.itemId === itemReq.itemId
      );
      const currentQuantity = inventoryItem?.quantity || 0;
      const hasEnough = currentQuantity >= itemReq.quantity;

      if (hasEnough) {
        completedItems++;
      }

      itemDetails.push(
        `${this.getItemName(itemReq.itemId)}: ${currentQuantity}/${itemReq.quantity}`
      );
    });

    const progress = (completedItems / requirement.itemRequirements.length) * 100;
    const completed = completedItems === requirement.itemRequirements.length;

    return {
      completed,
      progress,
      details: `アイテム収集 ${completedItems}/${requirement.itemRequirements.length} (${itemDetails.join(', ')})`
    };
  }

  /**
   * エネミー討伐条件のチェック
   */
  private checkEnemyRequirement(requirement: MilestoneRequirement): {
    completed: boolean;
    progress: number;
    details: string;
  } {
    if (!requirement.enemyRequirements || requirement.enemyRequirements.length === 0) {
      return { completed: false, progress: 0, details: 'エネミーが指定されていません' };
    }

    // TODO: 討伐記録システムが実装されたら、ここで実際の討伐数をチェック
    // 現在は仮実装として、campaignFlags から討伐記録を参照
    const defeatedEnemies = this.campaign.campaignFlags?.defeatedEnemies || {};
    let completedEnemies = 0;
    const enemyDetails: string[] = [];

    requirement.enemyRequirements.forEach(enemyReq => {
      const defeatedCount = defeatedEnemies[enemyReq.enemyId] || 0;
      const hasEnough = defeatedCount >= enemyReq.count;

      if (hasEnough) {
        completedEnemies++;
      }

      enemyDetails.push(
        `${this.getEnemyName(enemyReq.enemyId)}: ${defeatedCount}/${enemyReq.count}`
      );
    });

    const progress = (completedEnemies / requirement.enemyRequirements.length) * 100;
    const completed = completedEnemies === requirement.enemyRequirements.length;

    return {
      completed,
      progress,
      details: `エネミー討伐 ${completedEnemies}/${requirement.enemyRequirements.length} (${enemyDetails.join(', ')})`
    };
  }

  /**
   * マイルストーンの完了予想日を推定
   */
  private estimateCompletionDay(milestone: CampaignMilestone, currentProgress: number): number {
    if (currentProgress >= 100) {
      return this.currentDay; // 既に完了
    }

    if (currentProgress === 0) {
      return milestone.targetDay; // 進捗なしの場合は目標日をそのまま返す
    }

    // 現在の進捗率から完了までの日数を推定
    const progressPerDay = currentProgress / this.currentDay;
    const remainingProgress = 100 - currentProgress;
    const estimatedRemainingDays = Math.ceil(remainingProgress / progressPerDay);

    return Math.min(this.currentDay + estimatedRemainingDays, milestone.targetDay + 5); // 最大で目標日+5日
  }

  /**
   * 複数のマイルストーンを一括チェック
   */
  checkAllActiveMilestones(): MilestoneCheckResult[] {
    const activeMilestones = this.campaign.milestones?.filter(
      milestone => milestone.status === 'pending' || milestone.status === 'active'
    ) || [];

    return activeMilestones.map(milestone => {
      const progress = this.checkMilestoneAchievement(milestone);
      const isCompleted = progress.overallProgress >= 100;
      const isOverdue = this.currentDay > milestone.targetDay;
      const shouldGameOver = milestone.deadline && isOverdue && !isCompleted;

      let gmAction: MilestoneCheckResult['gmAction'] = undefined;

      if (isCompleted) {
        // 達成時
        const hints = milestone.gmGuidance.onTimeHints.filter(hint => hint.trim());
        gmAction = {
          type: 'announce',
          message: hints.length > 0 
            ? hints[Math.floor(Math.random() * hints.length)]
            : `🎉 マイルストーン「${milestone.title}」を達成しました！`,
          suggestedActions: ['次のマイルストーンを確認', '報酬の受け取り', 'パーティーでの祝福']
        };
      } else if (shouldGameOver) {
        // ゲームオーバー
        gmAction = {
          type: 'gameover',
          message: milestone.gmGuidance.failureMessage || 
            `💀 必須期限「${milestone.title}」を達成できませんでした。`,
          suggestedActions: ['セーブデータの確認', 'リスタート', '期限の再設定']
        };
      } else if (isOverdue && !milestone.deadline) {
        // 遅延時の案内
        const delayedHints = milestone.gmGuidance.delayedHints.filter(hint => hint.trim());
        gmAction = {
          type: 'announce',
          message: delayedHints.length > 0
            ? delayedHints[Math.floor(Math.random() * delayedHints.length)]
            : `⏰ マイルストーン「${milestone.title}」の期限が過ぎています。`,
          suggestedActions: ['マイルストーン達成のための行動', '優先度の再検討']
        };
      } else if (milestone.targetDay - this.currentDay <= 2 && milestone.deadline) {
        // 期限間近の警告
        gmAction = {
          type: 'announce',
          message: `🚨 重要：マイルストーン「${milestone.title}」の期限まで残り${milestone.targetDay - this.currentDay}日です！`,
          suggestedActions: ['緊急行動の実施', 'パーティー全体での集中']
        };
      }

      return {
        milestoneId: milestone.id,
        wasCompleted: isCompleted,
        wasOverdue: isOverdue,
        shouldGameOver,
        gmAction
      };
    });
  }

  /**
   * アイテム名を取得（ヘルパーメソッド）
   */
  private getItemName(itemId: string): string {
    const item = this.campaign.items?.find((i: Item) => i.id === itemId);
    return item?.name || `不明なアイテム(${itemId})`;
  }

  /**
   * エネミー名を取得（ヘルパーメソッド）
   */
  private getEnemyName(enemyId: string): string {
    const enemy = this.campaign.enemies?.find((e: EnemyCharacter) => e.id === enemyId);
    return enemy?.name || `不明なエネミー(${enemyId})`;
  }

  /**
   * プレイヤーの行動後にマイルストーンを更新
   */
  updateMilestonesAfterAction(actionResult: any): {
    updatedMilestones: CampaignMilestone[];
    achievementMessages: string[];
  } {
    const updatedMilestones: CampaignMilestone[] = [];
    const achievementMessages: string[] = [];

    const checkResults = this.checkAllActiveMilestones();
    
    checkResults.forEach(result => {
      const milestone = this.campaign.milestones?.find(m => m.id === result.milestoneId);
      if (!milestone) return;

      let newStatus = milestone.status;
      
      if (result.wasCompleted && milestone.status !== 'completed') {
        newStatus = 'completed';
        if (result.gmAction?.message) {
          achievementMessages.push(result.gmAction.message);
        }
      } else if (result.shouldGameOver) {
        newStatus = 'failed';
        if (result.gmAction?.message) {
          achievementMessages.push(result.gmAction.message);
        }
      } else if (result.wasOverdue && milestone.status === 'active') {
        newStatus = 'overdue';
      }

      if (newStatus !== milestone.status) {
        updatedMilestones.push({
          ...milestone,
          status: newStatus,
          achievedDay: result.wasCompleted ? this.currentDay : milestone.achievedDay,
          updatedAt: new Date()
        });
      }
    });

    return { updatedMilestones, achievementMessages };
  }
}

/**
 * マイルストーン達成チェッカーのファクトリー関数
 */
export const createMilestoneChecker = (campaign: TRPGCampaign, currentDay: number) => {
  return new MilestoneAchievementChecker(campaign, currentDay);
};