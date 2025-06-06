const { chromium } = require('playwright');

(async () => {
  console.log('🎯 Testing Developer Mode with ID-based selection...');
  
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
      path: './test-results/id-based-before.png',
      fullPage: true 
    });
    
    // Check current developer mode state
    const beforeContent = await page.textContent('body');
    const isCurrentlyOff = beforeContent.includes('開発者モード: OFF');
    console.log(`🔧 Current developer mode state: ${isCurrentlyOff ? 'OFF' : 'ON'}`);
    
    // Find developer toggle by ID
    console.log('🔍 Looking for developer toggle with ID: developer-toggle...');
    const devToggle = await page.locator('#developer-toggle');
    
    if (await devToggle.isVisible()) {
      console.log('🎯 Found developer toggle by ID!');
      
      // Click the toggle
      console.log('🔧 Clicking developer mode toggle...');
      await devToggle.click();
      console.log('✅ Developer mode toggle clicked via ID');
      
      // Wait for changes and potential errors
      await page.waitForTimeout(5000);
      
      // Take screenshot after toggle
      await page.screenshot({ 
        path: './test-results/id-based-after.png',
        fullPage: true 
      });
      
      // Check new state
      const afterContent = await page.textContent('body');
      const isNowOn = afterContent.includes('開発者モード: ON');
      console.log(`🔧 New developer mode state: ${isNowOn ? 'ON' : 'OFF'}`);
      
      if (isNowOn && isCurrentlyOff) {
        console.log('✅ Developer mode successfully toggled ON!');
      } else if (!isNowOn && !isCurrentlyOff) {
        console.log('✅ Developer mode successfully toggled OFF!');
      } else {
        console.log('⚠️  Developer mode state may not have changed');
      }
      
      // Check for errors after toggle
      if (errors.length > 0) {
        console.log(`❌ ${errors.length} errors detected after developer mode toggle:`);
        errors.forEach((error, index) => {
          console.log(`  ${index + 1}. ${error.text}`);
          if (error.location) {
            console.log(`     📍 ${error.location.url}:${error.location.lineNumber}`);
          }
        });
        
        // Show specific errors that are related to setDefaultActions
        const setDefaultActionErrors = errors.filter(e => 
          e.text.includes('setDefaultActions') || 
          e.text.includes('TRPGSessionPage')
        );
        
        if (setDefaultActionErrors.length > 0) {
          console.log('\n🎯 Errors related to setDefaultActions:');
          setDefaultActionErrors.forEach((error, index) => {
            console.log(`  ${index + 1}. ${error.text}`);
          });
        }
        
      } else {
        console.log('✅ No errors detected - current version works with developer mode!');
      }
      
    } else {
      console.log('❌ Developer toggle with ID "developer-toggle" not found');
      
      // Debug: show all elements with IDs
      const elementsWithId = await page.locator('[id]').all();
      console.log(`🔍 Found ${elementsWithId.length} elements with IDs:`);
      for (let i = 0; i < Math.min(elementsWithId.length, 10); i++) {
        const id = await elementsWithId[i].getAttribute('id');
        const tagName = await elementsWithId[i].evaluate(el => el.tagName);
        console.log(`  ${i + 1}. <${tagName}> id="${id}"`);
      }
    }
    
  } catch (error) {
    console.log(`💥 Test Error: ${error.message}`);
    await page.screenshot({ 
      path: './test-results/id-based-error.png',
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
    console.log('✅ Safe to add more features from backup');
  } else {
    console.log('❌ Issues found with developer mode - need to fix before adding more features');
  }
})();