const { chromium } = require('playwright');

(async () => {
  console.log('🎮 パーティパネル修正のテスト開始...');
  
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
      await page.screenshot({ path: 'party-panel-error.png' });
      return;
    }
    
    console.log('✅ エラーバウンダリなし - 正常表示');
    
    // 基本表示確認
    console.log('📋 基本表示を確認中...');
    await page.screenshot({ path: 'party-panel-test-01-basic.png' });
    
    // パーティパネルの確認
    console.log('👥 パーティパネルの構成を確認中...');
    
    // PCタブの確認
    const pcTab = page.locator('text=PC').first();
    const pcTabExists = await pcTab.count();
    
    if (pcTabExists > 0) {
      console.log('✅ PCタブが見つかりました');
      await pcTab.click();
      await page.waitForTimeout(500);
      await page.screenshot({ path: 'party-panel-test-02-pc-tab.png' });
    } else {
      console.log('⚠️ PCタブが見つかりません');
    }
    
    // NPCタブの確認
    const npcTab = page.locator('text=NPC').first();
    const npcTabExists = await npcTab.count();
    
    if (npcTabExists > 0) {
      console.log('✅ NPCタブが見つかりました');
      await npcTab.click();
      await page.waitForTimeout(500);
      await page.screenshot({ path: 'party-panel-test-03-npc-tab.png' });
    } else {
      console.log('⚠️ NPCタブが見つかりません');
    }
    
    // 敵タブが除去されたかの確認
    const enemyTab = page.locator('text=敵').first();
    const enemyTabExists = await enemyTab.count();
    
    if (enemyTabExists === 0) {
      console.log('✅ 敵タブが正常に除去されました');
    } else {
      console.log('⚠️ 敵タブがまだ存在しています');
    }
    
    // タブの総数確認
    const tabCount = await page.locator('[role="tab"]').count();
    console.log(`📊 タブ総数: ${tabCount}`);
    
    // 最終スクリーンショット
    await page.screenshot({ path: 'party-panel-test-final.png' });
    
    console.log('✅ パーティパネル修正テスト完了');
    
    // テスト結果サマリー
    console.log('📊 テスト結果:');
    console.log('- エラーバウンダリ: なし');
    console.log('- PCタブ: ', pcTabExists > 0 ? '✅' : '❌');
    console.log('- NPCタブ: ', npcTabExists > 0 ? '✅' : '❌');
    console.log('- 敵タブ除去: ', enemyTabExists === 0 ? '✅' : '❌');
    console.log(`- 総タブ数: ${tabCount}`);
    
  } catch (error) {
    console.error('❌ テスト実行エラー:', error);
    await page.screenshot({ path: 'party-panel-test-error.png' });
  }
  
  // ブラウザを開いたままにする
  console.log('🔍 ブラウザを手動で確認してください。手動で閉じてください。');
})();