const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch({ headless: false });
  const context = await browser.newContext({
    viewport: { width: 1280, height: 720 }
  });
  const page = await context.newPage();

  try {
    // ページロード前にコンソールエラーをキャッチ
    const consoleErrors = [];
    page.on('console', msg => {
      if (msg.type() === 'error') {
        consoleErrors.push(msg.text());
      }
    });

    // ページエラーをキャッチ
    const pageErrors = [];
    page.on('pageerror', error => {
      pageErrors.push(error.toString());
    });

    console.log('🔄 TRPGセッション画面にアクセス中...');
    await page.goto('http://localhost:5173/session', { 
      waitUntil: 'domcontentloaded',
      timeout: 30000 
    });

    // ページタイトルを確認
    const title = await page.title();
    console.log(`📄 ページタイトル: ${title}`);

    // 少し待ってからスクリーンショット撮影
    await page.waitForTimeout(3000);

    // 初期状態のスクリーンショット
    await page.screenshot({ 
      path: '/mnt/c/Users/irure/git/AIAgentTRPGGM/apps/proxy-server/trpg-session-initial.png',
      fullPage: true 
    });
    console.log('📸 初期画面のスクリーンショット撮影完了');

    // 開発者モードボタンを探してクリック
    try {
      const devModeButton = await page.locator('[data-testid="developer-mode-toggle"]').first();
      if (await devModeButton.isVisible()) {
        await devModeButton.click();
        console.log('🔧 開発者モードを有効化');
        await page.waitForTimeout(1000);
        
        // 開発者モード有効後のスクリーンショット
        await page.screenshot({ 
          path: '/mnt/c/Users/irure/git/AIAgentTRPGGM/apps/proxy-server/trpg-session-dev-mode.png',
          fullPage: true 
        });
        console.log('📸 開発者モード有効化後のスクリーンショット撮影完了');
      }
    } catch (error) {
      console.log('⚠️ 開発者モードボタンが見つからない:', error.message);
    }

    // PartyPanelのTabsコンポーネントをチェック
    const tabsElements = await page.locator('div[role="tablist"], .MuiTabs-root').count();
    console.log(`🔄 Tabsコンポーネント数: ${tabsElements}`);

    if (tabsElements > 0) {
      const tabs = await page.locator('div[role="tablist"] button, .MuiTab-root').all();
      console.log(`📋 タブ数: ${tabs.length}`);
      
      for (let i = 0; i < tabs.length; i++) {
        const tabText = await tabs[i].textContent();
        console.log(`  タブ ${i + 1}: ${tabText}`);
      }
    }

    // デバッグパネルボタンをチェック
    const debugButtons = await page.locator('button[data-testid*="debug"], button:has-text("デバッグ"), button:has-text("Debug")').count();
    console.log(`🐛 デバッグボタン数: ${debugButtons}`);

    // DiceRollUIをチェック
    const diceElements = await page.locator('[data-testid*="dice"], .dice-roll, [class*="dice"]').count();
    console.log(`🎲 ダイス関連要素数: ${diceElements}`);

    // ChatInterfaceをチェック
    const chatElements = await page.locator('[data-testid*="chat"], .chat-interface, [class*="chat"]').count();
    console.log(`💬 チャット関連要素数: ${chatElements}`);

    // 最終的なページ状態をチェック
    const bodyContent = await page.locator('body').textContent();
    console.log(`📝 ページ文字数: ${bodyContent.length}`);

    // エラー報告
    if (consoleErrors.length > 0) {
      console.log('\n❌ コンソールエラー:');
      consoleErrors.forEach((error, index) => {
        console.log(`  ${index + 1}. ${error}`);
      });
    } else {
      console.log('✅ コンソールエラーなし');
    }

    if (pageErrors.length > 0) {
      console.log('\n❌ ページエラー:');
      pageErrors.forEach((error, index) => {
        console.log(`  ${index + 1}. ${error}`);
      });
    } else {
      console.log('✅ ページエラーなし');
    }

    // 最終スクリーンショット
    await page.screenshot({ 
      path: '/mnt/c/Users/irure/git/AIAgentTRPGGM/apps/proxy-server/trpg-session-final.png',
      fullPage: true 
    });
    console.log('📸 最終状態のスクリーンショット撮影完了');

    console.log('\n✅ TRPGセッション画面の動作確認が完了しました');

  } catch (error) {
    console.error('❌ エラーが発生しました:', error);
    
    // エラー時もスクリーンショットを撮影
    try {
      await page.screenshot({ 
        path: '/mnt/c/Users/irure/git/AIAgentTRPGGM/apps/proxy-server/trpg-session-error.png',
        fullPage: true 
      });
      console.log('📸 エラー時のスクリーンショット撮影完了');
    } catch (screenshotError) {
      console.error('スクリーンショット撮影に失敗:', screenshotError);
    }
  } finally {
    await browser.close();
  }
})();