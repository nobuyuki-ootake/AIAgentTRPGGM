const { chromium } = require('playwright');

async function runTRPGSessionTest() {
  console.log('🎲 TRPGセッション画面総合テストを開始します...');
  
  const browser = await chromium.launch({ headless: false });
  const context = await browser.newContext({
    viewport: { width: 1920, height: 1080 }
  });
  const page = await context.newPage();

  try {
    // コンソールエラーをキャプチャ
    const consoleMessages = [];
    page.on('console', msg => {
      if (msg.type() === 'error') {
        consoleMessages.push(`❌ Console Error: ${msg.text()}`);
      } else if (msg.type() === 'warning') {
        consoleMessages.push(`⚠️ Console Warning: ${msg.text()}`);
      }
    });

    // ホーム画面に移動
    console.log('📍 Step 1: ホーム画面にアクセス');
    await page.goto('http://localhost:5173');
    await page.waitForLoadState('networkidle');
    
    // デベロッパーモード有効化
    console.log('🔧 Step 2: デベロッパーモードを有効化');
    const devToggle = page.locator('[data-testid="developer-mode-toggle"]');
    if (await devToggle.isVisible()) {
      await devToggle.click();
      console.log('✅ デベロッパーモードを有効化しました');
    }

    // キャンペーン作成（簡易版）
    console.log('🎯 Step 3: テストキャンペーンを作成');
    const newProjectButton = page.locator('button:has-text("新しいプロジェクト")');
    if (await newProjectButton.isVisible()) {
      await newProjectButton.click();
      await page.fill('input[name="title"]', 'TRPGセッションテスト');
      await page.fill('textarea[name="description"]', 'TRPGセッション機能のテスト用キャンペーン');
      await page.click('button:has-text("作成")');
      await page.waitForTimeout(2000);
    }

    // TRPGセッション画面に移動
    console.log('🎮 Step 4: TRPGセッション画面に移動');
    await page.click('a[href="/trpg-session"]');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(3000);

    // 画面の基本要素確認
    console.log('🔍 Step 5: 画面の基本要素を確認');
    
    // セッションヘッダーの確認
    const sessionHeader = page.locator('[data-testid="session-header"]');
    console.log(`📋 セッションヘッダー表示: ${await sessionHeader.isVisible()}`);
    
    // パーティーパネルの確認
    const partyPanel = page.locator('[data-testid="party-panel"]');
    console.log(`👥 パーティーパネル表示: ${await partyPanel.isVisible()}`);
    
    // チャットインターフェースの確認
    const chatInterface = page.locator('[data-testid="chat-interface"]');
    console.log(`💬 チャットインターフェース表示: ${await chatInterface.isVisible()}`);
    
    // ダイスUIの確認
    const diceUI = page.locator('[data-testid="dice-ui"]');
    console.log(`🎲 ダイスUI表示: ${await diceUI.isVisible()}`);

    // 初期スクリーンショット
    await page.screenshot({ 
      path: '/mnt/c/Users/irure/git/AIAgentTRPGGM/apps/frontend/test-results/trpg-session-01-initial.png',
      fullPage: true 
    });

    // 攻撃アクション選択のテスト
    console.log('⚔️ Step 6: 攻撃アクション選択をテスト');
    
    // アクション選択ボタンを探す
    const actionButtons = page.locator('button:has-text("攻撃"), button[data-action="attack"]');
    const actionButtonCount = await actionButtons.count();
    console.log(`🎯 攻撃アクションボタン数: ${actionButtonCount}`);
    
    if (actionButtonCount > 0) {
      await actionButtons.first().click();
      await page.waitForTimeout(2000);
      
      // 敵選択UIの確認
      console.log('👾 Step 7: 敵選択UIを確認');
      const enemySelector = page.locator('[data-testid="enemy-selector"], .enemy-selection-dialog, [role="dialog"]:has-text("敵")');
      const enemySelectorVisible = await enemySelector.isVisible();
      console.log(`🎯 敵選択UI表示: ${enemySelectorVisible}`);
      
      if (enemySelectorVisible) {
        // 敵リストの確認
        const enemyList = page.locator('[data-testid="enemy-list"] .enemy-card, .enemy-item');
        const enemyCount = await enemyList.count();
        console.log(`👹 表示されている敵の数: ${enemyCount}`);
        
        // 敵のステータス表示確認
        if (enemyCount > 0) {
          console.log('📊 Step 8: 敵のステータス表示を確認');
          for (let i = 0; i < Math.min(enemyCount, 3); i++) {
            const enemy = enemyList.nth(i);
            const name = await enemy.locator('.enemy-name, [data-field="name"]').textContent() || 'N/A';
            const hp = await enemy.locator('.enemy-hp, [data-field="hp"]').textContent() || 'N/A';
            const defense = await enemy.locator('.enemy-defense, [data-field="defense"]').textContent() || 'N/A';
            const evasion = await enemy.locator('.enemy-evasion, [data-field="evasion"]').textContent() || 'N/A';
            
            console.log(`👾 敵 ${i+1}: 名前=${name}, HP=${hp}, 防御力=${defense}, 回避率=${evasion}`);
          }
        }
        
        // 敵選択UIのスクリーンショット
        await page.screenshot({ 
          path: '/mnt/c/Users/irure/git/AIAgentTRPGGM/apps/frontend/test-results/trpg-session-02-enemy-selection.png',
          fullPage: true 
        });
        
        // キャンセルボタンのテスト
        console.log('❌ Step 9: キャンセル機能をテスト');
        const cancelButton = page.locator('button:has-text("キャンセル"), button[data-action="cancel"]');
        if (await cancelButton.isVisible()) {
          await cancelButton.click();
          await page.waitForTimeout(1000);
          
          const dialogClosed = !(await enemySelector.isVisible());
          console.log(`✅ キャンセル後のダイアログクローズ: ${dialogClosed}`);
        }
      }
    } else {
      console.log('⚠️ 攻撃アクションボタンが見つかりません - 別の方法でテストを試行');
      
      // 代替テスト: ダイスロールUIでの攻撃テスト
      const diceRollButton = page.locator('button:has-text("ダイスロール"), button[data-testid="dice-roll"]');
      if (await diceRollButton.isVisible()) {
        await diceRollButton.click();
        await page.waitForTimeout(2000);
      }
    }

    // 最終スクリーンショット
    await page.screenshot({ 
      path: '/mnt/c/Users/irure/git/AIAgentTRPGGM/apps/frontend/test-results/trpg-session-03-final.png',
      fullPage: true 
    });

    // コンソールエラーの報告
    console.log('\n📝 コンソールメッセージの確認:');
    if (consoleMessages.length > 0) {
      consoleMessages.forEach(msg => console.log(msg));
    } else {
      console.log('✅ コンソールエラーは検出されませんでした');
    }

    // DOMの詳細確認
    console.log('\n🔍 DOM要素の詳細確認:');
    const pageContent = await page.content();
    const hasEnemyData = pageContent.includes('enemy') || pageContent.includes('敵') || pageContent.includes('Enemy');
    console.log(`👾 敵関連データの存在: ${hasEnemyData}`);
    
    const hasCharacterData = pageContent.includes('character') || pageContent.includes('キャラクター') || pageContent.includes('Character');
    console.log(`👤 キャラクターデータの存在: ${hasCharacterData}`);

    console.log('\n✅ TRPGセッション画面テストが完了しました');

  } catch (error) {
    console.error('❌ テスト中にエラーが発生しました:', error);
    
    // エラー時のスクリーンショット
    await page.screenshot({ 
      path: '/mnt/c/Users/irure/git/AIAgentTRPGGM/apps/frontend/test-results/trpg-session-error.png',
      fullPage: true 
    });
  } finally {
    await browser.close();
  }
}

runTRPGSessionTest().catch(console.error);