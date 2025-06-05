const { chromium } = require('playwright');

(async () => {
  console.log('🎯 TRPGセッション作業テスト開始！');
  console.log('⚠️  注意: 開発サーバーが別ターミナルで起動していることを確認してください');
  console.log('📍 コマンド: pnpm dev (または cd apps/frontend && pnpm dev)');
  
  // 接続待機
  let connected = false;
  for (let i = 0; i < 10; i++) {
    try {
      const response = await fetch('http://localhost:5173');
      if (response.ok) {
        console.log('✅ サーバー接続確認成功');
        connected = true;
        break;
      }
    } catch (error) {
      console.log(`⏳ 接続試行 ${i + 1}/10...`);
      await new Promise(resolve => setTimeout(resolve, 2000));
    }
  }
  
  if (!connected) {
    console.log('❌ サーバーに接続できません。pnpm devが起動していることを確認してください');
    return;
  }
  
  const browser = await chromium.launch({ 
    headless: false,
    slowMo: 1000,
    devtools: true
  });
  
  const context = await browser.newContext({
    viewport: { width: 1920, height: 1080 }
  });
  
  const page = await context.newPage();
  
  // エラーログ
  page.on('console', msg => {
    const type = msg.type();
    const emoji = type === 'error' ? '❌' : type === 'warn' ? '⚠️' : '✅';
    console.log(`${emoji} [${type}]: ${msg.text()}`);
  });
  
  page.on('pageerror', err => {
    console.log('💥 PAGE ERROR:', err.message);
    if (err.stack) {
      const stackLines = err.stack.split('\n').slice(0, 3);
      console.log('📍 Stack:', stackLines.join(' | '));
    }
  });
  
  try {
    console.log('🚀 Step 1: ホーム画面アクセス');
    await page.goto('http://localhost:5173', { 
      waitUntil: 'networkidle',
      timeout: 30000 
    });
    
    await page.waitForTimeout(3000);
    
    console.log('📸 ホーム画面スクリーンショット');
    await page.screenshot({ 
      path: 'e2e/playwright-tools/working-home.png', 
      fullPage: true 
    });
    
    console.log('🎯 Step 2: TRPGセッションページに直接アクセス');
    await page.goto('http://localhost:5173/session', { 
      waitUntil: 'domcontentloaded',
      timeout: 30000 
    });
    
    // エラーが発生するまで待機
    await page.waitForTimeout(5000);
    
    console.log('📸 TRPGセッションページスクリーンショット（エラー状態含む）');
    await page.screenshot({ 
      path: 'e2e/playwright-tools/working-trpg-session.png', 
      fullPage: true 
    });
    
    // ページの基本情報を取得
    const pageInfo = await page.evaluate(() => {
      return {
        title: document.title,
        url: window.location.pathname,
        hasContent: document.body.textContent?.trim().length > 50,
        bodyText: document.body.textContent?.substring(0, 300),
        errorElements: document.querySelectorAll('[class*="error"], .error').length
      };
    });
    
    console.log('📊 ページ情報:', pageInfo);
    
    if (pageInfo.hasContent) {
      console.log('✅ TRPGセッションページにコンテンツが表示されています！');
    } else {
      console.log('⚠️ TRPGセッションページが空白です。JavaScript エラーが原因の可能性があります。');
    }
    
    console.log('⏳ 10秒間表示維持...');
    await page.waitForTimeout(10000);
    
  } catch (error) {
    console.log('💥 テストエラー:', error.message);
    await page.screenshot({ 
      path: 'e2e/playwright-tools/working-error.png',
      fullPage: true 
    });
  }
  
  await browser.close();
  console.log('🏁 TRPGセッション作業テスト完了！');
})();