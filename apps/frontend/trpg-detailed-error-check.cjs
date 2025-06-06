const { chromium } = require('playwright');

async function detailedErrorCheck() {
  const browser = await chromium.launch({ 
    headless: true 
  });
  
  const context = await browser.newContext();
  const page = await context.newPage();
  
  let allConsoleMessages = [];
  
  page.on('console', msg => {
    const messageText = msg.text();
    allConsoleMessages.push({
      type: msg.type(),
      text: messageText,
      timestamp: new Date().toISOString()
    });
    
    // ログをリアルタイムで出力
    console.log(`[${msg.type().toUpperCase()}] ${messageText}`);
  });
  
  page.on('pageerror', error => {
    console.error(`[PAGE ERROR] ${error.message}`);
  });
  
  try {
    console.log('詳細エラーチェック開始...');
    
    await page.goto('http://localhost:5173/trpg-session', { 
      waitUntil: 'domcontentloaded', 
      timeout: 15000 
    });
    
    // Wait for React to fully render and errors to occur
    console.log('React レンダリングを待機中...');
    await page.waitForTimeout(8000);
    
    console.log('\n=== エラー分析 ===');
    
    // Analyze infinite loop errors specifically
    const infiniteLoopErrors = allConsoleMessages.filter(msg => 
      msg.type === 'error' && 
      (msg.text.includes('Maximum update depth exceeded') || 
       msg.text.includes('Too many re-renders'))
    );
    
    console.log(`無限ループエラー総数: ${infiniteLoopErrors.length}`);
    
    if (infiniteLoopErrors.length > 0) {
      console.log('\n無限ループエラーの詳細:');
      const firstError = infiniteLoopErrors[0];
      console.log(firstError.text);
      
      // Try to extract component stack from the error
      if (firstError.text.includes('at')) {
        const stack = firstError.text.split('at ').slice(1);
        console.log('\nコンポーネントスタック:');
        stack.slice(0, 10).forEach((line, index) => {
          console.log(`  ${index + 1}. ${line.trim()}`);
        });
      }
    }
    
    // Analyze other types of errors
    const otherErrors = allConsoleMessages.filter(msg => 
      msg.type === 'error' && 
      !msg.text.includes('Maximum update depth exceeded') &&
      !msg.text.includes('Too many re-renders')
    );
    
    if (otherErrors.length > 0) {
      console.log(`\nその他のエラー: ${otherErrors.length}件`);
      otherErrors.slice(0, 3).forEach((error, index) => {
        console.log(`  ${index + 1}. ${error.text.substring(0, 150)}...`);
      });
    }
    
    // Check for specific warning patterns
    const muiWarnings = allConsoleMessages.filter(msg => 
      msg.text.includes('MUI') || msg.text.includes('Material-UI')
    );
    
    if (muiWarnings.length > 0) {
      console.log(`\nMUI警告: ${muiWarnings.length}件`);
      muiWarnings.slice(0, 2).forEach((warning, index) => {
        console.log(`  ${index + 1}. ${warning.text}`);
      });
    }
    
    console.log('\n=== ページ状態確認 ===');
    
    // Check current state
    const pageContent = await page.locator('body').textContent();
    console.log(`ページにコンテンツが表示されている: ${pageContent && pageContent.length > 100 ? 'はい' : 'いいえ'}`);
    
    // Check for specific TRPG elements
    const sessionElements = await page.locator('[class*="session"], [data-testid*="session"]').count();
    console.log(`セッション関連要素: ${sessionElements}個`);
    
    const chatElements = await page.locator('[class*="chat"], [data-testid*="chat"]').count();
    console.log(`チャット関連要素: ${chatElements}個`);
    
    const diceElements = await page.locator('[class*="dice"], [data-testid*="dice"]').count();
    console.log(`ダイス関連要素: ${diceElements}個`);
    
    // Screenshot
    await page.screenshot({ 
      path: 'trpg-detailed-error-check.png',
      fullPage: true 
    });
    
    console.log('\n詳細エラーチェック完了');
    
  } catch (error) {
    console.error('チェック中にエラーが発生しました:', error.message);
    await page.screenshot({ 
      path: 'trpg-detailed-error-check-error.png',
      fullPage: true 
    });
  } finally {
    await browser.close();
  }
}

detailedErrorCheck();