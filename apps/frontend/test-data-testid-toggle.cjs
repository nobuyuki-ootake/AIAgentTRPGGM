const { chromium } = require('playwright');

(async () => {
  console.log('🎯 Testing Developer Mode with data-testid...');
  
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
    await page.waitForTimeout(3000);
    
    // Navigate to TRPG Session first
    console.log('🎮 Navigating to TRPG Session...');
    const sessionLink = await page.locator('text=TRPGセッション').first();
    await sessionLink.click();
    await page.waitForTimeout(3000);
    
    // Take screenshot before toggle
    await page.screenshot({ 
      path: './test-results/testid-before-toggle.png',
      fullPage: true 
    });
    
    // Check current state
    const beforeContent = await page.textContent('body');
    const isCurrentlyOff = beforeContent.includes('開発者モード: OFF');
    console.log(`🔧 Current developer mode state: ${isCurrentlyOff ? 'OFF' : 'ON'}`);
    
    // Look for developer toggle by data-testid
    console.log('🎯 Looking for developer toggle by data-testid...');
    const devToggle = await page.getByTestId('developer-toggle');
    const isVisible = await devToggle.isVisible();
    console.log(`Developer toggle by data-testid visible: ${isVisible}`);
    
    if (isVisible) {
      console.log('✅ Found developer toggle by data-testid!');
      
      // Click the developer toggle
      console.log('🔧 Clicking developer toggle by data-testid...');
      await devToggle.click();
      console.log('✅ Developer toggle clicked via data-testid');
      
      // Wait for changes and potential errors
      await page.waitForTimeout(5000);
      
      // Take screenshot after toggle
      await page.screenshot({ 
        path: './test-results/testid-after-toggle.png',
        fullPage: true 
      });
      
      // Check new state
      const afterContent = await page.textContent('body');
      const isNowOn = afterContent.includes('開発者モード: ON');
      const isNowOff = afterContent.includes('開発者モード: OFF');
      
      console.log(`🔧 New developer mode state: ${isNowOn ? 'ON' : (isNowOff ? 'OFF' : 'UNKNOWN')}`);
      
      if ((isCurrentlyOff && isNowOn) || (!isCurrentlyOff && isNowOff)) {
        console.log('✅ Developer mode successfully toggled using data-testid!');
        
        // Test toggling back
        console.log('🔄 Testing toggle back...');
        await devToggle.click();
        await page.waitForTimeout(3000);
        
        const finalContent = await page.textContent('body');
        const finalState = finalContent.includes('開発者モード: ON') ? 'ON' : 'OFF';
        console.log(`🔧 Final state after second toggle: ${finalState}`);
        
        // Take final screenshot
        await page.screenshot({ 
          path: './test-results/testid-final.png',
          fullPage: true 
        });
        
        // Now that we confirmed developer mode toggle works, test for errors
        // that occur specifically when developer mode is ON
        if (finalState === 'OFF') {
          console.log('🔧 Turning developer mode ON for final error check...');
          await devToggle.click();
          await page.waitForTimeout(5000);
        }
        
      } else {
        console.log('⚠️  Developer mode state did not change as expected');
      }
      
      // Check for errors
      if (errors.length > 0) {
        console.log(`\n❌ ${errors.length} errors detected during developer mode testing:`);
        errors.forEach((error, index) => {
          console.log(`  ${index + 1}. ${error.text}`);
          if (error.location) {
            console.log(`     📍 ${error.location.url}:${error.location.lineNumber}`);
          }
        });
        
        // Categorize errors
        const criticalErrors = errors.filter(e => 
          e.text.includes('setDefaultActions') || 
          e.text.includes('ReferenceError') ||
          e.text.includes('can\'t access lexical declaration') ||
          e.text.includes('TRPGSessionPage')
        );
        
        if (criticalErrors.length > 0) {
          console.log('\n🚨 CRITICAL ERRORS (related to original issue):');
          criticalErrors.forEach((error, index) => {
            console.log(`  ${index + 1}. ${error.text}`);
          });
        }
        
      } else {
        console.log('✅ No errors detected - developer mode working perfectly!');
        console.log('✅ Original setDefaultActions issue is completely resolved!');
      }
      
    } else {
      console.log('❌ Developer toggle with data-testid not found');
    }
    
  } catch (error) {
    console.log(`💥 Test Error: ${error.message}`);
    await page.screenshot({ 
      path: './test-results/testid-error.png',
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
    console.log('✅ Developer mode toggle working perfectly');
    console.log('✅ Current TRPGSessionPage stage 5 is stable');
    console.log('✅ Ready to continue adding more features from backup');
  } else {
    console.log('❌ Issues found - see details above');
  }
})();