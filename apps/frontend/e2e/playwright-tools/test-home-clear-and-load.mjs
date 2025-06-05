import { chromium } from 'playwright';

(async () => {
  console.log('🧹 ホーム画面でデータクリア→テストデータ読み込みテスト開始');
  
  const browser = await chromium.launch({ 
    headless: false,
    devtools: true,
    slowMo: 1000
  });
  
  const context = await browser.newContext();
  const page = await context.newPage();
  
  // ログ監視
  page.on('console', msg => {
    console.log(`📋 [${msg.type()}]: ${msg.text()}`);
  });
  
  try {
    console.log('🎯 Step 1: ホーム画面にアクセス');
    await page.goto('http://localhost:5173/', { 
      waitUntil: 'domcontentloaded',
      timeout: 30000 
    });
    
    await page.waitForTimeout(3000);
    
    console.log('🧹 Step 2: 既存のキャンペーンデータをクリア');
    await page.evaluate(() => {
      // localStorageをクリア
      const keysToRemove = [];
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && (key.includes('trpgCampaigns') || key.includes('currentCampaign'))) {
          keysToRemove.push(key);
        }
      }
      keysToRemove.forEach(key => localStorage.removeItem(key));
      console.log('🧹 localStorageをクリアしました:', keysToRemove);
    });
    
    // ページをリロードして状態を反映
    console.log('🔄 ページをリロード');
    await page.reload({ waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(3000);
    
    console.log('🔍 Step 3: クリア後のキャンペーン状態確認');
    const emptyState = await page.evaluate(() => {
      return {
        emptyCampaignMessage: document.body.textContent?.includes('キャンペーンがありません'),
        testButtons: Array.from(document.querySelectorAll('button'))
          .filter(btn => btn.textContent?.includes('テスト'))
          .map(btn => ({
            text: btn.textContent?.trim(),
            visible: window.getComputedStyle(btn).display !== 'none',
            disabled: btn.disabled
          })),
        campaignCards: document.querySelectorAll('[class*="MuiCard"]').length
      };
    });
    
    console.log('📊 クリア後の状態:');
    console.log('  空メッセージ:', emptyState.emptyCampaignMessage);
    console.log('  キャンペーンカード数:', emptyState.campaignCards);
    console.log('  テストボタン:', emptyState.testButtons);
    
    await page.screenshot({ 
      path: 'e2e/playwright-tools/test-home-clear-01-empty.png', 
      fullPage: true 
    });
    
    if (emptyState.testButtons.length > 0) {
      console.log('✅ テストデータ読み込みボタンが表示されました！');
      
      console.log('🖱️ Step 4: テストキャンペーンを読み込むボタンをクリック');
      await page.click('button:has-text("テストキャンペーンを読み込む")');
      console.log('🧪 テストデータボタンをクリック');
      
      await page.waitForTimeout(3000);
      
      // キャンペーンが読み込まれたかチェック
      const afterLoad = await page.evaluate(() => {
        return {
          hasCampaignCards: document.querySelectorAll('[class*="MuiCard"]').length > 0,
          hasTestCampaign: document.body.textContent?.includes('竜の谷の秘宝') || document.body.textContent?.includes('テスト'),
          campaignTitles: Array.from(document.querySelectorAll('[class*="MuiCard"]')).map(card => card.textContent),
          totalCards: document.querySelectorAll('[class*="MuiCard"]').length
        };
      });
      
      console.log('📊 データ読み込み後の状態:');
      console.log('  キャンペーンカード数:', afterLoad.totalCards);
      console.log('  テストキャンペーン表示:', afterLoad.hasTestCampaign);
      console.log('  キャンペーンタイトル:', afterLoad.campaignTitles);
      
      await page.screenshot({ 
        path: 'e2e/playwright-tools/test-home-clear-02-loaded.png', 
        fullPage: true 
      });
      
      if (afterLoad.hasCampaignCards) {
        console.log('🚀 Step 5: セッション画面に移動してテスト');
        
        // 最初のキャンペーンカードをクリック
        try {
          await page.click('[class*="MuiCard"]:first-child');
          console.log('📋 キャンペーンカードをクリック');
          await page.waitForTimeout(2000);
        } catch (error) {
          console.log('⚠️ キャンペーンカードのクリックに失敗:', error.message);
        }
        
        // セッション画面に移動
        await page.goto('http://localhost:5173/session', { 
          waitUntil: 'domcontentloaded',
          timeout: 30000 
        });
        
        await page.waitForTimeout(5000);
        
        console.log('📊 Step 6: セッション画面での動作確認');
        const sessionCheck = await page.evaluate(() => {
          return {
            hasCharacters: !document.body.textContent?.includes('プレイヤーキャラクターがいません'),
            campaignTitle: document.body.textContent?.includes('竜の谷の秘宝'),
            characterNames: document.body.textContent?.includes('アレックス') || document.body.textContent?.includes('エルフィン'),
            gameButtons: Array.from(document.querySelectorAll('button'))
              .filter(btn => 
                btn.textContent?.includes('移動') || 
                btn.textContent?.includes('NPC会話') ||
                btn.textContent?.includes('戦闘') ||
                btn.textContent?.includes('調査')
              )
              .map(btn => ({
                text: btn.textContent?.trim(),
                disabled: btn.disabled
              })),
            totalButtons: document.querySelectorAll('button').length
          };
        });
        
        console.log('🎮 セッション画面状態:');
        console.log('  キャラクター表示:', sessionCheck.hasCharacters);
        console.log('  竜の谷タイトル:', sessionCheck.campaignTitle);
        console.log('  キャラクター名:', sessionCheck.characterNames);
        console.log('  ボタン総数:', sessionCheck.totalButtons);
        console.log('  ゲームボタン詳細:');
        sessionCheck.gameButtons.forEach(btn => {
          console.log(`    "${btn.text}": ${btn.disabled ? 'disabled' : 'enabled'}`);
        });
        
        await page.screenshot({ 
          path: 'e2e/playwright-tools/test-home-clear-03-session.png', 
          fullPage: true 
        });
        
        // 有効なボタンがあればテスト
        const enabledButtons = sessionCheck.gameButtons.filter(btn => !btn.disabled);
        if (enabledButtons.length > 0) {
          console.log('🎉 ゲームボタンが有効化されました！テスト実行:');
          
          try {
            // 最初の有効なボタンをクリック
            const firstEnabled = enabledButtons[0];
            await page.click(`button:has-text("${firstEnabled.text.replace(/"/g, '\\"')}")`);
            console.log(`✅ "${firstEnabled.text}"ボタンをクリック成功`);
            await page.waitForTimeout(2000);
            
            await page.screenshot({ 
              path: 'e2e/playwright-tools/test-home-clear-04-action.png', 
              fullPage: true 
            });
          } catch (error) {
            console.log('⚠️ ボタンクリックに失敗:', error.message);
          }
        } else {
          console.log('❌ まだゲームボタンが有効化されていません');
        }
        
      } else {
        console.log('❌ キャンペーンデータの読み込みに失敗しました');
      }
      
    } else {
      console.log('❌ データクリア後もテストボタンが表示されませんでした');
      
      // デバッグ用にページ内容を確認
      const debugInfo = await page.evaluate(() => {
        return {
          allButtons: Array.from(document.querySelectorAll('button')).map(btn => btn.textContent?.trim()).filter(t => t),
          pageText: document.body.textContent?.substring(0, 500),
          hasEmptyMessage: document.body.textContent?.includes('キャンペーンがありません')
        };
      });
      
      console.log('🔍 デバッグ情報:');
      console.log('  全ボタン:', debugInfo.allButtons);
      console.log('  空メッセージ有無:', debugInfo.hasEmptyMessage);
      console.log('  ページテキスト(先頭500文字):', debugInfo.pageText);
    }
    
    console.log('⏳ 10秒待機...');
    await page.waitForTimeout(10000);
    
  } catch (error) {
    console.log('💥 エラー:', error.message);
    await page.screenshot({ 
      path: 'e2e/playwright-tools/test-home-clear-error.png',
      fullPage: true 
    });
  }
  
  await browser.close();
  console.log('🏁 ホーム画面クリア&読み込みテスト完了');
})();