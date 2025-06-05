import { chromium } from 'playwright';

(async () => {
  console.log('Starting Playwright browser automation...');
  
  // Launch browser with visible window
  const browser = await chromium.launch({
    headless: false, // Show browser window
    slowMo: 100 // Slow down actions for visibility
  });
  
  try {
    // Create a new browser context and page
    const context = await browser.newContext({
      viewport: { width: 1280, height: 720 }
    });
    const page = await context.newPage();
    
    console.log('Navigating to http://localhost:5173...');
    
    // Navigate to the URL with extended timeout
    const response = await page.goto('http://localhost:5173', {
      waitUntil: 'networkidle',
      timeout: 30000
    });
    
    // Check response status
    if (response) {
      console.log(`Page loaded with status: ${response.status()}`);
      console.log(`URL: ${page.url()}`);
    }
    
    // Wait for the app to fully load
    await page.waitForTimeout(2000);
    
    // Take a screenshot
    const screenshotPath = './test-results/localhost-5173-screenshot.png';
    await page.screenshot({ 
      path: screenshotPath,
      fullPage: true 
    });
    console.log(`Screenshot saved to: ${screenshotPath}`);
    
    // Get page title
    const title = await page.title();
    console.log(`Page title: ${title}`);
    
    // Check for any console errors
    page.on('console', msg => {
      if (msg.type() === 'error') {
        console.error('Console error:', msg.text());
      }
    });
    
    // Check if main app element exists
    const appElement = await page.$('#root');
    if (appElement) {
      console.log('✓ React root element found');
    } else {
      console.log('✗ React root element not found');
    }
    
    // Try to identify TRPG-specific elements
    const trpgElements = await page.evaluate(() => {
      const elements = {
        hasAppLayout: !!document.querySelector('[class*="AppLayout"]'),
        hasSidebar: !!document.querySelector('[class*="Sidebar"]'),
        hasMainContent: !!document.querySelector('main'),
        visibleText: document.body.innerText.substring(0, 200)
      };
      return elements;
    });
    
    console.log('\nPage analysis:');
    console.log('- App Layout found:', trpgElements.hasAppLayout);
    console.log('- Sidebar found:', trpgElements.hasSidebar);
    console.log('- Main content found:', trpgElements.hasMainContent);
    console.log('\nVisible text preview:');
    console.log(trpgElements.visibleText);
    
    // Keep browser open for manual inspection
    console.log('\nBrowser window is open. Press Ctrl+C to close...');
    await new Promise(() => {}); // Keep running indefinitely
    
  } catch (error) {
    console.error('Error occurred:', error.message);
    
    // Take error screenshot
    const page = await browser.newPage();
    await page.screenshot({ 
      path: './test-results/error-screenshot.png' 
    });
    
    throw error;
  } finally {
    // This won't run due to the infinite promise above
    // await browser.close();
  }
})();