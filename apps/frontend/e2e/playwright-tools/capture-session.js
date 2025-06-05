const { chromium } = require('playwright');

async function captureSessionPage() {
  const browser = await chromium.launch();
  const page = await browser.newPage();
  
  try {
    console.log('Navigating to TRPG session page...');
    await page.goto('http://localhost:5173/session', { waitUntil: 'networkidle' });
    
    // Wait for the page to be fully loaded
    await page.waitForTimeout(3000);
    
    console.log('Taking screenshot...');
    await page.screenshot({ 
      path: 'trpg-session-screenshot.png',
      fullPage: true 
    });
    
    console.log('Screenshot saved as trpg-session-screenshot.png');
  } catch (error) {
    console.error('Error capturing screenshot:', error);
  } finally {
    await browser.close();
  }
}

captureSessionPage();