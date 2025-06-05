import { chromium } from 'playwright';

console.log('Launching browser to show TRPG application...');

// Launch browser in headed mode
const browser = await chromium.launch({
  headless: false,
  args: ['--start-maximized']
});

const context = await browser.newContext({
  viewport: null,
  ignoreHTTPSErrors: true
});

const page = await context.newPage();

// Enable console logging
page.on('console', msg => {
  if (msg.type() === 'error') {
    console.log('PAGE ERROR:', msg.text());
  }
});

console.log('Navigating to http://localhost:5173...');

try {
  // Navigate to the application
  await page.goto('http://localhost:5173', {
    waitUntil: 'networkidle',
    timeout: 30000
  });
  
  console.log('Page loaded, waiting for app to initialize...');
  
  // Wait for the app to be ready
  await page.waitForTimeout(5000);
  
  // Refresh to ensure latest changes
  console.log('Refreshing page...');
  await page.reload();
  await page.waitForTimeout(3000);
  
  // Take a screenshot
  const screenshotPath = '/mnt/c/Users/irure/git/AIAgentTRPGGM/apps/frontend/trpg-app-current.png';
  await page.screenshot({ 
    path: screenshotPath,
    fullPage: true 
  });
  console.log(`Screenshot saved to: ${screenshotPath}`);
  
  // Get page info
  const title = await page.title();
  const url = page.url();
  console.log(`Page title: ${title}`);
  console.log(`Current URL: ${url}`);
  
  // Check for visible elements
  const buttons = await page.locator('button').count();
  console.log(`Found ${buttons} buttons on the page`);
  
  // Look for specific TRPG elements
  const hasNewProjectButton = await page.locator('button:has-text("新規プロジェクト作成")').count() > 0;
  const hasNewCampaignButton = await page.locator('button:has-text("新規キャンペーン作成")').count() > 0;
  
  if (hasNewProjectButton) {
    console.log('Found "新規プロジェクト作成" button - clicking it...');
    await page.locator('button:has-text("新規プロジェクト作成")').first().click();
    await page.waitForTimeout(2000);
    
    // Take screenshot with dialog
    await page.screenshot({ 
      path: '/mnt/c/Users/irure/git/AIAgentTRPGGM/apps/frontend/trpg-app-dialog.png',
      fullPage: true 
    });
    console.log('Dialog screenshot saved');
  } else if (hasNewCampaignButton) {
    console.log('Found "新規キャンペーン作成" button - clicking it...');
    await page.locator('button:has-text("新規キャンペーン作成")').first().click();
    await page.waitForTimeout(2000);
    
    // Take screenshot with dialog
    await page.screenshot({ 
      path: '/mnt/c/Users/irure/git/AIAgentTRPGGM/apps/frontend/trpg-app-campaign-dialog.png',
      fullPage: true 
    });
    console.log('Campaign dialog screenshot saved');
  }
  
  console.log('\n============================================');
  console.log('TRPG Application is now open in the browser');
  console.log('You can interact with it directly');
  console.log('The browser will remain open for you to use');
  console.log('Press Ctrl+C when you want to close it');
  console.log('============================================\n');
  
  // Keep the browser open
  await new Promise(() => {});
  
} catch (error) {
  console.error('Error:', error.message);
  
  // Take error screenshot
  await page.screenshot({ 
    path: '/mnt/c/Users/irure/git/AIAgentTRPGGM/apps/frontend/trpg-app-error.png',
    fullPage: true 
  });
  
  console.log('\nError occurred, but browser is still open.');
  console.log('Press Ctrl+C to close.');
  await new Promise(() => {});
}