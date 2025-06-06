const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch({ headless: false });
  const page = await browser.newPage();
  
  // Try different ports
  const ports = [5173, 5174, 3000];
  
  for (const port of ports) {
    try {
      console.log(`Trying port ${port}...`);
      await page.goto(`http://localhost:${port}/`, { timeout: 5000 });
      console.log(`✅ Success on port ${port}`);
      
      // Enable dev mode
      const devToggle = await page.locator('[data-testid="developer-mode-toggle"]');
      if (await devToggle.isVisible()) {
        await devToggle.click();
        console.log('Dev mode enabled');
      }
      
      // Go to TRPG session
      await page.click('text=TRPGセッション');
      await page.waitForTimeout(2000);
      
      await page.screenshot({ path: `./test-results/trpg-session-port-${port}.png` });
      console.log(`Screenshot saved for port ${port}`);
      
      break;
    } catch (e) {
      console.log(`❌ Failed on port ${port}: ${e.message}`);
    }
  }
  
  console.log('Browser will stay open. Press Ctrl+C to close.');
  await new Promise(() => {});
})();