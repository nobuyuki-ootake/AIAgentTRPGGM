// @ts-nocheck
/**
 * 🎲 統合ダイス記法システム
 * 
 * 様々なTRPGシステムのダイス記法を統一的に扱うシステム
 * D&D 5e, Pathfinder, Stormbringer, Call of Cthulhu, Shadowrun等に対応
 */

export interface DiceRoll {
  notation: string;
  dice: DiceComponent[];
  modifier: number;
  description?: string;
}

export interface DiceComponent {
  count: number;
  sides: number;
  type: 'normal' | 'advantage' | 'disadvantage' | 'exploding' | 'pool';
}

export interface DiceResult {
  notation: string;
  rolls: number[][];
  total: number;
  individual: number[];
  success?: boolean;
  critical?: boolean;
  fumble?: boolean;
  modifierApplied: number;
  description: string;
  targetMet?: boolean;
}

export interface GameSystemDiceRules {
  id: string;
  name: string;
  notationPattern: RegExp;
  advantageSupport: boolean;
  explodingDice: boolean;
  successBasedSystem: boolean;
  criticalRange: number[];
  fumbleRange: number[];
  defaultDice: string;
  commonChecks: { [key: string]: string };
}

/**
 * 🎮 ゲームシステム別ダイスルール定義
 */
export const GAME_SYSTEM_RULES: { [key: string]: GameSystemDiceRules } = {
  'dnd5e': {
    id: 'dnd5e',
    name: 'D&D 5th Edition',
    notationPattern: /^(\d+)?d(\d+)([+-]\d+)?(adv|dis)?$/i,
    advantageSupport: true,
    explodingDice: false,
    successBasedSystem: false,
    criticalRange: [20],
    fumbleRange: [1],
    defaultDice: 'd20',
    commonChecks: {
      'ability': 'd20+modifier',
      'attack': 'd20+modifier',
      'damage': 'weapon+modifier',
      'save': 'd20+modifier',
      'skill': 'd20+modifier',
    }
  },
  
  'pathfinder': {
    id: 'pathfinder',
    name: 'Pathfinder',
    notationPattern: /^(\d+)?d(\d+)([+-]\d+)?$/i,
    advantageSupport: false,
    explodingDice: false,
    successBasedSystem: false,
    criticalRange: [20],
    fumbleRange: [1],
    defaultDice: 'd20',
    commonChecks: {
      'ability': 'd20+modifier',
      'attack': 'd20+modifier',
      'damage': 'weapon+modifier',
      'save': 'd20+modifier',
      'skill': 'd20+modifier',
    }
  },
  
  'stormbringer': {
    id: 'stormbringer',
    name: 'Stormbringer/Elric!',
    notationPattern: /^(\d+)?d(\d+)([+-]\d+)?$/i,
    advantageSupport: false,
    explodingDice: false,
    successBasedSystem: true,
    criticalRange: [1, 2, 3, 4, 5], // 01-05%
    fumbleRange: [96, 97, 98, 99, 100], // 96-00%
    defaultDice: 'd100',
    commonChecks: {
      'ability': 'd100',
      'skill': 'd100',
      'attack': 'd100',
      'power': 'd100',
      'resistance': 'd100',
    }
  },
  
  'cthulhu': {
    id: 'cthulhu',
    name: 'Call of Cthulhu',
    notationPattern: /^(\d+)?d(\d+)([+-]\d+)?$/i,
    advantageSupport: false,
    explodingDice: false,
    successBasedSystem: true,
    criticalRange: [1], // 01%
    fumbleRange: [100], // 00%
    defaultDice: 'd100',
    commonChecks: {
      'skill': 'd100',
      'sanity': 'd100',
      'luck': 'd100',
      'idea': 'd100',
      'know': 'd100',
    }
  },
  
  'shadowrun': {
    id: 'shadowrun',
    name: 'Shadowrun',
    notationPattern: /^(\d+)d6$/i,
    advantageSupport: false,
    explodingDice: true,
    successBasedSystem: true,
    criticalRange: [6], // Exploding 6s
    fumbleRange: [1], // Glitches
    defaultDice: '6d6',
    commonChecks: {
      'attribute': 'Xd6',
      'skill': 'Xd6',
      'soak': 'Xd6',
      'initiative': 'Xd6',
    }
  }
};

/**
 * 🎲 ダイス記法パーサー
 */
export class DiceNotationParser {
  
  /**
   * ダイス記法を解析
   */
  static parse(notation: string, gameSystem: string = 'dnd5e'): DiceRoll | null {
    const rules = GAME_SYSTEM_RULES[gameSystem];
    if (!rules) {
      console.error(`未対応のゲームシステム: ${gameSystem}`);
      return null;
    }

    // 基本的なダイス記法をパース
    const basicMatch = notation.match(/^(\d+)?d(\d+)([+-]\d+)?/i);
    if (!basicMatch) {
      return null;
    }

    const count = parseInt(basicMatch[1] || '1');
    const sides = parseInt(basicMatch[2]);
    const modifier = basicMatch[3] ? parseInt(basicMatch[3]) : 0;

    // 特殊記法のチェック
    let diceType: DiceComponent['type'] = 'normal';
    
    // D&D 5e のアドバンテージ/ディスアドバンテージ
    if (gameSystem === 'dnd5e') {
      if (notation.toLowerCase().includes('adv')) {
        diceType = 'advantage';
      } else if (notation.toLowerCase().includes('dis')) {
        diceType = 'disadvantage';
      }
    }

    // Shadowrun の爆発ダイス
    if (gameSystem === 'shadowrun') {
      diceType = 'exploding';
    }

    return {
      notation: notation,
      dice: [{
        count: count,
        sides: sides,
        type: diceType
      }],
      modifier: modifier,
      description: this.generateDescription(notation, gameSystem)
    };
  }

  /**
   * ダイスロール説明文生成
   */
  static generateDescription(notation: string, gameSystem: string): string {
    const rules = GAME_SYSTEM_RULES[gameSystem];
    
    switch (gameSystem) {
      case 'dnd5e':
        if (notation.toLowerCase().includes('adv')) {
          return 'アドバンテージ付きロール（2d20の高い方）';
        } else if (notation.toLowerCase().includes('dis')) {
          return 'ディスアドバンテージ付きロール（2d20の低い方）';
        }
        return '標準的なd20ロール';
        
      case 'stormbringer':
      case 'cthulhu':
        return 'パーセンタイルロール（目標値以下で成功）';
        
      case 'shadowrun':
        return 'ダイスプールロール（5以上で成功、6は爆発）';
        
      default:
        return `${notation}をロール`;
    }
  }
}

/**
 * 🎯 ダイスロール実行エンジン
 */
export class DiceRollEngine {
  
  /**
   * ダイスロールを実行
   */
  static roll(diceRoll: DiceRoll, gameSystem: string = 'dnd5e'): DiceResult {
    const rules = GAME_SYSTEM_RULES[gameSystem];
    const results: number[][] = [];
    let total = 0;
    const individual: number[] = [];

    // 各ダイスコンポーネントをロール
    for (const dice of diceRoll.dice) {
      const componentResults = this.rollDiceComponent(dice, rules);
      results.push(componentResults);
      individual.push(...componentResults);
    }

    // 合計値計算（システム別ロジック）
    total = this.calculateTotal(individual, diceRoll, rules);

    // 成功判定
    const success = this.evaluateSuccess(total, individual, rules);
    const critical = this.evaluateCritical(individual, rules);
    const fumble = this.evaluateFumble(individual, rules);

    return {
      notation: diceRoll.notation,
      rolls: results,
      total: total,
      individual: individual,
      success: success,
      critical: critical,
      fumble: fumble,
      modifierApplied: diceRoll.modifier,
      description: this.generateResultDescription(total, individual, rules, diceRoll)
    };
  }

  /**
   * 個別ダイスコンポーネントのロール
   */
  private static rollDiceComponent(dice: DiceComponent, rules: GameSystemDiceRules): number[] {
    const results: number[] = [];

    switch (dice.type) {
      case 'advantage': {
        // アドバンテージ：2回振って高い方
        const advRolls = [this.rollSingle(dice.sides), this.rollSingle(dice.sides)];
        results.push(Math.max(...advRolls));
        break;
      }
        
      case 'disadvantage': {
        // ディスアドバンテージ：2回振って低い方
        const disRolls = [this.rollSingle(dice.sides), this.rollSingle(dice.sides)];
        results.push(Math.min(...disRolls));
        break;
      }
        
      case 'exploding':
        // 爆発ダイス：最大値が出たら追加でロール
        for (let i = 0; i < dice.count; i++) {
          let roll = this.rollSingle(dice.sides);
          results.push(roll);
          
          // 爆発処理
          while (roll === dice.sides && rules.explodingDice) {
            roll = this.rollSingle(dice.sides);
            results.push(roll);
          }
        }
        break;
        
      case 'normal':
      default:
        // 通常ロール
        for (let i = 0; i < dice.count; i++) {
          results.push(this.rollSingle(dice.sides));
        }
        break;
    }

    return results;
  }

  /**
   * 単一ダイスロール
   */
  private static rollSingle(sides: number): number {
    return Math.floor(Math.random() * sides) + 1;
  }

  /**
   * 合計値計算
   */
  private static calculateTotal(individual: number[], diceRoll: DiceRoll, rules: GameSystemDiceRules): number {
    if (rules.successBasedSystem) {
      // 成功ベースシステム（Shadowrun等）
      if (rules.id === 'shadowrun') {
        return individual.filter(roll => roll >= 5).length; // 5以上で成功
      }
      // パーセンタイルシステム（Stormbringer, CoC等）
      return individual.reduce((sum, roll) => sum + roll, 0);
    }
    
    // 通常の合計値システム（D&D等）
    return individual.reduce((sum, roll) => sum + roll, 0) + diceRoll.modifier;
  }

  /**
   * 成功判定
   */
  private static evaluateSuccess(total: number, individual: number[], rules: GameSystemDiceRules): boolean | undefined {
    if (!rules.successBasedSystem) {
      return undefined; // 成功ベースでないシステムでは判定しない
    }

    if (rules.id === 'shadowrun') {
      return total > 0; // 1つでも成功があれば成功
    }

    // パーセンタイルシステムは目標値が必要なので、ここでは判定しない
    return undefined;
  }

  /**
   * クリティカル判定
   */
  private static evaluateCritical(individual: number[], rules: GameSystemDiceRules): boolean {
    return individual.some(roll => rules.criticalRange.includes(roll));
  }

  /**
   * ファンブル判定
   */
  private static evaluateFumble(individual: number[], rules: GameSystemDiceRules): boolean {
    return individual.some(roll => rules.fumbleRange.includes(roll));
  }

  /**
   * 結果説明文生成
   */
  private static generateResultDescription(
    total: number, 
    individual: number[], 
    rules: GameSystemDiceRules, 
    diceRoll: DiceRoll
  ): string {
    let description = `${diceRoll.notation}: `;
    
    if (individual.length === 1) {
      description += `${individual[0]}`;
    } else {
      description += `[${individual.join(', ')}]`;
    }
    
    if (diceRoll.modifier !== 0) {
      description += ` ${diceRoll.modifier >= 0 ? '+' : ''}${diceRoll.modifier}`;
    }
    
    description += ` = ${total}`;

    // システム固有の追加情報
    if (rules.id === 'shadowrun') {
      const successes = individual.filter(roll => roll >= 5).length;
      description += ` (成功数: ${successes})`;
    }

    return description;
  }
}

/**
 * 🎮 ゲームシステム統合インターフェース
 */
export class GameSystemDiceInterface {
  private gameSystem: string;
  
  constructor(gameSystem: string) {
    this.gameSystem = gameSystem;
  }

  /**
   * システム固有の推奨ダイスを取得
   */
  getRecommendedDice(): string[] {
    const rules = GAME_SYSTEM_RULES[this.gameSystem];
    if (!rules) return ['d20'];

    switch (this.gameSystem) {
      case 'dnd5e':
      case 'pathfinder':
        return ['d20', 'd20+modifier', 'd20 adv', 'd20 dis', 'd4', 'd6', 'd8', 'd10', 'd12'];
        
      case 'stormbringer':
      case 'cthulhu':
        return ['d100', 'd10', 'd8', 'd6', 'd4'];
        
      case 'shadowrun':
        return ['6d6', '8d6', '10d6', '12d6', '14d6'];
        
      default:
        return ['d20'];
    }
  }

  /**
   * システム固有の一般的な判定を取得
   */
  getCommonChecks(): { [key: string]: string } {
    const rules = GAME_SYSTEM_RULES[this.gameSystem];
    return rules ? rules.commonChecks : {};
  }

  /**
   * 目標値付きロール実行
   */
  rollWithTarget(notation: string, targetValue?: number): DiceResult & { targetMet?: boolean } {
    const diceRoll = DiceNotationParser.parse(notation, this.gameSystem);
    if (!diceRoll) {
      throw new Error(`無効なダイス記法: ${notation}`);
    }

    const result = DiceRollEngine.roll(diceRoll, this.gameSystem);
    
    if (targetValue !== undefined) {
      const rules = GAME_SYSTEM_RULES[this.gameSystem];
      
      let targetMet = false;
      if (rules.successBasedSystem) {
        // パーセンタイルシステム：目標値以下で成功
        if (rules.id === 'stormbringer' || rules.id === 'cthulhu') {
          targetMet = result.total <= targetValue;
        }
        // Shadowrun：成功数が目標値以上
        else if (rules.id === 'shadowrun') {
          targetMet = result.total >= targetValue;
        }
      } else {
        // D&Dなど：目標値以上で成功
        targetMet = result.total >= targetValue;
      }

      return { ...result, targetMet };
    }

    return result;
  }

  /**
   * バッチロール（複数のダイスを一度にロール）
   */
  batchRoll(notations: string[]): DiceResult[] {
    return notations.map(notation => {
      const diceRoll = DiceNotationParser.parse(notation, this.gameSystem);
      if (!diceRoll) {
        throw new Error(`無効なダイス記法: ${notation}`);
      }
      return DiceRollEngine.roll(diceRoll, this.gameSystem);
    });
  }
}

export default {
  DiceNotationParser,
  DiceRollEngine,
  GameSystemDiceInterface,
  GAME_SYSTEM_RULES
};