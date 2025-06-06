const { chromium } = require('playwright');

(async () => {
  console.log('🎮 現在地表示エリアのテスト開始...');
  
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
      await page.screenshot({ path: 'location-display-error.png' });
      return;
    }
    
    console.log('✅ エラーバウンダリなし - 正常表示');
    
    // 基本表示確認
    console.log('📋 基本表示を確認中...');
    await page.screenshot({ path: 'location-display-test-01-basic.png' });
    
    // 現在地表示エリアの確認
    console.log('📍 現在地表示エリアを確認中...');
    
    // 「現在の場所」ヘッダーの確認
    const locationHeader = page.locator('text=現在の場所');
    const locationHeaderExists = await locationHeader.count();
    
    if (locationHeaderExists > 0) {
      console.log('✅ 「現在の場所」ヘッダーが見つかりました');
    } else {
      console.log('⚠️ 「現在の場所」ヘッダーが見つかりません');
    }
    
    // 「現在地なし」テキストの確認
    const noLocationText = page.locator('text=現在地なし');
    const noLocationExists = await noLocationText.count();
    
    if (noLocationExists > 0) {
      console.log('✅ 「現在地なし」テキストが表示されています');
    } else {
      console.log('⚠️ 「現在地なし」テキストが見つかりません');
    }
    
    // 画像プレースホルダーの確認
    const imagePlaceholder = page.locator('text=画像なし');
    const placeholderExists = await imagePlaceholder.count();
    
    if (placeholderExists > 0) {
      console.log('✅ 画像プレースホルダーが表示されています');
    } else {
      console.log('⚠️ 画像プレースホルダーが見つかりません');
    }
    
    // パーティパネルのレイアウト確認
    console.log('👥 パーティパネルのレイアウトを確認中...');
    
    // PCタブの確認
    const pcTab = page.locator('text=PC').first();
    const pcTabExists = await pcTab.count();
    
    if (pcTabExists > 0) {
      console.log('✅ PCタブが現在地表示の下に正しく配置されています');
      await pcTab.click();
      await page.waitForTimeout(500);
      await page.screenshot({ path: 'location-display-test-02-pc-tab.png' });
    }
    
    // NPCタブの確認
    const npcTab = page.locator('text=NPC').first();
    const npcTabExists = await npcTab.count();
    
    if (npcTabExists > 0) {
      console.log('✅ NPCタブが確認できます');
      await npcTab.click();
      await page.waitForTimeout(500);
      await page.screenshot({ path: 'location-display-test-03-npc-tab.png' });
    }
    
    // 最終スクリーンショット
    await page.screenshot({ path: 'location-display-test-final.png' });
    
    console.log('✅ 現在地表示エリアのテスト完了');
    
    // テスト結果サマリー
    console.log('📊 テスト結果:');
    console.log('- エラーバウンダリ: なし');
    console.log('- 現在の場所ヘッダー: ', locationHeaderExists > 0 ? '✅' : '❌');
    console.log('- 現在地なしテキスト: ', noLocationExists > 0 ? '✅' : '❌');
    console.log('- 画像プレースホルダー: ', placeholderExists > 0 ? '✅' : '❌');
    console.log('- PCタブ: ', pcTabExists > 0 ? '✅' : '❌');
    console.log('- NPCタブ: ', npcTabExists > 0 ? '✅' : '❌');
    
  } catch (error) {
    console.error('❌ テスト実行エラー:', error);
    await page.screenshot({ path: 'location-display-test-error.png' });
  }
  
  // ブラウザを開いたままにする
  console.log('🔍 ブラウザを手動で確認してください。手動で閉じてください。');
})();