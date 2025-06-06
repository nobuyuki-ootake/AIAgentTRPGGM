import { test, expect } from '@playwright/test';

test.describe('Dice Roll UI Testing', () => {
  test('should test dice roll functionality in TRPG session', async ({ page }) => {
    console.log('🎲 Testing Dice Roll UI...');
    
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
    
    // Navigate to home page
    await page.goto('/', { waitUntil: 'networkidle' });
    console.log('✅ Page loaded');
    
    // Enable developer mode first
    console.log('🔧 Looking for developer mode toggle...');
    
    const devModeSelector = '[data-testid="developer-mode-switch"]';
    const devModeElement = page.locator(devModeSelector);
    
    if (await devModeElement.count() > 0) {
      console.log('🎯 Found developer mode switch, clicking...');
      await devModeElement.click();
      await page.waitForTimeout(1000);
      console.log('✅ Developer mode enabled');
    } else {
      console.log('⚠️ Developer mode switch not found, checking if already enabled');
    }
    
    // Navigate to TRPG Session page
    console.log('🎮 Looking for TRPG Session navigation...');
    
    // Try to find and click TRPG Session navigation
    const trpgNav = page.getByText('TRPGセッション');
    if (await trpgNav.count() > 0) {
      await trpgNav.click();
      await page.waitForTimeout(3000);
      console.log('🎮 Navigated to TRPG Session page');
    } else {
      // Try direct navigation
      console.log('🔄 Direct navigation to TRPG Session page...');
      await page.goto('/trpg-session', { waitUntil: 'networkidle' });
      await page.waitForTimeout(3000);
    }
    
    // Take initial screenshot
    await page.screenshot({ 
      path: 'test-results/dice-roll-initial.png',
      fullPage: true
    });
    
    // Scroll down to check if dice UI is below the fold
    console.log('📜 Scrolling to check for dice UI...');
    await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
    await page.waitForTimeout(1000);
    
    // Take screenshot after scrolling
    await page.screenshot({ 
      path: 'test-results/dice-roll-after-scroll.png',
      fullPage: true
    });
    
    // Look for dice roll UI elements
    console.log('🎲 Looking for dice roll UI...');
    
    // Check for dice roll section header
    const diceRollHeader = page.getByText('ダイスロール');
    if (await diceRollHeader.count() > 0) {
      console.log('✅ Found "ダイスロール" header');
    }
    
    // Look for specific dice buttons
    const diceButtons = ['D20', 'D6', 'D8', 'D10', 'D12'];
    let foundDiceButtons = [];
    
    for (const dice of diceButtons) {
      const button = page.getByText(dice, { exact: true });
      if (await button.count() > 0) {
        foundDiceButtons.push(dice);
        console.log(`✅ Found ${dice} button`);
      }
    }
    
    console.log(`🎲 Found ${foundDiceButtons.length} dice buttons: ${foundDiceButtons.join(', ')}`);
    
    // If no specific dice buttons found, look for any buttons containing dice-related text
    if (foundDiceButtons.length === 0) {
      console.log('🔍 Looking for any dice-related buttons...');
      
      const allButtons = page.locator('button');
      const buttonCount = await allButtons.count();
      console.log(`🔘 Found ${buttonCount} total buttons`);
      
      for (let i = 0; i < Math.min(buttonCount, 20); i++) {
        const buttonText = await allButtons.nth(i).textContent();
        if (buttonText) {
          console.log(`  Button ${i + 1}: "${buttonText.trim()}"`);
          
          // Check if button text contains dice-related terms
          if (buttonText.includes('D') || buttonText.includes('ダイス') || buttonText.includes('dice')) {
            console.log(`    ⭐ This looks like a dice button!`);
          }
        }
      }
    }
    
    // Try to test dice rolling if buttons are found
    if (foundDiceButtons.length > 0) {
      console.log('🎲 Testing dice roll functionality...');
      
      for (const dice of foundDiceButtons.slice(0, 3)) { // Test first 3 dice types
        console.log(`🎲 Testing ${dice} roll...`);
        
        const button = page.getByText(dice, { exact: true });
        await button.click();
        await page.waitForTimeout(1000);
        
        // Look for dice result display
        const resultSelectors = [
          '[data-testid="dice-result"]',
          '.dice-result',
          'text=結果',
          'text=Result:'
        ];
        
        for (const selector of resultSelectors) {
          const result = page.locator(selector);
          if (await result.count() > 0) {
            const resultText = await result.textContent();
            console.log(`✅ ${dice} result found: ${resultText}`);
          }
        }
        
        // Take screenshot after each dice roll
        await page.screenshot({ 
          path: `test-results/dice-roll-after-${dice}.png`,
          fullPage: true
        });
      }
    } else {
      console.log('❌ No dice buttons found to test');
      
      // Get page content for debugging
      const pageContent = await page.locator('body').textContent();
      console.log('📄 Page content preview:', pageContent?.substring(0, 800));
    }
    
    // Check for any dice-related errors in console
    const errors = [];
    page.on('pageerror', (error) => {
      errors.push(error.message);
      console.log(`❌ Page Error: ${error.message}`);
    });
    
    // Final screenshot
    await page.screenshot({ 
      path: 'test-results/dice-roll-final.png',
      fullPage: true
    });
    
    // Report findings
    console.log('\n📊 Dice Roll UI Test Summary:');
    console.log(`   - Dice buttons found: ${foundDiceButtons.length}`);
    console.log(`   - Button types: ${foundDiceButtons.join(', ')}`);
    console.log(`   - Page errors: ${errors.length}`);
    
    if (errors.length > 0) {
      console.log('❌ Errors found:');
      errors.forEach(error => console.log(`   - ${error}`));
    }
    
    // Keep browser open for manual inspection
    console.log('🖥️ Test completed - check screenshots for visual verification');
  });
});