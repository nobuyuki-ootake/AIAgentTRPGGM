const { chromium } = require('playwright');

(async () => {
  console.log('🔄 Testing with hard refresh to force update...');
  
  const browser = await chromium.launch({ 
    headless: false,
    slowMo: 1000
  });
  
  const context = await browser.newContext({
    viewport: { width: 1920, height: 1080 }
  });
  
  const page = await context.newPage();
  
  // Capture console messages
  page.on('console', msg => {
    const msgType = msg.type();
    const text = msg.text();
    if (msgType === 'error') {
      console.log(`❌ [${msgType.toUpperCase()}] ${text}`);
    } else if (text.includes('現在地') || text.includes('キャラクター') || text.includes('日目')) {
      console.log(`📊 [${msgType.toUpperCase()}] ${text}`);
    }
  });
  
  // Navigate to localhost:5173
  await page.goto('http://localhost:5173', { 
    waitUntil: 'networkidle',
    timeout: 30000 
  });
  
  // Force hard refresh
  console.log('🔄 Performing hard refresh...');
  await page.reload({ waitUntil: 'networkidle' });
  await page.waitForTimeout(3000);
  
  // Navigate to TRPG Session
  const sessionLink = await page.locator('text=TRPGセッション').first();
  if (await sessionLink.isVisible()) {
    await sessionLink.click();
    await page.waitForTimeout(3000);
    
    // Take screenshot
    await page.screenshot({ 
      path: './test-results/hard-refresh-session.png',
      fullPage: true 
    });
    
    // Check content
    const bodyText = await page.textContent('body');
    console.log(`📄 Page content preview (first 300 chars):`);
    console.log(bodyText.substring(0, 300));
    
    // Look for new fields
    const hasCurrentLocation = bodyText.includes('現在地');
    const hasSelectedCharacter = bodyText.includes('選択キャラクター');
    const hasCurrentDay = bodyText.includes('現在の日');
    
    console.log(`🔍 Found new fields:`);
    console.log(`  Current Location: ${hasCurrentLocation}`);
    console.log(`  Selected Character: ${hasSelectedCharacter}`);
    console.log(`  Current Day: ${hasCurrentDay}`);
    
    if (hasCurrentLocation && hasSelectedCharacter && hasCurrentDay) {
      console.log('✅ useTRPGSession hook is working correctly!');
    } else {
      console.log('⚠️  Some fields are missing, cache might still be stale');
    }
  }
  
  console.log('⏰ Keeping browser open for 20 seconds...');
  await page.waitForTimeout(20000);
  
  await browser.close();
})();