import type { TRPGCampaign } from '@trpg-ai-gm/types';

export const testCampaignData: TRPGCampaign = {
  id: "test-campaign-001",
  title: "竜の谷の秘宝",
  createdAt: new Date("2024-01-01T00:00:00.000Z"),
  updatedAt: new Date("2024-01-01T00:00:00.000Z"),
  gameSystem: "D&D 5e",
  gamemaster: "AI GM",
  players: [
    {
      id: "player-1",
      name: "プレイヤー1",
      characterIds: ["char-1", "char-2", "char-3"],
      isOnline: true
    }
  ],
  synopsis: "リバーベント街に、古代竜が守る秘宝の噂が流れ着いた。冒険者たちは、危険を冒してでもその真相を確かめるため、竜の谷へと旅立つ。",
  
  // QuestElement[] 形式の plot
  plot: [
    {
      id: "quest-forest-bandits",
      title: "森の盗賊団遭遇",
      description: "翠の森道で盗賊団が冒険者を待ち伏せしている。戦闘か交渉かの選択が迫られる。",
      order: 1,
      status: "未開始",
      questType: "サブ",
      difficulty: 2,
      rewards: ["経験値50", "金貨30", "盗賊の情報"],
      sessionId: "session-day-1",
      relatedPlaceIds: ["forest-path"]
    },
    {
      id: "quest-village-request",
      title: "村長からの依頼",
      description: "ハーベスト村の村長が重要な依頼を持ちかけてくる。古い遺跡に関する情報も得られる。",
      order: 2,
      status: "未開始",
      questType: "メイン",
      difficulty: 1,
      rewards: ["重要な情報", "村人の信頼", "古代の地図の断片"],
      sessionId: "session-day-2",
      relatedPlaceIds: ["small-village"]
    },
    {
      id: "quest-ancient-ruins",
      title: "古代遺跡の謎解き",
      description: "忘却の遺跡で古代文明の謎を解く。魔法の罠と貴重な宝物が待っている。",
      order: 3,
      status: "未開始",
      questType: "サブ",
      difficulty: 4,
      rewards: ["古代の巻物", "経験値150", "魔法のアミュレット"],
      sessionId: "session-day-3",
      relatedPlaceIds: ["old-ruins"]
    },
    {
      id: "quest-final-dragon",
      title: "竜の谷への最終決戦",
      description: "すべての手がかりを集めた冒険者たちが、ついに竜の谷で伝説の秘宝と対面する。",
      order: 4,
      status: "未開始",
      questType: "メイン",
      difficulty: 5,
      rewards: ["竜の秘宝", "称号：竜退治の英雄", "経験値500", "金貨1000"],
      sessionId: "session-day-5",
      relatedPlaceIds: ["dragon-valley"]
    }
  ],

  // TRPGCharacter[] 形式 - Stormbringer仕様準拠
  characters: [
    {
      id: "char-1",
      name: "アレックス・ブレイブハート",
      characterType: "PC",
      profession: "戦士",
      gender: "男性",
      age: 22,
      nation: "リバーベント王国",
      religion: "光の神ルミナス",
      player: "プレイヤー1",
      description: "正義感の強い若き戦士。剣術の腕は一流。",
      scars: "左頬に小さな傷跡",
      attributes: {
        STR: 16,
        CON: 14,
        SIZ: 13,
        INT: 10,
        POW: 12,
        DEX: 11,
        CHA: 13
      },
      derived: {
        HP: 40,
        MP: 12,
        SW: 14,
        RES: 13
      },
      weapons: [
        {
          name: "鋼の剣",
          attack: 75,
          damage: "1d8+1d4",
          hit: 85,
          parry: 80,
          range: "接触"
        }
      ],
      armor: {
        head: 3,
        body: 6,
        leftArm: 4,
        rightArm: 4,
        leftLeg: 3,
        rightLeg: 3
      },
      skills: {
        AgilitySkills: [
          { name: "跳躍", value: 65 },
          { name: "登攀", value: 70 }
        ],
        CommunicationSkills: [
          { name: "説得", value: 60 },
          { name: "威圧", value: 70 }
        ],
        KnowledgeSkills: [
          { name: "戦術", value: 75 }
        ],
        ManipulationSkills: [
          { name: "盾", value: 80 }
        ],
        PerceptionSkills: [
          { name: "聞き耳", value: 65 },
          { name: "目星", value: 70 }
        ],
        StealthSkills: [
          { name: "隠れる", value: 40 }
        ],
        MagicSkills: [],
        WeaponSkills: [
          { name: "剣", value: 85 },
          { name: "盾", value: 80 }
        ]
      },
      imageUrl: "/images/human-warrior.jpg"
    },
    {
      id: "char-2",
      name: "エルフィン・シルバーリーフ",
      characterType: "PC",
      profession: "魔法使い",
      gender: "女性",
      age: 120,
      nation: "エルフの森",
      religion: "自然信仰",
      player: "プレイヤー1",
      description: "森の国から来た若きエルフの魔法使い。好奇心旺盛で冒険好き。",
      attributes: {
        STR: 8,
        CON: 10,
        SIZ: 9,
        INT: 18,
        POW: 16,
        DEX: 14,
        CHA: 15
      },
      derived: {
        HP: 25,
        MP: 40,
        SW: 16,
        RES: 16
      },
      weapons: [
        {
          name: "賢者の杖",
          attack: 45,
          damage: "1d6",
          hit: 60,
          parry: 50,
          range: "接触"
        }
      ],
      armor: {
        head: 0,
        body: 2,
        leftArm: 1,
        rightArm: 1,
        leftLeg: 1,
        rightLeg: 1
      },
      skills: {
        AgilitySkills: [
          { name: "跳躍", value: 45 }
        ],
        CommunicationSkills: [
          { name: "説得", value: 80 }
        ],
        KnowledgeSkills: [
          { name: "古代語", value: 90 },
          { name: "魔法学", value: 85 }
        ],
        ManipulationSkills: [
          { name: "呪文詠唱", value: 85 }
        ],
        PerceptionSkills: [
          { name: "魔法感知", value: 90 },
          { name: "目星", value: 75 }
        ],
        StealthSkills: [
          { name: "隠れる", value: 65 }
        ],
        MagicSkills: [
          { name: "火球術", value: 80 },
          { name: "治癒術", value: 70 },
          { name: "防護魔法", value: 75 }
        ],
        WeaponSkills: [
          { name: "杖", value: 60 }
        ]
      },
      imageUrl: "/images/elf-wizard.jpg"
    },
    {
      id: "char-3",
      name: "ライナ・シャドウブレード",
      characterType: "PC",
      profession: "盗賊",
      gender: "女性",
      age: 19,
      nation: "自由都市同盟",
      religion: "運命の女神フォルトゥナ",
      player: "プレイヤー1",
      description: "盗賊ギルド出身の敏捷な女盗賊。隠密と罠解除の専門家。",
      scars: "右手首に古い火傷の跡",
      attributes: {
        STR: 10,
        CON: 12,
        SIZ: 8,
        INT: 14,
        POW: 11,
        DEX: 18,
        CHA: 13
      },
      derived: {
        HP: 30,
        MP: 11,
        SW: 18,
        RES: 12
      },
      weapons: [
        {
          name: "影の短剣",
          attack: 80,
          damage: "1d6+2",
          hit: 90,
          parry: 70,
          range: "接触"
        }
      ],
      armor: {
        head: 1,
        body: 3,
        leftArm: 2,
        rightArm: 2,
        leftLeg: 2,
        rightLeg: 2
      },
      skills: {
        AgilitySkills: [
          { name: "跳躍", value: 85 },
          { name: "登攀", value: 90 },
          { name: "軽業", value: 95 }
        ],
        CommunicationSkills: [
          { name: "話術", value: 70 }
        ],
        KnowledgeSkills: [
          { name: "街の知識", value: 80 }
        ],
        ManipulationSkills: [
          { name: "鍵開け", value: 90 },
          { name: "罠解除", value: 85 },
          { name: "スリ", value: 80 }
        ],
        PerceptionSkills: [
          { name: "聞き耳", value: 85 },
          { name: "目星", value: 90 },
          { name: "罠発見", value: 88 }
        ],
        StealthSkills: [
          { name: "隠れる", value: 95 },
          { name: "忍び歩き", value: 90 }
        ],
        MagicSkills: [],
        WeaponSkills: [
          { name: "短剣", value: 85 },
          { name: "投擲", value: 75 }
        ]
      },
      imageUrl: "/images/halfling-rogue.jpg"
    }
  ],

  // WorldBuilding 形式
  worldBuilding: {
    id: "world-001",
    setting: [
      {
        id: "setting-001",
        name: "リバーベント街の世界",
        description: "中世ファンタジー世界。魔法と剣の時代で、古代文明の遺跡が各地に残っている。",
        history: "かつては古代竜が世界を支配していたが、現在は人間を中心とした多種族社会が築かれている。"
      }
    ],
    worldmaps: [],
    rules: [],
    places: [
      {
        id: "place-riverbent",
        name: "リバーベント街",
        type: "place",
        originalType: "place",
        description: "交易で栄える川沿いの大きな街。多くの商人や冒険者が集まる場所。",
        features: "金の竪琴亭、エルフの万屋、商人ギルド",
        importance: "主要拠点",
        relations: "翠の森道、ハーベスト村への中継地点",
        location: "中央平原",
        population: "約8000人",
        culturalFeatures: "多種族が共存する商業都市"
      }
    ],
    cultures: [],
    geographyEnvironment: [
      {
        id: "geo-central-plains",
        name: "中央平原",
        type: "geography_environment", 
        originalType: "geography_environment",
        description: "肥沃な平原地帯。リバーベント街やハーベスト村がある。",
        features: "川、街道、農地",
        importance: "主要な居住地域",
        relations: "翠の大森林、ドラゴンバック山脈に囲まれている"
      }
    ],
    historyLegend: [
      {
        id: "legend-ancient-dragon",
        name: "古代竜の伝説",
        type: "history_legend",
        originalType: "history_legend", 
        description: "竜の谷に眠る古代竜ヴェルダリオンの伝説",
        features: "莫大な財宝、古代の秘宝",
        importance: "キャンペーンの中核となる伝説",
        period: "古代（約1000年前）",
        significantEvents: "古代竜の最後の戦い、秘宝の隠匿",
        consequences: "現在も冒険者たちが秘宝を求めて竜の谷を目指す",
        relations: "竜の谷、古代文明の遺跡"
      }
    ],
    magicTechnology: [],
    stateDefinition: [],
    freeFields: []
  },

  timeline: [],
  sessions: [],
  
  // EnemyCharacter[] 形式
  enemies: [
    {
      id: "bandit-leader",
      name: "盗賊団の頭領",
      rank: "中ボス",
      type: "人間",
      description: "翠の森道を根城にする盗賊団のリーダー。狡猾で剣の腕は確か。",
      level: 3,
      attributes: {
        strength: 14,
        dexterity: 16,
        constitution: 13,
        intelligence: 12,
        wisdom: 11
      },
      derivedStats: {
        hp: 45,
        mp: 10,
        attack: 12,
        defense: 8,
        magicAttack: 5,
        magicDefense: 6,
        accuracy: 75,
        evasion: 65,
        criticalRate: 10,
        initiative: 16
      },
      skills: {
        basicAttack: "短剣による斬撃",
        specialSkills: [
          {
            name: "急所狙い",
            effect: "ダメージ+50%、クリティカル率+20%",
            cost: "3MP",
            cooldown: 2
          },
          {
            name: "煙玉逃走",
            effect: "戦闘から逃走、成功率80%",
            cost: "5MP",
            cooldown: 5
          }
        ],
        passives: ["隠密行動", "森林での優位性"]
      },
      behavior: {
        aiPattern: "HP50%以下で煙玉逃走を使用",
        targeting: "最も攻撃力の高いPCを優先的に狙う"
      },
      drops: {
        exp: 50,
        gold: 20,
        items: ["盗賊の地図", "治療薬"],
        rareDrops: ["盗賊団の印章"]
      },
      status: {
        currentHp: 45,
        currentMp: 10,
        statusEffects: [],
        location: "翠の森道"
      }
    },
    {
      id: "ancient-guardian",
      name: "古代の守護者",
      rank: "ボス",
      type: "構築体",
      description: "忘却の遺跡を守る石造りの自動人形。古代魔法で動いている。",
      level: 5,
      attributes: {
        strength: 18,
        dexterity: 8,
        constitution: 16,
        intelligence: 6,
        wisdom: 12
      },
      derivedStats: {
        hp: 80,
        mp: 30,
        attack: 15,
        defense: 18,
        magicAttack: 12,
        magicDefense: 15,
        accuracy: 60,
        evasion: 20,
        criticalRate: 5,
        initiative: 8
      },
      skills: {
        basicAttack: "石の拳による強打",
        specialSkills: [
          {
            name: "魔法の盾",
            effect: "防御力+50%、3ターン持続",
            cost: "8MP",
            cooldown: 4
          },
          {
            name: "大地震動",
            effect: "全体攻撃、威力120%",
            cost: "12MP",
            cooldown: 6
          }
        ],
        passives: ["物理耐性", "魔法構築体"]
      },
      behavior: {
        aiPattern: "HP30%以下で魔法の盾を使用、複数の敵がいる場合は大地震動を優先",
        targeting: "最も近い敵を優先的に攻撃"
      },
      drops: {
        exp: 100,
        gold: 0,
        items: ["古代の結晶", "魔法の粉末"],
        rareDrops: ["古代守護者の核"]
      },
      status: {
        currentHp: 80,
        currentMp: 30,
        statusEffects: [],
        location: "忘却の遺跡"
      }
    }
  ],

  // NPCCharacter[] 形式
  npcs: [
    {
      id: "npc-innkeeper",
      name: "バルトス",
      characterType: "NPC",
      profession: "宿屋の主人",
      gender: "男性",
      age: 45,
      nation: "リバーベント王国",
      religion: "商業神メルカト",
      player: "GM",
      description: "金の竪琴亭の陽気な主人。元冒険者で情報通。",
      attributes: {
        STR: 13,
        CON: 14,
        SIZ: 14,
        INT: 12,
        POW: 10,
        DEX: 11,
        CHA: 16
      },
      derived: {
        HP: 32,
        MP: 10,
        SW: 12,
        RES: 12
      },
      weapons: [
        {
          name: "酒場の棍棒",
          attack: 60,
          damage: "1d6+1",
          hit: 65,
          parry: 55,
          range: "接触"
        }
      ],
      armor: {
        head: 0,
        body: 2,
        leftArm: 1,
        rightArm: 1,
        leftLeg: 1,
        rightLeg: 1
      },
      skills: {
        AgilitySkills: [],
        CommunicationSkills: [
          { name: "話術", value: 85 },
          { name: "説得", value: 70 }
        ],
        KnowledgeSkills: [
          { name: "街の知識", value: 90 },
          { name: "冒険者の知識", value: 75 }
        ],
        ManipulationSkills: [
          { name: "料理", value: 80 }
        ],
        PerceptionSkills: [
          { name: "聞き耳", value: 75 },
          { name: "人物観察", value: 80 }
        ],
        StealthSkills: [],
        MagicSkills: [],
        WeaponSkills: [
          { name: "棍棒", value: 65 }
        ]
      },
      location: "リバーベント街",
      occupation: "宿屋の主人",
      attitude: "friendly",
      knowledge: ["街の噂", "冒険者の動向", "盗賊団の情報"],
      services: ["宿泊", "情報収集", "食事提供"],
      questIds: ["quest-info-gathering"],
      dialoguePatterns: [
        "おう、冒険者か！今日も賑やかだなぁ！",
        "最近、森の方で盗賊が出るって噂だ。気をつけな。",
        "また来いよ！いつでも部屋は空けとくぜ！"
      ]
    }
  ],

  bases: [
    {
      id: "town-center",
      name: "リバーベント街",
      type: "都市",
      region: "中央平原",
      description: "交易で栄える川沿いの大きな街。多くの商人や冒険者が集まる場所。",
      rank: "中規模都市",
      importance: "主要拠点",
      facilities: {
        inn: {
          name: "金の竪琴亭",
          pricePerNight: 50,
          description: "評判の良い宿屋。情報収集の拠点としても有名。",
          services: ["休息", "情報収集", "装備修理"]
        },
        shops: [
          {
            name: "エルフの万屋",
            type: "一般商店",
            items: ["日用品", "旅行用品", "薬草"],
            priceModifier: 1.0,
            description: "何でも揃う便利な店"
          }
        ]
      },
      npcs: [],
      features: {
        fastTravel: true,
        playerBase: true,
        questHub: true,
        defenseEvent: false
      },
      threats: {
        dangerLevel: "低",
        monsterAttackRate: 0.1,
        playerReputation: 50,
        currentEvents: ["商人祭り開催中"],
        controllingFaction: "商人ギルド"
      },
      economy: {
        currency: "金貨",
        priceModifier: 1.0,
        localGoods: ["川魚", "絹織物", "工芸品"],
        tradeGoods: ["香辛料", "魔法具", "武器"]
      },
      // TRPGセッション用: 拠点向け行動可能リスト
      availableActions: [
        {
          id: "action-shop",
          name: "装備品を購入する",
          description: "街の商店で武器、防具、アイテムを購入できます",
          category: "shopping"
        },
        {
          id: "action-inn",
          name: "宿屋で休息する",
          description: "金の竪琴亭でHPとMPを回復し、情報収集もできます",
          category: "rest"
        },
        {
          id: "action-talk-npc",
          name: "街の住民と会話する",
          description: "商人や冒険者と話して情報や噂を集められます",
          category: "social"
        },
        {
          id: "action-guild",
          name: "冒険者ギルドを訪問する",
          description: "依頼の確認や新たなクエストを受注できます",
          category: "quest"
        },
        {
          id: "action-temple",
          name: "神殿で祈りを捧げる",
          description: "状態異常の治癒や祝福を受けることができます",
          category: "rest"
        },
        {
          id: "action-training",
          name: "訓練場で鍛錬する",
          description: "スキルの向上や新しい技能を習得できます",
          category: "training"
        }
      ],
      meta: {
        locationId: "town-center",
        unlocked: true,
        lastUpdated: "2024-01-01T00:00:00.000Z"
      },
      imageUrl: "/images/town-center.jpg"
    },
    // フィールド・探索エリア
    {
      id: "forest-path",
      name: "翠の森道",
      type: "森",
      region: "リバーベント街郊外",
      description: "街を出てすぐの森の小道。商人がよく通るが、時折盗賊や野生動物が出没する。",
      rank: "初級探索エリア",
      importance: "サブ拠点",
      facilities: {},
      npcs: [],
      features: {
        fastTravel: false,
        playerBase: false,
        questHub: false,
        defenseEvent: false
      },
      threats: {
        dangerLevel: "中",
        monsterAttackRate: 0.4,
        playerReputation: 0,
        currentEvents: ["盗賊団の噂"],
        controllingFaction: "なし"
      },
      economy: {
        currency: "金貨",
        priceModifier: 1.0,
        localGoods: [],
        tradeGoods: []
      },
      // TRPGセッション用: フィールド向け行動可能リスト
      availableActions: [
        {
          id: "action-explore-forest",
          name: "森を探索する",
          description: "木々の間を注意深く進み、隠された道や宝物を探します",
          category: "exploration"
        },
        {
          id: "action-hunt-monsters",
          name: "モンスターを狩る",
          description: "この地域に潜むゴブリンや狼などの敵を積極的に探します",
          category: "exploration"
        },
        {
          id: "action-gather-herbs",
          name: "薬草を採取する",
          description: "森に自生する薬草や材料を集めます",
          category: "exploration"
        },
        {
          id: "action-track-bandits",
          name: "盗賊の痕跡を追う",
          description: "噂の盗賊団の手がかりを探します",
          category: "exploration"
        },
        {
          id: "action-setup-camp",
          name: "野営の準備をする",
          description: "安全な場所を確保して一時的な休息を取ります",
          category: "rest"
        },
        {
          id: "action-retreat",
          name: "街に戻る",
          description: "リバーベント街に安全に戻ります",
          category: "custom"
        }
      ],
      meta: {
        locationId: "forest-path",
        unlocked: true,
        lastUpdated: "2024-01-01T00:00:00.000Z"
      },
      imageUrl: "/images/forest-path.jpg"
    },
    // ダンジョン
    {
      id: "ancient-ruins",
      name: "忘却の遺跡",
      type: "遺跡",
      region: "古代の地",
      description: "古代文明の謎を秘めた石造りの遺跡。魔法の罠と貴重な宝物が眠っている。",
      rank: "上級探索エリア",
      importance: "隠し拠点",
      facilities: {},
      npcs: [],
      features: {
        fastTravel: false,
        playerBase: false,
        questHub: false,
        defenseEvent: false
      },
      threats: {
        dangerLevel: "高",
        monsterAttackRate: 0.7,
        playerReputation: 0,
        currentEvents: ["古代の魔法が活性化"],
        controllingFaction: "なし"
      },
      economy: {
        currency: "金貨",
        priceModifier: 1.0,
        localGoods: [],
        tradeGoods: []
      },
      // TRPGセッション用: ダンジョン向け行動可能リスト
      availableActions: [
        {
          id: "action-investigate-ruins",
          name: "遺跡を詳しく調べる",
          description: "古代の文字や装置を解読し、秘密を解き明かします",
          category: "exploration"
        },
        {
          id: "action-disarm-traps",
          name: "罠を解除する",
          description: "古代の魔法的な罠を慎重に無力化します",
          category: "exploration"
        },
        {
          id: "action-fight-guardians",
          name: "守護者と戦う",
          description: "遺跡を守る古代の守護者や魔物と戦闘します",
          category: "exploration"
        },
        {
          id: "action-search-treasure",
          name: "宝物を探す",
          description: "隠された宝箱や貴重なアーティファクトを探します",
          category: "exploration"
        },
        {
          id: "action-study-magic",
          name: "古代魔法を学ぶ",
          description: "遺跡に残された魔法の知識を習得します",
          category: "exploration"
        },
        {
          id: "action-escape-ruins",
          name: "遺跡から脱出する",
          description: "危険を感じたら安全な場所へ退避します",
          category: "custom"
        }
      ],
      meta: {
        locationId: "ancient-ruins",
        unlocked: false,
        lastUpdated: "2024-01-01T00:00:00.000Z"
      },
      imageUrl: "/images/ancient-ruins.jpg"
    }
  ],

  // Item[] 形式 - 簡素化されたテストデータ
  items: [] as any[],

  // ItemLocation[] 形式
  itemLocations: [
    {
      id: "location-healing-potion-shop",
      itemId: "item-healing-potion",
      locationType: "shop",
      locationId: "town-center",
      locationName: "エルフの万屋",
      availability: "always",
      price: 50,
      currency: "金貨",
      notes: "常時在庫あり。まとめ買い割引あり。"
    },
    {
      id: "location-mana-potion-shop",
      itemId: "item-mana-potion",
      locationType: "shop",
      locationId: "town-center",
      locationName: "エルフの万屋",
      availability: "always",
      price: 40,
      currency: "金貨",
      notes: "常時在庫あり。魔法使いに人気。"
    },
    {
      id: "location-iron-sword-shop",
      itemId: "item-iron-sword",
      locationType: "shop",
      locationId: "town-center",
      locationName: "武器屋『剣と盾』",
      availability: "always",
      price: 150,
      currency: "金貨",
      notes: "標準的な武器。初心者にオススメ。"
    },
    {
      id: "location-leather-armor-shop",
      itemId: "item-leather-armor",
      locationType: "shop",
      locationId: "town-center",
      locationName: "防具屋『鉄壁』",
      availability: "always",
      price: 100,
      currency: "金貨",
      notes: "軽装備好みの冒険者に人気。"
    },
    {
      id: "location-ancient-key-event",
      itemId: "item-ancient-key",
      locationType: "event",
      locationId: "forest-path",
      locationName: "翠の森道",
      availability: "quest_locked",
      requirements: [
        {
          type: "quest_complete",
          value: "quest-forest-bandits",
          description: "盗賊団を倒す必要あり"
        }
      ],
      notes: "盗賊団の頭領が隠し持っている。"
    },
    {
      id: "location-dragon-scale-loot",
      itemId: "item-dragon-scale",
      locationType: "loot",
      locationId: "dragon-valley",
      locationName: "竜の谷",
      availability: "quest_locked",
      requirements: [
        {
          type: "quest_complete",
          value: "quest-final-dragon",
          description: "竜を倒す必要あり"
        }
      ],
      notes: "竜を倒した際のドロップアイテム。"
    },
    {
      id: "location-silver-ring-shop",
      itemId: "item-silver-ring",
      locationType: "shop",
      locationId: "town-center",
      locationName: "宝石店『ダイヤモンドの輝き』",
      availability: "limited",
      price: 300,
      currency: "金貨",
      notes: "在庫限定。売り切れることあり。"
    },
    {
      id: "location-magic-scroll-shop",
      itemId: "item-magic-scroll",
      locationType: "shop",
      locationId: "town-center",
      locationName: "魔法店『賢者の書斎』",
      availability: "always",
      price: 120,
      currency: "金貨",
      notes: "魔法使いの必需品。他の属性もあり。"
    },
    {
      id: "location-mythril-sword-reward",
      itemId: "item-mythril-sword",
      locationType: "reward",
      locationId: "ancient-ruins",
      locationName: "忘却の遺跡",
      availability: "quest_locked",
      requirements: [
        {
          type: "quest_complete",
          value: "quest-ancient-ruins",
          description: "遺跡の謎を解く必要あり"
        }
      ],
      notes: "古代の宝物庫に眠る伝説の武器。"
    },
    {
      id: "location-village-pass-quest",
      itemId: "item-village-pass",
      locationType: "reward",
      locationId: "town-center",
      locationName: "リバーベント街",
      availability: "quest_locked",
      requirements: [
        {
          type: "quest_complete",
          value: "quest-village-request",
          description: "村長の依頼を受ける必要あり"
        }
      ],
      notes: "村長から直接受け取る。"
    }
  ],

  rules: [],
  handouts: [],
  feedback: []
};

export default testCampaignData;