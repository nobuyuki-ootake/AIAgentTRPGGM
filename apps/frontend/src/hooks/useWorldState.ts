import { useState, useEffect, useCallback } from 'react';
import { TRPGCampaign, BaseLocation } from '@trpg-ai-gm/types';

interface WorldState {
  global: {
    stability: number;
    economy: number;
    magicLevel: number;
    politicalTension: number;
    naturalBalance: number;
  };
  regions: {
    [regionId: string]: {
      prosperity: number;
      security: number;
      population: number;
      reputation: number;
      influence: number;
    };
  };
  factions: {
    [factionId: string]: {
      power: number;
      relations: { [otherFactionId: string]: number };
      resources: number;
      territory: number;
      morale: number;
    };
  };
  locations: {
    [locationId: string]: {
      condition: number;
      accessibility: number;
      dangerLevel: number;
      resources: number;
      population: number;
    };
  };
  trends: {
    attribute: string;
    direction: "rising" | "falling" | "stable";
    speed: "slow" | "moderate" | "fast";
    prediction: string;
  }[];
}

interface WorldStateChange {
  id: string;
  timestamp: Date;
  eventId: string;
  eventName: string;
  eventType: "quest_completion" | "combat_result" | "social_interaction" | "exploration" | "political_action" | "economic_action" | "natural_disaster" | "magical_event";
  affectedAreas: {
    type: "global" | "regional" | "local";
    locationIds: string[];
    factionIds: string[];
  };
  changes: {
    attribute: string;
    oldValue: number;
    newValue: number;
    changeType: "increase" | "decrease" | "set";
    permanence: "temporary" | "permanent" | "seasonal";
    duration?: number;
  }[];
  consequences: {
    immediate: string[];
    longTerm: string[];
    cascading: string[];
  };
  playerInfluence: number;
  aiGenerated: boolean;
  description: string;
  severity: "minor" | "moderate" | "major" | "critical";
}

interface UseWorldStateReturn {
  worldState: WorldState;
  stateHistory: WorldStateChange[];
  isLoading: boolean;
  error: string | null;
  
  // Actions
  initializeState: (campaign: TRPGCampaign, locations: BaseLocation[]) => void;
  applyEventResult: (eventResult: any) => void;
  simulateTimeProgression: (days: number) => void;
  revertToState: (changeId: string) => void;
  exportWorldState: () => string;
  importWorldState: (stateData: string) => boolean;
  
  // Queries
  getLocationState: (locationId: string) => any;
  getRegionState: (regionId: string) => any;
  getGlobalTrends: () => any[];
  predictFutureState: (days: number) => WorldState;
  
  // Utilities
  calculateStateHealth: () => { overall: number; criticalAreas: string[] };
  generateStateReport: () => string;
}

export const useWorldState = (): UseWorldStateReturn => {
  const [worldState, setWorldState] = useState<WorldState>({
    global: {
      stability: 75,
      economy: 60,
      magicLevel: 50,
      politicalTension: 30,
      naturalBalance: 80,
    },
    regions: {},
    factions: {},
    locations: {},
    trends: [],
  });

  const [stateHistory, setStateHistory] = useState<WorldStateChange[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // 状態の初期化
  const initializeState = useCallback((campaign: TRPGCampaign, locations: BaseLocation[]) => {
    setIsLoading(true);
    try {
      const newState: WorldState = {
        global: {
          stability: 75,
          economy: 60,
          magicLevel: 50,
          politicalTension: 30,
          naturalBalance: 80,
        },
        regions: {},
        factions: {},
        locations: {},
        trends: [],
      };

      // 場所ごとの状態初期化
      locations.forEach(location => {
        newState.locations[location.id] = {
          condition: 75,
          accessibility: 80,
          dangerLevel: location.importance === "主要拠点" ? 60 : 30,
          resources: 70,
          population: location.type === "city" ? 90 : location.type === "town" ? 60 : 20,
        };

        // 地域レベルの集約
        if (!newState.regions[location.region]) {
          newState.regions[location.region] = {
            prosperity: 70,
            security: 75,
            population: 50,
            reputation: 60,
            influence: 50,
          };
        }
      });

      setWorldState(newState);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : '状態の初期化に失敗しました');
    } finally {
      setIsLoading(false);
    }
  }, []);

  // イベント結果の適用
  const applyEventResult = useCallback((eventResult: {
    eventId: string;
    eventName: string;
    eventType: WorldStateChange["eventType"];
    success: boolean;
    playerActions: string[];
    consequences: string[];
    affectedLocations: string[];
  }) => {
    try {
      const change: WorldStateChange = {
        id: `change-${Date.now()}`,
        timestamp: new Date(),
        eventId: eventResult.eventId,
        eventName: eventResult.eventName,
        eventType: eventResult.eventType,
        affectedAreas: {
          type: "local",
          locationIds: eventResult.affectedLocations,
          factionIds: [],
        },
        changes: [],
        consequences: {
          immediate: eventResult.consequences,
          longTerm: [],
          cascading: [],
        },
        playerInfluence: calculatePlayerInfluence(eventResult.playerActions),
        aiGenerated: false,
        description: generateChangeDescription(eventResult),
        severity: determineSeverity(eventResult),
      };

      // 状態変化を計算
      const stateChanges = calculateStateChanges(eventResult, worldState);
      change.changes = stateChanges;

      // 長期効果と連鎖効果を予測
      change.consequences.longTerm = predictLongTermEffects(change);
      change.consequences.cascading = predictCascadingEffects(change);

      // 世界状態を更新
      const newState = applyChangesToWorldState(worldState, change);
      setWorldState(newState);
      setStateHistory(prev => [...prev, change].slice(-100)); // 最新100件を保持

    } catch (err) {
      setError(err instanceof Error ? err.message : 'イベント結果の適用に失敗しました');
    }
  }, [worldState]);

  // 時間経過のシミュレーション
  const simulateTimeProgression = useCallback((days: number) => {
    setIsLoading(true);
    try {
      const change: WorldStateChange = {
        id: `time-${Date.now()}`,
        timestamp: new Date(),
        eventId: 'time_progression',
        eventName: `${days}日間の時間経過`,
        eventType: 'natural_disaster',
        affectedAreas: {
          type: 'global',
          locationIds: [],
          factionIds: [],
        },
        changes: generateTimeProgressionChanges(worldState, days),
        consequences: {
          immediate: [`${days}日間の自然な変化`],
          longTerm: ['長期的な世界の発展'],
          cascading: [],
        },
        playerInfluence: 0,
        aiGenerated: true,
        description: `時間の経過による自然な世界状態の変化（${days}日）`,
        severity: days > 30 ? 'moderate' : 'minor',
      };

      const newState = applyChangesToWorldState(worldState, change);
      setWorldState(newState);
      setStateHistory(prev => [...prev, change]);
    } catch (err) {
      setError(err instanceof Error ? err.message : '時間経過のシミュレーションに失敗しました');
    } finally {
      setIsLoading(false);
    }
  }, [worldState]);

  // 状態の復元
  const revertToState = useCallback((changeId: string) => {
    const targetIndex = stateHistory.findIndex(change => change.id === changeId);
    if (targetIndex === -1) {
      setError('指定された状態が見つかりません');
      return;
    }

    // 指定された変更以降をロールバック
    const revertedHistory = stateHistory.slice(0, targetIndex);
    setStateHistory(revertedHistory);
    
    // 状態を再計算
    // 実際の実装では、初期状態から順番に変更を適用し直す
    setError('状態の復元機能は今後実装予定です');
  }, [stateHistory]);

  // エクスポート
  const exportWorldState = useCallback(() => {
    return JSON.stringify({
      worldState,
      stateHistory,
      exportedAt: new Date().toISOString(),
    }, null, 2);
  }, [worldState, stateHistory]);

  // インポート
  const importWorldState = useCallback((stateData: string) => {
    try {
      const parsed = JSON.parse(stateData);
      if (parsed.worldState && parsed.stateHistory) {
        setWorldState(parsed.worldState);
        setStateHistory(parsed.stateHistory);
        return true;
      }
      return false;
    } catch {
      setError('状態データの形式が正しくありません');
      return false;
    }
  }, []);

  // 場所の状態取得
  const getLocationState = useCallback((locationId: string) => {
    return worldState.locations[locationId] || null;
  }, [worldState]);

  // 地域の状態取得
  const getRegionState = useCallback((regionId: string) => {
    return worldState.regions[regionId] || null;
  }, [worldState]);

  // グローバルトレンド取得
  const getGlobalTrends = useCallback(() => {
    return worldState.trends;
  }, [worldState]);

  // 未来状態の予測
  const predictFutureState = useCallback((days: number): WorldState => {
    // 現在のトレンドを基に未来状態を予測
    const predictedState = { ...worldState };
    
    // 簡単な線形予測（実際はより複雑なアルゴリズムを使用）
    Object.keys(predictedState.global).forEach(key => {
      const currentValue = (predictedState.global as any)[key];
      const trend = worldState.trends.find(t => t.attribute === `global.${key}`);
      
      if (trend) {
        let change = 0;
        const baseChange = days * 0.1; // 基本変化量
        
        switch (trend.direction) {
          case 'rising':
            change = baseChange * (trend.speed === 'fast' ? 2 : trend.speed === 'moderate' ? 1 : 0.5);
            break;
          case 'falling':
            change = -baseChange * (trend.speed === 'fast' ? 2 : trend.speed === 'moderate' ? 1 : 0.5);
            break;
          default:
            change = 0;
        }
        
        (predictedState.global as any)[key] = Math.max(0, Math.min(100, currentValue + change));
      }
    });

    return predictedState;
  }, [worldState]);

  // 状態の健全性計算
  const calculateStateHealth = useCallback(() => {
    const global = worldState.global;
    const scores = Object.values(global);
    const overall = scores.reduce((sum, score) => sum + score, 0) / scores.length;
    
    const criticalAreas = Object.entries(global)
      .filter(([, value]) => value < 30)
      .map(([key]) => key);

    return { overall, criticalAreas };
  }, [worldState]);

  // 状態レポート生成
  const generateStateReport = useCallback(() => {
    const health = calculateStateHealth();
    const recentChanges = stateHistory.slice(-5);
    
    let report = `世界状態レポート\n`;
    report += `生成日時: ${new Date().toLocaleString()}\n\n`;
    report += `全体的健全性: ${health.overall.toFixed(1)}%\n`;
    
    if (health.criticalAreas.length > 0) {
      report += `警告エリア: ${health.criticalAreas.join(', ')}\n`;
    }
    
    report += `\n最近の変化:\n`;
    recentChanges.forEach(change => {
      report += `- ${change.eventName} (${change.severity})\n`;
    });

    return report;
  }, [worldState, stateHistory, calculateStateHealth]);

  // ヘルパー関数群
  const calculatePlayerInfluence = (actions: string[]): number => {
    let influence = 0;
    actions.forEach(action => {
      if (action.includes("決定的")) influence += 30;
      else if (action.includes("重要")) influence += 20;
      else if (action.includes("支援")) influence += 15;
      else influence += 10;
    });
    return Math.min(100, influence);
  };

  const determineSeverity = (eventResult: any): WorldStateChange["severity"] => {
    const affectedCount = eventResult.affectedLocations.length;
    const consequenceCount = eventResult.consequences.length;
    
    if (affectedCount >= 3 || consequenceCount >= 5) return "critical";
    if (affectedCount >= 2 || consequenceCount >= 3) return "major";
    if (affectedCount >= 1 || consequenceCount >= 2) return "moderate";
    return "minor";
  };

  const generateChangeDescription = (eventResult: any): string => {
    const location = eventResult.affectedLocations[0] || "不明な場所";
    const success = eventResult.success ? "成功" : "失敗";
    
    return `${eventResult.eventName}の${success}により、${location}を中心とした地域に影響が発生。`;
  };

  const calculateStateChanges = (eventResult: any, currentState: WorldState) => {
    const changes: WorldStateChange["changes"] = [];
    
    switch (eventResult.eventType) {
      case "quest_completion":
        if (eventResult.success) {
          changes.push({
            attribute: "global.stability",
            oldValue: currentState.global.stability,
            newValue: Math.min(100, currentState.global.stability + 5),
            changeType: "increase",
            permanence: "permanent",
          });
        }
        break;
        
      case "combat_result":
        changes.push({
          attribute: "global.stability",
          oldValue: currentState.global.stability,
          newValue: eventResult.success ? 
            Math.min(100, currentState.global.stability + 3) :
            Math.max(0, currentState.global.stability - 5),
          changeType: eventResult.success ? "increase" : "decrease",
          permanence: "temporary",
          duration: 7,
        });
        break;
        
      case "economic_action":
        changes.push({
          attribute: "global.economy",
          oldValue: currentState.global.economy,
          newValue: eventResult.success ?
            Math.min(100, currentState.global.economy + 10) :
            Math.max(0, currentState.global.economy - 8),
          changeType: eventResult.success ? "increase" : "decrease",
          permanence: "permanent",
        });
        break;
    }

    return changes;
  };

  const predictLongTermEffects = (change: WorldStateChange): string[] => {
    const effects: string[] = [];
    
    change.changes.forEach(ch => {
      if (ch.attribute === "global.stability") {
        if (ch.changeType === "increase") {
          effects.push("治安の改善により貿易が活性化");
          effects.push("新たな入植者の流入");
        } else {
          effects.push("不安定化により税収が減少");
          effects.push("周辺地域への不安の拡散");
        }
      }
    });

    return effects.slice(0, 3);
  };

  const predictCascadingEffects = (change: WorldStateChange): string[] => {
    const effects: string[] = [];
    
    if (change.severity === "critical" || change.severity === "major") {
      effects.push("周辺地域への影響波及");
      effects.push("政治的バランスの変化");
    }
    
    if (change.playerInfluence > 70) {
      effects.push("プレイヤーの評判変化");
      effects.push("NPCの態度変化");
    }

    return effects;
  };

  const applyChangesToWorldState = (currentState: WorldState, change: WorldStateChange): WorldState => {
    const newState = JSON.parse(JSON.stringify(currentState)); // Deep clone
    
    change.changes.forEach(ch => {
      const [category, attribute] = ch.attribute.split(".");
      
      if (category === "global" && (newState.global as any)[attribute] !== undefined) {
        (newState.global as any)[attribute] = ch.newValue;
      }
      // 他のカテゴリも必要に応じて実装
    });

    return newState;
  };

  const generateTimeProgressionChanges = (currentState: WorldState, days: number) => {
    const changes: WorldStateChange["changes"] = [];
    
    // 時間経過による自然な変化
    Object.keys(currentState.global).forEach(key => {
      const currentValue = (currentState.global as any)[key];
      const randomChange = (Math.random() - 0.5) * (days / 10); // 日数に応じた変化
      const newValue = Math.max(0, Math.min(100, currentValue + randomChange));
      
      if (Math.abs(newValue - currentValue) > 0.5) {
        changes.push({
          attribute: `global.${key}`,
          oldValue: currentValue,
          newValue,
          changeType: newValue > currentValue ? "increase" : "decrease",
          permanence: "temporary",
          duration: days,
        });
      }
    });

    return changes;
  };

  return {
    worldState,
    stateHistory,
    isLoading,
    error,
    
    initializeState,
    applyEventResult,
    simulateTimeProgression,
    revertToState,
    exportWorldState,
    importWorldState,
    
    getLocationState,
    getRegionState,
    getGlobalTrends,
    predictFutureState,
    
    calculateStateHealth,
    generateStateReport,
  };
};