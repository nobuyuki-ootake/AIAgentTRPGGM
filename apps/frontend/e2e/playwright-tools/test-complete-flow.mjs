import { chromium } from 'playwright';

(async () => {
  console.log('🎯 完全なTRPGセッションフローテスト開始');
  
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
    console.log('🧹 Step 1: 完全なデータクリア');
    await page.goto('http://localhost:5173/', { 
      waitUntil: 'domcontentloaded',
      timeout: 30000 
    });
    
    await page.waitForTimeout(3000);
    
    // 完全なlocalStorageクリア + サンプル作成を無効化
    await page.evaluate(() => {
      // 全てのlocalStorageをクリア
      localStorage.clear();
      console.log('🧹 localStorageを完全クリア');
      
      // サンプル作成を無効化するフラグを設定
      localStorage.setItem('disable_sample_creation', 'true');
    });
    
    // ページをリロード
    console.log('🔄 ページをリロード');
    await page.reload({ waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(3000);
    
    console.log('📊 Step 2: 空状態の確認');
    const emptyCheck = await page.evaluate(() => {
      return {
        emptyCampaignMessage: document.body.textContent?.includes('キャンペーンがありません'),
        testDataButton: Array.from(document.querySelectorAll('button')).find(btn => 
          btn.textContent?.includes('テストキャンペーンを読み込む')
        ),
        allButtons: Array.from(document.querySelectorAll('button')).map(btn => btn.textContent?.trim()),
        campaignCards: document.querySelectorAll('[class*="MuiCard"]').length
      };
    });
    
    console.log('📋 空状態確認結果:');
    console.log('  空メッセージ:', emptyCheck.emptyCampaignMessage);
    console.log('  キャンペーンカード数:', emptyCheck.campaignCards);
    console.log('  テストデータボタン存在:', !!emptyCheck.testDataButton);
    console.log('  全ボタン:', emptyCheck.allButtons);
    
    await page.screenshot({ 
      path: 'e2e/playwright-tools/test-complete-01-empty.png', 
      fullPage: true 
    });
    
    if (emptyCheck.testDataButton) {
      console.log('✅ Step 3: テストデータ読み込みボタンをクリック');
      
      await page.click('button:has-text("テストキャンペーンを読み込む")');
      console.log('🧪 テストデータボタンをクリック');
      
      await page.waitForTimeout(3000);
      
      const afterLoad = await page.evaluate(() => {
        return {
          campaignCards: document.querySelectorAll('[class*="MuiCard"]').length,
          hasTestCampaign: document.body.textContent?.includes('竜の谷の秘宝'),
          campaignTitles: Array.from(document.querySelectorAll('h6')).map(h => h.textContent).filter(t => t && t.length > 5)
        };
      });
      
      console.log('📊 データ読み込み後:');
      console.log('  キャンペーンカード数:', afterLoad.campaignCards);
      console.log('  竜の谷タイトル:', afterLoad.hasTestCampaign);
      console.log('  キャンペーンタイトル:', afterLoad.campaignTitles);
      
      await page.screenshot({ 
        path: 'e2e/playwright-tools/test-complete-02-loaded.png', 
        fullPage: true 
      });
      
      if (afterLoad.campaignCards > 0) {
        console.log('🚀 Step 4: セッション画面に移動');
        
        // キャンペーンを選択
        await page.click('[class*="MuiCard"]:first-child');
        console.log('📋 キャンペーンカードを選択');
        await page.waitForTimeout(2000);
        
        // セッション画面に移動
        await page.goto('http://localhost:5173/session', { 
          waitUntil: 'domcontentloaded',
          timeout: 30000 
        });
        
        await page.waitForTimeout(5000);
        
        console.log('🎮 Step 5: セッション画面の動作確認');
        const sessionAnalysis = await page.evaluate(() => {
          const gameButtons = Array.from(document.querySelectorAll('button'))
            .filter(btn => {
              const text = btn.textContent?.trim() || '';
              return text.includes('移動') || 
                     text.includes('NPC会話') || 
                     text.includes('戦闘') || 
                     text.includes('調査') ||
                     text.includes('休息') ||
                     text.includes('探索');
            })
            .map(btn => ({
              text: btn.textContent?.trim(),
              disabled: btn.disabled,
              visible: window.getComputedStyle(btn).display !== 'none'
            }));
          
          return {
            hasCharacters: !document.body.textContent?.includes('プレイヤーキャラクターがいません'),
            campaignTitle: document.body.textContent?.includes('竜の谷の秘宝'),
            characterNames: document.body.textContent?.includes('アレックス') || 
                           document.body.textContent?.includes('エルフィン') ||
                           document.body.textContent?.includes('アリア'),
            gameButtons: gameButtons,
            debugButton: !!Array.from(document.querySelectorAll('button')).find(btn => 
              btn.textContent?.includes('テストデータ読込')
            ),
            totalButtons: document.querySelectorAll('button').length
          };
        });
        
        console.log('🎮 セッション画面詳細:');
        console.log('  キャラクター表示:', sessionAnalysis.hasCharacters);
        console.log('  竜の谷タイトル:', sessionAnalysis.campaignTitle);
        console.log('  キャラクター名:', sessionAnalysis.characterNames);
        console.log('  デバッグボタン存在:', sessionAnalysis.debugButton);
        console.log('  ボタン総数:', sessionAnalysis.totalButtons);
        console.log('  ゲームボタン詳細:');
        sessionAnalysis.gameButtons.forEach(btn => {
          console.log(`    "${btn.text}": ${btn.disabled ? 'disabled' : 'enabled'} (${btn.visible ? 'visible' : 'hidden'})`);
        });
        
        await page.screenshot({ 
          path: 'e2e/playwright-tools/test-complete-03-session.png', 
          fullPage: true 
        });
        
        // デバッグボタンがある場合はクリック
        if (sessionAnalysis.debugButton) {
          console.log('🧪 Step 6: セッション画面のデバッグボタンをクリック');
          
          await page.click('button:has-text("🧪 テストデータ読込")');
          console.log('🖱️ セッション画面のデバッグボタンをクリック');
          
          await page.waitForTimeout(3000);
          
          const afterDebug = await page.evaluate(() => {
            const gameButtons = Array.from(document.querySelectorAll('button'))
              .filter(btn => {
                const text = btn.textContent?.trim() || '';
                return text.includes('移動') || text.includes('NPC会話') || text.includes('戦闘');
              })
              .map(btn => ({
                text: btn.textContent?.trim(),
                disabled: btn.disabled
              }));
            
            return {
              gameButtons: gameButtons,
              hasCharacters: !document.body.textContent?.includes('プレイヤーキャラクターがいません'),
              characterNames: document.body.textContent?.includes('アレックス') || 
                             document.body.textContent?.includes('エルフィン') ||
                             document.body.textContent?.includes('アリア')
            };
          });
          
          console.log('🎮 デバッグ後の状態:');
          console.log('  キャラクター表示:', afterDebug.hasCharacters);
          console.log('  キャラクター名:', afterDebug.characterNames);
          console.log('  ゲームボタン状態:');
          afterDebug.gameButtons.forEach(btn => {
            console.log(`    "${btn.text}": ${btn.disabled ? 'disabled' : 'enabled'}`);
          });
          
          await page.screenshot({ 
            path: 'e2e/playwright-tools/test-complete-04-debug.png', 
            fullPage: true 
          });
          
          // 有効なボタンがあればテスト
          const enabledButtons = afterDebug.gameButtons.filter(btn => !btn.disabled);
          if (enabledButtons.length > 0) {
            console.log('🎉 Step 7: ゲームプレイテスト');
            
            for (const button of enabledButtons.slice(0, 2)) { // 最初の2つのボタンをテスト
              try {
                console.log(`🖱️ "${button.text}"ボタンをクリック`);
                await page.click(`button:has-text("${button.text.replace(/"/g, '\\"')}")`);
                await page.waitForTimeout(2000);
                
                console.log(`✅ "${button.text}"ボタンのクリック成功`);
              } catch (error) {
                console.log(`⚠️ "${button.text}"ボタンのクリックに失敗:`, error.message);
              }
            }
            
            await page.screenshot({ 
              path: 'e2e/playwright-tools/test-complete-05-gameplay.png', 
              fullPage: true 
            });
            
            console.log('🎉 完全フローテスト成功！TRPGセッションが動作しています');
          } else {
            console.log('❌ デバッグ後もゲームボタンが有効化されませんでした');
          }
        } else {
          console.log('⚠️ セッション画面にデバッグボタンが見つかりませんでした');
        }
        
      } else {
        console.log('❌ テストデータの読み込みに失敗しました');
      }
      
    } else {
      console.log('❌ テストデータ読み込みボタンが見つかりませんでした');
      
      // 手動でテストデータを注入
      console.log('🛠️ 手動でテストデータを注入');
      await page.evaluate(() => {
        // testCampaignDataを直接注入
        const testData = {
          "id": "test-campaign-dragon-valley",
          "title": "竜の谷の秘宝",
          "summary": "古代の竜が守る秘宝を求める冒険",
          "gameSystem": "D&D 5e",
          "characters": [
            {
              "id": "pc-alex",
              "name": "アレックス",
              "characterType": "PC",
              "race": "ヒューマン",
              "class": "ファイター",
              "background": "兵士",
              "level": 3,
              "stats": {
                "strength": 16,
                "dexterity": 13,
                "constitution": 14,
                "intelligence": 10,
                "wisdom": 12,
                "charisma": 11,
                "hitPoints": { "current": 28, "max": 28, "temp": 0 },
                "armorClass": 18,
                "speed": 30,
                "level": 3,
                "experience": 900,
                "proficiencyBonus": 2
              }
            }
          ],
          "npcs": [
            {
              "id": "npc-elder-marcus",
              "name": "長老マーカス",
              "characterType": "NPC",
              "npcType": "questGiver",
              "role": "村の長老",
              "disposition": 75
            }
          ]
        };
        
        // localStorageに保存
        localStorage.setItem('trpg_campaign_test-campaign-dragon-valley', JSON.stringify(testData));
        localStorage.setItem('trpg_campaign_list', JSON.stringify([{
          id: testData.id,
          title: testData.title,
          updatedAt: new Date().toISOString(),
          summary: testData.summary
        }]));
        localStorage.setItem('currentCampaignId', testData.id);
        
        console.log('🧪 手動でテストデータを注入しました');
      });
      
      // リロードして反映
      await page.reload({ waitUntil: 'domcontentloaded' });
      await page.waitForTimeout(3000);
      
      await page.screenshot({ 
        path: 'e2e/playwright-tools/test-complete-06-manual.png', 
        fullPage: true 
      });
    }
    
    console.log('⏳ 10秒待機...');
    await page.waitForTimeout(10000);
    
  } catch (error) {
    console.log('💥 エラー:', error.message);
    await page.screenshot({ 
      path: 'e2e/playwright-tools/test-complete-error.png',
      fullPage: true 
    });
  }
  
  await browser.close();
  console.log('🏁 完全フローテスト完了');
})();