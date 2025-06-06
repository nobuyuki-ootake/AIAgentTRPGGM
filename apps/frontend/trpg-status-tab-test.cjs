const { chromium } = require('playwright');

(async () => {
  console.log('🎮 TRPGステータスタブテスト開始...');
  
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
      await page.screenshot({ path: 'trpg-error-boundary.png' });
      return;
    }
    
    // 基本表示確認
    console.log('📋 基本表示を確認中...');
    await page.screenshot({ path: 'trpg-status-test-01-initial.png' });
    
    // ステータスタブをクリック
    console.log('📊 ステータスタブをクリック...');
    const statusTab = page.locator('text=ステータス');
    const statusTabExists = await statusTab.count();
    
    if (statusTabExists > 0) {
      await statusTab.click();
      await page.waitForTimeout(1000);
      await page.screenshot({ path: 'trpg-status-test-02-status-tab.png' });
      console.log('✅ ステータスタブが正常に動作');
    } else {
      console.log('⚠️ ステータスタブが見つかりません');
    }
    
    // パーティパネル確認
    console.log('👥 パーティパネルを確認中...');
    const partyPanel = page.locator('[aria-label="パーティ"]').or(page.locator('text=パーティメンバー'));
    const partyExists = await partyPanel.count();
    
    if (partyExists > 0) {
      console.log('✅ パーティパネルが見つかりました');
    } else {
      console.log('⚠️ パーティパネルが見つかりません');
    }
    
    // 最終スクリーンショット
    await page.screenshot({ path: 'trpg-status-test-03-final.png' });
    
    console.log('✅ TRPGステータスタブテスト完了');
    
  } catch (error) {
    console.error('❌ テスト実行エラー:', error);
    await page.screenshot({ path: 'trpg-status-test-error.png' });
  }
  
  // ブラウザを開いたままにする
  console.log('🔍 ブラウザを手動で確認してください。手動で閉じてください。');
})();