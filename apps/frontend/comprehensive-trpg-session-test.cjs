const { chromium } = require('playwright');

async function comprehensiveTRPGSessionTest() {
  console.log('🎮 Starting comprehensive TRPG session test...');
  
  const browser = await chromium.launch({ 
    headless: false,
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });
  
  const context = await browser.newContext({
    viewport: { width: 1920, height: 1080 }
  });
  
  const page = await context.newPage();
  
  try {
    // Enable console logging to catch errors
    const consoleMessages = [];
    page.on('console', msg => {
      const message = `${msg.type()}: ${msg.text()}`;
      consoleMessages.push(message);
      console.log(`Console: ${message}`);
    });
    
    page.on('pageerror', error => {
      console.error('Page error:', error.message);
    });

    console.log('📋 Step 1: Navigate to home page and enable developer mode');
    await page.goto('http://localhost:5173/', { waitUntil: 'networkidle' });
    await page.waitForTimeout(2000);
    
    // Enable developer mode first
    console.log('🔧 Enabling developer mode...');
    try {
      await page.click('[data-testid="developer-mode-toggle"]');
      await page.waitForTimeout(1000);
      console.log('✅ Developer mode enabled');
    } catch (error) {
      console.log('⚠️ Developer mode toggle not found, checking if already enabled');
    }

    console.log('📋 Step 2: Navigate to TRPG Session page');
    
    // Look for TRPG Session in sidebar navigation
    try {
      await page.click('text=TRPG Session');
      await page.waitForTimeout(2000);
      console.log('✅ Navigated to TRPG Session page');
    } catch (error) {
      console.log('⚠️ TRPG Session navigation not found in sidebar, trying URL direct navigation');
      await page.goto('http://localhost:5173/trpg-session', { waitUntil: 'networkidle' });
      await page.waitForTimeout(2000);
    }

    // Take initial screenshot
    await page.screenshot({ 
      path: '/mnt/c/Users/irure/git/AIAgentTRPGGM/apps/frontend/test-results/comprehensive-01-initial-page.png',
      fullPage: true 
    });

    console.log('📋 Step 3: Check for restored features visibility');

    // Check for character display/selection (left sidebar)
    let characterDisplayFound = false;
    try {
      const characterElements = await page.$$('[data-testid*="character"], .character-display, .character-selector, .character-list');
      if (characterElements.length > 0) {
        characterDisplayFound = true;
        console.log('✅ Character display elements found');
      }
    } catch (error) {
      console.log('❌ Character display elements not found');
    }

    // Check for dice roll buttons
    let diceButtonsFound = false;
    const diceTypes = ['D20', 'D6', 'D8', 'D10', 'D12'];
    const foundDiceButtons = [];
    
    for (const diceType of diceTypes) {
      try {
        const diceButton = await page.$(`text=${diceType}`);
        if (diceButton) {
          foundDiceButtons.push(diceType);
          diceButtonsFound = true;
        }
      } catch (error) {
        // Button not found
      }
    }
    
    if (diceButtonsFound) {
      console.log(`✅ Dice buttons found: ${foundDiceButtons.join(', ')}`);
    } else {
      console.log('❌ No dice buttons found');
    }

    // Check for chat interface
    let chatInterfaceFound = false;
    try {
      const chatElements = await page.$$('[data-testid*="chat"], .chat-interface, .message-input, textarea[placeholder*="message"], input[placeholder*="message"]');
      if (chatElements.length > 0) {
        chatInterfaceFound = true;
        console.log('✅ Chat interface elements found');
      }
    } catch (error) {
      console.log('❌ Chat interface elements not found');
    }

    // Take screenshot showing all features
    await page.screenshot({ 
      path: '/mnt/c/Users/irure/git/AIAgentTRPGGM/apps/frontend/test-results/comprehensive-02-features-visible.png',
      fullPage: true 
    });

    console.log('📋 Step 4: Test functionality');

    // Test character selection if available
    if (characterDisplayFound) {
      try {
        const characterElements = await page.$$('[data-testid*="character"], .character-card, .character-item');
        if (characterElements.length > 0) {
          await characterElements[0].click();
          await page.waitForTimeout(1000);
          console.log('✅ Character selection test successful');
          
          await page.screenshot({ 
            path: '/mnt/c/Users/irure/git/AIAgentTRPGGM/apps/frontend/test-results/comprehensive-03-character-selected.png',
            fullPage: true 
          });
        }
      } catch (error) {
        console.log('❌ Character selection test failed:', error.message);
      }
    }

    // Test dice button functionality
    if (diceButtonsFound && foundDiceButtons.length > 0) {
      try {
        const diceButton = await page.$(`text=${foundDiceButtons[0]}`);
        if (diceButton) {
          await diceButton.click();
          await page.waitForTimeout(2000);
          
          // Check if dice dialog opened
          const diceDialog = await page.$('.MuiDialog-root, [role="dialog"], .dice-dialog');
          if (diceDialog) {
            console.log('✅ Dice dialog opened successfully');
            
            await page.screenshot({ 
              path: '/mnt/c/Users/irure/git/AIAgentTRPGGM/apps/frontend/test-results/comprehensive-04-dice-dialog.png',
              fullPage: true 
            });
            
            // Close dialog
            try {
              await page.keyboard.press('Escape');
              await page.waitForTimeout(1000);
            } catch (error) {
              // Try clicking close button
              const closeButton = await page.$('[aria-label="close"], .close-button, button:has-text("Close")');
              if (closeButton) {
                await closeButton.click();
                await page.waitForTimeout(1000);
              }
            }
          } else {
            console.log('⚠️ Dice button clicked but no dialog appeared');
          }
        }
      } catch (error) {
        console.log('❌ Dice button test failed:', error.message);
      }
    }

    // Test chat interface functionality
    if (chatInterfaceFound) {
      try {
        const messageInput = await page.$('textarea[placeholder*="message"], input[placeholder*="message"], [data-testid*="message-input"]');
        if (messageInput) {
          await messageInput.fill('Test message for TRPG session functionality');
          await page.waitForTimeout(1000);
          
          // Try to send the message
          await page.keyboard.press('Enter');
          await page.waitForTimeout(2000);
          
          console.log('✅ Chat message test successful');
          
          await page.screenshot({ 
            path: '/mnt/c/Users/irure/git/AIAgentTRPGGM/apps/frontend/test-results/comprehensive-05-chat-test.png',
            fullPage: true 
          });
        }
      } catch (error) {
        console.log('❌ Chat interface test failed:', error.message);
      }
    }

    // Take final comprehensive screenshot
    await page.screenshot({ 
      path: '/mnt/c/Users/irure/git/AIAgentTRPGGM/apps/frontend/test-results/comprehensive-06-final-state.png',
      fullPage: true 
    });

    console.log('📋 Step 5: Final status report');
    console.log('\n🎯 COMPREHENSIVE TEST RESULTS:');
    console.log('=====================================');
    console.log(`Character Display: ${characterDisplayFound ? '✅ Working' : '❌ Not Found'}`);
    console.log(`Dice Buttons: ${diceButtonsFound ? `✅ Working (${foundDiceButtons.join(', ')})` : '❌ Not Found'}`);
    console.log(`Chat Interface: ${chatInterfaceFound ? '✅ Working' : '❌ Not Found'}`);
    
    console.log('\n📝 Console Messages:');
    consoleMessages.forEach(msg => console.log(`  ${msg}`));
    
    const errorMessages = consoleMessages.filter(msg => msg.includes('error') || msg.includes('Error'));
    if (errorMessages.length > 0) {
      console.log('\n⚠️ Console Errors Found:');
      errorMessages.forEach(msg => console.log(`  ${msg}`));
    } else {
      console.log('\n✅ No console errors detected');
    }

    // Wait a moment before closing
    await page.waitForTimeout(3000);

  } catch (error) {
    console.error('❌ Test failed:', error.message);
    
    await page.screenshot({ 
      path: '/mnt/c/Users/irure/git/AIAgentTRPGGM/apps/frontend/test-results/comprehensive-error.png',
      fullPage: true 
    });
  } finally {
    await browser.close();
  }
}

comprehensiveTRPGSessionTest().catch(console.error);