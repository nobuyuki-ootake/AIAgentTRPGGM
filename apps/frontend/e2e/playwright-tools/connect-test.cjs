const { chromium } = require('playwright');

(async () => {
  console.log('🔗 接続テスト開始');
  
  // 接続テスト
  for (let i = 0; i < 5; i++) {
    try {
      const response = await fetch('http://localhost:5173');
      console.log(`✅ 試行 ${i + 1}: 接続成功 (${response.status})`);
      break;
    } catch (error) {
      console.log(`❌ 試行 ${i + 1}: 接続失敗`, error.message);
      if (i < 4) {
        console.log('⏳ 2秒待機...');
        await new Promise(resolve => setTimeout(resolve, 2000));
      }
    }
  }
  
  const browser = await chromium.launch({ 
    headless: false,
    slowMo: 1000
  });
  
  const context = await browser.newContext();
  const page = await context.newPage();
  
  page.on('console', msg => console.log('📋', msg.text()));
  page.on('pageerror', err => console.log('💥', err.message));
  
  try {
    console.log('🌍 ページアクセス開始...');
    await page.goto('http://localhost:5173', { 
      waitUntil: 'domcontentloaded',
      timeout: 10000 
    });
    
    console.log('✅ ページ読み込み成功！');
    
    await page.waitForTimeout(5000);
    await page.screenshot({ path: 'e2e/playwright-tools/connection-success.png' });
    
  } catch (error) {
    console.log('💥 エラー:', error.message);
  }
  
  await browser.close();
})();