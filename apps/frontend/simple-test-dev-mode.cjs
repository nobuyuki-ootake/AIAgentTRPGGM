const { chromium } = require('playwright');

(async () => {
  console.log('🔧 Testing Developer Mode Toggle...');
  
  const browser = await chromium.launch({ 
    headless: false,
    slowMo: 2000
  });
  
  const context = await browser.newContext({
    viewport: { width: 1920, height: 1080 }
  });
  
  const page = await context.newPage();
  
  // Error listener
  page.on('console', msg => {
    if (msg.type() === 'error') {
      console.log(`❌ Console Error: ${msg.text()}`);
    }
  });
  
  // Navigate to localhost:5173
  await page.goto('http://localhost:5173');
  await page.waitForTimeout(3000);
  
  console.log('✅ Page loaded');
  
  // Take initial screenshot
  await page.screenshot({ path: './test-results/dev-mode-test-initial.png', fullPage: true });
  
  // Try to find and click developer mode toggle
  try {
    // Multiple strategies to find the toggle
    const toggleSelectors = [
      'text=開発者モード',
      '[aria-label*="開発者"]',
      '[role="switch"]:has-text("開発者")',
      'label:has-text("開発者モード")',
      '.MuiSwitch-root:near(:text("開発者"))',
      'input[type="checkbox"]:near(:text("開発者"))'
    ];
    
    let clicked = false;
    for (const selector of toggleSelectors) {
      try {
        const element = await page.locator(selector).first();
        if (await element.isVisible()) {
          console.log(`🎯 Found toggle with selector: ${selector}`);
          await element.click();
          console.log('✅ Developer mode toggle clicked');
          clicked = true;
          break;
        }
      } catch (e) {
        // Try next selector
      }
    }
    
    if (!clicked) {
      console.log('⚠️ Could not find developer mode toggle');
      
      // Show all text content
      const allText = await page.textContent('body');
      console.log('📄 Page contains "開発者":', allText.includes('開発者'));
      
      // Take debug screenshot
      await page.screenshot({ path: './test-results/dev-mode-debug.png', fullPage: true });
    } else {
      // Wait after clicking
      await page.waitForTimeout(3000);
      
      // Take screenshot after toggle
      await page.screenshot({ path: './test-results/dev-mode-test-after.png', fullPage: true });
      console.log('📸 After toggle screenshot saved');
    }
    
  } catch (error) {
    console.log('❌ Error during toggle test:', error.message);
  }
  
  console.log('🖥️ Keeping browser open for 60 seconds...');
  await page.waitForTimeout(60000);
  
  await browser.close();
})();