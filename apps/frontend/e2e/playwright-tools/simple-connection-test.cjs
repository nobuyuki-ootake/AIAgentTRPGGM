const { chromium } = require('playwright');

(async () => {
  console.log('🔗 シンプル接続テスト開始');
  
  try {
    // curlで接続テスト
    const { exec } = require('child_process');
    
    await new Promise((resolve) => {
      exec('curl -s http://localhost:5173', (error, stdout, stderr) => {
        if (error) {
          console.log('❌ curl接続失敗:', error.message);
        } else {
          console.log('✅ curl接続成功:', stdout.substring(0, 100));
        }
        resolve();
      });
    });
    
    console.log('🚀 Playwright接続テスト...');
    
    const browser = await chromium.launch({ 
      headless: false,
      args: ['--no-sandbox', '--disable-setuid-sandbox']
    });
    
    const context = await browser.newContext();
    const page = await context.newPage();
    
    console.log('📍 localhost:5173に接続中...');
    await page.goto('http://localhost:5173', { 
      waitUntil: 'domcontentloaded',
      timeout: 10000 
    });
    
    console.log('✅ 接続成功！');
    
    const title = await page.title();
    console.log('📄 ページタイトル:', title);
    
    await page.waitForTimeout(3000);
    await page.screenshot({ path: 'e2e/playwright-tools/simple-connection.png' });
    
    await browser.close();
    console.log('🏁 シンプル接続テスト完了');
    
  } catch (error) {
    console.log('💥 エラー:', error.message);
  }
})();