const { chromium } = require('playwright');

async function verifyTRPGSessionPage() {
  console.log('🚀 TRPGセッション画面の動作確認を開始します...');
  
  // Chromiumブラウザを起動
  const browser = await chromium.launch({ 
    headless: false,
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });
  
  const context = await browser.newContext({
    viewport: { width: 1920, height: 1080 }
  });
  
  const page = await context.newPage();
  
  try {
    // コンソールログを監視
    page.on('console', msg => {
      if (msg.type() === 'error') {
        console.error('❌ Console Error:', msg.text());
      } else if (msg.type() === 'warning') {
        console.warn('⚠️ Console Warning:', msg.text());
      } else {
        console.log('💬 Console:', msg.text());
      }
    });

    // エラーを監視
    page.on('pageerror', error => {
      console.error('❌ Page Error:', error.message);
    });

    console.log('📱 ホームページにアクセス中...');
    await page.goto('http://localhost:5174');
    await page.waitForLoadState('networkidle');
    
    // ホームページのスクリーンショット
    await page.screenshot({ 
      path: 'test-results/01-home-page.png',
      fullPage: true 
    });
    console.log('✅ ホームページ表示完了');

    // 開発者モードを有効にする
    console.log('🛠️ 開発者モードを有効化...');
    const devModeToggle = page.locator('[data-testid="developer-mode-toggle"]')
      .or(page.locator('text=開発者モード'))
      .or(page.locator('input[type="checkbox"]').first());
    
    if (await devModeToggle.isVisible()) {
      await devModeToggle.click();
      console.log('✅ 開発者モード有効化完了');
    }

    // TRPGセッションページに移動
    console.log('🎮 TRPGセッションページにナビゲート中...');
    
    // サイドバーまたはナビゲーションでTRPGセッションリンクを探す
    const sessionLink = page.locator('a[href*="/trpg-session"]')
      .or(page.locator('text=TRPGセッション'))
      .or(page.locator('text=セッション'))
      .or(page.locator('[data-testid="trpg-session-link"]'));
    
    if (await sessionLink.isVisible()) {
      await sessionLink.click();
      console.log('✅ TRPGセッションリンクをクリック');
    } else {
      // 直接URLでアクセス
      await page.goto('http://localhost:5174/trpg-session');
      console.log('✅ 直接URLでTRPGセッションページにアクセス');
    }
    
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000); // 追加の待機時間

    // TRPGセッションページのスクリーンショット
    await page.screenshot({ 
      path: 'test-results/02-trpg-session-page.png',
      fullPage: true 
    });

    console.log('🔍 TRPGセッションページの要素を確認中...');

    // 主要コンポーネントの存在確認
    const checks = [
      {
        name: 'SessionHeader',
        selector: '[data-testid="session-header"],.MuiPaper-root:has(h4)',
        description: 'セッションヘッダー'
      },
      {
        name: 'PartyPanel', 
        selector: '[data-testid="party-panel"],text=パーティメンバー',
        description: 'パーティパネル'
      },
      {
        name: 'MainContentPanel',
        selector: '[data-testid="main-content-panel"],.MuiTabs-root',
        description: 'メインコンテンツパネル'
      },
      {
        name: 'ChatAndDicePanel',
        selector: '[data-testid="chat-dice-panel"],text=チャット',
        description: 'チャット・ダイスパネル'
      },
      {
        name: 'DiceButtons',
        selector: 'button:has-text("D20"),button:has-text("ダイス")',
        description: 'ダイスボタン'
      }
    ];

    const results = {};
    for (const check of checks) {
      try {
        const element = page.locator(check.selector).first();
        const isVisible = await element.isVisible();
        results[check.name] = isVisible;
        
        if (isVisible) {
          console.log(`✅ ${check.description} が表示されています`);
        } else {
          console.log(`❌ ${check.description} が見つかりません`);
        }
      } catch (error) {
        console.log(`❌ ${check.description} のチェック中にエラー: ${error.message}`);
        results[check.name] = false;
      }
    }

    // タブの動作確認
    console.log('🔄 タブの動作確認中...');
    const tabs = await page.locator('.MuiTabs-root .MuiTab-root').all();
    console.log(`📋 タブ数: ${tabs.length}`);
    
    for (let i = 0; i < Math.min(tabs.length, 3); i++) {
      try {
        await tabs[i].click();
        await page.waitForTimeout(500);
        console.log(`✅ タブ ${i + 1} をクリック完了`);
      } catch (error) {
        console.log(`❌ タブ ${i + 1} のクリックに失敗: ${error.message}`);
      }
    }

    // ダイスボタンのテスト
    console.log('🎲 ダイス機能のテスト中...');
    const diceButton = page.locator('button:has-text("D20"),button:has-text("ダイス"),button:has-text("基本ダイス")').first();
    
    if (await diceButton.isVisible()) {
      await diceButton.click();
      await page.waitForTimeout(1000);
      console.log('✅ ダイスボタンをクリック完了');
      
      // ダイアログが開いたかチェック
      const dialog = page.locator('.MuiDialog-root,.MuiModal-root').first();
      if (await dialog.isVisible()) {
        console.log('✅ ダイスダイアログが開きました');
        
        // ダイアログを閉じる
        const closeButton = page.locator('button:has-text("キャンセル"),button:has-text("閉じる"),.MuiDialogActions-root button').first();
        if (await closeButton.isVisible()) {
          await closeButton.click();
          console.log('✅ ダイアログを閉じました');
        }
      }
    }

    // 最終スクリーンショット
    await page.screenshot({ 
      path: 'test-results/03-trpg-session-final.png',
      fullPage: true 
    });

    console.log('\n📊 動作確認結果:');
    console.log('================================');
    Object.entries(results).forEach(([component, status]) => {
      console.log(`${status ? '✅' : '❌'} ${component}: ${status ? '正常' : '未確認'}`);
    });
    console.log('================================');

    const successCount = Object.values(results).filter(Boolean).length;
    const totalCount = Object.keys(results).length;
    console.log(`\n🎯 成功率: ${successCount}/${totalCount} (${Math.round(successCount/totalCount*100)}%)`);

    if (successCount === totalCount) {
      console.log('🎉 すべてのコンポーネントが正常に動作しています！');
    } else {
      console.log('⚠️ 一部のコンポーネントに問題があります。');
    }

  } catch (error) {
    console.error('❌ テスト中にエラーが発生しました:', error.message);
    await page.screenshot({ 
      path: 'test-results/error-screenshot.png',
      fullPage: true 
    });
  }

  // ブラウザを開いたままにして手動確認を可能にする
  console.log('\n🔍 ブラウザは開いたままです。手動で確認してください。');
  console.log('💡 確認が完了したら、このプロセスを終了してください（Ctrl+C）');
  
  // プロセスを開いたままにする
  await new Promise(() => {});
}

verifyTRPGSessionPage().catch(console.error);