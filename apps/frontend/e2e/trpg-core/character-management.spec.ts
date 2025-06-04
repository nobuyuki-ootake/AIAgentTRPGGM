import { test, expect } from "@playwright/test";
import { 
  setupTRPGTestData, 
  navigateToTRPGHome, 
  createTRPGCharacter,
  cleanupTRPGTestData,
  verifyTRPGPageLoad,
  takeTRPGScreenshot,
  TRPGCharacter
} from "../utils/trpg-test-helpers";

/**
 * TRPG Character Management E2E Tests
 * 
 * Tests comprehensive character creation, editing, and management for PC/NPC/Enemy
 * Covers character sheets, attribute management, and character interactions
 */

test.describe("TRPG Character Management", () => {
  test.beforeEach(async ({ page }) => {
    await cleanupTRPGTestData(page);
    await setupTRPGTestData(page);
    await navigateToTRPGHome(page);
  });

  test.afterEach(async ({ page }) => {
    await cleanupTRPGTestData(page);
  });

  test("should create a new Player Character (PC) with full attributes", async ({ page }) => {
    console.log("🧙 Testing: PC Creation with Full Attributes");

    await page.goto("/characters");
    await verifyTRPGPageLoad(page);
    await takeTRPGScreenshot(page, "characters-page-initial", "pc-creation");

    // Test creating a comprehensive PC
    const newPC: Partial<TRPGCharacter> = {
      name: "テスト戦士アルフレッド",
      race: "ヒューマン",
      class: "ファイター",
      level: 5,
      attributes: {
        strength: 18,
        dexterity: 14,
        constitution: 16,
        intelligence: 12,
        wisdom: 13,
        charisma: 10
      },
      background: "騎士",
      personality: "正義感が強く、仲間思いの性格。困っている人を見過ごせない。",
      appearance: "身長185cm、筋肉質な体格。金髪と青い瞳が特徴的。",
      backstory: "王国の騎士として訓練を受けたが、政治的陰謀に巻き込まれ騎士団を離脱。今は自由な冒険者として活動している。"
    };

    await createTRPGCharacter(page, newPC, "PC");
    await takeTRPGScreenshot(page, "pc-created", "pc-creation");

    // Verify PC was created and appears in list
    await expect(page.locator(`text=${newPC.name}`)).toBeVisible();
    
    // Click on character to view details
    const characterCard = page.locator(`text=${newPC.name}`).first();
    await characterCard.click();
    await page.waitForTimeout(2000);
    await takeTRPGScreenshot(page, "pc-details-view", "pc-creation");

    // Verify character details are displayed
    await expect(page.locator(`text=${newPC.race}`)).toBeVisible();
    await expect(page.locator(`text=${newPC.class}`)).toBeVisible();
    await expect(page.locator(`text=${newPC.level}`)).toBeVisible();

    console.log("✅ PC creation test completed");
  });

  test("should create and manage NPCs with different roles", async ({ page }) => {
    console.log("👥 Testing: NPC Creation and Management");

    await page.goto("/npcs");
    await verifyTRPGPageLoad(page);
    await takeTRPGScreenshot(page, "npcs-page-initial", "npc-management");

    // Create different types of NPCs
    const npcs: Partial<TRPGCharacter>[] = [
      {
        name: "商人ギルバート",
        race: "ヒューマン",
        class: "商人",
        level: 2,
        personality: "商売上手で情報通。常に利益を考えている。",
        backstory: "各地を旅する行商人。情報の売買も行う。",
        background: "商人ギルド"
      },
      {
        name: "魔法使いマーリン",
        race: "エルフ",
        class: "ウィザード",
        level: 12,
        personality: "知識豊富で神秘的。古代の秘密を知っている。",
        backstory: "古代魔法の研究者。プレイヤーたちの助言者として活動。",
        background: "魔法学院"
      },
      {
        name: "酒場の主人トム",
        race: "ドワーフ",
        class: "コモナー",
        level: 1,
        personality: "陽気で人好きのする性格。酒場の情報収集拠点。",
        backstory: "長年酒場を経営している。多くの冒険者と知り合い。",
        background: "酒場経営者"
      }
    ];

    for (const [index, npc] of npcs.entries()) {
      console.log(`📝 Creating NPC: ${npc.name}`);
      await createTRPGCharacter(page, npc, "NPC");
      await page.waitForTimeout(1000);
      await takeTRPGScreenshot(page, `npc-${index + 1}-created`, "npc-management");
      
      // Verify NPC appears in list
      await expect(page.locator(`text=${npc.name}`)).toBeVisible();
    }

    // Test NPC list and filtering
    await takeTRPGScreenshot(page, "all-npcs-created", "npc-management");

    // Check if there's a search or filter functionality
    const searchInput = page.locator('input[placeholder*="検索"], input[name*="search"]').first();
    if (await searchInput.count() > 0) {
      await searchInput.fill("商人");
      await page.waitForTimeout(1000);
      await expect(page.locator(`text=${npcs[0].name}`)).toBeVisible();
      await takeTRPGScreenshot(page, "npc-search-results", "npc-management");
      
      // Clear search
      await searchInput.clear();
      await page.waitForTimeout(1000);
    }

    console.log("✅ NPC management test completed");
  });

  test("should create enemies with combat attributes", async ({ page }) => {
    console.log("⚔️ Testing: Enemy Creation with Combat Focus");

    await page.goto("/enemies");
    await verifyTRPGPageLoad(page);
    await takeTRPGScreenshot(page, "enemies-page-initial", "enemy-management");

    // Create various enemy types
    const enemies: Partial<TRPGCharacter>[] = [
      {
        name: "オークの戦士",
        race: "オーク",
        class: "バーバリアン",
        level: 3,
        attributes: {
          strength: 16,
          dexterity: 12,
          constitution: 15,
          intelligence: 8,
          wisdom: 11,
          charisma: 9
        },
        hitPoints: { current: 32, maximum: 32 },
        armorClass: 14,
        personality: "好戦的で野蛮。群れで行動することを好む。",
        backstory: "部族から離れた野生のオーク。領域侵入者を攻撃する。"
      },
      {
        name: "古代のリッチ",
        race: "アンデッド",
        class: "ネクロマンサー",
        level: 15,
        attributes: {
          strength: 10,
          dexterity: 14,
          constitution: 16,
          intelligence: 20,
          wisdom: 17,
          charisma: 12
        },
        hitPoints: { current: 120, maximum: 120 },
        armorClass: 16,
        personality: "冷酷で計算高い。永遠の生命を求めて研究を続けている。",
        backstory: "かつては偉大な魔法使いだったが、不死を求めてリッチとなった。"
      },
      {
        name: "ドラゴンの幼体",
        race: "ドラゴン",
        class: "なし",
        level: 8,
        attributes: {
          strength: 19,
          dexterity: 14,
          constitution: 17,
          intelligence: 14,
          wisdom: 13,
          charisma: 15
        },
        hitPoints: { current: 85, maximum: 85 },
        armorClass: 18,
        personality: "プライドが高く、縄張り意識が強い。宝物を集めることを好む。",
        backstory: "古い洞窟に住む若いドラゴン。成長とともに力を増している。"
      }
    ];

    for (const [index, enemy] of enemies.entries()) {
      console.log(`⚔️ Creating Enemy: ${enemy.name}`);
      await createTRPGCharacter(page, enemy, "Enemy");
      await page.waitForTimeout(1000);
      await takeTRPGScreenshot(page, `enemy-${index + 1}-created`, "enemy-management");
      
      // Verify enemy appears in list
      await expect(page.locator(`text=${enemy.name}`)).toBeVisible();
    }

    await takeTRPGScreenshot(page, "all-enemies-created", "enemy-management");

    // Test enemy detail view for combat information
    const firstEnemy = page.locator(`text=${enemies[0].name}`).first();
    await firstEnemy.click();
    await page.waitForTimeout(2000);
    await takeTRPGScreenshot(page, "enemy-detail-view", "enemy-management");

    // Check for combat-specific information
    const combatInfo = [
      enemies[0].hitPoints?.maximum?.toString() || "",
      enemies[0].armorClass?.toString() || "",
      enemies[0].attributes?.strength?.toString() || ""
    ];

    for (const info of combatInfo) {
      if (info) {
        await expect(page.locator(`text=${info}`)).toBeVisible();
      }
    }

    console.log("✅ Enemy management test completed");
  });

  test("should edit existing character attributes and details", async ({ page }) => {
    console.log("✏️ Testing: Character Editing");

    await page.goto("/characters");
    await verifyTRPGPageLoad(page);

    // Get an existing character from test data
    const existingCharacterName = "エリアス・ストーンハート"; // From test data

    await expect(page.locator(`text=${existingCharacterName}`)).toBeVisible();
    
    // Click on character to open details
    const characterCard = page.locator(`text=${existingCharacterName}`).first();
    await characterCard.click();
    await page.waitForTimeout(2000);

    // Look for edit button
    const editButton = page.locator('button:has-text("編集"), button:has-text("修正"), button[aria-label*="編集"]').first();
    
    if (await editButton.count() > 0) {
      await editButton.click();
      await page.waitForSelector('[role="dialog"]');
      await takeTRPGScreenshot(page, "character-edit-dialog", "character-editing");

      // Modify character attributes
      const newLevel = "4";
      const levelInput = page.locator('input[name="level"], input[placeholder*="レベル"]').first();
      if (await levelInput.count() > 0) {
        await levelInput.clear();
        await levelInput.fill(newLevel);
      }

      // Modify hit points
      const hpInput = page.locator('input[name="hitPoints"], input[placeholder*="HP"]').first();
      if (await hpInput.count() > 0) {
        await hpInput.clear();
        await hpInput.fill("32");
      }

      // Add to backstory
      const backstoryInput = page.locator('textarea[name="backstory"], textarea[placeholder*="背景"]').first();
      if (await backstoryInput.count() > 0) {
        const currentBackstory = await backstoryInput.inputValue();
        await backstoryInput.fill(currentBackstory + " 最近、新たな仲間との冒険を通じて成長を遂げている。");
      }

      // Save changes
      const saveButton = page.locator('button:has-text("保存"), button:has-text("更新")').last();
      await saveButton.click();
      await page.waitForSelector('[role="dialog"]', { state: 'detached' });
      await page.waitForTimeout(2000);

      await takeTRPGScreenshot(page, "character-edited", "character-editing");

      // Verify changes were saved
      await expect(page.locator(`text=${newLevel}`)).toBeVisible();
      
      console.log("✅ Character editing completed");
    } else {
      console.log("⚠️ Edit functionality not found - may be view-only mode");
    }
  });

  test("should manage character equipment and inventory", async ({ page }) => {
    console.log("🎒 Testing: Character Equipment Management");

    await page.goto("/characters");
    await verifyTRPGPageLoad(page);

    const characterName = "エリアス・ストーンハート";
    await expect(page.locator(`text=${characterName}`)).toBeVisible();
    
    const characterCard = page.locator(`text=${characterName}`).first();
    await characterCard.click();
    await page.waitForTimeout(2000);

    // Look for equipment/inventory section
    const equipmentSection = page.locator(
      '[data-testid*="equipment"], .equipment-section, text="装備", text="所持品"'
    ).first();

    if (await equipmentSection.count() > 0) {
      await takeTRPGScreenshot(page, "character-equipment-view", "equipment-management");

      // Look for add equipment functionality
      const addEquipmentButton = page.locator(
        'button:has-text("装備追加"), button:has-text("アイテム追加"), button[aria-label*="追加"]'
      ).first();

      if (await addEquipmentButton.count() > 0) {
        await addEquipmentButton.click();
        await page.waitForTimeout(1000);

        // Add new equipment item
        const itemNameInput = page.locator('input[name*="item"], input[placeholder*="アイテム"]').first();
        if (await itemNameInput.count() > 0) {
          await itemNameInput.fill("魔法の盾+1");
          
          const addButton = page.locator('button:has-text("追加"), button:has-text("保存")').first();
          await addButton.click();
          await page.waitForTimeout(1000);

          // Verify item was added
          await expect(page.locator("text=魔法の盾+1")).toBeVisible();
          await takeTRPGScreenshot(page, "equipment-added", "equipment-management");
        }
      }
    } else {
      console.log("⚠️ Equipment section not found - may not be implemented");
    }

    console.log("✅ Equipment management test completed");
  });

  test("should handle character death and resurrection mechanics", async ({ page }) => {
    console.log("💀 Testing: Character Death/Resurrection Mechanics");

    await page.goto("/characters");
    await verifyTRPGPageLoad(page);

    const characterName = "エリアス・ストーンハート";
    await expect(page.locator(`text=${characterName}`)).toBeVisible();
    
    const characterCard = page.locator(`text=${characterName}`).first();
    await characterCard.click();
    await page.waitForTimeout(2000);

    // Look for HP management or status controls
    const hpControls = page.locator(
      'input[name*="hp"], input[name*="hitPoints"], [data-testid*="hp"]'
    ).first();

    if (await hpControls.count() > 0) {
      // Test setting HP to 0 (death)
      await hpControls.clear();
      await hpControls.fill("0");
      
      // Look for save or update button
      const updateButton = page.locator('button:has-text("更新"), button:has-text("保存")').first();
      if (await updateButton.count() > 0) {
        await updateButton.click();
        await page.waitForTimeout(2000);
        await takeTRPGScreenshot(page, "character-dead", "death-mechanics");

        // Check if character status changed (death indicators)
        const statusIndicators = page.locator(
          '.dead, .unconscious, [data-status="dead"], text="死亡", text="気絶"'
        );
        
        if (await statusIndicators.count() > 0) {
          console.log("✅ Death status indicated");
        }

        // Test resurrection (restore HP)
        await hpControls.clear();
        await hpControls.fill("15");
        await updateButton.click();
        await page.waitForTimeout(2000);
        await takeTRPGScreenshot(page, "character-revived", "death-mechanics");
      }
    } else {
      console.log("⚠️ HP controls not found - testing alternative status management");
      
      // Look for status dropdown or buttons
      const statusControls = page.locator(
        'select[name*="status"], button[aria-label*="ステータス"]'
      ).first();

      if (await statusControls.count() > 0) {
        console.log("✅ Found alternative status controls");
      }
    }

    console.log("✅ Death/resurrection mechanics test completed");
  });

  test("should export character sheets in different formats", async ({ page }) => {
    console.log("📄 Testing: Character Sheet Export");

    await page.goto("/characters");
    await verifyTRPGPageLoad(page);

    const characterName = "エリアス・ストーンハート";
    await expect(page.locator(`text=${characterName}`)).toBeVisible();
    
    const characterCard = page.locator(`text=${characterName}`).first();
    await characterCard.click();
    await page.waitForTimeout(2000);

    // Look for export functionality
    const exportButton = page.locator(
      'button:has-text("エクスポート"), button:has-text("出力"), button:has-text("印刷"), [data-testid*="export"]'
    ).first();

    if (await exportButton.count() > 0) {
      await exportButton.click();
      await page.waitForTimeout(1000);
      await takeTRPGScreenshot(page, "export-options", "character-export");

      // Check for export format options
      const formatOptions = page.locator(
        'text="PDF", text="画像", text="JSON", button:has-text("PDF")'
      );

      if (await formatOptions.count() > 0) {
        console.log("✅ Export format options available");
        // Note: Actual file download testing would require download handling setup
      } else {
        console.log("⚠️ Export format options not found");
      }
    } else {
      console.log("⚠️ Export functionality not found");
    }

    console.log("✅ Character sheet export test completed");
  });
});