const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext();
  const page = await context.newPage();

  try {
    const consoleErrors = [];
    page.on('console', msg => {
      if (msg.type() === 'error') {
        consoleErrors.push(msg.text());
      }
    });

    console.log('🔄 TRPGセッション画面の簡易エラーチェック...');
    await page.goto('http://localhost:5173/session', { 
      waitUntil: 'domcontentloaded',
      timeout: 15000 
    });

    // 5秒待機してエラーを観測
    await page.waitForTimeout(5000);

    // 無限ループエラーの検出
    let infiniteLoopCount = 0;
    consoleErrors.forEach(error => {
      if (error.includes('Maximum update depth exceeded')) {
        infiniteLoopCount++;
      }
    });

    console.log(`🔥 無限ループエラー検出数: ${infiniteLoopCount}`);
    console.log(`📊 コンソールエラー総数: ${consoleErrors.length}`);

    if (infiniteLoopCount === 0) {
      console.log('✅ 無限ループエラーが解決されました！');
    } else {
      console.log('❌ 無限ループエラーが継続しています');
    }

  } catch (error) {
    console.error('❌ テスト実行エラー:', error.message);
  } finally {
    await browser.close();
  }
})();