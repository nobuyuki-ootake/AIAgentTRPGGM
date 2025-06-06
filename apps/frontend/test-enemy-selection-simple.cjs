const { chromium } = require('playwright');

(async () => {
  console.log('🎮 敵選択機能の簡単テスト開始...');
  
  const browser = await chromium.launch({ headless: false });
  const context = await browser.newContext();
  const page = await context.newPage();
  
  try {
    // 直接TRPGセッション画面にアクセス
    console.log('📍 TRPGセッション画面に直接アクセス中...');
    await page.goto('http://localhost:5173/#/trpg-session');
    await page.waitForTimeout(3000);
    
    // エラーバウンダリチェック
    const errorBoundary = await page.locator('text=TRPGセッションページでエラーが発生しました').count();
    if (errorBoundary > 0) {
      console.log('❌ エラーバウンダリが表示されています');
      await page.screenshot({ path: 'enemy-selection-simple-error.png' });
      return;
    }
    
    console.log('✅ エラーバウンダリなし - 正常表示');
    
    // 基本表示確認
    console.log('📋 基本表示を確認中...');
    await page.screenshot({ path: 'enemy-selection-simple-01-basic.png' });
    
    // 右パネルの探索タブを確認
    console.log('🔍 探索タブを確認中...');
    const explorationTab = page.locator('text=探索').first();
    const explorationExists = await explorationTab.count();
    
    if (explorationExists > 0) {
      await explorationTab.click();
      await page.waitForTimeout(1000);
      console.log('✅ 探索タブをクリックしました');
    }
    
    // 攻撃ボタンを探す（右パネル内）
    console.log('⚔️ 攻撃ボタンを確認中...');
    const attackButton = page.locator('button').filter({ hasText: '攻撃' });
    const attackButtonExists = await attackButton.count();
    
    console.log(`攻撃ボタン数: ${attackButtonExists}`);
    
    if (attackButtonExists > 0) {
      console.log('✅ 攻撃ボタンが見つかりました');
      await page.screenshot({ path: 'enemy-selection-simple-02-attack-button.png' });
      
      // 攻撃ボタンをクリック
      console.log('🎯 攻撃ボタンをクリック...');
      await attackButton.first().click();
      await page.waitForTimeout(2000);
      
      await page.screenshot({ path: 'enemy-selection-simple-03-after-click.png' });
      
      // 敵選択UIの確認
      const enemySelectionTitle = page.locator('text=攻撃対象を選択');
      const enemySelectionExists = await enemySelectionTitle.count();
      
      if (enemySelectionExists > 0) {
        console.log('✅ 敵選択UIが表示されました');
        await page.screenshot({ path: 'enemy-selection-simple-04-enemy-ui.png' });
      } else {
        console.log('⚠️ 敵選択UIが表示されませんでした');
      }
      
    } else {
      console.log('⚠️ 攻撃ボタンが見つかりません');
      
      // 利用可能なボタンを確認
      const allButtons = await page.locator('button').allTextContents();
      console.log('利用可能なボタン:', allButtons);
    }
    
    // 最終スクリーンショット
    await page.screenshot({ path: 'enemy-selection-simple-final.png' });
    
    console.log('✅ 敵選択機能の簡単テスト完了');
    
  } catch (error) {
    console.error('❌ テスト実行エラー:', error);
    await page.screenshot({ path: 'enemy-selection-simple-test-error.png' });
  }
  
  // ブラウザを開いたままにする
  console.log('🔍 ブラウザを手動で確認してください。手動で閉じてください。');
})();