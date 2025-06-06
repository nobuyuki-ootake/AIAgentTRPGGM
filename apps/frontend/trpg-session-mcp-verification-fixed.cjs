const { chromium } = require('playwright');

async function verifyTRPGSession() {
  const browser = await chromium.launch({ 
    headless: false,
    slowMo: 1000,
    args: ['--start-maximized']
  });
  
  const context = await browser.newContext({
    viewport: { width: 1920, height: 1080 }
  });
  
  const page = await context.newPage();
  
  // Enable console logging
  page.on('console', msg => {
    console.log(`[CONSOLE ${msg.type()}]:`, msg.text());
  });
  
  // Enable error logging
  page.on('pageerror', error => {
    console.error('[PAGE ERROR]:', error.message);
  });
  
  try {
    console.log('1. localhost:5173にアクセス');
    await page.goto('http://localhost:5173/', { waitUntil: 'networkidle' });
    
    // Wait for initial load
    await page.waitForTimeout(2000);
    
    console.log('2. TRPGセッション画面(/trpg-session)に移動');
    await page.goto('http://localhost:5173/trpg-session', { waitUntil: 'networkidle' });
    
    // Wait for page to load
    await page.waitForTimeout(3000);
    
    console.log('3. 画面の基本要素を確認');
    
    // Check if page loaded without infinite loop errors
    const hasConsoleErrors = await page.evaluate(() => {
      // Check if there are any recent console errors in the last few seconds
      return window.console.error && window.console.error.calls && window.console.error.calls.length > 0;
    });
    
    console.log('4. 左上のハンバーガーメニューを探す');
    
    // Look for hamburger menu with more flexible selectors
    const hamburgerSelectors = [
      'button[aria-label*="menu"]',
      'button[aria-label*="メニュー"]', 
      '[data-testid*="menu"]',
      '[data-testid*="hamburger"]',
      'button:has-text("Menu")',
      'button:has-text("メニュー")',
      '.MuiIconButton-root:has(svg[data-testid="MenuIcon"])',
      'button svg[data-testid="MenuIcon"]'
    ];
    
    let hamburgerFound = false;
    for (const selector of hamburgerSelectors) {
      try {
        const element = page.locator(selector).first();
        if (await element.isVisible({ timeout: 1000 })) {
          console.log(`ハンバーガーメニューが見つかりました: ${selector}`);
          await element.click();
          hamburgerFound = true;
          await page.waitForTimeout(1000);
          break;
        }
      } catch (e) {
        // Continue to next selector
      }
    }
    
    if (!hamburgerFound) {
      console.log('ハンバーガーメニューが見つかりません - サイドバーが常に表示されている可能性があります');
    }
    
    console.log('5. 開発者モード切り替えを探す');
    
    // Look for developer mode toggle
    const devModeSelectors = [
      'text="開発者モード"',
      'text="Developer Mode"',
      '[data-testid*="developer"]',
      '[data-testid*="debug"]',
      'switch:near(text="開発者")',
      'input[type="checkbox"]:near(text="開発者")'
    ];
    
    let devModeFound = false;
    for (const selector of devModeSelectors) {
      try {
        const element = page.locator(selector).first();
        if (await element.isVisible({ timeout: 1000 })) {
          console.log(`開発者モード切り替えが見つかりました: ${selector}`);
          await element.click();
          devModeFound = true;
          await page.waitForTimeout(1000);
          break;
        }
      } catch (e) {
        // Continue to next selector
      }
    }
    
    if (!devModeFound) {
      console.log('開発者モード切り替えが見つかりません');
    }
    
    console.log('6. デバッグパネルの存在を確認');
    
    // Look for debug panel with safer selectors
    const debugSelectors = [
      '[data-testid*="debug"]',
      '.debug-panel',
      'text*="Debug"',
      'text*="デバッグ"'
    ];
    
    let debugPanelFound = false;
    for (const selector of debugSelectors) {
      try {
        const element = page.locator(selector).first();
        if (await element.isVisible({ timeout: 1000 })) {
          console.log(`デバッグパネルが見つかりました: ${selector}`);
          debugPanelFound = true;
          break;
        }
      } catch (e) {
        // Continue to next selector
      }
    }
    
    if (!debugPanelFound) {
      console.log('デバッグパネルが見つかりません');
    }
    
    console.log('7. 各TRPGセッションコンポーネントの表示を確認');
    
    // Check for main components with flexible selectors
    const components = [
      { name: 'SessionHeader', selectors: ['[data-testid*="session-header"]', '.session-header', 'header', '[class*="Header"]'] },
      { name: 'PartyPanel', selectors: ['[data-testid*="party"]', '.party-panel', '[class*="Party"]'] },
      { name: 'MainContentPanel', selectors: ['[data-testid*="main-content"]', '.main-content-panel', '[class*="MainContent"]'] },
      { name: 'ChatAndDicePanel', selectors: ['[data-testid*="chat"]', '[data-testid*="dice"]', '.chat-dice-panel', '[class*="Chat"]'] }
    ];
    
    for (const component of components) {
      let found = false;
      for (const selector of component.selectors) {
        try {
          const element = page.locator(selector).first();
          if (await element.isVisible({ timeout: 1000 })) {
            console.log(`✓ ${component.name}が表示されています (${selector})`);
            found = true;
            break;
          }
        } catch (e) {
          // Continue to next selector
        }
      }
      if (!found) {
        console.log(`✗ ${component.name}が見つかりません`);
      }
    }
    
    console.log('8. エラーメッセージの確認');
    
    // Check for error messages
    const errorSelectors = [
      '.error',
      '[class*="error"]',
      '[data-testid*="error"]',
      'text*="Error"',
      'text*="エラー"'
    ];
    
    for (const selector of errorSelectors) {
      try {
        const errors = page.locator(selector);
        const count = await errors.count();
        if (count > 0) {
          console.log(`⚠ エラー要素が ${count} 個見つかりました (${selector})`);
          for (let i = 0; i < Math.min(count, 3); i++) {
            const errorText = await errors.nth(i).textContent();
            console.log(`  - ${errorText?.substring(0, 100)}`);
          }
        }
      } catch (e) {
        // Continue to next selector
      }
    }
    
    console.log('9. スクリーンショットを撮影');
    await page.screenshot({ 
      path: 'trpg-session-verification-fixed-screenshot.png',
      fullPage: true 
    });
    
    console.log('画面検証が完了しました。ブラウザは開いたままにします。');
    console.log('F12を押してコンソールを確認し、30秒後に自動終了します。');
    
    // Keep browser open for manual inspection
    await page.waitForTimeout(30000);
    
  } catch (error) {
    console.error('エラーが発生しました:', error);
    await page.screenshot({ 
      path: 'trpg-session-error-fixed-screenshot.png',
      fullPage: true 
    });
  } finally {
    await browser.close();
  }
}

verifyTRPGSession();