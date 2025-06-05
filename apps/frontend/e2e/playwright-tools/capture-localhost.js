import { chromium } from 'playwright';
import fs from 'fs';
import path from 'path';

(async () => {
  console.log('Starting headless browser to capture localhost:5173...');
  
  // Ensure test-results directory exists
  const testResultsDir = './test-results';
  if (!fs.existsSync(testResultsDir)) {
    fs.mkdirSync(testResultsDir, { recursive: true });
  }
  
  const browser = await chromium.launch({
    headless: true // Use headless mode due to WSL limitations
  });
  
  try {
    const context = await browser.newContext({
      viewport: { width: 1280, height: 720 }
    });
    
    const page = await context.newPage();
    
    // Add console log listener
    page.on('console', msg => {
      console.log(`Browser console [${msg.type()}]:`, msg.text());
    });
    
    // Navigate to the application
    console.log('Navigating to http://localhost:5173...');
    const response = await page.goto('http://localhost:5173', {
      waitUntil: 'networkidle',
      timeout: 30000
    });
    
    console.log(`Page loaded with status: ${response?.status()}`);
    
    // Wait for React to load
    await page.waitForSelector('#root', { timeout: 10000 });
    console.log('✓ React root element found');
    
    // Wait a bit more for content to render
    await page.waitForTimeout(3000);
    
    // Capture screenshots at different viewport sizes
    const viewports = [
      { name: 'desktop', width: 1280, height: 720 },
      { name: 'tablet', width: 768, height: 1024 },
      { name: 'mobile', width: 375, height: 667 }
    ];
    
    for (const viewport of viewports) {
      await page.setViewportSize(viewport);
      await page.waitForTimeout(500); // Wait for responsive adjustments
      
      const screenshotPath = path.join(testResultsDir, `localhost-${viewport.name}.png`);
      await page.screenshot({ 
        path: screenshotPath,
        fullPage: true 
      });
      console.log(`✓ ${viewport.name} screenshot saved: ${screenshotPath}`);
    }
    
    // Get page information
    const title = await page.title();
    console.log(`\nPage title: ${title}`);
    
    // Extract visible text
    const bodyText = await page.evaluate(() => {
      const body = document.body;
      return body ? body.innerText : 'No body content';
    });
    
    console.log('\nVisible text content (first 500 chars):');
    console.log(bodyText.substring(0, 500));
    
    // Check for key UI elements
    const uiElements = await page.evaluate(() => {
      const elements = {
        sidebar: !!document.querySelector('[class*="sidebar"], [class*="Sidebar"], aside'),
        mainContent: !!document.querySelector('main'),
        navigation: !!document.querySelector('nav'),
        buttons: document.querySelectorAll('button').length,
        links: document.querySelectorAll('a').length,
        inputs: document.querySelectorAll('input, textarea, select').length,
        headers: document.querySelectorAll('h1, h2, h3, h4, h5, h6').length
      };
      
      // Get all visible headers
      const headers = Array.from(document.querySelectorAll('h1, h2, h3, h4, h5, h6'))
        .map(h => ({ tag: h.tagName, text: h.innerText }))
        .slice(0, 5);
      
      return { ...elements, headerTexts: headers };
    });
    
    console.log('\nUI Elements Analysis:');
    console.log(`- Sidebar present: ${uiElements.sidebar}`);
    console.log(`- Main content area: ${uiElements.mainContent}`);
    console.log(`- Navigation present: ${uiElements.navigation}`);
    console.log(`- Buttons found: ${uiElements.buttons}`);
    console.log(`- Links found: ${uiElements.links}`);
    console.log(`- Input fields: ${uiElements.inputs}`);
    console.log(`- Headers found: ${uiElements.headers}`);
    
    if (uiElements.headerTexts.length > 0) {
      console.log('\nHeader texts:');
      uiElements.headerTexts.forEach(h => {
        console.log(`  ${h.tag}: ${h.text}`);
      });
    }
    
    // Save page HTML for analysis
    const htmlPath = path.join(testResultsDir, 'localhost-content.html');
    const htmlContent = await page.content();
    fs.writeFileSync(htmlPath, htmlContent);
    console.log(`\n✓ Page HTML saved to: ${htmlPath}`);
    
    // Check for TRPG-specific elements
    const trpgElements = await page.evaluate(() => {
      const checks = {
        hasDiceElements: !!document.querySelector('[class*="dice"], [class*="Dice"]'),
        hasCharacterElements: !!document.querySelector('[class*="character"], [class*="Character"]'),
        hasSessionElements: !!document.querySelector('[class*="session"], [class*="Session"]'),
        hasCampaignElements: !!document.querySelector('[class*="campaign"], [class*="Campaign"]'),
        hasAIElements: !!document.querySelector('[class*="ai"], [class*="AI"]')
      };
      return checks;
    });
    
    console.log('\nTRPG-specific elements:');
    console.log(`- Dice components: ${trpgElements.hasDiceElements}`);
    console.log(`- Character components: ${trpgElements.hasCharacterElements}`);
    console.log(`- Session components: ${trpgElements.hasSessionElements}`);
    console.log(`- Campaign components: ${trpgElements.hasCampaignElements}`);
    console.log(`- AI components: ${trpgElements.hasAIElements}`);
    
    console.log('\n✓ Browser capture completed successfully!');
    console.log('\nScreenshots saved in test-results/');
    console.log('You can view these images to see the application interface.');
    
  } catch (error) {
    console.error('Error during browser capture:', error);
    
    // Try to capture error screenshot
    try {
      const page = await browser.newPage();
      await page.goto('http://localhost:5173', { waitUntil: 'domcontentloaded' });
      await page.screenshot({ 
        path: path.join(testResultsDir, 'error-screenshot.png'),
        fullPage: true 
      });
    } catch (e) {
      console.error('Could not capture error screenshot');
    }
  } finally {
    await browser.close();
  }
})();