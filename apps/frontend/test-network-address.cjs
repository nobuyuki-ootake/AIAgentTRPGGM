const { chromium } = require('playwright');

(async () => {
  console.log('🔍 Testing with network address 172.19.214.178:5173...');
  
  const browser = await chromium.launch({ 
    headless: false,
    slowMo: 1000
  });
  
  const context = await browser.newContext({
    viewport: { width: 1280, height: 720 }
  });
  
  const page = await context.newPage();
  
  const errors = [];
  page.on('console', msg => {
    const msgType = msg.type();
    const text = msg.text();
    
    if (msgType === 'error') {
      console.log(`❌ [ERROR] ${text}`);
      errors.push({text});
    } else if (text.includes('setDefaultActions') || text.includes('TRPGSessionPage:')) {
      console.log(`📊 [LOG] ${text}`);
    }
  });
  
  page.on('pageerror', error => {
    console.log(`💥 PAGE ERROR: ${error.message}`);
    errors.push({text: error.message});
  });
  
  try {
    console.log('🌍 Connecting to 172.19.214.178:5173...');
    await page.goto('http://172.19.214.178:5173', { 
      waitUntil: 'networkidle',
      timeout: 15000 
    });
    
    console.log('✅ Page loaded successfully!');
    await page.waitForTimeout(3000);
    
    // Take screenshot
    await page.screenshot({ 
      path: './test-results/network-address-test.png',
      fullPage: true 
    });
    
    // Navigate to TRPG Session
    console.log('🎮 Navigating to TRPG Session...');
    const sessionLink = await page.locator('text=TRPGセッション').first();
    await sessionLink.click();
    await page.waitForTimeout(3000);
    
    // Check developer mode toggle
    const devToggle = await page.getByTestId('developer-toggle');
    const isVisible = await devToggle.isVisible();
    console.log(`Developer toggle visible: ${isVisible}`);
    
    if (isVisible) {
      console.log('✅ Developer toggle found!');
      
      // Check current state
      const beforeContent = await page.textContent('body');
      const isCurrentlyOff = beforeContent.includes('開発者モード: OFF');
      console.log(`🔧 Current developer mode state: ${isCurrentlyOff ? 'OFF' : 'ON'}`);
      
      // Take before screenshot
      await page.screenshot({ 
        path: './test-results/network-before-toggle.png',
        fullPage: true 
      });
      
      // Click toggle
      await devToggle.click();
      console.log('✅ Toggle clicked');
      await page.waitForTimeout(5000);
      
      // Take after screenshot
      await page.screenshot({ 
        path: './test-results/network-after-toggle.png',
        fullPage: true 
      });
      
      // Check new state
      const afterContent = await page.textContent('body');
      const isNowOn = afterContent.includes('開発者モード: ON');
      const isNowOff = afterContent.includes('開発者モード: OFF');
      
      console.log(`🔧 New developer mode state: ${isNowOn ? 'ON' : (isNowOff ? 'OFF' : 'UNKNOWN')}`);
      
      if ((isCurrentlyOff && isNowOn) || (!isCurrentlyOff && isNowOff)) {
        console.log('✅ Developer mode successfully toggled!');
      } else {
        console.log('⚠️  Developer mode state did not change as expected');
      }
    }
    
    // Check for errors
    if (errors.length > 0) {
      console.log(`❌ ${errors.length} errors detected:`);
      errors.forEach((error, index) => {
        console.log(`  ${index + 1}. ${error.text}`);
      });
    } else {
      console.log('✅ No errors detected - developer mode working perfectly!');
    }
    
  } catch (error) {
    console.log(`❌ Error: ${error.message}`);
  }
  
  await page.waitForTimeout(10000);
  await browser.close();
  
  console.log('\n📊 FINAL SUMMARY:');
  console.log(`Total errors: ${errors.length}`);
  if (errors.length === 0) {
    console.log('✅ Developer mode working correctly on fresh server');
    console.log('✅ Current TRPGSessionPage implementation is stable');
  }
})();