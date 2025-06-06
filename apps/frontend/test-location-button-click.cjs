const { chromium } = require('playwright');

async function testLocationButtonClick() {
  console.log('Testing location register button click...');
  
  try {
    const browser = await chromium.launch({ 
      headless: false,
      args: ['--no-sandbox', '--disable-web-security']
    });
    const context = await browser.newContext({
      viewport: { width: 1280, height: 720 }
    });
    const page = await context.newPage();
    
    console.log('Navigating to TRPG session page...');
    await page.goto('http://localhost:5173/trpg-session', { waitUntil: 'networkidle' });
    
    // アラートダイアログを監視
    let alertMessage = '';
    page.on('dialog', async dialog => {
      alertMessage = dialog.message();
      console.log(`Alert message: "${alertMessage}"`);
      await dialog.accept();
    });
    
    // 場所を登録するボタンをクリック
    console.log('Clicking register location button...');
    const registerButton = page.locator('text=場所を登録する').first();
    
    if (await registerButton.isVisible()) {
      await registerButton.click();
      await page.waitForTimeout(1000);
      
      if (alertMessage) {
        console.log('✅ Alert was displayed successfully');
        console.log(`Alert content: "${alertMessage}"`);
        
        if (alertMessage.includes('世界観構築画面で場所を登録してください')) {
          console.log('✅ Alert message is correct');
        } else {
          console.log('❌ Alert message is different than expected');
        }
      } else {
        console.log('❌ No alert was displayed');
      }
    } else {
      console.log('❌ Register location button not found');
    }
    
    // 最終スクリーンショット
    await page.screenshot({ 
      path: 'location-button-test-final.png', 
      fullPage: true 
    });
    
    console.log('Button click test completed successfully');
    await browser.close();
    
  } catch (error) {
    console.error('Error during button click test:', error);
    process.exit(1);
  }
}

testLocationButtonClick();