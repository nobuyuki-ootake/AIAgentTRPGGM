import { test, expect } from '@playwright/test';

test('TRPG Enemy Selection UI Test', async ({ page }) => {
  // 開発サーバーにアクセス
  await page.goto('http://localhost:5174/trpg-session');
  
  // ページが読み込まれるまで待機
  await page.waitForLoadState('networkidle');
  
  // エラーをキャッチ
  const errors: string[] = [];
  page.on('console', msg => {
    if (msg.type() === 'error') {
      errors.push(msg.text());
    }
  });
  
  // MainContentPanelが表示されるまで待機
  const mainContent = page.locator('[role="tabpanel"]').first();
  await expect(mainContent).toBeVisible({ timeout: 10000 });
  
  // 攻撃アクションを探す
  const attackButton = page.locator('button').filter({ hasText: '攻撃' });
  
  if (await attackButton.count() > 0) {
    console.log('攻撃ボタンが見つかりました');
    
    // 攻撃ボタンをクリック
    await attackButton.first().click();
    
    // 敵選択UIが表示されるまで待機
    const enemySelectionPanel = page.locator('text=攻撃対象を選択');
    await expect(enemySelectionPanel).toBeVisible({ timeout: 5000 });
    
    console.log('敵選択UIが表示されました');
    
    // 敵リストの確認
    const enemyCards = page.locator('[class*="MuiCard-root"]').filter({ has: page.locator('text=/盗賊|狼|鷲|守護者/') });
    const enemyCount = await enemyCards.count();
    console.log(`表示されている敵の数: ${enemyCount}`);
    
    // 各敵のステータス表示を確認
    for (let i = 0; i < Math.min(enemyCount, 3); i++) {
      const enemyCard = enemyCards.nth(i);
      const hpText = await enemyCard.locator('text=/HP:.*\\d+\\/\\d+/').textContent();
      const defenseChip = await enemyCard.locator('text=/防御:\\d+/').textContent();
      const levelChip = await enemyCard.locator('text=/Lv:\\d+/').textContent();
      
      console.log(`敵${i + 1}のステータス:`, {
        hp: hpText,
        defense: defenseChip,
        level: levelChip
      });
    }
    
    // スクリーンショットを撮影
    await page.screenshot({ path: 'enemy-selection-ui.png', fullPage: true });
    
    // キャンセルボタンの動作確認
    const cancelButton = page.locator('button').filter({ hasText: 'キャンセル' });
    await cancelButton.click();
    
    // 敵選択UIが閉じることを確認
    await expect(enemySelectionPanel).not.toBeVisible({ timeout: 3000 });
    
    console.log('敵選択UIのテスト完了');
  } else {
    console.log('攻撃ボタンが見つかりません - availableActionsを確認してください');
    
    // 現在の画面状態をスクリーンショット
    await page.screenshot({ path: 'no-attack-button.png', fullPage: true });
  }
  
  // エラーチェック
  if (errors.length > 0) {
    console.error('コンソールエラー:', errors);
  }
  
  expect(errors).toHaveLength(0);
});