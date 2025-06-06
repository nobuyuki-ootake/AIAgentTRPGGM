const { chromium } = require('playwright');

async function testConsoleErrors() {
  console.log('🔍 Testing for Console Errors...');
  
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
    
    // Collect all console messages
    const consoleMessages = [];
    page.on('console', msg => {
      const message = {
        type: msg.type(),
        text: msg.text(),
        location: msg.location()
      };
      consoleMessages.push(message);
      
      if (msg.type() === 'error') {
        console.log('❌ Console Error:', msg.text());
        console.log('   Location:', msg.location());
      } else if (msg.type() === 'warn') {
        console.log('⚠️ Console Warning:', msg.text());
      } else if (msg.type() === 'log') {
        console.log('📝 Console Log:', msg.text());
      }
    });
    
    // Listen for page errors
    page.on('pageerror', error => {
      console.log('💥 Page Error:', error.message);
      console.log('   Stack:', error.stack);
    });
    
    // Navigate to home page first
    console.log('🌐 Navigating to localhost:5173...');
    await page.goto('http://localhost:5173');
    await page.waitForTimeout(3000);
    
    // Enable developer mode
    try {
      const devToggle = await page.locator('input[type="checkbox"]').first();
      if (await devToggle.isVisible()) {
        await devToggle.check();
        console.log('✅ Developer mode enabled');
        await page.waitForTimeout(1000);
      }
    } catch (e) {
      console.log('⚠️ Could not enable developer mode');
    }
    
    // Navigate to TRPG session page
    console.log('🎮 Navigating to TRPG Session page...');
    await page.goto('http://localhost:5173/trpg-session');
    await page.waitForTimeout(5000);
    
    // Take screenshot
    await page.screenshot({ 
      path: 'test-results/console-error-test.png',
      fullPage: true 
    });
    
    // Check for any content on the page
    const bodyText = await page.textContent('body');
    console.log('📄 Page has content:', bodyText && bodyText.trim().length > 0);
    
    if (bodyText && bodyText.trim().length > 0) {
      console.log('📄 First 200 characters:', bodyText.slice(0, 200));
    }
    
    // Look for specific elements
    const buttons = await page.locator('button').count();
    const papers = await page.locator('[class*="MuiPaper"]').count();
    const typography = await page.locator('[class*="MuiTypography"]').count();
    
    console.log(`🔍 Elements found: ${buttons} buttons, ${papers} papers, ${typography} typography`);
    
    // Summary
    const errors = consoleMessages.filter(msg => msg.type === 'error');
    const warnings = consoleMessages.filter(msg => msg.type === 'warn');
    
    console.log('\n📊 Console Message Summary:');
    console.log(`   Errors: ${errors.length}`);
    console.log(`   Warnings: ${warnings.length}`);
    console.log(`   Total messages: ${consoleMessages.length}`);
    
    if (errors.length > 0) {
      console.log('\n❌ Error Details:');
      errors.forEach((error, index) => {
        console.log(`   ${index + 1}. ${error.text}`);
        if (error.location) {
          console.log(`      File: ${error.location.url}:${error.location.lineNumber}`);
        }
      });
    }
    
  } catch (error) {
    console.error('❌ Test failed:', error);
  } finally {
    if (browser) {
      await browser.close();
    }
  }
}

testConsoleErrors();