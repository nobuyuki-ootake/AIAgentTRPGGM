import { chromium } from 'playwright';

(async () => {
  console.log('🔍 Recoil状態デバッグテスト開始');
  
  const browser = await chromium.launch({ 
    headless: false,
    devtools: true,
    slowMo: 1000
  });
  
  const context = await browser.newContext();
  const page = await context.newPage();
  
  // すべてのログを詳細に監視
  page.on('console', msg => {
    console.log(`📋 [${msg.type()}]: ${msg.text()}`);
  });
  
  page.on('pageerror', err => {
    console.log('💥 PAGE ERROR:', err.message);
  });
  
  try {
    console.log('🎯 Step 1: セッション画面読み込み');
    await page.goto('http://localhost:5173/session', { 
      waitUntil: 'domcontentloaded',
      timeout: 30000 
    });
    
    await page.waitForTimeout(3000);
    
    console.log('🔍 Step 2: Recoil状態とテストデータ確認');
    const recoilState = await page.evaluate(() => {
      // testCampaignDataを直接確認
      const testDataCheck = async () => {
        try {
          // 動的importでテストデータを読み込み
          const module = await import('/src/data/testCampaignData.json');
          return module.default;
        } catch (error) {
          return { error: error.message };
        }
      };
      
      return {
        // localStorage の状態
        currentCampaignId: localStorage.getItem('currentCampaignId'),
        currentCampaign: JSON.parse(localStorage.getItem('currentCampaign') || 'null'),
        
        // ページの表示状態
        pageContent: document.body.textContent?.includes('竜の谷の秘宝'),
        hasCharacterSection: !!document.querySelector('*:contains("プレイヤーキャラクター")'),
        
        // ボタンの有効/無効状態
        buttonStates: Array.from(document.querySelectorAll('button')).map(btn => ({
          text: btn.textContent?.trim(),
          disabled: btn.disabled
        })).slice(0, 10),
        
        // Reactエラー境界の状態
        hasErrorBoundary: !!document.querySelector('[data-error-boundary]'),
        
        // DOM要素数
        totalElements: document.querySelectorAll('*').length
      };
    });
    
    console.log('📊 詳細状態分析:');
    console.log('  キャンペーンID:', recoilState.currentCampaignId);
    console.log('  キャンペーンタイトル:', recoilState.currentCampaign?.title || 'なし');
    console.log('  ページに竜の谷:', recoilState.pageContent);
    console.log('  キャラクターセクション:', recoilState.hasCharacterSection);
    console.log('  エラー境界:', recoilState.hasErrorBoundary);
    console.log('  DOM要素数:', recoilState.totalElements);
    
    console.log('🎮 ボタン状態詳細:');
    recoilState.buttonStates.forEach(btn => {
      console.log(`  "${btn.text}": ${btn.disabled ? 'disabled' : 'enabled'}`);
    });
    
    console.log('🧪 Step 3: テストデータを手動で強制設定');
    const manualDataSet = await page.evaluate(() => {
      // testCampaignDataの内容を直接設定
      const testData = {
        "id": "test-campaign-001",
        "title": "竜の谷の秘宝",
        "description": "古代竜が眠ると言われる谷に隠された秘宝を求める冒険",
        "characters": [
          {
            "id": "char-1",
            "name": "アレックス・ブレイブハート",
            "characterType": "PC",
            "class": "戦士"
          },
          {
            "id": "char-2", 
            "name": "エルフィン・シルバーリーフ",
            "characterType": "PC",
            "class": "魔法使い"
          }
        ],
        "npcs": [
          {
            "id": "npc-innkeeper",
            "name": "バルトス",
            "npcType": "固定配置"
          }
        ],
        "enemies": [
          {
            "id": "bandit-leader",
            "name": "盗賊団の頭領"
          }
        ],
        "bases": [
          {
            "id": "town-center",
            "name": "リバーベント街"
          }
        ],
        "worldBuilding": {
          "bases": [
            {
              "id": "town-center",
              "name": "リバーベント街"
            }
          ]
        }
      };
      
      // localStorageに設定
      localStorage.setItem('currentCampaign', JSON.stringify(testData));
      localStorage.setItem('currentCampaignId', testData.id);
      
      console.log('✅ 手動でテストデータを設定完了');
      
      return {
        success: true,
        data: testData
      };
    });
    
    console.log('📝 手動設定結果:', manualDataSet.success);
    
    console.log('🔄 Step 4: ページリロードしてデータ反映確認');
    await page.reload({ waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(5000);
    
    const afterReload = await page.evaluate(() => {
      return {
        campaignData: JSON.parse(localStorage.getItem('currentCampaign') || 'null'),
        pageHasTestTitle: document.body.textContent?.includes('竜の谷の秘宝'),
        hasCharacters: document.body.textContent?.includes('アレックス') || document.body.textContent?.includes('エルフィン'),
        playerCharacterCount: (document.body.textContent?.match(/プレイヤーキャラクター|PC/g) || []).length
      };
    });
    
    console.log('🔄 リロード後の状態:');
    console.log('  キャンペーンタイトル:', afterReload.campaignData?.title);
    console.log('  ページに竜の谷:', afterReload.pageHasTestTitle);
    console.log('  キャラクター表示:', afterReload.hasCharacters);
    console.log('  PC要素数:', afterReload.playerCharacterCount);
    
    await page.screenshot({ 
      path: 'e2e/playwright-tools/debug-recoil-state.png', 
      fullPage: true 
    });
    
    if (afterReload.campaignData && afterReload.pageHasTestTitle) {
      console.log('✅ テストデータが正常に反映されました');
    } else {
      console.log('❌ テストデータの反映に問題があります');
    }
    
    console.log('⏳ 10秒待機...');
    await page.waitForTimeout(10000);
    
  } catch (error) {
    console.log('💥 エラー:', error.message);
    await page.screenshot({ 
      path: 'e2e/playwright-tools/debug-recoil-error.png',
      fullPage: true 
    });
  }
  
  await browser.close();
  console.log('🏁 Recoil状態デバッグ完了');
})();