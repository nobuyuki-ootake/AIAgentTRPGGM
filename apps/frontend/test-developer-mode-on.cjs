const { chromium } = require('playwright');

(async () => {
  console.log('🔧 Testing with Developer Mode ON...');
  
  const browser = await chromium.launch({ 
    headless: false,
    slowMo: 1500
  });
  
  const context = await browser.newContext({
    viewport: { width: 1920, height: 1080 }
  });
  
  const page = await context.newPage();
  
  // Capture ALL console messages with detailed error tracking
  const errors = [];
  page.on('console', msg => {
    const msgType = msg.type();
    const text = msg.text();
    const location = msg.location();
    
    if (msgType === 'error') {
      console.log(`❌ [ERROR] ${text}`);
      if (location.url) {
        console.log(`  📍 Location: ${location.url}:${location.lineNumber}:${location.columnNumber}`);
      }
      errors.push({text, location});
    } else if (msgType === 'warn') {
      console.log(`⚠️  [WARN] ${text}`);
    }
  });
  
  // Track page errors
  page.on('pageerror', error => {
    console.log(`💥 PAGE ERROR: ${error.message}`);
    console.log(`Stack: ${error.stack}`);
    errors.push({text: error.message, stack: error.stack});
  });
  
  try {
    // Navigate to home page
    console.log('🌍 Navigating to localhost:5173...');
    await page.goto('http://localhost:5173', { 
      waitUntil: 'networkidle',
      timeout: 30000 
    });
    
    console.log('✅ Home page loaded');
    await page.waitForTimeout(2000);
    
    // Navigate to TRPG Session
    console.log('🎮 Navigating to TRPG Session...');
    const sessionLink = await page.locator('text=TRPGセッション').first();
    await sessionLink.click();
    await page.waitForTimeout(3000);
    
    console.log('✅ TRPG Session page loaded');
    
    // Take screenshot before developer mode
    await page.screenshot({ 
      path: './test-results/dev-mode-test-before.png',
      fullPage: true 
    });
    
    // Look for developer mode toggle in sidebar
    console.log('🔍 Looking for developer mode toggle...');
    
    const devModeToggle = await page.locator('text=開発者モード').first();
    if (await devModeToggle.isVisible()) {
      console.log('🎯 Found developer mode toggle');
      
      // Click developer mode toggle
      console.log('🔧 Clicking developer mode toggle...');
      await devModeToggle.click();
      console.log('✅ Developer mode toggle clicked');
      
      // Wait for any potential errors to appear
      await page.waitForTimeout(5000);
      
      // Take screenshot after developer mode toggle
      await page.screenshot({ 
        path: './test-results/dev-mode-test-after.png',
        fullPage: true 
      });
      
      // Check if page is still functional
      const bodyText = await page.textContent('body');
      console.log(`📄 Page content length after toggle: ${bodyText.length}`);
      console.log(`📄 Content preview: "${bodyText.substring(0, 200)}..."`);
      
      // Check for additional UI elements that appear in developer mode
      const devModeElements = await page.locator('[class*="developer"], [class*="dev-mode"]').count();
      console.log(`🔧 Developer mode elements found: ${devModeElements}`);
      
      // Check error count
      if (errors.length > 0) {
        console.log(`❌ ${errors.length} errors detected after enabling developer mode:`);
        errors.forEach((error, index) => {
          console.log(`  ${index + 1}. ${error.text}`);
          if (error.location) {
            console.log(`     📍 ${error.location.url}:${error.location.lineNumber}`);
          }
        });
      } else {
        console.log('✅ No errors detected - developer mode working correctly!');
      }
      
    } else {
      console.log('❌ Developer mode toggle not found');
    }
    
  } catch (error) {
    console.log(`💥 Test Error: ${error.message}`);
    await page.screenshot({ 
      path: './test-results/dev-mode-test-error.png',
      fullPage: true 
    });
  }
  
  console.log('⏰ Keeping browser open for 30 seconds for inspection...');
  await page.waitForTimeout(30000);
  
  await browser.close();
  
  // Summary
  console.log('\n📊 SUMMARY:');
  console.log(`Total errors: ${errors.length}`);
  if (errors.length > 0) {
    console.log('❌ Developer mode has issues');
  } else {
    console.log('✅ Developer mode working correctly');
  }
})();