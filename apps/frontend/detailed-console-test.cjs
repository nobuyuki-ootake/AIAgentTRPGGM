const { chromium } = require('playwright');

(async () => {
  console.log('🕵️ Detailed Console Test - Capturing ALL logs...');
  
  const browser = await chromium.launch({ 
    headless: false,
    slowMo: 1000
  });
  
  const context = await browser.newContext({
    viewport: { width: 1920, height: 1080 }
  });
  
  const page = await context.newPage();
  
  // Capture ALL console messages with detailed info
  page.on('console', msg => {
    const msgType = msg.type();
    const text = msg.text();
    const location = msg.location();
    console.log(`[${msgType.toUpperCase()}] ${text}`);
    if (location.url) {
      console.log(`  Location: ${location.url}:${location.lineNumber}:${location.columnNumber}`);
    }
  });
  
  // Capture page errors
  page.on('pageerror', error => {
    console.log('❌ PAGE ERROR:', error.message);
    console.log('Stack:', error.stack);
  });
  
  // Capture request failures
  page.on('requestfailed', request => {
    console.log('🌐 REQUEST FAILED:', request.url(), request.failure()?.errorText);
  });
  
  try {
    console.log('🌍 Navigating to localhost:5173...');
    await page.goto('http://localhost:5173', { 
      waitUntil: 'networkidle',
      timeout: 30000 
    });
    
    console.log('✅ Page loaded successfully');
    await page.waitForTimeout(3000);
    
    // Take screenshot
    await page.screenshot({ 
      path: './test-results/detailed-console-home.png',
      fullPage: true 
    });
    
    // Try to navigate to TRPG Session
    console.log('🎯 Looking for TRPG Session navigation...');
    const sessionLink = await page.locator('text=TRPGセッション').first();
    
    if (await sessionLink.isVisible()) {
      console.log('📍 Found TRPG Session link, clicking...');
      await sessionLink.click();
      await page.waitForTimeout(5000); // Wait longer for potential errors
      
      console.log('🎮 Navigation completed, checking page state...');
      
      // Take screenshot after navigation
      await page.screenshot({ 
        path: './test-results/detailed-console-session.png',
        fullPage: true 
      });
      
      // Check page content
      const bodyText = await page.textContent('body');
      console.log(`📄 Page content length: ${bodyText.length} chars`);
      console.log(`📄 First 200 chars: "${bodyText.substring(0, 200)}"`);
      
      // Look for developer mode toggle
      const devModeToggle = await page.locator('text=開発者モード').count();
      console.log(`🔧 Developer mode toggles found: ${devModeToggle}`);
      
      if (devModeToggle > 0) {
        console.log('🎯 Found developer mode toggle, testing click...');
        await page.locator('text=開発者モード').first().click();
        await page.waitForTimeout(3000);
        console.log('✅ Developer mode toggle clicked');
        
        await page.screenshot({ 
          path: './test-results/detailed-console-dev-mode.png',
          fullPage: true 
        });
      }
      
    } else {
      console.log('❌ TRPG Session link not found');
      
      // Show all navigation options
      const allLinks = await page.locator('a, button').all();
      console.log(`📍 Available links/buttons (${allLinks.length} total):`);
      for (let i = 0; i < Math.min(allLinks.length, 10); i++) {
        const text = await allLinks[i].textContent();
        const href = await allLinks[i].getAttribute('href');
        if (text && text.trim()) {
          console.log(`  ${i}: "${text.trim()}" ${href ? `(${href})` : ''}`);
        }
      }
    }
    
  } catch (error) {
    console.log('❌ Test Error:', error.message);
    await page.screenshot({ 
      path: './test-results/detailed-console-error.png',
      fullPage: true 
    });
  }
  
  console.log('⏰ Keeping browser open for 30 seconds for final inspection...');
  await page.waitForTimeout(30000);
  
  await browser.close();
  console.log('🏁 Test completed');
})();