import { chromium } from 'playwright';

console.log('Launching browser...');

// Launch browser in headed mode with debugging enabled
const browser = await chromium.launch({
  headless: false,
  devtools: true,
  args: ['--start-maximized', '--disable-blink-features=AutomationControlled']
});

const context = await browser.newContext({
  viewport: null,
  ignoreHTTPSErrors: true
});

const page = await context.newPage();

// Enable console logging
page.on('console', msg => console.log('PAGE LOG:', msg.text()));
page.on('pageerror', err => console.log('PAGE ERROR:', err.toString()));

console.log('Navigating to http://localhost:5173...');

try {
  // Navigate to the application with more lenient settings
  const response = await page.goto('http://localhost:5173', {
    waitUntil: 'domcontentloaded',
    timeout: 30000
  });
  
  console.log(`Response status: ${response.status()}`);
  console.log(`Response URL: ${response.url()}`);
  
  // Wait for React to mount
  console.log('Waiting for React app to mount...');
  
  // Try multiple selectors to find when the app is ready
  const selectors = [
    '#root',
    'button',
    '[class*="MuiButton"]',
    'h1',
    'div[role="main"]',
    '.MuiContainer-root'
  ];
  
  let foundElement = false;
  for (const selector of selectors) {
    try {
      await page.waitForSelector(selector, { timeout: 5000 });
      console.log(`Found selector: ${selector}`);
      foundElement = true;
      break;
    } catch (e) {
      console.log(`Selector ${selector} not found`);
    }
  }
  
  if (!foundElement) {
    console.log('No expected selectors found, checking page content...');
  }
  
  // Additional wait for any lazy loading
  await page.waitForTimeout(3000);
  
  // Get page title and URL
  const title = await page.title();
  const url = page.url();
  console.log(`Page title: ${title}`);
  console.log(`Current URL: ${url}`);
  
  // Check for any visible text
  const bodyText = await page.evaluate(() => document.body.innerText);
  console.log(`Body text preview: ${bodyText.substring(0, 200)}...`);
  
  // Take a screenshot
  const screenshotPath = '/mnt/c/Users/irure/git/AIAgentTRPGGM/apps/frontend/trpg-app-interactive-screenshot.png';
  await page.screenshot({ 
    path: screenshotPath,
    fullPage: true 
  });
  console.log(`Screenshot saved to: ${screenshotPath}`);
  
  // Try to find and interact with buttons
  console.log('\nLooking for interactive elements...');
  
  const buttons = await page.locator('button').all();
  console.log(`Found ${buttons.length} buttons`);
  
  for (let i = 0; i < Math.min(3, buttons.length); i++) {
    const buttonText = await buttons[i].textContent();
    console.log(`Button ${i + 1}: "${buttonText}"`);
  }
  
  // Check for developer mode
  const checkboxes = await page.locator('input[type="checkbox"]').all();
  console.log(`Found ${checkboxes.length} checkboxes`);
  
  // Try to open developer tools console
  console.log('\nOpening DevTools console for debugging...');
  await page.keyboard.press('F12');
  
  console.log('\n============================================');
  console.log('Browser is now open with the TRPG application');
  console.log('DevTools should be open for debugging');
  console.log('You can interact with the application directly');
  console.log('Press Ctrl+C to close the browser and exit');
  console.log('============================================\n');
  
  // Keep the browser open
  await new Promise(() => {});
  
} catch (error) {
  console.error('Error:', error);
  
  // Get network errors
  console.log('\nChecking for network issues...');
  const failedRequests = [];
  page.on('requestfailed', request => {
    failedRequests.push(`${request.url()} - ${request.failure().errorText}`);
  });
  
  // Try to get page content
  try {
    const content = await page.content();
    console.log('Page HTML preview:', content.substring(0, 500));
  } catch (e) {
    console.log('Could not get page content:', e.message);
  }
  
  // Take error screenshot
  await page.screenshot({ 
    path: '/mnt/c/Users/irure/git/AIAgentTRPGGM/apps/frontend/trpg-app-error-interactive-screenshot.png',
    fullPage: true 
  });
  
  console.log('\nBrowser is open for debugging. Press Ctrl+C to close.');
  await new Promise(() => {});
}