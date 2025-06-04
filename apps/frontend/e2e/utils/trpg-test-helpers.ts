import { Page, expect, Locator } from "@playwright/test";

/**
 * TRPG-specific test helper functions
 * Provides utilities for campaign management, character creation, session handling, etc.
 */

export interface TRPGCampaign {
  id: string;
  title: string;
  description: string;
  gameSystem: string;
  createdAt: string;
  updatedAt: string;
  playerCharacters: TRPGCharacter[];
  npcs: TRPGCharacter[];
  enemies: TRPGCharacter[];
  locations: TRPGLocation[];
  timeline: TRPGTimelineEvent[];
  sessions: TRPGSession[];
}

export interface TRPGCharacter {
  id: string;
  name: string;
  type: 'PC' | 'NPC' | 'Enemy';
  level: number;
  race: string;
  class: string;
  attributes: {
    strength: number;
    dexterity: number;
    constitution: number;
    intelligence: number;
    wisdom: number;
    charisma: number;
  };
  hitPoints: {
    current: number;
    maximum: number;
  };
  armorClass: number;
  background: string;
  personality: string;
  appearance: string;
  backstory: string;
  equipment: string[];
  spells?: string[];
  notes: string;
  imageUrl?: string;
}

export interface TRPGLocation {
  id: string;
  name: string;
  type: string;
  description: string;
  inhabitants: string[];
  features: string[];
  connections: string[];
}

export interface TRPGTimelineEvent {
  id: string;
  title: string;
  description: string;
  date: string;
  location?: string;
  participants: string[];
  type: 'story' | 'battle' | 'social' | 'exploration';
  consequences: string[];
}

export interface TRPGSession {
  id: string;
  campaignId: string;
  sessionNumber: number;
  title: string;
  date: string;
  duration: number;
  participants: string[];
  summary: string;
  events: TRPGTimelineEvent[];
  notes: string;
}

/**
 * Create a test TRPG campaign with comprehensive data
 */
export const createTestTRPGCampaign = (): TRPGCampaign => {
  const campaignId = `test-campaign-${Date.now()}`;
  
  return {
    id: campaignId,
    title: "テストTRPGキャンペーン：失われた王国の謎",
    description: "古代の王国が消失した謎を解き明かす冒険キャンペーン。プレイヤーたちは考古学者として遺跡を調査し、古代の魔法と政治的陰謀に巻き込まれていく。",
    gameSystem: "D&D 5e",
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    playerCharacters: [
      {
        id: "pc-1",
        name: "エリアス・ストーンハート",
        type: "PC",
        level: 3,
        race: "ヒューマン",
        class: "ファイター",
        attributes: {
          strength: 16,
          dexterity: 14,
          constitution: 15,
          intelligence: 12,
          wisdom: 13,
          charisma: 10
        },
        hitPoints: { current: 28, maximum: 28 },
        armorClass: 18,
        background: "兵士",
        personality: "勇敢で正義感が強い。仲間を守ることを最優先に考える。",
        appearance: "身長180cm、筋肉質な体格。短い黒髪と青い瞳。",
        backstory: "元王国騎士団の一員。王国滅亡の真相を探るため冒険者となった。",
        equipment: ["ロングソード", "チェインメイル", "シールド", "ロングボウ"],
        notes: "パーティのタンク役。防御を重視した戦闘スタイル。",
        imageUrl: "/test-assets/elias.jpg"
      },
      {
        id: "pc-2", 
        name: "ルナ・シルバーリーフ",
        type: "PC",
        level: 3,
        race: "エルフ",
        class: "ウィザード",
        attributes: {
          strength: 8,
          dexterity: 14,
          constitution: 12,
          intelligence: 17,
          wisdom: 15,
          charisma: 11
        },
        hitPoints: { current: 18, maximum: 18 },
        armorClass: 12,
        background: "学者",
        personality: "知識欲旺盛で論理的思考を好む。古代の謎解きに情熱を注ぐ。",
        appearance: "身長165cm、細身。長い銀髪と緑の瞳。",
        backstory: "魔法学院の卒業生。失われた古代魔法の研究のため冒険に参加。",
        equipment: ["魔法の杖", "スペルブック", "ローブ", "コンポーネントポーチ"],
        spells: ["マジックミサイル", "シールド", "ディテクトマジック", "ファイアーボール"],
        notes: "パーティの魔法使い。謎解きと魔法攻撃が得意。",
        imageUrl: "/test-assets/luna.jpg"
      }
    ],
    npcs: [
      {
        id: "npc-1",
        name: "マスター・セオバルド",
        type: "NPC",
        level: 8,
        race: "ヒューマン",
        class: "クレリック",
        attributes: {
          strength: 12,
          dexterity: 10,
          constitution: 14,
          intelligence: 16,
          wisdom: 18,
          charisma: 15
        },
        hitPoints: { current: 52, maximum: 52 },
        armorClass: 15,
        background: "聖職者",
        personality: "慈悲深く知識豊富。古代の歴史に詳しい。",
        appearance: "身長170cm、白髪と白ひげの老人。温和な表情。",
        backstory: "古代王国の歴史を研究する神殿の大司祭。パーティの協力者。",
        equipment: ["聖印", "プレートアーマー", "メイス"],
        notes: "情報提供者。回復魔法でサポート。",
        imageUrl: "/test-assets/theobald.jpg"
      }
    ],
    enemies: [
      {
        id: "enemy-1",
        name: "シャドウナイト",
        type: "Enemy",
        level: 5,
        race: "アンデッド",
        class: "戦士",
        attributes: {
          strength: 18,
          dexterity: 12,
          constitution: 16,
          intelligence: 10,
          wisdom: 11,
          charisma: 8
        },
        hitPoints: { current: 45, maximum: 45 },
        armorClass: 17,
        background: "堕落した騎士",
        personality: "冷酷で容赦がない。古代の呪いに縛られている。",
        appearance: "黒い鎧をまとった骸骨騎士。赤く光る眼窩。",
        backstory: "古代王国の騎士が呪いによってアンデッドと化した存在。",
        equipment: ["呪われたロングソード", "ダークプレート", "呪いのシールド"],
        notes: "中ボス級の敵。恐怖効果と暗闇攻撃を使用。",
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
      localStorage.setItem('trpg-player-characters', JSON.stringify(campaignData.playerCharacters));
      localStorage.setItem('trpg-npcs', JSON.stringify(campaignData.npcs));
      localStorage.setItem('trpg-enemies', JSON.stringify(campaignData.enemies));
      
      // Set up world building data
      localStorage.setItem('trpg-locations', JSON.stringify(campaignData.locations));
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
    
    if (character.race) {
      await page.fill('input[name="race"], input[placeholder*="種族"]', character.race);
    }
    
    if (character.class) {
      await page.fill('input[name="class"], input[placeholder*="クラス"]', character.class);
    }
    
    if (character.level) {
      await page.fill('input[name="level"], input[placeholder*="レベル"]', character.level.toString());
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
    if (character.background) {
      await page.fill('input[name="background"], textarea[name="background"]', character.background);
    }
    
    if (character.personality) {
      await page.fill('textarea[name="personality"], textarea[placeholder*="性格"]', character.personality);
    }
    
    if (character.backstory) {
      await page.fill('textarea[name="backstory"], textarea[placeholder*="背景"]', character.backstory);
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
export const addTimelineEvent = async (page: Page, event: Partial<TRPGTimelineEvent>) => {
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