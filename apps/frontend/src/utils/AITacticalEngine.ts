// @ts-nocheck
import { TRPGCharacter, TRPGEnemy, TRPGNpc, BaseLocation, TimelineEvent } from '@trpg-ai-gm/types';

export interface EncounterContext {
  location: BaseLocation;
  timeOfDay: string;
  weather?: string;
  playerCharacters: TRPGCharacter[];
  enemies?: TRPGEnemy[];
  npcs?: TRPGNpc[];
  currentEvent?: TimelineEvent;
  partyStatus: {
    averageHP: number;
    resources: number;
    morale: number;
  };
}

export interface TacticalDecision {
  action: 'ambush' | 'trap' | 'dialogue' | 'combat' | 'escape' | 'negotiate';
  priority: 'critical' | 'high' | 'medium' | 'low';
  diceCheck?: {
    type: string; // e.g., "perception", "reflex", "diplomacy"
    dice: string; // e.g., "d20+3"
    difficulty: number;
    reason: string;
    skillName: string;
  };
  consequences: {
    success: string;
    failure: string;
  };
}

export interface EnemyBehaviorPattern {
  type: 'aggressive' | 'defensive' | 'cunning' | 'territorial' | 'predatory';
  preferredTactics: string[];
  fleeThreshold: number; // HP percentage
  groupTactics: boolean;
  specialAbilities?: string[];
}

export class AITacticalEngine {
  /**
   * 遭遇状況を分析し、最適な戦術的判断を返す
   */
  analyzeEncounterContext(context: EncounterContext): TacticalDecision {
    // 敵の存在を確認
    if (!context.enemies || context.enemies.length === 0) {
      return this.createNonCombatDecision(context);
    }

    // 敵の総合戦力を評価
    const enemyPower = this.calculateEnemyPower(context.enemies);
    const partyPower = this.calculatePartyPower(context.playerCharacters);
    const powerRatio = enemyPower / partyPower;

    // 環境要因を考慮
    const environmentalAdvantage = this.calculateEnvironmentalAdvantage(context);

    // 戦術的判断
    if (powerRatio > 2.0 && environmentalAdvantage < 0) {
      // 圧倒的に不利な状況
      return this.createEscapeDecision(context);
    } else if (powerRatio > 1.5 || environmentalAdvantage > 0.5) {
      // 敵有利または環境的に有利
      return this.createAmbushDecision(context);
    } else if (context.location.features?.includes('traps')) {
      // 罠が存在する場所
      return this.createTrapDecision(context);
    } else {
      // 通常の戦闘
      return this.createCombatDecision(context);
    }
  }

  /**
   * 最適なダイスチェックを選択
   */
  selectOptimalDiceCheck(
    context: EncounterContext,
    decision: TacticalDecision
  ): { dice: string; difficulty: number; skillName: string; reason: string } {
    const party = context.playerCharacters;
    
    switch (decision.action) {
      case 'ambush':
        // 知覚判定 - パーティーの平均知恵修正値を考慮
        const avgWisdom = this.calculateAverageAttribute(party, 'wisdom');
        return {
          dice: `d20+${avgWisdom}`,
          difficulty: 15 + Math.floor(context.enemies?.length || 0 / 2),
          skillName: '知覚',
          reason: '待ち伏せに気づくための判定'
        };

      case 'trap':
        // 反射判定 - パーティーの平均敏捷修正値を考慮
        const avgDexterity = this.calculateAverageAttribute(party, 'dexterity');
        return {
          dice: `d20+${avgDexterity}`,
          difficulty: 12 + Math.floor(Math.random() * 4),
          skillName: '反射神経',
          reason: '罠を回避するための判定'
        };

      case 'negotiate':
        // 交渉判定 - パーティーの最高魅力修正値を考慮
        const maxCharisma = this.calculateMaxAttribute(party, 'charisma');
        return {
          dice: `d20+${maxCharisma}`,
          difficulty: 10 + (context.enemies?.[0]?.stats?.intelligence || 10),
          skillName: '交渉',
          reason: '敵との交渉を試みる判定'
        };

      default:
        // イニシアチブ判定
        const avgInit = this.calculateAverageAttribute(party, 'initiative');
        return {
          dice: `d20+${avgInit}`,
          difficulty: 10,
          skillName: 'イニシアチブ',
          reason: '戦闘開始時の行動順判定'
        };
    }
  }

  /**
   * 難易度クラスを動的に計算
   */
  calculateDifficultyClass(
    baseDD: number,
    context: EncounterContext,
    modifiers: { 
      environment?: number;
      enemyIntelligence?: number;
      partyCondition?: number;
    } = {}
  ): number {
    let dc = baseDD;

    // 環境による修正
    if (modifiers.environment) {
      dc += modifiers.environment;
    }

    // 敵の知能による修正
    if (context.enemies && context.enemies.length > 0) {
      const avgIntelligence = context.enemies.reduce(
        (sum, enemy) => sum + (enemy.stats?.intelligence || 10), 0
      ) / context.enemies.length;
      dc += Math.floor((avgIntelligence - 10) / 2);
    }

    // パーティーの状態による修正
    if (context.partyStatus.averageHP < 50) {
      dc += 2;
    }
    if (context.partyStatus.morale < 30) {
      dc += 1;
    }

    return Math.max(5, Math.min(30, dc)); // DC は 5-30 の範囲
  }

  /**
   * 判定結果に基づく結果を決定
   */
  determineConsequences(
    result: number,
    dc: number,
    decision: TacticalDecision
  ): { outcome: 'critical_success' | 'success' | 'failure' | 'critical_failure'; description: string } {
    const margin = result - dc;

    if (result === 20 || margin >= 10) {
      return {
        outcome: 'critical_success',
        description: this.getCriticalSuccessDescription(decision)
      };
    } else if (margin >= 0) {
      return {
        outcome: 'success',
        description: decision.consequences.success
      };
    } else if (result === 1 || margin <= -10) {
      return {
        outcome: 'critical_failure',
        description: this.getCriticalFailureDescription(decision)
      };
    } else {
      return {
        outcome: 'failure',
        description: decision.consequences.failure
      };
    }
  }

  /**
   * エネミーの行動パターンを決定
   */
  determineEnemyBehavior(enemy: TRPGEnemy, context: EncounterContext): EnemyBehaviorPattern {
    // エネミーのタイプに基づいて行動パターンを決定
    const type = enemy.type || 'monster';
    const intelligence = enemy.stats?.intelligence || 10;
    const currentHPRatio = (enemy.stats?.hp || 1) / (enemy.stats?.maxHp || 1);

    if (type === 'undead' || type === 'construct') {
      return {
        type: 'aggressive',
        preferredTactics: ['charge', 'overwhelm', 'relentless_assault'],
        fleeThreshold: 0, // 決して逃げない
        groupTactics: false,
        specialAbilities: enemy.abilities
      };
    } else if (intelligence >= 14) {
      return {
        type: 'cunning',
        preferredTactics: ['ambush', 'hit_and_run', 'use_environment', 'target_weakness'],
        fleeThreshold: 0.3,
        groupTactics: true,
        specialAbilities: enemy.abilities
      };
    } else if (type === 'beast' || type === 'animal') {
      return {
        type: currentHPRatio > 0.5 ? 'territorial' : 'defensive',
        preferredTactics: ['protect_territory', 'pack_tactics', 'flee_when_wounded'],
        fleeThreshold: 0.4,
        groupTactics: enemy.name.toLowerCase().includes('pack') || enemy.name.toLowerCase().includes('群'),
        specialAbilities: enemy.abilities
      };
    } else {
      return {
        type: 'aggressive',
        preferredTactics: ['frontal_assault', 'focus_fire', 'use_abilities'],
        fleeThreshold: 0.2,
        groupTactics: context.enemies && context.enemies.length > 1,
        specialAbilities: enemy.abilities
      };
    }
  }

  // Private helper methods
  private calculateEnemyPower(enemies: TRPGEnemy[]): number {
    return enemies.reduce((total, enemy) => {
      const cr = enemy.challengeRating || 1;
      const hp = enemy.stats?.hp || 10;
      const attack = enemy.stats?.attack || 0;
      return total + (cr * 10 + hp + attack * 5);
    }, 0);
  }

  private calculatePartyPower(party: TRPGCharacter[]): number {
    return party.reduce((total, character) => {
      const level = character.level || 1;
      const hp = character.stats?.hp || 10;
      const mainStat = Math.max(
        character.stats?.strength || 0,
        character.stats?.dexterity || 0,
        character.stats?.intelligence || 0
      );
      return total + (level * 15 + hp + mainStat * 3);
    }, 0);
  }

  private calculateEnvironmentalAdvantage(context: EncounterContext): number {
    let advantage = 0;

    // 時間帯による修正
    if (context.timeOfDay === 'night' || context.timeOfDay === '夜') {
      advantage -= 0.2; // 夜は不利
    }

    // 天候による修正
    if (context.weather && ['rain', 'storm', '雨', '嵐'].includes(context.weather)) {
      advantage -= 0.3;
    }

    // 場所の特徴による修正
    if (context.location.features) {
      if (context.location.features.includes('defensive_position')) {
        advantage += 0.5;
      }
      if (context.location.features.includes('narrow_passage')) {
        advantage += 0.3;
      }
      if (context.location.features.includes('open_field')) {
        advantage -= 0.2;
      }
    }

    return advantage;
  }

  private calculateAverageAttribute(party: TRPGCharacter[], attribute: string): number {
    const values = party.map(char => {
      switch(attribute) {
        case 'wisdom': return Math.floor(((char.stats?.wisdom || 10) - 10) / 2);
        case 'dexterity': return Math.floor(((char.stats?.dexterity || 10) - 10) / 2);
        case 'initiative': return Math.floor(((char.stats?.dexterity || 10) - 10) / 2);
        default: return 0;
      }
    });
    return Math.floor(values.reduce((a, b) => a + b, 0) / values.length);
  }

  private calculateMaxAttribute(party: TRPGCharacter[], attribute: string): number {
    const values = party.map(char => {
      switch(attribute) {
        case 'charisma': return Math.floor(((char.stats?.charisma || 10) - 10) / 2);
        default: return 0;
      }
    });
    return Math.max(...values);
  }

  private createAmbushDecision(context: EncounterContext): TacticalDecision {
    return {
      action: 'ambush',
      priority: 'critical',
      diceCheck: {
        type: 'perception',
        dice: 'd20',
        difficulty: 15,
        reason: '敵の待ち伏せに気づくかどうかの判定',
        skillName: '知覚'
      },
      consequences: {
        success: '待ち伏せに気づき、奇襲を回避できた！',
        failure: '敵の奇襲を受け、最初のラウンドで行動できない！'
      }
    };
  }

  private createTrapDecision(context: EncounterContext): TacticalDecision {
    return {
      action: 'trap',
      priority: 'high',
      diceCheck: {
        type: 'reflex',
        dice: 'd20',
        difficulty: 14,
        reason: '罠を回避するための判定',
        skillName: '反射神経'
      },
      consequences: {
        success: '素早く罠を回避した！',
        failure: '罠が発動し、ダメージを受ける！'
      }
    };
  }

  private createCombatDecision(context: EncounterContext): TacticalDecision {
    return {
      action: 'combat',
      priority: 'high',
      diceCheck: {
        type: 'initiative',
        dice: 'd20',
        difficulty: 10,
        reason: '戦闘の主導権を握るための判定',
        skillName: 'イニシアチブ'
      },
      consequences: {
        success: '素早く行動し、有利な位置を確保した！',
        failure: '敵に先制され、防御的な立場に追い込まれた！'
      }
    };
  }

  private createEscapeDecision(context: EncounterContext): TacticalDecision {
    return {
      action: 'escape',
      priority: 'critical',
      diceCheck: {
        type: 'athletics',
        dice: 'd20',
        difficulty: 16,
        reason: '敵から逃走するための判定',
        skillName: '運動'
      },
      consequences: {
        success: '無事に逃走に成功した！',
        failure: '逃走に失敗し、不利な状況で戦闘を強いられる！'
      }
    };
  }

  private createNonCombatDecision(context: EncounterContext): TacticalDecision {
    if (context.npcs && context.npcs.length > 0) {
      return {
        action: 'dialogue',
        priority: 'medium',
        consequences: {
          success: 'NPCとの対話が始まった',
          failure: 'NPCが警戒心を強めた'
        }
      };
    }

    return {
      action: 'negotiate',
      priority: 'low',
      consequences: {
        success: '探索を続ける',
        failure: '何も起こらなかった'
      }
    };
  }

  private getCriticalSuccessDescription(decision: TacticalDecision): string {
    switch (decision.action) {
      case 'ambush':
        return '敵の待ち伏せを完全に見破り、逆に奇襲をかけるチャンスを得た！';
      case 'trap':
        return '罠を完璧に回避し、さらに罠を敵に対して利用できる！';
      case 'combat':
        return '完璧なタイミングで行動を開始し、最初の攻撃で大きなアドバンテージを得た！';
      case 'escape':
        return '見事な逃走で敵を完全に撒き、安全な場所まで到達した！';
      default:
        return '予想を超える大成功を収めた！';
    }
  }

  private getCriticalFailureDescription(decision: TacticalDecision): string {
    switch (decision.action) {
      case 'ambush':
        return '完全に不意を突かれ、混乱状態に陥った！最初の2ラウンド行動不能！';
      case 'trap':
        return '罠に完全にかかり、重大なダメージを受けた上に移動不能になった！';
      case 'combat':
        return '致命的な判断ミスにより、極めて不利な状況で戦闘が始まった！';
      case 'escape':
        return '逃走に大失敗し、敵に包囲されてしまった！';
      default:
        return '最悪の結果となってしまった！';
    }
  }
}

// エクスポート用のシングルトンインスタンス
export const aiTacticalEngine = new AITacticalEngine();