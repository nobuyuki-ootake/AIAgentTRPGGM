import { test, expect, Page } from '@playwright/test';

test.describe('TRPG Application Status Check', () => {
  test('Check if application loads without white screen', async ({ page }) => {
    console.log('Navigating to http://localhost:5173...');
    
    // Set up console error logging
    const consoleErrors: string[] = [];
    page.on('console', msg => {
      if (msg.type() === 'error') {
        consoleErrors.push(msg.text());
        console.log('Console Error:', msg.text());
      }
    });
    
    page.on('pageerror', error => {
      console.log('Page Error:', error.message);
    });
    
    // Navigate to the application
    const response = await page.goto('http://localhost:5173', {
      waitUntil: 'networkidle',
      timeout: 30000
    });
    
    console.log('Response status:', response?.status());
    
    // Take screenshot of initial load
    await page.screenshot({ 
      path: 'test-results/initial-app-status.png',
      fullPage: true 
    });
    
    // Check if the main app element exists
    const rootElement = page.locator('#root');
    await expect(rootElement).toBeVisible();
    
    // Check if there's actual content (not just a white screen)
    const bodyText = await page.textContent('body');
    console.log('Body text length:', bodyText?.length || 0);
    
    if (bodyText && bodyText.trim().length === 0) {
      console.log('WARNING: Page appears to be blank/white screen');
    }
    
    // Look for the main navigation or header
    const mainContent = page.locator('main, [role="main"], header, nav');
    const hasMainContent = await mainContent.count() > 0;
    
    if (hasMainContent) {
      console.log('Found main content elements');
    } else {
      console.log('WARNING: No main content elements found');
    }
    
    // Print console errors
    if (consoleErrors.length > 0) {
      console.log('Console Errors Found:');
      consoleErrors.forEach((error, index) => {
        console.log(`${index + 1}. ${error}`);
      });
    } else {
      console.log('No console errors detected!');
    }
    
    // Try to navigate to TRPG Session page
    try {
      console.log('Attempting to navigate to TRPG Session page...');
      await page.goto('http://localhost:5173/trpg-session', {
        waitUntil: 'networkidle',
        timeout: 15000
      });
      
      await page.screenshot({ 
        path: 'test-results/trpg-session-status.png',
        fullPage: true 
      });
      
      console.log('Successfully navigated to TRPG Session page');
    } catch (error) {
      console.log('Error navigating to TRPG Session:', error);
    }
  });
});