import { useState, useEffect, useCallback, useMemo } from 'react';
import { useRecoilState, useRecoilValue } from 'recoil';
import { currentCampaignState } from '../store/atoms';
import {
  CampaignMilestone,
  MilestoneCheckResult,
  MilestoneProgress,
  TRPGCampaign,
  UnifiedEvent,
  QuestElement,
  EnemyCharacter,
  Item
} from '@trpg-ai-gm/types';

/**
 * マイルストーン管理システム
 * - 状態監視と達成判定
 * - AI連携のための情報提供
 * - 自動フロー制御
 */
export const useMilestoneManager = () => {
  const [currentCampaign, setCurrentCampaign] = useRecoilState(currentCampaignState);
  const [lastCheckedDay, setLastCheckedDay] = useState<number>(0);

  // 現在のセッション日数を取得（TODO: セッション状態から取得）
  const currentDay = useMemo(() => {
    // とりあえず1日目として扱う
    return 1;
  }, []);

  // アクティブなマイルストーンを取得
  const activeMilestones = useMemo((): CampaignMilestone[] => {
    if (!currentCampaign?.milestones) return [];
    
    return currentCampaign.milestones.filter(milestone => 
      milestone.status === 'pending' || milestone.status === 'active'
    ).sort((a, b) => a.targetDay - b.targetDay);
  }, [currentCampaign?.milestones]);

  // 現在のマイルストーン（最も近い未達成のもの）
  const currentMilestone = useMemo((): CampaignMilestone | null => {
    return activeMilestones.find(milestone => milestone.targetDay >= currentDay) || null;
  }, [activeMilestones, currentDay]);

  // マイルストーン進捗を計算
  const calculateMilestoneProgress = useCallback((milestone: CampaignMilestone): MilestoneProgress => {
    const requirementProgress: Record<number, any> = {};
    let totalRequirements = 0;
    let completedRequirements = 0;

    milestone.requirements.forEach((requirement, index) => {
      totalRequirements++;
      let progress = 0;
      let completed = false;
      let details = '';

      switch (requirement.type) {
        case 'events':
          if (requirement.eventIds) {
            const completedEvents = requirement.eventIds.filter(eventId => {
              const event = currentCampaign?.timeline?.find((e: UnifiedEvent) => e.id === eventId);
              return event?.outcome === 'success';
            });
            progress = (completedEvents.length / requirement.eventIds.length) * 100;
            completed = completedEvents.length === requirement.eventIds.length;
            details = `イベント ${completedEvents.length}/${requirement.eventIds.length} 完了`;
          }
          break;

        case 'quests':
          if (requirement.questIds) {
            const completedQuests = requirement.questIds.filter(questId => {
              const quest = currentCampaign?.quests?.find((q: QuestElement) => q.id === questId);
              return quest?.status === '完了';
            });
            progress = (completedQuests.length / requirement.questIds.length) * 100;
            completed = completedQuests.length === requirement.questIds.length;
            details = `クエスト ${completedQuests.length}/${requirement.questIds.length} 完了`;
          }
          break;

        case 'items':
          if (requirement.itemRequirements) {
            // TODO: パーティーインベントリから取得
            progress = 0;
            completed = false;
            details = `アイテム収集 ${requirement.itemRequirements.length}件`;
          }
          break;

        case 'enemies':
          if (requirement.enemyRequirements) {
            // TODO: 討伐記録から計算
            progress = 0;
            completed = false;
            details = `エネミー討伐 ${requirement.enemyRequirements.length}種類`;
          }
          break;
      }

      requirementProgress[index] = {
        type: requirement.type,
        completed,
        progress,
        details
      };

      if (completed) {
        completedRequirements++;
      }
    });

    const overallProgress = milestone.completionMode === 'all' 
      ? (completedRequirements / totalRequirements) * 100
      : Math.min(100, (completedRequirements / (milestone.requirements.find(req => req.requiredCount)?.requiredCount || totalRequirements)) * 100);

    return {
      milestoneId: milestone.id,
      requirements: requirementProgress,
      overallProgress,
      estimatedCompletionDay: milestone.targetDay
    };
  }, [currentCampaign]);

  // マイルストーン達成チェック
  const checkMilestoneCompletion = useCallback((milestone: CampaignMilestone): MilestoneCheckResult => {
    const progress = calculateMilestoneProgress(milestone);
    const isCompleted = progress.overallProgress >= 100;
    const isOverdue = currentDay > milestone.targetDay;
    const shouldGameOver = milestone.deadline && isOverdue && !isCompleted;

    let gmAction: MilestoneCheckResult['gmAction'] = undefined;

    if (isCompleted) {
      // 達成時のメッセージ
      const onTimeHints = milestone.gmGuidance.onTimeHints.filter(hint => hint.trim());
      gmAction = {
        type: 'announce',
        message: onTimeHints.length > 0 
          ? onTimeHints[Math.floor(Math.random() * onTimeHints.length)]
          : `マイルストーン「${milestone.title}」を達成しました！`,
        suggestedActions: ['次のマイルストーンを確認', '報酬の受け取り', 'パーティーでの祝福']
      };
    } else if (shouldGameOver) {
      // ゲームオーバー時のメッセージ
      gmAction = {
        type: 'gameover',
        message: milestone.gmGuidance.failureMessage || 
          `必須期限「${milestone.title}」を達成できませんでした。ゲームオーバーです。`,
        suggestedActions: ['セーブデータの確認', 'リスタート', '期限の再設定']
      };
    } else if (isOverdue && !milestone.deadline) {
      // 遅延時のヒント
      const delayedHints = milestone.gmGuidance.delayedHints.filter(hint => hint.trim());
      gmAction = {
        type: 'announce',
        message: delayedHints.length > 0
          ? delayedHints[Math.floor(Math.random() * delayedHints.length)]
          : `マイルストーン「${milestone.title}」の期限が過ぎています。早めの達成をお勧めします。`,
        suggestedActions: ['マイルストーン達成のための行動', '優先度の再検討', 'パーティーでの相談']
      };
    } else if (milestone.targetDay - currentDay <= 2 && milestone.deadline) {
      // 期限間近の警告
      gmAction = {
        type: 'announce',
        message: `重要：マイルストーン「${milestone.title}」の期限まで残り${milestone.targetDay - currentDay}日です。`,
        suggestedActions: ['緊急行動の実施', 'パーティー全体での集中', 'リソースの集約']
      };
    }

    return {
      milestoneId: milestone.id,
      wasCompleted: isCompleted,
      wasOverdue: isOverdue,
      shouldGameOver,
      gmAction
    };
  }, [currentDay, calculateMilestoneProgress]);

  // マイルストーン状態の更新
  const updateMilestoneStatus = useCallback((milestoneId: string, newStatus: CampaignMilestone['status'], achievedDay?: number) => {
    if (!currentCampaign) return;

    setCurrentCampaign(prev => {
      if (!prev) return prev;

      const updatedMilestones = prev.milestones?.map(milestone => 
        milestone.id === milestoneId 
          ? { 
              ...milestone, 
              status: newStatus,
              achievedDay: achievedDay || milestone.achievedDay,
              updatedAt: new Date()
            }
          : milestone
      );

      return {
        ...prev,
        milestones: updatedMilestones,
        updatedAt: new Date()
      };
    });
  }, [currentCampaign, setCurrentCampaign]);

  // 次のマイルストーンをアクティブ化
  const activateNextMilestone = useCallback(() => {
    if (!currentCampaign?.milestones) return null;

    const nextMilestone = currentCampaign.milestones
      .filter(milestone => milestone.status === 'pending')
      .sort((a, b) => a.targetDay - b.targetDay)[0];

    if (nextMilestone) {
      updateMilestoneStatus(nextMilestone.id, 'active');
      return nextMilestone;
    }

    return null;
  }, [currentCampaign?.milestones, updateMilestoneStatus]);

  // 日次マイルストーンチェック
  const performDailyMilestoneCheck = useCallback((): MilestoneCheckResult[] => {
    if (!activeMilestones.length || lastCheckedDay >= currentDay) {
      return [];
    }

    const results: MilestoneCheckResult[] = [];

    activeMilestones.forEach(milestone => {
      const result = checkMilestoneCompletion(milestone);
      results.push(result);

      // 状態の更新
      if (result.wasCompleted && milestone.status !== 'completed') {
        updateMilestoneStatus(milestone.id, 'completed', currentDay);
      } else if (result.shouldGameOver) {
        updateMilestoneStatus(milestone.id, 'failed', currentDay);
      } else if (result.wasOverdue && milestone.status === 'active') {
        updateMilestoneStatus(milestone.id, 'overdue');
      }
    });

    setLastCheckedDay(currentDay);
    return results;
  }, [activeMilestones, currentDay, lastCheckedDay, checkMilestoneCompletion, updateMilestoneStatus]);

  // AI用のマイルストーン情報を生成
  const generateAIMilestoneContext = useCallback((): string => {
    if (!currentMilestone) {
      return "現在アクティブなマイルストーンはありません。";
    }

    const progress = calculateMilestoneProgress(currentMilestone);
    const daysRemaining = currentMilestone.targetDay - currentDay;
    const isUrgent = daysRemaining <= 2 && currentMilestone.deadline;

    let context = `【現在のマイルストーン】\n`;
    context += `タイトル: ${currentMilestone.title}\n`;
    context += `説明: ${currentMilestone.description}\n`;
    context += `目標日: ${currentMilestone.targetDay}日目 (残り${daysRemaining}日)\n`;
    context += `進捗: ${Math.round(progress.overallProgress)}%\n`;
    context += `優先度: ${currentMilestone.priority}\n`;
    
    if (currentMilestone.deadline) {
      context += `⚠️ 必須期限: ${isUrgent ? '緊急' : '設定済み'}\n`;
    }

    context += `\n【達成条件】\n`;
    currentMilestone.requirements.forEach((req, index) => {
      const reqProgress = progress.requirements[index];
      context += `- ${req.description} (${reqProgress?.details || '未設定'})\n`;
    });

    if (isUrgent) {
      context += `\n🚨 【AI誘導方針】期限が迫っているため、プレイヤーを適切にマイルストーン達成に向けて誘導してください。\n`;
    } else if (daysRemaining > 0) {
      context += `\n💡 【AI誘導方針】自然な形でマイルストーン達成に向けた行動を促してください。\n`;
    }

    return context;
  }, [currentMilestone, currentDay, calculateMilestoneProgress]);

  // 自動チェック実行（日数変更時）
  useEffect(() => {
    if (currentDay > lastCheckedDay) {
      const results = performDailyMilestoneCheck();
      
      // 完了したマイルストーンがある場合、次をアクティブ化
      if (results.some(result => result.wasCompleted)) {
        setTimeout(() => {
          activateNextMilestone();
        }, 1000); // 1秒後に次のマイルストーンをアクティブ化
      }
    }
  }, [currentDay, lastCheckedDay, performDailyMilestoneCheck, activateNextMilestone]);

  return {
    // 状態
    currentMilestone,
    activeMilestones,
    currentDay,

    // 計算関数
    calculateMilestoneProgress,
    checkMilestoneCompletion,
    generateAIMilestoneContext,

    // アクション
    updateMilestoneStatus,
    activateNextMilestone,
    performDailyMilestoneCheck,

    // ユーティリティ
    isDeadlineApproaching: (milestone: CampaignMilestone) => 
      milestone.targetDay - currentDay <= 2 && milestone.deadline,
    getMilestoneUrgency: (milestone: CampaignMilestone) => {
      const daysRemaining = milestone.targetDay - currentDay;
      if (daysRemaining < 0) return 'overdue';
      if (daysRemaining <= 1 && milestone.deadline) return 'critical';
      if (daysRemaining <= 2) return 'urgent';
      return 'normal';
    }
  };
};