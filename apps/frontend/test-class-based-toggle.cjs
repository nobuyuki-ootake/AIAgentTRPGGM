const { chromium } = require('playwright');

(async () => {
  console.log('🎯 Testing Developer Mode with Class-based selection...');
  
  const browser = await chromium.launch({ 
    headless: false,
    slowMo: 2000
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
    } else if (text.includes('setDefaultActions') || text.includes('TRPGSessionPage:')) {
      console.log(`📊 [LOG] ${text}`);
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
    
    // First navigate to TRPG Session
    console.log('🎮 Navigating to TRPG Session...');
    const sessionLink = await page.locator('text=TRPGセッション').first();
    await sessionLink.click();
    await page.waitForTimeout(3000);
    
    console.log('✅ TRPG Session page loaded');
    
    // Take screenshot before toggle
    await page.screenshot({ 
      path: './test-results/class-based-before.png',
      fullPage: true 
    });
    
    // Check current developer mode state
    const beforeContent = await page.textContent('body');
    const isCurrentlyOff = beforeContent.includes('開発者モード: OFF');
    console.log(`🔧 Current developer mode state: ${isCurrentlyOff ? 'OFF' : 'ON'}`);
    
    // Find developer toggle by class names (most reliable method)
    console.log('🔍 Looking for developer toggle by class name...');
    
    // The input element inside the Switch
    const switchInput = await page.locator('.MuiSwitch-input').first();
    
    if (await switchInput.isVisible()) {
      console.log('🎯 Found MUI Switch input element!');
      
      // Click the switch input
      console.log('🔧 Clicking developer mode switch...');
      await switchInput.click();
      console.log('✅ Developer mode switch clicked');
      
      // Wait for changes and potential errors
      await page.waitForTimeout(5000);
      
      // Take screenshot after toggle
      await page.screenshot({ 
        path: './test-results/class-based-after.png',
        fullPage: true 
      });
      
      // Check new state
      const afterContent = await page.textContent('body');
      const isNowOn = afterContent.includes('開発者モード: ON');
      const isNowOff = afterContent.includes('開発者モード: OFF');
      
      console.log(`🔧 New developer mode state: ${isNowOn ? 'ON' : (isNowOff ? 'OFF' : 'UNKNOWN')}`);
      
      if ((isCurrentlyOff && isNowOn) || (!isCurrentlyOff && isNowOff)) {
        console.log('✅ Developer mode successfully toggled!');
        
        // Now check for errors that occur when developer mode is toggled
        if (errors.length > 0) {
          console.log(`❌ ${errors.length} errors detected after toggling developer mode:`);
          errors.forEach((error, index) => {
            console.log(`  ${index + 1}. ${error.text}`);
            if (error.location) {
              console.log(`     📍 ${error.location.url}:${error.location.lineNumber}`);
            }
          });
          
          // Check for specific error patterns
          const criticalErrors = errors.filter(e => 
            e.text.includes('setDefaultActions') || 
            e.text.includes('ReferenceError') ||
            e.text.includes('can\'t access lexical declaration')
          );
          
          if (criticalErrors.length > 0) {
            console.log('\n🚨 CRITICAL ERRORS FOUND:');
            criticalErrors.forEach((error, index) => {
              console.log(`  ${index + 1}. ${error.text}`);
            });
          }
          
        } else {
          console.log('✅ No errors detected - current TRPGSessionPage works with developer mode!');
        }
        
      } else {
        console.log('⚠️  Developer mode state may not have changed properly');
      }
      
    } else {
      console.log('❌ MUI Switch input element not found');
      
      // Fallback: try clicking on any element that contains "開発者モード"
      console.log('🔄 Fallback: trying to click on text containing "開発者モード"...');
      const devModeText = await page.locator('text=開発者モード').first();
      if (await devModeText.isVisible()) {
        await devModeText.click();
        await page.waitForTimeout(3000);
        console.log('🔧 Clicked on developer mode text');
      }
    }
    
  } catch (error) {
    console.log(`💥 Test Error: ${error.message}`);
    await page.screenshot({ 
      path: './test-results/class-based-error.png',
      fullPage: true 
    });
  }
  
  console.log('⏰ Keeping browser open for 30 seconds...');
  await page.waitForTimeout(30000);
  
  await browser.close();
  
  // Summary
  console.log('\n📊 FINAL SUMMARY:');
  console.log(`Total errors: ${errors.length}`);
  if (errors.length === 0) {
    console.log('✅ Current TRPGSessionPage version works correctly with developer mode');
    console.log('✅ Ready to continue adding features from backup file');
  } else {
    console.log('❌ Issues found with developer mode - showing error details above');
    console.log('❌ Need to fix these errors before adding more complex features');
  }
})();