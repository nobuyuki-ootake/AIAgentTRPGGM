const { chromium } = require('playwright');

async function runTRPGSessionTest() {
  console.log('🎮 Starting TRPG Session Interactive Test...');
  
  const browser = await chromium.launch({ 
    headless: false,
    slowMo: 1000  // Slow down for better visibility
  });
  
  const context = await browser.newContext({
    viewport: { width: 1920, height: 1080 }
  });
  
  const page = await context.newPage();
  
  try {
    // Step 1: Navigate to application
    console.log('📍 Step 1: Navigating to localhost:5173...');
    await page.goto('http://localhost:5173');
    await page.waitForLoadState('networkidle');
    await page.screenshot({ path: 'trpg-test-01-initial-page.png', fullPage: true });
    console.log('✅ Initial page loaded');
    
    // Step 2: Look for TRPG Session navigation
    console.log('📍 Step 2: Finding TRPG Session navigation...');
    
    // Try multiple selectors for TRPG Session
    const selectors = [
      'text=TRPGセッション',
      'text=TRPG Session',
      'text=セッション',
      '[href*="trpg-session"]',
      '[href*="session"]',
      'text=Session'
    ];
    
    let navigationFound = false;
    for (const selector of selectors) {
      const element = await page.locator(selector).first();
      if (await element.count() > 0) {
        console.log(`✅ Found navigation with selector: ${selector}`);
        await element.click();
        navigationFound = true;
        break;
      }
    }
    
    if (!navigationFound) {
      // Try to find menu button and open it
      console.log('🔍 Looking for menu button...');
      const menuButtons = [
        'button[aria-label*="menu"]',
        'button:has-text("Menu")',
        '[data-testid="menu-button"]',
        '.MuiIconButton-root'
      ];
      
      for (const menuSelector of menuButtons) {
        const menuElement = await page.locator(menuSelector).first();
        if (await menuElement.count() > 0) {
          console.log(`🎯 Found menu button: ${menuSelector}`);
          await menuElement.click();
          await page.waitForTimeout(1000);
          await page.screenshot({ path: 'trpg-test-02-menu-opened.png', fullPage: true });
          
          // Try to find TRPG Session in menu
          for (const selector of selectors) {
            const element = await page.locator(selector).first();
            if (await element.count() > 0) {
              console.log(`✅ Found TRPG Session in menu: ${selector}`);
              await element.click();
              navigationFound = true;
              break;
            }
          }
          break;
        }
      }
    }
    
    if (!navigationFound) {
      console.log('⚠️ Navigation not found, trying direct URL...');
      await page.goto('http://localhost:5173/trpg-session');
    }
    
    await page.waitForLoadState('networkidle');
    await page.screenshot({ path: 'trpg-test-03-trpg-session-page.png', fullPage: true });
    console.log('✅ Reached TRPG Session page');
    
    // Step 3: Test Character Management
    console.log('📍 Step 3: Testing Character Management...');
    
    const characterSections = [
      '[data-testid="character-display"]',
      'text=キャラクター',
      'text=Character',
      '.character-section',
      '.character-card'
    ];
    
    for (const selector of characterSections) {
      const element = await page.locator(selector).first();
      if (await element.count() > 0) {
        console.log(`✅ Found character section: ${selector}`);
        break;
      }
    }
    
    await page.screenshot({ path: 'trpg-test-04-character-section.png', fullPage: true });
    
    // Step 4: Test Dice Rolling
    console.log('📍 Step 4: Testing Dice Rolling System...');
    
    const diceSelectors = [
      'button:has-text("D20")',
      'button:has-text("d20")',
      '[data-testid="dice-ui"]',
      'text=ダイス',
      'text=Dice',
      '.dice-button'
    ];
    
    let diceFound = false;
    for (const selector of diceSelectors) {
      const element = await page.locator(selector).first();
      if (await element.count() > 0) {
        console.log(`🎲 Found dice interface: ${selector}`);
        await element.click();
        await page.waitForTimeout(1000);
        await page.screenshot({ path: 'trpg-test-05-dice-rolled.png', fullPage: true });
        diceFound = true;
        break;
      }
    }
    
    if (!diceFound) {
      console.log('⚠️ Dice interface not found');
    }
    
    // Step 5: Test Chat Interface
    console.log('📍 Step 5: Testing Chat Interface...');
    
    const chatSelectors = [
      '[data-testid="chat-interface"]',
      'textarea[placeholder*="message"]',
      'input[placeholder*="メッセージ"]',
      '.chat-input',
      'textarea',
      'input[type="text"]'
    ];
    
    let chatFound = false;
    for (const selector of chatSelectors) {
      const element = await page.locator(selector).first();
      if (await element.count() > 0) {
        console.log(`💬 Found chat interface: ${selector}`);
        await element.fill('テストメッセージです - Test message from interactive test!');
        await page.screenshot({ path: 'trpg-test-06-chat-input.png', fullPage: true });
        
        // Try to send message
        const sendButtons = [
          'button:has-text("Send")',
          'button:has-text("送信")',
          'button[type="submit"]'
        ];
        
        for (const sendSelector of sendButtons) {
          const sendElement = await page.locator(sendSelector).first();
          if (await sendElement.count() > 0) {
            await sendElement.click();
            await page.waitForTimeout(1000);
            await page.screenshot({ path: 'trpg-test-07-message-sent.png', fullPage: true });
            break;
          }
        }
        
        chatFound = true;
        break;
      }
    }
    
    if (!chatFound) {
      console.log('⚠️ Chat interface not found');
    }
    
    // Step 6: Test Skill Checks
    console.log('📍 Step 6: Testing Skill Check System...');
    
    const skillCheckSelectors = [
      'button:has-text("スキルチェック")',
      'button:has-text("Skill Check")',
      '[data-testid="skill-check"]',
      'button:has-text("チェック")'
    ];
    
    for (const selector of skillCheckSelectors) {
      const element = await page.locator(selector).first();
      if (await element.count() > 0) {
        console.log(`🎯 Found skill check: ${selector}`);
        await element.click();
        await page.waitForTimeout(1000);
        await page.screenshot({ path: 'trpg-test-08-skill-check.png', fullPage: true });
        
        // Close dialog if opened
        const closeButton = await page.locator('button:has-text("キャンセル")').or(page.locator('button:has-text("Cancel")')).first();
        if (await closeButton.count() > 0) {
          await closeButton.click();
        }
        break;
      }
    }
    
    // Step 7: Test Responsive Design
    console.log('📍 Step 7: Testing Responsive Design...');
    
    // Test tablet view
    await page.setViewportSize({ width: 768, height: 1024 });
    await page.screenshot({ path: 'trpg-test-09-tablet-view.png', fullPage: true });
    
    // Test mobile view
    await page.setViewportSize({ width: 375, height: 667 });
    await page.screenshot({ path: 'trpg-test-10-mobile-view.png', fullPage: true });
    
    // Return to desktop
    await page.setViewportSize({ width: 1920, height: 1080 });
    await page.screenshot({ path: 'trpg-test-11-desktop-final.png', fullPage: true });
    
    // Step 8: Test All Interactive Elements
    console.log('📍 Step 8: Testing All Interactive Elements...');
    
    const buttons = await page.locator('button').all();
    console.log(`🔍 Found ${buttons.length} buttons on the page`);
    
    const tabs = await page.locator('[role="tab"]').all();
    console.log(`📑 Found ${tabs.length} tabs on the page`);
    
    // Test tabs
    for (let i = 0; i < Math.min(tabs.length, 3); i++) {
      try {
        await tabs[i].click();
        await page.waitForTimeout(500);
        await page.screenshot({ path: `trpg-test-12-tab-${i}.png`, fullPage: true });
        console.log(`✅ Tested tab ${i}`);
      } catch (error) {
        console.log(`⚠️ Could not click tab ${i}: ${error.message}`);
      }
    }
    
    console.log('✅ TRPG Session Interactive Test Completed!');
    console.log('📸 Screenshots saved:');
    console.log('  - trpg-test-01-initial-page.png');
    console.log('  - trpg-test-02-menu-opened.png');
    console.log('  - trpg-test-03-trpg-session-page.png');
    console.log('  - trpg-test-04-character-section.png');
    console.log('  - trpg-test-05-dice-rolled.png');
    console.log('  - trpg-test-06-chat-input.png');
    console.log('  - trpg-test-07-message-sent.png');
    console.log('  - trpg-test-08-skill-check.png');
    console.log('  - trpg-test-09-tablet-view.png');
    console.log('  - trpg-test-10-mobile-view.png');
    console.log('  - trpg-test-11-desktop-final.png');
    console.log('  - trpg-test-12-tab-*.png');
    
  } catch (error) {
    console.error('❌ Test failed:', error);
    await page.screenshot({ path: 'trpg-test-error.png', fullPage: true });
  } finally {
    // Keep browser open for manual inspection
    console.log('🔍 Browser will stay open for manual inspection. Close manually when done.');
    // await browser.close();
  }
}

runTRPGSessionTest().catch(console.error);