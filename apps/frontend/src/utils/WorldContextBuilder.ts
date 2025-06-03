import { BaseLocation, TRPGCampaign, TRPGCharacter, NPCCharacter, EnemyCharacter, WorldBuilding } from '@trpg-ai-gm/types';

/**
 * 🌍 世界観コンテキストビルダー
 * 
 * TRPGセッション中に、現在の状況に基づいてAIに送信する
 * 豊富なコンテキスト情報を構築するクラス
 */
export class WorldContextBuilder {
  private campaign: TRPGCampaign;
  private currentLocation?: BaseLocation;
  private activeCharacters: TRPGCharacter[] = [];
  private timeOfDay: string = 'morning';
  private sessionDay: number = 1;

  constructor(campaign: TRPGCampaign) {
    this.campaign = campaign;
  }

  /**
   * 🎯 現在の場所を設定
   */
  setCurrentLocation(location: BaseLocation): void {
    this.currentLocation = location;
  }

  /**
   * 👥 アクティブなキャラクターを設定
   */
  setActiveCharacters(characters: TRPGCharacter[]): void {
    this.activeCharacters = characters;
  }

  /**
   * ⏰ 時間帯を設定
   */
  setTimeOfDay(time: string): void {
    this.timeOfDay = time;
  }

  /**
   * 📅 セッション日数を設定
   */
  setSessionDay(day: number): void {
    this.sessionDay = day;
  }

  /**
   * 🏛️ 場所固有のコンテキストを構築
   */
  private buildLocationContext(): string {
    if (!this.currentLocation) {
      return "現在地: 不明な場所";
    }

    const { currentLocation } = this;
    let context = `## 📍 現在の場所: ${currentLocation.name}\n\n`;
    
    // 基本情報
    context += `**種類**: ${currentLocation.type} (${currentLocation.rank})\n`;
    context += `**地域**: ${currentLocation.region}\n`;
    context += `**説明**: ${currentLocation.description}\n\n`;

    // 利用可能施設
    if (currentLocation.facilities && Object.keys(currentLocation.facilities).length > 0) {
      context += `### 🏛️ 利用可能な施設\n`;
      
      if (currentLocation.facilities.inn) {
        context += `- **宿屋**: ${currentLocation.facilities.inn.name} (${currentLocation.facilities.inn.pricePerNight}G/泊)\n`;
      }
      
      if (currentLocation.facilities.shops?.length) {
        context += `- **店舗**: ${currentLocation.facilities.shops.map(shop => shop.name).join(', ')}\n`;
      }
      
      if (currentLocation.facilities.temple) {
        context += `- **神殿**: ${currentLocation.facilities.temple.name} (${currentLocation.facilities.temple.deity}を祀る)\n`;
      }
      
      if (currentLocation.facilities.guild) {
        context += `- **ギルド**: ${currentLocation.facilities.guild.name} (${currentLocation.facilities.guild.type})\n`;
      }
      
      context += '\n';
    }

    // NPC情報
    if (currentLocation.npcs?.length) {
      context += `### 👥 この場所のNPC\n`;
      currentLocation.npcs.forEach(npc => {
        context += `- **${npc.name}** (${npc.role}): ${npc.description}\n`;
      });
      context += '\n';
    }

    // 脅威・情勢
    if (currentLocation.threats) {
      context += `### ⚠️ 現在の状況\n`;
      context += `- **危険度**: ${currentLocation.threats.dangerLevel}\n`;
      context += `- **支配勢力**: ${currentLocation.threats.controllingFaction}\n`;
      if (currentLocation.threats.currentEvents?.length) {
        context += `- **現在の情勢**: ${currentLocation.threats.currentEvents.join(', ')}\n`;
      }
      context += '\n';
    }

    // 文化的特徴
    if (currentLocation.culturalModifiers) {
      context += `### 🌍 地域の文化的特徴\n`;
      context += `- **交渉難易度**: DC${currentLocation.culturalModifiers.negotiationDC}\n`;
      context += `- **物価修正**: ${(currentLocation.culturalModifiers.priceModifier * 100).toFixed(0)}%\n`;
      context += `- **評判への影響**: ${currentLocation.culturalModifiers.reputationImpact > 0 ? '+' : ''}${currentLocation.culturalModifiers.reputationImpact}\n\n`;
    }

    // 環境要因
    if (currentLocation.environmentalFactors) {
      context += `### 🌤️ 環境要因\n`;
      context += `- **気候**: ${currentLocation.environmentalFactors.climate}\n`;
      context += `- **地形**: ${currentLocation.environmentalFactors.terrain}\n`;
      if (currentLocation.environmentalFactors.naturalHazards?.length) {
        context += `- **自然災害**: ${currentLocation.environmentalFactors.naturalHazards.join(', ')}\n`;
      }
      context += '\n';
    }

    // 遭遇情報（時間帯別）
    if (currentLocation.encounterRules) {
      const encounterInfo = currentLocation.encounterRules.timeOfDay[this.timeOfDay as keyof typeof currentLocation.encounterRules.timeOfDay];
      if (encounterInfo) {
        context += `### ⚔️ 遭遇情報（${this.timeOfDay}）\n`;
        context += `- **遭遇確率**: ${(encounterInfo.probability * 100).toFixed(1)}%\n`;
        context += `- **遭遇タイプ**: ${encounterInfo.type}\n`;
        if (encounterInfo.description) {
          context += `- **詳細**: ${encounterInfo.description}\n`;
        }
        context += '\n';
      }
    }

    return context;
  }

  /**
   * 👥 キャラクターコンテキストを構築
   */
  private buildCharacterContext(): string {
    let context = `## 👥 パーティー情報\n\n`;

    if (this.activeCharacters.length === 0) {
      context += "現在アクティブなキャラクターはいません。\n\n";
      return context;
    }

    this.activeCharacters.forEach(character => {
      context += `### ${character.name} (${character.characterType})\n`;
      context += `**説明**: ${character.description}\n`;
      
      // ストームブリンガーのステータス
      if (character.characterType === 'PC' && character.stormbringerStats) {
        const stats = character.stormbringerStats;
        context += `**能力値**: STR:${stats.strength} CON:${stats.constitution} SIZ:${stats.size} `;
        context += `INT:${stats.intelligence} POW:${stats.power} DEX:${stats.dexterity} CHA:${stats.charisma}\n`;
        context += `**HP**: ${stats.hitPoints} **MP**: ${stats.magicPoints}\n`;
      }

      // 装備情報
      if (character.equipment?.length) {
        context += `**装備**: ${character.equipment.map(eq => eq.name).join(', ')}\n`;
      }

      // 状態異常
      if (character.currentStatuses?.length) {
        context += `**状態**: ${character.currentStatuses.map(status => status.name).join(', ')}\n`;
      }

      context += '\n';
    });

    return context;
  }

  /**
   * 🌍 世界観情報を構築
   */
  private buildWorldBuildingContext(): string {
    let context = `## 🌍 世界観設定\n\n`;

    const worldBuilding = this.campaign.worldBuilding;
    if (!worldBuilding) {
      context += "世界観設定が未定義です。\n\n";
      return context;
    }

    // 世界観設定
    if (worldBuilding.setting?.length) {
      context += `### 📖 世界の設定\n`;
      worldBuilding.setting.forEach(setting => {
        context += `- **${setting.name}**: ${setting.description}\n`;
      });
      context += '\n';
    }

    // ルール
    if (worldBuilding.rules?.length) {
      context += `### 📋 世界のルール\n`;
      worldBuilding.rules.slice(0, 3).forEach(rule => {
        context += `- **${rule.name}**: ${rule.description}\n`;
      });
      context += '\n';
    }

    // 地理・環境
    if (worldBuilding.geographyEnvironments?.length) {
      context += `### 🗺️ 地理・環境\n`;
      worldBuilding.geographyEnvironments.slice(0, 3).forEach(geo => {
        context += `- **${geo.name}**: ${geo.description}\n`;
      });
      context += '\n';
    }

    // 歴史・伝説
    if (worldBuilding.historyLegends?.length) {
      context += `### 📚 歴史・伝説\n`;
      worldBuilding.historyLegends.slice(0, 2).forEach(history => {
        context += `- **${history.name}**: ${history.description}\n`;
      });
      context += '\n';
    }

    return context;
  }

  /**
   * 📅 セッション情報を構築
   */
  private buildSessionContext(): string {
    let context = `## 📅 セッション情報\n\n`;
    context += `**セッション日数**: ${this.sessionDay}日目\n`;
    context += `**時間帯**: ${this.timeOfDay}\n`;
    context += `**ゲームシステム**: ${this.campaign.gameSystem}\n\n`;

    // 進行中のクエスト
    if (this.campaign.plot?.length) {
      context += `### 🎯 進行中のクエスト\n`;
      this.campaign.plot
        .filter(quest => quest.status === 'inProgress')
        .slice(0, 3)
        .forEach(quest => {
          context += `- **${quest.title}**: ${quest.description}\n`;
        });
      context += '\n';
    }

    return context;
  }

  /**
   * 🎲 遭遇特化コンテキストを構築
   */
  buildEncounterContext(): string {
    let context = `# ⚔️ 遭遇・戦闘コンテキスト\n\n`;
    
    context += this.buildLocationContext();
    context += this.buildCharacterContext();
    
    if (this.currentLocation?.encounterRules) {
      context += `## 🎲 遭遇詳細情報\n\n`;
      const rules = this.currentLocation.encounterRules;
      
      // 時間帯別遭遇情報
      Object.entries(rules.timeOfDay).forEach(([time, encounter]) => {
        const isCurrent = time === this.timeOfDay;
        context += `**${time}${isCurrent ? ' (現在)' : ''}**: ${encounter.type} (${(encounter.probability * 100).toFixed(1)}%)\n`;
      });
      context += '\n';

      // 特殊イベント
      if (rules.specialEvents?.length) {
        context += `### 🌟 特殊イベント\n`;
        rules.specialEvents.forEach(event => {
          context += `- **条件**: ${event.condition}\n`;
          context += `- **内容**: ${event.event} (${(event.probability * 100).toFixed(1)}%)\n\n`;
        });
      }
    }

    return context;
  }

  /**
   * 🗣️ 会話特化コンテキストを構築
   */
  buildConversationContext(npcName?: string): string {
    let context = `# 💬 会話・ロールプレイコンテキスト\n\n`;
    
    context += this.buildLocationContext();
    context += this.buildCharacterContext();

    if (npcName && this.currentLocation) {
      const npc = this.currentLocation.npcs?.find(n => n.name === npcName);
      if (npc) {
        context += `## 🎭 対話相手: ${npc.name}\n\n`;
        context += `**役割**: ${npc.role}\n`;
        context += `**説明**: ${npc.description}\n`;
        if (npc.personality) {
          context += `**性格**: ${npc.personality}\n`;
        }
        context += '\n';

        // NPCスケジュール情報
        const schedule = this.currentLocation.npcSchedule?.[npc.id];
        if (schedule) {
          context += `### 📅 ${npc.name}のスケジュール\n`;
          context += `**利用可能時間**: ${schedule.availability.join(', ')}\n`;
          if (schedule.services?.length) {
            context += `**提供サービス**: ${schedule.services.join(', ')}\n`;
          }
          context += '\n';
        }
      }
    }

    // 文化的コンテキスト
    if (this.currentLocation?.culturalModifiers) {
      context += `## 🌍 文化的コンテキスト\n\n`;
      context += `この地域では交渉難易度がDC${this.currentLocation.culturalModifiers.negotiationDC}に設定されています。\n`;
      context += `物価は標準の${(this.currentLocation.culturalModifiers.priceModifier * 100).toFixed(0)}%です。\n\n`;
    }

    return context;
  }

  /**
   * 🎮 汎用セッションコンテキストを構築
   */
  buildFullContext(): string {
    let context = `# 🎮 TRPG セッションコンテキスト\n\n`;
    
    context += `**キャンペーン**: ${this.campaign.title}\n`;
    context += `**あらすじ**: ${this.campaign.synopsis}\n\n`;
    
    context += this.buildSessionContext();
    context += this.buildLocationContext();
    context += this.buildCharacterContext();
    context += this.buildWorldBuildingContext();

    return context;
  }

  /**
   * 🎲 状況別コンテキスト生成
   */
  buildContextForSituation(situation: 'encounter' | 'conversation' | 'exploration' | 'general', additionalInfo?: any): string {
    switch (situation) {
      case 'encounter':
        return this.buildEncounterContext();
        
      case 'conversation':
        return this.buildConversationContext(additionalInfo?.npcName);
        
      case 'exploration':
        let explorationContext = this.buildFullContext();
        explorationContext += `\n## 🔍 探索モード\n\n`;
        explorationContext += `プレイヤーたちは現在${this.currentLocation?.name || '不明な場所'}を探索中です。\n`;
        explorationContext += `時間帯は${this.timeOfDay}で、周囲の状況に注意を払ってください。\n`;
        return explorationContext;
        
      case 'general':
      default:
        return this.buildFullContext();
    }
  }

  /**
   * 🤖 AI指示プロンプトを生成
   */
  buildAIInstruction(situation: 'encounter' | 'conversation' | 'exploration' | 'general', instruction?: string): string {
    const context = this.buildContextForSituation(situation);
    
    let aiInstruction = `${context}\n\n`;
    aiInstruction += `## 🤖 AI指示\n\n`;
    aiInstruction += `あなたは経験豊富なTRPGゲームマスターです。上記のコンテキストに基づいて、以下の要求に適切に応答してください：\n\n`;
    
    switch (situation) {
      case 'encounter':
        aiInstruction += `- 現在の遭遇状況を詳細に描写してください\n`;
        aiInstruction += `- 必要に応じてダイスロールを要求してください\n`;
        aiInstruction += `- キャラクターの行動選択肢を提示してください\n`;
        break;
        
      case 'conversation':
        aiInstruction += `- NPCの性格と背景に基づいた自然な会話を生成してください\n`;
        aiInstruction += `- 地域の文化的特徴を会話に反映してください\n`;
        aiInstruction += `- 必要に応じて交渉判定を要求してください\n`;
        break;
        
      case 'exploration':
        aiInstruction += `- 現在の場所の詳細な描写を提供してください\n`;
        aiInstruction += `- 発見可能な要素や隠された情報を示唆してください\n`;
        aiInstruction += `- 時間帯と環境要因を考慮してください\n`;
        break;
        
      case 'general':
        aiInstruction += `- セッションの流れを自然に進行させてください\n`;
        aiInstruction += `- キャラクターとプロットを効果的に絡めてください\n`;
        aiInstruction += `- 適切なタイミングでイベントを発生させてください\n`;
        break;
    }

    if (instruction) {
      aiInstruction += `\n**特別な指示**: ${instruction}\n`;
    }

    aiInstruction += `\n**注意事項**:\n`;
    aiInstruction += `- ゲームシステム「${this.campaign.gameSystem}」のルールに従ってください\n`;
    aiInstruction += `- プレイヤーの選択を尊重し、強制的な展開は避けてください\n`;
    aiInstruction += `- 世界観の一貫性を保ってください\n`;

    return aiInstruction;
  }
}

export default WorldContextBuilder;