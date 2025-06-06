const { chromium } = require('playwright');

(async () => {
  console.log('🔄 Testing Developer Mode with Fresh Server and ID...');
  
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
    
    // Take initial screenshot
    await page.screenshot({ 
      path: './test-results/fresh-server-initial.png',
      fullPage: true 
    });
    
    // Check for all elements with IDs
    console.log('🔍 Checking all elements with IDs...');
    const elementsWithId = await page.locator('[id]').all();
    console.log(`Found ${elementsWithId.length} elements with IDs:`);
    for (let i = 0; i < elementsWithId.length; i++) {
      const id = await elementsWithId[i].getAttribute('id');
      const tagName = await elementsWithId[i].evaluate(el => el.tagName);
      console.log(`  ${i + 1}. <${tagName}> id="${id}"`);
    }
    
    // Look specifically for developer-toggle
    console.log('\n🎯 Looking for developer-toggle ID...');
    const devToggleById = await page.locator('#developer-toggle');
    const isVisible = await devToggleById.isVisible();
    console.log(`Developer toggle by ID visible: ${isVisible}`);
    
    if (isVisible) {
      console.log('✅ Found developer-toggle by ID!');
      
      // Navigate to TRPG Session first
      console.log('🎮 Navigating to TRPG Session...');
      const sessionLink = await page.locator('text=TRPGセッション').first();
      await sessionLink.click();
      await page.waitForTimeout(3000);
      
      // Take screenshot before toggle
      await page.screenshot({ 
        path: './test-results/fresh-server-before-toggle.png',
        fullPage: true 
      });
      
      // Check current state
      const beforeContent = await page.textContent('body');
      const isCurrentlyOff = beforeContent.includes('開発者モード: OFF');
      console.log(`🔧 Current developer mode state: ${isCurrentlyOff ? 'OFF' : 'ON'}`);
      
      // Click the developer toggle by ID
      console.log('🔧 Clicking developer toggle by ID...');
      await devToggleById.click();
      console.log('✅ Developer toggle clicked via ID');
      
      // Wait for changes and potential errors
      await page.waitForTimeout(5000);
      
      // Take screenshot after toggle
      await page.screenshot({ 
        path: './test-results/fresh-server-after-toggle.png',
        fullPage: true 
      });
      
      // Check new state
      const afterContent = await page.textContent('body');
      const isNowOn = afterContent.includes('開発者モード: ON');
      const isNowOff = afterContent.includes('開発者モード: OFF');
      
      console.log(`🔧 New developer mode state: ${isNowOn ? 'ON' : (isNowOff ? 'OFF' : 'UNKNOWN')}`);
      
      if ((isCurrentlyOff && isNowOn) || (!isCurrentlyOff && isNowOff)) {
        console.log('✅ Developer mode successfully toggled using ID!');
        
        // Test toggling back
        console.log('🔄 Testing toggle back...');
        await devToggleById.click();
        await page.waitForTimeout(3000);
        
        const finalContent = await page.textContent('body');
        const finalState = finalContent.includes('開発者モード: ON') ? 'ON' : 'OFF';
        console.log(`🔧 Final state after second toggle: ${finalState}`);
        
        // Take final screenshot
        await page.screenshot({ 
          path: './test-results/fresh-server-final.png',
          fullPage: true 
        });
        
      } else {
        console.log('⚠️  Developer mode state did not change as expected');
      }
      
      // Check for errors
      if (errors.length > 0) {
        console.log(`❌ ${errors.length} errors detected during developer mode testing:`);
        errors.forEach((error, index) => {
          console.log(`  ${index + 1}. ${error.text}`);
          if (error.location) {
            console.log(`     📍 ${error.location.url}:${error.location.lineNumber}`);
          }
        });
      } else {
        console.log('✅ No errors detected - developer mode ID toggle working perfectly!');
      }
      
    } else {
      console.log('❌ Developer toggle with ID "developer-toggle" still not found');
      
      // Debug: check specific data-testid
      const byTestId = await page.locator('[data-testid="developer-toggle"]');
      const testIdVisible = await byTestId.isVisible();
      console.log(`Element with data-testid="developer-toggle" visible: ${testIdVisible}`);
      
      // Debug: check aria-label
      const byAriaLabel = await page.locator('[aria-label="developer mode toggle"]');
      const ariaLabelVisible = await byAriaLabel.isVisible();
      console.log(`Element with aria-label="developer mode toggle" visible: ${ariaLabelVisible}`);
    }
    
  } catch (error) {
    console.log(`💥 Test Error: ${error.message}`);
    await page.screenshot({ 
      path: './test-results/fresh-server-error.png',
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
    console.log('✅ Developer mode toggle working correctly with fresh server');
    console.log('✅ Ready to test more complex features');
  } else {
    console.log('❌ Issues found - need investigation');
  }
})();