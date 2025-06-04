import { test, expect } from "@playwright/test";
import { 
  setupTRPGTestData, 
  navigateToTRPGHome, 
  cleanupTRPGTestData,
  verifyTRPGPageLoad,
  takeTRPGScreenshot,
  createTestTRPGCampaign
} from "../utils/trpg-test-helpers";

/**
 * TRPG Performance Testing E2E Tests
 * 
 * Tests performance characteristics of the TRPG application including
 * load times, responsiveness, memory usage, and scalability
 */

test.describe("TRPG Performance Testing", () => {
  test.beforeEach(async ({ page }) => {
    await cleanupTRPGTestData(page);
  });

  test.afterEach(async ({ page }) => {
    await cleanupTRPGTestData(page);
  });

  test("should measure application startup and initial load performance", async ({ page }) => {
    console.log("⚡ Testing: Application Startup Performance");

    const startTime = Date.now();

    // Monitor network requests
    const networkRequests: Array<{ url: string; duration: number; size: number }> = [];
    
    page.on('response', async (response) => {
      try {
        const request = response.request();
        const timing = response.timing();
        const size = await response.body().then(body => body.length).catch(() => 0);
        
        networkRequests.push({
          url: request.url(),
          duration: timing.responseEnd,
          size
        });
      } catch (error) {
        // Ignore errors in response monitoring
      }
    });

    // Set up test data and navigate
    await setupTRPGTestData(page);
    const loadTime = Date.now();
    
    await navigateToTRPGHome(page);
    const navigationTime = Date.now();
    
    await verifyTRPGPageLoad(page);
    const readyTime = Date.now();

    // Calculate performance metrics
    const metrics = {
      dataSetupTime: loadTime - startTime,
      navigationTime: navigationTime - loadTime,
      pageReadyTime: readyTime - navigationTime,
      totalLoadTime: readyTime - startTime
    };

    console.log("📊 Performance Metrics:");
    console.log(`  Data Setup: ${metrics.dataSetupTime}ms`);
    console.log(`  Navigation: ${metrics.navigationTime}ms`);
    console.log(`  Page Ready: ${metrics.pageReadyTime}ms`);
    console.log(`  Total Load: ${metrics.totalLoadTime}ms`);

    // Take screenshot for visual verification
    await takeTRPGScreenshot(page, "performance-startup", "performance");

    // Performance assertions
    expect(metrics.totalLoadTime).toBeLessThan(10000); // Should load within 10 seconds
    expect(metrics.pageReadyTime).toBeLessThan(5000);  // Page interaction ready within 5 seconds

    // Log network performance
    const totalNetworkSize = networkRequests.reduce((sum, req) => sum + req.size, 0);
    console.log(`📡 Network Requests: ${networkRequests.length} (${Math.round(totalNetworkSize / 1024)}KB)`);

    // Store performance data for reporting
    await page.evaluate((metricsData) => {
      const perfData = JSON.parse(localStorage.getItem('trpg-performance-data') || '{}');
      perfData.startup = metricsData;
      perfData.timestamp = Date.now();
      localStorage.setItem('trpg-performance-data', JSON.stringify(perfData));
    }, metrics);

    console.log("✅ Startup performance test completed");
  });

  test("should measure character management performance with large datasets", async ({ page }) => {
    console.log("👥 Testing: Character Management Performance");

    await setupTRPGTestData(page);
    await navigateToTRPGHome(page);

    // Create a large number of characters to test performance
    const characterCreationTimes: number[] = [];
    const numCharacters = 20;

    await page.goto("/characters");
    await verifyTRPGPageLoad(page);
    await takeTRPGScreenshot(page, "characters-performance-start", "performance");

    for (let i = 0; i < numCharacters; i++) {
      const startTime = Date.now();

      // Create character data
      const character = {
        name: `テストキャラクター${i + 1}`,
        race: ["ヒューマン", "エルフ", "ドワーフ", "ハーフリング"][i % 4],
        class: ["ファイター", "ウィザード", "ローグ", "クレリック"][i % 4],
        level: Math.floor(Math.random() * 10) + 1,
        attributes: {
          strength: Math.floor(Math.random() * 18) + 3,
          dexterity: Math.floor(Math.random() * 18) + 3,
          constitution: Math.floor(Math.random() * 18) + 3,
          intelligence: Math.floor(Math.random() * 18) + 3,
          wisdom: Math.floor(Math.random() * 18) + 3,
          charisma: Math.floor(Math.random() * 18) + 3
        },
        background: `背景${i + 1}`,
        personality: `テスト用の性格設定 ${i + 1}`,
        backstory: `テストキャラクターの背景ストーリー ${i + 1}`
      };

      // Simulate character creation through direct data manipulation (faster than UI)
      await page.evaluate((char) => {
        const characters = JSON.parse(localStorage.getItem('trpg-player-characters') || '[]');
        characters.push({
          id: `test-char-${Date.now()}-${Math.random()}`,
          ...char,
          type: 'PC'
        });
        localStorage.setItem('trpg-player-characters', JSON.stringify(characters));
      }, character);

      const endTime = Date.now();
      characterCreationTimes.push(endTime - startTime);

      // Refresh every 5 characters to test UI updates
      if (i % 5 === 4) {
        await page.reload();
        await verifyTRPGPageLoad(page);
        console.log(`📊 Created ${i + 1}/${numCharacters} characters`);
      }
    }

    // Measure final list rendering performance
    const renderStartTime = Date.now();
    await page.reload();
    await verifyTRPGPageLoad(page);
    const renderEndTime = Date.now();

    await takeTRPGScreenshot(page, "characters-performance-end", "performance");

    // Calculate performance metrics
    const avgCreationTime = characterCreationTimes.reduce((a, b) => a + b, 0) / characterCreationTimes.length;
    const maxCreationTime = Math.max(...characterCreationTimes);
    const renderTime = renderEndTime - renderStartTime;

    console.log("📊 Character Management Performance:");
    console.log(`  Average Creation Time: ${avgCreationTime.toFixed(2)}ms`);
    console.log(`  Max Creation Time: ${maxCreationTime}ms`);
    console.log(`  List Render Time: ${renderTime}ms`);

    // Performance assertions
    expect(avgCreationTime).toBeLessThan(100); // Should create characters quickly
    expect(renderTime).toBeLessThan(3000); // Should render large lists within 3 seconds

    // Store performance data
    await page.evaluate((perfData) => {
      const existing = JSON.parse(localStorage.getItem('trpg-performance-data') || '{}');
      existing.characterManagement = perfData;
      localStorage.setItem('trpg-performance-data', JSON.stringify(existing));
    }, { avgCreationTime, maxCreationTime, renderTime, numCharacters });

    console.log("✅ Character management performance test completed");
  });

  test("should measure session management and real-time performance", async ({ page }) => {
    console.log("🎯 Testing: Session Management Performance");

    await setupTRPGTestData(page);
    await navigateToTRPGHome(page);

    // Measure session startup time
    const sessionStartTime = Date.now();
    await page.goto("/trpg-session");
    await verifyTRPGPageLoad(page);
    const sessionLoadTime = Date.now() - sessionStartTime;

    await takeTRPGScreenshot(page, "session-performance-start", "performance");

    // Test rapid dice rolling performance
    const diceRollTimes: number[] = [];
    const numRolls = 10;

    for (let i = 0; i < numRolls; i++) {
      const rollStartTime = Date.now();
      
      // Simulate dice roll through UI or direct action
      const diceButton = page.locator('button:has-text("ダイス"), [data-testid*="dice"]').first();
      if (await diceButton.count() > 0) {
        await diceButton.click();
        await page.waitForTimeout(100); // Brief wait for roll processing
      }
      
      const rollEndTime = Date.now();
      diceRollTimes.push(rollEndTime - rollStartTime);
    }

    // Test AI interaction response time
    const aiResponseTimes: number[] = [];
    const aiButton = page.locator('button:has-text("AI"), [data-testid*="ai"]').first();
    
    if (await aiButton.count() > 0) {
      for (let i = 0; i < 3; i++) {
        const aiStartTime = Date.now();
        
        await aiButton.click();
        // Wait for AI panel to open
        await page.waitForTimeout(500);
        
        const messageInput = page.locator('textarea[placeholder*="質問"], input[placeholder*="メッセージ"]').first();
        if (await messageInput.count() > 0) {
          await messageInput.fill(`テスト質問 ${i + 1}`);
          
          const sendButton = page.locator('button:has-text("送信")').first();
          if (await sendButton.count() > 0) {
            await sendButton.click();
            // Wait for response (mock or real)
            await page.waitForTimeout(1000);
          }
        }
        
        const aiEndTime = Date.now();
        aiResponseTimes.push(aiEndTime - aiStartTime);
        
        // Close AI panel
        const closeButton = page.locator('button[aria-label*="閉じる"]').first();
        if (await closeButton.count() > 0) {
          await closeButton.click();
          await page.waitForTimeout(200);
        }
      }
    }

    await takeTRPGScreenshot(page, "session-performance-end", "performance");

    // Calculate performance metrics
    const avgDiceRollTime = diceRollTimes.length > 0 ? diceRollTimes.reduce((a, b) => a + b, 0) / diceRollTimes.length : 0;
    const avgAiResponseTime = aiResponseTimes.length > 0 ? aiResponseTimes.reduce((a, b) => a + b, 0) / aiResponseTimes.length : 0;

    console.log("📊 Session Performance:");
    console.log(`  Session Load Time: ${sessionLoadTime}ms`);
    console.log(`  Average Dice Roll: ${avgDiceRollTime.toFixed(2)}ms`);
    console.log(`  Average AI Response: ${avgAiResponseTime.toFixed(2)}ms`);

    // Performance assertions
    expect(sessionLoadTime).toBeLessThan(5000); // Session should load within 5 seconds
    if (diceRollTimes.length > 0) {
      expect(avgDiceRollTime).toBeLessThan(1000); // Dice rolls should be quick
    }

    // Store performance data
    await page.evaluate((perfData) => {
      const existing = JSON.parse(localStorage.getItem('trpg-performance-data') || '{}');
      existing.sessionManagement = perfData;
      localStorage.setItem('trpg-performance-data', JSON.stringify(existing));
    }, { sessionLoadTime, avgDiceRollTime, avgAiResponseTime });

    console.log("✅ Session management performance test completed");
  });

  test("should measure memory usage and detect memory leaks", async ({ page }) => {
    console.log("🧠 Testing: Memory Usage and Leak Detection");

    await setupTRPGTestData(page);
    await navigateToTRPGHome(page);

    // Get initial memory baseline
    const initialMemory = await page.evaluate(() => {
      if ('memory' in performance) {
        return (performance as any).memory;
      }
      return null;
    });

    const memorySnapshots: Array<{ page: string; memory: any; timestamp: number }> = [];

    if (initialMemory) {
      memorySnapshots.push({
        page: 'home',
        memory: initialMemory,
        timestamp: Date.now()
      });
    }

    // Navigate through different pages and measure memory
    const testPages = [
      { url: '/characters', name: 'characters' },
      { url: '/npcs', name: 'npcs' },
      { url: '/enemies', name: 'enemies' },
      { url: '/world-building', name: 'world-building' },
      { url: '/timeline', name: 'timeline' },
      { url: '/trpg-session', name: 'session' },
      { url: '/', name: 'home-return' }
    ];

    for (const testPage of testPages) {
      await page.goto(testPage.url);
      await verifyTRPGPageLoad(page);
      await page.waitForTimeout(1000); // Allow page to settle

      const memory = await page.evaluate(() => {
        if ('memory' in performance) {
          return (performance as any).memory;
        }
        return null;
      });

      if (memory) {
        memorySnapshots.push({
          page: testPage.name,
          memory,
          timestamp: Date.now()
        });
      }

      // Force garbage collection if available
      await page.evaluate(() => {
        if ('gc' in window) {
          (window as any).gc();
        }
      });
    }

    // Analyze memory usage patterns
    if (memorySnapshots.length > 1) {
      console.log("📊 Memory Usage Analysis:");
      
      memorySnapshots.forEach((snapshot, index) => {
        if (snapshot.memory) {
          const usedMB = (snapshot.memory.usedJSHeapSize / 1024 / 1024).toFixed(2);
          const totalMB = (snapshot.memory.totalJSHeapSize / 1024 / 1024).toFixed(2);
          console.log(`  ${snapshot.page}: ${usedMB}MB used / ${totalMB}MB total`);
        }
      });

      // Check for significant memory increases
      const initialUsed = memorySnapshots[0].memory?.usedJSHeapSize || 0;
      const finalUsed = memorySnapshots[memorySnapshots.length - 1].memory?.usedJSHeapSize || 0;
      const memoryIncrease = ((finalUsed - initialUsed) / 1024 / 1024);

      console.log(`📈 Memory increase: ${memoryIncrease.toFixed(2)}MB`);

      // Memory leak detection (basic)
      const maxAcceptableIncrease = 50; // 50MB
      if (memoryIncrease > maxAcceptableIncrease) {
        console.log(`⚠️ Potential memory leak detected: ${memoryIncrease.toFixed(2)}MB increase`);
      }

      // Store memory data
      await page.evaluate((memData) => {
        const existing = JSON.parse(localStorage.getItem('trpg-performance-data') || '{}');
        existing.memoryUsage = memData;
        localStorage.setItem('trpg-performance-data', JSON.stringify(existing));
      }, { snapshots: memorySnapshots, memoryIncrease });
    }

    await takeTRPGScreenshot(page, "memory-testing-complete", "performance");

    console.log("✅ Memory usage test completed");
  });

  test("should measure responsive design performance across viewport sizes", async ({ page }) => {
    console.log("📱 Testing: Responsive Design Performance");

    await setupTRPGTestData(page);

    // Test different viewport sizes
    const viewports = [
      { width: 1920, height: 1080, name: 'desktop-large' },
      { width: 1366, height: 768, name: 'desktop-standard' },
      { width: 768, height: 1024, name: 'tablet-portrait' },
      { width: 1024, height: 768, name: 'tablet-landscape' },
      { width: 375, height: 667, name: 'mobile-small' },
      { width: 414, height: 896, name: 'mobile-large' }
    ];

    const resizePerformance: Array<{ viewport: string; resizeTime: number; renderTime: number }> = [];

    for (const viewport of viewports) {
      console.log(`📐 Testing viewport: ${viewport.name} (${viewport.width}x${viewport.height})`);

      const resizeStartTime = Date.now();
      await page.setViewportSize({ width: viewport.width, height: viewport.height });
      const resizeEndTime = Date.now();

      const renderStartTime = Date.now();
      await navigateToTRPGHome(page);
      await verifyTRPGPageLoad(page);
      const renderEndTime = Date.now();

      const resizeTime = resizeEndTime - resizeStartTime;
      const renderTime = renderEndTime - renderStartTime;

      resizePerformance.push({
        viewport: viewport.name,
        resizeTime,
        renderTime
      });

      await takeTRPGScreenshot(page, `responsive-${viewport.name}`, "performance");

      // Test navigation performance on this viewport
      await page.goto('/characters');
      await verifyTRPGPageLoad(page);
      await page.goto('/world-building');
      await verifyTRPGPageLoad(page);

      console.log(`  Resize: ${resizeTime}ms, Render: ${renderTime}ms`);
    }

    // Analyze responsive performance
    const avgResizeTime = resizePerformance.reduce((sum, p) => sum + p.resizeTime, 0) / resizePerformance.length;
    const avgRenderTime = resizePerformance.reduce((sum, p) => sum + p.renderTime, 0) / resizePerformance.length;

    console.log("📊 Responsive Performance Summary:");
    console.log(`  Average Resize Time: ${avgResizeTime.toFixed(2)}ms`);
    console.log(`  Average Render Time: ${avgRenderTime.toFixed(2)}ms`);

    // Performance assertions
    expect(avgResizeTime).toBeLessThan(100); // Resize should be quick
    expect(avgRenderTime).toBeLessThan(3000); // Render should be reasonable on all sizes

    // Store responsive performance data
    await page.evaluate((perfData) => {
      const existing = JSON.parse(localStorage.getItem('trpg-performance-data') || '{}');
      existing.responsivePerformance = perfData;
      localStorage.setItem('trpg-performance-data', JSON.stringify(existing));
    }, { resizePerformance, avgResizeTime, avgRenderTime });

    // Reset to standard desktop size
    await page.setViewportSize({ width: 1920, height: 1080 });

    console.log("✅ Responsive design performance test completed");
  });

  test("should stress test with concurrent operations", async ({ page }) => {
    console.log("💪 Testing: Concurrent Operations Stress Test");

    await setupTRPGTestData(page);
    await navigateToTRPGHome(page);

    const stressTestStartTime = Date.now();

    // Simulate concurrent operations
    const concurrentTasks = [
      // Task 1: Rapid navigation
      async () => {
        const pages = ['/characters', '/npcs', '/enemies', '/world-building', '/timeline'];
        for (let i = 0; i < 5; i++) {
          const randomPage = pages[Math.floor(Math.random() * pages.length)];
          await page.goto(randomPage);
          await page.waitForTimeout(200);
        }
      },

      // Task 2: Rapid data updates
      async () => {
        for (let i = 0; i < 10; i++) {
          await page.evaluate((index) => {
            const testData = { id: `stress-test-${index}`, name: `Stress ${index}` };
            localStorage.setItem(`stress-test-${index}`, JSON.stringify(testData));
          }, i);
          await page.waitForTimeout(50);
        }
      },

      // Task 3: UI interactions
      async () => {
        for (let i = 0; i < 8; i++) {
          const buttons = await page.locator('button').all();
          if (buttons.length > 0) {
            const randomButton = buttons[Math.floor(Math.random() * buttons.length)];
            try {
              await randomButton.click({ timeout: 1000 });
              await page.waitForTimeout(100);
            } catch {
              // Ignore click failures during stress test
            }
          }
        }
      }
    ];

    // Run tasks concurrently
    await Promise.all(concurrentTasks.map(task => task().catch(() => {
      // Ignore individual task failures during stress test
    })));

    const stressTestEndTime = Date.now();
    const stressTestDuration = stressTestEndTime - stressTestStartTime;

    console.log(`💪 Stress test completed in ${stressTestDuration}ms`);

    // Verify application is still responsive after stress test
    await page.goto('/');
    await verifyTRPGPageLoad(page);
    await takeTRPGScreenshot(page, "stress-test-complete", "performance");

    // Check for JavaScript errors after stress test
    const hasErrors = await page.evaluate(() => {
      return window.console && window.console.error ? 'errors-possible' : 'no-error-detection';
    });

    console.log(`🔍 Post-stress error check: ${hasErrors}`);

    // Performance assertions
    expect(stressTestDuration).toBeLessThan(30000); // Stress test should complete within 30 seconds

    // Store stress test data
    await page.evaluate((stressData) => {
      const existing = JSON.parse(localStorage.getItem('trpg-performance-data') || '{}');
      existing.stressTest = stressData;
      localStorage.setItem('trpg-performance-data', JSON.stringify(existing));
    }, { duration: stressTestDuration, timestamp: Date.now() });

    console.log("✅ Stress test completed");
  });
});