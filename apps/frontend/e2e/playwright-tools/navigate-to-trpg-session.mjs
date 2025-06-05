import { chromium } from 'playwright';

(async () => {
  console.log('🎯 TRPGセッション画面へナビゲート！');
  
  const browser = await chromium.launch({ 
    headless: false,
    devtools: true,
    slowMo: 1000
  });
  
  const context = await browser.newContext();
  const page = await context.newPage();
  
  // ログ監視
  page.on('console', msg => {
    const type = msg.type();
    const emoji = type === 'error' ? '❌' : type === 'warn' ? '⚠️' : '📋';
    console.log(`${emoji} ${msg.text()}`);
  });
  
  page.on('pageerror', err => {
    console.log('💥 PAGE ERROR:', err.message);
    console.log('📍 Location:', err.stack?.split('\n')[0] || 'Unknown');
  });
  
  try {
    console.log('🚀 Step 1: ホーム画面に移動');
    await page.goto('http://localhost:5173', { 
      waitUntil: 'networkidle',
      timeout: 30000 
    });
    
    await page.waitForTimeout(3000);
    console.log('✅ ホーム画面読み込み完了');
    
    console.log('🎯 Step 2: TRPGセッションページに直接移動');
    await page.goto('http://localhost:5173/session', { 
      waitUntil: 'domcontentloaded',
      timeout: 30000 
    });
    
    console.log('⏳ セッションページ読み込み待機...');
    await page.waitForTimeout(5000);
    
    // セッションページの状態確認
    const sessionInfo = await page.evaluate(() => {
      return {
        title: document.title,
        url: window.location.pathname,
        hasContent: document.body.textContent?.trim().length > 50,
        bodyText: document.body.textContent?.substring(0, 200),
        buttonCount: document.querySelectorAll('button').length,
        hasErrorElements: document.querySelectorAll('[class*="error"], .error, [role="alert"]').length > 0,
        isBlank: document.body.textContent?.trim() === ''
      };
    });
    
    console.log('📊 TRPGセッションページ情報:');
    console.log('  タイトル:', sessionInfo.title);
    console.log('  URL:', sessionInfo.url);
    console.log('  コンテンツあり:', sessionInfo.hasContent);
    console.log('  ボタン数:', sessionInfo.buttonCount);
    console.log('  エラー要素:', sessionInfo.hasErrorElements);
    console.log('  空白ページ:', sessionInfo.isBlank);
    
    if (sessionInfo.bodyText) {
      console.log('  内容プレビュー:', sessionInfo.bodyText);
    }
    
    // スクリーンショット保存
    await page.screenshot({ 
      path: 'e2e/playwright-tools/trpg-session-navigate.png', 
      fullPage: true 
    });
    console.log('📸 TRPGセッションページのスクリーンショット保存');
    
    if (sessionInfo.hasContent && !sessionInfo.isBlank) {
      console.log('🎉 TRPGセッションページが正常に表示されています！');
    } else {
      console.log('⚠️ TRPGセッションページに問題があります。ブラウザーで詳細を確認してください。');
    }
    
    console.log('');
    console.log('============================================');
    console.log('🎮 TRPGセッション画面が開きました！');
    console.log('📱 ブラウザーでインタラクション可能です');
    console.log('🔧 DevToolsでデバッグ可能です');
    console.log('⌨️  Ctrl+C で終了');
    console.log('============================================');
    
    // ブラウザーを開いたまま維持
    await new Promise(() => {}); // 無限待機
    
  } catch (error) {
    console.log('💥 エラー:', error.message);
    
    await page.screenshot({ 
      path: 'e2e/playwright-tools/trpg-session-error.png',
      fullPage: true 
    });
    console.log('📸 エラー時スクリーンショット保存');
  }
  
  // 注意: ここには到達しません（無限待機のため）
  await browser.close();
})();