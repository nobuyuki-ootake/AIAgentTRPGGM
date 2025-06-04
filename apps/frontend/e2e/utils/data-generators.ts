import { TRPGCampaign, TRPGCharacter, TRPGLocation, TRPGTimelineEvent } from "./trpg-test-helpers";

/**
 * TRPG Test Data Generators
 * 
 * Provides utilities for generating large datasets for stress testing,
 * performance testing, and comprehensive scenario coverage
 */

/**
 * Generate multiple test campaigns with varying complexity
 */
export const generateTestCampaigns = (count: number = 5): TRPGCampaign[] => {
  const campaigns: TRPGCampaign[] = [];
  
  const campaignTemplates = [
    {
      titlePrefix: "古代の謎",
      theme: "archaeological",
      gameSystem: "D&D 5e",
      description: "古代文明の謎を解き明かす考古学的冒険"
    },
    {
      titlePrefix: "海賊の冒険",
      theme: "maritime",
      gameSystem: "Pathfinder",
      description: "大海原を舞台にした海賊たちの冒険譚"
    },
    {
      titlePrefix: "魔法学院",
      theme: "academic",
      gameSystem: "D&D 5e",
      description: "魔法学院を舞台にした青春と成長の物語"
    },
    {
      titlePrefix: "政治陰謀",
      theme: "political",
      gameSystem: "Call of Cthulhu",
      description: "宮廷政治と陰謀に満ちた大人の冒険"
    },
    {
      titlePrefix: "サイバーパンク",
      theme: "cyberpunk",
      gameSystem: "Shadowrun",
      description: "近未来都市を舞台にしたハイテク・ローライフ"
    }
  ];

  for (let i = 0; i < count; i++) {
    const template = campaignTemplates[i % campaignTemplates.length];
    const campaignId = `test-campaign-${Date.now()}-${i}`;
    
    campaigns.push({
      id: campaignId,
      title: `${template.titlePrefix} ${i + 1}`,
      description: `${template.description}。テスト用キャンペーン ${i + 1}`,
      gameSystem: template.gameSystem,
      createdAt: new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000).toISOString(),
      updatedAt: new Date().toISOString(),
      playerCharacters: generateTestCharacters(Math.floor(Math.random() * 4) + 2, "PC", template.theme),
      npcs: generateTestCharacters(Math.floor(Math.random() * 6) + 3, "NPC", template.theme),
      enemies: generateTestCharacters(Math.floor(Math.random() * 8) + 2, "Enemy", template.theme),
      locations: generateTestLocations(Math.floor(Math.random() * 8) + 5, template.theme),
      timeline: generateTestTimelineEvents(Math.floor(Math.random() * 12) + 8, template.theme),
      sessions: generateTestSessions(campaignId, Math.floor(Math.random() * 5) + 1)
    });
  }

  return campaigns;
};

/**
 * Generate test characters based on theme and type
 */
export const generateTestCharacters = (count: number, type: 'PC' | 'NPC' | 'Enemy', theme: string = 'fantasy'): TRPGCharacter[] => {
  const characters: TRPGCharacter[] = [];
  
  const namesByTheme = {
    archaeological: {
      PC: ["インディアナ・ジョーンズ", "ララ・クロフト", "エリザベス・ホーキンス", "マルコス・フェルナンデス"],
      NPC: ["博士ハミルトン", "考古学者ワトソン", "現地ガイド・アハメド", "図書館司書マリア"],
      Enemy: ["遺跡荒らし", "古代の守護者", "ライバル考古学者", "盗掘団のボス"]
    },
    maritime: {
      PC: ["キャプテン・レッドビアード", "航海士エレナ", "船医トーマス", "砲術長ウィリアム"],
      NPC: ["港の酒場主", "商人ギルドの代表", "海軍提督", "密売人フィン"],
      Enemy: ["海賊船長", "海の怪物", "敵国の艦長", "呪われた船の亡霊"]
    },
    academic: {
      PC: ["魔法学生アリス", "研究者ベンジャミン", "実験助手ルーシー", "図書委員ダニエル"],
      NPC: ["魔法学院長", "厳格な教授", "親切な先輩", "食堂のおばさん"],
      Enemy: ["闇の魔法使い", "実験の失敗作", "ライバル学院の生徒", "禁書の番人"]
    },
    political: {
      PC: ["宮廷騎士", "外交官", "スパイ", "商人貴族"],
      NPC: ["国王", "宰相", "大司教", "市民代表"],
      Enemy: ["反乱軍指導者", "暗殺者", "外国のスパイ", "腐敗した貴族"]
    },
    cyberpunk: {
      PC: ["ハッカー", "サイバー忍者", "ストリートサムライ", "企業エージェント"],
      NPC: ["フィクサー", "リッパードク", "バーテンダー", "情報屋"],
      Enemy: ["コーポレートセキュリティ", "サイバーサイコ", "AIエージェント", "ギャングボス"]
    }
  };

  const themeNames = namesByTheme[theme as keyof typeof namesByTheme] || namesByTheme.archaeological;
  const names = themeNames[type] || themeNames.PC;

  const races = type === 'Enemy' ? 
    ["オーク", "ゴブリン", "ドラゴン", "アンデッド", "デーモン", "エレメンタル"] :
    ["ヒューマン", "エルフ", "ドワーフ", "ハーフリング", "ティーフリング", "ドラゴンボーン"];

  const classes = type === 'Enemy' ?
    ["バーバリアン", "モンスター", "ソーサラー", "アサシン", "ネクロマンサー"] :
    ["ファイター", "ウィザード", "ローグ", "クレリック", "レンジャー", "バード", "パラディン"];

  for (let i = 0; i < count; i++) {
    const baseName = names[i % names.length];
    const characterName = count > names.length ? `${baseName} ${Math.floor(i / names.length) + 1}` : baseName;

    characters.push({
      id: `${type.toLowerCase()}-${Date.now()}-${i}`,
      name: characterName,
      type,
      level: Math.floor(Math.random() * 18) + 1,
      race: races[Math.floor(Math.random() * races.length)],
      class: classes[Math.floor(Math.random() * classes.length)],
      attributes: {
        strength: Math.floor(Math.random() * 16) + 8,
        dexterity: Math.floor(Math.random() * 16) + 8,
        constitution: Math.floor(Math.random() * 16) + 8,
        intelligence: Math.floor(Math.random() * 16) + 8,
        wisdom: Math.floor(Math.random() * 16) + 8,
        charisma: Math.floor(Math.random() * 16) + 8,
      },
      hitPoints: {
        current: Math.floor(Math.random() * 80) + 20,
        maximum: Math.floor(Math.random() * 80) + 20
      },
      armorClass: Math.floor(Math.random() * 8) + 12,
      background: generateCharacterBackground(theme, type),
      personality: generateCharacterPersonality(),
      appearance: generateCharacterAppearance(),
      backstory: generateCharacterBackstory(characterName, theme),
      equipment: generateCharacterEquipment(type),
      spells: type !== 'Enemy' && Math.random() > 0.5 ? generateSpells() : undefined,
      notes: `テスト用${type}キャラクター。${theme}テーマのキャンペーン用。`,
      imageUrl: `/test-assets/${type.toLowerCase()}-${i + 1}.jpg`
    });
  }

  return characters;
};

/**
 * Generate test locations based on theme
 */
export const generateTestLocations = (count: number, theme: string = 'fantasy'): TRPGLocation[] => {
  const locations: TRPGLocation[] = [];

  const locationsByTheme = {
    archaeological: [
      { name: "古代遺跡", type: "遺跡", description: "失われた文明の神殿" },
      { name: "発掘現場", type: "キャンプ", description: "考古学チームの拠点" },
      { name: "地下墓地", type: "ダンジョン", description: "古代王族の埋葬地" },
      { name: "図書館", type: "研究施設", description: "古文書の保管庫" }
    ],
    maritime: [
      { name: "港町", type: "都市", description: "賑やかな交易港" },
      { name: "海賊島", type: "島", description: "海賊たちの隠れ家" },
      { name: "難破船", type: "遺跡", description: "海底に沈む古い船" },
      { name: "灯台", type: "建造物", description: "航海の目印となる塔" }
    ],
    academic: [
      { name: "魔法学院", type: "学校", description: "魔法を学ぶ教育機関" },
      { name: "実験室", type: "研究施設", description: "魔法実験を行う場所" },
      { name: "寮", type: "居住区", description: "学生たちの住まい" },
      { name: "禁書庫", type: "図書館", description: "危険な魔法書の保管場所" }
    ],
    political: [
      { name: "王宮", type: "宮殿", description: "国王の居住地" },
      { name: "議会", type: "政治施設", description: "政治的決定を行う場所" },
      { name: "大使館", type: "外交施設", description: "外国との交渉拠点" },
      { name: "秘密会議室", type: "隠し部屋", description: "極秘の会談場所" }
    ],
    cyberpunk: [
      { name: "メガコーポ本社", type: "超高層ビル", description: "企業の巨大な本拠地" },
      { name: "アンダーグラウンド", type: "地下都市", description: "法の届かない地下世界" },
      { name: "サイバーカフェ", type: "店舗", description: "ハッカーたちの溜まり場" },
      { name: "データ要塞", type: "仮想空間", description: "サイバースペースの要塞" }
    ]
  };

  const themeLocations = locationsByTheme[theme as keyof typeof locationsByTheme] || locationsByTheme.archaeological;

  for (let i = 0; i < count; i++) {
    const template = themeLocations[i % themeLocations.length];
    const locationName = count > themeLocations.length ? 
      `${template.name} ${Math.floor(i / themeLocations.length) + 1}` : 
      template.name;

    locations.push({
      id: `location-${Date.now()}-${i}`,
      name: locationName,
      type: template.type,
      description: `${template.description}。${theme}テーマのテスト用ロケーション。`,
      inhabitants: generateLocationInhabitants(theme, template.type),
      features: generateLocationFeatures(template.type),
      connections: i > 0 ? [locations[Math.floor(Math.random() * i)].name] : []
    });
  }

  return locations;
};

/**
 * Generate test timeline events
 */
export const generateTestTimelineEvents = (count: number, theme: string = 'fantasy'): TRPGTimelineEvent[] => {
  const events: TRPGTimelineEvent[] = [];

  const eventTemplates = {
    archaeological: [
      { title: "遺跡の発見", type: "exploration" as const, description: "新たな古代遺跡が発見される" },
      { title: "古文書の解読", type: "story" as const, description: "重要な古文書の内容が明らかになる" },
      { title: "盗掘団との遭遇", type: "battle" as const, description: "遺跡を荒らす盗掘団と戦闘" },
      { title: "古代の謎解き", type: "exploration" as const, description: "複雑なパズルや罠を解く" }
    ],
    maritime: [
      { title: "海戦", type: "battle" as const, description: "敵船との激しい戦闘" },
      { title: "新たな島の発見", type: "exploration" as const, description: "未知の島を発見し上陸" },
      { title: "港での情報収集", type: "social" as const, description: "酒場で貴重な情報を入手" },
      { title: "嵐との闘い", type: "exploration" as const, description: "激しい嵐を乗り越える" }
    ],
    academic: [
      { title: "期末試験", type: "story" as const, description: "魔法学院の重要な試験" },
      { title: "禁書の発見", type: "exploration" as const, description: "禁断の魔法書を発見" },
      { title: "魔法実験の事故", type: "battle" as const, description: "実験の失敗による危険な状況" },
      { title: "学院祭", type: "social" as const, description: "学生たちの楽しい祭典" }
    ]
  };

  const themeEvents = eventTemplates[theme as keyof typeof eventTemplates] || eventTemplates.archaeological;

  for (let i = 0; i < count; i++) {
    const template = themeEvents[i % themeEvents.length];
    const dayOffset = i + 1;

    events.push({
      id: `event-${Date.now()}-${i}`,
      title: `${template.title} ${Math.floor(i / themeEvents.length) + 1}`,
      description: `${template.description}。テスト用イベント ${i + 1}。`,
      date: `${dayOffset}日目`,
      participants: [`キャラクター${(i % 4) + 1}`, `キャラクター${((i + 1) % 4) + 1}`],
      type: template.type,
      consequences: [
        `結果 ${i + 1}: イベントの直接的な影響`,
        `波及効果 ${i + 1}: 今後のストーリーへの影響`
      ]
    });
  }

  return events;
};

/**
 * Generate test sessions
 */
export const generateTestSessions = (campaignId: string, count: number) => {
  const sessions = [];

  for (let i = 0; i < count; i++) {
    sessions.push({
      id: `session-${campaignId}-${i + 1}`,
      campaignId,
      sessionNumber: i + 1,
      title: `第${i + 1}話：テストセッション`,
      date: new Date(Date.now() - (count - i) * 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      duration: Math.floor(Math.random() * 180) + 120, // 2-5 hours
      participants: [`テストPC${(i % 4) + 1}`, `テストPC${((i + 1) % 4) + 1}`],
      summary: `テストセッション ${i + 1} の概要。重要な進展と決定が行われた。`,
      events: generateTestTimelineEvents(Math.floor(Math.random() * 3) + 2),
      notes: `セッション ${i + 1} の詳細ノート。プレイヤーの行動と判定結果。`
    });
  }

  return sessions;
};

// Helper functions for character generation

const generateCharacterBackground = (theme: string, type: string): string => {
  const backgrounds = {
    archaeological: ["考古学者", "大学教授", "博物館学芸員", "冒険家"],
    maritime: ["船乗り", "商人", "海軍士官", "海賊"],
    academic: ["学生", "研究者", "教授", "司書"],
    political: ["貴族", "外交官", "スパイ", "商人"],
    cyberpunk: ["ハッカー", "企業エージェント", "ストリートキッド", "元軍人"]
  };

  const themeBackgrounds = backgrounds[theme as keyof typeof backgrounds] || backgrounds.archaeological;
  return themeBackgrounds[Math.floor(Math.random() * themeBackgrounds.length)];
};

const generateCharacterPersonality = (): string => {
  const traits = [
    "勇敢で正義感が強い", "知識欲旺盛で好奇心旺盛", "冷静沈着で分析的",
    "社交的で人当たりが良い", "慎重で計画的", "直感的で行動力がある",
    "優しく思いやりがある", "頑固で意志が強い", "楽観的で前向き"
  ];

  return traits[Math.floor(Math.random() * traits.length)];
};

const generateCharacterAppearance = (): string => {
  const heights = ["身長160cm", "身長170cm", "身長180cm"];
  const builds = ["細身", "普通", "筋肉質", "がっしり"];
  const hairColors = ["黒髪", "茶髪", "金髪", "銀髪"];
  const eyeColors = ["黒い瞳", "青い瞳", "緑の瞳", "茶色の瞳"];

  return `${heights[Math.floor(Math.random() * heights.length)]}、${builds[Math.floor(Math.random() * builds.length)]}な体格。${hairColors[Math.floor(Math.random() * hairColors.length)]}と${eyeColors[Math.floor(Math.random() * eyeColors.length)]}が特徴的。`;
};

const generateCharacterBackstory = (name: string, theme: string): string => {
  return `${name}は${theme}をテーマとしたキャンペーンの重要な登場人物。複雑な過去と明確な動機を持ち、ストーリーに深く関わる存在。テスト用に生成されたキャラクターだが、リアルなキャンペーンと同等の詳細設定を持つ。`;
};

const generateCharacterEquipment = (type: string): string[] => {
  const equipment = {
    PC: ["ロングソード", "チェインメイル", "シールド", "冒険者パック", "ポーション"],
    NPC: ["日用品", "仕事道具", "普段着", "小銭入れ"],
    Enemy: ["武器", "防具", "戦闘用装備", "特殊アイテム"]
  };

  return equipment[type as keyof typeof equipment] || equipment.PC;
};

const generateSpells = (): string[] => {
  const spells = [
    "マジックミサイル", "ファイアーボール", "ライトニングボルト", "ヒール",
    "シールド", "ディテクトマジック", "テレポート", "フライ"
  ];

  const spellCount = Math.floor(Math.random() * 5) + 2;
  return spells.slice(0, spellCount);
};

const generateLocationInhabitants = (theme: string, locationType: string): string[] => {
  const inhabitants = {
    archaeological: ["考古学者", "現地ガイド", "遺跡の守護者"],
    maritime: ["船員", "商人", "海賊", "漁師"],
    academic: ["学生", "教授", "研究者", "職員"],
    political: ["政治家", "官僚", "外交官", "市民"],
    cyberpunk: ["ハッカー", "企業員", "ギャング", "AI"]
  };

  const themeInhabitants = inhabitants[theme as keyof typeof inhabitants] || inhabitants.archaeological;
  return themeInhabitants.slice(0, Math.floor(Math.random() * 3) + 1);
};

const generateLocationFeatures = (locationType: string): string[] => {
  const features = {
    "遺跡": ["古代の祭壇", "石の彫刻", "隠し通路", "宝物庫"],
    "都市": ["市場", "宿屋", "神殿", "城壁"],
    "ダンジョン": ["罠", "宝箱", "モンスターの巣", "秘密の部屋"],
    "自然": ["洞窟", "泉", "古い木", "動物の住処"]
  };

  const typeFeatures = features[locationType as keyof typeof features] || features["自然"];
  return typeFeatures.slice(0, Math.floor(Math.random() * 3) + 2);
};