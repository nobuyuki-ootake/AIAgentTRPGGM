// @ts-nocheck
import { BaseLocation, TRPGCharacter } from '@trpg-ai-gm/types';

/**
 * 🏛️ 場所別AI応答カスタマイズシステム
 * 
 * 各拠点の特徴に基づいてAI応答を調整し、
 * より没入感のある体験を提供するクラス
 */
export class LocationBasedAI {
  
  /**
   * 🎭 場所に応じたAI人格を設定
   */
  static getLocationPersonality(location: BaseLocation): string {
    const { type, culturalModifiers, threats, importance } = location;
    
    let personality = '';

    // 場所タイプ別の基本人格
    switch (type) {
      case 'city':
        personality = '都市的で洗練された口調。多様な情報に詳しく、商業的な視点を持つ。';
        break;
      case 'village':
        personality = '親しみやすく素朴な口調。地域の伝統や噂話に詳しい。';
        break;
      case 'dungeon':
        personality = '神秘的で緊張感のある口調。古い知識や危険に関する警告を好む。';
        break;
      case 'temple':
        personality = '厳粛で知識豊富な口調。宗教的・哲学的な視点を重視する。';
        break;
      case 'wilderness':
        personality = '自然に根ざした素朴な口調。生存術や野生動物の知識が豊富。';
        break;
      default:
        personality = '中立的で情報提供に徹した口調。';
    }

    // 文化的修正の反映
    if (culturalModifiers) {
      if (culturalModifiers.negotiationDC > 15) {
        personality += ' 交渉には慎重で、簡単には譲歩しない。';
      } else if (culturalModifiers.negotiationDC < 10) {
        personality += ' 友好的で協力的、交渉に応じやすい。';
      }

      if (culturalModifiers.priceModifier > 1.2) {
        personality += ' 金銭に関してはシビアで、高品質なものを好む。';
      } else if (culturalModifiers.priceModifier < 0.8) {
        personality += ' 質素で実用性を重視する。';
      }
    }

    // 脅威レベルの反映
    if (threats) {
      if (threats.dangerLevel === '高') {
        personality += ' 常に警戒心を持ち、危険に関する情報を重視する。';
      } else if (threats.dangerLevel === '低') {
        personality += ' 平和で楽観的、リラックスした雰囲気。';
      }
    }

    // 重要度の反映
    if (importance === '主要拠点') {
      personality += ' 重要な情報や影響力のある人物とのつながりを持つ。';
    } else if (importance === '隠し拠点') {
      personality += ' 秘密や隠された知識を持つが、簡単には明かさない。';
    }

    return personality;
  }

  /**
   * 🎨 場所に応じた描写スタイルを生成
   */
  static getLocationDescriptionStyle(location: BaseLocation): string {
    const { type, environmentalFactors, rank } = location;
    
    let style = '';

    // 場所タイプ別の描写スタイル
    switch (type) {
      case 'city':
        style = '賑やかな都市の音響、石畳の道、高い建物、人々の喧騒を強調した描写。';
        break;
      case 'village':
        style = '牧歌的な田舎の風景、木造建築、農村の匂い、のどかな雰囲気の描写。';
        break;
      case 'dungeon':
        style = '薄暗い地下空間、湿った空気、古い石造り、神秘的で不気味な雰囲気の描写。';
        break;
      case 'temple':
        style = '神聖で厳粛な雰囲気、宗教的な装飾、静寂、神々しい光の描写。';
        break;
      case 'castle':
        style = '壮大で威厳のある建築、高い塔、石造りの廊下、権力の象徴的な描写。';
        break;
      case 'wilderness':
        style = '自然の美しさと厳しさ、野生動物の気配、自然の音、開放感の描写。';
        break;
      default:
        style = '場所の特徴に応じた適切な描写。';
    }

    // 環境要因の反映
    if (environmentalFactors) {
      const { climate, terrain } = environmentalFactors;
      
      // 気候の反映
      switch (climate) {
        case 'tropical':
          style += ' 蒸し暑い湿気、豊かな緑、色鮮やかな花々を含める。';
          break;
        case 'arctic':
          style += ' 厳しい寒さ、雪と氷、白い息、防寒具の必要性を強調。';
          break;
        case 'desert':
          style += ' 乾燥した熱気、砂の匂い、強い日差し、水の貴重さを表現。';
          break;
        case 'magical':
          style += ' 魔法的な現象、不思議な光、超自然的な要素を織り込む。';
          break;
      }

      // 地形の反映
      switch (terrain) {
        case 'mountain':
          style += ' 険しい岩肌、標高による空気の薄さ、雄大な景色を描写。';
          break;
        case 'forest':
          style += ' 木々のざわめき、木漏れ日、森の香り、野生動物の気配。';
          break;
        case 'swamp':
          style += ' 湿った地面、沼地の匂い、霧、危険な雰囲気を強調。';
          break;
        case 'underground':
          style += ' 地下空間特有の圧迫感、エコー、人工的な照明を描写。';
          break;
      }
    }

    // ランクによる規模感の調整
    if (rank) {
      if (rank.includes('大都市') || rank.includes('要塞')) {
        style += ' 大規模で壮大なスケール感を強調。';
      } else if (rank.includes('小')) {
        style += ' 小規模で親しみやすい雰囲気を重視。';
      }
    }

    return style;
  }

  /**
   * ⚔️ 場所別遭遇カスタマイズ
   */
  static getLocationEncounterStyle(location: BaseLocation, timeOfDay: string): string {
    const { type, encounterRules, environmentalFactors } = location;
    
    let encounterStyle = '';

    // 基本的な遭遇スタイル
    switch (type) {
      case 'city':
        encounterStyle = '都市部での遭遇：盗賊、商人、役人、市民との交流。政治的な要素や商業的な利害関係を含む。';
        break;
      case 'village':
        encounterStyle = '村での遭遇：村人、行商人、地元の問題。素朴で人情味のある交流が中心。';
        break;
      case 'dungeon':
        encounterStyle = 'ダンジョンでの遭遇：モンスター、罠、宝物、古代の仕掛け。戦闘と探索が主体。';
        break;
      case 'wilderness':
        encounterStyle = '野外での遭遇：野生動物、自然現象、旅人、山賊。サバイバル要素を重視。';
        break;
      case 'temple':
        encounterStyle = '神殿での遭遇：聖職者、巡礼者、宗教的な試練。精神性や信仰に関わる要素。';
        break;
      default:
        encounterStyle = '一般的な遭遇：その場の状況に応じた適切な遭遇。';
    }

    // 時間帯による調整
    switch (timeOfDay) {
      case 'morning':
        encounterStyle += ' 朝の清々しい雰囲気で、活動的で前向きな遭遇を重視。';
        break;
      case 'afternoon':
        encounterStyle += ' 昼間の活発な時間帯で、多様な活動や交流が発生しやすい。';
        break;
      case 'evening':
        encounterStyle += ' 夕方の落ち着いた雰囲気で、内省的や情緒的な要素を含む。';
        break;
      case 'night':
        encounterStyle += ' 夜の神秘的で危険な雰囲気。隠された要素や意外な展開を重視。';
        break;
    }

    // 遭遇ルールの反映
    if (encounterRules) {
      const timeEncounter = encounterRules.timeOfDay[timeOfDay as keyof typeof encounterRules.timeOfDay];
      if (timeEncounter) {
        encounterStyle += ` この時間帯の特徴：${timeEncounter.type}（確率${(timeEncounter.probability * 100).toFixed(1)}%）。`;
        if (timeEncounter.description) {
          encounterStyle += ` ${timeEncounter.description}`;
        }
      }

      // 特殊イベントの反映
      if (encounterRules.specialEvents?.length) {
        encounterStyle += ' 特殊イベントの可能性も考慮する。';
      }
    }

    // 環境要因による危険度調整
    if (environmentalFactors?.naturalHazards?.length) {
      encounterStyle += ` 自然災害リスク（${environmentalFactors.naturalHazards.join(', ')}）も考慮に入れる。`;
    }

    return encounterStyle;
  }

  /**
   * 💬 場所別会話トーン設定
   */
  static getLocationConversationTone(location: BaseLocation): string {
    const { type, culturalModifiers, threats } = location;
    
    let tone = '';

    // 基本トーン
    switch (type) {
      case 'city':
        tone = '都会的で洗練された会話トーン。ビジネスライクだが情報交換には積極的。';
        break;
      case 'village':
        tone = '親しみやすく素朴な会話トーン。世間話を好み、地域の話題に詳しい。';
        break;
      case 'temple':
        tone = '敬語を多用する丁寧で厳粛な会話トーン。精神的な話題を好む。';
        break;
      case 'wilderness':
        tone = '実用的で簡潔な会話トーン。生存に関わる情報を重視する。';
        break;
      default:
        tone = '状況に応じた適切な会話トーン。';
    }

    // 文化的修正の反映
    if (culturalModifiers) {
      if (culturalModifiers.negotiationDC > 15) {
        tone += ' 警戒心が強く、簡単には心を開かない。信頼を得るまで時間がかかる。';
      } else if (culturalModifiers.negotiationDC < 10) {
        tone += ' 非常に友好的で開放的。初対面でも親しみやすい。';
      }
    }

    // 脅威レベルによる調整
    if (threats) {
      if (threats.dangerLevel === '高') {
        tone += ' 緊張感があり、警戒しながらの会話。危険に関する話題が多い。';
      } else if (threats.dangerLevel === '低') {
        tone += ' リラックスした雰囲気で、のんびりとした会話を楽しむ。';
      }
    }

    return tone;
  }

  /**
   * 🎯 場所別AIプロンプト強化
   */
  static enhanceAIPromptForLocation(
    basePrompt: string, 
    location: BaseLocation, 
    timeOfDay: string,
    situation: 'encounter' | 'conversation' | 'exploration' | 'general'
  ): string {
    let enhancedPrompt = basePrompt + '\n\n';
    
    enhancedPrompt += `## 🏛️ 場所別AI調整指示\n\n`;

    // 人格設定
    const personality = this.getLocationPersonality(location);
    enhancedPrompt += `**AI人格**: ${personality}\n\n`;

    // 描写スタイル
    const descriptionStyle = this.getLocationDescriptionStyle(location);
    enhancedPrompt += `**描写スタイル**: ${descriptionStyle}\n\n`;

    // 状況別の調整
    switch (situation) {
      case 'encounter': {
        const encounterStyle = this.getLocationEncounterStyle(location, timeOfDay);
        enhancedPrompt += `**遭遇スタイル**: ${encounterStyle}\n\n`;
        break;
      }

      case 'conversation': {
        const conversationTone = this.getLocationConversationTone(location);
        enhancedPrompt += `**会話トーン**: ${conversationTone}\n\n`;
        break;
      }

      case 'exploration':
        enhancedPrompt += `**探索重点**: ${location.type}特有の発見要素を重視。`;
        if (location.features?.questHub) {
          enhancedPrompt += ' クエスト関連の手がかりも配置。';
        }
        enhancedPrompt += '\n\n';
        break;
    }

    // 特別な注意事項
    enhancedPrompt += `**重要な注意事項**:\n`;
    enhancedPrompt += `- ${location.name}の特徴を常に意識した応答をする\n`;
    enhancedPrompt += `- 時間帯（${timeOfDay}）に応じた雰囲気を維持する\n`;
    enhancedPrompt += `- この場所固有の文化や慣習を反映する\n`;
    
    if (location.culturalModifiers) {
      enhancedPrompt += `- 交渉判定はDC${location.culturalModifiers.negotiationDC}を基準とする\n`;
    }
    
    if (location.encounterRules) {
      enhancedPrompt += `- 遭遇判定は設定されたルールに従う\n`;
    }

    return enhancedPrompt;
  }

  /**
   * 🎲 場所別ダイス修正値を取得
   */
  static getLocationDiceModifiers(location: BaseLocation, checkType: string): number {
    let modifier = 0;

    // 文化的修正
    if (location.culturalModifiers) {
      switch (checkType) {
        case 'negotiation':
        case 'persuasion':
          modifier += (location.culturalModifiers.negotiationDC - 10) / 2;
          break;
        case 'trade':
        case 'commerce':
          modifier += location.culturalModifiers.priceModifier > 1 ? 2 : -1;
          break;
      }
    }

    // 環境要因による修正
    if (location.environmentalFactors) {
      switch (checkType) {
        case 'perception':
        case 'investigation':
          if (location.environmentalFactors.terrain === 'forest') modifier += 1;
          if (location.environmentalFactors.terrain === 'mountain') modifier -= 1;
          break;
        case 'stealth':
          if (location.environmentalFactors.terrain === 'urban') modifier -= 2;
          if (location.environmentalFactors.terrain === 'forest') modifier += 2;
          break;
        case 'survival':
          if (location.environmentalFactors.climate === 'arctic') modifier -= 3;
          if (location.environmentalFactors.climate === 'desert') modifier -= 2;
          break;
      }
    }

    // 脅威レベルによる修正
    if (location.threats) {
      switch (checkType) {
        case 'intimidation':
          if (location.threats.dangerLevel === '高') modifier += 2;
          break;
        case 'insight':
          if (location.threats.dangerLevel === '高') modifier += 1;
          break;
      }
    }

    return Math.round(modifier);
  }
}

export default LocationBasedAI;