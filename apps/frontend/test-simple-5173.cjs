const { chromium } = require('playwright');

(async () => {
  console.log('🔍 Simple test with localhost:5173...');
  
  const browser = await chromium.launch({ 
    headless: false,
    slowMo: 1000
  });
  
  const context = await browser.newContext({
    viewport: { width: 1280, height: 720 }
  });
  
  const page = await context.newPage();
  
  try {
    console.log('🌍 Trying to connect...');
    await page.goto('http://localhost:5173', { 
      waitUntil: 'domcontentloaded',
      timeout: 10000 
    });
    
    console.log('✅ Page loaded successfully!');
    
    // Take screenshot
    await page.screenshot({ 
      path: './test-results/simple-test-5173.png',
      fullPage: true 
    });
    
    // Check for developer toggle
    const devToggle = await page.getByTestId('developer-toggle');
    const isVisible = await devToggle.isVisible();
    console.log(`Developer toggle visible: ${isVisible}`);
    
    if (isVisible) {
      console.log('✅ Developer toggle found!');
      await devToggle.click();
      console.log('✅ Toggle clicked');
      await page.waitForTimeout(2000);
      
      await page.screenshot({ 
        path: './test-results/simple-test-after-toggle.png',
        fullPage: true 
      });
    }
    
  } catch (error) {
    console.log(`❌ Error: ${error.message}`);
    
    // Try different URLs
    console.log('🔄 Trying 127.0.0.1...');
    try {
      await page.goto('http://127.0.0.1:5173', { 
        waitUntil: 'domcontentloaded',
        timeout: 10000 
      });
      console.log('✅ 127.0.0.1 worked!');
    } catch (e2) {
      console.log(`❌ 127.0.0.1 also failed: ${e2.message}`);
    }
  }
  
  await page.waitForTimeout(10000);
  await browser.close();
})();