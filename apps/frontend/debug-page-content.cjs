const { chromium } = require('playwright');

async function debugPageContent() {
  const browser = await chromium.launch({ 
    headless: false,
    slowMo: 500
  });
  const context = await browser.newContext({
    viewport: { width: 1600, height: 900 }
  });
  const page = await context.newPage();

  try {
    console.log('🔍 Starting page content debug...');

    // Listen for console messages
    page.on('console', msg => {
      console.log(`[BROWSER] ${msg.type()}: ${msg.text()}`);
    });

    page.on('pageerror', error => {
      console.log(`[PAGE ERROR] ${error.message}`);
    });

    // Navigate to TRPG session page
    console.log('📱 Navigating to TRPG session page...');
    await page.goto('http://localhost:5173/session');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(3000);

    // Take screenshot of what's actually there
    await page.screenshot({ 
      path: 'test-results/debug-01-actual-page.png',
      fullPage: true 
    });

    // Get page title
    const title = await page.title();
    console.log('Page title:', title);

    // Get all text content to see what's actually on the page
    const bodyText = await page.locator('body').textContent();
    console.log('Page body text (first 500 chars):', bodyText.substring(0, 500));

    // Look for any h1, h2, h3, h4, h5, h6 elements
    const headings = await page.locator('h1, h2, h3, h4, h5, h6').all();
    console.log(`Found ${headings.length} heading elements:`);
    for (let i = 0; i < headings.length; i++) {
      const text = await headings[i].textContent();
      const tagName = await headings[i].evaluate(el => el.tagName);
      console.log(`  ${tagName}: "${text}"`);
    }

    // Look for any buttons
    const buttons = await page.locator('button').all();
    console.log(`Found ${buttons.length} button elements:`);
    for (let i = 0; i < Math.min(10, buttons.length); i++) {
      const text = await buttons[i].textContent();
      console.log(`  Button ${i}: "${text}"`);
    }

    // Check if we're in an error state
    const errorElements = await page.locator('[color="error"], .error, .MuiAlert-standardError').all();
    if (errorElements.length > 0) {
      console.log('❌ Found error elements on page:');
      for (let i = 0; i < errorElements.length; i++) {
        const text = await errorElements[i].textContent();
        console.log(`  Error ${i}: "${text}"`);
      }
    }

    // Check if we're in a loading state
    const loadingElements = await page.locator('[role="progressbar"], .loading, .MuiCircularProgress-root').all();
    if (loadingElements.length > 0) {
      console.log('⏳ Found loading elements on page');
    }

    // Check for any data in local storage
    const localStorage = await page.evaluate(() => {
      const items = {};
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        items[key] = localStorage.getItem(key);
      }
      return items;
    });
    
    console.log('LocalStorage keys:', Object.keys(localStorage));
    if (localStorage['recoil-persist']) {
      console.log('Recoil persist data exists');
    }

    await page.waitForTimeout(5000);

  } catch (error) {
    console.error('❌ Debug failed:', error);
    await page.screenshot({ 
      path: 'test-results/debug-error.png',
      fullPage: true 
    });
  } finally {
    await browser.close();
  }
}

debugPageContent().catch(console.error);