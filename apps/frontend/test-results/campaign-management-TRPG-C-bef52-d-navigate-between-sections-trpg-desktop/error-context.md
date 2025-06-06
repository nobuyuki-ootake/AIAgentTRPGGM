# Test info

- Name: TRPG Campaign Management >> should load existing campaign and navigate between sections
- Location: /mnt/c/Users/irure/git/AIAgentTRPGGM/apps/frontend/e2e/trpg-core/campaign-management.spec.ts:88:3

# Error details

```
Error: Timed out 10000ms waiting for expect(locator).toBeVisible()

Locator: locator('text=テストTRPGキャンペーン：失われた王国の謎')
Expected: visible
Received: <element(s) not found>
Call log:
  - expect.toBeVisible with timeout 10000ms
  - waiting for locator('text=テストTRPGキャンペーン：失われた王国の謎')

    at /mnt/c/Users/irure/git/AIAgentTRPGGM/apps/frontend/e2e/trpg-core/campaign-management.spec.ts:97:62
```

# Page snapshot

```yaml
- heading "キャンペーンメニュー" [level=6]
- button
- separator
- list:
  - listitem:
    - button "パーティー"
  - listitem:
    - button "セッション履歴"
  - listitem:
    - button "TRPGセッション"
- checkbox "developer mode toggle"
- paragraph: 開発者モード
- text: キャンペーン設計機能を有効化
- button "ホームに戻る"
- text: ※作業中のキャンペーンを閉じます
```

# Test source

```ts
   1 | import { test, expect } from "@playwright/test";
   2 | import { 
   3 |   setupTRPGTestData, 
   4 |   navigateToTRPGHome, 
   5 |   createTestTRPGCampaign,
   6 |   cleanupTRPGTestData,
   7 |   verifyTRPGPageLoad,
   8 |   takeTRPGScreenshot
   9 | } from "../utils/trpg-test-helpers";
   10 |
   11 | /**
   12 |  * TRPG Campaign Management E2E Tests
   13 |  * 
   14 |  * Tests comprehensive campaign creation, management, and navigation workflows
   15 |  * Covers the complete lifecycle of TRPG campaign management
   16 |  */
   17 |
   18 | test.describe("TRPG Campaign Management", () => {
   19 |   test.beforeEach(async ({ page }) => {
   20 |     // Clean start for each test
   21 |     await cleanupTRPGTestData(page);
   22 |   });
   23 |
   24 |   test.afterEach(async ({ page }) => {
   25 |     // Clean up after each test
   26 |     await cleanupTRPGTestData(page);
   27 |   });
   28 |
   29 |   test("should create a new TRPG campaign from scratch", async ({ page }) => {
   30 |     console.log("🎲 Testing: New TRPG Campaign Creation");
   31 |
   32 |     // Start from home page without any campaign data
   33 |     await page.goto("/");
   34 |     await verifyTRPGPageLoad(page);
   35 |     await takeTRPGScreenshot(page, "home-no-campaign", "campaign-creation");
   36 |
   37 |     // Look for "New Campaign" or "Create Campaign" button
   38 |     const createCampaignButton = page.locator(
   39 |       'button:has-text("新規キャンペーン"), button:has-text("キャンペーン作成"), button:has-text("新規作成")'
   40 |     ).first();
   41 |
   42 |     if (await createCampaignButton.count() > 0) {
   43 |       await createCampaignButton.click();
   44 |       await page.waitForSelector('[role="dialog"]', { timeout: 10000 });
   45 |       await takeTRPGScreenshot(page, "campaign-creation-dialog", "campaign-creation");
   46 |
   47 |       // Fill campaign creation form
   48 |       await page.fill('input[name="title"], input[placeholder*="タイトル"]', "新規テストキャンペーン");
   49 |       await page.fill('textarea[name="description"], textarea[placeholder*="説明"]', 
   50 |         "E2Eテスト用の新規キャンペーン。ファンタジー世界での冒険を描く。");
   51 |       
   52 |       // Select game system if available
   53 |       const gameSystemSelect = page.locator('select[name="gameSystem"], select[placeholder*="ゲームシステム"]').first();
   54 |       if (await gameSystemSelect.count() > 0) {
   55 |         await gameSystemSelect.selectOption("D&D 5e");
   56 |       }
   57 |
   58 |       // Save campaign
   59 |       const saveButton = page.locator('button:has-text("作成"), button:has-text("保存")').last();
   60 |       await saveButton.click();
   61 |
   62 |       // Wait for dialog to close and campaign to be created
   63 |       await page.waitForSelector('[role="dialog"]', { state: 'detached' });
   64 |       await page.waitForTimeout(2000);
   65 |
   66 |       await takeTRPGScreenshot(page, "campaign-created", "campaign-creation");
   67 |
   68 |       // Verify campaign was created and is now active
   69 |       const campaignData = await page.evaluate(() => {
   70 |         const campaigns = localStorage.getItem('trpg-campaigns');
   71 |         const currentId = localStorage.getItem('current-campaign-id');
   72 |         return {
   73 |           campaigns: campaigns ? JSON.parse(campaigns) : [],
   74 |           currentId
   75 |         };
   76 |       });
   77 |
   78 |       expect(campaignData.campaigns).toHaveLength(1);
   79 |       expect(campaignData.campaigns[0].title).toBe("新規テストキャンペーン");
   80 |       expect(campaignData.currentId).toBeTruthy();
   81 |     } else {
   82 |       console.log("⚠️ No campaign creation button found - may be auto-directed to projects");
   83 |     }
   84 |
   85 |     console.log("✅ Campaign creation test completed");
   86 |   });
   87 |
   88 |   test("should load existing campaign and navigate between sections", async ({ page }) => {
   89 |     console.log("🎲 Testing: Campaign Loading and Navigation");
   90 |
   91 |     // Set up test campaign data
   92 |     const testCampaign = await setupTRPGTestData(page);
   93 |     await navigateToTRPGHome(page);
   94 |     await takeTRPGScreenshot(page, "campaign-loaded", "campaign-navigation");
   95 |
   96 |     // Verify campaign information is displayed
>  97 |     await expect(page.locator(`text=${testCampaign.title}`)).toBeVisible({ timeout: 10000 });
      |                                                              ^ Error: Timed out 10000ms waiting for expect(locator).toBeVisible()
   98 |
   99 |     // Test navigation to different campaign sections
  100 |     const navigationItems = [
  101 |       { name: "キャラクター", url: "/characters", testId: "characters" },
  102 |       { name: "NPC", url: "/npcs", testId: "npcs" },
  103 |       { name: "エネミー", url: "/enemies", testId: "enemies" },
  104 |       { name: "世界観構築", url: "/world-building", testId: "world-building" },
  105 |       { name: "タイムライン", url: "/timeline", testId: "timeline" },
  106 |       { name: "プロット", url: "/plot", testId: "plot" },
  107 |       { name: "あらすじ", url: "/synopsis", testId: "synopsis" },
  108 |       { name: "執筆", url: "/writing", testId: "writing" }
  109 |     ];
  110 |
  111 |     for (const item of navigationItems) {
  112 |       console.log(`📍 Navigating to: ${item.name}`);
  113 |       
  114 |       // Navigate to section
  115 |       await page.goto(item.url);
  116 |       await verifyTRPGPageLoad(page, [`[data-testid*="${item.testId}"]`]);
  117 |       await takeTRPGScreenshot(page, `${item.testId}-page`, "campaign-navigation");
  118 |
  119 |       // Verify section-specific content
  120 |       const pageContent = await page.textContent('body');
  121 |       expect(pageContent).toContain(testCampaign.title);
  122 |
  123 |       // Check for section-specific UI elements
  124 |       switch (item.testId) {
  125 |         case "characters":
  126 |           // Should show player characters
  127 |           for (const character of testCampaign.playerCharacters) {
  128 |             await expect(page.locator(`text=${character.name}`)).toBeVisible({ timeout: 5000 });
  129 |           }
  130 |           break;
  131 |         case "timeline":
  132 |           // Should show timeline events
  133 |           for (const event of testCampaign.timeline) {
  134 |             await expect(page.locator(`text=${event.title}`)).toBeVisible({ timeout: 5000 });
  135 |           }
  136 |           break;
  137 |         case "world-building":
  138 |           // Should show locations
  139 |           for (const location of testCampaign.locations) {
  140 |             await expect(page.locator(`text=${location.name}`)).toBeVisible({ timeout: 5000 });
  141 |           }
  142 |           break;
  143 |       }
  144 |
  145 |       await page.waitForTimeout(1000); // Brief pause between navigations
  146 |     }
  147 |
  148 |     console.log("✅ Campaign navigation test completed");
  149 |   });
  150 |
  151 |   test("should handle campaign switching and state management", async ({ page }) => {
  152 |     console.log("🎲 Testing: Campaign Switching");
  153 |
  154 |     // Create multiple test campaigns
  155 |     const campaign1 = createTestTRPGCampaign();
  156 |     campaign1.title = "第一キャンペーン";
  157 |     
  158 |     const campaign2 = createTestTRPGCampaign();
  159 |     campaign2.id = `test-campaign-2-${Date.now()}`;
  160 |     campaign2.title = "第二キャンペーン";
  161 |
  162 |     // Set up multiple campaigns
  163 |     await page.addInitScript((campaigns) => {
  164 |       localStorage.setItem('trpg-campaigns', JSON.stringify(campaigns));
  165 |       localStorage.setItem('current-campaign-id', campaigns[0].id);
  166 |       localStorage.setItem('current-campaign', JSON.stringify(campaigns[0]));
  167 |     }, [campaign1, campaign2]);
  168 |
  169 |     await navigateToTRPGHome(page);
  170 |     await takeTRPGScreenshot(page, "multiple-campaigns", "campaign-switching");
  171 |
  172 |     // Verify first campaign is loaded
  173 |     await expect(page.locator(`text=${campaign1.title}`)).toBeVisible();
  174 |
  175 |     // Look for campaign switcher UI
  176 |     const campaignSwitcher = page.locator(
  177 |       'select[name*="campaign"], button[aria-label*="キャンペーン"], [data-testid*="campaign-selector"]'
  178 |     ).first();
  179 |
  180 |     if (await campaignSwitcher.count() > 0) {
  181 |       await campaignSwitcher.click();
  182 |       
  183 |       // Select second campaign
  184 |       const campaign2Option = page.locator(`text=${campaign2.title}`).first();
  185 |       if (await campaign2Option.count() > 0) {
  186 |         await campaign2Option.click();
  187 |         await page.waitForTimeout(2000);
  188 |
  189 |         // Verify campaign switched
  190 |         await expect(page.locator(`text=${campaign2.title}`)).toBeVisible();
  191 |         await takeTRPGScreenshot(page, "campaign-switched", "campaign-switching");
  192 |
  193 |         // Verify state is properly updated
  194 |         const currentCampaign = await page.evaluate(() => {
  195 |           const current = localStorage.getItem('current-campaign');
  196 |           return current ? JSON.parse(current) : null;
  197 |         });
```