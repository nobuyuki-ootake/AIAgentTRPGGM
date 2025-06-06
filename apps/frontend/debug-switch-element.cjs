const { chromium } = require('playwright');

(async () => {
  console.log('🔍 Debugging Switch Element Structure...');
  
  const browser = await chromium.launch({ 
    headless: false,
    slowMo: 2000
  });
  
  const context = await browser.newContext({
    viewport: { width: 1920, height: 1080 }
  });
  
  const page = await context.newPage();
  
  try {
    await page.goto('http://localhost:5173', { 
      waitUntil: 'networkidle',
      timeout: 30000 
    });
    
    await page.waitForTimeout(2000);
    
    // Take screenshot
    await page.screenshot({ 
      path: './test-results/debug-switch.png',
      fullPage: true 
    });
    
    // Look for elements containing "開発者モード"
    console.log('🔍 Looking for elements containing "開発者モード"...');
    const devModeElements = await page.locator('*:has-text("開発者モード")').all();
    console.log(`Found ${devModeElements.length} elements with "開発者モード" text`);
    
    // Look for Switch-related classes
    console.log('\n🔍 Looking for MUI Switch elements...');
    const switchSelectors = [
      '.MuiSwitch-root',
      '.MuiSwitch-input', 
      '[class*="MuiSwitch"]',
      'input[type="checkbox"]',
      '[role="switch"]'
    ];
    
    for (const selector of switchSelectors) {
      const elements = await page.locator(selector).all();
      console.log(`${selector}: ${elements.length} elements found`);
      
      for (let i = 0; i < elements.length; i++) {
        const element = elements[i];
        const id = await element.getAttribute('id') || 'no-id';
        const className = await element.getAttribute('class') || 'no-class';
        const tagName = await element.evaluate(el => el.tagName);
        console.log(`  ${i + 1}. <${tagName}> id="${id}" class="${className}"`);
        
        // Check if this element is near "開発者モード" text
        try {
          const parentText = await element.locator('..').textContent();
          if (parentText && parentText.includes('開発者モード')) {
            console.log(`    ✅ This element is related to developer mode!`);
            console.log(`    Parent text: "${parentText}"`);
          }
        } catch (e) {
          // Skip if parent check fails
        }
      }
    }
    
    // Debug: Show all input elements
    console.log('\n🔍 All input elements:');
    const inputs = await page.locator('input').all();
    for (let i = 0; i < inputs.length; i++) {
      const input = inputs[i];
      const id = await input.getAttribute('id') || 'no-id';
      const type = await input.getAttribute('type') || 'no-type';
      const ariaLabel = await input.getAttribute('aria-label') || 'no-aria-label';
      console.log(`  ${i + 1}. <input> type="${type}" id="${id}" aria-label="${ariaLabel}"`);
    }
    
    // Try to find by aria-label
    console.log('\n🔍 Looking for element with aria-label="developer mode toggle"...');
    const ariaLabelElement = await page.locator('[aria-label="developer mode toggle"]').first();
    if (await ariaLabelElement.isVisible()) {
      console.log('✅ Found element with aria-label!');
      const tagName = await ariaLabelElement.evaluate(el => el.tagName);
      const id = await ariaLabelElement.getAttribute('id') || 'no-id';
      console.log(`  <${tagName}> id="${id}"`);
    } else {
      console.log('❌ Element with aria-label not found');
    }
    
  } catch (error) {
    console.log(`💥 Error: ${error.message}`);
  }
  
  console.log('\n⏰ Keeping browser open for 30 seconds...');
  await page.waitForTimeout(30000);
  
  await browser.close();
})();