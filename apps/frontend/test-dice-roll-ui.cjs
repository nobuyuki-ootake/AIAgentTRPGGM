const puppeteer = require('puppeteer');

async function testDiceRollUI() {
  console.log('🎲 Testing Dice Roll UI...');
  
  const browser = await puppeteer.launch({
    headless: false,
    defaultViewport: null,
    args: ['--start-maximized']
  });
  
  const page = await browser.newPage();
  
  // Listen for console events
  page.on('console', msg => {
    const type = msg.type();
    if (type === 'error') {
      console.log(`❌ Console Error: ${msg.text()}`);
    } else if (type === 'log') {
      console.log(`ℹ️  Console Log: ${msg.text()}`);
    } else if (type === 'warning') {
      console.log(`⚠️  Console Warning: ${msg.text()}`);
    }
  });
  
  try {
    // Navigate to localhost
    await page.goto('http://localhost:5174', { waitUntil: 'networkidle0' });
    console.log('✅ Page loaded');
    
    // Enable developer mode first (click on the switch in sidebar)
    console.log('🔧 Looking for developer mode toggle...');
    
    // Wait a bit for page to load
    await page.waitForTimeout(2000);
    
    // Look for developer mode switch in sidebar
    const devModeSelector = '[data-testid="developer-mode-switch"]';
    const devModeElement = await page.$(devModeSelector);
    
    if (devModeElement) {
      console.log('🎯 Found developer mode switch, clicking...');
      await page.click(devModeSelector);
      await page.waitForTimeout(1000);
      console.log('✅ Developer mode enabled');
    } else {
      console.log('⚠️ Developer mode switch not found, checking if already enabled');
    }
    
    // Navigate to TRPG Session page
    console.log('🎮 Looking for TRPG Session navigation...');
    
    // Try different selectors for TRPG Session link
    const trpgSelectors = [
      'text=TRPGセッション',
      '[href="/trpg-session"]',
      'a[href*="trpg-session"]',
      '[data-testid="nav-trpg-session"]'
    ];
    
    let trpgNavElement = null;
    for (const selector of trpgSelectors) {
      trpgNavElement = await page.$(selector);
      if (trpgNavElement) {
        console.log(`🎯 Found TRPG Session nav with: ${selector}`);
        break;
      }
    }
    
    if (trpgNavElement) {
      await trpgNavElement.click();
      await page.waitForTimeout(3000);
      console.log('🎮 Navigated to TRPG Session page');
    } else {
      // Try direct navigation
      console.log('🔄 Direct navigation to TRPG Session page...');
      await page.goto('http://localhost:5174/trpg-session', { waitUntil: 'networkidle0' });
      await page.waitForTimeout(3000);
    }
    
    // Look for dice roll UI
    console.log('🎲 Looking for dice roll UI...');
    
    // Take initial screenshot
    await page.screenshot({ 
      path: '/mnt/c/Users/irure/git/AIAgentTRPGGM/apps/frontend/test-results/dice-roll-initial.png',
      fullPage: true
    });
    
    // Look for dice roll sections
    const diceSelectors = [
      'text=ダイスロール',
      '[data-testid="dice-roll"]',
      '.dice-roll',
      'text=D20',
      'text=D6',
      'button[title*="D20"]',
      'button[title*="D6"]'
    ];
    
    console.log('🔍 Searching for dice roll elements...');
    let foundDice = false;
    
    for (const selector of diceSelectors) {
      const elements = await page.$$(selector);
      if (elements.length > 0) {
        console.log(`✅ Found ${elements.length} dice element(s) with selector: ${selector}`);
        foundDice = true;
      }
    }
    
    if (!foundDice) {
      console.log('❌ No dice roll elements found, checking page content...');
      
      // Check what's actually on the page
      const pageText = await page.evaluate(() => document.body.innerText);
      console.log('📄 Page content preview:', pageText.substring(0, 500));
      
      // Look for any buttons
      const buttons = await page.$$('button');
      console.log(`🔘 Found ${buttons.length} buttons on page`);
      
      for (let i = 0; i < Math.min(buttons.length, 10); i++) {
        const buttonText = await buttons[i].evaluate(el => el.textContent?.trim());
        console.log(`  Button ${i + 1}: "${buttonText}"`);
      }
    }
    
    // Try to click dice roll buttons if found
    const diceButtons = [
      'text=D20',
      'text=D6',
      'text=D8',
      'text=D10',
      'text=D12'
    ];
    
    for (const buttonSelector of diceButtons) {
      const button = await page.$(buttonSelector);
      if (button) {
        console.log(`🎲 Found ${buttonSelector} button, clicking...`);
        await button.click();
        await page.waitForTimeout(1000);
        
        // Look for results
        const resultSelectors = [
          '.dice-result',
          '[data-testid="dice-result"]',
          'text=結果',
          'text=Result'
        ];
        
        for (const resultSelector of resultSelectors) {
          const result = await page.$(resultSelector);
          if (result) {
            const resultText = await result.evaluate(el => el.textContent);
            console.log(`✅ Dice result: ${resultText}`);
          }
        }
        
        // Take screenshot after click
        await page.screenshot({ 
          path: `/mnt/c/Users/irure/git/AIAgentTRPGGM/apps/frontend/test-results/dice-roll-after-${buttonSelector.replace('text=', '')}.png`,
          fullPage: true
        });
      }
    }
    
    // Final screenshot
    await page.screenshot({ 
      path: '/mnt/c/Users/irure/git/AIAgentTRPGGM/apps/frontend/test-results/dice-roll-final.png',
      fullPage: true
    });
    
    console.log('🖥️ Keeping browser open for 60 seconds for manual inspection...');
    await page.waitForTimeout(60000);
    
  } catch (error) {
    console.error('❌ Test failed:', error);
    
    // Take error screenshot
    await page.screenshot({ 
      path: '/mnt/c/Users/irure/git/AIAgentTRPGGM/apps/frontend/test-results/dice-roll-error.png',
      fullPage: true
    });
  } finally {
    await browser.close();
  }
}

testDiceRollUI().catch(console.error);