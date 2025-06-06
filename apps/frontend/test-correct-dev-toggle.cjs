const { chromium } = require('playwright');

(async () => {
  console.log('🎯 Testing Correct Developer Mode Toggle...');
  
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
      path: './test-results/correct-dev-before.png',
      fullPage: true 
    });
    
    // Check current developer mode state in the page content
    const pageContent = await page.textContent('body');
    const currentlyOff = pageContent.includes('開発者モード: OFF');
    console.log(`🔧 Current state: ${currentlyOff ? 'OFF' : 'ON'}`);
    
    // Look for the developer mode toggle in the left sidebar
    // Based on the screenshot, it should be in the left blue sidebar
    const devModeToggleSelectors = [
      'input[type="checkbox"]', // Toggle switches are usually checkboxes
      '[role="switch"]',
      '.MuiSwitch-input',
      'input[class*="switch"]',
      'input[class*="toggle"]'
    ];
    
    let toggleFound = false;
    
    for (const selector of devModeToggleSelectors) {
      const toggles = await page.locator(selector).all();
      console.log(`🔍 Found ${toggles.length} elements with selector: ${selector}`);
      
      for (let i = 0; i < toggles.length; i++) {
        const toggle = toggles[i];
        
        // Look for nearby text that indicates this is the developer mode toggle
        const nearbyText = await toggle.locator('..').textContent(); // Parent element text
        if (nearbyText && nearbyText.includes('開発者')) {
          console.log(`🎯 Found developer mode toggle: "${nearbyText}"`);
          
          // Click the toggle
          console.log('🔧 Clicking developer mode toggle...');
          await toggle.click();
          console.log('✅ Toggle clicked');
          
          // Wait for changes
          await page.waitForTimeout(5000);
          
          toggleFound = true;
          break;
        }
      }
      
      if (toggleFound) break;
    }
    
    if (!toggleFound) {
      // Try alternative approach - look for any element with "開発者モード" text and find nearby clickable elements
      console.log('🔍 Alternative search for developer mode toggle...');
      const devModeElement = await page.locator('text=開発者モード').first();
      
      if (await devModeElement.isVisible()) {
        console.log('🎯 Found developer mode text element');
        
        // Look for nearby clickable elements (input, button, etc.)
        const parentElement = await devModeElement.locator('..');
        const clickableElements = await parentElement.locator('input, button, [role="switch"], [role="checkbox"]').all();
        
        console.log(`🔍 Found ${clickableElements.length} clickable elements near developer mode text`);
        
        if (clickableElements.length > 0) {
          console.log('🔧 Clicking first clickable element near developer mode text...');
          await clickableElements[0].click();
          await page.waitForTimeout(5000);
          toggleFound = true;
        }
      }
    }
    
    // Take screenshot after toggle attempt
    await page.screenshot({ 
      path: './test-results/correct-dev-after.png',
      fullPage: true 
    });
    
    // Check new state
    const newPageContent = await page.textContent('body');
    const nowOn = newPageContent.includes('開発者モード: ON');
    console.log(`🔧 New state: ${nowOn ? 'ON' : 'OFF'}`);
    
    if (nowOn) {
      console.log('✅ Developer mode successfully enabled!');
      
      // Now test for errors that occur when developer mode is ON
      if (errors.length > 0) {
        console.log(`❌ ${errors.length} errors detected with developer mode ON:`);
        errors.forEach((error, index) => {
          console.log(`  ${index + 1}. ${error.text}`);
          if (error.location) {
            console.log(`     📍 ${error.location.url}:${error.location.lineNumber}`);
          }
        });
      } else {
        console.log('✅ No errors with current minimal version + developer mode ON');
      }
      
    } else {
      console.log('⚠️  Developer mode toggle may not have worked');
    }
    
  } catch (error) {
    console.log(`💥 Test Error: ${error.message}`);
    await page.screenshot({ 
      path: './test-results/correct-dev-error.png',
      fullPage: true 
    });
  }
  
  console.log('⏰ Keeping browser open for 30 seconds...');
  await page.waitForTimeout(30000);
  
  await browser.close();
  
  // Summary
  console.log('\n📊 SUMMARY:');
  console.log(`Total errors with developer mode: ${errors.length}`);
  if (errors.length === 0) {
    console.log('✅ Minimal TRPGSessionPage works correctly with developer mode ON');
    console.log('✅ Ready to add more features step by step');
  } else {
    console.log('❌ Issues found with developer mode ON');
  }
})();