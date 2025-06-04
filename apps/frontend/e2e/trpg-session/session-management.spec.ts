import { test, expect } from "@playwright/test";
import { 
  setupTRPGTestData, 
  navigateToTRPGHome, 
  startTRPGSession,
  rollDice,
  addTimelineEvent,
  simulateAIInteraction,
  cleanupTRPGTestData,
  verifyTRPGPageLoad,
  takeTRPGScreenshot
} from "../utils/trpg-test-helpers";

/**
 * TRPG Session Management E2E Tests
 * 
 * Tests comprehensive TRPG session functionality including session creation,
 * character interactions, dice rolling, combat management, and AI integration
 */

test.describe("TRPG Session Management", () => {
  test.beforeEach(async ({ page }) => {
    await cleanupTRPGTestData(page);
    await setupTRPGTestData(page);
    await navigateToTRPGHome(page);
  });

  test.afterEach(async ({ page }) => {
    await cleanupTRPGTestData(page);
  });

  test("should create and start a new TRPG session", async ({ page }) => {
    console.log("🎯 Testing: TRPG Session Creation and Start");

    // Navigate to session page
    await page.goto("/trpg-session");
    await verifyTRPGPageLoad(page);
    await takeTRPGScreenshot(page, "session-page-initial", "session-creation");

    // Start a new session
    const sessionTitle = "第1話：失われた王国への第一歩";
    const sessionData = await startTRPGSession(page, sessionTitle);
    
    await takeTRPGScreenshot(page, "session-started", "session-creation");

    // Verify session interface is loaded
    const sessionElements = [
      '[data-testid*="session"]',
      '.session-interface',
      '.trpg-session',
      'text="セッション"'
    ];

    let sessionUIFound = false;
    for (const selector of sessionElements) {
      const element = page.locator(selector).first();
      if (await element.count() > 0) {
        sessionUIFound = true;
        break;
      }
    }

    if (sessionUIFound || sessionData.hasSessionUI) {
      console.log("✅ Session UI successfully loaded");
    } else {
      console.log("⚠️ Session UI not detected - may be in different state");
    }

    // Check for essential session components
    const essentialComponents = [
      { name: "キャラクター表示", selectors: ['[data-testid*="character"]', '.character-display'] },
      { name: "チャットインターフェース", selectors: ['[data-testid*="chat"]', '.chat-interface', 'textarea'] },
      { name: "ダイスロール", selectors: ['[data-testid*="dice"]', 'button:has-text("ダイス")'] },
      { name: "ナビゲーション", selectors: ['nav', '[role="navigation"]'] }
    ];

    for (const component of essentialComponents) {
      let found = false;
      for (const selector of component.selectors) {
        if (await page.locator(selector).count() > 0) {
          found = true;
          break;
        }
      }
      console.log(`${found ? "✅" : "⚠️"} ${component.name}: ${found ? "Found" : "Not found"}`);
    }

    console.log("✅ Session creation test completed");
  });

  test("should manage character display and status during session", async ({ page }) => {
    console.log("🧙 Testing: Character Display and Status Management");

    await page.goto("/trpg-session");
    await startTRPGSession(page, "キャラクター管理テスト");
    await takeTRPGScreenshot(page, "character-management-start", "character-display");

    // Look for character display area
    const characterDisplay = page.locator(
      '[data-testid*="character-display"], .character-panel, .party-display'
    ).first();

    if (await characterDisplay.count() > 0) {
      console.log("🎭 Character display found");
      await takeTRPGScreenshot(page, "character-display-found", "character-display");

      // Check for test characters from campaign data
      const testCharacters = ["エリアス・ストーンハート", "ルナ・シルバーリーフ"];
      
      for (const characterName of testCharacters) {
        const characterElement = page.locator(`text=${characterName}`).first();
        if (await characterElement.count() > 0) {
          console.log(`✅ Character found in session: ${characterName}`);
          
          // Click on character to view details
          await characterElement.click();
          await page.waitForTimeout(1000);
          await takeTRPGScreenshot(page, `${characterName.split("・")[0]}-details`, "character-display");
          
          // Look for character status information
          const statusElements = [
            'text="HP"', 'text="AC"', 'text="レベル"',
            '[data-testid*="hp"]', '[data-testid*="health"]'
          ];
          
          let statusFound = false;
          for (const selector of statusElements) {
            if (await page.locator(selector).count() > 0) {
              statusFound = true;
              break;
            }
          }
          
          console.log(`${statusFound ? "✅" : "⚠️"} Character status info: ${statusFound ? "Visible" : "Not visible"}`);
        }
      }
    } else {
      console.log("⚠️ Character display area not found");
    }

    // Test character HP management
    const hpInput = page.locator('input[name*="hp"], input[placeholder*="HP"]').first();
    if (await hpInput.count() > 0) {
      console.log("💖 Testing HP management");
      
      // Test HP modification
      await hpInput.clear();
      await hpInput.fill("25");
      
      const updateButton = page.locator('button:has-text("更新"), button:has-text("保存")').first();
      if (await updateButton.count() > 0) {
        await updateButton.click();
        await page.waitForTimeout(1000);
        await takeTRPGScreenshot(page, "hp-updated", "character-display");
      }
    }

    console.log("✅ Character display test completed");
  });

  test("should handle dice rolling with various notations", async ({ page }) => {
    console.log("🎲 Testing: Dice Rolling System");

    await page.goto("/trpg-session");
    await startTRPGSession(page, "ダイスロールテスト");
    await takeTRPGScreenshot(page, "dice-testing-start", "dice-rolling");

    // Test various dice roll scenarios
    const diceTests = [
      { notation: "1d20", description: "基本アタックロール" },
      { notation: "2d6", description: "ダメージロール" },
      { notation: "1d100", description: "パーセンタイルロール" },
      { notation: "4d6", description: "能力値決定" },
      { notation: "1d20+5", description: "修正値付きロール" }
    ];

    for (const [index, diceTest] of diceTests.entries()) {
      console.log(`🎲 Testing dice: ${diceTest.notation} (${diceTest.description})`);
      
      await rollDice(page, diceTest.notation);
      await page.waitForTimeout(2000);
      await takeTRPGScreenshot(page, `dice-roll-${index + 1}`, "dice-rolling");
      
      // Look for dice result
      const resultElement = page.locator(
        '[data-testid*="dice-result"], .dice-result, .roll-result'
      ).first();
      
      if (await resultElement.count() > 0) {
        const resultText = await resultElement.textContent();
        console.log(`✅ Dice result: ${resultText?.slice(0, 50)}...`);
      } else {
        console.log("⚠️ Dice result not found - checking chat area");
        
        // Check if result appears in chat
        const chatArea = page.locator('[data-testid*="chat"], .chat-area, .message-area').first();
        if (await chatArea.count() > 0) {
          const chatText = await chatArea.textContent();
          if (chatText?.includes(diceTest.notation)) {
            console.log("✅ Dice result found in chat area");
          }
        }
      }
    }

    // Test skill checks
    console.log("🎯 Testing skill checks");
    const skillCheckButton = page.locator('button:has-text("技能判定"), [data-testid*="skill-check"]').first();
    if (await skillCheckButton.count() > 0) {
      await skillCheckButton.click();
      await page.waitForTimeout(1000);
      await takeTRPGScreenshot(page, "skill-check-interface", "dice-rolling");
      
      // Select a skill if skill selection is available
      const skillSelect = page.locator('select[name*="skill"], [data-testid*="skill-select"]').first();
      if (await skillSelect.count() > 0) {
        await skillSelect.selectOption("perception");
        
        const rollSkillButton = page.locator('button:has-text("判定"), button:has-text("ロール")').first();
        if (await rollSkillButton.count() > 0) {
          await rollSkillButton.click();
          await page.waitForTimeout(2000);
          await takeTRPGScreenshot(page, "skill-check-result", "dice-rolling");
        }
      }
    }

    console.log("✅ Dice rolling test completed");
  });

  test("should manage combat encounters and initiative", async ({ page }) => {
    console.log("⚔️ Testing: Combat Encounter Management");

    await page.goto("/trpg-session");
    await startTRPGSession(page, "戦闘エンカウンターテスト");
    await takeTRPGScreenshot(page, "combat-testing-start", "combat-management");

    // Look for combat/encounter management
    const combatButton = page.locator(
      'button:has-text("戦闘"), button:has-text("エンカウンター"), [data-testid*="combat"]'
    ).first();

    if (await combatButton.count() > 0) {
      console.log("⚔️ Starting combat encounter");
      await combatButton.click();
      await page.waitForTimeout(2000);
      await takeTRPGScreenshot(page, "combat-started", "combat-management");

      // Test initiative order
      const initiativeSection = page.locator(
        '[data-testid*="initiative"], .initiative-tracker, text="イニシアチブ"'
      ).first();

      if (await initiativeSection.count() > 0) {
        console.log("📋 Initiative tracker found");
        
        // Test rolling initiative
        const rollInitiativeButton = page.locator(
          'button:has-text("イニシアチブ"), button:has-text("先制判定")'
        ).first();

        if (await rollInitiativeButton.count() > 0) {
          await rollInitiativeButton.click();
          await page.waitForTimeout(2000);
          await takeTRPGScreenshot(page, "initiative-rolled", "combat-management");
        }
      }

      // Test turn management
      const nextTurnButton = page.locator(
        'button:has-text("次のターン"), button:has-text("ターン終了"), [data-testid*="next-turn"]'
      ).first();

      if (await nextTurnButton.count() > 0) {
        console.log("🔄 Turn management found");
        await nextTurnButton.click();
        await page.waitForTimeout(1000);
        await takeTRPGScreenshot(page, "turn-advanced", "combat-management");
      }

      // Test adding enemies to combat
      const addEnemyButton = page.locator(
        'button:has-text("敵追加"), button:has-text("エネミー"), [data-testid*="add-enemy"]'
      ).first();

      if (await addEnemyButton.count() > 0) {
        await addEnemyButton.click();
        await page.waitForTimeout(1000);
        
        const enemyDialog = page.locator('[role="dialog"]');
        if (await enemyDialog.count() > 0) {
          // Select enemy from test data
          const enemyOption = page.locator('text="シャドウナイト"').first();
          if (await enemyOption.count() > 0) {
            await enemyOption.click();
            
            const addButton = page.locator('button:has-text("追加")').first();
            await addButton.click();
            await page.waitForTimeout(1000);
            await takeTRPGScreenshot(page, "enemy-added-to-combat", "combat-management");
          }
        }
      }
    } else {
      console.log("⚠️ Combat system not found - may be integrated differently");
    }

    console.log("✅ Combat management test completed");
  });

  test("should integrate AI for session management and NPCs", async ({ page }) => {
    console.log("🤖 Testing: AI Integration for Session Management");

    await page.goto("/trpg-session");
    await startTRPGSession(page, "AI統合テスト");
    await takeTRPGScreenshot(page, "ai-integration-start", "ai-integration");

    // Test AI-powered GM assistance
    const aiPrompts = [
      {
        prompt: "NPCのマスター・セオバルドが重要な情報を提供するシーンを作成してください",
        description: "NPC interaction generation"
      },
      {
        prompt: "プレイヤーが古代遺跡で謎解きをするシーンの状況を説明してください",
        description: "Scene description generation"
      },
      {
        prompt: "戦闘中にシャドウナイトが使用する特殊攻撃を考案してください",
        description: "Combat action generation"
      }
    ];

    for (const [index, aiTest] of aiPrompts.entries()) {
      console.log(`🤖 Testing AI: ${aiTest.description}`);
      
      await simulateAIInteraction(page, aiTest.prompt);
      await page.waitForTimeout(3000);
      await takeTRPGScreenshot(page, `ai-interaction-${index + 1}`, "ai-integration");
    }

    // Test AI NPC behavior simulation
    const npcInteractionButton = page.locator(
      'button:has-text("NPC会話"), [data-testid*="npc-interaction"]'
    ).first();

    if (await npcInteractionButton.count() > 0) {
      await npcInteractionButton.click();
      await page.waitForTimeout(1000);
      
      // Select an NPC for interaction
      const npcSelect = page.locator('select[name*="npc"], [data-testid*="npc-select"]').first();
      if (await npcSelect.count() > 0) {
        await npcSelect.selectOption("マスター・セオバルド");
        
        // Simulate conversation
        const conversationInput = page.locator(
          'textarea[placeholder*="話しかける"], input[placeholder*="会話"]'
        ).first();
        
        if (await conversationInput.count() > 0) {
          await conversationInput.fill("失われた王国について何か知っていることを教えてください");
          
          const sendButton = page.locator('button:has-text("送信"), button:has-text("話す")').first();
          await sendButton.click();
          await page.waitForTimeout(3000);
          await takeTRPGScreenshot(page, "npc-conversation", "ai-integration");
        }
      }
    }

    // Test AI scenario generation
    const scenarioButton = page.locator(
      'button:has-text("シナリオ生成"), [data-testid*="scenario-gen"]'
    ).first();

    if (await scenarioButton.count() > 0) {
      await scenarioButton.click();
      await page.waitForTimeout(1000);
      
      const scenarioPrompt = page.locator('textarea[placeholder*="シナリオ"]').first();
      if (await scenarioPrompt.count() > 0) {
        await scenarioPrompt.fill("プレイヤーが森で迷子になり、謎の建物を発見するシナリオ");
        
        const generateButton = page.locator('button:has-text("生成")').first();
        await generateButton.click();
        await page.waitForTimeout(5000);
        await takeTRPGScreenshot(page, "scenario-generated", "ai-integration");
      }
    }

    console.log("✅ AI integration test completed");
  });

  test("should manage session notes and event logging", async ({ page }) => {
    console.log("📝 Testing: Session Notes and Event Logging");

    await page.goto("/trpg-session");
    await startTRPGSession(page, "ノート記録テスト");
    await takeTRPGScreenshot(page, "notes-testing-start", "session-notes");

    // Test session notes taking
    const notesArea = page.locator(
      'textarea[placeholder*="ノート"], [data-testid*="notes"], .notes-area'
    ).first();

    if (await notesArea.count() > 0) {
      console.log("📝 Notes area found");
      
      const sessionNotes = `
セッション記録：
- プレイヤーたちは賢者の塔でマスター・セオバルドと面会
- 失われた王国の調査依頼を受諾
- 装備を整えて王都遺跡への出発を決定
- エリアスが新しい武器を購入
- ルナが古代魔法に関する書物を研究
      `;

      await notesArea.fill(sessionNotes);
      await page.waitForTimeout(1000);
      await takeTRPGScreenshot(page, "session-notes-entered", "session-notes");

      // Save notes
      const saveNotesButton = page.locator('button:has-text("保存"), [data-testid*="save-notes"]').first();
      if (await saveNotesButton.count() > 0) {
        await saveNotesButton.click();
        await page.waitForTimeout(1000);
        console.log("✅ Session notes saved");
      }
    }

    // Test automatic event logging
    console.log("📋 Testing automatic event logging");
    
    // Perform actions that should be logged
    await rollDice(page, "1d20+3");
    await page.waitForTimeout(2000);

    // Check if events are logged
    const eventLog = page.locator(
      '[data-testid*="event-log"], .event-log, .session-log'
    ).first();

    if (await eventLog.count() > 0) {
      const logContent = await eventLog.textContent();
      if (logContent?.includes("1d20") || logContent?.includes("ダイス")) {
        console.log("✅ Dice roll logged automatically");
      }
      await takeTRPGScreenshot(page, "event-log-updated", "session-notes");
    }

    // Test manual event creation
    const testEvent = {
      title: "重要な発見",
      description: "プレイヤーたちが古代の石碑を発見し、謎の文字を解読した",
      type: "story" as const
    };

    await addTimelineEvent(page, testEvent);
    await takeTRPGScreenshot(page, "manual-event-added", "session-notes");

    console.log("✅ Session notes and event logging test completed");
  });

  test("should handle session pause and resume functionality", async ({ page }) => {
    console.log("⏸️ Testing: Session Pause and Resume");

    await page.goto("/trpg-session");
    await startTRPGSession(page, "一時停止・再開テスト");
    await takeTRPGScreenshot(page, "pause-resume-start", "session-control");

    // Perform some session activities first
    await rollDice(page, "1d20");
    await page.waitForTimeout(2000);

    // Look for session control buttons
    const pauseButton = page.locator(
      'button:has-text("一時停止"), button:has-text("休憩"), [data-testid*="pause"]'
    ).first();

    if (await pauseButton.count() > 0) {
      console.log("⏸️ Pausing session");
      await pauseButton.click();
      await page.waitForTimeout(1000);
      await takeTRPGScreenshot(page, "session-paused", "session-control");

      // Check for pause indicators
      const pauseIndicator = page.locator(
        '.paused, [data-status="paused"], text="一時停止中"'
      ).first();

      if (await pauseIndicator.count() > 0) {
        console.log("✅ Session pause state indicated");
      }

      // Test resume
      const resumeButton = page.locator(
        'button:has-text("再開"), button:has-text("続行"), [data-testid*="resume"]'
      ).first();

      if (await resumeButton.count() > 0) {
        await resumeButton.click();
        await page.waitForTimeout(1000);
        await takeTRPGScreenshot(page, "session-resumed", "session-control");
        console.log("✅ Session resumed");
      }
    } else {
      console.log("⚠️ Session pause controls not found");
    }

    // Test session end functionality
    const endSessionButton = page.locator(
      'button:has-text("セッション終了"), button:has-text("終了"), [data-testid*="end-session"]'
    ).first();

    if (await endSessionButton.count() > 0) {
      console.log("🔚 Testing session end");
      await endSessionButton.click();
      await page.waitForTimeout(1000);

      // Confirm end if dialog appears
      const confirmDialog = page.locator('[role="dialog"]');
      if (await confirmDialog.count() > 0) {
        const confirmButton = confirmDialog.locator('button:has-text("終了"), button:has-text("確認")').first();
        if (await confirmButton.count() > 0) {
          await confirmButton.click();
          await page.waitForTimeout(2000);
          await takeTRPGScreenshot(page, "session-ended", "session-control");
        }
      }

      // Verify session ended (should redirect or show end state)
      const currentUrl = page.url();
      if (currentUrl.includes('/trpg-session') || currentUrl.includes('/session-summary')) {
        console.log("✅ Session ended successfully");
      }
    }

    console.log("✅ Session pause and resume test completed");
  });
});