const { chromium } = require('playwright');

(async () => {
  console.log('🧹 Testing with cache clearing...');
  
  const browser = await chromium.launch({ 
    headless: false,
    slowMo: 1500
  });
  
  const context = await browser.newContext({
    viewport: { width: 1920, height: 1080 }
  });
  
  const page = await context.newPage();
  
  // Clear all browser storage
  await page.goto('http://localhost:5173');
  await page.evaluate(() => {
    localStorage.clear();
    sessionStorage.clear();
  });
  
  // Hard refresh the page
  await page.reload({ waitUntil: 'networkidle' });
  await page.waitForTimeout(3000);
  
  console.log('✅ Cache cleared and page reloaded');
  
  // Track console messages
  page.on('console', msg => {
    const msgType = msg.type();
    const text = msg.text();
    if (msgType === 'error') {
      console.log(`❌ Console Error: ${text}`);
    }
  });
  
  try {
    // Navigate to TRPG Session
    const sessionLink = await page.locator('text=TRPGセッション').first();
    if (await sessionLink.isVisible()) {
      await sessionLink.click();
      console.log('🎮 Navigated to TRPG Session page');
      await page.waitForTimeout(3000);
      
      // Take screenshot
      await page.screenshot({ path: './test-results/trpg-session-after-cache-clear.png', fullPage: true });
      
      // Check for developer mode toggle
      const devModeToggle = await page.locator('text=開発者モード').first();
      if (await devModeToggle.isVisible()) {
        console.log('🔧 Found Developer Mode toggle!');
        await devModeToggle.click();
        console.log('✅ Developer Mode toggled');
        await page.waitForTimeout(3000);
        
        await page.screenshot({ path: './test-results/trpg-session-dev-mode-success.png', fullPage: true });
        console.log('📸 Success screenshot saved');
      } else {
        console.log('⚠️  Developer Mode toggle still not found');
        
        // Check if the page has content
        const bodyText = await page.textContent('body');
        console.log(`📄 Page has content: ${bodyText.length > 100}`);
        console.log(`📄 Page preview: ${bodyText.substring(0, 200)}...`);
      }
    }
  } catch (error) {
    console.log(`❌ Error: ${error.message}`);
    await page.screenshot({ path: './test-results/error-after-cache-clear.png', fullPage: true });
  }
  
  console.log('🖥️  Keeping browser open for 30 seconds...');
  await page.waitForTimeout(30000);
  
  await browser.close();
})();