import { test, expect } from '@playwright/test';

test.describe('Browser MCP Functionality Check', () => {
  test('Navigate to localhost:5173 and capture screenshot', async ({ page }) => {
    console.log('Starting browser navigation to localhost:5173...');
    
    // Navigate to the application
    const response = await page.goto('http://localhost:5173', {
      waitUntil: 'networkidle',
      timeout: 30000
    });
    
    // Check if page loaded successfully
    expect(response?.status()).toBe(200);
    console.log(`Page loaded with status: ${response?.status()}`);
    
    // Wait for the app to fully load
    await page.waitForTimeout(2000);
    
    // Take a full page screenshot
    await page.screenshot({ 
      path: './test-results/mcp-browser-screenshot.png',
      fullPage: true 
    });
    console.log('Screenshot saved to test-results/mcp-browser-screenshot.png');
    
    // Get page title
    const title = await page.title();
    console.log(`Page title: ${title}`);
    expect(title).toBeTruthy();
    
    // Check for React root element
    const rootElement = await page.locator('#root');
    await expect(rootElement).toBeVisible();
    console.log('✓ React root element is visible');
    
    // Look for TRPG-specific elements
    const pageContent = await page.content();
    console.log('\nPage analysis:');
    
    // Check for key components
    const hasAppLayout = pageContent.includes('AppLayout') || pageContent.includes('app-layout');
    const hasSidebar = await page.locator('[class*="sidebar"], [class*="Sidebar"], aside').count() > 0;
    const hasMainContent = await page.locator('main').count() > 0;
    
    console.log(`- App Layout detected: ${hasAppLayout}`);
    console.log(`- Sidebar found: ${hasSidebar}`);
    console.log(`- Main content area found: ${hasMainContent}`);
    
    // Get visible text from the page
    const bodyText = await page.locator('body').innerText();
    console.log('\nVisible text preview (first 300 chars):');
    console.log(bodyText.substring(0, 300) + '...');
    
    // Check for any console errors
    const consoleErrors: string[] = [];
    page.on('console', msg => {
      if (msg.type() === 'error') {
        consoleErrors.push(msg.text());
      }
    });
    
    // Wait a bit to catch any delayed console errors
    await page.waitForTimeout(1000);
    
    if (consoleErrors.length > 0) {
      console.log('\nConsole errors detected:');
      consoleErrors.forEach(error => console.log(`- ${error}`));
    } else {
      console.log('\n✓ No console errors detected');
    }
    
    // Try to identify the current page/route
    const url = page.url();
    console.log(`\nCurrent URL: ${url}`);
    
    // Take additional screenshots of specific areas if they exist
    try {
      const sidebar = await page.locator('[class*="sidebar"], [class*="Sidebar"], aside').first();
      if (await sidebar.isVisible()) {
        await sidebar.screenshot({ path: './test-results/mcp-sidebar.png' });
        console.log('Sidebar screenshot saved');
      }
    } catch (e) {
      console.log('Could not capture sidebar screenshot');
    }
    
    // Log final status
    console.log('\n✓ Browser navigation and screenshot capture completed successfully');
  });
});