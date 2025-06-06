const { chromium } = require('playwright');

async function testCorrectRoute() {
  console.log('🎲 Testing TRPG Session with Correct Route...');
  
  let browser;
  try {
    browser = await chromium.launch({ 
      headless: false,
      args: ['--no-sandbox', '--disable-setuid-sandbox']
    });
    
    const context = await browser.newContext({
      viewport: { width: 1920, height: 1080 }
    });
    
    const page = await context.newPage();
    
    // Listen for console errors
    const consoleErrors = [];
    page.on('console', msg => {
      if (msg.type() === 'error') {
        consoleErrors.push(msg.text());
        console.log('❌ Console Error:', msg.text());
      }
    });
    
    // Navigate to home page first
    console.log('🌐 Navigating to localhost:5173...');
    await page.goto('http://localhost:5173');
    await page.waitForTimeout(3000);
    
    // Enable developer mode
    try {
      const devToggle = await page.locator('input[type="checkbox"]').first();
      if (await devToggle.isVisible()) {
        await devToggle.check();
        console.log('✅ Developer mode enabled');
        await page.waitForTimeout(1000);
      }
    } catch (e) {
      console.log('⚠️ Could not enable developer mode');
    }
    
    // Navigate to TRPG session page using correct route
    console.log('🎮 Navigating to TRPG Session page (/session)...');
    await page.goto('http://localhost:5173/session');
    await page.waitForTimeout(3000);
    
    // Take screenshot
    await page.screenshot({ 
      path: 'test-results/correct-route-test.png',
      fullPage: true 
    });
    
    // Check for content
    const bodyText = await page.textContent('body');
    console.log('📄 Page has content:', bodyText && bodyText.trim().length > 0);
    
    // Look for dice-related elements
    const diceButtons = await page.locator('button:has-text("D")').count();
    const d20Button = await page.locator('button:has-text("D20")').count();
    const sessionTitle = await page.locator('text=TRPGセッション').count();
    
    console.log(`🎲 Found ${diceButtons} dice buttons`);
    console.log(`🎲 Found ${d20Button} D20 buttons`);
    console.log(`🎮 Found ${sessionTitle} session titles`);
    
    // If dice buttons found, try clicking one
    if (d20Button > 0) {
      console.log('🖱️ Clicking D20 button...');
      await page.locator('button:has-text("D20")').first().click();
      await page.waitForTimeout(1000);
      
      // Take screenshot after clicking
      await page.screenshot({ 
        path: 'test-results/after-d20-click.png',
        fullPage: true 
      });
      console.log('📸 Screenshot after D20 click taken');
    }
    
    // Report results
    if (consoleErrors.length > 0) {
      console.log('\n❌ Console Errors Found:');
      consoleErrors.forEach((error, index) => {
        console.log(`  ${index + 1}. ${error}`);
      });
    } else {
      console.log('\n✅ No console errors detected');
    }
    
    if (diceButtons > 0) {
      console.log(`\n🎉 Success! Found ${diceButtons} dice buttons`);
    } else {
      console.log('\n❌ No dice buttons found');
    }
    
  } catch (error) {
    console.error('❌ Test failed:', error);
  } finally {
    if (browser) {
      await browser.close();
    }
  }
}

testCorrectRoute();