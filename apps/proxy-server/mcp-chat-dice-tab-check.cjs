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

    // チャットタブをクリック
    console.log('💬 チャットタブをクリック中...');
    const chatTab = await page.locator('button:has-text("チャット"), [role="tab"]:has-text("チャット")').first();
    if (await chatTab.isVisible()) {
      await chatTab.click();
      await page.waitForTimeout(1000);
      
      // チャットタブ選択後のスクリーンショット
      await page.screenshot({ 
        path: '/mnt/c/Users/irure/git/AIAgentTRPGGM/apps/proxy-server/trpg-session-chat-tab.png',
        fullPage: true 
      });
      console.log('📸 チャットタブ選択後のスクリーンショット撮影完了');

      // チャット関連要素をチェック
      const chatInput = await page.locator('input[placeholder*="メッセージ"], textarea[placeholder*="メッセージ"], [data-testid*="chat-input"]').count();
      console.log(`💬 チャット入力欄数: ${chatInput}`);

      const chatMessages = await page.locator('[data-testid*="chat-message"], .chat-message, [class*="message"]').count();
      console.log(`💬 チャットメッセージ数: ${chatMessages}`);

    } else {
      console.log('⚠️ チャットタブが見つかりません');
    }

    // ダイスタブをクリック
    console.log('🎲 ダイスタブをクリック中...');
    const diceTab = await page.locator('button:has-text("ダイス"), [role="tab"]:has-text("ダイス")').first();
    if (await diceTab.isVisible()) {
      await diceTab.click();
      await page.waitForTimeout(1000);
      
      // ダイスタブ選択後のスクリーンショット
      await page.screenshot({ 
        path: '/mnt/c/Users/irure/git/AIAgentTRPGGM/apps/proxy-server/trpg-session-dice-tab.png',
        fullPage: true 
      });
      console.log('📸 ダイスタブ選択後のスクリーンショット撮影完了');

      // ダイス関連要素をチェック
      const diceButtons = await page.locator('button:has-text("ダイス"), button:has-text("振る"), button[data-testid*="dice"], .dice-button').count();
      console.log(`🎲 ダイスボタン数: ${diceButtons}`);

      const diceInputs = await page.locator('input[type="number"], input[placeholder*="面"], [data-testid*="dice-input"]').count();
      console.log(`🎲 ダイス入力欄数: ${diceInputs}`);

    } else {
      console.log('⚠️ ダイスタブが見つかりません');
    }

    // 無限ループエラーの検出
    let infiniteLoopDetected = false;
    consoleErrors.forEach(error => {
      if (error.includes('Maximum update depth exceeded')) {
        infiniteLoopDetected = true;
      }
    });

    if (infiniteLoopDetected) {
      console.log('🔥 無限ループエラー（Maximum update depth exceeded）が検出されました');
      
      // ChatSearchFilterコンポーネントを詳細に調査
      const chatSearchFilter = await page.locator('[class*="ChatSearchFilter"], [data-testid*="chat-search"]').count();
      console.log(`🔍 ChatSearchFilterコンポーネント数: ${chatSearchFilter}`);
    }

    // エラー報告
    if (consoleErrors.length > 0) {
      console.log('\n❌ コンソールエラー:');
      consoleErrors.forEach((error, index) => {
        if (index < 3) { // 最初の3つのエラーのみ表示
          console.log(`  ${index + 1}. ${error.substring(0, 200)}...`);
        }
      });
      console.log(`  ... 他 ${Math.max(0, consoleErrors.length - 3)} 件のエラー`);
    } else {
      console.log('✅ コンソールエラーなし');
    }

    console.log('\n✅ チャット・ダイスタブの動作確認が完了しました');

  } catch (error) {
    console.error('❌ エラーが発生しました:', error);
    
    // エラー時もスクリーンショットを撮影
    try {
      await page.screenshot({ 
        path: '/mnt/c/Users/irure/git/AIAgentTRPGGM/apps/proxy-server/trpg-chat-dice-error.png',
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