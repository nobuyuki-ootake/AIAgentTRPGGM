const { chromium } = require('playwright');

async function quickLocationCheck() {
  const browser = await chromium.launch({ headless: false });
  
  try {
    const context = await browser.newContext();
    const page = await context.newPage();
    
    // コンソールメッセージを監視
    const logs = [];
    page.on('console', msg => {
      logs.push(msg.text());
      console.log('Console:', msg.text());
    });
    
    console.log('Navigating to TRPG Session page...');
    await page.goto('http://localhost:5173/trpg-session');
    await page.waitForTimeout(3000);
    
    // 現在地表示を検索
    const locationElements = await page.locator('text=/現在地|街の中心|未設定/').all();
    console.log(`Found ${locationElements.length} location-related elements`);
    
    for (let i = 0; i < locationElements.length; i++) {
      const text = await locationElements[i].textContent();
      console.log(`Location element ${i + 1}: "${text}"`);
    }
    
    // スクリーンショット撮影
    await page.screenshot({ 
      path: 'quick-location-check.png',
      fullPage: true 
    });
    
    console.log('Screenshot saved. Checking localStorage...');
    
    // localStorageの状態確認
    const campaignData = await page.evaluate(() => {
      const data = localStorage.getItem('currentCampaign');
      return data ? JSON.parse(data) : null;
    });
    
    console.log('Campaign data currentLocation:', campaignData?.currentLocation || 'Not set');
    
    // 5秒待ってからブラウザを閉じる
    setTimeout(() => browser.close(), 5000);
    
  } catch (error) {
    console.error('Error:', error);
    await browser.close();
  }
}

quickLocationCheck();