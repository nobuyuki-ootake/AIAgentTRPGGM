const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch({ headless: false });
  const context = await browser.newContext({
    viewport: { width: 1280, height: 720 }
  });
  const page = await context.newPage();

  try {
    // コンソールエラーをキャッチ
    const consoleErrors = [];
    page.on('console', msg => {
      if (msg.type() === 'error') {
        consoleErrors.push(msg.text());
      }
    });

    console.log('🔄 TRPGセッション画面にアクセス中...');
    await page.goto('http://localhost:5173/session', { 
      waitUntil: 'domcontentloaded',
      timeout: 30000 
    });

    await page.waitForTimeout(2000);

    // サイドバーを閉じる（背景をクリック）
    console.log('🔄 サイドバーを閉じています...');
    try {
      // サイドバーの外側（メインエリア）をクリック
      await page.click('body', { position: { x: 600, y: 300 } });
      await page.waitForTimeout(1000);
    } catch (sidebarError) {
      console.log('⚠️ サイドバーの閉じる操作をスキップ');
    }

    // サイドバーが閉じた後のスクリーンショット
    await page.screenshot({ 
      path: '/mnt/c/Users/irure/git/AIAgentTRPGGM/apps/proxy-server/trpg-session-sidebar-closed.png',
      fullPage: true 
    });
    console.log('📸 サイドバー閉じ後のスクリーンショット撮影完了');

    // 各タブの状態を確認
    const tabs = await page.locator('[role="tab"]').all();
    console.log(`📋 検出されたタブ数: ${tabs.length}`);
    
    for (let i = 0; i < tabs.length; i++) {
      const tabText = await tabs[i].textContent();
      const isSelected = await tabs[i].getAttribute('aria-selected');
      console.log(`  タブ ${i + 1}: "${tabText}" (選択状態: ${isSelected})`);
    }

    // チャットタブを探してクリック
    console.log('💬 チャットタブをクリック中...');
    try {
      const chatTab = await page.locator('[role="tab"]:has-text("チャット")').first();
      await chatTab.click({ force: true });
      await page.waitForTimeout(1000);
      
      // チャットタブ選択後のスクリーンショット
      await page.screenshot({ 
        path: '/mnt/c/Users/irure/git/AIAgentTRPGGM/apps/proxy-server/trpg-session-chat-tab.png',
        fullPage: true 
      });
      console.log('📸 チャットタブ選択後のスクリーンショット撮影完了');

      // チャット関連要素をチェック
      const chatElements = await page.locator('input, textarea, [contenteditable="true"]').count();
      console.log(`💬 入力可能な要素数: ${chatElements}`);

    } catch (chatError) {
      console.log(`⚠️ チャットタブクリックエラー: ${chatError.message}`);
    }

    // ダイスタブを探してクリック
    console.log('🎲 ダイスタブをクリック中...');
    try {
      const diceTab = await page.locator('[role="tab"]:has-text("ダイス")').first();
      await diceTab.click({ force: true });
      await page.waitForTimeout(1000);
      
      // ダイスタブ選択後のスクリーンショット
      await page.screenshot({ 
        path: '/mnt/c/Users/irure/git/AIAgentTRPGGM/apps/proxy-server/trpg-session-dice-tab.png',
        fullPage: true 
      });
      console.log('📸 ダイスタブ選択後のスクリーンショット撮影完了');

      // ダイス関連要素をチェック
      const diceElements = await page.locator('button:has-text("振る"), input[type="number"], [data-testid*="dice"]').count();
      console.log(`🎲 ダイス関連要素数: ${diceElements}`);

    } catch (diceError) {
      console.log(`⚠️ ダイスタブクリックエラー: ${diceError.message}`);
    }

    // 無限ループエラーの検出
    let infiniteLoopCount = 0;
    consoleErrors.forEach(error => {
      if (error.includes('Maximum update depth exceeded')) {
        infiniteLoopCount++;
      }
    });

    console.log(`🔥 無限ループエラー検出数: ${infiniteLoopCount}`);

    // ChatSearchFilterの問題を調査
    const chatSearchComponents = await page.evaluate(() => {
      const elements = document.querySelectorAll('*');
      let count = 0;
      elements.forEach(el => {
        if (el.className && el.className.toString().includes('Search')) {
          count++;
        }
      });
      return count;
    });
    console.log(`🔍 Search関連コンポーネント数: ${chatSearchComponents}`);

    // 最終的な画面状態
    await page.screenshot({ 
      path: '/mnt/c/Users/irure/git/AIAgentTRPGGM/apps/proxy-server/trpg-session-final-state.png',
      fullPage: true 
    });
    console.log('📸 最終状態のスクリーンショット撮影完了');

    // エラー報告（簡略版）
    if (consoleErrors.length > 0) {
      console.log(`\n❌ コンソールエラー総数: ${consoleErrors.length}`);
      console.log('主要なエラー:');
      const uniqueErrors = [...new Set(consoleErrors.map(e => e.substring(0, 100)))];
      uniqueErrors.slice(0, 3).forEach((error, index) => {
        console.log(`  ${index + 1}. ${error}...`);
      });
    } else {
      console.log('✅ コンソールエラーなし');
    }

    console.log('\n✅ TRPGセッション画面のタブ動作確認が完了しました');

  } catch (error) {
    console.error('❌ 全体エラーが発生しました:', error.message);
  } finally {
    await browser.close();
  }
})();