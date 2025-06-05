import { chromium } from 'playwright';

(async () => {
  console.log('🧪 デバッグボタンテスト開始');
  
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
    console.log('🎯 Step 1: セッション画面にアクセス');
    await page.goto('http://localhost:5173/session', { 
      waitUntil: 'domcontentloaded',
      timeout: 30000 
    });
    
    await page.waitForTimeout(3000);
    
    console.log('🔍 Step 2: デバッグボタンの確認');
    const debugButtonExists = await page.evaluate(() => {
      const button = Array.from(document.querySelectorAll('button')).find(btn => 
        btn.textContent?.includes('テストデータ読込')
      );
      return {
        exists: !!button,
        text: button?.textContent,
        disabled: button?.disabled,
        visible: button ? window.getComputedStyle(button).display !== 'none' : false
      };
    });
    
    console.log('🧪 デバッグボタン状態:', debugButtonExists);
    
    if (debugButtonExists.exists) {
      console.log('✅ デバッグボタンが見つかりました！クリックします...');
      
      await page.click('button:has-text("🧪 テストデータ読込")');
      console.log('🖱️ デバッグボタンをクリック');
      
      await page.waitForTimeout(3000);
      
      console.log('📊 Step 3: データ読み込み後の状態確認');
      const afterClick = await page.evaluate(() => {
        return {
          campaignTitle: document.body.textContent?.includes('竜の谷の秘宝'),
          hasCharacters: document.body.textContent?.includes('アレックス') || document.body.textContent?.includes('エルフィン'),
          buttonStates: Array.from(document.querySelectorAll('button')).map(btn => ({
            text: btn.textContent?.trim(),
            disabled: btn.disabled
          })).filter(btn => btn.text?.includes('移動') || btn.text?.includes('NPC会話')),
          characterSection: document.body.textContent?.includes('プレイヤーキャラクターがいません'),
          totalButtons: document.querySelectorAll('button').length
        };
      });
      
      console.log('📋 データ読み込み後の状態:');
      console.log('  竜の谷のタイトル:', afterClick.campaignTitle);
      console.log('  キャラクター名:', afterClick.hasCharacters);
      console.log('  空のキャラクターメッセージ:', afterClick.characterSection);
      console.log('  ボタン総数:', afterClick.totalButtons);
      
      console.log('🎮 移動・NPC会話ボタン状態:');
      afterClick.buttonStates.forEach(btn => {
        console.log(`  "${btn.text}": ${btn.disabled ? 'disabled' : 'enabled'}`);
      });
      
      await page.screenshot({ 
        path: 'e2e/playwright-tools/test-debug-button-after.png', 
        fullPage: true 
      });
      
      if (afterClick.campaignTitle && afterClick.hasCharacters) {
        console.log('🎉 デバッグボタンが正常に機能しました！');
        
        console.log('🧪 Step 4: 有効化されたボタンのテスト');
        if (!afterClick.buttonStates.find(btn => btn.text?.includes('移動'))?.disabled) {
          try {
            await page.click('button:has-text("移動")');
            console.log('✅ 移動ボタンがクリック可能になりました');
            await page.waitForTimeout(2000);
          } catch (error) {
            console.log('⚠️ 移動ボタンはまだ無効:', error.message);
          }
        }
        
      } else {
        console.log('❌ デバッグボタンは機能しましたが、データが正しく反映されていません');
      }
      
    } else {
      console.log('❌ デバッグボタンが見つかりませんでした');
    }
    
    await page.screenshot({ 
      path: 'e2e/playwright-tools/test-debug-button.png', 
      fullPage: true 
    });
    
    console.log('⏳ 10秒待機...');
    await page.waitForTimeout(10000);
    
  } catch (error) {
    console.log('💥 エラー:', error.message);
    await page.screenshot({ 
      path: 'e2e/playwright-tools/test-debug-button-error.png',
      fullPage: true 
    });
  }
  
  await browser.close();
  console.log('🏁 デバッグボタンテスト完了');
})();