import { TRPGCharacter, StormbringerCharacter } from '@trpg-ai-gm/types';

/**
 * 🎮 ゲームシステム固有のステータス管理システム
 * 
 * 各TRPGシステムに応じたキャラクターステータス、能力、
 * スキル、装備、状態管理を統一的に処理するシステム
 */

export interface GameSystemConfig {
  id: string;
  name: string;
  primaryAttributes: string[];
  derivedStats: string[];
  skillSystem: 'percentage' | 'rank' | 'modifier' | 'pool';
  healthSystem: 'hp' | 'wounds' | 'conditions' | 'stress';
  magicSystem?: 'slots' | 'points' | 'fatigue' | 'none';
  defaultDice: string;
  levelingSystem: 'xp' | 'milestone' | 'session' | 'none';
}

export interface UnifiedCharacterStats {
  // 基本能力値
  attributes: { [key: string]: number };
  
  // 派生ステータス
  derivedStats: { [key: string]: number };
  
  // スキル
  skills: { [key: string]: number };
  
  // 健康状態
  health: {
    current: number;
    maximum: number;
    temporary?: number;
    wounds?: string[];
    conditions?: string[];
  };
  
  // 魔法/超能力
  magic?: {
    current: number;
    maximum: number;
    spells?: string[];
    powers?: string[];
  };
  
  // 装備
  equipment: {
    weapons: EquipmentItem[];
    armor: EquipmentItem[];
    items: EquipmentItem[];
  };
  
  // レベル/経験
  progression: {
    level?: number;
    experience?: number;
    nextLevelXp?: number;
  };
  
  // システム固有データ
  systemSpecific: any;
}

export interface EquipmentItem {
  id: string;
  name: string;
  type: string;
  equipped: boolean;
  properties: { [key: string]: any };
  description?: string;
}

/**
 * 🎯 ゲームシステム設定定義
 */
export const GAME_SYSTEM_CONFIGS: { [key: string]: GameSystemConfig } = {
  'dnd5e': {
    id: 'dnd5e',
    name: 'D&D 5th Edition',
    primaryAttributes: ['STR', 'DEX', 'CON', 'INT', 'WIS', 'CHA'],
    derivedStats: ['HP', 'AC', 'Initiative', 'Speed', 'ProficiencyBonus'],
    skillSystem: 'modifier',
    healthSystem: 'hp',
    magicSystem: 'slots',
    defaultDice: 'd20',
    levelingSystem: 'xp',
  },
  
  'pathfinder': {
    id: 'pathfinder',
    name: 'Pathfinder',
    primaryAttributes: ['STR', 'DEX', 'CON', 'INT', 'WIS', 'CHA'],
    derivedStats: ['HP', 'AC', 'Initiative', 'CMB', 'CMD'],
    skillSystem: 'rank',
    healthSystem: 'hp',
    magicSystem: 'slots',
    defaultDice: 'd20',
    levelingSystem: 'xp',
  },
  
  'stormbringer': {
    id: 'stormbringer',
    name: 'Stormbringer/Elric!',
    primaryAttributes: ['STR', 'CON', 'SIZ', 'INT', 'POW', 'DEX', 'CHA'],
    derivedStats: ['HP', 'MP', 'Fatigue', 'HitPoints'],
    skillSystem: 'percentage',
    healthSystem: 'wounds',
    magicSystem: 'fatigue',
    defaultDice: 'd100',
    levelingSystem: 'session',
  },
  
  'cthulhu': {
    id: 'cthulhu',
    name: 'Call of Cthulhu',
    primaryAttributes: ['STR', 'CON', 'SIZ', 'DEX', 'APP', 'INT', 'POW', 'EDU'],
    derivedStats: ['HP', 'MP', 'SAN', 'Luck'],
    skillSystem: 'percentage',
    healthSystem: 'hp',
    magicSystem: 'points',
    defaultDice: 'd100',
    levelingSystem: 'session',
  },
  
  'shadowrun': {
    id: 'shadowrun',
    name: 'Shadowrun',
    primaryAttributes: ['BOD', 'AGI', 'REA', 'STR', 'CHA', 'INT', 'LOG', 'WIL'],
    derivedStats: ['Initiative', 'PhysicalLimit', 'MentalLimit', 'SocialLimit'],
    skillSystem: 'pool',
    healthSystem: 'conditions',
    magicSystem: 'none',
    defaultDice: '6d6',
    levelingSystem: 'none',
  }
};

/**
 * 🔄 ゲームシステム管理クラス
 */
export class GameSystemManager {
  private systemId: string;
  private config: GameSystemConfig;
  
  constructor(systemId: string) {
    this.systemId = systemId;
    this.config = GAME_SYSTEM_CONFIGS[systemId];
    if (!this.config) {
      throw new Error(`未対応のゲームシステム: ${systemId}`);
    }
  }

  /**
   * 🏗️ 新規キャラクター用のデフォルトステータスを生成
   */
  generateDefaultStats(): UnifiedCharacterStats {
    const attributes: { [key: string]: number } = {};
    const derivedStats: { [key: string]: number } = {};
    const skills: { [key: string]: number } = {};

    // 基本能力値の初期化
    this.config.primaryAttributes.forEach(attr => {
      switch (this.systemId) {
        case 'dnd5e':
        case 'pathfinder':
          attributes[attr] = 10; // 標準値
          break;
        case 'stormbringer':
        case 'cthulhu':
          attributes[attr] = 50; // パーセンタイル基準
          break;
        case 'shadowrun':
          attributes[attr] = 1; // 最低値
          break;
        default:
          attributes[attr] = 10;
      }
    });

    // 派生ステータスの計算
    this.config.derivedStats.forEach(stat => {
      derivedStats[stat] = this.calculateDerivedStat(stat, attributes);
    });

    // 基本スキルの初期化
    const basicSkills = this.getBasicSkills();
    basicSkills.forEach(skill => {
      skills[skill] = this.getSkillDefaultValue();
    });

    return {
      attributes,
      derivedStats,
      skills,
      health: {
        current: derivedStats['HP'] || 10,
        maximum: derivedStats['HP'] || 10,
      },
      magic: this.config.magicSystem !== 'none' ? {
        current: derivedStats['MP'] || 0,
        maximum: derivedStats['MP'] || 0,
      } : undefined,
      equipment: {
        weapons: [],
        armor: [],
        items: [],
      },
      progression: {
        level: 1,
        experience: 0,
        nextLevelXp: this.getNextLevelXp(1),
      },
      systemSpecific: {},
    };
  }

  /**
   * 📊 派生ステータスを計算
   */
  calculateDerivedStat(statName: string, attributes: { [key: string]: number }): number {
    switch (this.systemId) {
      case 'dnd5e':
        return this.calculateDnD5eDerivedStat(statName, attributes);
      case 'stormbringer':
        return this.calculateStormbringerDerivedStat(statName, attributes);
      case 'cthulhu':
        return this.calculateCthulhuDerivedStat(statName, attributes);
      case 'shadowrun':
        return this.calculateShadowrunDerivedStat(statName, attributes);
      default:
        return 10;
    }
  }

  /**
   * 🎯 D&D 5e 派生ステータス計算
   */
  private calculateDnD5eDerivedStat(statName: string, attributes: { [key: string]: number }): number {
    switch (statName) {
      case 'HP':
        return Math.max(1, this.getModifier(attributes.CON) + 8); // レベル1ファイター基準
      case 'AC':
        return 10 + this.getModifier(attributes.DEX); // 基本AC
      case 'Initiative':
        return this.getModifier(attributes.DEX);
      case 'Speed':
        return 30; // 人間標準
      case 'ProficiencyBonus':
        return 2; // レベル1-4
      default:
        return 0;
    }
  }

  /**
   * ⚡ Stormbringer 派生ステータス計算
   */
  private calculateStormbringerDerivedStat(statName: string, attributes: { [key: string]: number }): number {
    switch (statName) {
      case 'HP':
        return Math.ceil((attributes.CON + attributes.SIZ) / 2);
      case 'MP':
        return attributes.POW;
      case 'Fatigue':
        return attributes.CON + attributes.STR;
      default:
        return 0;
    }
  }

  /**
   * 🐙 Call of Cthulhu 派生ステータス計算
   */
  private calculateCthulhuDerivedStat(statName: string, attributes: { [key: string]: number }): number {
    switch (statName) {
      case 'HP':
        return Math.ceil((attributes.CON + attributes.SIZ) / 10);
      case 'MP':
        return Math.ceil(attributes.POW / 5);
      case 'SAN':
        return attributes.POW;
      case 'Luck':
        return Math.floor(Math.random() * 100) + 1; // ランダム
      default:
        return 0;
    }
  }

  /**
   * 🌆 Shadowrun 派生ステータス計算
   */
  private calculateShadowrunDerivedStat(statName: string, attributes: { [key: string]: number }): number {
    switch (statName) {
      case 'Initiative':
        return (attributes.REA || 1) + (attributes.INT || 1);
      case 'PhysicalLimit':
        return Math.ceil(((attributes.STR || 1) * 2 + (attributes.BOD || 1) + (attributes.REA || 1)) / 3);
      case 'MentalLimit':
        return Math.ceil(((attributes.LOG || 1) * 2 + (attributes.INT || 1) + (attributes.WIL || 1)) / 3);
      case 'SocialLimit':
        return Math.ceil(((attributes.CHA || 1) * 2 + (attributes.WIL || 1) + (attributes.INT || 1)) / 3);
      default:
        return 1;
    }
  }

  /**
   * 🎯 能力値修正値取得（D&D系）
   */
  private getModifier(abilityScore: number): number {
    return Math.floor((abilityScore - 10) / 2);
  }

  /**
   * 📚 基本スキルリストを取得
   */
  getBasicSkills(): string[] {
    switch (this.systemId) {
      case 'dnd5e':
        return [
          'Acrobatics', 'Animal Handling', 'Arcana', 'Athletics', 'Deception',
          'History', 'Insight', 'Intimidation', 'Investigation', 'Medicine',
          'Nature', 'Perception', 'Performance', 'Persuasion', 'Religion',
          'Sleight of Hand', 'Stealth', 'Survival'
        ];
      case 'stormbringer':
        return [
          'Agility', 'Communication', 'Knowledge', 'Manipulation',
          'Perception', 'Stealth', 'Magic', 'Weapons'
        ];
      case 'cthulhu':
        return [
          'Anthropology', 'Appraise', 'Archaeology', 'Art/Craft', 'Charm',
          'Climb', 'Credit Rating', 'Cthulhu Mythos', 'Disguise', 'Dodge',
          'Drive Auto', 'Electrical Repair', 'Fast Talk', 'Fighting',
          'Firearms', 'First Aid', 'History', 'Intimidate', 'Jump',
          'Language', 'Law', 'Library Use', 'Listen', 'Locksmith',
          'Mechanical Repair', 'Medicine', 'Natural World', 'Navigate',
          'Occult', 'Operate Heavy Machinery', 'Other Language', 'Own Language',
          'Persuade', 'Pilot', 'Psychology', 'Psychoanalysis', 'Ride',
          'Science', 'Sleight of Hand', 'Spot Hidden', 'Stealth', 'Survival',
          'Swim', 'Throw', 'Track', 'Use Computer'
        ];
      default:
        return [];
    }
  }

  /**
   * 🎯 スキルのデフォルト値取得
   */
  getSkillDefaultValue(): number {
    switch (this.config.skillSystem) {
      case 'percentage':
        return this.systemId === 'stormbringer' ? 15 : 5; // Stormbringerは15%、CoCthuluは5%
      case 'modifier':
        return 0;
      case 'rank':
        return 0;
      case 'pool':
        return 1;
      default:
        return 0;
    }
  }

  /**
   * 📈 次レベル必要経験値取得
   */
  getNextLevelXp(currentLevel: number): number {
    switch (this.systemId) {
      case 'dnd5e':
        // D&D 5e XP表
        const dnd5eXpTable = [0, 300, 900, 2700, 6500, 14000, 23000, 34000, 48000, 64000];
        return dnd5eXpTable[currentLevel] || currentLevel * 10000;
      case 'pathfinder':
        // Pathfinder (medium progression)
        return currentLevel * 1000;
      default:
        return 0; // セッションベースやXPなしのシステム
    }
  }

  /**
   * 🔄 既存キャラクターをシステム形式に変換
   */
  convertCharacterToSystem(character: TRPGCharacter): UnifiedCharacterStats {
    // Stormbringerキャラクターの場合
    if (character.characterType === 'PC' && character.stormbringerStats) {
      return this.convertStormbringerCharacter(character);
    }

    // その他のシステムは汎用変換
    return this.generateDefaultStats();
  }

  /**
   * ⚡ Stormbringerキャラクターの変換
   */
  private convertStormbringerCharacter(character: TRPGCharacter): UnifiedCharacterStats {
    const stats = character.stormbringerStats!;
    
    const attributes = {
      STR: stats.strength,
      CON: stats.constitution,
      SIZ: stats.size,
      INT: stats.intelligence,
      POW: stats.power,
      DEX: stats.dexterity,
      CHA: stats.charisma,
    };

    const derivedStats = {
      HP: stats.hitPoints,
      MP: stats.magicPoints,
      Fatigue: stats.fatigue,
    };

    // スキルの変換
    const skills: { [key: string]: number } = {};
    Object.values(stats.skills).flat().forEach(skill => {
      skills[skill.name] = skill.value;
    });

    return {
      attributes,
      derivedStats,
      skills,
      health: {
        current: stats.hitPoints,
        maximum: stats.hitPoints,
        wounds: [], // Stormbringerは負傷システム
      },
      magic: {
        current: stats.magicPoints,
        maximum: stats.magicPoints,
      },
      equipment: {
        weapons: character.equipment?.filter(eq => eq.type === 'weapon').map(eq => ({
          id: eq.id,
          name: eq.name,
          type: eq.type,
          equipped: eq.equipped || false,
          properties: { damage: eq.damage, range: eq.range },
          description: eq.description,
        })) || [],
        armor: character.equipment?.filter(eq => eq.type === 'armor').map(eq => ({
          id: eq.id,
          name: eq.name,
          type: eq.type,
          equipped: eq.equipped || false,
          properties: { armorClass: eq.armorClass },
          description: eq.description,
        })) || [],
        items: character.equipment?.filter(eq => !['weapon', 'armor'].includes(eq.type)).map(eq => ({
          id: eq.id,
          name: eq.name,
          type: eq.type,
          equipped: eq.equipped || false,
          properties: {},
          description: eq.description,
        })) || [],
      },
      progression: {
        level: 1,
        experience: 0,
      },
      systemSpecific: {
        originalStormbringerStats: stats,
      },
    };
  }

  /**
   * 🎲 ステータス判定用のダイス修正値を計算
   */
  getStatModifier(statName: string, unifiedStats: UnifiedCharacterStats): number {
    const statValue = unifiedStats.attributes[statName] || 0;
    
    switch (this.config.skillSystem) {
      case 'modifier':
        return this.getModifier(statValue);
      case 'percentage':
        return 0; // パーセンタイルシステムは修正値なし
      case 'pool':
        return statValue; // プールシステムはそのまま
      default:
        return 0;
    }
  }

  /**
   * 💾 統合ステータスをキャラクターオブジェクトに保存
   */
  saveToCharacter(character: TRPGCharacter, unifiedStats: UnifiedCharacterStats): TRPGCharacter {
    // システム固有フィールドに保存
    return {
      ...character,
      systemStats: {
        [this.systemId]: unifiedStats,
      },
    };
  }
}

export default GameSystemManager;