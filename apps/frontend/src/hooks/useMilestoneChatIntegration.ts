import { useState, useCallback, useEffect, useMemo } from 'react';
import { useMilestoneManager } from './useMilestoneManager';
import { milestoneAgentApi } from '../api/milestoneAgent';
import { ChatMessage } from '../components/trpg-session/ChatInterface';
import { useRecoilValue } from 'recoil';
import { currentCampaignState } from '../store/atoms';

/**
 * チャットとマイルストーンの統合フック
 * マイルストーン情報をAIチャットに組み込み、適切な誘導を行う
 */
export const useMilestoneChatIntegration = () => {
  const currentCampaign = useRecoilValue(currentCampaignState);
  const [lastGuidanceDay, setLastGuidanceDay] = useState<number>(0);
  const [guidanceHistory, setGuidanceHistory] = useState<Array<{
    day: number;
    milestoneId: string;
    guidanceType: 'subtle' | 'moderate' | 'direct' | 'urgent';
    message: string;
  }>>([]);
  
  const {
    currentMilestone,
    currentDay,
    generateAIMilestoneContext,
    getMilestoneUrgency,
    performDailyMilestoneCheck,
    checkMilestoneCompletion,
    activateNextMilestone,
  } = useMilestoneManager();

  // 現在の状況に基づく誘導強度を決定
  const getGuidanceIntensity = useCallback((milestoneUrgency: string, daysSinceLastGuidance: number) => {
    if (milestoneUrgency === 'critical' || milestoneUrgency === 'overdue') {
      return 'direct';
    }
    if (milestoneUrgency === 'urgent') {
      return 'moderate';
    }
    if (daysSinceLastGuidance >= 3) {
      return 'moderate';
    }
    return 'subtle';
  }, []);

  // マイルストーン誘導メッセージを生成
  const generateMilestoneGuidance = useCallback(async (
    playerMessage: string,
    chatHistory: ChatMessage[] = [],
    forceGuidance: boolean = false
  ): Promise<string | null> => {
    if (!currentMilestone || !currentCampaign) return null;

    const urgency = getMilestoneUrgency(currentMilestone);
    const daysSinceLastGuidance = currentDay - lastGuidanceDay;
    const intensity = getGuidanceIntensity(urgency, daysSinceLastGuidance);

    // 誘導が必要かどうかの判定
    const shouldProvideGuidance = forceGuidance || 
      urgency === 'critical' || 
      urgency === 'overdue' ||
      (urgency === 'urgent' && daysSinceLastGuidance >= 1) ||
      daysSinceLastGuidance >= 3;

    if (!shouldProvideGuidance) return null;

    try {
      const milestoneContext = generateAIMilestoneContext();
      const conversationHistory = chatHistory.slice(-5).map(msg => ({
        role: msg.type === 'user' ? 'user' as const : 'assistant' as const,
        content: msg.content
      }));

      const currentLocation = ""; // TODO: 現在地を取得
      const characters = currentCampaign.characters?.map(c => c.name) || [];

      let response;
      
      if (intensity === 'direct' || urgency === 'overdue') {
        // 直接的な警告や指導
        const progress = await import('./useMilestoneManager').then(m => 
          m.useMilestoneManager().calculateMilestoneProgress(currentMilestone)
        );
        
        const remainingRequirements = currentMilestone.requirements
          .filter((_, index) => !(progress as any).requirements[index]?.completed)
          .map(req => req.description);

        response = await milestoneAgentApi.generateMilestoneWarning({
          milestone: {
            title: currentMilestone.title,
            description: currentMilestone.description,
            targetDay: currentMilestone.targetDay,
            deadline: currentMilestone.deadline
          },
          currentDay,
          progress: (progress as any).overallProgress,
          remainingRequirements,
          campaignContext: {
            title: currentCampaign.title,
            location: currentLocation,
            characters
          }
        });
      } else {
        // 自然な誘導
        response = await milestoneAgentApi.generateNaturalGuidance({
          milestoneContext,
          conversationHistory,
          currentSituation: `現在地: ${currentLocation}, 日数: ${currentDay}日目`,
          guidanceIntensity: intensity
        });
      }

      if (response?.status === 'success' && response?.data?.message) {
        // ガイダンス履歴を更新
        setGuidanceHistory(prev => [...prev, {
          day: currentDay,
          milestoneId: currentMilestone.id,
          guidanceType: intensity,
          message: response.data.message
        }]);
        setLastGuidanceDay(currentDay);

        return response.data.message;
      }
    } catch (error) {
      console.warn('マイルストーン誘導生成エラー:', error);
    }

    return null;
  }, [currentMilestone, currentCampaign, currentDay, lastGuidanceDay, generateAIMilestoneContext, getMilestoneUrgency, getGuidanceIntensity]);

  // マイルストーン達成お祝いメッセージを生成
  const generateAchievementMessage = useCallback(async (
    achievedMilestone: any,
    nextMilestone?: any
  ): Promise<string | null> => {
    if (!currentCampaign) return null;

    try {
      const characters = currentCampaign.characters?.map(c => c.name) || [];
      
      const response = await milestoneAgentApi.generateMilestoneAchievement({
        achievedMilestone: {
          title: achievedMilestone.title,
          description: achievedMilestone.description,
          completionDetails: `${currentDay}日目に達成`
        },
        nextMilestone: nextMilestone ? {
          title: nextMilestone.title,
          description: nextMilestone.description,
          targetDay: nextMilestone.targetDay
        } : undefined,
        campaignContext: {
          title: currentCampaign.title,
          currentDay,
          characters
        }
      });

      if (response?.status === 'success' && response?.data?.message) {
        return response.data.message;
      }
    } catch (error) {
      console.warn('マイルストーン達成メッセージ生成エラー:', error);
    }

    return null;
  }, [currentCampaign, currentDay]);

  // 日次マイルストーンチェックと自動メッセージ生成
  const performDailyMilestoneGuidance = useCallback(async (): Promise<ChatMessage[]> => {
    const results = performDailyMilestoneCheck();
    const messages: ChatMessage[] = [];

    for (const result of results) {
      if (result.gmAction) {
        let message: string | null = null;

        if (result.wasCompleted) {
          // 達成メッセージ
          const completedMilestone = currentMilestone;
          const nextMilestone = activateNextMilestone();
          
          message = await generateAchievementMessage(completedMilestone, nextMilestone);
        } else if (result.gmAction.type === 'announce') {
          // 一般的なアナウンス
          message = result.gmAction.message;
        } else if (result.gmAction.type === 'gameover') {
          // ゲームオーバーメッセージ
          message = result.gmAction.message;
        }

        if (message) {
          messages.push({
            id: `milestone-${result.milestoneId}-${Date.now()}`,
            type: 'system',
            content: message,
            timestamp: new Date(),
            sender: 'AI Game Master'
          });
        }
      }
    }

    return messages;
  }, [performDailyMilestoneCheck, currentMilestone, activateNextMilestone, generateAchievementMessage]);

  // マイルストーンコンテキストをチャットプロンプトに組み込む
  const getMilestoneEnhancedPrompt = useCallback((userMessage: string): string => {
    if (!currentMilestone) return userMessage;

    const milestoneContext = generateAIMilestoneContext();
    const urgency = getMilestoneUrgency(currentMilestone);
    
    let enhancedPrompt = userMessage;
    
    // 緊急度に応じてコンテキストを追加
    if (urgency === 'critical' || urgency === 'overdue') {
      enhancedPrompt += `\n\n[重要なマイルストーン情報]\n${milestoneContext}`;
    } else if (urgency === 'urgent') {
      enhancedPrompt += `\n\n[マイルストーン情報]\n${milestoneContext}`;
    }
    // normal の場合は自然な誘導に任せる

    return enhancedPrompt;
  }, [currentMilestone, generateAIMilestoneContext, getMilestoneUrgency]);

  // マイルストーン状態の要約を取得
  const getMilestoneStatusSummary = useCallback(() => {
    if (!currentMilestone) {
      return {
        hasMilestone: false,
        message: "現在アクティブなマイルストーンはありません。"
      };
    }

    const urgency = getMilestoneUrgency(currentMilestone);
    const daysRemaining = currentMilestone.targetDay - currentDay;
    
    return {
      hasMilestone: true,
      milestone: currentMilestone,
      urgency,
      daysRemaining,
      isDeadline: currentMilestone.deadline,
      message: `現在のマイルストーン: ${currentMilestone.title} (残り${daysRemaining}日)`
    };
  }, [currentMilestone, getMilestoneUrgency, currentDay]);

  // 日数変更時の自動処理
  useEffect(() => {
    if (currentDay > lastGuidanceDay) {
      // 自動ガイダンスチェックを非同期で実行
      performDailyMilestoneGuidance().then(messages => {
        if (messages.length > 0) {
          // TODO: チャットシステムにメッセージを送信
          console.log('マイルストーン自動メッセージ:', messages);
        }
      });
    }
  }, [currentDay, lastGuidanceDay, performDailyMilestoneGuidance]);

  return {
    // 状態
    currentMilestone,
    guidanceHistory,
    
    // メイン機能
    generateMilestoneGuidance,
    generateAchievementMessage,
    performDailyMilestoneGuidance,
    getMilestoneEnhancedPrompt,
    
    // ユーティリティ
    getMilestoneStatusSummary,
    shouldShowMilestoneWarning: currentMilestone && getMilestoneUrgency(currentMilestone) !== 'normal',
    
    // デバッグ用
    _debugInfo: {
      lastGuidanceDay,
      currentDay,
      urgency: currentMilestone ? getMilestoneUrgency(currentMilestone) : null,
    }
  };
};