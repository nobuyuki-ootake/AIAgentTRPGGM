const { chromium } = require('playwright');

async function checkCurrentLocation() {
  const browser = await chromium.launch({
    headless: false,
    slowMo: 1000
  });
  
  try {
    const context = await browser.newContext();
    const page = await context.newPage();
    
    // コンソールログを監視
    page.on('console', msg => {
      if (msg.text().includes('location') || msg.text().includes('現在地') || msg.text().includes('街')) {
        console.log('🗺️ Location-related console log:', msg.text());
      }
    });
    
    // localhost:5173/trpg-sessionにアクセス
    console.log('📍 Navigating to TRPG Session page...');
    await page.goto('http://localhost:5173/trpg-session');
    await page.waitForTimeout(3000);
    
    // 現在地表示の確認
    console.log('\n🔍 Checking current location display...');
    
    // ヘッダー部分の現在地表示を確認
    const headerLocationText = await page.textContent('[data-testid="current-location-header"]').catch(() => null) ||
                              await page.textContent('.current-location').catch(() => null) ||
                              await page.textContent('[class*="location"]').catch(() => null);
    
    console.log('📌 Header location text:', headerLocationText || 'Not found');
    
    // 探索タブを確認
    const explorationTab = await page.locator('text=探索').first();
    if (await explorationTab.isVisible()) {
      console.log('🗺️ Clicking on exploration tab...');
      await explorationTab.click();
      await page.waitForTimeout(2000);
      
      // 探索タブ内の現在地表示を確認
      const explorationLocationText = await page.textContent('[data-testid="exploration-location"]').catch(() => null) ||
                                    await page.textContent('.exploration-location').catch(() => null);
      
      console.log('🧭 Exploration tab location text:', explorationLocationText || 'Not found');
    }
    
    // 全体的なページテキストから現在地関連を検索
    const pageText = await page.textContent('body');
    const locationMatches = pageText.match(/(現在地|街の中心|未設定)/g);
    console.log('📍 Found location text in page:', locationMatches || 'None found');
    
    // スクリーンショットを撮影
    console.log('\n📸 Taking screenshot...');
    await page.screenshot({ 
      path: '/mnt/c/Users/irure/git/AIAgentTRPGGM/apps/frontend/current-location-check.png',
      fullPage: true 
    });
    
    // F12コンソールを開いて状態を確認
    console.log('\n🔧 Opening developer tools and checking console...');
    await page.keyboard.press('F12');
    await page.waitForTimeout(2000);
    
    // Recoilの状態をコンソールで確認
    await page.evaluate(() => {
      console.log('=== Current Location State Check ===');
      console.log('Window location:', window.location.href);
      
      // Recoilの状態を確認 (もしアクセス可能なら)
      if (window.Recoil) {
        console.log('Recoil is available');
      } else {
        console.log('Recoil not accessible from window');
      }
      
      // localStorageの確認
      const campaignData = localStorage.getItem('currentCampaign');
      if (campaignData) {
        try {
          const campaign = JSON.parse(campaignData);
          console.log('Campaign current location:', campaign.currentLocation || 'Not set');
        } catch (e) {
          console.log('Error parsing campaign data:', e.message);
        }
      } else {
        console.log('No campaign data in localStorage');
      }
    });
    
    await page.waitForTimeout(5000);
    
    console.log('\n✅ Location check completed. Browser will remain open for manual inspection.');
    console.log('📸 Screenshot saved as: current-location-check.png');
    
    // ブラウザを開いたままにして手動確認を可能にする
    await page.waitForTimeout(30000);
    
  } catch (error) {
    console.error('❌ Error checking current location:', error);
  } finally {
    await browser.close();
  }
}

checkCurrentLocation();