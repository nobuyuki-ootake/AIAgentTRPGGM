const { chromium } = require('playwright');

(async () => {
  console.log('🎮 敵選択機能のテスト開始...');
  
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
      await page.screenshot({ path: 'enemy-selection-error.png' });
      return;
    }
    
    console.log('✅ エラーバウンダリなし - 正常表示');
    
    // 基本表示確認
    console.log('📋 基本表示を確認中...');
    await page.screenshot({ path: 'enemy-selection-test-01-basic.png' });
    
    // テストデータをロード
    console.log('🔄 テストデータをロード中...');
    const debugPanel = page.locator('button[aria-label="デバッグパネルを開く"]').or(page.getByText('デバッグ'));
    const debugExists = await debugPanel.count();
    
    if (debugExists > 0) {
      await debugPanel.click();
      await page.waitForTimeout(1000);
      
      const loadTestDataButton = page.getByText('テストデータをロード');
      const loadButtonExists = await loadTestDataButton.count();
      
      if (loadButtonExists > 0) {
        console.log('📊 テストデータをロード中...');
        await loadTestDataButton.click();
        await page.waitForTimeout(2000);
        await page.screenshot({ path: 'enemy-selection-test-02-data-loaded.png' });
      }
    }
    
    // 右パネル（行動選択）で攻撃ボタンを探す
    console.log('⚔️ 攻撃ボタンを確認中...');
    const attackButton = page.locator('text=攻撃').first();
    const attackButtonExists = await attackButton.count();
    
    if (attackButtonExists > 0) {
      console.log('✅ 攻撃ボタンが見つかりました');
      await page.screenshot({ path: 'enemy-selection-test-03-attack-button.png' });
      
      // 攻撃ボタンをクリック
      console.log('🎯 攻撃ボタンをクリック...');
      await attackButton.click();
      await page.waitForTimeout(1000);
      
      // 敵選択UIが表示されるかチェック
      const enemySelectionTitle = page.locator('text=攻撃対象を選択');
      const enemySelectionExists = await enemySelectionTitle.count();
      
      if (enemySelectionExists > 0) {
        console.log('✅ 敵選択UIが表示されました');
        await page.screenshot({ path: 'enemy-selection-test-04-enemy-ui.png' });
        
        // 敵リストの確認
        const enemyCards = page.locator('[class*="MuiCard-root"]').filter({ hasText: '盗賊' });
        const enemyCount = await enemyCards.count();
        console.log(`🎯 敵カード数: ${enemyCount}`);
        
        if (enemyCount > 0) {
          // 最初の敵を選択
          console.log('👹 敵を選択中...');
          await enemyCards.first().click();
          await page.waitForTimeout(500);
          await page.screenshot({ path: 'enemy-selection-test-05-enemy-selected.png' });
          
          // 攻撃実行ボタンを探す
          const attackExecuteButton = page.locator('text=攻撃実行');
          const executeButtonExists = await attackExecuteButton.count();
          
          if (executeButtonExists > 0) {
            console.log('⚔️ 攻撃実行ボタンが有効になりました');
            await attackExecuteButton.click();
            await page.waitForTimeout(1000);
            await page.screenshot({ path: 'enemy-selection-test-06-attack-executed.png' });
          }
        }
        
        // キャンセルボタンのテスト
        const cancelButton = page.locator('text=キャンセル');
        const cancelExists = await cancelButton.count();
        
        if (cancelExists > 0) {
          console.log('🔙 キャンセル機能をテスト...');
          await cancelButton.click();
          await page.waitForTimeout(500);
          await page.screenshot({ path: 'enemy-selection-test-07-cancelled.png' });
        }
        
      } else {
        console.log('⚠️ 敵選択UIが表示されませんでした');
      }
      
    } else {
      console.log('⚠️ 攻撃ボタンが見つかりません');
    }
    
    // 最終スクリーンショット
    await page.screenshot({ path: 'enemy-selection-test-final.png' });
    
    console.log('✅ 敵選択機能のテスト完了');
    
    // テスト結果サマリー
    console.log('📊 テスト結果:');
    console.log('- エラーバウンダリ: なし');
    console.log('- 攻撃ボタン: ', attackButtonExists > 0 ? '✅' : '❌');
    console.log('- 敵選択UI: ', enemySelectionExists > 0 ? '✅' : '❌');
    console.log('- 敵カード数: ', enemyCount || 0);
    
  } catch (error) {
    console.error('❌ テスト実行エラー:', error);
    await page.screenshot({ path: 'enemy-selection-test-error.png' });
  }
  
  // ブラウザを開いたままにする
  console.log('🔍 ブラウザを手動で確認してください。手動で閉じてください。');
})();