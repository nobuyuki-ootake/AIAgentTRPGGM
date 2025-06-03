import { useRecoilValue } from 'recoil';
import { currentCampaignState } from '../store/atoms';
import { BaseLocation, TRPGCharacter } from '@novel-ai-assistant/types';
import { WorldContextBuilder } from '../utils/WorldContextBuilder';
import { useAIChatIntegration } from './useAIChatIntegration';
import { toast } from 'sonner';

interface WorldContextOptions {
  currentLocation?: BaseLocation;
  activeCharacters?: TRPGCharacter[];
  timeOfDay?: string;
  sessionDay?: number;
}

interface AIInteractionOptions {
  situation: 'encounter' | 'conversation' | 'exploration' | 'general';
  instruction?: string;
  npcName?: string;
  autoContext?: boolean;
}

/**
 * 🌍 世界観コンテキスト統合AI フック
 * 
 * WorldContextBuilderとAIチャット機能を統合し、
 * 豊富なコンテキスト情報をAIに提供するフック
 */
export const useWorldContextAI = () => {
  const currentCampaign = useRecoilValue(currentCampaignState);
  const { openAIAssist } = useAIChatIntegration();

  /**
   * 🤖 世界観コンテキストを使ったAI対話を開始
   */
  const startAIInteraction = (
    options: AIInteractionOptions,
    contextOptions?: WorldContextOptions
  ): boolean => {
    if (!currentCampaign) {
      toast.error('キャンペーンが選択されていません');
      return false;
    }

    try {
      // WorldContextBuilderを初期化
      const contextBuilder = new WorldContextBuilder(currentCampaign);

      // コンテキストオプションを設定
      if (contextOptions?.currentLocation) {
        contextBuilder.setCurrentLocation(contextOptions.currentLocation);
      }
      if (contextOptions?.activeCharacters) {
        contextBuilder.setActiveCharacters(contextOptions.activeCharacters);
      }
      if (contextOptions?.timeOfDay) {
        contextBuilder.setTimeOfDay(contextOptions.timeOfDay);
      }
      if (contextOptions?.sessionDay) {
        contextBuilder.setSessionDay(contextOptions.sessionDay);
      }

      // 状況別のAI指示を生成
      const aiInstruction = contextBuilder.buildAIInstruction(
        options.situation,
        options.instruction
      );

      // AIアシスト設定を構築
      const assistConfig = {
        title: getSituationTitle(options.situation),
        description: getSituationDescription(options.situation),
        defaultMessage: options.autoContext ? aiInstruction : (options.instruction || ''),
        supportsBatchGeneration: false,
        onComplete: async (result: any) => {
          console.log(`🤖 AI応答受信 (${options.situation}):`, result);
          
          // 結果に基づいた後処理
          await handleAIResponse(options.situation, result, contextOptions);
        },
      };

      // ページコンテキストを決定
      const pageContext = getPageContextForSituation(options.situation);

      // AI対話を開始
      return openAIAssist(
        pageContext,
        assistConfig,
        currentCampaign,
        [] // selectedElements
      );

    } catch (error) {
      console.error('世界観コンテキストAI対話エラー:', error);
      toast.error('AI対話の開始に失敗しました');
      return false;
    }
  };

  /**
   * ⚔️ 遭遇・戦闘AI
   */
  const startEncounterAI = (
    currentLocation: BaseLocation,
    activeCharacters: TRPGCharacter[],
    instruction?: string
  ): boolean => {
    return startAIInteraction(
      { 
        situation: 'encounter', 
        instruction: instruction || '現在の遭遇状況を処理してください',
        autoContext: true 
      },
      { 
        currentLocation, 
        activeCharacters,
        timeOfDay: new Date().getHours() >= 6 && new Date().getHours() < 18 ? 'morning' : 'night'
      }
    );
  };

  /**
   * 💬 NPC会話AI
   */
  const startConversationAI = (
    currentLocation: BaseLocation,
    npcName: string,
    activeCharacters: TRPGCharacter[],
    instruction?: string
  ): boolean => {
    return startAIInteraction(
      { 
        situation: 'conversation', 
        npcName,
        instruction: instruction || `${npcName}との会話を開始してください`,
        autoContext: true 
      },
      { 
        currentLocation, 
        activeCharacters 
      }
    );
  };

  /**
   * 🔍 探索AI
   */
  const startExplorationAI = (
    currentLocation: BaseLocation,
    activeCharacters: TRPGCharacter[],
    instruction?: string
  ): boolean => {
    return startAIInteraction(
      { 
        situation: 'exploration', 
        instruction: instruction || '現在の場所の探索を支援してください',
        autoContext: true 
      },
      { 
        currentLocation, 
        activeCharacters 
      }
    );
  };

  /**
   * 🎮 汎用セッションAI
   */
  const startGeneralSessionAI = (
    instruction: string,
    contextOptions?: WorldContextOptions
  ): boolean => {
    return startAIInteraction(
      { 
        situation: 'general', 
        instruction,
        autoContext: true 
      },
      contextOptions
    );
  };

  /**
   * 🔄 コンテキストのみ生成（テスト用）
   */
  const generateContext = (
    situation: 'encounter' | 'conversation' | 'exploration' | 'general',
    contextOptions?: WorldContextOptions,
    additionalInfo?: any
  ): string => {
    if (!currentCampaign) {
      return 'キャンペーンが選択されていません';
    }

    const contextBuilder = new WorldContextBuilder(currentCampaign);

    if (contextOptions?.currentLocation) {
      contextBuilder.setCurrentLocation(contextOptions.currentLocation);
    }
    if (contextOptions?.activeCharacters) {
      contextBuilder.setActiveCharacters(contextOptions.activeCharacters);
    }
    if (contextOptions?.timeOfDay) {
      contextBuilder.setTimeOfDay(contextOptions.timeOfDay);
    }
    if (contextOptions?.sessionDay) {
      contextBuilder.setSessionDay(contextOptions.sessionDay);
    }

    return contextBuilder.buildContextForSituation(situation, additionalInfo);
  };

  return {
    startAIInteraction,
    startEncounterAI,
    startConversationAI,
    startExplorationAI,
    startGeneralSessionAI,
    generateContext,
  };
};

// ヘルパー関数

/**
 * 状況別タイトル生成
 */
function getSituationTitle(situation: string): string {
  switch (situation) {
    case 'encounter':
      return '⚔️ 遭遇・戦闘AI';
    case 'conversation':
      return '💬 NPC会話AI';
    case 'exploration':
      return '🔍 探索AI';
    case 'general':
    default:
      return '🎮 セッションAI';
  }
}

/**
 * 状況別説明生成
 */
function getSituationDescription(situation: string): string {
  switch (situation) {
    case 'encounter':
      return '現在の場所と状況に基づいて、遭遇や戦闘を処理します。キャラクターの能力や環境要因を考慮した適切な判定を提供します。';
    case 'conversation':
      return 'NPCとの会話を自然に進行させます。その場所の文化的特徴やNPCの性格を反映した対話を生成します。';
    case 'exploration':
      return '現在の場所の詳細な探索を支援します。隠された要素や発見可能な情報を提示し、適切な判定を要求します。';
    case 'general':
    default:
      return 'セッション全般を通して、世界観とキャラクター情報を考慮した適切なGM応答を提供します。';
  }
}

/**
 * 状況別ページコンテキスト決定
 */
function getPageContextForSituation(situation: string): any {
  switch (situation) {
    case 'encounter':
      return 'encounter-processing';
    case 'conversation':
      return 'npc-interaction';
    case 'exploration':
      return 'session-gm';
    case 'general':
    default:
      return 'session-gm';
  }
}

/**
 * AI応答後処理
 */
async function handleAIResponse(
  situation: string,
  result: any,
  contextOptions?: WorldContextOptions
): Promise<void> {
  console.log(`🎯 AI応答処理 (${situation}):`, result);

  // 状況別の後処理
  switch (situation) {
    case 'encounter':
      // 遭遇結果の処理（HP更新、状態変更等）
      console.log('⚔️ 遭遇結果を処理中...');
      break;
      
    case 'conversation':
      // 会話結果の処理（関係性変更、情報取得等）
      console.log('💬 会話結果を処理中...');
      break;
      
    case 'exploration':
      // 探索結果の処理（アイテム発見、秘密発見等）
      console.log('🔍 探索結果を処理中...');
      break;
      
    case 'general':
      // 汎用結果の処理
      console.log('🎮 セッション結果を処理中...');
      break;
  }

  // 共通後処理（必要に応じて）
  // - セッションログの保存
  // - キャラクター状態の更新
  // - タイムライン進行
}

export default useWorldContextAI;