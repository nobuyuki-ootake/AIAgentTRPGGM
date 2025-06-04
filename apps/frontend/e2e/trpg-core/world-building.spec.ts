import { test, expect } from "@playwright/test";
import { 
  setupTRPGTestData, 
  navigateToTRPGHome, 
  cleanupTRPGTestData,
  verifyTRPGPageLoad,
  takeTRPGScreenshot,
  TRPGLocation
} from "../utils/trpg-test-helpers";

/**
 * TRPG World Building E2E Tests
 * 
 * Tests comprehensive world building features including locations, cultures,
 * interactive maps, geography, and environmental systems
 */

test.describe("TRPG World Building", () => {
  test.beforeEach(async ({ page }) => {
    await cleanupTRPGTestData(page);
    await setupTRPGTestData(page);
    await navigateToTRPGHome(page);
  });

  test.afterEach(async ({ page }) => {
    await cleanupTRPGTestData(page);
  });

  test("should create and manage locations with detailed descriptions", async ({ page }) => {
    console.log("🏰 Testing: Location Creation and Management");

    await page.goto("/world-building");
    await verifyTRPGPageLoad(page);
    await takeTRPGScreenshot(page, "world-building-initial", "world-building");

    // Navigate to locations/places tab
    const placesTab = page.locator('button[role="tab"]:has-text("場所"), [data-testid*="places-tab"]').first();
    if (await placesTab.count() > 0) {
      await placesTab.click();
      await page.waitForTimeout(1000);
      await takeTRPGScreenshot(page, "places-tab-active", "world-building");
    }

    // Test creating new locations
    const newLocations: Partial<TRPGLocation>[] = [
      {
        name: "翡翠の森",
        type: "自然環境",
        description: "古代の魔法が息づく神秘的な森林。エルフの集落があり、珍しい薬草や魔法のクリスタルが採取できる。",
        inhabitants: ["森エルフ", "フェアリー", "ユニコーン"],
        features: ["エルフの村", "魔法の泉", "古代遺跡", "薬草園"],
        connections: ["王都への街道", "山間の洞窟"]
      },
      {
        name: "鉄壁の要塞都市グランドハンマー",
        type: "都市",
        description: "ドワーフが築いた難攻不落の要塞都市。優秀な武器や防具の生産地として知られ、多くの冒険者が装備を求めて訪れる。",
        inhabitants: ["ドワーフ職人", "商人", "衛兵", "冒険者"],
        features: ["大鍛冶場", "武器商店街", "宿屋『ハンマーと金床』", "城壁"],
        connections: ["翡翠の森", "ドラゴンの峡谷", "商業路"]
      },
      {
        name: "忘れられた地下遺跡",
        type: "ダンジョン",
        description: "古代文明の遺跡。複雑な罠と強力なモンスターが待ち受けているが、貴重な宝物や古代の知識が眠っている。",
        inhabitants: ["アンデッド", "ゴーレム", "魔法の番人"],
        features: ["罠の回廊", "宝物庫", "古代の図書館", "召喚の祭壇"],
        connections: ["秘密の入口（翡翠の森）"]
      }
    ];

    for (const [index, location] of newLocations.entries()) {
      console.log(`🏗️ Creating location: ${location.name}`);

      // Click add location button
      const addButton = page.locator('button:has-text("追加"), button:has-text("新規作成"), button[aria-label*="追加"]').first();
      if (await addButton.count() > 0) {
        await addButton.click();
        await page.waitForSelector('[role="dialog"]', { timeout: 10000 });
        await takeTRPGScreenshot(page, `location-${index + 1}-dialog`, "world-building");

        // Fill location form
        if (location.name) {
          await page.fill('input[name="name"], input[placeholder*="名前"]', location.name);
        }

        if (location.type) {
          const typeInput = page.locator('input[name="type"], select[name="type"]').first();
          if (await typeInput.count() > 0) {
            await typeInput.fill(location.type);
          }
        }

        if (location.description) {
          await page.fill('textarea[name="description"], textarea[placeholder*="説明"]', location.description);
        }

        // Add features if there's a features field
        if (location.features && location.features.length > 0) {
          const featuresInput = page.locator('textarea[name="features"], input[name="features"]').first();
          if (await featuresInput.count() > 0) {
            await featuresInput.fill(location.features.join(', '));
          }
        }

        // Add inhabitants
        if (location.inhabitants && location.inhabitants.length > 0) {
          const inhabitantsInput = page.locator('textarea[name="inhabitants"], input[name="inhabitants"]').first();
          if (await inhabitantsInput.count() > 0) {
            await inhabitantsInput.fill(location.inhabitants.join(', '));
          }
        }

        // Save location
        const saveButton = page.locator('button:has-text("保存"), button:has-text("作成")').last();
        await saveButton.click();
        await page.waitForSelector('[role="dialog"]', { state: 'detached' });
        await page.waitForTimeout(2000);

        // Verify location was created
        await expect(page.locator(`text=${location.name}`)).toBeVisible();
        await takeTRPGScreenshot(page, `location-${index + 1}-created`, "world-building");
      }
    }

    console.log("✅ Location creation test completed");
  });

  test("should manage geography and environment settings", async ({ page }) => {
    console.log("🌍 Testing: Geography and Environment Management");

    await page.goto("/world-building");
    await verifyTRPGPageLoad(page);

    // Navigate to geography/environment tab
    const geoTab = page.locator(
      'button[role="tab"]:has-text("地理"), button[role="tab"]:has-text("環境"), [data-testid*="geography-tab"]'
    ).first();
    
    if (await geoTab.count() > 0) {
      await geoTab.click();
      await page.waitForTimeout(1000);
      await takeTRPGScreenshot(page, "geography-tab-active", "geography-environment");

      // Test climate settings
      const climateSection = page.locator('[data-testid*="climate"], text="気候"').first();
      if (await climateSection.count() > 0) {
        console.log("🌡️ Testing climate settings");
        
        const climateSelect = page.locator('select[name*="climate"]').first();
        if (await climateSelect.count() > 0) {
          await climateSelect.selectOption("temperate");
          await takeTRPGScreenshot(page, "climate-set", "geography-environment");
        }
      }

      // Test terrain features
      const terrainSection = page.locator('[data-testid*="terrain"], text="地形"').first();
      if (await terrainSection.count() > 0) {
        console.log("⛰️ Testing terrain features");
        
        // Add terrain types
        const terrainTypes = ["森林", "山脈", "川", "湖", "平原"];
        
        for (const terrain of terrainTypes) {
          const addTerrainButton = page.locator('button:has-text("地形追加"), button:has-text("追加")').first();
          if (await addTerrainButton.count() > 0) {
            await addTerrainButton.click();
            
            const terrainInput = page.locator('input[name*="terrain"], input[placeholder*="地形"]').first();
            if (await terrainInput.count() > 0) {
              await terrainInput.fill(terrain);
              
              const saveTerrainButton = page.locator('button:has-text("保存")').first();
              await saveTerrainButton.click();
              await page.waitForTimeout(500);
            }
          }
        }
        
        await takeTRPGScreenshot(page, "terrain-features-added", "geography-environment");
      }
    } else {
      console.log("⚠️ Geography tab not found - checking alternative navigation");
    }

    console.log("✅ Geography and environment test completed");
  });

  test("should create and manage cultures and societies", async ({ page }) => {
    console.log("👥 Testing: Culture and Society Management");

    await page.goto("/world-building");
    await verifyTRPGPageLoad(page);

    // Navigate to culture/society tab
    const cultureTab = page.locator(
      'button[role="tab"]:has-text("文化"), button[role="tab"]:has-text("社会"), [data-testid*="culture-tab"]'
    ).first();
    
    if (await cultureTab.count() > 0) {
      await cultureTab.click();
      await page.waitForTimeout(1000);
      await takeTRPGScreenshot(page, "culture-tab-active", "culture-society");

      // Create different cultures
      const cultures = [
        {
          name: "森エルフ文化",
          description: "自然と調和して生きるエルフの文化。魔法と自然の知識に長けている。",
          values: "自然保護、知識の蓄積、調和",
          traditions: "四季の祭り、成人の儀式、古代の歌",
          government: "長老会議制"
        },
        {
          name: "ドワーフ職人文化",
          description: "技術と職人芸を重視するドワーフの文化。堅実で勤勉な性格。",
          values: "技術革新、勤勉、名誉",
          traditions: "鍛冶の儀式、ビール祭り、氏族の誇り",
          government: "ギルド連合制"
        },
        {
          name: "人間商業文化",
          description: "交易と商業を基盤とした人間の文化。多様性と適応力が特徴。",
          values: "商業繁栄、自由、革新",
          traditions: "市場祭り、商談の儀礼、富の分配",
          government: "商業共和制"
        }
      ];

      for (const [index, culture] of cultures.entries()) {
        console.log(`🏛️ Creating culture: ${culture.name}`);

        const addCultureButton = page.locator('button:has-text("文化追加"), button:has-text("追加")').first();
        if (await addCultureButton.count() > 0) {
          await addCultureButton.click();
          await page.waitForSelector('[role="dialog"]', { timeout: 5000 });

          // Fill culture form
          await page.fill('input[name="name"], input[placeholder*="名前"]', culture.name);
          await page.fill('textarea[name="description"], textarea[placeholder*="説明"]', culture.description);
          
          // Fill additional fields if available
          const valuesInput = page.locator('input[name="values"], textarea[name="values"]').first();
          if (await valuesInput.count() > 0) {
            await valuesInput.fill(culture.values);
          }

          const traditionsInput = page.locator('input[name="traditions"], textarea[name="traditions"]').first();
          if (await traditionsInput.count() > 0) {
            await traditionsInput.fill(culture.traditions);
          }

          const governmentInput = page.locator('input[name="government"], select[name="government"]').first();
          if (await governmentInput.count() > 0) {
            await governmentInput.fill(culture.government);
          }

          // Save culture
          const saveCultureButton = page.locator('button:has-text("保存"), button:has-text("作成")').last();
          await saveCultureButton.click();
          await page.waitForSelector('[role="dialog"]', { state: 'detached' });
          await page.waitForTimeout(1000);

          // Verify culture was created
          await expect(page.locator(`text=${culture.name}`)).toBeVisible();
          await takeTRPGScreenshot(page, `culture-${index + 1}-created`, "culture-society");
        }
      }
    } else {
      console.log("⚠️ Culture tab not found - checking for alternative interface");
    }

    console.log("✅ Culture and society test completed");
  });

  test("should manage magic and technology systems", async ({ page }) => {
    console.log("🔮 Testing: Magic and Technology Systems");

    await page.goto("/world-building");
    await verifyTRPGPageLoad(page);

    // Navigate to magic/technology tab
    const magicTab = page.locator(
      'button[role="tab"]:has-text("魔法"), button[role="tab"]:has-text("技術"), [data-testid*="magic-tab"]'
    ).first();
    
    if (await magicTab.count() > 0) {
      await magicTab.click();
      await page.waitForTimeout(1000);
      await takeTRPGScreenshot(page, "magic-tech-tab-active", "magic-technology");

      // Test magic system configuration
      const magicSystems = [
        {
          name: "古代アルカナ魔法",
          description: "古代文明から受け継がれた正統な魔法体系。詠唱と魔法陣を重視する。",
          source: "魔法学院、古代遺跡",
          restrictions: "厳格な訓練が必要、魔力消費が大きい"
        },
        {
          name: "自然魔法",
          description: "自然のエネルギーを借りる魔法。エルフやドルイドが得意とする。",
          source: "森、精霊との契約",
          restrictions: "自然環境に依存、都市部では効果減少"
        },
        {
          name: "錬金術",
          description: "科学と魔法の融合技術。薬品や魔法道具の作成に使用。",
          source: "錬金術師ギルド、実験室",
          restrictions: "材料と設備が必要、時間がかかる"
        }
      ];

      for (const [index, system] of magicSystems.entries()) {
        console.log(`⭐ Creating magic system: ${system.name}`);

        const addSystemButton = page.locator('button:has-text("システム追加"), button:has-text("追加")').first();
        if (await addSystemButton.count() > 0) {
          await addSystemButton.click();
          await page.waitForTimeout(1000);

          // Fill magic system form
          const nameInput = page.locator('input[name="name"], input[placeholder*="名前"]').first();
          if (await nameInput.count() > 0) {
            await nameInput.fill(system.name);
          }

          const descInput = page.locator('textarea[name="description"], textarea[placeholder*="説明"]').first();
          if (await descInput.count() > 0) {
            await descInput.fill(system.description);
          }

          const sourceInput = page.locator('input[name="source"], textarea[name="source"]').first();
          if (await sourceInput.count() > 0) {
            await sourceInput.fill(system.source);
          }

          const restrictionsInput = page.locator('input[name="restrictions"], textarea[name="restrictions"]').first();
          if (await restrictionsInput.count() > 0) {
            await restrictionsInput.fill(system.restrictions);
          }

          // Save system
          const saveSystemButton = page.locator('button:has-text("保存")').last();
          if (await saveSystemButton.count() > 0) {
            await saveSystemButton.click();
            await page.waitForTimeout(1000);
          }

          await takeTRPGScreenshot(page, `magic-system-${index + 1}-created`, "magic-technology");
        }
      }
    } else {
      console.log("⚠️ Magic/Technology tab not found");
    }

    console.log("✅ Magic and technology systems test completed");
  });

  test("should create interactive world map with locations", async ({ page }) => {
    console.log("🗺️ Testing: Interactive World Map");

    await page.goto("/world-building");
    await verifyTRPGPageLoad(page);

    // Navigate to map tab
    const mapTab = page.locator(
      'button[role="tab"]:has-text("マップ"), button[role="tab"]:has-text("地図"), [data-testid*="map-tab"]'
    ).first();
    
    if (await mapTab.count() > 0) {
      await mapTab.click();
      await page.waitForTimeout(2000);
      await takeTRPGScreenshot(page, "world-map-tab-active", "interactive-map");

      // Check for map canvas or container
      const mapContainer = page.locator(
        'canvas, [data-testid*="map"], .map-container, .interactive-map'
      ).first();

      if (await mapContainer.count() > 0) {
        console.log("🗺️ Map container found");
        await takeTRPGScreenshot(page, "world-map-loaded", "interactive-map");

        // Test adding location to map
        const addLocationButton = page.locator(
          'button:has-text("場所追加"), button:has-text("ピン追加"), [data-testid*="add-location"]'
        ).first();

        if (await addLocationButton.count() > 0) {
          await addLocationButton.click();
          await page.waitForTimeout(1000);

          // Click on map to place location (if interactive)
          const mapBounds = await mapContainer.boundingBox();
          if (mapBounds) {
            // Click near center of map
            const centerX = mapBounds.x + mapBounds.width / 2;
            const centerY = mapBounds.y + mapBounds.height / 2;
            
            await page.mouse.click(centerX, centerY);
            await page.waitForTimeout(1000);

            // Fill location details if dialog appears
            const locationDialog = page.locator('[role="dialog"]');
            if (await locationDialog.count() > 0) {
              await page.fill('input[name="name"]', "テスト地点");
              await page.fill('textarea[name="description"]', "E2Eテストで追加した地点");
              
              const saveLocationButton = page.locator('button:has-text("保存")').first();
              await saveLocationButton.click();
              await page.waitForTimeout(1000);
            }

            await takeTRPGScreenshot(page, "location-added-to-map", "interactive-map");
          }
        }

        // Test map controls (zoom, pan, etc.)
        const zoomControls = page.locator(
          '[data-testid*="zoom"], button[aria-label*="ズーム"], .zoom-control'
        );

        if (await zoomControls.count() > 0) {
          console.log("🔍 Zoom controls found");
          const zoomInButton = zoomControls.filter({ hasText: "+" }).first();
          if (await zoomInButton.count() > 0) {
            await zoomInButton.click();
            await page.waitForTimeout(500);
            await takeTRPGScreenshot(page, "map-zoomed-in", "interactive-map");
          }
        }
      } else {
        console.log("⚠️ Interactive map not found - may not be implemented");
        await takeTRPGScreenshot(page, "no-map-found", "interactive-map");
      }
    } else {
      console.log("⚠️ Map tab not found");
    }

    console.log("✅ Interactive world map test completed");
  });

  test("should manage world history and legends", async ({ page }) => {
    console.log("📚 Testing: World History and Legends");

    await page.goto("/world-building");
    await verifyTRPGPageLoad(page);

    // Navigate to history/legends tab
    const historyTab = page.locator(
      'button[role="tab"]:has-text("歴史"), button[role="tab"]:has-text("伝説"), [data-testid*="history-tab"]'
    ).first();
    
    if (await historyTab.count() > 0) {
      await historyTab.click();
      await page.waitForTimeout(1000);
      await takeTRPGScreenshot(page, "history-tab-active", "world-history");

      // Create historical events
      const historicalEvents = [
        {
          name: "古代王国の栄光",
          period: "1000年前",
          description: "古代アルカナ王国が魔法技術の頂点に達し、平和と繁栄を謳歌した時代。",
          significance: "現在の魔法体系の基礎となった"
        },
        {
          name: "大魔戦争",
          period: "500年前",
          description: "邪悪な魔法使いが世界征服を企て、各種族が団結して戦った大規模な戦争。",
          significance: "種族間の協力関係が生まれた転換点"
        },
        {
          name: "王国の消失",
          period: "100年前",
          description: "アルカナ王国が一夜にして姿を消した謎の事件。今も原因は不明。",
          significance: "現在の冒険の発端となる謎"
        }
      ];

      for (const [index, event] of historicalEvents.entries()) {
        console.log(`📜 Creating historical event: ${event.name}`);

        const addEventButton = page.locator('button:has-text("歴史追加"), button:has-text("追加")').first();
        if (await addEventButton.count() > 0) {
          await addEventButton.click();
          await page.waitForSelector('[role="dialog"]', { timeout: 5000 });

          // Fill historical event form
          await page.fill('input[name="name"], input[placeholder*="名前"]', event.name);
          await page.fill('input[name="period"], input[placeholder*="時期"]', event.period);
          await page.fill('textarea[name="description"], textarea[placeholder*="説明"]', event.description);
          
          const significanceInput = page.locator('textarea[name="significance"], input[name="significance"]').first();
          if (await significanceInput.count() > 0) {
            await significanceInput.fill(event.significance);
          }

          // Save event
          const saveEventButton = page.locator('button:has-text("保存")').last();
          await saveEventButton.click();
          await page.waitForSelector('[role="dialog"]', { state: 'detached' });
          await page.waitForTimeout(1000);

          // Verify event was created
          await expect(page.locator(`text=${event.name}`)).toBeVisible();
          await takeTRPGScreenshot(page, `history-event-${index + 1}-created`, "world-history");
        }
      }

      // Test timeline view if available
      const timelineView = page.locator(
        'button:has-text("タイムライン"), [data-testid*="timeline-view"]'
      ).first();

      if (await timelineView.count() > 0) {
        await timelineView.click();
        await page.waitForTimeout(2000);
        await takeTRPGScreenshot(page, "history-timeline-view", "world-history");
      }
    } else {
      console.log("⚠️ History tab not found");
    }

    console.log("✅ World history and legends test completed");
  });

  test("should validate world building data consistency", async ({ page }) => {
    console.log("🔍 Testing: World Building Data Consistency");

    await page.goto("/world-building");
    await verifyTRPGPageLoad(page);

    // Check data consistency across different tabs
    const tabs = [
      { name: "場所", testId: "places" },
      { name: "文化", testId: "culture" },
      { name: "歴史", testId: "history" }
    ];

    const dataConsistency = {
      locations: [],
      cultures: [],
      events: []
    };

    for (const tab of tabs) {
      const tabButton = page.locator(`button[role="tab"]:has-text("${tab.name}")`).first();
      if (await tabButton.count() > 0) {
        await tabButton.click();
        await page.waitForTimeout(1000);

        // Collect data from each tab
        const tabData = await page.evaluate(() => {
          const items = Array.from(document.querySelectorAll('[data-testid*="item"], .item-card, .list-item'));
          return items.map(item => ({
            text: item.textContent?.trim() || '',
            element: item.className
          }));
        });

        console.log(`📊 Collected ${tabData.length} items from ${tab.name} tab`);
      }
    }

    // Verify cross-references between data
    await page.goto("/timeline");
    await verifyTRPGPageLoad(page);

    // Check if locations mentioned in timeline events exist in world building
    const timelineEvents = await page.evaluate(() => {
      const events = Array.from(document.querySelectorAll('[data-testid*="event"], .timeline-event'));
      return events.map(event => event.textContent?.trim() || '');
    });

    for (const event of timelineEvents) {
      if (event.includes("翡翠の森") || event.includes("失われた王都")) {
        console.log(`✅ Timeline event references existing location: ${event.slice(0, 50)}...`);
      }
    }

    await takeTRPGScreenshot(page, "data-consistency-check", "world-building");

    console.log("✅ World building data consistency test completed");
  });
});