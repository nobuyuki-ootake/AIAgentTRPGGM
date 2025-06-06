const { chromium } = require('playwright');

(async () => {
  console.log('🎮 Testing TRPG Session with character display...');
  
  const browser = await chromium.launch({ 
    headless: false,
    slowMo: 500
  });
  
  const page = await browser.newPage();
  
  // Track console errors
  page.on('console', msg => {
    if (msg.type() === 'error') {
      console.log(`❌ Console Error: ${msg.text()}`);
    }
  });
  
  await page.goto('http://localhost:5173');
  await page.waitForTimeout(2000);
  
  // Enable developer mode
  const devToggle = await page.locator('[data-testid="developer-mode-toggle"]');
  if (await devToggle.isVisible()) {
    await devToggle.click();
    console.log('✅ Developer mode enabled');
  }
  
  // Navigate to TRPG session
  await page.click('text=TRPGセッション');
  await page.waitForTimeout(2000);
  
  // Take screenshot
  await page.screenshot({ path: './test-results/trpg-session-with-characters.png', fullPage: true });
  console.log('📸 Screenshot saved');
  
  // Check for character list
  const characterList = await page.locator('text=パーティメンバー').isVisible();
  console.log(`Character list visible: ${characterList}`);
  
  // Check for errors
  const errors = await page.locator('.MuiAlert-error').count();
  console.log(`Error alerts: ${errors}`);
  
  console.log('🖥️  Browser open for inspection. Press Ctrl+C to close.');
  await new Promise(() => {});
})();