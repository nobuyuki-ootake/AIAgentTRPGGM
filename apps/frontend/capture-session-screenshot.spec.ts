import { test } from '@playwright/test';

test('capture TRPG session page screenshot', async ({ page }) => {
  // Navigate to the TRPG session page directly
  await page.goto('/session');
  
  // Wait for the page to load completely
  await page.waitForLoadState('networkidle');
  
  // Additional wait to ensure any dynamic content is rendered
  await page.waitForTimeout(3000);
  
  // Take a full page screenshot
  await page.screenshot({ 
    path: 'trpg-session-screenshot.png',
    fullPage: true 
  });
  
  console.log('Screenshot saved as trpg-session-screenshot.png');
});