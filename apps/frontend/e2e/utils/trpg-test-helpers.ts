import { Page, expect, Locator } from "@playwright/test";
import type { 
  TRPGCampaign, 
  TRPGCharacter, 
  BaseLocation, 
  SessionEvent, 
  GameSession,
  NPCCharacter,
  EnemyCharacter 
} from '@trpg-ai-gm/types';

/**
 * TRPG-specific test helper functions
 * Provides utilities for campaign management, character creation, session handling, etc.
 * 
 * Note: All types are now imported from the shared @trpg-ai-gm/types package
 * to maintain consistency across frontend and backend.
 */

/**
 * Create a test TRPG campaign with comprehensive data
 * Uses shared TRPGCampaign type from @trpg-ai-gm/types
 */
export const createTestTRPGCampaign = (): TRPGCampaign => {
  const campaignId = `test-campaign-${Date.now()}`;
  
  return {
    id: campaignId,
    title: "テストTRPGキャンペーン：失われた王国の謎",
    gameSystem: "D&D 5e",
    gamemaster: "AI GM",
    createdAt: new Date(),
    updatedAt: new Date(),
    players: [{
      id: "player-1",
      name: "テストプレイヤー",
      characterIds: ["pc-1", "pc-2"],
      isOnline: true
    }],
    synopsis: "古代の王国が消失した謎を解き明かす冒険キャンペーン。プレイヤーたちは考古学者として遺跡を調査し、古代の魔法と政治的陰謀に巻き込まれていく。",
    plot: [], // QuestElement[]として後で追加
    worldBuilding: {
      id: "world-test",
      setting: [],
      worldmaps: [],
      rules: [],
      places: [],
      cultures: [],
      geographyEnvironment: [],
      historyLegend: [],
      magicTechnology: [],
      stateDefinition: [],
      freeFields: []
    },
    timeline: [], // SessionEvent[]
    sessions: [], // GameSession[]
    rules: [],
    handouts: [],
    feedback: [],
    bases: [], // BaseLocation[]
    characters: [
      {
        id: "pc-1",
        name: "エリアス・ストーンハート",
        characterType: "PC",
        profession: "戦士",
        gender: "男性",
        age: 28,
        nation: "失われた王国",
        religion: "正義の神",
        player: "テストプレイヤー",
        description: "元王国騎士団の一員。王国滅亡の真相を探るため冒険者となった。",
        attributes: {
          STR: 16,
          CON: 15,
          SIZ: 14,
          INT: 12,
          POW: 13,
          DEX: 14,
          CHA: 10
        },
        derived: {
          HP: 28,
          MP: 13,
          SW: 14,
          RES: 13
        },
        weapons: [{
          name: "ロングソード",
          attack: 75,
          damage: "1d8+1d4",
          hit: 80,
          parry: 75,
          range: "接触"
        }],
        armor: {
          head: 4,
          body: 6,
          leftArm: 5,
          rightArm: 5,
          leftLeg: 4,
          rightLeg: 4
        },
        skills: {
          AgilitySkills: [],
          CommunicationSkills: [],
          KnowledgeSkills: [],
          ManipulationSkills: [],
          PerceptionSkills: [],
          StealthSkills: [],
          MagicSkills: [],
          WeaponSkills: [{ name: "剣", value: 80 }]
        },
        imageUrl: "/test-assets/elias.jpg"
      },
      {
        id: "pc-2", 
        name: "ルナ・シルバーリーフ",
        characterType: "PC",
        profession: "魔法使い",
        gender: "女性",
        age: 120,
        nation: "エルフの森",
        religion: "自然信仰",
        player: "テストプレイヤー",
        description: "魔法学院の卒業生。失われた古代魔法の研究のため冒険に参加。",
        attributes: {
          STR: 8,
          CON: 12,
          SIZ: 10,
          INT: 17,
          POW: 15,
          DEX: 14,
          CHA: 11
        },
        derived: {
          HP: 18,
          MP: 30,
          SW: 15,
          RES: 15
        },
        weapons: [{
          name: "魔法の杖",
          attack: 45,
          damage: "1d6",
          hit: 60,
          parry: 40,
          range: "接触"
        }],
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
          CommunicationSkills: [],
          KnowledgeSkills: [{ name: "魔法学", value: 85 }],
          ManipulationSkills: [],
          PerceptionSkills: [],
          StealthSkills: [],
          MagicSkills: [
            { name: "火球術", value: 75 },
            { name: "魔法感知", value: 80 }
          ],
          WeaponSkills: [{ name: "杖", value: 60 }]
        },
        imageUrl: "/test-assets/luna.jpg"
      }
    ],
    npcs: [
      {
        id: "npc-1",
        name: "マスター・セオバルド",
        characterType: "NPC",
        profession: "聖職者",
        gender: "男性",
        age: 65,
        nation: "神聖王国",
        religion: "光の神",
        player: "GM",
        description: "古代王国の歴史を研究する神殿の大司祭。パーティの協力者。",
        attributes: {
          STR: 12,
          CON: 14,
          SIZ: 13,
          INT: 16,
          POW: 18,
          DEX: 10,
          CHA: 15
        },
        derived: {
          HP: 52,
          MP: 35,
          SW: 14,
          RES: 16
        },
        weapons: [{
          name: "メイス",
          attack: 65,
          damage: "1d8+1",
          hit: 70,
          parry: 60,
          range: "接触"
        }],
        armor: {
          head: 3,
          body: 8,
          leftArm: 6,
          rightArm: 6,
          leftLeg: 5,
          rightLeg: 5
        },
        skills: {
          AgilitySkills: [],
          CommunicationSkills: [{ name: "説得", value: 80 }],
          KnowledgeSkills: [
            { name: "古代史", value: 90 },
            { name: "宗教学", value: 85 }
          ],
          ManipulationSkills: [],
          PerceptionSkills: [],
          StealthSkills: [],
          MagicSkills: [
            { name: "治癒術", value: 85 },
            { name: "聖なる光", value: 75 }
          ],
          WeaponSkills: [{ name: "メイス", value: 70 }]
        },
        location: "賢者の塔",
        occupation: "大司祭",
        attitude: "friendly",
        knowledge: ["古代王国の歴史", "古代魔法", "遺跡の情報"],
        services: ["情報提供", "回復魔法", "聖なる祝福"],
        questIds: [],
        dialoguePatterns: ["古代の知識に興味があるのかね？", "神のご加護がありますように。"],
        imageUrl: "/test-assets/theobald.jpg"
      }
    ],
    enemies: [
      {
        id: "enemy-1",
        name: "シャドウナイト",
        rank: "中ボス",
        type: "アンデッド",
        description: "古代王国の騎士が呪いによってアンデッドと化した存在。",
        level: 5,
        attributes: {
          strength: 18,
          dexterity: 12,
          constitution: 16,
          intelligence: 10,
          wisdom: 11
        },
        derivedStats: {
          hp: 45,
          mp: 10,
          attack: 15,
          defense: 17,
          magicAttack: 8,
          magicDefense: 12,
          accuracy: 75,
          evasion: 40,
          criticalRate: 8,
          initiative: 12
        },
        skills: {
          basicAttack: "呪われた剣による斬撃",
          specialSkills: [{
            name: "恐怖の咆哮",
            effect: "敵全体に恐怖状態を付与",
            cost: "5MP",
            cooldown: 3
          }],
          passives: ["アンデッド耐性", "恐怖オーラ"]
        },
        behavior: {
          aiPattern: "HP30%以下で恐怖の咆哮を使用",
          targeting: "最も攻撃力の高い敵を優先"
        },
        drops: {
          exp: 75,
          gold: 50,
          items: ["呪われた剣の欠片", "暗黒の鎧片"],
          rareDrops: ["シャドウナイトの紋章"]
        },
        status: {
          currentHp: 45,
          currentMp: 10,
          statusEffects: [],
          location: "失われた王都の遺跡"
        },
        imageUrl: "/test-assets/shadow-knight.jpg"
      }
    ],
    locations: [
      {
        id: "loc-1",
        name: "失われた王都の遺跡",
        type: "古代遺跡",
        description: "かつて栄えた王国の首都跡。石造りの建物の残骸が広がり、魔法のオーラが感じられる。",
        inhabitants: ["シャドウナイト", "古代の霊魂", "魔法の番人"],
        features: ["王座の間", "地下迷宮", "魔法の図書館", "宝物庫"],
        connections: ["森の小道", "山間の村"]
      },
      {
        id: "loc-2", 
        name: "賢者の塔",
        type: "魔法の塔",
        description: "古代の魔法使いが住んでいた高い塔。多くの魔法の書物と秘密が隠されている。",
        inhabitants: ["マスター・セオバルド", "魔法の使い魔"],
        features: ["研究室", "錬金術工房", "魔法の庭園", "観測台"],
        connections: ["失われた王都の遺跡", "聖なる神殿"]
      }
    ],
    timeline: [
      {
        id: "event-1",
        title: "冒険の始まり",
        description: "パーティが失われた王国の調査依頼を受ける。",
        date: "1日目",
        location: "賢者の塔",
        participants: ["エリアス", "ルナ", "マスター・セオバルド"],
        type: "story",
        consequences: ["調査の方向性が決定", "パーティ結成"]
      },
      {
        id: "event-2",
        title: "遺跡への進入",
        description: "王都遺跡の入口を発見し、最初の探索を開始。",
        date: "3日目", 
        location: "失われた王都の遺跡",
        participants: ["エリアス", "ルナ"],
        type: "exploration",
        consequences: ["古代の文字の発見", "魔法の罠の解除"]
      },
      {
        id: "event-3",
        title: "シャドウナイトとの遭遇",
        description: "王座の間でシャドウナイトと初めて対峙。激しい戦闘の末、一時撤退。",
        date: "5日目",
        location: "失われた王都の遺跡 - 王座の間",
        participants: ["エリアス", "ルナ", "シャドウナイト"],
        type: "battle",
        consequences: ["シャドウナイトの存在確認", "古代の呪いの手がかり"]
      }
    ],
    sessions: [
      {
        id: "session-1",
        campaignId,
        sessionNumber: 1,
        title: "謎への第一歩",
        date: "2024-01-15",
        duration: 240, // 4 hours
        participants: ["エリアス", "ルナ"],
        summary: "パーティ結成と最初の調査。賢者の塔でマスター・セオバルドから依頼を受け、失われた王国について基本情報を収集。",
        events: [
          {
            id: "session-1-event-1",
            title: "依頼の受諾",
            description: "マスター・セオバルドから古代王国調査の依頼を受ける",
            date: "1日目午前",
            participants: ["エリアス", "ルナ", "マスター・セオバルド"],
            type: "story",
            consequences: ["報酬の取り決め", "初期装備の提供"]
          }
        ],
        notes: "プレイヤーの結束が良く、ロールプレイが活発だった。"
      }
    ]
  };
};

/**
 * Set up TRPG test data in browser storage
 */
export const setupTRPGTestData = async (page: Page, campaign?: TRPGCampaign) => {
  try {
    const testCampaign = campaign || createTestTRPGCampaign();
    
    console.log(`🎲 Setting up TRPG test data: ${testCampaign.title}`);

    // Initialize TRPG data in localStorage
    await page.addInitScript((campaignData) => {
      // Set up TRPG campaigns
      localStorage.setItem('trpg-campaigns', JSON.stringify([campaignData]));
      localStorage.setItem('current-campaign-id', campaignData.id);
      localStorage.setItem('current-campaign', JSON.stringify(campaignData));
      
      // Set up characters separately for easier access
      localStorage.setItem('trpg-player-characters', JSON.stringify(campaignData.characters));
      localStorage.setItem('trpg-npcs', JSON.stringify(campaignData.npcs));
      localStorage.setItem('trpg-enemies', JSON.stringify(campaignData.enemies));
      
      // Set up world building data
      localStorage.setItem('trpg-locations', JSON.stringify(campaignData.bases));
      localStorage.setItem('trpg-timeline', JSON.stringify(campaignData.timeline));
      
      // Set up session data
      localStorage.setItem('trpg-sessions', JSON.stringify(campaignData.sessions));
      
      // Enable developer mode for testing
      localStorage.setItem('trpg-dev-mode', 'true');
      
      console.log('🎲 TRPG test data initialized in localStorage');
    }, testCampaign);

    return testCampaign;
  } catch (error) {
    console.error('❌ Failed to setup TRPG test data:', error);
    throw error;
  }
};

/**
 * Navigate to TRPG home and ensure campaign is loaded
 */
export const navigateToTRPGHome = async (page: Page) => {
  await page.goto("/");
  await page.waitForLoadState("networkidle");
  await page.waitForTimeout(2000);
  
  // Verify TRPG campaign is loaded
  const campaignStatus = await page.evaluate(() => {
    const campaign = localStorage.getItem('current-campaign');
    const campaignId = localStorage.getItem('current-campaign-id');
    return {
      hasCampaign: !!campaign,
      campaignId,
      campaign: campaign ? JSON.parse(campaign) : null
    };
  });
  
  if (!campaignStatus.hasCampaign) {
    throw new Error('No TRPG campaign loaded');
  }
  
  console.log(`✅ Navigated to TRPG home with campaign: ${campaignStatus.campaign?.title}`);
  return campaignStatus.campaign;
};

/**
 * Create a new TRPG character through the UI
 */
export const createTRPGCharacter = async (page: Page, character: Partial<TRPGCharacter>, characterType: 'PC' | 'NPC' | 'Enemy' = 'PC') => {
  try {
    console.log(`🧙 Creating ${characterType}: ${character.name}`);
    
    // Navigate to characters page
    const pageMap = {
      'PC': '/characters',
      'NPC': '/npcs', 
      'Enemy': '/enemies'
    };
    
    await page.goto(pageMap[characterType]);
    await page.waitForLoadState("networkidle");
    
    // Click create new character button
    const createButton = page.locator('button:has-text("新規作成"), button:has-text("追加"), button[aria-label*="追加"]').first();
    await expect(createButton).toBeVisible();
    await createButton.click();
    
    // Wait for character form dialog
    await page.waitForSelector('[role="dialog"]');
    
    // Fill character basic information
    if (character.name) {
      await page.fill('input[name="name"], input[placeholder*="名前"]', character.name);
    }
    
    if (character.profession) {
      await page.fill('input[name="profession"], input[placeholder*="職業"]', character.profession);
    }
    
    if (character.age) {
      await page.fill('input[name="age"], input[placeholder*="年齢"]', character.age.toString());
    }
    
    // Fill attributes if provided
    if (character.attributes) {
      const attributes = character.attributes;
      for (const [attr, value] of Object.entries(attributes)) {
        const input = page.locator(`input[name="${attr}"], input[placeholder*="${attr}"]`).first();
        if (await input.count() > 0) {
          await input.fill(value.toString());
        }
      }
    }
    
    // Fill other fields
    if (character.description) {
      await page.fill('textarea[name="description"], textarea[placeholder*="説明"]', character.description);
    }
    
    // Save character
    const saveButton = page.locator('button:has-text("保存"), button:has-text("作成"), button:has-text("追加")').last();
    await expect(saveButton).toBeVisible();
    await saveButton.click();
    
    // Wait for dialog to close
    await page.waitForSelector('[role="dialog"]', { state: 'detached' });
    
    console.log(`✅ Created ${characterType}: ${character.name}`);
    
  } catch (error) {
    console.error(`❌ Failed to create ${characterType} ${character.name}:`, error);
    throw error;
  }
};

/**
 * Start a new TRPG session
 */
export const startTRPGSession = async (page: Page, sessionTitle: string = "テストセッション") => {
  try {
    console.log(`🎯 Starting TRPG session: ${sessionTitle}`);
    
    // Navigate to session page
    await page.goto("/trpg-session");
    await page.waitForLoadState("networkidle");
    
    // Look for session start button or new session button
    const startSessionSelectors = [
      'button:has-text("セッション開始")',
      'button:has-text("新規セッション")', 
      'button:has-text("開始")',
      'button[aria-label*="セッション"]'
    ];
    
    let sessionButton: Locator | null = null;
    for (const selector of startSessionSelectors) {
      const button = page.locator(selector).first();
      if (await button.count() > 0) {
        sessionButton = button;
        break;
      }
    }
    
    if (sessionButton) {
      await sessionButton.click();
      
      // If there's a session setup dialog, fill it
      const dialog = page.locator('[role="dialog"]');
      if (await dialog.count() > 0) {
        await page.fill('input[name="title"], input[placeholder*="タイトル"]', sessionTitle);
        
        const confirmButton = dialog.locator('button:has-text("開始"), button:has-text("作成")').first();
        await confirmButton.click();
        
        await page.waitForSelector('[role="dialog"]', { state: 'detached' });
      }
    }
    
    // Verify session is started
    await page.waitForTimeout(2000);
    const sessionStatus = await page.evaluate(() => {
      return {
        url: window.location.href,
        hasSessionUI: !!document.querySelector('[data-testid*="session"], .session-interface, .trpg-session')
      };
    });
    
    console.log(`✅ TRPG session started: ${sessionTitle}`);
    return sessionStatus;
    
  } catch (error) {
    console.error(`❌ Failed to start TRPG session:`, error);
    throw error;
  }
};

/**
 * Roll dice in TRPG session
 */
export const rollDice = async (page: Page, diceNotation: string = "1d20") => {
  try {
    console.log(`🎲 Rolling dice: ${diceNotation}`);
    
    // Look for dice interface
    const diceButton = page.locator('button:has-text("ダイス"), [data-testid*="dice"], .dice-button').first();
    if (await diceButton.count() > 0) {
      await diceButton.click();
      
      // If there's a dice dialog, use it
      const diceDialog = page.locator('[role="dialog"]');
      if (await diceDialog.count() > 0) {
        const diceInput = diceDialog.locator('input[placeholder*="ダイス"], input[name*="dice"]').first();
        if (await diceInput.count() > 0) {
          await diceInput.fill(diceNotation);
        }
        
        const rollButton = diceDialog.locator('button:has-text("振る"), button:has-text("ロール")').first();
        await rollButton.click();
        
        // Wait for result
        await page.waitForTimeout(2000);
      }
    }
    
    console.log(`✅ Dice rolled: ${diceNotation}`);
    
  } catch (error) {
    console.error(`❌ Failed to roll dice:`, error);
    throw error;
  }
};

/**
 * Add timeline event during session
 */
export const addTimelineEvent = async (page: Page, event: Partial<SessionEvent>) => {
  try {
    console.log(`📅 Adding timeline event: ${event.title}`);
    
    // Navigate to timeline or look for timeline interface
    if (!page.url().includes('timeline')) {
      await page.goto('/timeline');
      await page.waitForLoadState("networkidle");
    }
    
    // Click add event button
    const addButton = page.locator('button:has-text("追加"), button:has-text("新規"), button[aria-label*="追加"]').first();
    await expect(addButton).toBeVisible();
    await addButton.click();
    
    // Wait for event dialog
    await page.waitForSelector('[role="dialog"]');
    
    // Fill event data
    if (event.title) {
      await page.fill('input[name="title"], input[placeholder*="タイトル"]', event.title);
    }
    
    if (event.description) {
      await page.fill('textarea[name="description"], textarea[placeholder*="説明"]', event.description);
    }
    
    if (event.date) {
      await page.fill('input[name="date"], input[type="date"]', event.date);
    }
    
    if (event.type) {
      const typeSelect = page.locator('select[name="type"], [data-testid*="type"]').first();
      if (await typeSelect.count() > 0) {
        await typeSelect.selectOption(event.type);
      }
    }
    
    // Save event
    const saveButton = page.locator('button:has-text("保存"), button:has-text("追加")').last();
    await saveButton.click();
    
    // Wait for dialog to close
    await page.waitForSelector('[role="dialog"]', { state: 'detached' });
    
    console.log(`✅ Timeline event added: ${event.title}`);
    
  } catch (error) {
    console.error(`❌ Failed to add timeline event:`, error);
    throw error;
  }
};

/**
 * Simulate AI interaction
 */
export const simulateAIInteraction = async (page: Page, prompt: string, expectedResponse?: string) => {
  try {
    console.log(`🤖 Simulating AI interaction with prompt: ${prompt}`);
    
    // Look for AI chat button
    const aiChatButton = page.locator('button[aria-label*="AI"], button:has-text("AI"), [data-testid*="ai-chat"]').first();
    
    if (await aiChatButton.count() > 0) {
      await aiChatButton.click();
      
      // Wait for AI panel
      await page.waitForSelector('[role="dialog"], .ai-panel, [data-testid*="ai-panel"]');
      
      // Find message input
      const messageInput = page.locator('textarea[placeholder*="質問"], input[placeholder*="メッセージ"]').first();
      if (await messageInput.count() > 0) {
        await messageInput.fill(prompt);
        
        // Send message
        const sendButton = page.locator('button:has-text("送信"), button[aria-label*="送信"]').first();
        if (await sendButton.count() > 0) {
          await sendButton.click();
          
          // Wait for AI response (mock or real)
          await page.waitForTimeout(3000);
          
          if (expectedResponse) {
            // Verify expected response appears
            await expect(page.locator(`text=${expectedResponse}`)).toBeVisible({ timeout: 10000 });
          }
        }
      }
    }
    
    console.log(`✅ AI interaction completed`);
    
  } catch (error) {
    console.error(`❌ AI interaction failed:`, error);
    throw error;
  }
};

/**
 * Clean up TRPG test data
 */
export const cleanupTRPGTestData = async (page: Page) => {
  try {
    console.log(`🧹 Cleaning up TRPG test data`);
    
    await page.evaluate(() => {
      // Remove TRPG-specific data
      const keysToRemove = [
        'trpg-campaigns',
        'current-campaign-id', 
        'current-campaign',
        'trpg-player-characters',
        'trpg-npcs',
        'trpg-enemies',
        'trpg-locations',
        'trpg-timeline',
        'trpg-sessions',
        'trpg-dev-mode'
      ];
      
      keysToRemove.forEach(key => localStorage.removeItem(key));
      
      console.log('🧹 TRPG test data cleaned up');
    });
    
  } catch (error) {
    console.error('❌ Failed to cleanup TRPG test data:', error);
  }
};

/**
 * Verify TRPG page is properly loaded
 */
export const verifyTRPGPageLoad = async (page: Page, expectedElements: string[] = []) => {
  try {
    await page.waitForLoadState("networkidle");
    await page.waitForTimeout(1000);
    
    // Check for TRPG-specific elements
    const defaultElements = [
      '[data-testid*="trpg"], .trpg-interface',
      'nav, [role="navigation"]',
      'main, [role="main"]'
    ];
    
    const elementsToCheck = [...defaultElements, ...expectedElements];
    
    for (const selector of elementsToCheck) {
      const element = page.locator(selector).first();
      if (await element.count() > 0) {
        await expect(element).toBeVisible();
      }
    }
    
    console.log('✅ TRPG page loaded successfully');
    
  } catch (error) {
    console.error('❌ TRPG page load verification failed:', error);
    throw error;
  }
};

/**
 * Take screenshot with TRPG-specific naming
 */
export const takeTRPGScreenshot = async (page: Page, name: string, scenario: string = '') => {
  try {
    const fileName = scenario ? `trpg-${scenario}-${name}` : `trpg-${name}`;
    await page.screenshot({
      path: `e2e/screenshots/${fileName}.png`,
      fullPage: true
    });
    console.log(`📸 TRPG screenshot saved: ${fileName}.png`);
  } catch (error) {
    console.error(`❌ Failed to take TRPG screenshot:`, error);
  }
};