const puppeteer = require('puppeteer');

async function debugDiceUI() {
  console.log('🔍 Debugging Dice UI rendering...');
  
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
    // Navigate to TRPG session page directly
    await page.goto('http://localhost:5174/trpg-session', { waitUntil: 'networkidle0' });
    console.log('✅ Page loaded');
    
    // Wait for page to fully load
    await page.waitForTimeout(5000);
    
    // Check HTML structure
    console.log('🔍 Checking page HTML structure...');
    
    // Get all text content to see what's rendered
    const bodyText = await page.evaluate(() => document.body.innerText);
    console.log('📄 Full page text content:');
    console.log(bodyText);
    
    // Check for specific elements
    const diceRollHeader = await page.$('text=ダイスロール');
    console.log('🎲 "ダイスロール" header found:', !!diceRollHeader);
    
    // Check for selected character section
    const selectedCharHeader = await page.$('text=選択中のキャラクター');
    console.log('👤 "選択中のキャラクター" section found:', !!selectedCharHeader);
    
    // Get all buttons and their text
    const buttons = await page.$$eval('button', buttons => 
      buttons.map(btn => ({
        text: btn.textContent?.trim(),
        visible: btn.offsetHeight > 0 && btn.offsetWidth > 0
      }))
    );
    
    console.log('🔘 All buttons found:');
    buttons.forEach((btn, index) => {
      console.log(`  ${index + 1}. "${btn.text}" (visible: ${btn.visible})`);
    });
    
    // Check for any elements with dice-related text
    const diceElements = await page.$$eval('*', elements => {
      const found = [];
      elements.forEach(el => {
        const text = el.textContent || '';
        if (text.includes('D20') || text.includes('D6') || text.includes('D8') || 
            text.includes('D10') || text.includes('D12') || text.includes('ダイス')) {
          found.push({
            tag: el.tagName,
            text: text.trim().substring(0, 100),
            visible: el.offsetHeight > 0 && el.offsetWidth > 0
          });
        }
      });
      return found;
    });
    
    console.log('🎲 Elements with dice-related text:');
    diceElements.forEach((el, index) => {
      console.log(`  ${index + 1}. <${el.tag}>: "${el.text}" (visible: ${el.visible})`);
    });
    
    // Take a screenshot for visual inspection
    await page.screenshot({ 
      path: '/mnt/c/Users/irure/git/AIAgentTRPGGM/apps/frontend/test-results/debug-dice-ui.png',
      fullPage: true
    });
    
    // Scroll down to check if content is below
    console.log('📜 Scrolling down to check for more content...');
    await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
    await page.waitForTimeout(2000);
    
    // Take another screenshot after scrolling
    await page.screenshot({ 
      path: '/mnt/c/Users/irure/git/AIAgentTRPGGM/apps/frontend/test-results/debug-dice-ui-scrolled.png',
      fullPage: true
    });
    
    console.log('🖥️ Keeping browser open for 30 seconds for manual inspection...');
    await page.waitForTimeout(30000);
    
  } catch (error) {
    console.error('❌ Test failed:', error);
    
    // Take error screenshot
    await page.screenshot({ 
      path: '/mnt/c/Users/irure/git/AIAgentTRPGGM/apps/frontend/test-results/debug-dice-ui-error.png',
      fullPage: true
    });
  } finally {
    await browser.close();
  }
}

// Check if puppeteer is available
try {
  debugDiceUI().catch(console.error);
} catch (e) {
  console.log('❌ Puppeteer not available, trying alternative debugging...');
  
  // Alternative: Use node to check the files directly
  const fs = require('fs');
  const path = require('path');
  
  console.log('📁 Checking TRPGSessionPage.tsx structure...');
  
  try {
    const filePath = path.join(__dirname, 'src', 'pages', 'TRPGSessionPage.tsx');
    const content = fs.readFileSync(filePath, 'utf8');
    
    // Check if dice-related code is present
    if (content.includes('ダイスロール')) {
      console.log('✅ "ダイスロール" text found in file');
    } else {
      console.log('❌ "ダイスロール" text NOT found in file');
    }
    
    if (content.includes('D20') || content.includes('D6')) {
      console.log('✅ Dice button text found in file');
    } else {
      console.log('❌ Dice button text NOT found in file');
    }
    
    if (content.includes('DiceRollUI')) {
      console.log('✅ DiceRollUI component import found');
    } else {
      console.log('❌ DiceRollUI component import NOT found');
    }
    
  } catch (fileError) {
    console.error('❌ Could not read file:', fileError.message);
  }
}