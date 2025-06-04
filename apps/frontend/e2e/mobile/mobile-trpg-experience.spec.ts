import { test, expect } from "@playwright/test";
import { 
  setupTRPGTestData, 
  navigateToTRPGHome, 
  cleanupTRPGTestData,
  verifyTRPGPageLoad,
  takeTRPGScreenshot,
  rollDice,
  startTRPGSession
} from "../utils/trpg-test-helpers";

/**
 * Mobile TRPG Experience E2E Tests
 * 
 * Tests the TRPG application on mobile devices including touch interactions,
 * responsive design, mobile-specific features, and accessibility
 */

test.describe("Mobile TRPG Experience", () => {
  test.beforeEach(async ({ page }) => {
    await cleanupTRPGTestData(page);
    await setupTRPGTestData(page);
  });

  test.afterEach(async ({ page }) => {
    await cleanupTRPGTestData(page);
  });

  test("should provide optimal mobile navigation experience", async ({ page }) => {
    console.log("📱 Testing: Mobile Navigation Experience");

    // Start with mobile viewport
    await page.setViewportSize({ width: 375, height: 667 }); // iPhone SE
    await navigateToTRPGHome(page);
    await verifyTRPGPageLoad(page);
    await takeTRPGScreenshot(page, "mobile-home-initial", "mobile-navigation");

    // Test mobile menu/hamburger menu
    const mobileMenuButton = page.locator(
      'button[aria-label*="メニュー"], [data-testid*="mobile-menu"], [aria-label*="menu"], .hamburger-menu'
    ).first();

    if (await mobileMenuButton.count() > 0) {
      console.log("🍔 Mobile menu button found");
      await mobileMenuButton.click();
      await page.waitForTimeout(1000);
      await takeTRPGScreenshot(page, "mobile-menu-open", "mobile-navigation");

      // Test navigation items in mobile menu
      const navigationItems = [
        "キャラクター", "NPC", "エネミー", "世界観構築", "タイムライン", "セッション"
      ];

      for (const item of navigationItems) {
        const navItem = page.locator(`text=${item}, [aria-label*="${item}"]`).first();
        if (await navItem.count() > 0) {
          await navItem.click();
          await page.waitForTimeout(1000);
          await verifyTRPGPageLoad(page);
          await takeTRPGScreenshot(page, `mobile-nav-${item}`, "mobile-navigation");
          
          // Go back to menu for next item
          const backButton = page.locator(
            'button[aria-label*="戻る"], button:has-text("戻る"), [data-testid*="back"]'
          ).first();
          
          if (await backButton.count() > 0) {
            await backButton.click();
            await page.waitForTimeout(500);
          } else {
            // Try mobile menu button again
            const menuBtn = page.locator('button[aria-label*="メニュー"]').first();
            if (await menuBtn.count() > 0) {
              await menuBtn.click();
              await page.waitForTimeout(500);
            }
          }
        }
      }
    } else {
      console.log("⚠️ Mobile menu not found - testing alternative navigation");
      
      // Test tab navigation on mobile
      const tabs = page.locator('[role="tab"], .tab, .nav-tab');
      if (await tabs.count() > 0) {
        console.log("📑 Tab navigation found on mobile");
        const tabCount = await tabs.count();
        for (let i = 0; i < Math.min(tabCount, 3); i++) {
          await tabs.nth(i).click();
          await page.waitForTimeout(1000);
          await takeTRPGScreenshot(page, `mobile-tab-${i}`, "mobile-navigation");
        }
      }
    }

    console.log("✅ Mobile navigation test completed");
  });

  test("should handle touch interactions for character management", async ({ page }) => {
    console.log("👆 Testing: Mobile Touch Interactions for Characters");

    await page.setViewportSize({ width: 414, height: 896 }); // iPhone 11
    await navigateToTRPGHome(page);

    // Navigate to characters page
    await page.goto("/characters");
    await verifyTRPGPageLoad(page);
    await takeTRPGScreenshot(page, "mobile-characters-initial", "mobile-touch");

    // Test touch interactions with character cards
    const characterCard = page.locator(
      '[data-testid*="character"], .character-card, text="エリアス・ストーンハート"'
    ).first();

    if (await characterCard.count() > 0) {
      console.log("👆 Testing character card touch interactions");
      
      // Test tap to view details
      await characterCard.tap();
      await page.waitForTimeout(1000);
      await takeTRPGScreenshot(page, "mobile-character-tapped", "mobile-touch");

      // Test long press (if supported)
      try {
        await characterCard.tap({ position: { x: 50, y: 50 } });
        await page.waitForTimeout(2000); // Simulate long press
        await takeTRPGScreenshot(page, "mobile-character-longpress", "mobile-touch");
      } catch (error) {
        console.log("⚠️ Long press not supported or failed");
      }

      // Test swipe gestures (if implemented)
      const cardBounds = await characterCard.boundingBox();
      if (cardBounds) {
        // Swipe left
        await page.mouse.move(cardBounds.x + cardBounds.width - 10, cardBounds.y + cardBounds.height / 2);
        await page.mouse.down();
        await page.mouse.move(cardBounds.x + 10, cardBounds.y + cardBounds.height / 2);
        await page.mouse.up();
        await page.waitForTimeout(1000);
        await takeTRPGScreenshot(page, "mobile-character-swipe-left", "mobile-touch");

        // Swipe right
        await page.mouse.move(cardBounds.x + 10, cardBounds.y + cardBounds.height / 2);
        await page.mouse.down();
        await page.mouse.move(cardBounds.x + cardBounds.width - 10, cardBounds.y + cardBounds.height / 2);
        await page.mouse.up();
        await page.waitForTimeout(1000);
        await takeTRPGScreenshot(page, "mobile-character-swipe-right", "mobile-touch");
      }
    }

    // Test character creation on mobile
    const addCharacterButton = page.locator(
      'button:has-text("追加"), button:has-text("新規"), [data-testid*="add"], .add-button'
    ).first();

    if (await addCharacterButton.count() > 0) {
      await addCharacterButton.tap();
      await page.waitForTimeout(1000);
      await takeTRPGScreenshot(page, "mobile-character-create-dialog", "mobile-touch");

      // Test form filling on mobile
      const nameInput = page.locator('input[name="name"], input[placeholder*="名前"]').first();
      if (await nameInput.count() > 0) {
        await nameInput.tap();
        await nameInput.fill("モバイルテストキャラクター");
        await page.waitForTimeout(500);

        // Test form submission
        const saveButton = page.locator('button:has-text("保存"), button:has-text("作成")').first();
        if (await saveButton.count() > 0) {
          await saveButton.tap();
          await page.waitForTimeout(2000);
          await takeTRPGScreenshot(page, "mobile-character-created", "mobile-touch");
        }
      }
    }

    console.log("✅ Mobile touch interactions test completed");
  });

  test("should provide mobile-optimized dice rolling interface", async ({ page }) => {
    console.log("🎲 Testing: Mobile Dice Rolling Interface");

    await page.setViewportSize({ width: 375, height: 812 }); // iPhone X
    await navigateToTRPGHome(page);
    await page.goto("/trpg-session");
    await verifyTRPGPageLoad(page);
    await takeTRPGScreenshot(page, "mobile-session-initial", "mobile-dice");

    // Test mobile dice interface
    const diceButton = page.locator(
      'button:has-text("ダイス"), [data-testid*="dice"], .dice-button'
    ).first();

    if (await diceButton.count() > 0) {
      console.log("🎲 Mobile dice interface found");
      await diceButton.tap();
      await page.waitForTimeout(1000);
      await takeTRPGScreenshot(page, "mobile-dice-interface", "mobile-dice");

      // Test different dice on mobile
      const diceTypes = ["d4", "d6", "d8", "d10", "d12", "d20", "d100"];
      
      for (const diceType of diceTypes) {
        const diceTypeButton = page.locator(`button:has-text("${diceType}"), [data-value="${diceType}"]`).first();
        if (await diceTypeButton.count() > 0) {
          await diceTypeButton.tap();
          await page.waitForTimeout(500);
          console.log(`✅ Tapped ${diceType}`);
        }
      }

      // Test roll button
      const rollButton = page.locator(
        'button:has-text("振る"), button:has-text("ロール"), [data-testid*="roll"]'
      ).first();

      if (await rollButton.count() > 0) {
        await rollButton.tap();
        await page.waitForTimeout(2000);
        await takeTRPGScreenshot(page, "mobile-dice-rolled", "mobile-dice");

        // Check for result display
        const resultDisplay = page.locator(
          '[data-testid*="result"], .dice-result, .roll-result'
        ).first();

        if (await resultDisplay.count() > 0) {
          console.log("✅ Dice result displayed on mobile");
        }
      }

      // Test dice animation (if present)
      const diceAnimation = page.locator('.dice-animation, [data-testid*="animation"]').first();
      if (await diceAnimation.count() > 0) {
        console.log("🎭 Dice animation detected on mobile");
        await takeTRPGScreenshot(page, "mobile-dice-animation", "mobile-dice");
      }
    } else {
      console.log("⚠️ Mobile dice interface not found");
    }

    // Test mobile dice history
    const historyButton = page.locator(
      'button:has-text("履歴"), [data-testid*="history"]'
    ).first();

    if (await historyButton.count() > 0) {
      await historyButton.tap();
      await page.waitForTimeout(1000);
      await takeTRPGScreenshot(page, "mobile-dice-history", "mobile-dice");
    }

    console.log("✅ Mobile dice rolling test completed");
  });

  test("should handle mobile-specific session management features", async ({ page }) => {
    console.log("🎯 Testing: Mobile Session Management");

    await page.setViewportSize({ width: 390, height: 844 }); // iPhone 12
    await navigateToTRPGHome(page);

    // Start session on mobile
    await startTRPGSession(page, "モバイルセッションテスト");
    await takeTRPGScreenshot(page, "mobile-session-started", "mobile-session");

    // Test mobile session controls
    const sessionControls = [
      { name: "一時停止", selector: 'button:has-text("一時停止"), [data-testid*="pause"]' },
      { name: "メモ", selector: 'button:has-text("メモ"), [data-testid*="notes"]' },
      { name: "設定", selector: 'button:has-text("設定"), [data-testid*="settings"]' }
    ];

    for (const control of sessionControls) {
      const controlButton = page.locator(control.selector).first();
      if (await controlButton.count() > 0) {
        console.log(`📱 Testing ${control.name} on mobile`);
        await controlButton.tap();
        await page.waitForTimeout(1000);
        await takeTRPGScreenshot(page, `mobile-session-${control.name}`, "mobile-session");

        // Close any opened dialogs
        const closeButton = page.locator(
          'button[aria-label*="閉じる"], button:has-text("閉じる"), [data-testid*="close"]'
        ).first();
        if (await closeButton.count() > 0) {
          await closeButton.tap();
          await page.waitForTimeout(500);
        }
      }
    }

    // Test mobile chat interface
    const chatArea = page.locator(
      '[data-testid*="chat"], .chat-interface, textarea[placeholder*="メッセージ"]'
    ).first();

    if (await chatArea.count() > 0) {
      console.log("💬 Testing mobile chat interface");
      await chatArea.tap();
      await chatArea.fill("モバイルからのテストメッセージです");
      await page.waitForTimeout(500);
      await takeTRPGScreenshot(page, "mobile-chat-message", "mobile-session");

      // Test send button
      const sendButton = page.locator(
        'button:has-text("送信"), [data-testid*="send"]'
      ).first();
      if (await sendButton.count() > 0) {
        await sendButton.tap();
        await page.waitForTimeout(1000);
        await takeTRPGScreenshot(page, "mobile-chat-sent", "mobile-session");
      }
    }

    // Test mobile character status quick view
    const characterStatus = page.locator(
      '[data-testid*="character-status"], .character-quick-view'
    ).first();

    if (await characterStatus.count() > 0) {
      await characterStatus.tap();
      await page.waitForTimeout(1000);
      await takeTRPGScreenshot(page, "mobile-character-status", "mobile-session");
    }

    console.log("✅ Mobile session management test completed");
  });

  test("should provide accessible mobile experience", async ({ page }) => {
    console.log("♿ Testing: Mobile Accessibility");

    await page.setViewportSize({ width: 375, height: 667 });
    await navigateToTRPGHome(page);
    await takeTRPGScreenshot(page, "mobile-accessibility-initial", "mobile-accessibility");

    // Test screen reader compatibility
    const ariaElements = await page.locator('[aria-label], [aria-describedby], [role]').count();
    console.log(`🔍 Found ${ariaElements} elements with ARIA attributes`);

    // Test touch target sizes
    const buttons = await page.locator('button').all();
    let properSizedButtons = 0;

    for (const button of buttons) {
      const boundingBox = await button.boundingBox();
      if (boundingBox && boundingBox.width >= 44 && boundingBox.height >= 44) {
        properSizedButtons++;
      }
    }

    console.log(`👆 ${properSizedButtons}/${buttons.length} buttons meet touch target size requirements`);

    // Test high contrast mode simulation
    await page.emulateMedia({ colorScheme: 'dark' });
    await page.waitForTimeout(1000);
    await takeTRPGScreenshot(page, "mobile-dark-mode", "mobile-accessibility");

    // Test reduced motion preference
    await page.emulateMedia({ reducedMotion: 'reduce' });
    await page.waitForTimeout(1000);
    await takeTRPGScreenshot(page, "mobile-reduced-motion", "mobile-accessibility");

    // Test keyboard navigation on mobile (if virtual keyboard is available)
    const firstInput = page.locator('input, textarea, button').first();
    if (await firstInput.count() > 0) {
      await firstInput.focus();
      await page.keyboard.press('Tab');
      await page.waitForTimeout(500);
      await takeTRPGScreenshot(page, "mobile-keyboard-navigation", "mobile-accessibility");
    }

    // Test mobile form accessibility
    await page.goto('/characters');
    const addButton = page.locator('button:has-text("追加")').first();
    if (await addButton.count() > 0) {
      await addButton.tap();
      await page.waitForTimeout(1000);

      // Check form labels and accessibility
      const formLabels = await page.locator('label, [aria-label]').count();
      const formInputs = await page.locator('input, textarea, select').count();
      console.log(`📝 Form accessibility: ${formLabels} labels for ${formInputs} inputs`);

      await takeTRPGScreenshot(page, "mobile-form-accessibility", "mobile-accessibility");
    }

    // Reset media preferences
    await page.emulateMedia({ colorScheme: 'light', reducedMotion: 'no-preference' });

    console.log("✅ Mobile accessibility test completed");
  });

  test("should handle mobile orientation changes gracefully", async ({ page }) => {
    console.log("🔄 Testing: Mobile Orientation Changes");

    // Start in portrait
    await page.setViewportSize({ width: 375, height: 667 });
    await navigateToTRPGHome(page);
    await takeTRPGScreenshot(page, "mobile-portrait-initial", "mobile-orientation");

    // Test navigation in portrait
    await page.goto('/characters');
    await verifyTRPGPageLoad(page);
    await takeTRPGScreenshot(page, "mobile-portrait-characters", "mobile-orientation");

    // Switch to landscape
    await page.setViewportSize({ width: 667, height: 375 });
    await page.waitForTimeout(1000);
    await takeTRPGScreenshot(page, "mobile-landscape-characters", "mobile-orientation");

    // Test session interface in landscape
    await page.goto('/trpg-session');
    await verifyTRPGPageLoad(page);
    await takeTRPGScreenshot(page, "mobile-landscape-session", "mobile-orientation");

    // Test dice rolling in landscape
    await rollDice(page, "1d20");
    await page.waitForTimeout(2000);
    await takeTRPGScreenshot(page, "mobile-landscape-dice", "mobile-orientation");

    // Switch back to portrait
    await page.setViewportSize({ width: 375, height: 667 });
    await page.waitForTimeout(1000);
    await takeTRPGScreenshot(page, "mobile-portrait-final", "mobile-orientation");

    // Test that interface still works after orientation changes
    await page.goto('/world-building');
    await verifyTRPGPageLoad(page);
    await takeTRPGScreenshot(page, "mobile-portrait-world-building", "mobile-orientation");

    // Verify no layout issues after multiple orientation changes
    const hasLayoutIssues = await page.evaluate(() => {
      const elements = document.querySelectorAll('*');
      let issueCount = 0;
      
      elements.forEach(el => {
        const rect = el.getBoundingClientRect();
        if (rect.width > window.innerWidth || rect.height > window.innerHeight) {
          issueCount++;
        }
      });
      
      return issueCount;
    });

    console.log(`🔍 Layout issues detected: ${hasLayoutIssues}`);
    expect(hasLayoutIssues).toBeLessThan(5); // Allow some tolerance for normal overflow

    console.log("✅ Mobile orientation changes test completed");
  });

  test("should optimize mobile performance and loading", async ({ page }) => {
    console.log("⚡ Testing: Mobile Performance Optimization");

    await page.setViewportSize({ width: 375, height: 667 });

    // Measure mobile load performance
    const startTime = Date.now();
    
    await setupTRPGTestData(page);
    const dataLoadTime = Date.now();
    
    await navigateToTRPGHome(page);
    const pageLoadTime = Date.now();
    
    await verifyTRPGPageLoad(page);
    const readyTime = Date.now();

    const mobilePerformance = {
      dataSetup: dataLoadTime - startTime,
      pageLoad: pageLoadTime - dataLoadTime,
      pageReady: readyTime - pageLoadTime,
      totalTime: readyTime - startTime
    };

    console.log("📊 Mobile Performance Metrics:");
    console.log(`  Data Setup: ${mobilePerformance.dataSetup}ms`);
    console.log(`  Page Load: ${mobilePerformance.pageLoad}ms`);
    console.log(`  Page Ready: ${mobilePerformance.pageReady}ms`);
    console.log(`  Total: ${mobilePerformance.totalTime}ms`);

    await takeTRPGScreenshot(page, "mobile-performance-loaded", "mobile-performance");

    // Test mobile-specific optimizations
    const mobileOptimizations = await page.evaluate(() => {
      const hasLazyLoading = document.querySelectorAll('[loading="lazy"]').length > 0;
      const hasServiceWorker = 'serviceWorker' in navigator;
      const hasTouch = 'ontouchstart' in window;
      const hasMetaViewport = !!document.querySelector('meta[name="viewport"]');
      
      return {
        hasLazyLoading,
        hasServiceWorker,
        hasTouch,
        hasMetaViewport
      };
    });

    console.log("📱 Mobile Optimizations:");
    console.log(`  Lazy Loading: ${mobileOptimizations.hasLazyLoading ? "✅" : "⚠️"}`);
    console.log(`  Service Worker: ${mobileOptimizations.hasServiceWorker ? "✅" : "⚠️"}`);
    console.log(`  Touch Support: ${mobileOptimizations.hasTouch ? "✅" : "⚠️"}`);
    console.log(`  Viewport Meta: ${mobileOptimizations.hasMetaViewport ? "✅" : "⚠️"}`);

    // Performance assertions for mobile
    expect(mobilePerformance.totalTime).toBeLessThan(8000); // Mobile should load within 8 seconds
    expect(mobilePerformance.pageReady).toBeLessThan(4000); // Interactive within 4 seconds

    // Store mobile performance data
    await page.evaluate((perfData) => {
      const existing = JSON.parse(localStorage.getItem('trpg-performance-data') || '{}');
      existing.mobilePerformance = perfData;
      localStorage.setItem('trpg-performance-data', JSON.stringify(existing));
    }, { ...mobilePerformance, ...mobileOptimizations });

    console.log("✅ Mobile performance optimization test completed");
  });
});