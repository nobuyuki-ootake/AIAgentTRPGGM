const { chromium } = require('playwright');

(async () => {
  console.log('🎮 Testing TRPG Session Developer Mode...');
  
  const browser = await chromium.launch({ 
    headless: false,
    slowMo: 1500
  });
  
  const context = await browser.newContext({
    viewport: { width: 1920, height: 1080 }
  });
  
  const page = await context.newPage();
  
  // Track all console messages
  page.on('console', msg => {
    const msgType = msg.type();
    const text = msg.text();
    if (msgType === 'error') {
      console.log(`❌ Console Error: ${text}`);
    } else if (msgType === 'warn') {
      console.log(`⚠️  Console Warning: ${text}`);
    } else if (text.includes('setDefaultActions') || text.includes('TRPG')) {
      console.log(`ℹ️  Console Log: ${text}`);
    }
  });
  
  // Navigate to localhost:5173
  await page.goto('http://localhost:5173');
  await page.waitForTimeout(3000);
  
  console.log('✅ Page loaded, looking for TRPG Session navigation...');
  
  // Take initial screenshot
  await page.screenshot({ path: './test-results/trpg-session-test-initial.png', fullPage: true });
  
  try {
    // Try to find TRPG Session navigation
    const sessionNavSelectors = [
      'text=TRPGセッション',
      'a[href*="trpg-session"]',
      'a[href*="/session"]', 
      'nav a:has-text("セッション")',
      '[role="menuitem"]:has-text("セッション")',
      'button:has-text("TRPGセッション")'
    ];
    
    let sessionNav = null;
    for (const selector of sessionNavSelectors) {
      try {
        const element = await page.locator(selector).first();
        if (await element.isVisible()) {
          sessionNav = element;
          console.log(`🎯 Found TRPG Session nav with: ${selector}`);
          break;
        }
      } catch (e) {
        // Continue to next selector
      }
    }
    
    if (sessionNav) {
      await sessionNav.click();
      console.log('🎮 Navigated to TRPG Session page');
      await page.waitForTimeout(3000);
      
      // Take screenshot of session page
      await page.screenshot({ path: './test-results/trpg-session-page.png', fullPage: true });
      
      // Now look for developer mode toggle
      const devModeToggle = await page.locator('text=開発者モード').first();
      if (await devModeToggle.isVisible()) {
        console.log('🔧 Found Developer Mode toggle in session page');
        
        // Click developer mode toggle
        await devModeToggle.click();
        console.log('✅ Developer Mode toggle clicked');
        await page.waitForTimeout(3000);
        
        // Take screenshot after toggle
        await page.screenshot({ path: './test-results/trpg-session-dev-mode-enabled.png', fullPage: true });
        console.log('📸 Developer Mode enabled screenshot saved');
        
        // Check if we can see any error-related UI changes
        const currentUrl = page.url();
        console.log(`📍 Current URL: ${currentUrl}`);
        
        // Look for any error indicators
        const errorElements = await page.locator('.error, .MuiAlert-error, [class*="error"]').count();
        console.log(`🚨 Error elements found: ${errorElements}`);
        
      } else {
        console.log('⚠️  Developer Mode toggle not found in session page');
      }
      
    } else {
      console.log('❌ Could not find TRPG Session navigation');
      
      // Show available navigation options
      const allNavElements = await page.locator('a, button, [role="menuitem"]').all();
      console.log(`📍 Available navigation elements (${allNavElements.length}):`);
      for (let i = 0; i < Math.min(allNavElements.length, 10); i++) {
        const text = await allNavElements[i].textContent();
        const href = await allNavElements[i].getAttribute('href');
        if (text && text.trim()) {
          console.log(`  ${i}: "${text.trim()}" ${href ? `(${href})` : ''}`);
        }
      }
    }
    
  } catch (error) {
    console.log('❌ Error during navigation test:', error.message);
    await page.screenshot({ path: './test-results/trpg-session-error.png', fullPage: true });
  }
  
  console.log('🖥️  Keeping browser open for 45 seconds for manual inspection...');
  await page.waitForTimeout(45000);
  
  await browser.close();
})();