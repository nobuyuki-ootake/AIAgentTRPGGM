import { chromium } from 'playwright';

(async () => {
  console.log('🏠 ホーム画面からのテストデータ読み込みテスト開始');
  
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
    
    console.log('🔍 Step 2: テストデータ読み込みボタンを探す');
    const testButtons = await page.evaluate(() => {
      const buttons = Array.from(document.querySelectorAll('button'));
      return buttons
        .filter(btn => btn.textContent?.includes('テスト'))
        .map(btn => ({
          text: btn.textContent?.trim(),
          visible: window.getComputedStyle(btn).display !== 'none',
          disabled: btn.disabled
        }));
    });
    
    console.log('🧪 テストボタン:', testButtons);
    
    if (testButtons.length > 0) {
      console.log('✅ テストデータ読み込みボタンが見つかりました');
      
      // テストキャンペーンを読み込むボタンをクリック
      await page.click('button:has-text("テストキャンペーンを読み込む"), button:has-text("テストデータ")');
      console.log('🖱️ テストデータボタンをクリック');
      
      await page.waitForTimeout(3000);
      
      // キャンペーンが選択されたかチェック
      const afterLoadState = await page.evaluate(() => {
        return {
          url: window.location.pathname,
          hasTestCampaign: document.body.textContent?.includes('竜の谷の秘宝'),
          campaignCards: Array.from(document.querySelectorAll('[class*="MuiCard"]')).length
        };
      });
      
      console.log('📊 データ読み込み後の状態:');
      console.log('  現在のURL:', afterLoadState.url);
      console.log('  テストキャンペーン表示:', afterLoadState.hasTestCampaign);
      console.log('  キャンペーンカード数:', afterLoadState.campaignCards);
      
      await page.screenshot({ 
        path: 'e2e/playwright-tools/test-home-data-load-01.png', 
        fullPage: true 
      });
      
      // セッション画面に移動
      if (afterLoadState.url === '/' && afterLoadState.campaignCards > 0) {
        console.log('🚀 Step 3: セッション画面に移動');
        
        // キャンペーンカードをクリック
        try {
          await page.click('[class*="MuiCard"]:first-child');
          console.log('📋 キャンペーンカードをクリック');
          await page.waitForTimeout(2000);
        } catch (error) {
          console.log('⚠️ キャンペーンカードのクリックに失敗:', error.message);
        }
        
        // 直接セッション画面に移動
        await page.goto('http://localhost:5173/session', { 
          waitUntil: 'domcontentloaded',
          timeout: 30000 
        });
        
        await page.waitForTimeout(5000);
        
        console.log('📊 Step 4: セッション画面の状態確認');
        const sessionState = await page.evaluate(() => {
          return {
            hasCharacters: !document.body.textContent?.includes('プレイヤーキャラクターがいません'),
            campaignTitle: document.body.textContent?.includes('竜の谷の秘宝'),
            characterNames: document.body.textContent?.includes('アレックス') || document.body.textContent?.includes('エルフィン'),
            moveButtonEnabled: !Array.from(document.querySelectorAll('button')).find(btn => btn.textContent?.includes('移動'))?.disabled,
            npcButtonEnabled: !Array.from(document.querySelectorAll('button')).find(btn => btn.textContent?.includes('NPC会話'))?.disabled,
            buttonStates: Array.from(document.querySelectorAll('button'))
              .filter(btn => btn.textContent?.includes('移動') || btn.textContent?.includes('NPC'))
              .map(btn => ({
                text: btn.textContent?.trim(),
                disabled: btn.disabled
              }))
          };
        });
        
        console.log('🎮 セッション画面状態:');
        console.log('  キャラクター表示:', sessionState.hasCharacters);
        console.log('  竜の谷タイトル:', sessionState.campaignTitle);
        console.log('  キャラクター名:', sessionState.characterNames);
        console.log('  移動ボタン有効:', sessionState.moveButtonEnabled);
        console.log('  NPC会話ボタン有効:', sessionState.npcButtonEnabled);
        console.log('  ボタン詳細:', sessionState.buttonStates);
        
        await page.screenshot({ 
          path: 'e2e/playwright-tools/test-home-data-load-02-session.png', 
          fullPage: true 
        });
        
        if (sessionState.hasCharacters && sessionState.moveButtonEnabled) {
          console.log('🎉 テストデータが正常に読み込まれ、ゲームプレイ可能です！');
          
          // 移動ボタンのテスト
          try {
            await page.click('button:has-text("移動")');
            console.log('✅ 移動ボタンがクリック可能になりました！');
            await page.waitForTimeout(2000);
            
            await page.screenshot({ 
              path: 'e2e/playwright-tools/test-home-data-load-03-movement.png', 
              fullPage: true 
            });
          } catch (error) {
            console.log('⚠️ 移動ボタンのクリックに失敗:', error.message);
          }
          
        } else {
          console.log('⚠️ テストデータは読み込まれましたが、まだ完全に機能していません');
        }
      }
      
    } else {
      console.log('❌ テストデータ読み込みボタンが見つかりませんでした');
    }
    
    console.log('⏳ 10秒待機...');
    await page.waitForTimeout(10000);
    
  } catch (error) {
    console.log('💥 エラー:', error.message);
    await page.screenshot({ 
      path: 'e2e/playwright-tools/test-home-data-load-error.png',
      fullPage: true 
    });
  }
  
  await browser.close();
  console.log('🏁 ホーム画面テストデータ読み込みテスト完了');
})();