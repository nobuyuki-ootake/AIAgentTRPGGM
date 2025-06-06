const { chromium } = require('playwright');

async function testTRPGSession() {
  console.log('🚀 TRPGセッション画面の簡易テストを開始...');
  
  const browser = await chromium.launch({ 
    headless: false,
    slowMo: 1000
  });
  
  const page = await browser.newPage();
  
  try {
    // ホームページにアクセス
    console.log('📱 ホームページにアクセス...');
    await page.goto('http://localhost:5173');
    await page.waitForLoadState('networkidle');
    
    // スクリーンショット
    await page.screenshot({ path: 'test-results/01-home.png' });
    console.log('✅ ホームページ表示完了');
    
    // TRPGセッションページに直接アクセス
    console.log('🎮 TRPGセッションページにアクセス...');
    await page.goto('http://localhost:5173/trpg-session');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(3000);
    
    // スクリーンショット
    await page.screenshot({ path: 'test-results/02-trpg-session.png', fullPage: true });
    console.log('✅ TRPGセッションページ表示完了');
    
    // 基本要素の確認
    console.log('🔍 基本要素を確認中...');
    
    // ヘッダー確認
    const headers = await page.locator('h4, h5, h6').count();
    console.log(`   - ヘッダー要素: ${headers}個`);
    
    // ボタン確認
    const buttons = await page.locator('button').count();
    console.log(`   - ボタン要素: ${buttons}個`);
    
    // Paper要素確認
    const papers = await page.locator('.MuiPaper-root').count();
    console.log(`   - Paperコンポーネント: ${papers}個`);
    
    // Grid要素確認
    const grids = await page.locator('.MuiGrid-root').count();
    console.log(`   - Gridコンポーネント: ${grids}個`);
    
    // SessionHeaderの確認
    console.log('\n🧾 SessionHeaderコンポーネントの確認...');
    const sessionTitle = page.locator('h4:has-text("TRPG"), h4:has-text("セッション")');
    if (await sessionTitle.first().isVisible()) {
      console.log('✅ セッションタイトルが表示されています');
    } else {
      console.log('❌ セッションタイトルが見つかりません');
    }
    
    // 保存ボタンの確認
    const saveButton = page.locator('button:has-text("保存")');
    if (await saveButton.isVisible()) {
      console.log('✅ 保存ボタンが表示されています');
    } else {
      console.log('❌ 保存ボタンが見つかりません');
    }
    
    // パーティパネルの確認
    console.log('\n👥 PartyPanelコンポーネントの確認...');
    const partyText = page.locator('text=パーティメンバー');
    if (await partyText.isVisible()) {
      console.log('✅ パーティメンバー表示確認');
    } else {
      console.log('❌ パーティメンバーが見つかりません');
    }
    
    // タブの確認
    console.log('\n📋 タブコンポーネントの確認...');
    const tabs = page.locator('.MuiTabs-root .MuiTab-root');
    const tabCount = await tabs.count();
    console.log(`   - タブ数: ${tabCount}個`);
    
    if (tabCount > 0) {
      for (let i = 0; i < Math.min(tabCount, 3); i++) {
        try {
          await tabs.nth(i).click();
          await page.waitForTimeout(500);
          console.log(`✅ タブ ${i + 1} クリック成功`);
        } catch (error) {
          console.log(`❌ タブ ${i + 1} クリック失敗: ${error.message}`);
        }
      }
    }
    
    // ダイス機能の確認
    console.log('\n🎲 ダイス機能の確認...');
    const diceButtons = page.locator('button:has-text("基本ダイス"), button:has-text("D20"), button:has-text("ダイス")');
    const diceButtonCount = await diceButtons.count();
    console.log(`   - ダイスボタン数: ${diceButtonCount}個`);
    
    if (diceButtonCount > 0) {
      try {
        await diceButtons.first().click();
        await page.waitForTimeout(1000);
        console.log('✅ ダイスボタンクリック成功');
        
        // ダイアログの確認
        const dialog = page.locator('.MuiDialog-root, .MuiModal-root');
        if (await dialog.first().isVisible()) {
          console.log('✅ ダイスダイアログが開きました');
          
          // 最終スクリーンショット（ダイアログ付き）
          await page.screenshot({ path: 'test-results/03-dice-dialog.png', fullPage: true });
          
          // ダイアログを閉じる
          const closeButton = page.locator('button:has-text("キャンセル"), button:has-text("閉じる")');
          if (await closeButton.first().isVisible()) {
            await closeButton.first().click();
            console.log('✅ ダイアログを閉じました');
          } else {
            await page.keyboard.press('Escape');
            console.log('✅ Escキーでダイアログを閉じました');
          }
        } else {
          console.log('❌ ダイスダイアログが開きませんでした');
        }
      } catch (error) {
        console.log(`❌ ダイス機能テスト失敗: ${error.message}`);
      }
    }
    
    // 最終スクリーンショット
    await page.screenshot({ path: 'test-results/04-final-state.png', fullPage: true });
    
    console.log('\n📊 テスト結果サマリー:');
    console.log('=================================');
    console.log(`✅ ヘッダー要素: ${headers}個`);
    console.log(`✅ ボタン要素: ${buttons}個`);
    console.log(`✅ Paperコンポーネント: ${papers}個`);
    console.log(`✅ Gridコンポーネント: ${grids}個`);
    console.log(`✅ タブ数: ${tabCount}個`);
    console.log(`✅ ダイスボタン数: ${diceButtonCount}個`);
    console.log('=================================');
    
    if (headers > 0 && buttons > 0 && papers > 0) {
      console.log('🎉 TRPGセッション画面は正常に表示されています！');
    } else {
      console.log('⚠️ 一部のコンポーネントに問題があります');
    }
    
    console.log('\n⏰ 10秒後にブラウザを閉じます...');
    await page.waitForTimeout(10000);
    
  } catch (error) {
    console.error('❌ テスト中にエラーが発生しました:', error.message);
    await page.screenshot({ path: 'test-results/error.png', fullPage: true });
  } finally {
    await browser.close();
    console.log('✅ テスト完了');
  }
}

testTRPGSession().catch(console.error);