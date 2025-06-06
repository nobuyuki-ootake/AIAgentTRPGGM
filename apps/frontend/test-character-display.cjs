const { chromium } = require('playwright');

(async () => {
  console.log('Launching browser...');
  const browser = await chromium.launch({ 
    headless: false,
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });
  
  const context = await browser.newContext({
    viewport: { width: 1920, height: 1080 }
  });
  
  const page = await context.newPage();
  
  // Listen for console messages
  page.on('console', msg => {
    const type = msg.type();
    if (type === 'error') {
      console.error('Console error:', msg.text());
    }
  });
  
  // Listen for page errors
  page.on('pageerror', error => {
    console.error('Page error:', error.message);
  });
  
  try {
    console.log('Navigating to localhost:5173...');
    await page.goto('http://localhost:5173', { waitUntil: 'networkidle' });
    await page.waitForTimeout(2000);
    
    console.log('Enabling developer mode...');
    // Click the developer mode toggle
    const devToggle = await page.locator('[data-testid="developer-mode-switch"]');
    if (await devToggle.isVisible()) {
      await devToggle.click();
      console.log('Developer mode enabled');
    } else {
      console.log('Developer mode toggle not found, trying alternative selector...');
      // Try clicking by class
      const altToggle = await page.locator('.MuiSwitch-root');
      if (await altToggle.isVisible()) {
        await altToggle.click();
        console.log('Developer mode enabled via alternative selector');
      }
    }
    
    await page.waitForTimeout(1000);
    
    console.log('Navigating to TRPG Session page...');
    // Click the TRPG Session menu item
    const sessionLink = await page.locator('text=TRPG Session').first();
    if (await sessionLink.isVisible()) {
      await sessionLink.click();
    } else {
      // Try direct navigation
      await page.goto('http://localhost:5173/trpg-session', { waitUntil: 'networkidle' });
    }
    
    await page.waitForTimeout(3000);
    
    console.log('Taking screenshot of character display...');
    await page.screenshot({ 
      path: 'test-results/character-display-test.png',
      fullPage: false 
    });
    
    // Check for specific character display elements
    const characterDisplay = await page.locator('[data-testid="character-display"]');
    if (await characterDisplay.isVisible()) {
      console.log('✓ Character display component is visible');
    } else {
      console.log('✗ Character display component not found, checking alternatives...');
      
      // Check for character cards
      const characterCards = await page.locator('.character-card, [class*="character"]');
      const count = await characterCards.count();
      console.log(`Found ${count} character-related elements`);
    }
    
    // Check for AI GM display
    const aiGmDisplay = await page.locator('text=AI GM').first();
    if (await aiGmDisplay.isVisible()) {
      console.log('✓ AI GM display is visible');
    }
    
    // Take a focused screenshot of the character area if found
    const characterArea = await page.locator('.character-display-area, [class*="character-display"]').first();
    if (await characterArea.isVisible()) {
      await characterArea.screenshot({ 
        path: 'test-results/character-area-focused.png' 
      });
      console.log('Focused character area screenshot taken');
    }
    
    console.log('\nTest complete! Browser will remain open for inspection.');
    console.log('Screenshots saved to:');
    console.log('- test-results/character-display-test.png');
    console.log('- test-results/character-area-focused.png (if character area found)');
    console.log('\nPress Ctrl+C to close the browser and exit.');
    
    // Keep the browser open
    await new Promise(() => {});
    
  } catch (error) {
    console.error('Error during test:', error);
    await page.screenshot({ path: 'test-results/error-screenshot.png' });
  }
})();