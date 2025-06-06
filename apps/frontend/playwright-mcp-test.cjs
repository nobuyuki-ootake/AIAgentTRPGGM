const { chromium } = require('playwright');

(async () => {
  console.log('🚀 Starting MCP Browser Test for localhost:5173...');
  
  // Launch browser with visual interface
  const browser = await chromium.launch({ 
    headless: false,  // Visual browser mode
    slowMo: 1000      // Slow down for better visibility
  });
  
  const context = await browser.newContext({
    viewport: { width: 1920, height: 1080 }
  });
  
  const page = await context.newPage();
  
  // Navigate to localhost:5173
  console.log('📍 Navigating to http://localhost:5173...');
  await page.goto('http://localhost:5173', { 
    waitUntil: 'networkidle',
    timeout: 30000 
  });
  
  // Wait for the page to load
  await page.waitForTimeout(3000);
  
  // Take screenshot
  await page.screenshot({ 
    path: './test-results/mcp-browser-localhost-5173.png',
    fullPage: true 
  });
  console.log('📸 Screenshot saved: ./test-results/mcp-browser-localhost-5173.png');
  
  // Get page info
  const title = await page.title();
  const url = page.url();
  console.log(`📄 Page Title: ${title}`);
  console.log(`🔗 Current URL: ${url}`);
  
  // Check for React app
  const hasReactRoot = await page.locator('#root').isVisible();
  console.log(`⚛️  React Root Found: ${hasReactRoot}`);
  
  // Get page content preview
  const bodyText = await page.locator('body').innerText();
  console.log('📝 Page Content Preview (first 300 chars):');
  console.log(bodyText.substring(0, 300) + '...');
  
  // Check for console errors
  const consoleErrors = [];
  page.on('console', msg => {
    if (msg.type() === 'error') {
      consoleErrors.push(msg.text());
    }
  });
  
  // Look for developer mode toggle in sidebar bottom
  console.log('🔍 Looking for Developer Mode toggle in sidebar...');
  
  const sidebarSelectors = [
    'aside',
    '[class*="sidebar"]',
    '[class*="Sidebar"]',
    'nav',
    '[role="navigation"]'
  ];
  
  let devModeFound = false;
  for (const sidebarSelector of sidebarSelectors) {
    const sidebar = await page.locator(sidebarSelector).first();
    if (await sidebar.isVisible()) {
      console.log(`📍 Found sidebar with selector: ${sidebarSelector}`);
      
      // Look for developer mode toggle specifically in this sidebar
      const devModeInSidebar = await sidebar.locator('text=開発者モード').first();
      if (await devModeInSidebar.isVisible()) {
        console.log('🎯 Found Developer Mode toggle in sidebar!');
        
        // Setup error listener
        const sidebarToggleErrors = [];
        page.on('console', msg => {
          if (msg.type() === 'error') {
            console.log(`🚨 Console Error: ${msg.text()}`);
            sidebarToggleErrors.push(msg.text());
          }
        });
        
        await devModeInSidebar.click();
        console.log('✅ Developer Mode toggle clicked');
        await page.waitForTimeout(3000);
        
        // Take screenshot after toggle
        await page.screenshot({ 
          path: './test-results/mcp-sidebar-developer-mode.png',
          fullPage: true 
        });
        console.log('📸 Developer Mode activated screenshot saved');
        
        if (sidebarToggleErrors.length > 0) {
          console.log('❌ Errors detected after Developer Mode toggle:');
          sidebarToggleErrors.forEach(error => console.log(`  - ${error}`));
        } else {
          console.log('✅ Developer Mode toggle worked without errors');
        }
        
        devModeFound = true;
        break;
      }
    }
  }
  
  if (!devModeFound) {
    console.log('⚠️  Developer Mode toggle not found in any sidebar');
    
    // Show sidebar contents for debugging
    for (const sidebarSelector of sidebarSelectors) {
      const sidebar = await page.locator(sidebarSelector).first();
      if (await sidebar.isVisible()) {
        const sidebarText = await sidebar.innerText();
        console.log(`📄 Sidebar content (${sidebarSelector}):`);
        console.log(sidebarText);
        console.log('---');
      }
    }
  }
  
  await page.waitForTimeout(2000);
  
  if (consoleErrors.length > 0) {
    console.log('❌ Console Errors Found:');
    consoleErrors.forEach(error => console.log(`  - ${error}`));
  } else {
    console.log('✅ No Console Errors Detected');
  }
  
  // Try to navigate to TRPG Session if possible
  try {
    // Look for TRPG Session navigation more thoroughly
    const trpgSessionSelectors = [
      'text=TRPGセッション',
      'a[href*="trpg-session"]',
      'a[href*="/session"]',
      'text=セッション',
      '*[class*="nav"] >> text=TRPG',
      'nav >> text=セッション'
    ];
    
    let trpgSessionLink = null;
    for (const selector of trpgSessionSelectors) {
      const element = await page.locator(selector).first();
      if (await element.isVisible()) {
        trpgSessionLink = element;
        break;
      }
    }
    
    if (trpgSessionLink && await trpgSessionLink.isVisible()) {
      console.log('🎲 Navigating to TRPG Session page...');
      await trpgSessionLink.click();
      await page.waitForTimeout(3000);
      
      await page.screenshot({ 
        path: './test-results/mcp-trpg-session-5173.png',
        fullPage: true 
      });
      console.log('📸 TRPG Session screenshot saved');
      
      // Look for developer mode toggle more thoroughly
      console.log('🔍 Looking for Developer Mode toggle...');
      
      // Try multiple selectors for developer mode
      const devModeSelectors = [
        'text=開発者モード',
        '[role="switch"]',
        'input[type="checkbox"]',
        '*[class*="switch"]',
        '*[class*="toggle"]'
      ];
      
      let devModeToggle = null;
      for (const selector of devModeSelectors) {
        const elements = await page.locator(selector).all();
        for (const element of elements) {
          const text = await element.textContent();
          if (text && text.includes('開発者')) {
            devModeToggle = element;
            break;
          }
        }
        if (devModeToggle) break;
      }
      
      if (!devModeToggle) {
        // Try finding by nearby text
        devModeToggle = await page.locator('text=開発者モード').first();
      }
      
      if (await devModeToggle.isVisible()) {
        console.log('🔧 Found Developer Mode toggle, clicking...');
        
        // Setup error listener before clicking
        const postToggleErrors = [];
        page.on('console', msg => {
          if (msg.type() === 'error') {
            console.log(`🚨 Console Error: ${msg.text()}`);
            postToggleErrors.push(msg.text());
          }
        });
        
        await devModeToggle.click();
        console.log('✅ Developer Mode toggle clicked');
        await page.waitForTimeout(3000); // Wait longer for any async operations
        
        // Take screenshot after toggle
        await page.screenshot({ 
          path: './test-results/mcp-developer-mode-toggled.png',
          fullPage: true 
        });
        console.log('📸 Developer Mode screenshot saved');
        
        if (postToggleErrors.length > 0) {
          console.log('❌ Errors detected after Developer Mode toggle:');
          postToggleErrors.forEach(error => console.log(`  - ${error}`));
        } else {
          console.log('✅ Developer Mode toggle worked without errors');
        }
      } else {
        console.log('⚠️  Developer Mode toggle not found or not visible');
        
        // Show all visible text to help debug
        const allText = await page.locator('body').innerText();
        console.log('📄 All visible text (for debugging):');
        console.log(allText);
        
        // Also show all interactive elements
        const buttons = await page.locator('button').all();
        console.log(`\n🔘 Found ${buttons.length} buttons on page:`);
        for (let i = 0; i < Math.min(buttons.length, 10); i++) {
          const buttonText = await buttons[i].textContent();
          console.log(`  Button ${i}: "${buttonText}"`);
        }
        
        const switches = await page.locator('[role="switch"], input[type="checkbox"]').all();
        console.log(`\n🔄 Found ${switches.length} switches/checkboxes on page:`);
        for (let i = 0; i < switches.length; i++) {
          const switchText = await switches[i].textContent();
          console.log(`  Switch ${i}: "${switchText}"`);
        }
      }
    } else {
      console.log('⚠️  Could not find or navigate to TRPG Session page');
      
      // Show what navigation options are available
      const navElements = await page.locator('a, button').all();
      console.log(`\n🧭 Available navigation elements (${navElements.length} total):`);
      for (let i = 0; i < Math.min(navElements.length, 15); i++) {
        const text = await navElements[i].textContent();
        const href = await navElements[i].getAttribute('href');
        console.log(`  Nav ${i}: "${text}" ${href ? `(href: ${href})` : ''}`);
      }
    }
  } catch (e) {
    console.log('⚠️  Could not navigate to TRPG Session page:', e.message);
  }
  
  console.log('✨ MCP Browser Test Completed Successfully');
  console.log('🖥️  Browser will remain open for manual inspection...');
  
  // Keep browser open for manual inspection for 30 seconds
  console.log('⏰ Keeping browser open for 30 seconds for manual inspection...');
  await page.waitForTimeout(30000);
  
  await browser.close();
})();