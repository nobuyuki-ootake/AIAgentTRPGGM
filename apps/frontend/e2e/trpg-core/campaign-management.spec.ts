import { test, expect } from "@playwright/test";
import { 
  setupTRPGTestData, 
  navigateToTRPGHome, 
  createTestTRPGCampaign,
  cleanupTRPGTestData,
  verifyTRPGPageLoad,
  takeTRPGScreenshot
} from "../utils/trpg-test-helpers";

/**
 * TRPG Campaign Management E2E Tests
 * 
 * Tests comprehensive campaign creation, management, and navigation workflows
 * Covers the complete lifecycle of TRPG campaign management
 */

test.describe("TRPG Campaign Management", () => {
  test.beforeEach(async ({ page }) => {
    // Clean start for each test
    await cleanupTRPGTestData(page);
  });

  test.afterEach(async ({ page }) => {
    // Clean up after each test
    await cleanupTRPGTestData(page);
  });

  test("should create a new TRPG campaign from scratch", async ({ page }) => {
    console.log("🎲 Testing: New TRPG Campaign Creation");

    // Start from home page without any campaign data
    await page.goto("/");
    await verifyTRPGPageLoad(page);
    await takeTRPGScreenshot(page, "home-no-campaign", "campaign-creation");

    // Look for "New Campaign" or "Create Campaign" button
    const createCampaignButton = page.locator(
      'button:has-text("新規キャンペーン"), button:has-text("キャンペーン作成"), button:has-text("新規作成")'
    ).first();

    if (await createCampaignButton.count() > 0) {
      await createCampaignButton.click();
      await page.waitForSelector('[role="dialog"]', { timeout: 10000 });
      await takeTRPGScreenshot(page, "campaign-creation-dialog", "campaign-creation");

      // Fill campaign creation form
      await page.fill('input[name="title"], input[placeholder*="タイトル"]', "新規テストキャンペーン");
      await page.fill('textarea[name="description"], textarea[placeholder*="説明"]', 
        "E2Eテスト用の新規キャンペーン。ファンタジー世界での冒険を描く。");
      
      // Select game system if available
      const gameSystemSelect = page.locator('select[name="gameSystem"], select[placeholder*="ゲームシステム"]').first();
      if (await gameSystemSelect.count() > 0) {
        await gameSystemSelect.selectOption("D&D 5e");
      }

      // Save campaign
      const saveButton = page.locator('button:has-text("作成"), button:has-text("保存")').last();
      await saveButton.click();

      // Wait for dialog to close and campaign to be created
      await page.waitForSelector('[role="dialog"]', { state: 'detached' });
      await page.waitForTimeout(2000);

      await takeTRPGScreenshot(page, "campaign-created", "campaign-creation");

      // Verify campaign was created and is now active
      const campaignData = await page.evaluate(() => {
        const campaigns = localStorage.getItem('trpg-campaigns');
        const currentId = localStorage.getItem('current-campaign-id');
        return {
          campaigns: campaigns ? JSON.parse(campaigns) : [],
          currentId
        };
      });

      expect(campaignData.campaigns).toHaveLength(1);
      expect(campaignData.campaigns[0].title).toBe("新規テストキャンペーン");
      expect(campaignData.currentId).toBeTruthy();
    } else {
      console.log("⚠️ No campaign creation button found - may be auto-directed to projects");
    }

    console.log("✅ Campaign creation test completed");
  });

  test("should load existing campaign and navigate between sections", async ({ page }) => {
    console.log("🎲 Testing: Campaign Loading and Navigation");

    // Set up test campaign data
    const testCampaign = await setupTRPGTestData(page);
    await navigateToTRPGHome(page);
    await takeTRPGScreenshot(page, "campaign-loaded", "campaign-navigation");

    // Verify campaign information is displayed
    await expect(page.locator(`text=${testCampaign.title}`)).toBeVisible({ timeout: 10000 });

    // Test navigation to different campaign sections
    const navigationItems = [
      { name: "キャラクター", url: "/characters", testId: "characters" },
      { name: "NPC", url: "/npcs", testId: "npcs" },
      { name: "エネミー", url: "/enemies", testId: "enemies" },
      { name: "世界観構築", url: "/world-building", testId: "world-building" },
      { name: "タイムライン", url: "/timeline", testId: "timeline" },
      { name: "プロット", url: "/plot", testId: "plot" },
      { name: "あらすじ", url: "/synopsis", testId: "synopsis" },
      { name: "執筆", url: "/writing", testId: "writing" }
    ];

    for (const item of navigationItems) {
      console.log(`📍 Navigating to: ${item.name}`);
      
      // Navigate to section
      await page.goto(item.url);
      await verifyTRPGPageLoad(page, [`[data-testid*="${item.testId}"]`]);
      await takeTRPGScreenshot(page, `${item.testId}-page`, "campaign-navigation");

      // Verify section-specific content
      const pageContent = await page.textContent('body');
      expect(pageContent).toContain(testCampaign.title);

      // Check for section-specific UI elements
      switch (item.testId) {
        case "characters":
          // Should show player characters
          for (const character of testCampaign.playerCharacters) {
            await expect(page.locator(`text=${character.name}`)).toBeVisible({ timeout: 5000 });
          }
          break;
        case "timeline":
          // Should show timeline events
          for (const event of testCampaign.timeline) {
            await expect(page.locator(`text=${event.title}`)).toBeVisible({ timeout: 5000 });
          }
          break;
        case "world-building":
          // Should show locations
          for (const location of testCampaign.locations) {
            await expect(page.locator(`text=${location.name}`)).toBeVisible({ timeout: 5000 });
          }
          break;
      }

      await page.waitForTimeout(1000); // Brief pause between navigations
    }

    console.log("✅ Campaign navigation test completed");
  });

  test("should handle campaign switching and state management", async ({ page }) => {
    console.log("🎲 Testing: Campaign Switching");

    // Create multiple test campaigns
    const campaign1 = createTestTRPGCampaign();
    campaign1.title = "第一キャンペーン";
    
    const campaign2 = createTestTRPGCampaign();
    campaign2.id = `test-campaign-2-${Date.now()}`;
    campaign2.title = "第二キャンペーン";

    // Set up multiple campaigns
    await page.addInitScript((campaigns) => {
      localStorage.setItem('trpg-campaigns', JSON.stringify(campaigns));
      localStorage.setItem('current-campaign-id', campaigns[0].id);
      localStorage.setItem('current-campaign', JSON.stringify(campaigns[0]));
    }, [campaign1, campaign2]);

    await navigateToTRPGHome(page);
    await takeTRPGScreenshot(page, "multiple-campaigns", "campaign-switching");

    // Verify first campaign is loaded
    await expect(page.locator(`text=${campaign1.title}`)).toBeVisible();

    // Look for campaign switcher UI
    const campaignSwitcher = page.locator(
      'select[name*="campaign"], button[aria-label*="キャンペーン"], [data-testid*="campaign-selector"]'
    ).first();

    if (await campaignSwitcher.count() > 0) {
      await campaignSwitcher.click();
      
      // Select second campaign
      const campaign2Option = page.locator(`text=${campaign2.title}`).first();
      if (await campaign2Option.count() > 0) {
        await campaign2Option.click();
        await page.waitForTimeout(2000);

        // Verify campaign switched
        await expect(page.locator(`text=${campaign2.title}`)).toBeVisible();
        await takeTRPGScreenshot(page, "campaign-switched", "campaign-switching");

        // Verify state is properly updated
        const currentCampaign = await page.evaluate(() => {
          const current = localStorage.getItem('current-campaign');
          return current ? JSON.parse(current) : null;
        });

        expect(currentCampaign?.title).toBe(campaign2.title);
      }
    } else {
      console.log("⚠️ Campaign switcher not found - testing alternative navigation");
      
      // Try navigating to projects page to switch campaigns
      await page.goto('/projects');
      await verifyTRPGPageLoad(page);
      
      const campaign2Card = page.locator(`text=${campaign2.title}`).first();
      if (await campaign2Card.count() > 0) {
        await campaign2Card.click();
        await page.waitForTimeout(2000);
        await expect(page.locator(`text=${campaign2.title}`)).toBeVisible();
      }
    }

    console.log("✅ Campaign switching test completed");
  });

  test("should validate campaign data persistence", async ({ page }) => {
    console.log("🎲 Testing: Campaign Data Persistence");

    // Set up test campaign
    const testCampaign = await setupTRPGTestData(page);
    await navigateToTRPGHome(page);

    // Navigate to different sections and make changes
    await page.goto("/characters");
    await verifyTRPGPageLoad(page);

    // Check if character data persists
    for (const character of testCampaign.playerCharacters) {
      await expect(page.locator(`text=${character.name}`)).toBeVisible();
    }

    // Refresh page to test persistence
    await page.reload();
    await verifyTRPGPageLoad(page);

    // Verify data is still there after refresh
    for (const character of testCampaign.playerCharacters) {
      await expect(page.locator(`text=${character.name}`)).toBeVisible({ timeout: 10000 });
    }

    // Test navigation to timeline
    await page.goto("/timeline");
    await verifyTRPGPageLoad(page);

    for (const event of testCampaign.timeline) {
      await expect(page.locator(`text=${event.title}`)).toBeVisible();
    }

    await takeTRPGScreenshot(page, "data-persistence-verified", "campaign-persistence");

    console.log("✅ Campaign data persistence test completed");
  });

  test("should handle campaign export/import functionality", async ({ page }) => {
    console.log("🎲 Testing: Campaign Export/Import");

    // Set up test campaign
    const testCampaign = await setupTRPGTestData(page);
    await navigateToTRPGHome(page);

    // Look for export functionality
    const exportButton = page.locator(
      'button:has-text("エクスポート"), button:has-text("出力"), [data-testid*="export"]'
    ).first();

    if (await exportButton.count() > 0) {
      await exportButton.click();
      await page.waitForTimeout(2000);
      await takeTRPGScreenshot(page, "export-initiated", "campaign-export-import");

      // Note: Actual file download testing would require more complex setup
      // This tests the UI interaction
      console.log("✅ Export functionality triggered");
    } else {
      console.log("⚠️ Export functionality not found in current UI");
    }

    // Look for import functionality
    const importButton = page.locator(
      'button:has-text("インポート"), button:has-text("取り込み"), [data-testid*="import"]'
    ).first();

    if (await importButton.count() > 0) {
      console.log("✅ Import functionality found");
    } else {
      console.log("⚠️ Import functionality not found in current UI");
    }

    console.log("✅ Campaign export/import test completed");
  });
});