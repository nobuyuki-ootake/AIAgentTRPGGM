// @ts-nocheck
/**
 * 🔮 統合呪文・能力システム
 * 
 * 様々なTRPGシステムの魔法、超能力、特殊能力を
 * 統一的に管理するシステム
 */

export interface Spell {
  id: string;
  name: string;
  level: number;
  school?: string;
  castingTime: string;
  range: string;
  components: string[];
  duration: string;
  description: string;
  damage?: string;
  saveType?: string;
  saveDC?: number;
  prepared?: boolean;
  known?: boolean;
  systemSpecific?: any;
}

export interface Power {
  id: string;
  name: string;
  type: 'psionics' | 'supernatural' | 'special' | 'racial' | 'class';
  cost: number;
  activation: string;
  range: string;
  duration: string;
  description: string;
  prerequisites?: string[];
  cooldown?: number;
  lastUsed?: Date;
  usesPerDay?: number;
  usedToday?: number;
  systemSpecific?: any;
}

export interface SpellSlot {
  level: number;
  total: number;
  used: number;
}

export interface PowerPool {
  type: string;
  current: number;
  maximum: number;
  regeneration: string;
}

export interface MagicSystem {
  type: 'vancian' | 'point' | 'fatigue' | 'channel' | 'none';
  spellSlots?: SpellSlot[];
  powerPools?: PowerPool[];
  knownSpells: Spell[];
  preparedSpells?: Spell[];
  powers: Power[];
  casterLevel?: number;
  spellDC?: number;
  spellAttackBonus?: number;
}

/**
 * 🎮 ゲームシステム別魔法システム定義
 */
export const MAGIC_SYSTEM_CONFIGS = {
  'dnd5e': {
    type: 'vancian' as const,
    name: 'D&D 5e Spellcasting',
    hasSpellSlots: true,
    hasPowerPoints: false,
    maxSpellLevel: 9,
    cantripsScale: true,
    ritualCasting: true,
    spellSchools: [
      'Abjuration', 'Conjuration', 'Divination', 'Enchantment',
      'Evocation', 'Illusion', 'Necromancy', 'Transmutation'
    ],
    casterClasses: ['Wizard', 'Sorcerer', 'Cleric', 'Druid', 'Bard', 'Warlock', 'Ranger', 'Paladin'],
  },
  
  'pathfinder': {
    type: 'vancian' as const,
    name: 'Pathfinder Spellcasting',
    hasSpellSlots: true,
    hasPowerPoints: false,
    maxSpellLevel: 9,
    cantripsScale: false,
    ritualCasting: false,
    spellSchools: [
      'Abjuration', 'Conjuration', 'Divination', 'Enchantment',
      'Evocation', 'Illusion', 'Necromancy', 'Transmutation'
    ],
    casterClasses: ['Wizard', 'Sorcerer', 'Cleric', 'Druid', 'Bard', 'Oracle'],
  },
  
  'stormbringer': {
    type: 'fatigue' as const,
    name: 'Stormbringer Sorcery',
    hasSpellSlots: false,
    hasPowerPoints: false,
    usesFatigue: true,
    maxSpellLevel: 10,
    spellTypes: ['Sorcery', 'Elementalism', 'Runes', 'Summoning'],
    fatigueCost: true,
  },
  
  'cthulhu': {
    type: 'point' as const,
    name: 'Mythos Magic',
    hasSpellSlots: false,
    hasPowerPoints: true,
    usesSanity: true,
    spellTypes: ['Mythos', 'Folk Magic'],
    sanityLoss: true,
  },
  
  'shadowrun': {
    type: 'channel' as const,
    name: 'Shadowrun Magic',
    hasSpellSlots: false,
    hasPowerPoints: false,
    usesDrain: true,
    traditions: ['Hermetic', 'Shamanic', 'Chaos', 'Christian'],
    spellTypes: ['Combat', 'Detection', 'Health', 'Illusion', 'Manipulation'],
  }
};

/**
 * 🔮 魔法システム管理クラス
 */
export class SpellPowerManager {
  private gameSystem: string;
  private config: any;
  
  constructor(gameSystem: string) {
    this.gameSystem = gameSystem;
    this.config = MAGIC_SYSTEM_CONFIGS[gameSystem as keyof typeof MAGIC_SYSTEM_CONFIGS];
    if (!this.config) {
      throw new Error(`未対応のゲームシステム: ${gameSystem}`);
    }
  }

  /**
   * 🏗️ 新規キャラクター用魔法システムを初期化
   */
  initializeMagicSystem(casterLevel: number = 1, casterClass?: string): MagicSystem {
    switch (this.config.type) {
      case 'vancian':
        return this.initializeVancianSystem(casterLevel, casterClass);
      case 'point':
        return this.initializePointSystem(casterLevel);
      case 'fatigue':
        return this.initializeFatigueSystem(casterLevel);
      case 'channel':
        return this.initializeChannelSystem(casterLevel);
      default:
        return {
          type: 'none',
          knownSpells: [],
          powers: [],
        };
    }
  }

  /**
   * 📚 ヴァンシアン系（D&D系）初期化
   */
  private initializeVancianSystem(casterLevel: number, casterClass?: string): MagicSystem {
    const spellSlots = this.generateSpellSlots(casterLevel, casterClass);
    const knownSpells = this.getStartingSpells(casterLevel, casterClass);
    
    return {
      type: 'vancian',
      spellSlots,
      knownSpells,
      preparedSpells: [],
      powers: [],
      casterLevel,
      spellDC: 8 + Math.floor(casterLevel / 2) + 3, // 基本計算
      spellAttackBonus: Math.floor(casterLevel / 2) + 3,
    };
  }

  /**
   * 🔵 ポイント系初期化
   */
  private initializePointSystem(casterLevel: number): MagicSystem {
    const powerPools: PowerPool[] = [{
      type: 'Magic Points',
      current: casterLevel * 10,
      maximum: casterLevel * 10,
      regeneration: '1 per hour',
    }];

    if (this.gameSystem === 'cthulhu') {
      powerPools.push({
        type: 'Sanity',
        current: 99,
        maximum: 99,
        regeneration: 'Rest/Therapy',
      });
    }

    return {
      type: 'point',
      powerPools,
      knownSpells: this.getMythosSpells(),
      powers: [],
      casterLevel,
    };
  }

  /**
   * 💪 疲労系（Stormbringer）初期化
   */
  private initializeFatigueSystem(casterLevel: number): MagicSystem {
    return {
      type: 'fatigue',
      knownSpells: this.getStormbringerSpells(),
      powers: this.getStormbringerPowers(),
      casterLevel,
    };
  }

  /**
   * ⚡ チャネル系（Shadowrun）初期化
   */
  private initializeChannelSystem(casterLevel: number): MagicSystem {
    return {
      type: 'channel',
      knownSpells: this.getShadowrunSpells(),
      powers: this.getShadowrunPowers(),
      casterLevel,
    };
  }

  /**
   * 🎯 呪文スロット生成
   */
  private generateSpellSlots(casterLevel: number, casterClass?: string): SpellSlot[] {
    if (this.gameSystem === 'dnd5e') {
      return this.getDnD5eSpellSlots(casterLevel, casterClass);
    } else if (this.gameSystem === 'pathfinder') {
      return this.getPathfinderSpellSlots(casterLevel, casterClass);
    }
    return [];
  }

  /**
   * 📖 D&D 5e呪文スロット表
   */
  private getDnD5eSpellSlots(casterLevel: number, casterClass?: string): SpellSlot[] {
    const fullCasterTable = [
      [],
      [2], // 1st
      [3], // 2nd
      [4, 2], // 3rd
      [4, 3], // 4th
      [4, 3, 2], // 5th
      [4, 3, 3], // 6th
      [4, 3, 3, 1], // 7th
      [4, 3, 3, 2], // 8th
      [4, 3, 3, 3, 1], // 9th
      [4, 3, 3, 3, 2], // 10th
      [4, 3, 3, 3, 2, 1], // 11th
      [4, 3, 3, 3, 2, 1], // 12th
      [4, 3, 3, 3, 2, 1, 1], // 13th
      [4, 3, 3, 3, 2, 1, 1], // 14th
      [4, 3, 3, 3, 2, 1, 1, 1], // 15th
      [4, 3, 3, 3, 2, 1, 1, 1], // 16th
      [4, 3, 3, 3, 2, 1, 1, 1, 1], // 17th
      [4, 3, 3, 3, 3, 1, 1, 1, 1], // 18th
      [4, 3, 3, 3, 3, 2, 1, 1, 1], // 19th
      [4, 3, 3, 3, 3, 2, 2, 1, 1], // 20th
    ];

    const slots = fullCasterTable[Math.min(casterLevel, 20)] || [];
    return slots.map((total, index) => ({
      level: index + 1,
      total,
      used: 0,
    }));
  }

  /**
   * 📚 初期呪文リスト生成
   */
  private getStartingSpells(casterLevel: number, casterClass?: string): Spell[] {
    const spells: Spell[] = [];
    
    if (this.gameSystem === 'dnd5e') {
      // D&D 5e基本呪文
      spells.push(
        {
          id: 'mage-hand',
          name: 'Mage Hand',
          level: 0,
          school: 'Conjuration',
          castingTime: '1 action',
          range: '30 feet',
          components: ['V', 'S'],
          duration: '1 minute',
          description: '魔法の手を作り出し、遠隔で物体を操作する',
        },
        {
          id: 'magic-missile',
          name: 'Magic Missile',
          level: 1,
          school: 'Evocation',
          castingTime: '1 action',
          range: '120 feet',
          components: ['V', 'S'],
          duration: 'Instantaneous',
          description: '3つの魔法の矢が自動命中し、各々1d4+1ダメージ',
          damage: '1d4+1',
        }
      );
    }

    return spells;
  }

  /**
   * 🐙 Mythos呪文リスト
   */
  private getMythosSpells(): Spell[] {
    return [
      {
        id: 'elder-sign',
        name: 'Elder Sign',
        level: 1,
        castingTime: '1 hour',
        range: 'Touch',
        components: ['V', 'S', 'M'],
        duration: 'Permanent',
        description: '古印を刻み、邪悪な存在を遠ざける',
        systemSpecific: {
          sanityLoss: '1d4',
          magicPointCost: 5,
        },
      },
      {
        id: 'contact-deity',
        name: 'Contact Deity',
        level: 5,
        castingTime: '30 minutes',
        range: 'Self',
        components: ['V', 'S', 'M'],
        duration: '1 minute',
        description: '神格存在と精神的に接触する',
        systemSpecific: {
          sanityLoss: '1d10',
          magicPointCost: 20,
        },
      },
    ];
  }

  /**
   * ⚡ Stormbringer呪文リスト
   */
  private getStormbringerSpells(): Spell[] {
    return [
      {
        id: 'flames',
        name: 'Flames',
        level: 1,
        school: 'Elementalism',
        castingTime: 'Instant',
        range: '30 yards',
        components: ['V', 'S'],
        duration: 'Instant',
        description: '火の矢を放つ',
        damage: '1d6',
        systemSpecific: {
          fatigueCost: 3,
          element: 'Fire',
        },
      },
      {
        id: 'summon-demon',
        name: 'Summon Demon',
        level: 5,
        school: 'Summoning',
        castingTime: '1 hour',
        range: 'Special',
        components: ['V', 'S', 'M'],
        duration: 'Bound',
        description: '悪魔を召喚し、契約を結ぶ',
        systemSpecific: {
          fatigueCost: 20,
          bindingDifficulty: 15,
        },
      },
    ];
  }

  /**
   * ⚡ Stormbringer能力リスト
   */
  private getStormbringerPowers(): Power[] {
    return [
      {
        id: 'chaos-strength',
        name: 'Chaos Strength',
        type: 'supernatural',
        cost: 5,
        activation: 'Free',
        range: 'Self',
        duration: '1 combat',
        description: 'カオスの力で一時的に筋力を増強する',
        systemSpecific: {
          statBonus: { STR: 10 },
        },
      },
    ];
  }

  /**
   * 🌆 Shadowrun呪文リスト
   */
  private getShadowrunSpells(): Spell[] {
    return [
      {
        id: 'stunbolt',
        name: 'Stunbolt',
        level: 1,
        school: 'Combat',
        castingTime: 'Complex Action',
        range: 'Line of Sight',
        components: ['Gesture', 'Thought'],
        duration: 'Instant',
        description: '対象に精神ダメージを与える',
        damage: 'Force + net hits',
        systemSpecific: {
          drainValue: 'Force - 3',
          type: 'Mana',
        },
      },
    ];
  }

  /**
   * 🌆 Shadowrun能力リスト
   */
  private getShadowrunPowers(): Power[] {
    return [
      {
        id: 'astral-perception',
        name: 'Astral Perception',
        type: 'supernatural',
        cost: 0,
        activation: 'Simple Action',
        range: 'Self',
        duration: 'Sustained',
        description: 'アストラル界を知覚する',
      },
    ];
  }

  /**
   * 🎯 呪文発動
   */
  castSpell(
    spell: Spell, 
    magicSystem: MagicSystem, 
    casterStats: any,
    spellLevel?: number
  ): {
    success: boolean;
    result: string;
    updatedMagicSystem: MagicSystem;
    damage?: number;
    effectDescription?: string;
  } {
    switch (magicSystem.type) {
      case 'vancian':
        return this.castVancianSpell(spell, magicSystem, spellLevel || spell.level);
      case 'point':
        return this.castPointSpell(spell, magicSystem, casterStats);
      case 'fatigue':
        return this.castFatigueSpell(spell, magicSystem, casterStats);
      case 'channel':
        return this.castChannelSpell(spell, magicSystem, casterStats);
      default:
        return {
          success: false,
          result: '魔法システムが未定義です',
          updatedMagicSystem: magicSystem,
        };
    }
  }

  /**
   * 📚 ヴァンシアン呪文発動
   */
  private castVancianSpell(spell: Spell, magicSystem: MagicSystem, spellLevel: number): any {
    const slotIndex = magicSystem.spellSlots?.findIndex(slot => 
      slot.level === spellLevel && slot.used < slot.total
    );

    if (slotIndex === -1 || slotIndex === undefined) {
      return {
        success: false,
        result: `レベル${spellLevel}の呪文スロットが不足しています`,
        updatedMagicSystem: magicSystem,
      };
    }

    // スロット消費
    const updatedSlots = [...(magicSystem.spellSlots || [])];
    updatedSlots[slotIndex].used += 1;

    return {
      success: true,
      result: `${spell.name}を発動しました`,
      updatedMagicSystem: {
        ...magicSystem,
        spellSlots: updatedSlots,
      },
      effectDescription: spell.description,
    };
  }

  /**
   * 🔵 ポイント系呪文発動
   */
  private castPointSpell(spell: Spell, magicSystem: MagicSystem, casterStats: any): any {
    const cost = spell.systemSpecific?.magicPointCost || spell.level * 2;
    const mpPool = magicSystem.powerPools?.find(pool => pool.type === 'Magic Points');

    if (!mpPool || mpPool.current < cost) {
      return {
        success: false,
        result: 'マジックポイントが不足しています',
        updatedMagicSystem: magicSystem,
      };
    }

    // MP消費
    const updatedPools = magicSystem.powerPools?.map(pool =>
      pool.type === 'Magic Points' 
        ? { ...pool, current: pool.current - cost }
        : pool
    ) || [];

    // Sanity Loss (CoC)
    if (spell.systemSpecific?.sanityLoss && this.gameSystem === 'cthulhu') {
      // Sanity処理は別途実装
    }

    return {
      success: true,
      result: `${spell.name}を発動しました（MP: ${cost}消費）`,
      updatedMagicSystem: {
        ...magicSystem,
        powerPools: updatedPools,
      },
      effectDescription: spell.description,
    };
  }

  /**
   * 💪 疲労系呪文発動
   */
  private castFatigueSpell(spell: Spell, magicSystem: MagicSystem, casterStats: any): any {
    const fatigueCost = spell.systemSpecific?.fatigueCost || spell.level * 2;

    // 疲労コストの処理は呼び出し元で実装
    return {
      success: true,
      result: `${spell.name}を発動しました（疲労: ${fatigueCost}）`,
      updatedMagicSystem: magicSystem,
      effectDescription: spell.description,
    };
  }

  /**
   * ⚡ チャネル系呪文発動
   */
  private castChannelSpell(spell: Spell, magicSystem: MagicSystem, casterStats: any): any {
    const drainValue = spell.systemSpecific?.drainValue || spell.level;

    // ドレイン処理は別途実装
    return {
      success: true,
      result: `${spell.name}を発動しました（ドレイン: ${drainValue}）`,
      updatedMagicSystem: magicSystem,
      effectDescription: spell.description,
    };
  }

  /**
   * 🔄 休息時の回復処理
   */
  restoreOnRest(magicSystem: MagicSystem, restType: 'short' | 'long' = 'long'): MagicSystem {
    switch (magicSystem.type) {
      case 'vancian':
        if (restType === 'long') {
          // ロングレストで全スロット回復
          const restoredSlots = magicSystem.spellSlots?.map(slot => ({
            ...slot,
            used: 0,
          })) || [];
          return { ...magicSystem, spellSlots: restoredSlots };
        }
        return magicSystem;

      case 'point':
        // ポイント系は時間経過で回復
        const restoredPools = magicSystem.powerPools?.map(pool => ({
          ...pool,
          current: pool.maximum,
        })) || [];
        return { ...magicSystem, powerPools: restoredPools };

      default:
        return magicSystem;
    }
  }
}

export default SpellPowerManager;