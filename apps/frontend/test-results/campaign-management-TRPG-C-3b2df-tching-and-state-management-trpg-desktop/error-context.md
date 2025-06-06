# Test info

- Name: TRPG Campaign Management >> should handle campaign switching and state management
- Location: /mnt/c/Users/irure/git/AIAgentTRPGGM/apps/frontend/e2e/trpg-core/campaign-management.spec.ts:151:3

# Error details

```
Error: Timed out 10000ms waiting for expect(locator).toBeVisible()

Locator: locator('text=第一キャンペーン')
Expected: visible
Received: <element(s) not found>
Call log:
  - expect.toBeVisible with timeout 10000ms
  - waiting for locator('text=第一キャンペーン')

    at /mnt/c/Users/irure/git/AIAgentTRPGGM/apps/frontend/e2e/trpg-core/campaign-management.spec.ts:173:59
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
   97 |     await expect(page.locator(`text=${testCampaign.title}`)).toBeVisible({ timeout: 10000 });
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
> 173 |     await expect(page.locator(`text=${campaign1.title}`)).toBeVisible();
      |                                                           ^ Error: Timed out 10000ms waiting for expect(locator).toBeVisible()
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
  198 |
  199 |         expect(currentCampaign?.title).toBe(campaign2.title);
  200 |       }
  201 |     } else {
  202 |       console.log("⚠️ Campaign switcher not found - testing alternative navigation");
  203 |       
  204 |       // Try navigating to projects page to switch campaigns
  205 |       await page.goto('/projects');
  206 |       await verifyTRPGPageLoad(page);
  207 |       
  208 |       const campaign2Card = page.locator(`text=${campaign2.title}`).first();
  209 |       if (await campaign2Card.count() > 0) {
  210 |         await campaign2Card.click();
  211 |         await page.waitForTimeout(2000);
  212 |         await expect(page.locator(`text=${campaign2.title}`)).toBeVisible();
  213 |       }
  214 |     }
  215 |
  216 |     console.log("✅ Campaign switching test completed");
  217 |   });
  218 |
  219 |   test("should validate campaign data persistence", async ({ page }) => {
  220 |     console.log("🎲 Testing: Campaign Data Persistence");
  221 |
  222 |     // Set up test campaign
  223 |     const testCampaign = await setupTRPGTestData(page);
  224 |     await navigateToTRPGHome(page);
  225 |
  226 |     // Navigate to different sections and make changes
  227 |     await page.goto("/characters");
  228 |     await verifyTRPGPageLoad(page);
  229 |
  230 |     // Check if character data persists
  231 |     for (const character of testCampaign.playerCharacters) {
  232 |       await expect(page.locator(`text=${character.name}`)).toBeVisible();
  233 |     }
  234 |
  235 |     // Refresh page to test persistence
  236 |     await page.reload();
  237 |     await verifyTRPGPageLoad(page);
  238 |
  239 |     // Verify data is still there after refresh
  240 |     for (const character of testCampaign.playerCharacters) {
  241 |       await expect(page.locator(`text=${character.name}`)).toBeVisible({ timeout: 10000 });
  242 |     }
  243 |
  244 |     // Test navigation to timeline
  245 |     await page.goto("/timeline");
  246 |     await verifyTRPGPageLoad(page);
  247 |
  248 |     for (const event of testCampaign.timeline) {
  249 |       await expect(page.locator(`text=${event.title}`)).toBeVisible();
  250 |     }
  251 |
  252 |     await takeTRPGScreenshot(page, "data-persistence-verified", "campaign-persistence");
  253 |
  254 |     console.log("✅ Campaign data persistence test completed");
  255 |   });
  256 |
  257 |   test("should handle campaign export/import functionality", async ({ page }) => {
  258 |     console.log("🎲 Testing: Campaign Export/Import");
  259 |
  260 |     // Set up test campaign
  261 |     const testCampaign = await setupTRPGTestData(page);
  262 |     await navigateToTRPGHome(page);
  263 |
  264 |     // Look for export functionality
  265 |     const exportButton = page.locator(
  266 |       'button:has-text("エクスポート"), button:has-text("出力"), [data-testid*="export"]'
  267 |     ).first();
  268 |
  269 |     if (await exportButton.count() > 0) {
  270 |       await exportButton.click();
  271 |       await page.waitForTimeout(2000);
  272 |       await takeTRPGScreenshot(page, "export-initiated", "campaign-export-import");
  273 |
```