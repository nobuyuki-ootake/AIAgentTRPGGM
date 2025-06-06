const { chromium } = require('playwright');

async function testDiceFunctionality() {
  console.log('🎲 Testing TRPG Session Dice Functionality...');
  
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
    
    // Navigate to localhost
    console.log('🌐 Navigating to localhost:5173...');
    await page.goto('http://localhost:5173');
    await page.waitForTimeout(2000);
    
    // Take initial screenshot
    await page.screenshot({ 
      path: 'test-results/dice-test-01-home.png',
      fullPage: true 
    });
    console.log('📸 Initial home page screenshot taken');
    
    // Check if developer mode toggle exists and enable it
    console.log('🔧 Looking for developer mode toggle...');
    
    // Try multiple selector strategies for developer mode
    const devModeSelectors = [
      '[data-testid="developer-mode-toggle"]',
      'input[type="checkbox"]',
      '.MuiSwitch-input',
      'span:has-text("Developer Mode")',
      'text=Developer Mode'
    ];
    
    let devModeFound = false;
    for (const selector of devModeSelectors) {
      try {
        const element = await page.locator(selector).first();
        if (await element.isVisible()) {
          console.log(`✅ Found developer mode with selector: ${selector}`);
          await element.click();
          devModeFound = true;
          await page.waitForTimeout(1000);
          break;
        }
      } catch (e) {
        // Continue to next selector
      }
    }
    
    if (!devModeFound) {
      console.log('⚠️ Developer mode toggle not found, proceeding anyway...');
    }
    
    // Navigate to TRPG Session
    console.log('🎮 Navigating to TRPG Session page...');
    
    // Try to find TRPG Session link
    const sessionLinkSelectors = [
      'text=TRPG セッション',
      'text=TRPG Session',
      'a[href="/trpg-session"]',
      'a:has-text("TRPG")',
      'nav a:has-text("セッション")'
    ];
    
    let sessionFound = false;
    for (const selector of sessionLinkSelectors) {
      try {
        const element = await page.locator(selector).first();
        if (await element.isVisible()) {
          console.log(`✅ Found TRPG Session link with selector: ${selector}`);
          await element.click();
          sessionFound = true;
          await page.waitForTimeout(2000);
          break;
        }
      } catch (e) {
        // Continue to next selector
      }
    }
    
    if (!sessionFound) {
      console.log('⚠️ TRPG Session link not found, trying direct navigation...');
      await page.goto('http://localhost:5173/trpg-session');
      await page.waitForTimeout(2000);
    }
    
    // Take screenshot of TRPG session page
    await page.screenshot({ 
      path: 'test-results/dice-test-02-trpg-session.png',
      fullPage: true 
    });
    console.log('📸 TRPG Session page screenshot taken');
    
    // Look for dice section
    console.log('🎲 Looking for dice roll section...');
    
    const diceSelectors = [
      'text=ダイスロール',
      'text=Dice Roll',
      'text=D20',
      'button:has-text("D")',
      '[data-testid*="dice"]',
      '.dice-roll'
    ];
    
    let diceFound = false;
    for (const selector of diceSelectors) {
      try {
        const elements = await page.locator(selector).all();
        if (elements.length > 0) {
          console.log(`✅ Found dice elements with selector: ${selector} (${elements.length} found)`);
          diceFound = true;
          
          // Try to click a dice button
          for (const element of elements) {
            if (await element.isVisible()) {
              const text = await element.textContent();
              console.log(`🎲 Found dice element: "${text}"`);
              
              // If this looks like a dice button, try clicking it
              if (text && (text.includes('D') || text.includes('ダイス'))) {
                console.log(`🖱️ Clicking dice button: ${text}`);
                await element.click();
                await page.waitForTimeout(1000);
                
                // Take screenshot after clicking
                await page.screenshot({ 
                  path: 'test-results/dice-test-03-after-click.png',
                  fullPage: true 
                });
                console.log('📸 Screenshot after dice click taken');
                break;
              }
            }
          }
          break;
        }
      } catch (e) {
        // Continue to next selector
      }
    }
    
    if (!diceFound) {
      console.log('❌ No dice elements found on the page');
      
      // Log page content for debugging
      const pageContent = await page.content();
      console.log('📄 Page title:', await page.title());
      console.log('📄 Page URL:', page.url());
      
      // Look for any buttons or interactive elements
      const buttons = await page.locator('button').all();
      console.log(`🔍 Found ${buttons.length} buttons on page`);
      
      for (let i = 0; i < Math.min(buttons.length, 10); i++) {
        const button = buttons[i];
        if (await button.isVisible()) {
          const text = await button.textContent();
          console.log(`  Button ${i + 1}: "${text}"`);
        }
      }
    }
    
    // Final screenshot
    await page.screenshot({ 
      path: 'test-results/dice-test-04-final.png',
      fullPage: true 
    });
    
    // Report console errors
    if (consoleErrors.length > 0) {
      console.log('\n❌ Console Errors Found:');
      consoleErrors.forEach((error, index) => {
        console.log(`  ${index + 1}. ${error}`);
      });
    } else {
      console.log('\n✅ No console errors detected');
    }
    
    console.log('\n🎲 Dice functionality test completed!');
    console.log('📸 Screenshots saved in test-results/ directory');
    
  } catch (error) {
    console.error('❌ Test failed:', error);
  } finally {
    if (browser) {
      await browser.close();
    }
  }
}

testDiceFunctionality();