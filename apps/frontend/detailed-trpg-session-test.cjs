const { chromium } = require('playwright');

async function detailedTRPGSessionTest() {
  console.log('🎲 詳細TRPGセッション画面テストを開始します...');
  
  const browser = await chromium.launch({ headless: false });
  const context = await browser.newContext({
    viewport: { width: 1920, height: 1080 }
  });
  const page = await context.newPage();

  // コンソールメッセージをキャプチャ
  const consoleMessages = [];
  page.on('console', msg => {
    const type = msg.type();
    const text = msg.text();
    consoleMessages.push(`[${type.toUpperCase()}] ${text}`);
    if (type === 'error') {
      console.log(`❌ Console Error: ${text}`);
    }
  });

  try {
    // 直接TRPGセッション画面にアクセス
    console.log('🎮 TRPGセッション画面に直接アクセス');
    await page.goto('http://localhost:5173/trpg-session');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(3000); // 追加の読み込み待機

    // 初期スクリーンショット
    await page.screenshot({ 
      path: '/mnt/c/Users/irure/git/AIAgentTRPGGM/apps/frontend/test-results/detailed-01-initial.png',
      fullPage: true 
    });

    // ページの基本構造を確認
    console.log('🔍 ページの基本構造を確認');
    const bodyContent = await page.textContent('body');
    console.log(`📝 ページに表示されているテキストの一部: ${bodyContent.substring(0, 300)}...`);

    // TRPGセッション関連の要素を探す
    console.log('🎯 TRPGセッション関連要素の確認');
    
    // 一般的な要素を幅広くチェック
    const elementChecks = [
      { name: 'セッションヘッダー', selectors: ['[data-testid="session-header"]', '.session-header', 'header'] },
      { name: 'パーティーパネル', selectors: ['[data-testid="party-panel"]', '.party-panel', '.party'] },
      { name: 'キャラクター表示', selectors: ['[data-testid="character-display"]', '.character-display', '.character'] },
      { name: 'チャットインターフェース', selectors: ['[data-testid="chat-interface"]', '.chat-interface', '.chat'] },
      { name: 'ダイスUI', selectors: ['[data-testid="dice-ui"]', '.dice-ui', '.dice'] },
      { name: 'アクションボタン', selectors: ['button:has-text("攻撃")', 'button:has-text("スキル")', 'button:has-text("アクション")'] },
      { name: '敵選択UI', selectors: ['[data-testid="enemy-selector"]', '.enemy-selector', '.enemy-selection'] },
      { name: 'メインコンテンツ', selectors: ['main', '[role="main"]', '.main-content'] }
    ];

    for (const check of elementChecks) {
      let found = false;
      for (const selector of check.selectors) {
        const element = page.locator(selector);
        if (await element.count() > 0) {
          const visible = await element.first().isVisible();
          console.log(`✅ ${check.name}: ${selector} (表示: ${visible})`);
          found = true;
          break;
        }
      }
      if (!found) {
        console.log(`❌ ${check.name}: 見つかりません`);
      }
    }

    // すべてのボタンを確認
    console.log('\n🔘 ページ内のボタンを確認');
    const buttons = page.locator('button');
    const buttonCount = await buttons.count();
    console.log(`🔢 ボタン数: ${buttonCount}`);
    
    for (let i = 0; i < Math.min(buttonCount, 10); i++) {
      const button = buttons.nth(i);
      const text = await button.textContent() || '';
      const testId = await button.getAttribute('data-testid') || '';
      const visible = await button.isVisible();
      console.log(`🔘 ボタン ${i+1}: "${text.trim()}" (testid: ${testId}, 表示: ${visible})`);
    }

    // 攻撃アクションのテストを試行
    console.log('\n⚔️ 攻撃アクション機能のテスト');
    
    // 攻撃ボタンを探す（複数の方法で）
    const attackSelectors = [
      'button:has-text("攻撃")',
      'button[data-action="attack"]',
      'button[data-testid*="attack"]',
      '.attack-button',
      '[data-action-type="attack"]'
    ];

    let attackButton = null;
    for (const selector of attackSelectors) {
      const element = page.locator(selector);
      if (await element.count() > 0 && await element.first().isVisible()) {
        attackButton = element.first();
        console.log(`⚔️ 攻撃ボタン発見: ${selector}`);
        break;
      }
    }

    if (attackButton) {
      console.log('🎯 攻撃アクションを実行');
      await attackButton.click();
      await page.waitForTimeout(2000);

      // 敵選択UIが表示されるか確認
      const enemySelectors = [
        '[data-testid="enemy-selector"]',
        '.enemy-selection-dialog',
        '[role="dialog"]:has-text("敵")',
        '.enemy-list',
        '.target-selection'
      ];

      let enemyUIFound = false;
      for (const selector of enemySelectors) {
        const element = page.locator(selector);
        if (await element.count() > 0 && await element.first().isVisible()) {
          console.log(`👾 敵選択UI発見: ${selector}`);
          enemyUIFound = true;

          // 敵リストの詳細確認
          const enemyItems = element.locator('.enemy-item, .enemy-card, [data-enemy-id]');
          const enemyCount = await enemyItems.count();
          console.log(`👹 敵の数: ${enemyCount}`);

          // 敵のステータス情報を確認
          for (let i = 0; i < Math.min(enemyCount, 3); i++) {
            const enemy = enemyItems.nth(i);
            const enemyText = await enemy.textContent() || '';
            console.log(`👾 敵 ${i+1}: ${enemyText.substring(0, 100)}...`);
          }

          // スクリーンショット
          await page.screenshot({ 
            path: '/mnt/c/Users/irure/git/AIAgentTRPGGM/apps/frontend/test-results/detailed-02-enemy-selection.png',
            fullPage: true 
          });
          break;
        }
      }

      if (!enemyUIFound) {
        console.log('❌ 敵選択UIが表示されませんでした');
      }
    } else {
      console.log('❌ 攻撃ボタンが見つかりませんでした');
    }

    // DOM全体を調査
    console.log('\n🔍 DOM構造の詳細調査');
    const htmlContent = await page.content();
    
    // 敵関連データの確認
    const hasEnemyData = htmlContent.includes('enemy') || htmlContent.includes('敵') || htmlContent.includes('Enemy');
    console.log(`👾 敵関連データ: ${hasEnemyData}`);
    
    // EnemyCharacter型関連の確認
    const hasEnemyCharacter = htmlContent.includes('EnemyCharacter') || htmlContent.includes('enemyCharacter');
    console.log(`🏷️ EnemyCharacter型データ: ${hasEnemyCharacter}`);
    
    // HP、防御力、回避率の確認
    const hasHP = htmlContent.includes('hp') || htmlContent.includes('HP') || htmlContent.includes('ヒットポイント');
    const hasDefense = htmlContent.includes('defense') || htmlContent.includes('防御') || htmlContent.includes('Defence');
    const hasEvasion = htmlContent.includes('evasion') || htmlContent.includes('回避') || htmlContent.includes('Evasion');
    
    console.log(`❤️ HPデータ: ${hasHP}`);
    console.log(`🛡️ 防御力データ: ${hasDefense}`);
    console.log(`💨 回避率データ: ${hasEvasion}`);

    // 最終スクリーンショット
    await page.screenshot({ 
      path: '/mnt/c/Users/irure/git/AIAgentTRPGGM/apps/frontend/test-results/detailed-03-final.png',
      fullPage: true 
    });

    // コンソールメッセージの要約
    console.log('\n📝 コンソールメッセージの要約:');
    const errorMessages = consoleMessages.filter(msg => msg.includes('[ERROR]'));
    const warningMessages = consoleMessages.filter(msg => msg.includes('[WARN]'));
    
    console.log(`❌ エラー数: ${errorMessages.length}`);
    console.log(`⚠️ 警告数: ${warningMessages.length}`);
    
    if (errorMessages.length > 0) {
      console.log('\n❌ エラーメッセージ:');
      errorMessages.forEach(msg => console.log(msg));
    }

    console.log('\n✅ 詳細TRPGセッション画面テストが完了しました');

  } catch (error) {
    console.error('❌ テスト中にエラーが発生しました:', error);
    
    await page.screenshot({ 
      path: '/mnt/c/Users/irure/git/AIAgentTRPGGM/apps/frontend/test-results/detailed-error.png',
      fullPage: true 
    });
  } finally {
    await browser.close();
  }
}

detailedTRPGSessionTest().catch(console.error);