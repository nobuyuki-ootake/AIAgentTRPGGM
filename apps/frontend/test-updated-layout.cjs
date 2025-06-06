const { chromium } = require('playwright');

(async () => {
  console.log('🎮 更新されたレイアウトのテスト開始...');
  
  const browser = await chromium.launch({ headless: false });
  const context = await browser.newContext();
  const page = await context.newPage();
  
  try {
    // ページアクセス
    console.log('📍 localhost:5173にアクセス中...');
    await page.goto('http://localhost:5173');
    await page.waitForLoadState('networkidle');
    
    // TRPGセッション画面に移動
    console.log('📍 TRPGセッション画面に移動中...');
    await page.getByText('TRPGセッション').click();
    await page.waitForTimeout(2000);
    
    // エラーバウンダリチェック
    const errorBoundary = await page.locator('text=TRPGセッションページでエラーが発生しました').count();
    if (errorBoundary > 0) {
      console.log('❌ エラーバウンダリが表示されています');
      await page.screenshot({ path: 'trpg-layout-error.png' });
      return;
    }
    
    console.log('✅ エラーバウンダリなし - 正常表示');
    
    // 基本表示確認
    console.log('📋 基本レイアウトを確認中...');
    await page.screenshot({ path: 'trpg-layout-test-01-basic.png' });
    
    // 左パネル（キャラクター情報）の確認
    console.log('👥 左パネル（キャラクター情報）確認...');
    const leftPanel = page.locator('text=パーティメンバーがいません').or(page.locator('text=パーティメンバー'));
    const leftPanelExists = await leftPanel.count();
    
    if (leftPanelExists > 0) {
      console.log('✅ 左パネル（キャラクター情報）が見つかりました');
    } else {
      console.log('⚠️ 左パネルが見つかりません');
    }
    
    // 中央パネル（チャット・セッションログ）の確認
    console.log('💬 中央パネル（チャット・セッションログ）確認...');
    const chatPanel = page.locator('text=チャット').or(page.locator('text=ダイス')).or(page.locator('text=ステータス'));
    const chatPanelExists = await chatPanel.count();
    
    if (chatPanelExists > 0) {
      console.log('✅ 中央パネル（チャット・セッションログ）が見つかりました');
    } else {
      console.log('⚠️ 中央パネルが見つかりません');
    }
    
    // 右パネル（行動・拠点情報）の確認
    console.log('🏰 右パネル（行動・拠点情報）確認...');
    const rightPanel = page.locator('text=場所の情報がありません').or(page.locator('text=場所を登録する'));
    const rightPanelExists = await rightPanel.count();
    
    if (rightPanelExists > 0) {
      console.log('✅ 右パネル（行動・拠点情報）が見つかりました');
    } else {
      console.log('⚠️ 右パネルが見つかりません');
    }
    
    // CharacterDisplayの詳細ビューのテスト
    console.log('🔍 CharacterDisplayの詳細ビューをテスト...');
    const tabItems = await page.locator('[role="tab"]').count();
    console.log(`タブアイテム数: ${tabItems}`);
    
    if (tabItems > 0) {
      // PC、NPC、敵のタブをチェック
      const tabLabels = ['PC', 'NPC', '敵'];
      for (let i = 0; i < Math.min(tabItems, tabLabels.length); i++) {
        const tab = page.locator('[role="tab"]').nth(i);
        const tabText = await tab.textContent();
        console.log(`タブ ${i + 1}: ${tabText}`);
        
        await tab.click();
        await page.waitForTimeout(500);
        await page.screenshot({ path: `trpg-layout-test-tab-${i}-${tabLabels[i]}.png` });
      }
    }
    
    // 最終スクリーンショット
    await page.screenshot({ path: 'trpg-layout-test-final.png' });
    
    console.log('✅ 更新されたレイアウトのテスト完了');
    
    // コンソールエラーの確認
    page.on('console', msg => {
      if (msg.type() === 'error') {
        console.log(`ブラウザコンソールエラー: ${msg.text()}`);
      }
    });
    
    console.log('📊 テスト結果:');
    console.log('- エラーバウンダリ: なし');
    console.log('- 左パネル（キャラクター）: ', leftPanelExists > 0 ? '✅' : '❌');
    console.log('- 中央パネル（チャット）: ', chatPanelExists > 0 ? '✅' : '❌');
    console.log('- 右パネル（行動・拠点）: ', rightPanelExists > 0 ? '✅' : '❌');
    
  } catch (error) {
    console.error('❌ テスト実行エラー:', error);
    await page.screenshot({ path: 'trpg-layout-test-error.png' });
  }
  
  // ブラウザを開いたままにする
  console.log('🔍 ブラウザを手動で確認してください。手動で閉じてください。');
})();