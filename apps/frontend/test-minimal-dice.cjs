const { chromium } = require('playwright');

async function testMinimalDice() {
  console.log('🎲 Testing Minimal Dice Page...');
  
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
      } else if (msg.type() === 'log') {
        console.log('📝 Console Log:', msg.text());
      }
    });
    
    // Navigate to test dice page
    console.log('🌐 Navigating to test dice page...');
    await page.goto('http://localhost:5173/test-dice');
    await page.waitForTimeout(3000);
    
    // Take screenshot
    await page.screenshot({ 
      path: 'test-results/minimal-dice-test.png',
      fullPage: true 
    });
    
    // Check for dice buttons
    const diceButtons = await page.locator('button:has-text("D")').count();
    const d20Button = await page.locator('button:has-text("D20")').count();
    const allButtons = await page.locator('button').count();
    
    console.log(`🎲 Found ${diceButtons} dice buttons`);
    console.log(`🎲 Found ${d20Button} D20 buttons`);
    console.log(`🔘 Total buttons found: ${allButtons}`);
    
    // If dice buttons found, try clicking one
    if (d20Button > 0) {
      console.log('🖱️ Clicking D20 button...');
      await page.locator('button:has-text("D20")').first().click();
      await page.waitForTimeout(1000);
      
      // Check for dialog
      const dialogs = await page.locator('[role="dialog"]').count();
      const diceDialogs = await page.locator('text=ダイスロール').count();
      
      console.log(`📋 Found ${dialogs} dialogs`);
      console.log(`🎲 Found ${diceDialogs} dice roll dialogs`);
      
      // Take screenshot after clicking
      await page.screenshot({ 
        path: 'test-results/minimal-dice-after-click.png',
        fullPage: true 
      });
      console.log('📸 Screenshot after D20 click taken');
    }
    
    // Report results
    if (consoleErrors.length === 0) {
      console.log('\n✅ No console errors detected');
    } else {
      console.log(`\n❌ Found ${consoleErrors.length} console errors`);
    }
    
    if (diceButtons > 0) {
      console.log(`\n🎉 SUCCESS! Dice functionality is working with ${diceButtons} buttons`);
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

testMinimalDice();