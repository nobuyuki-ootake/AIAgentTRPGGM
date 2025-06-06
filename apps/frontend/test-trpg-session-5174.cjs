const { chromium } = require('playwright');

(async () => {
  console.log('🎮 Testing TRPG Session on port 5174...');
  
  const browser = await chromium.launch({ 
    headless: false,
    slowMo: 1000
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
    }
  });
  
  // Navigate to localhost:5174
  await page.goto('http://localhost:5174');
  await page.waitForTimeout(2000);
  
  console.log('✅ Page loaded');
  
  // First enable developer mode in sidebar
  try {
    // Look for developer mode toggle
    const devToggle = await page.locator('[data-testid="developer-mode-toggle"]').first();
    if (await devToggle.isVisible()) {
      await devToggle.click();
      console.log('✅ Developer mode enabled');
      await page.waitForTimeout(1000);
    }
  } catch (e) {
    console.log('⚠️  Could not find developer mode toggle');
  }
  
  // Navigate to TRPG Session
  try {
    const sessionLink = await page.locator('text=TRPGセッション').first();
    if (await sessionLink.isVisible()) {
      await sessionLink.click();
      console.log('🎮 Navigated to TRPG Session page');
      await page.waitForTimeout(2000);
      
      // Take screenshot
      await page.screenshot({ path: './test-results/trpg-session-5174.png', fullPage: true });
      console.log('📸 Screenshot saved');
      
      // Check current URL
      console.log(`📍 Current URL: ${page.url()}`);
      
      // Look for errors
      const errorElements = await page.locator('.error, .MuiAlert-error, [class*="error"]').count();
      console.log(`🚨 Error elements found: ${errorElements}`);
      
    } else {
      console.log('❌ Could not find TRPG Session link');
    }
  } catch (error) {
    console.log('❌ Error:', error.message);
  }
  
  console.log('🖥️  Keeping browser open for manual inspection...');
  await new Promise(() => {}); // Keep running
})();