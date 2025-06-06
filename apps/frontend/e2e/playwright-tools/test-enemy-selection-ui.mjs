import { chromium } from '@playwright/test';

async function testEnemySelectionUI() {
  const browser = await chromium.launch({ headless: false });
  const page = await browser.newPage();
  
  try {
    console.log('🎮 TRPGセッション画面へアクセス...');
    await page.goto('http://localhost:5173/trpg-session');
    await page.waitForLoadState('networkidle');
    
    // エラーをキャッチ
    const errors = [];
    page.on('console', msg => {
      if (msg.type() === 'error') {
        errors.push(msg.text());
        console.error('❌ コンソールエラー:', msg.text());
      }
    });
    
    // 画面の読み込み待機
    await page.waitForTimeout(2000);
    
    // テストデータをロード
    console.log('📦 テストデータをロード...');
    await page.evaluate(() => {
      // localStorage経由でテストデータを設定
      const testCampaign = {
        id: 'test-campaign-001',
        title: '竜の谷の秘宝',
        enemies: [
          {
            id: 'bandit-leader',
            name: '盗賊団の頭領',
            rank: '中ボス',
            type: '人間',
            level: 3,
            derivedStats: { hp: 45, defense: 8, evasion: 65 },
            status: { currentHp: 45, currentMp: 10, statusEffects: [], location: '翠の森道' }
          },
          {
            id: 'bandit-scout-1',
            name: '盗賊の斥候A',
            rank: 'モブ',
            type: '人間',
            level: 1,
            derivedStats: { hp: 25, defense: 5, evasion: 75 },
            status: { currentHp: 25, currentMp: 5, statusEffects: [], location: '翠の森道' }
          }
        ]
      };
      localStorage.setItem('current-campaign', JSON.stringify(testCampaign));
      
      // ページをリロードしてデータを反映
      window.location.reload();
    });
    
    // リロード後の待機
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);
    
    // 現在の画面状態をスクリーンショット
    await page.screenshot({ path: 'trpg-session-initial-state.png', fullPage: true });
    console.log('📸 初期状態のスクリーンショットを保存しました');
    
    // MainContentPanelを探す
    const mainContent = await page.locator('[role="tabpanel"]').first();
    const mainContentVisible = await mainContent.isVisible();
    console.log('📊 MainContentPanel表示:', mainContentVisible);
    
    if (!mainContentVisible) {
      console.log('⚠️ MainContentPanelが表示されていません');
      return;
    }
    
    // 攻撃ボタンを探す
    const attackButtons = await page.locator('button').filter({ hasText: '攻撃' }).all();
    console.log(`🔍 攻撃ボタン数: ${attackButtons.length}`);
    
    if (attackButtons.length > 0) {
      console.log('⚔️ 攻撃ボタンをクリック...');
      await attackButtons[0].click();
      
      // 敵選択UIが表示されるまで待機
      await page.waitForTimeout(1000);
      
      // 敵選択UIの確認
      const enemySelectionTitle = await page.locator('text=攻撃対象を選択').isVisible();
      console.log('🎯 敵選択UI表示:', enemySelectionTitle);
      
      if (enemySelectionTitle) {
        // 敵選択UIのスクリーンショット
        await page.screenshot({ path: 'enemy-selection-ui-active.png', fullPage: true });
        console.log('📸 敵選択UIのスクリーンショットを保存しました');
        
        // 敵カードの情報を取得
        const enemyCards = await page.locator('[class*="MuiCard-root"]').all();
        console.log(`👹 表示されている敵カード数: ${enemyCards.length}`);
        
        // 各敵の情報を表示
        for (let i = 0; i < Math.min(enemyCards.length, 3); i++) {
          try {
            const enemyCard = enemyCards[i];
            const nameElement = await enemyCard.locator('[class*="MuiTypography-subtitle2"]').first();
            const name = await nameElement.textContent();
            
            const hpElement = await enemyCard.locator('text=/HP:.*\\d+\\/\\d+/');
            const hp = await hpElement.textContent();
            
            console.log(`敵${i + 1}: ${name} - ${hp}`);
          } catch (e) {
            console.log(`敵${i + 1}の情報取得エラー:`, e.message);
          }
        }
        
        // キャンセルボタンをクリック
        const cancelButton = await page.locator('button').filter({ hasText: 'キャンセル' }).first();
        if (await cancelButton.isVisible()) {
          await cancelButton.click();
          console.log('✅ キャンセルボタンをクリックしました');
        }
      }
    } else {
      console.log('⚠️ 攻撃ボタンが見つかりません');
      
      // 現在のavailableActionsを確認
      const actionButtons = await page.locator('button[class*="MuiButton-outlined"]').all();
      console.log(`📊 利用可能なアクション数: ${actionButtons.length}`);
      
      for (let i = 0; i < Math.min(actionButtons.length, 5); i++) {
        const text = await actionButtons[i].textContent();
        console.log(`  アクション${i + 1}: ${text}`);
      }
    }
    
    console.log('\n✅ テスト完了');
    console.log(`エラー数: ${errors.length}`);
    
  } catch (error) {
    console.error('❌ テストエラー:', error);
    await page.screenshot({ path: 'test-error.png', fullPage: true });
  } finally {
    await page.waitForTimeout(5000); // 結果を確認するため
    await browser.close();
  }
}

testEnemySelectionUI().catch(console.error);