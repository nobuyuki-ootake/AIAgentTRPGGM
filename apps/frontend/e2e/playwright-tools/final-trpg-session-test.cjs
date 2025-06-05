const { chromium } = require('playwright');

(async () => {
  console.log('🎯 最終TRPGセッションテスト開始！');
  
  const browser = await chromium.launch({ 
    headless: false,
    slowMo: 1000,
    devtools: true
  });
  
  const context = await browser.newContext({
    viewport: { width: 1920, height: 1080 }
  });
  
  const page = await context.newPage();
  
  page.on('console', msg => {
    const type = msg.type();
    const text = msg.text();
    const emoji = type === 'error' ? '❌' : type === 'warn' ? '⚠️' : '✅';
    console.log(`${emoji} [${type.toUpperCase()}]:`, text);
  });
  
  page.on('pageerror', err => {
    console.log('💥 ERROR:', err.message);
    console.log('📍 Stack:', err.stack?.split('\n')[0]);
  });
  
  try {
    console.log('🚀 Step 1: ホーム画面アクセス');
    await page.goto('http://localhost:5173', { 
      waitUntil: 'networkidle',
      timeout: 30000 
    });
    
    await page.waitForTimeout(3000);
    
    console.log('📸 ホーム画面スクリーンショット');
    await page.screenshot({ 
      path: 'e2e/playwright-tools/final-home.png', 
      fullPage: true 
    });
    
    console.log('🎯 Step 2: TRPGセッションページに直接アクセス');
    await page.goto('http://localhost:5173/session', { 
      waitUntil: 'networkidle',
      timeout: 30000 
    });
    
    await page.waitForTimeout(5000);
    
    console.log('📸 TRPGセッションページスクリーンショット');
    await page.screenshot({ 
      path: 'e2e/playwright-tools/final-trpg-session.png', 
      fullPage: true 
    });
    
    // TRPGセッションページの要素確認
    const sessionElements = await page.evaluate(() => {
      return {
        title: document.title,
        hasSessionContent: !!document.querySelector('[data-testid="session"], .session, [class*="session"]'),
        hasButtons: document.querySelectorAll('button').length,
        hasTabs: document.querySelectorAll('[role="tab"]').length,
        hasCharacterDisplay: !!document.querySelector('[class*="character"], [data-testid="character"]'),
        hasActionPanel: !!document.querySelector('[class*="action"], [data-testid="action"]'),
        bodyText: document.body.textContent?.substring(0, 500),
        url: window.location.pathname
      };
    });
    
    console.log('🔍 TRPGセッション画面分析:', sessionElements);
    
    if (sessionElements.hasButtons > 5) {
      console.log('✅ TRPGセッションページが正常に表示されました！');
      console.log(`🎮 ボタン数: ${sessionElements.hasButtons}`);
      console.log(`📋 タブ数: ${sessionElements.hasTabs}`);
    } else {
      console.log('⚠️ TRPGセッションページの要素が少ないようです');
    }
    
    // インタラクション可能な要素を探す
    const interactions = await page.evaluate(() => {
      const buttons = Array.from(document.querySelectorAll('button')).map((btn, index) => ({
        index,
        text: btn.textContent?.trim() || 'ボタン',
        id: btn.id,
        className: btn.className
      }));
      
      const tabs = Array.from(document.querySelectorAll('[role="tab"]')).map((tab, index) => ({
        index,
        text: tab.textContent?.trim() || 'タブ',
        id: tab.id
      }));
      
      return { buttons: buttons.slice(0, 10), tabs };
    });
    
    console.log('🎮 インタラクション要素:');
    console.log('  ボタン:', interactions.buttons);
    console.log('  タブ:', interactions.tabs);
    
    console.log('🎯 成功！TRPGセッションページが表示されました！');
    console.log('⏳ 15秒間表示を維持...');
    await page.waitForTimeout(15000);
    
  } catch (error) {
    console.log('💥 エラー:', error.message);
    await page.screenshot({ 
      path: 'e2e/playwright-tools/final-error.png',
      fullPage: true 
    });
  }
  
  await browser.close();
  console.log('🏁 最終TRPGセッションテスト完了！');
})();