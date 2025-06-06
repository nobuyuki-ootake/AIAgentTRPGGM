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
  
  // Collect console errors
  const consoleErrors = [];
  page.on('console', msg => {
    if (msg.type() === 'error') {
      consoleErrors.push(msg.text());
      console.error('Console error:', msg.text());
    }
  });
  
  // Collect page errors
  const pageErrors = [];
  page.on('pageerror', error => {
    pageErrors.push(error.message);
    console.error('Page error:', error.message);
  });
  
  try {
    console.log('Navigating to localhost:5173...');
    await page.goto('http://localhost:5173', { waitUntil: 'domcontentloaded' });
    
    // Wait for React to mount
    await page.waitForTimeout(3000);
    
    // Check if app loaded
    const appRoot = await page.locator('#root');
    const hasContent = await appRoot.evaluate(el => el.children.length > 0);
    console.log('App root has content:', hasContent);
    
    // Take initial screenshot
    await page.screenshot({ path: 'test-results/home-page-initial.png' });
    
    // Check for loading indicators
    const loading = await page.locator('text=Loading').count();
    console.log('Loading indicators found:', loading);
    
    // Try to find and enable developer mode
    console.log('Looking for developer mode toggle...');
    
    // First try the switch in the sidebar
    const switchSelector = '.MuiSwitch-root input[type="checkbox"]';
    const switchExists = await page.locator(switchSelector).count() > 0;
    
    if (switchExists) {
      const isChecked = await page.locator(switchSelector).isChecked();
      console.log('Developer mode currently:', isChecked ? 'ON' : 'OFF');
      
      if (!isChecked) {
        await page.locator(switchSelector).click({ force: true });
        console.log('Clicked developer mode toggle');
        await page.waitForTimeout(1000);
      }
    } else {
      console.log('Developer mode toggle not found');
    }
    
    // Take screenshot after dev mode
    await page.screenshot({ path: 'test-results/after-dev-mode.png' });
    
    // Look for TRPG Session link
    console.log('Looking for TRPG Session link...');
    const sessionLinks = await page.locator('text=TRPG Session').all();
    console.log(`Found ${sessionLinks.length} TRPG Session links`);
    
    if (sessionLinks.length > 0) {
      // Click the first visible one
      for (const link of sessionLinks) {
        if (await link.isVisible()) {
          console.log('Clicking TRPG Session link...');
          await link.click();
          break;
        }
      }
    } else {
      // Try direct navigation
      console.log('No link found, navigating directly...');
      await page.goto('http://localhost:5173/trpg-session', { waitUntil: 'domcontentloaded' });
    }
    
    // Wait for navigation
    await page.waitForTimeout(5000);
    
    // Check current URL
    console.log('Current URL:', page.url());
    
    // Take screenshot of TRPG session page
    await page.screenshot({ path: 'test-results/trpg-session-page-full.png' });
    
    // Look for character display elements
    console.log('\nChecking for character display elements...');
    
    const selectors = [
      { selector: '[data-testid="character-display"]', name: 'Character Display (testid)' },
      { selector: '.character-display', name: 'Character Display (class)' },
      { selector: '[class*="CharacterDisplay"]', name: 'CharacterDisplay component' },
      { selector: '.MuiPaper-root', name: 'Material UI Paper components' },
      { selector: 'text=AI GM', name: 'AI GM text' },
      { selector: 'text=HP', name: 'HP text' },
      { selector: 'text=MP', name: 'MP text' },
      { selector: '[class*="character"]', name: 'Any character-related class' }
    ];
    
    for (const { selector, name } of selectors) {
      const count = await page.locator(selector).count();
      if (count > 0) {
        console.log(`✓ Found ${count} ${name}`);
        const first = page.locator(selector).first();
        if (await first.isVisible()) {
          const box = await first.boundingBox();
          if (box) {
            console.log(`  Position: ${Math.round(box.x)}, ${Math.round(box.y)}, Size: ${Math.round(box.width)}x${Math.round(box.height)}`);
          }
        }
      } else {
        console.log(`✗ Not found: ${name}`);
      }
    }
    
    // Get page content for debugging
    const bodyText = await page.locator('body').innerText();
    console.log('\nPage text content (first 500 chars):');
    console.log(bodyText.substring(0, 500));
    
    // Check for specific error messages
    if (bodyText.includes('Error') || bodyText.includes('error')) {
      console.log('\n⚠️  Error text found on page');
    }
    
    // Summary
    console.log('\n=== Summary ===');
    console.log(`Console errors: ${consoleErrors.length}`);
    console.log(`Page errors: ${pageErrors.length}`);
    
    if (consoleErrors.length > 0) {
      console.log('\nConsole errors detail:');
      consoleErrors.forEach((err, i) => console.log(`${i + 1}. ${err}`));
    }
    
    console.log('\nBrowser remains open for inspection.');
    console.log('Screenshots saved to:');
    console.log('- test-results/home-page-initial.png');
    console.log('- test-results/after-dev-mode.png');
    console.log('- test-results/trpg-session-page-full.png');
    console.log('\nPress Ctrl+C to close.');
    
    // Keep browser open
    await new Promise(() => {});
    
  } catch (error) {
    console.error('Test error:', error);
    await page.screenshot({ path: 'test-results/error-state.png' });
  }
})();