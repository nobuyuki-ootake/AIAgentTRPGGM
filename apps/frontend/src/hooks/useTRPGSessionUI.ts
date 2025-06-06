import { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { useRecoilState, useRecoilValue } from 'recoil';
import { v4 as uuidv4 } from 'uuid';
import { currentCampaignState, developerModeState } from '../store/atoms';
import { useAIChatIntegration } from './useAIChatIntegration';
import { useTRPGSession } from './useTRPGSession';
import { ChatMessage } from '../components/trpg-session/ChatInterface';
import { SkillCheckResult } from '../components/trpg-session/SkillCheckUI';
import { PowerCheckResult } from '../components/trpg-session/PowerCheckUI';
import { 
  loadTestCampaignData, 
  applyTestDataToLocalStorage,
  clearTestData 
} from '../utils/testDataLoader';
import { createTrulyEmptyCampaign } from '../utils/emptyCampaignDefaults';
import { EnemyCharacter } from '@trpg-ai-gm/types';

// UI状態の管理
interface TRPGSessionUIState {
  // ダイアログ状態
  diceDialog: boolean;
  skillCheckDialog: boolean;
  powerCheckDialog: boolean;
  aiDiceDialog: boolean;
  
  // タブ状態
  tabValue: number;
  rightPanelTab: number;
  
  // チャット状態
  chatInput: string;
  chatMessages: ChatMessage[];
  
  // ダイス結果状態
  lastDiceResult: {
    result: number;
    notation: string;
    details: string;
  } | null;
  
  // その他UI状態
  selectedEnemies: string[];
  isSessionStarted: boolean;
  lockedCharacterId: string | null;
  aiRequiredDice: any;
  
  // 戦闘・難易度状態
  currentCombatSession: any;
  combatSessions: any[];
  currentDifficulty: any;
  recentCombatActions: any[];
  
  // デバッグパネル状態
  showDebugPanel: boolean;
}

// ビジネスロジックとUIの統合フック
export const useTRPGSessionUI = () => {
  const [currentCampaign, setCurrentCampaign] = useRecoilState(currentCampaignState);
  const developerMode = useRecoilValue(developerModeState);
  const { openAIAssist } = useAIChatIntegration();
  
  // TRPGセッションのコアロジック
  const sessionHookData = useTRPGSession();
  const {
    sessionState,
    sessionMessages,
    selectedCharacter,
    setSelectedCharacter,
    currentDay,
    actionCount,
    maxActionsPerDay,
    currentLocation,
    setCurrentLocation,
    combatMode,
    aiDiceRequest,
    initializeSession,
    getAvailableActions,
    executeAction,
    advanceDay,
    saveSession,
    processDiceResult,
  } = sessionHookData;

  // UI状態の初期化
  const [uiState, setUIState] = useState<TRPGSessionUIState>({
    diceDialog: false,
    skillCheckDialog: false,
    powerCheckDialog: false,
    aiDiceDialog: false,
    tabValue: 0,
    rightPanelTab: 0,
    chatInput: "",
    chatMessages: [],
    lastDiceResult: null,
    selectedEnemies: [],
    isSessionStarted: false,
    lockedCharacterId: null,
    aiRequiredDice: null,
    currentCombatSession: null,
    combatSessions: [],
    currentDifficulty: null,
    recentCombatActions: [],
    showDebugPanel: false,
  });

  // データ取得（計算プロパティ）
  const playerCharacters = currentCampaign?.characters?.filter(c => c.characterType === "PC") || [];
  const npcs = currentCampaign?.npcs || [];
  const enemies = currentCampaign?.enemies || [];
  const bases = currentCampaign?.bases || [];
  
  // 利用可能なアクション
  const [availableActions, setAvailableActions] = useState<any[]>([]);
  
  useEffect(() => {
    try {
      const actions = getAvailableActions ? getAvailableActions() : [];
      setAvailableActions(actions);
    } catch (error) {
      console.error('getAvailableActions error:', error);
      setAvailableActions([]);
    }
  }, [currentCampaign, selectedCharacter]); // 具体的な依存関係のみ

  // 現在の拠点情報を取得
  const getCurrentBase = useCallback(() => {
    return bases.find(base => base.name === currentLocation);
  }, [bases, currentLocation]);

  // 現在の拠点のイラストURL取得
  const currentBaseImage = bases.find(base => base.name === currentLocation)?.imageUrl || 
    currentCampaign?.imageUrl || "/default-location.jpg";

  // テストデータ初期化フラグ
  const hasInitializedRef = useRef(false);
  
  // 空のキャンペーンの自動作成（一度だけ実行）
  useEffect(() => {
    if (!currentCampaign && !hasInitializedRef.current) {
      console.log('🔄 TRPGSessionPage: キャンペーンデータがありません。空のキャンペーンを作成中...');
      hasInitializedRef.current = true;
      
      // 完全に空のキャンペーンを作成
      const emptyCampaign = createTrulyEmptyCampaign("新しいTRPGキャンペーン");
      setCurrentCampaign(emptyCampaign);
      
      // 空のキャンペーンでは現在地を設定しない
      // setCurrentLocation("未設定");
      
      console.log('✅ TRPGSessionPage: 空のキャンペーンを作成しました');
    }
  }, [currentCampaign]); // currentCampaignの変化のみを監視

  // AI制御ダイスリクエストの監視
  useEffect(() => {
    if (aiDiceRequest) {
      const diceSpec = {
        dice: aiDiceRequest.dice,
        reason: aiDiceRequest.reason,
        difficulty: aiDiceRequest.difficulty,
        characterId: aiDiceRequest.characterId,
        skillName: aiDiceRequest.skillName,
        modifier: 0
      };
      setUIState(prev => ({
        ...prev,
        aiRequiredDice: diceSpec,
        aiDiceDialog: true
      }));
    }
  }, [aiDiceRequest]);

  // セッション自動開始（依存配列を最小化）
  useEffect(() => {
    if (currentCampaign && !uiState.isSessionStarted) {
      console.log('🎮 TRPGSessionPage: セッション自動開始');
      setUIState(prev => ({ ...prev, isSessionStarted: true }));
      if (initializeSession) {
        initializeSession();
      }
    }
  }, [currentCampaign?.id]); // より具体的な依存関係

  // ===== UI アクションハンドラー =====

  // ダイアログ管理
  const handleOpenDialog = useCallback((dialogType: keyof Pick<TRPGSessionUIState, 'diceDialog' | 'skillCheckDialog' | 'powerCheckDialog'>) => {
    setUIState(prev => ({ ...prev, [dialogType]: true }));
  }, []);

  const handleCloseDialog = useCallback((dialogType: keyof Pick<TRPGSessionUIState, 'diceDialog' | 'skillCheckDialog' | 'powerCheckDialog' | 'aiDiceDialog'>) => {
    setUIState(prev => ({ ...prev, [dialogType]: false }));
  }, []);

  // タブ変更
  const handleTabChange = useCallback((tabType: 'tabValue' | 'rightPanelTab', value: number) => {
    setUIState(prev => ({ ...prev, [tabType]: value }));
  }, []);

  // チャット関連
  const handleChatInputChange = useCallback((value: string) => {
    setUIState(prev => ({ ...prev, chatInput: value }));
  }, []);

  const handleSendMessage = useCallback(() => {
    if (uiState.chatInput.trim()) {
      const newMessage: ChatMessage = {
        id: uuidv4(),
        sender: selectedCharacter?.name || "プレイヤー",
        senderType: "player",
        message: uiState.chatInput,
        timestamp: new Date()
      };
      setUIState(prev => ({
        ...prev,
        chatMessages: [...prev.chatMessages, newMessage],
        chatInput: ""
      }));
    }
  }, [uiState.chatInput, selectedCharacter]);

  const handleAddSystemMessage = useCallback((message: string) => {
    const systemMessage: ChatMessage = {
      id: uuidv4(),
      sender: "システム",
      senderType: "system",
      message,
      timestamp: new Date()
    };
    setUIState(prev => ({
      ...prev,
      chatMessages: [...prev.chatMessages, systemMessage]
    }));
  }, []);

  // ダイス結果処理
  const handleDiceRoll = useCallback((result: any) => {
    console.log('Dice rolled:', result);
    setUIState(prev => ({
      ...prev,
      lastDiceResult: {
        result: result.total,
        notation: result.dice,
        details: `ロール結果: ${result.rolls.join(', ')} | 合計: ${result.total} | 目的: ${result.purpose}`
      },
      diceDialog: false
    }));
  }, []);

  const handleSkillCheckResult = useCallback((result: SkillCheckResult) => {
    console.log('Skill check result:', result);
    setUIState(prev => ({
      ...prev,
      lastDiceResult: {
        result: result.total,
        notation: `${result.skillName} 判定`,
        details: `${result.skillName}: ${result.total} (${result.success ? '成功' : '失敗'})`
      },
      skillCheckDialog: false
    }));
  }, []);

  const handlePowerCheckResult = useCallback((result: PowerCheckResult) => {
    console.log('Power check result:', result);
    setUIState(prev => ({
      ...prev,
      lastDiceResult: {
        result: result.total,
        notation: `${result.powerName} 判定`,
        details: `${result.powerName}: ${result.total} (${result.success ? '成功' : '失敗'})`
      },
      powerCheckDialog: false
    }));
  }, []);

  const handleAIDiceRoll = useCallback((result: any) => {
    processDiceResult(result);
    setUIState(prev => ({ ...prev, aiDiceDialog: false }));
  }, [processDiceResult]);

  // 拠点インタラクション
  const handleFacilityInteract = useCallback((facility: any) => {
    console.log('Facility interaction:', facility);
  }, []);

  // ===== デバッグアクション =====

  // デバッグパネルの表示/非表示切り替え
  const toggleDebugPanel = useCallback(() => {
    setUIState(prev => ({ ...prev, showDebugPanel: !prev.showDebugPanel }));
  }, []);

  // デバッグアクションの実装
  const debugActions = useMemo(() => ({
    checkEncounters: () => {
      console.log('[Debug] 遭遇チェック実行');
      handleAddSystemMessage('🔍 遭遇チェックを実行しました');
      
      // 基本的な遭遇判定ロジック（シンプル版）
      const encounterChance = Math.random();
      if (encounterChance < 0.3) {
        const encounterTypes = ['NPC', 'エネミー', 'イベント'];
        const encounterType = encounterTypes[Math.floor(Math.random() * encounterTypes.length)];
        handleAddSystemMessage(`⚡ ${encounterType}との遭遇が発生しました！`);
      } else {
        handleAddSystemMessage('✅ 遭遇はありませんでした');
      }
    },
    
    simulateEnemyMovement: () => {
      console.log('[Debug] エネミー移動シミュレーション実行');
      handleAddSystemMessage('🗡️ エネミーの移動をシミュレーションしました');
      
      // エネミーの位置更新シミュレーション
      enemies.forEach(enemy => {
        const locations = bases.map(base => base.name);
        if (locations.length > 0) {
          const newLocation = locations[Math.floor(Math.random() * locations.length)];
          console.log(`[Debug] ${enemy.name} が ${newLocation} に移動`);
        }
      });
    },
    
    reloadTestData: async () => {
      console.log('[Debug] テストデータリロード開始');
      try {
        // 既存データクリア
        clearTestData();
        setUIState(prev => ({
          ...prev,
          isSessionStarted: false,
          lockedCharacterId: null,
        }));
        
        // セッション状態リセット
        if (setSelectedCharacter) {
          setSelectedCharacter(null);
        }
        
        // JSONから再ロード
        setTimeout(() => {
          applyTestDataToLocalStorage();
          const newTestData = loadTestCampaignData();
          
          const processedTestData = {
            ...newTestData,
            bases: newTestData.worldBuilding?.bases || [],
          };
          
          setCurrentCampaign(processedTestData);
          
          // 最初のPCキャラクターを自動選択
          if (processedTestData.characters?.length > 0) {
            const firstPC = processedTestData.characters.find(c => c.characterType === "PC");
            if (firstPC && setSelectedCharacter) {
              setSelectedCharacter(firstPC);
            }
          }
          
          // 最初の拠点を設定
          if (processedTestData.bases.length > 0) {
            setCurrentLocation(processedTestData.bases[0].name);
          }
          
          console.log('[Debug] テストデータリロード完了', processedTestData);
          handleAddSystemMessage('🔄 テストデータをJSONから再ロードしました');
        }, 100);
        
      } catch (error) {
        console.error('[Debug] テストデータリロードエラー:', error);
        handleAddSystemMessage('❌ テストデータのリロードに失敗しました');
      }
    },
    
    loadEmptyCampaign: () => {
      console.log('[Debug] 空のキャンペーン作成開始');
      try {
        // 既存データクリア
        clearTestData();
        setUIState(prev => ({
          ...prev,
          isSessionStarted: false,
          lockedCharacterId: null,
          chatMessages: []
        }));
        
        // セッション状態リセット
        if (setSelectedCharacter) {
          setSelectedCharacter(null);
        }
        
        // 完全に空のキャンペーンを作成
        const emptyCampaign = createTrulyEmptyCampaign("新しいTRPGキャンペーン");
        setCurrentCampaign(emptyCampaign);
        
        // 空のキャンペーンでは現在地を設定しない
        // setCurrentLocation("未設定");
        
        console.log('[Debug] 空のキャンペーン作成完了', emptyCampaign);
        handleAddSystemMessage('🆕 新しい空のキャンペーンを作成しました');
        
      } catch (error) {
        console.error('[Debug] 空のキャンペーン作成エラー:', error);
        handleAddSystemMessage('❌ 空のキャンペーンの作成に失敗しました');
      }
    },
    
    exportDebugLog: () => {
      const debugInfo = {
        timestamp: new Date().toISOString(),
        sessionData: {
          currentCampaign: currentCampaign?.name || 'なし',
          selectedCharacter: selectedCharacter?.name || 'なし',
          currentLocation,
          currentDay,
          actionCount,
          maxActionsPerDay,
          isSessionStarted: uiState.isSessionStarted,
        },
        characters: {
          pcs: playerCharacters.length,
          npcs: npcs.length,
          enemies: enemies.length,
        },
        uiState: {
          tabValue: uiState.tabValue,
          rightPanelTab: uiState.rightPanelTab,
          combatMode,
        },
        chatMessages: uiState.chatMessages.length,
        lastDiceResult: uiState.lastDiceResult,
      };
      
      console.log('=== TRPGセッション デバッグ情報 ===');
      console.log(debugInfo);
      console.log('==============================');
      
      handleAddSystemMessage('🖨️ デバッグログをコンソールに出力しました');
      return debugInfo;
    },
    
  }), [
    handleAddSystemMessage, 
    enemies, 
    bases, 
    setCurrentCampaign, 
    setSelectedCharacter, 
    setCurrentLocation,
    currentCampaign,
    selectedCharacter,
    currentLocation,
    currentDay,
    actionCount,
    maxActionsPerDay,
    uiState,
    playerCharacters,
    npcs,
    combatMode
  ]);

  return {
    // セッションデータ
    currentCampaign,
    developerMode,
    selectedCharacter,
    setSelectedCharacter,
    currentDay,
    actionCount,
    maxActionsPerDay,
    currentLocation,
    combatMode,
    playerCharacters,
    npcs,
    enemies,
    bases,
    availableActions,
    getCurrentBase,
    currentBaseImage,
    
    // UI状態
    uiState,
    
    // セッションアクション
    executeAction,
    advanceDay,
    saveSession,
    openAIAssist,
    
    // UIアクションハンドラー
    handleOpenDialog,
    handleCloseDialog,
    handleTabChange,
    handleChatInputChange,
    handleSendMessage,
    handleAddSystemMessage,
    handleDiceRoll,
    handleSkillCheckResult,
    handlePowerCheckResult,
    handleAIDiceRoll,
    handleFacilityInteract,
    
    // デバッグ機能
    toggleDebugPanel,
    debugActions,
  };
};