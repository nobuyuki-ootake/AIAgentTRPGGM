const { chromium } = require('playwright');

(async () => {
  console.log('Launching browser for TRPG Session debugging...');
  const browser = await chromium.launch({ 
    headless: false,
    args: ['--no-sandbox', '--disable-setuid-sandbox'],
    devtools: true
  });
  
  const context = await browser.newContext({
    viewport: { width: 1920, height: 1080 }
  });
  
  const page = await context.newPage();
  
  // Capture all console messages
  const consoleMessages = [];
  page.on('console', msg => {
    const text = msg.text();
    const type = msg.type();
    consoleMessages.push({ type, text });
    console.log(`[${type}] ${text}`);
  });
  
  // Capture page errors
  page.on('pageerror', error => {
    console.error('Page error:', error.message);
  });
  
  // Capture network errors
  page.on('requestfailed', request => {
    console.error('Request failed:', request.url(), request.failure().errorText);
  });
  
  try {
    console.log('\n1. Navigating to localhost:5173...');
    await page.goto('http://localhost:5173', { waitUntil: 'networkidle' });
    await page.waitForTimeout(2000);
    
    console.log('\n2. Enabling developer mode...');
    const switchInput = await page.locator('.MuiSwitch-root input[type="checkbox"]');
    if (await switchInput.count() > 0) {
      const isChecked = await switchInput.isChecked();
      if (!isChecked) {
        await switchInput.click({ force: true });
        console.log('Developer mode enabled');
      } else {
        console.log('Developer mode already enabled');
      }
    }
    
    await page.waitForTimeout(1000);
    
    console.log('\n3. Creating test campaign data...');
    // Inject test campaign data into localStorage
    await page.evaluate(() => {
      const testCampaign = {
        id: 'test-campaign-1',
        title: 'Test Campaign',
        gameSystem: 'D&D 5e',
        description: 'Test campaign for debugging',
        playerCharacters: [
          {
            id: 'pc1',
            name: 'Test Hero',
            race: 'Human',
            characterClass: 'Fighter',
            level: 1,
            maxHp: 10,
            currentHp: 10,
            maxMp: 5,
            currentMp: 5,
            attributes: {
              strength: 15,
              dexterity: 12,
              constitution: 14,
              intelligence: 10,
              wisdom: 12,
              charisma: 10
            },
            skills: [],
            equipment: [],
            spells: [],
            notes: ''
          }
        ],
        npcs: [],
        enemies: [],
        worldElements: {},
        timeline: [],
        sessions: []
      };
      
      // Store campaign
      localStorage.setItem('currentCampaignId', testCampaign.id);
      localStorage.setItem('campaigns', JSON.stringify([testCampaign]));
      localStorage.setItem('currentCampaign', JSON.stringify(testCampaign));
      
      console.log('Test campaign data injected');
    });
    
    // Refresh to load the data
    await page.reload({ waitUntil: 'networkidle' });
    await page.waitForTimeout(2000);
    
    console.log('\n4. Navigating to TRPG Session page...');
    // Try clicking the menu item
    const sessionLink = await page.locator('text=TRPGセッション').first();
    if (await sessionLink.isVisible()) {
      await sessionLink.click();
      console.log('Clicked TRPG Session link');
    } else {
      // Direct navigation
      await page.goto('http://localhost:5173/trpg-session', { waitUntil: 'networkidle' });
      console.log('Navigated directly to TRPG Session');
    }
    
    await page.waitForTimeout(3000);
    
    console.log('\n5. Analyzing page content...');
    
    // Check for any visible text
    const visibleText = await page.evaluate(() => {
      const body = document.body;
      return body.innerText || body.textContent || '';
    });
    
    console.log('Page text length:', visibleText.length);
    if (visibleText.length > 0) {
      console.log('First 500 chars of page text:');
      console.log(visibleText.substring(0, 500));
    } else {
      console.log('Page appears to be empty');
    }
    
    // Check for specific elements
    const elements = [
      { selector: 'h4:has-text("TRPGセッション")', name: 'TRPG Session Title' },
      { selector: 'text=セッション情報', name: 'Session Info' },
      { selector: 'text=パーティメンバー', name: 'Party Members' },
      { selector: 'text=テストボタン', name: 'Test Button' },
      { selector: '.MuiPaper-root', name: 'Paper Components' },
      { selector: '.MuiGrid-root', name: 'Grid Components' },
      { selector: '[class*="error"]', name: 'Error Elements' },
      { selector: 'text=エラー', name: 'Error Text' }
    ];
    
    console.log('\n6. Checking for specific elements:');
    for (const { selector, name } of elements) {
      const count = await page.locator(selector).count();
      console.log(`${name}: ${count} found`);
      if (count > 0 && name.includes('Error')) {
        const errorText = await page.locator(selector).first().textContent();
        console.log(`  Error content: ${errorText}`);
      }
    }
    
    // Check React component tree
    console.log('\n7. Checking React state...');
    const reactInfo = await page.evaluate(() => {
      const root = document.getElementById('root');
      if (!root) return 'No root element found';
      
      // Try to find React fiber
      const reactFiberKey = Object.keys(root).find(key => key.startsWith('__react'));
      if (!reactFiberKey) return 'No React fiber found';
      
      return 'React app is mounted';
    });
    console.log(reactInfo);
    
    // Take screenshots
    console.log('\n8. Taking screenshots...');
    await page.screenshot({ path: 'test-results/trpg-session-debug-full.png', fullPage: true });
    console.log('Full page screenshot saved');
    
    // Take a screenshot of just the main content area
    const mainContent = await page.locator('#root > div').first();
    if (await mainContent.isVisible()) {
      await mainContent.screenshot({ path: 'test-results/trpg-session-debug-content.png' });
      console.log('Content area screenshot saved');
    }
    
    // Summary
    console.log('\n=== Debug Summary ===');
    console.log(`Total console messages: ${consoleMessages.length}`);
    const errors = consoleMessages.filter(m => m.type === 'error');
    const warnings = consoleMessages.filter(m => m.type === 'warning');
    console.log(`Errors: ${errors.length}, Warnings: ${warnings.length}`);
    
    if (errors.length > 0) {
      console.log('\nError details:');
      errors.forEach((err, i) => console.log(`${i + 1}. ${err.text}`));
    }
    
    console.log('\nBrowser remains open with DevTools.');
    console.log('Check the Console and React DevTools for more information.');
    console.log('Press Ctrl+C to close.');
    
    await new Promise(() => {});
    
  } catch (error) {
    console.error('Test error:', error);
    await page.screenshot({ path: 'test-results/trpg-session-error.png' });
  }
})();