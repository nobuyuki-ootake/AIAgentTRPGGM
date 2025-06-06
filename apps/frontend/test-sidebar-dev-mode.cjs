const { chromium } = require('playwright');

(async () => {
  console.log('🔧 Testing Sidebar Developer Mode Toggle...');
  
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
    
    // Take initial screenshot to see sidebar
    await page.screenshot({ 
      path: './test-results/sidebar-initial.png',
      fullPage: true 
    });
    
    // Look for sidebar elements
    console.log('🔍 Analyzing sidebar structure...');
    
    const sidebarSelectors = [
      'aside',
      '[class*="sidebar"]',
      '[class*="Sidebar"]',
      'nav[class*="sidebar"]',
      '[role="navigation"]'
    ];
    
    let sidebar = null;
    for (const selector of sidebarSelectors) {
      const element = await page.locator(selector).first();
      if (await element.isVisible()) {
        sidebar = element;
        console.log(`📍 Found sidebar with selector: ${selector}`);
        break;
      }
    }
    
    if (sidebar) {
      // Get all text in sidebar
      const sidebarText = await sidebar.textContent();
      console.log('📄 Sidebar content:');
      console.log(sidebarText);
      
      // Look for developer mode elements in sidebar
      const devModeElements = await sidebar.locator('*').filter({ hasText: '開発者' }).all();
      console.log(`🔧 Found ${devModeElements.length} developer mode elements in sidebar:`);
      
      for (let i = 0; i < devModeElements.length; i++) {
        const element = devModeElements[i];
        const text = await element.textContent();
        const tagName = await element.evaluate(el => el.tagName);
        const className = await element.getAttribute('class') || '';
        console.log(`  ${i + 1}. <${tagName}> "${text}" (class: ${className})`);
      }
      
      // Look specifically at the bottom of sidebar
      const allSidebarElements = await sidebar.locator('*').all();
      console.log(`📍 Total elements in sidebar: ${allSidebarElements.length}`);
      
      // Check last few elements
      const lastElements = allSidebarElements.slice(-5);
      console.log('📍 Last 5 elements in sidebar:');
      for (let i = 0; i < lastElements.length; i++) {
        const element = lastElements[i];
        const text = await element.textContent();
        const tagName = await element.evaluate(el => el.tagName);
        if (text && text.trim()) {
          console.log(`  ${i + 1}. <${tagName}> "${text.trim()}"`);
        }
      }
      
      // Try to find the actual toggle in sidebar bottom
      const devModeToggle = await sidebar.locator('*').filter({ hasText: '開発者モード' }).last();
      if (await devModeToggle.isVisible()) {
        console.log('🎯 Found developer mode toggle at bottom of sidebar');
        
        // Navigate to TRPG Session first
        console.log('🎮 Navigating to TRPG Session...');
        const sessionLink = await page.locator('text=TRPGセッション').first();
        await sessionLink.click();
        await page.waitForTimeout(3000);
        
        // Take screenshot before toggle
        await page.screenshot({ 
          path: './test-results/sidebar-before-toggle.png',
          fullPage: true 
        });
        
        // Check current state
        const currentStateText = await page.textContent('body');
        const isCurrentlyOff = currentStateText.includes('開発者モード: OFF');
        console.log(`🔧 Current developer mode state: ${isCurrentlyOff ? 'OFF' : 'ON'}`);
        
        // Click the toggle
        console.log('🔧 Clicking sidebar developer mode toggle...');
        await devModeToggle.click();
        console.log('✅ Developer mode toggle clicked');
        
        // Wait for changes
        await page.waitForTimeout(5000);
        
        // Take screenshot after toggle
        await page.screenshot({ 
          path: './test-results/sidebar-after-toggle.png',
          fullPage: true 
        });
        
        // Check new state
        const newStateText = await page.textContent('body');
        const isNowOn = newStateText.includes('開発者モード: ON');
        console.log(`🔧 New developer mode state: ${isNowOn ? 'ON' : 'OFF'}`);
        
        if (isNowOn) {
          console.log('✅ Developer mode successfully enabled!');
        } else {
          console.log('⚠️  Developer mode may not have changed');
        }
        
        // Check for errors after toggle
        if (errors.length > 0) {
          console.log(`❌ ${errors.length} errors detected after toggle:`);
          errors.forEach((error, index) => {
            console.log(`  ${index + 1}. ${error.text}`);
          });
        } else {
          console.log('✅ No errors detected');
        }
        
      } else {
        console.log('❌ Developer mode toggle not found in sidebar');
      }
      
    } else {
      console.log('❌ Sidebar not found');
    }
    
  } catch (error) {
    console.log(`💥 Test Error: ${error.message}`);
    await page.screenshot({ 
      path: './test-results/sidebar-test-error.png',
      fullPage: true 
    });
  }
  
  console.log('⏰ Keeping browser open for 30 seconds for inspection...');
  await page.waitForTimeout(30000);
  
  await browser.close();
  
  // Summary
  console.log('\n📊 SUMMARY:');
  console.log(`Total errors: ${errors.length}`);
})();