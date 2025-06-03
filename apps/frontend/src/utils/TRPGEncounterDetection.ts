import { TRPGCharacter, TRPGNpc, TRPGEnemy, TimelineEvent, BaseLocation } from '@trpg-ai-gm/types';

export interface EncounterContext {
  location: BaseLocation;
  time: { day: number; timeOfDay: 'morning' | 'afternoon' | 'evening' | 'night' };
  playerCharacters: TRPGCharacter[];
  npcs: TRPGNpc[];
  enemies: TRPGEnemy[];
  events: TimelineEvent[];
}

export interface EncounterInfo {
  type: 'combat' | 'social' | 'trap' | 'event';
  participants: Array<TRPGCharacter | TRPGNpc | TRPGEnemy>;
  location: BaseLocation;
  triggerConditions: string[];
  priority: 'high' | 'medium' | 'low';
  aiRecommendedAction?: string;
}

export interface DiceSpecification {
  dice: string;
  modifier?: number;
  reason: string;
  difficulty?: number;
  characterId?: string;
  skillName?: string;
}

export interface AITacticalJudgment {
  encounterType: string;
  requiredCheck: DiceSpecification;
  possibleOutcomes: {
    success: string;
    failure: string;
    criticalSuccess?: string;
    criticalFailure?: string;
  };
  tacticalAdvice?: string;
}

export const trpgEncounterDetection = {
  /**
   * 空間的衝突をチェック - 同じ場所にいるキャラクター/エネミーを検出
   */
  checkSpatialCollision(context: EncounterContext): EncounterInfo[] {
    const encounters: EncounterInfo[] = [];
    const { location, playerCharacters, npcs, enemies } = context;

    // 同じ場所にいるエネミーとの遭遇チェック
    const enemiesAtLocation = enemies.filter(enemy => 
      enemy.locationId === location.id || 
      enemy.patrolLocations?.includes(location.id)
    );

    if (enemiesAtLocation.length > 0 && playerCharacters.length > 0) {
      encounters.push({
        type: 'combat',
        participants: [...playerCharacters, ...enemiesAtLocation],
        location,
        triggerConditions: ['同一位置での接触', '敵性存在の確認'],
        priority: 'high',
        aiRecommendedAction: '戦闘遭遇の可能性。知覚判定を要求。',
      });
    }

    // NPCとの遭遇チェック
    const npcsAtLocation = npcs.filter(npc => 
      npc.locationId === location.id ||
      npc.frequentLocations?.includes(location.id)
    );

    if (npcsAtLocation.length > 0 && playerCharacters.length > 0) {
      encounters.push({
        type: 'social',
        participants: [...playerCharacters, ...npcsAtLocation],
        location,
        triggerConditions: ['NPC存在確認', '会話機会'],
        priority: 'medium',
      });
    }

    return encounters;
  },

  /**
   * 時間的重複をチェック - 特定の時間に発生するイベント
   */
  checkTemporalOverlap(context: EncounterContext): EncounterInfo[] {
    const encounters: EncounterInfo[] = [];
    const { time, events, location } = context;

    // 現在の時間と場所に該当するイベントを検索
    const activeEvents = events.filter(event => 
      event.sessionNumber === time.day &&
      (!event.locationId || event.locationId === location.id)
    );

    activeEvents.forEach(event => {
      if (event.type === 'combat') {
        encounters.push({
          type: 'combat',
          participants: [],
          location,
          triggerConditions: ['予定された戦闘イベント'],
          priority: 'high',
          aiRecommendedAction: '戦闘イベント発生。準備を促す。',
        });
      } else if (event.type === 'social') {
        encounters.push({
          type: 'social',
          participants: [],
          location,
          triggerConditions: ['予定された社交イベント'],
          priority: 'medium',
        });
      }
    });

    return encounters;
  },

  /**
   * サプライズ判定が必要かチェック
   */
  calculateSurpriseConditions(
    encounter: EncounterInfo,
    context: EncounterContext
  ): boolean {
    // 夜間の遭遇
    if (context.time.timeOfDay === 'night') {
      return true;
    }

    // 待ち伏せタイプのエネミー
    const ambushEnemies = encounter.participants.filter(
      p => 'tactics' in p && (p.tactics?.includes('ambush') || p.tactics?.includes('stealth'))
    );

    if (ambushEnemies.length > 0) {
      return true;
    }

    // 隠密性の高い場所（森、廃墟など）
    const stealthyLocations = ['forest', 'ruins', 'cave', 'dungeon'];
    if (stealthyLocations.some(type => context.location.type?.includes(type))) {
      return true;
    }

    return false;
  },

  /**
   * AI戦術判断を生成
   */
  generateTacticalJudgment(
    encounter: EncounterInfo,
    context: EncounterContext
  ): AITacticalJudgment {
    const needsSurprise = this.calculateSurpriseConditions(encounter, context);

    switch (encounter.type) {
      case 'combat':
        if (needsSurprise) {
          return {
            encounterType: '待ち伏せ遭遇',
            requiredCheck: {
              dice: 'd20',
              reason: '敵の待ち伏せに気づけるか判定します',
              difficulty: 15,
              skillName: '知覚',
            },
            possibleOutcomes: {
              success: '待ち伏せに気づき、通常通り戦闘を開始できます',
              failure: '敵に奇襲され、最初のラウンドで行動できません',
              criticalSuccess: '敵の位置を完全に把握し、逆に奇襲できます',
              criticalFailure: '完全に不意を突かれ、防御力-5で戦闘開始',
            },
            tacticalAdvice: '周囲に注意を払い、物音や気配に敏感になってください',
          };
        } else {
          return {
            encounterType: '通常戦闘遭遇',
            requiredCheck: {
              dice: 'd20',
              reason: 'イニシアチブ判定',
              skillName: '敏捷力',
            },
            possibleOutcomes: {
              success: '先制攻撃権を獲得',
              failure: '敵が先に行動',
            },
          };
        }

      case 'trap':
        return {
          encounterType: '罠発動',
          requiredCheck: {
            dice: 'd20',
            reason: '罠を回避できるか判定します',
            difficulty: context.location.dangerLevel ? 12 + context.location.dangerLevel : 14,
            skillName: '反射神経',
          },
          possibleOutcomes: {
            success: '罠を華麗に回避しました',
            failure: '罠が発動し、ダメージを受けます（2d6ダメージ）',
            criticalSuccess: '罠を完全に見切り、解除方法も理解しました',
            criticalFailure: '最悪のタイミングで罠にかかり、倍のダメージ（4d6）',
          },
          tacticalAdvice: '慎重に進み、床や壁の不自然な箇所に注意してください',
        };

      case 'social':
        return {
          encounterType: 'NPC遭遇',
          requiredCheck: {
            dice: 'd20',
            reason: '第一印象判定',
            difficulty: 10,
            skillName: '魅力',
          },
          possibleOutcomes: {
            success: 'NPCは友好的な態度を示します',
            failure: 'NPCは警戒心を持って接します',
            criticalSuccess: 'NPCは非常に好意的で、有益な情報を提供します',
          },
        };

      default:
        return {
          encounterType: 'イベント発生',
          requiredCheck: {
            dice: 'd20',
            reason: 'イベントへの対応',
          },
          possibleOutcomes: {
            success: 'イベントに適切に対応できました',
            failure: 'イベントへの対応に失敗しました',
          },
        };
    }
  },

  /**
   * 遭遇の優先度を計算
   */
  prioritizeEncounters(encounters: EncounterInfo[]): EncounterInfo[] {
    return encounters.sort((a, b) => {
      const priorityOrder = { high: 3, medium: 2, low: 1 };
      return priorityOrder[b.priority] - priorityOrder[a.priority];
    });
  },

  /**
   * 総合的な遭遇検出
   */
  detectEncounters(context: EncounterContext): {
    encounters: EncounterInfo[];
    immediateAction?: AITacticalJudgment;
  } {
    const spatialEncounters = this.checkSpatialCollision(context);
    const temporalEncounters = this.checkTemporalOverlap(context);
    
    const allEncounters = [...spatialEncounters, ...temporalEncounters];
    const prioritizedEncounters = this.prioritizeEncounters(allEncounters);

    let immediateAction: AITacticalJudgment | undefined;
    
    // 最優先の遭遇に対して戦術判断を生成
    if (prioritizedEncounters.length > 0 && prioritizedEncounters[0].priority === 'high') {
      immediateAction = this.generateTacticalJudgment(prioritizedEncounters[0], context);
    }

    return {
      encounters: prioritizedEncounters,
      immediateAction,
    };
  }
};