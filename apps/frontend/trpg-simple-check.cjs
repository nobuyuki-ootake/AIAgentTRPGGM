const { chromium } = require('playwright');

async function simpleCheck() {
  const browser = await chromium.launch({ 
    headless: false,
    slowMo: 500
  });
  
  const context = await browser.newContext({
    viewport: { width: 1920, height: 1080 }
  });
  
  const page = await context.newPage();
  
  let consoleErrors = [];
  page.on('console', msg => {
    if (msg.type() === 'error') {
      consoleErrors.push(msg.text());
    }
  });
  
  try {
    console.log('基本チェック開始...');
    
    console.log('1. ホームページにアクセス');
    await page.goto('http://localhost:5173/', { waitUntil: 'load', timeout: 10000 });
    await page.waitForTimeout(2000);
    
    console.log('2. TRPGセッション画面に移動');
    await page.goto('http://localhost:5173/trpg-session', { waitUntil: 'load', timeout: 10000 });
    await page.waitForTimeout(3000);
    
    console.log('3. ページタイトルを確認');
    const title = await page.title();
    console.log(`ページタイトル: ${title}`);
    
    console.log('4. 基本的な要素の存在確認');
    
    // Check for basic elements
    const bodyText = await page.textContent('body');
    console.log(`ページに表示されている内容の一部: ${bodyText.substring(0, 200)}...`);
    
    // Check for React app
    const reactElement = await page.locator('#root').isVisible();
    console.log(`Reactアプリの根要素: ${reactElement ? '見つかりました' : '見つかりません'}`);
    
    console.log('5. コンソールエラーの確認');
    if (consoleErrors.length > 0) {
      console.log(`コンソールエラー数: ${consoleErrors.length}`);
      consoleErrors.slice(0, 3).forEach((error, index) => {
        console.log(`エラー ${index + 1}: ${error.substring(0, 150)}...`);
      });
    } else {
      console.log('コンソールエラーはありません');
    }
    
    console.log('6. スクリーンショット撮影');
    await page.screenshot({ 
      path: 'trpg-simple-check-screenshot.png',
      fullPage: true 
    });
    
    console.log('基本チェック完了');
    
    // Keep browser open for 10 seconds for manual inspection
    await page.waitForTimeout(10000);
    
  } catch (error) {
    console.error('エラーが発生しました:', error.message);
    await page.screenshot({ 
      path: 'trpg-simple-check-error.png',
      fullPage: true 
    });
  } finally {
    await browser.close();
  }
}

simpleCheck();