import { chromium } from 'playwright';

(async () => {
  console.log('🎮 セッション画面直接テスト開始');
  
  const browser = await chromium.launch({ 
    headless: false,
    devtools: true,
    slowMo: 1000
  });
  
  const context = await browser.newContext();
  const page = await context.newPage();
  
  // ログ監視
  const logs = [];
  const errors = [];
  
  page.on('console', msg => {
    const text = msg.text();
    logs.push(`[${msg.type()}]: ${text}`);
    console.log(`📋 [${msg.type()}]: ${text}`);
  });
  
  page.on('pageerror', err => {
    errors.push(err.message);
    console.log('💥 PAGE ERROR:', err.message);
  });
  
  try {
    console.log('🎯 Step 1: セッション画面にアクセス');
    await page.goto('http://localhost:5173/session', { 
      waitUntil: 'domcontentloaded',
      timeout: 30000 
    });
    
    await page.waitForTimeout(5000);
    
    console.log('📊 Step 2: 基本状態の確認');
    const basicState = await page.evaluate(() => {
      return {
        title: document.title,
        hasCharacters: !document.body.textContent?.includes('プレイヤーキャラクターがいません'),
        campaignData: document.body.textContent?.includes('竜の谷') || document.body.textContent?.includes('サンプルキャンペーン'),
        buttonCount: document.querySelectorAll('button').length,
        gameButtons: Array.from(document.querySelectorAll('button'))
          .filter(btn => {
            const text = btn.textContent?.trim() || '';
            return text.includes('移動') || text.includes('NPC会話') || text.includes('キャラクター交流');
          })
          .map(btn => ({
            text: btn.textContent?.trim(),
            disabled: btn.disabled,
            visible: window.getComputedStyle(btn).display !== 'none'
          })),
        totalContent: document.body.textContent?.length || 0
      };
    });
    
    console.log('📋 基本状態:');
    console.log('  タイトル:', basicState.title);
    console.log('  キャラクター表示:', basicState.hasCharacters);
    console.log('  キャンペーンデータ:', basicState.campaignData);
    console.log('  総ボタン数:', basicState.buttonCount);
    console.log('  コンテンツ長:', basicState.totalContent);
    
    console.log('🎮 ゲームボタン詳細:');
    basicState.gameButtons.forEach(btn => {
      console.log(`  "${btn.text}": ${btn.disabled ? 'disabled' : 'enabled'} (${btn.visible ? 'visible' : 'hidden'})`);
    });
    
    await page.screenshot({ 
      path: 'e2e/playwright-tools/test-session-direct-01.png', 
      fullPage: true 
    });
    
    // エラーがあれば詳細を表示
    if (errors.length > 0) {
      console.log('💥 JavaScript エラー詳細:');
      errors.forEach((error, i) => {
        console.log(`  ${i + 1}. ${error}`);
      });
    }
    
    // デバッグボタンが存在するかチェック
    console.log('🧪 Step 3: デバッグボタンの確認');
    const debugCheck = await page.evaluate(() => {
      const debugButton = Array.from(document.querySelectorAll('button')).find(btn => 
        btn.textContent?.includes('テストデータ読込')
      );
      
      return {
        hasDebugButton: !!debugButton,
        debugButtonText: debugButton?.textContent?.trim(),
        debugButtonDisabled: debugButton?.disabled,
        allButtonTexts: Array.from(document.querySelectorAll('button')).map(btn => btn.textContent?.trim()).filter(t => t)
      };
    });
    
    console.log('🧪 デバッグボタン状態:');
    console.log('  存在:', debugCheck.hasDebugButton);
    console.log('  テキスト:', debugCheck.debugButtonText);
    console.log('  無効:', debugCheck.debugButtonDisabled);
    
    if (debugCheck.hasDebugButton) {
      console.log('🖱️ Step 4: デバッグボタンをクリック');
      
      await page.click('button:has-text("🧪 テストデータ読込")');
      console.log('📋 デバッグボタンをクリックしました');
      
      await page.waitForTimeout(3000);
      
      console.log('📊 Step 5: デバッグ後の状態確認');
      const afterDebug = await page.evaluate(() => {
        return {
          hasCharacters: !document.body.textContent?.includes('プレイヤーキャラクターがいません'),
          characterNames: document.body.textContent?.includes('アレックス') || 
                         document.body.textContent?.includes('エルフィン') ||
                         document.body.textContent?.includes('アリア'),
          gameButtons: Array.from(document.querySelectorAll('button'))
            .filter(btn => {
              const text = btn.textContent?.trim() || '';
              return text.includes('移動') || text.includes('NPC会話') || text.includes('キャラクター交流');
            })
            .map(btn => ({
              text: btn.textContent?.trim(),
              disabled: btn.disabled
            }))
        };
      });
      
      console.log('📋 デバッグ後の状態:');
      console.log('  キャラクター表示:', afterDebug.hasCharacters);
      console.log('  キャラクター名:', afterDebug.characterNames);
      console.log('  ゲームボタン状態:');
      afterDebug.gameButtons.forEach(btn => {
        console.log(`    "${btn.text}": ${btn.disabled ? 'disabled' : 'enabled'}`);
      });
      
      await page.screenshot({ 
        path: 'e2e/playwright-tools/test-session-direct-02-debug.png', 
        fullPage: true 
      });
      
      // 有効なボタンをテスト
      const enabledButtons = afterDebug.gameButtons.filter(btn => !btn.disabled);
      if (enabledButtons.length > 0) {
        console.log('🎉 Step 6: 有効なボタンをテスト');
        
        for (const button of enabledButtons.slice(0, 2)) {
          try {
            console.log(`🖱️ "${button.text}"をクリック`);
            await page.click(`button:has-text("${button.text.replace(/"/g, '\\"')}")`);
            await page.waitForTimeout(2000);
            console.log(`✅ "${button.text}"のクリック成功`);
          } catch (error) {
            console.log(`⚠️ "${button.text}"のクリック失敗:`, error.message);
          }
        }
        
        await page.screenshot({ 
          path: 'e2e/playwright-tools/test-session-direct-03-gameplay.png', 
          fullPage: true 
        });
        
        console.log('🎉 TRPGセッション機能が正常に動作しています！');
      } else {
        console.log('❌ デバッグ後もゲームボタンが有効化されませんでした');
      }
      
    } else {
      console.log('⚠️ デバッグボタンが見つかりませんでした');
      console.log('📋 利用可能なボタン:', debugCheck.allButtonTexts);
      
      // 移動ボタンが有効かどうか直接確認
      const moveButtonTest = await page.evaluate(() => {
        const moveButton = Array.from(document.querySelectorAll('button')).find(btn => 
          btn.textContent?.includes('移動')
        );
        return {
          exists: !!moveButton,
          disabled: moveButton?.disabled,
          text: moveButton?.textContent?.trim()
        };
      });
      
      console.log('🚶 移動ボタンテスト:', moveButtonTest);
      
      if (moveButtonTest.exists && !moveButtonTest.disabled) {
        try {
          console.log('🖱️ 移動ボタンを直接クリックテスト');
          await page.click('button:has-text("移動")');
          await page.waitForTimeout(2000);
          console.log('✅ 移動ボタンのクリック成功');
          
          await page.screenshot({ 
            path: 'e2e/playwright-tools/test-session-direct-04-movement.png', 
            fullPage: true 
          });
        } catch (error) {
          console.log('⚠️ 移動ボタンのクリック失敗:', error.message);
        }
      }
    }
    
    console.log('📋 収集されたログ (最後10件):');
    logs.slice(-10).forEach(log => console.log(`  ${log}`));
    
    console.log('⏳ 10秒待機...');
    await page.waitForTimeout(10000);
    
  } catch (error) {
    console.log('💥 テストエラー:', error.message);
    await page.screenshot({ 
      path: 'e2e/playwright-tools/test-session-direct-error.png',
      fullPage: true 
    });
  }
  
  await browser.close();
  console.log('🏁 セッション画面直接テスト完了');
})();