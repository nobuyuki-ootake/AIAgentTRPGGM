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
    
    console.log('3. F12でコンソールを開く（ブラウザが表示されます）');
    // The browser is already in headed mode, so developer tools can be opened manually
    
    console.log('4. 左上のハンバーガーメニューをクリックしてサイドバーから開発者モードを有効にする');
    
    // Look for hamburger menu button
    const hamburgerButton = await page.locator('[data-testid="hamburger-menu"], button[aria-label*="menu"], .hamburger-menu, [aria-label="menu"]').first();
    if (await hamburgerButton.isVisible()) {
      await hamburgerButton.click();
      console.log('ハンバーガーメニューをクリックしました');
      await page.waitForTimeout(1000);
      
      // Look for developer mode toggle
      const devModeToggle = await page.locator('[data-testid="developer-mode-toggle"], text="開発者モード", text="Developer Mode"').first();
      if (await devModeToggle.isVisible()) {
        await devModeToggle.click();
        console.log('開発者モードを有効にしました');
        await page.waitForTimeout(1000);
      } else {
        console.log('開発者モード切り替えが見つかりません');
      }
    } else {
      console.log('ハンバーガーメニューが見つかりません');
    }
    
    console.log('5. デバッグパネルを表示して空のキャンペーンデータを確認');
    
    // Look for debug panel
    const debugPanel = await page.locator('[data-testid="debug-panel"], .debug-panel, text="Debug"').first();
    if (await debugPanel.isVisible()) {
      console.log('デバッグパネルが表示されています');
    } else {
      console.log('デバッグパネルが見つかりません');
    }
    
    console.log('6. 各コンポーネントの表示を確認');
    
    // Check for main components
    const components = [
      { name: 'SessionHeader', selector: '[data-testid="session-header"], .session-header' },
      { name: 'PartyPanel', selector: '[data-testid="party-panel"], .party-panel' },
      { name: 'MainContentPanel', selector: '[data-testid="main-content-panel"], .main-content-panel' },
      { name: 'ChatAndDicePanel', selector: '[data-testid="chat-dice-panel"], .chat-dice-panel' }
    ];
    
    for (const component of components) {
      const element = await page.locator(component.selector).first();
      if (await element.isVisible()) {
        console.log(`✓ ${component.name}が表示されています`);
      } else {
        console.log(`✗ ${component.name}が見つかりません`);
      }
    }
    
    console.log('7. スクリーンショットを撮影');
    await page.screenshot({ 
      path: 'trpg-session-verification-screenshot.png',
      fullPage: true 
    });
    
    console.log('画面検証が完了しました。ブラウザは開いたままにします。');
    console.log('F12を押してコンソールを確認し、Enterキーを押すと終了します。');
    
    // Keep browser open for manual inspection
    await page.waitForTimeout(30000);
    
  } catch (error) {
    console.error('エラーが発生しました:', error);
    await page.screenshot({ 
      path: 'trpg-session-error-screenshot.png',
      fullPage: true 
    });
  } finally {
    await browser.close();
  }
}

verifyTRPGSession();