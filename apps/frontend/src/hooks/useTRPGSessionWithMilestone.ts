import { useCallback, useEffect, useMemo } from 'react';
import { useRecoilState, useRecoilValue } from 'recoil';
import { currentCampaignState } from '../store/atoms';
import { useMilestoneManager } from './useMilestoneManager';
import { useMilestoneChatIntegration } from './useMilestoneChatIntegration';
import { createMilestoneChecker } from '../utils/milestoneAchievementChecker';
import { ChatMessage } from '../components/trpg-session/ChatInterface';
import { 
  TRPGActionRequest, 
  TRPGActionResult, 
  CampaignMilestone,
  MilestoneCheckResult 
} from '@trpg-ai-gm/types';

/**
 * TRPGセッション用マイルストーン統合フック
 * メインのTRPGセッションUIフックに統合するためのマイルストーン機能
 */
export const useTRPGSessionWithMilestone = () => {
  const [currentCampaign, setCurrentCampaign] = useRecoilState(currentCampaignState);
  
  // マイルストーン管理機能
  const milestoneManager = useMilestoneManager();
  
  // チャット統合機能
  const milestoneChatIntegration = useMilestoneChatIntegration();
  
  // 現在のセッション日数（TODO: 実際のセッション状態から取得）
  const currentDay = useMemo(() => {
    // とりあえず1日目として扱う
    return 1;
  }, []);

  // マイルストーン達成チェッカーを作成
  const milestoneChecker = useMemo(() => {
    if (!currentCampaign) return null;
    return createMilestoneChecker(currentCampaign, currentDay);
  }, [currentCampaign, currentDay]);

  /**
   * プレイヤー行動後のマイルストーンチェックと更新
   */
  const checkMilestonesAfterAction = useCallback(async (
    actionRequest: TRPGActionRequest,
    actionResult: TRPGActionResult
  ): Promise<{
    milestoneMessages: ChatMessage[];
    updatedMilestones: CampaignMilestone[];
    shouldShowAchievement: boolean;
  }> => {
    if (!milestoneChecker || !currentCampaign) {
      return { milestoneMessages: [], updatedMilestones: [], shouldShowAchievement: false };
    }

    // マイルストーンの状態をチェック
    const { updatedMilestones, achievementMessages } = milestoneChecker.updateMilestonesAfterAction(actionResult);
    
    // キャンペーンを更新
    if (updatedMilestones.length > 0) {
      setCurrentCampaign(prev => {
        if (!prev) return prev;
        
        const newMilestones = prev.milestones?.map(milestone => {
          const updated = updatedMilestones.find(m => m.id === milestone.id);
          return updated || milestone;
        });
        
        return {
          ...prev,
          milestones: newMilestones,
          updatedAt: new Date()
        };
      });
    }

    // 達成メッセージをチャットメッセージに変換
    const milestoneMessages: ChatMessage[] = achievementMessages.map((message, index) => ({
      id: `milestone-achievement-${Date.now()}-${index}`,
      type: 'system',
      content: message,
      timestamp: new Date(),
      sender: 'AI Game Master'
    }));

    return {
      milestoneMessages,
      updatedMilestones,
      shouldShowAchievement: achievementMessages.length > 0
    };
  }, [milestoneChecker, currentCampaign, setCurrentCampaign]);

  /**
   * チャットメッセージにマイルストーン誘導を組み込む
   */
  const enhanceMessageWithMilestone = useCallback(async (
    userMessage: string,
    chatHistory: ChatMessage[] = []
  ): Promise<{
    enhancedMessage: string;
    guidanceMessage?: string;
  }> => {
    // マイルストーンコンテキストを組み込んだプロンプトを生成
    const enhancedMessage = milestoneChatIntegration.getMilestoneEnhancedPrompt(userMessage);
    
    // 必要に応じて誘導メッセージを生成
    const guidanceMessage = await milestoneChatIntegration.generateMilestoneGuidance(
      userMessage,
      chatHistory
    );

    return {
      enhancedMessage,
      guidanceMessage: guidanceMessage || undefined
    };
  }, [milestoneChatIntegration]);

  /**
   * 日次マイルストーンチェック（日数が進んだ時に呼び出す）
   */
  const performDailyMilestoneCheck = useCallback(async (): Promise<ChatMessage[]> => {
    return await milestoneChatIntegration.performDailyMilestoneGuidance();
  }, [milestoneChatIntegration]);

  /**
   * マイルストーン警告をチェック（UI表示用）
   */
  const getMilestoneWarnings = useCallback((): {
    hasUrgentMilestone: boolean;
    warningMessage?: string;
    daysRemaining?: number;
  } => {
    const statusSummary = milestoneChatIntegration.getMilestoneStatusSummary();
    
    if (!statusSummary.hasMilestone) {
      return { hasUrgentMilestone: false };
    }

    const isUrgent = statusSummary.urgency === 'urgent' || 
                    statusSummary.urgency === 'critical' || 
                    statusSummary.urgency === 'overdue';

    if (isUrgent) {
      let warningMessage = `⚠️ マイルストーン: ${statusSummary.milestone?.title}`;
      
      if (statusSummary.urgency === 'overdue') {
        warningMessage += ` (期限超過)`;
      } else if (statusSummary.daysRemaining !== undefined) {
        warningMessage += ` (残り${statusSummary.daysRemaining}日)`;
      }

      return {
        hasUrgentMilestone: true,
        warningMessage,
        daysRemaining: statusSummary.daysRemaining
      };
    }

    return { hasUrgentMilestone: false };
  }, [milestoneChatIntegration]);

  /**
   * マイルストーン達成状況の要約を取得
   */
  const getMilestoneProgress = useCallback(() => {
    if (!milestoneManager.currentMilestone) {
      return null;
    }

    const progress = milestoneManager.calculateMilestoneProgress(milestoneManager.currentMilestone);
    
    return {
      milestone: milestoneManager.currentMilestone,
      progress: Math.round(progress.overallProgress),
      requirements: Object.values(progress.requirements).map(req => ({
        type: req.type,
        completed: req.completed,
        details: req.details
      })),
      daysRemaining: milestoneManager.currentMilestone.targetDay - currentDay,
      isDeadline: milestoneManager.currentMilestone.deadline
    };
  }, [milestoneManager, currentDay]);

  /**
   * 緊急マイルストーン通知（重要度が高い場合に表示）
   */
  const getUrgentMilestoneNotification = useCallback((): {
    shouldShow: boolean;
    notification?: {
      title: string;
      message: string;
      type: 'warning' | 'error' | 'info';
    };
  } => {
    const warnings = getMilestoneWarnings();
    
    if (!warnings.hasUrgentMilestone || !warnings.warningMessage) {
      return { shouldShow: false };
    }

    const milestone = milestoneManager.currentMilestone;
    if (!milestone) {
      return { shouldShow: false };
    }

    const urgency = milestoneManager.getMilestoneUrgency(milestone);
    
    return {
      shouldShow: true,
      notification: {
        title: urgency === 'overdue' ? '期限超過' : urgency === 'critical' ? '緊急' : '警告',
        message: warnings.warningMessage,
        type: urgency === 'overdue' ? 'error' : urgency === 'critical' ? 'warning' : 'info'
      }
    };
  }, [getMilestoneWarnings, milestoneManager]);

  return {
    // 状態
    currentMilestone: milestoneManager.currentMilestone,
    activeMilestones: milestoneManager.activeMilestones,
    
    // 主要機能
    checkMilestonesAfterAction,
    enhanceMessageWithMilestone,
    performDailyMilestoneCheck,
    
    // UI用ユーティリティ
    getMilestoneWarnings,
    getMilestoneProgress,
    getUrgentMilestoneNotification,
    
    // マイルストーン状態管理
    updateMilestoneStatus: milestoneManager.updateMilestoneStatus,
    activateNextMilestone: milestoneManager.activateNextMilestone,
    
    // デバッグ情報
    _debugInfo: {
      currentDay,
      hasChecker: !!milestoneChecker,
      milestoneCount: milestoneManager.activeMilestones.length,
      chatIntegrationStatus: milestoneChatIntegration._debugInfo
    }
  };
};