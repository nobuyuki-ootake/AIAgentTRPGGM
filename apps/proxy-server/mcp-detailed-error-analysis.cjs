const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch({ headless: false });
  const context = await browser.newContext();
  const page = await context.newPage();

  try {
    const consoleErrors = [];
    const consoleWarnings = [];
    
    page.on('console', msg => {
      const text = msg.text();
      if (msg.type() === 'error') {
        consoleErrors.push(text);
      } else if (msg.type() === 'warning') {
        consoleWarnings.push(text);
      }
    });

    console.log('🔄 詳細エラー分析中...');
    await page.goto('http://localhost:5173/session', { 
      waitUntil: 'domcontentloaded',
      timeout: 15000 
    });

    // 10秒待機してエラーを詳細に観測
    console.log('⏱️ 10秒間エラーを観測中...');
    await page.waitForTimeout(10000);

    // React DevToolsの情報があるかチェック
    const reactVersion = await page.evaluate(() => {
      return window.React ? window.React.version : 'React not found';
    });
    console.log(`⚛️ React バージョン: ${reactVersion}`);

    // エラーの詳細分析
    console.log('\n📊 エラー詳細分析:');
    console.log(`エラー総数: ${consoleErrors.length}`);
    console.log(`警告総数: ${consoleWarnings.length}`);

    // 無限ループエラーの詳細
    const infiniteLoopErrors = consoleErrors.filter(e => e.includes('Maximum update depth exceeded'));
    console.log(`無限ループエラー数: ${infiniteLoopErrors.length}`);

    if (infiniteLoopErrors.length > 0) {
      console.log('\n🔥 無限ループエラーの詳細:');
      infiniteLoopErrors.slice(0, 1).forEach((error, index) => {
        const lines = error.split('\n');
        console.log(`エラー ${index + 1}:`);
        console.log(`  メッセージ: ${lines[0]}`);
        
        // コンポーネントスタックを探す
        const relevantLines = lines.filter(line => 
          line.includes('ChatSearchFilter') || 
          line.includes('ChatInterface') || 
          line.includes('TextField') ||
          line.includes('InputBase')
        );
        
        console.log('  関連コンポーネント:');
        relevantLines.slice(0, 5).forEach(line => {
          console.log(`    ${line.trim()}`);
        });
      });
    }

    // スクリーンショット撮影
    await page.screenshot({ 
      path: '/mnt/c/Users/irure/git/AIAgentTRPGGM/apps/proxy-server/detailed-error-analysis.png',
      fullPage: true 
    });
    console.log('\n📸 詳細分析スクリーンショット撮影完了');

  } catch (error) {
    console.error('❌ 分析エラー:', error.message);
  } finally {
    await browser.close();
  }
})();