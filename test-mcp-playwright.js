// Simple test to verify Playwright MCP can access the server
const { test, expect } = require('@playwright/test');

test('Basic server connectivity test', async ({ page }) => {
  try {
    // Navigate to the development server
    await page.goto('http://localhost:5173');
    
    // Wait for the page to load
    await page.waitForLoadState('networkidle');
    
    // Take a screenshot
    await page.screenshot({ path: 'server-test.png' });
    
    // Check if the page loaded successfully
    const title = await page.title();
    console.log('Page title:', title);
    
    // Check if React app loaded
    const reactRoot = page.locator('#root');
    await expect(reactRoot).toBeVisible();
    
    console.log('✅ Server is accessible via Playwright MCP!');
  } catch (error) {
    console.error('❌ Error accessing server:', error.message);
  }
});