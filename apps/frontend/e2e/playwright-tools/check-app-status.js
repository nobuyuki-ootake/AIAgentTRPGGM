import { chromium } from '@playwright/test';

(async () => {
  console.log('Launching browser to check TRPG application status...');
  
  // Launch browser with visible UI
  const browser = await chromium.launch({
    headless: false,
    slowMo: 100
  });
  
  const context = await browser.newContext({
    viewport: { width: 1280, height: 720 }
  });
  
  const page = await context.newPage();
  
  // Set up console error logging
  const consoleErrors = [];
  page.on('console', msg => {
    if (msg.type() === 'error') {
      consoleErrors.push(msg.text());
      console.log('Console Error:', msg.text());
    }
  });
  
  page.on('pageerror', error => {
    console.log('Page Error:', error.message);
  });
  
  try {
    console.log('Navigating to http://localhost:5173...');
    
    // Navigate to the app with longer timeout
    const response = await page.goto('http://localhost:5173', {
      waitUntil: 'networkidle',
      timeout: 30000
    });
    
    console.log('Response status:', response.status());
    
    // Wait a bit for any errors to appear
    await page.waitForTimeout(3000);
    
    // Take initial screenshot
    await page.screenshot({ 
      path: 'initial-load-status.png',
      fullPage: true 
    });
    console.log('Screenshot saved: initial-load-status.png');
    
    // Check if we're on an error page or white screen
    const bodyText = await page.textContent('body');
    console.log('Body text length:', bodyText.length);
    
    if (bodyText.trim().length === 0) {
      console.log('WARNING: Page appears to be blank/white screen');
    }
    
    // Try to find main app element
    const appElement = await page.$('#root');
    if (appElement) {
      console.log('Found #root element');
      const appContent = await appElement.textContent();
      console.log('App content preview:', appContent.substring(0, 100));
    } else {
      console.log('WARNING: #root element not found');
    }
    
    // Check for common error indicators
    const errorIndicators = await page.$$('text=/error|Error|failed|Failed/i');
    if (errorIndicators.length > 0) {
      console.log(`Found ${errorIndicators.length} error indicators on page`);
    }
    
    // Try to navigate to TRPG Session page if app loads
    console.log('\nAttempting to navigate to TRPG Session page...');
    
    // Look for navigation links
    const sessionLink = await page.$('a[href="/trpg-session"], button:has-text("TRPG Session"), [role="button"]:has-text("TRPG Session")');
    
    if (sessionLink) {
      console.log('Found TRPG Session link, clicking...');
      await sessionLink.click();
      await page.waitForTimeout(2000);
      
      await page.screenshot({ 
        path: 'trpg-session-page.png',
        fullPage: true 
      });
      console.log('Screenshot saved: trpg-session-page.png');
    } else {
      console.log('TRPG Session link not found, trying direct navigation...');
      await page.goto('http://localhost:5173/trpg-session', {
        waitUntil: 'networkidle',
        timeout: 15000
      });
      await page.waitForTimeout(2000);
      
      await page.screenshot({ 
        path: 'trpg-session-direct.png',
        fullPage: true 
      });
      console.log('Screenshot saved: trpg-session-direct.png');
    }
    
    // Print console errors summary
    if (consoleErrors.length > 0) {
      console.log('\n=== Console Errors Summary ===');
      consoleErrors.forEach((error, index) => {
        console.log(`${index + 1}. ${error}`);
      });
    } else {
      console.log('\nNo console errors detected!');
    }
    
    console.log('\nBrowser window is now open. You can interact with the application.');
    console.log('The browser will remain open for inspection.');
    
    // Keep the browser open
    await new Promise(() => {});
    
  } catch (error) {
    console.error('Error during browser automation:', error);
    
    // Take error screenshot
    await page.screenshot({ 
      path: 'error-state.png',
      fullPage: true 
    });
    console.log('Error screenshot saved: error-state.png');
    
    // Keep browser open even on error
    console.log('\nBrowser window remains open for debugging.');
    await new Promise(() => {});
  }
})();