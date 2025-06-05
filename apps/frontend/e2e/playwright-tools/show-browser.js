const { chromium } = require('playwright');

(async () => {
  console.log('Launching browser...');
  
  // Launch browser in headed mode (visible window)
  const browser = await chromium.launch({
    headless: false,
    args: ['--start-maximized']
  });
  
  const context = await browser.newContext({
    viewport: null,
    ignoreHTTPSErrors: true
  });
  
  const page = await context.newPage();
  
  console.log('Navigating to http://localhost:5173...');
  
  try {
    // Navigate to the application
    await page.goto('http://localhost:5173', {
      waitUntil: 'networkidle',
      timeout: 30000
    });
    
    console.log('Page loaded successfully!');
    
    // Wait a moment for the page to fully render
    await page.waitForTimeout(2000);
    
    // Take a screenshot
    const screenshotPath = '/mnt/c/Users/irure/git/AIAgentTRPGGM/apps/frontend/trpg-app-screenshot.png';
    await page.screenshot({ 
      path: screenshotPath,
      fullPage: true 
    });
    console.log(`Screenshot saved to: ${screenshotPath}`);
    
    // Try to interact with some elements
    console.log('Looking for interactive elements...');
    
    // Check if there's a "新規プロジェクト作成" button
    const newProjectButton = await page.locator('button:has-text("新規プロジェクト作成")').first();
    if (await newProjectButton.isVisible()) {
      console.log('Found "新規プロジェクト作成" button');
      await newProjectButton.click();
      await page.waitForTimeout(1000);
      
      // Take another screenshot showing the dialog
      await page.screenshot({ 
        path: '/mnt/c/Users/irure/git/AIAgentTRPGGM/apps/frontend/trpg-app-dialog-screenshot.png',
        fullPage: true 
      });
      console.log('Screenshot with dialog saved');
    }
    
    console.log('\nBrowser is now open and displaying the TRPG application.');
    console.log('You can interact with it directly in the browser window.');
    console.log('Press Ctrl+C to close the browser and exit.\n');
    
    // Keep the browser open
    await new Promise(() => {});
    
  } catch (error) {
    console.error('Error loading page:', error.message);
    
    // Try to check what's actually on the page
    const pageContent = await page.content();
    console.log('Page content preview:', pageContent.substring(0, 500));
    
    // Still take a screenshot to see what's there
    await page.screenshot({ 
      path: '/mnt/c/Users/irure/git/AIAgentTRPGGM/apps/frontend/trpg-app-error-screenshot.png',
      fullPage: true 
    });
    console.log('Error screenshot saved');
    
    // Keep browser open for debugging
    console.log('\nBrowser is open for debugging. Press Ctrl+C to close.');
    await new Promise(() => {});
  }
})();