import { chromium } from 'playwright';

(async () => {
  console.log('🔍 シンプルエラーチェック開始');
  
  const browser = await chromium.launch({ 
    headless: false,
    devtools: true,
    slowMo: 500
  });
  
  const context = await browser.newContext();
  const page = await context.newPage();
  
  // エラーを詳細に監視
  const errors = [];
  const logs = [];
  
  page.on('console', msg => {
    const text = msg.text();
    logs.push(`[${msg.type()}]: ${text}`);
    console.log(`📋 [${msg.type()}]: ${text}`);
  });
  
  page.on('pageerror', err => {
    errors.push(err.message);
    console.log('💥 PAGE ERROR:', err.message);
  });
  
  try {
    console.log('🎯 セッション画面にアクセス');
    await page.goto('http://localhost:5173/session', { 
      waitUntil: 'domcontentloaded',
      timeout: 30000 
    });
    
    console.log('⏳ 5秒待機してエラーを収集...');
    await page.waitForTimeout(5000);
    
    console.log('📊 ページの基本状態確認');
    const pageState = await page.evaluate(() => {
      return {
        title: document.title,
        buttonCount: document.querySelectorAll('button').length,
        hasErrorElements: document.querySelectorAll('[class*="error"]').length,
        bodyLength: document.body.textContent?.length || 0,
        hasReactRoot: !!document.getElementById('root'),
        reactErrors: window.__REACT_ERROR_OVERLAY_GLOBAL_HOOK__?.onBuildError || null
      };
    });
    
    console.log('📋 ページ状態:');
    console.log('  タイトル:', pageState.title);
    console.log('  ボタン数:', pageState.buttonCount);
    console.log('  エラー要素:', pageState.hasErrorElements);
    console.log('  コンテンツ長:', pageState.bodyLength);
    console.log('  React Root:', pageState.hasReactRoot);
    
    console.log('📋 収集されたエラー:', errors.length);
    errors.forEach((error, i) => console.log(`  ${i + 1}. ${error}`));
    
    console.log('📋 直近のログ (最後5件):');
    logs.slice(-5).forEach(log => console.log(`  ${log}`));
    
    // デバッグボタンを再確認
    const buttonCheck = await page.evaluate(() => {
      const allButtons = Array.from(document.querySelectorAll('button'));
      return {
        allButtonTexts: allButtons.map(btn => btn.textContent?.trim()).filter(text => text && text.length > 0),
        testDataButton: allButtons.find(btn => btn.textContent?.includes('テストデータ'))?.textContent,
        debugButtons: allButtons.filter(btn => btn.textContent?.includes('🧪')).map(btn => btn.textContent?.trim())
      };
    });
    
    console.log('🔍 ボタン詳細確認:');
    console.log('  総ボタン数:', buttonCheck.allButtonTexts.length);
    console.log('  テストデータボタン:', buttonCheck.testDataButton || 'なし');
    console.log('  デバッグボタン:', buttonCheck.debugButtons);
    console.log('  全ボタン:', buttonCheck.allButtonTexts.slice(0, 10));
    
    await page.screenshot({ 
      path: 'e2e/playwright-tools/simple-error-check.png', 
      fullPage: true 
    });
    
    if (errors.length === 0 && pageState.buttonCount > 10) {
      console.log('✅ ページは正常に動作しているようです');
    } else {
      console.log('⚠️ 何らかの問題があります');
    }
    
    console.log('⏳ 5秒待機...');
    await page.waitForTimeout(5000);
    
  } catch (error) {
    console.log('💥 テストエラー:', error.message);
    await page.screenshot({ 
      path: 'e2e/playwright-tools/simple-error-check-failed.png',
      fullPage: true 
    });
  }
  
  await browser.close();
  console.log('🏁 シンプルエラーチェック完了');
})();