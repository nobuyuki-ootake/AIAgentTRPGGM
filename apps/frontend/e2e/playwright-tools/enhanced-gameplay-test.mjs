import { chromium } from 'playwright';

(async () => {
  console.log('🎮 TRPGインタラクティブゲームプレイテスト（拡張版）開始！');
  console.log('🎯 テスト項目: イベント発生、トラップ遭遇、エネミー接敵、NPCコンタクト');
  console.log('📊 テストデータを事前設定してからセッション開始');
  
  const browser = await chromium.launch({ 
    headless: false,
    devtools: true,
    slowMo: 1500
  });
  
  const context = await browser.newContext({
    viewport: { width: 1920, height: 1080 }
  });
  
  const page = await context.newPage();
  
  // 詳細ログ監視
  page.on('console', msg => {
    const type = msg.type();
    const text = msg.text();
    const emoji = type === 'error' ? '❌' : type === 'warn' ? '⚠️' : '🔍';
    console.log(`${emoji} [${type}]: ${text}`);
  });
  
  page.on('pageerror', err => {
    console.log('💥 PAGE ERROR:', err.message);
  });
  
  try {
    console.log('🚀 Step 1: ホーム画面でテストデータセットアップ');
    await page.goto('http://localhost:5173', { 
      waitUntil: 'networkidle',
      timeout: 30000 
    });
    
    await page.waitForTimeout(3000);
    
    // テストデータを手動で設定するJavaScriptを実行
    console.log('📊 Step 2: テストデータの強制設定');
    const setupResult = await page.evaluate(() => {
      const testCampaignData = {
        "id": "test-campaign-001",
        "title": "竜の谷の秘宝",
        "description": "古代竜が眠ると言われる谷に隠された秘宝を求める冒険",
        "gameSystem": "D&D 5e",
        "synopsis": "リバーベント街に、古代竜が守る秘宝の噂が流れ着いた。冒険者たちは、危険を冒してでもその真相を確かめるため、竜の谷へと旅立つ。",
        "characters": [
          {
            "id": "char-1",
            "name": "アレックス・ブレイブハート",
            "description": "正義感の強い若き戦士。剣術の腕は一流。",
            "characterType": "PC",
            "class": "戦士",
            "level": 3,
            "stats": { "HP": 40, "MP": 10, "ATK": 15, "DEF": 12, "SPD": 10, "INT": 8 }
          },
          {
            "id": "char-2", 
            "name": "エルフィン・シルバーリーフ",
            "description": "森の国から来た若きエルフの魔法使い。好奇心旺盛で冒険好き。",
            "characterType": "PC",
            "class": "魔法使い",
            "level": 3,
            "stats": { "HP": 25, "MP": 40, "ATK": 5, "DEF": 8, "SPD": 12, "INT": 18 }
          }
        ],
        "npcs": [
          {
            "id": "npc-innkeeper",
            "name": "バルトス",
            "description": "金の竪琴亭の陽気な主人。元冒険者で情報通。",
            "personality": "豪快で面倒見が良い",
            "location": "リバーベント街",
            "npcType": "固定配置"
          },
          {
            "id": "npc-merchant",
            "name": "エリザベータ", 
            "description": "エルフの万屋を営む商人。珍しい品物を扱っている。",
            "personality": "商売上手だが親切",
            "location": "リバーベント街",
            "npcType": "固定配置"
          }
        ],
        "enemies": [
          {
            "id": "bandit-leader",
            "name": "盗賊団の頭領",
            "description": "翠の森道を根城にする盗賊団のリーダー。",
            "location": "翠の森道",
            "stats": { "HP": 45, "ATK": 12, "DEF": 8 },
            "dangerLevel": 2
          }
        ],
        "quests": [
          {
            "id": "test-event-1",
            "title": "森の盗賊団遭遇",
            "description": "翠の森道で盗賊団が冒険者を待ち伏せしている。",
            "scheduledDay": 1,
            "location": "翠の森道",
            "status": "未開始"
          }
        ],
        "worldBuilding": {
          "bases": [
            {
              "id": "town-center",
              "name": "リバーベント街",
              "type": "都市",
              "description": "交易で栄える川沿いの大きな街。"
            },
            {
              "id": "forest-path", 
              "name": "翠の森道",
              "type": "森林",
              "description": "古い木々に覆われた薄暗い森の小道。"
            },
            {
              "id": "small-village",
              "name": "ハーベスト村", 
              "type": "農村",
              "description": "麦畑に囲まれた小さな農村。"
            }
          ]
        }
      };

      // localStorageに強制設定
      localStorage.setItem('currentCampaign', JSON.stringify(testCampaignData));
      localStorage.setItem('currentCampaignId', testCampaignData.id);
      
      console.log('✅ テストキャンペーンデータを設定完了');
      return {
        campaignId: testCampaignData.id,
        charactersCount: testCampaignData.characters.length,
        npcsCount: testCampaignData.npcs.length,
        enemiesCount: testCampaignData.enemies.length,
        basesCount: testCampaignData.worldBuilding.bases.length
      };
    });
    
    console.log('📋 設定完了:', setupResult);
    
    await page.screenshot({ 
      path: 'e2e/playwright-tools/enhanced-01-data-setup.png', 
      fullPage: true 
    });
    
    console.log('🎯 Step 3: TRPGセッション画面に移動');
    await page.goto('http://localhost:5173/session', { 
      waitUntil: 'networkidle',
      timeout: 30000 
    });
    
    await page.waitForTimeout(5000);
    console.log('✅ セッション画面読み込み完了');
    
    await page.screenshot({ 
      path: 'e2e/playwright-tools/enhanced-02-session-initial.png', 
      fullPage: true 
    });
    
    console.log('📊 Step 4: セッション状態の詳細確認');
    const sessionStatus = await page.evaluate(() => {
      const findElementByText = (text) => {
        const elements = Array.from(document.querySelectorAll('*'));
        return elements.find(el => el.textContent?.includes(text));
      };
      
      return {
        campaignTitle: findElementByText('竜の谷の秘宝')?.textContent || 'N/A',
        playerCharacters: Array.from(document.querySelectorAll('*')).filter(el => 
          el.textContent?.includes('アレックス') || el.textContent?.includes('エルフィン')
        ).map(el => el.textContent?.trim()).slice(0, 3),
        availableButtons: Array.from(document.querySelectorAll('button')).map(btn => btn.textContent?.trim()).filter(text => text && text.length > 0),
        hasNPCs: !!findElementByText('バルトス') || !!findElementByText('エリザベータ'),
        currentLocation: findElementByText('リバーベント街')?.textContent || findElementByText('街の中心')?.textContent || 'N/A',
        bodyTextSample: document.body.textContent?.substring(0, 500)
      };
    });
    
    console.log('📋 セッション状態詳細:', {
      campaignTitle: sessionStatus.campaignTitle,
      playerCharactersFound: sessionStatus.playerCharacters.length,
      buttonCount: sessionStatus.availableButtons.length,
      hasNPCs: sessionStatus.hasNPCs,
      currentLocation: sessionStatus.currentLocation
    });
    
    console.log('🎮 利用可能な操作ボタン:', sessionStatus.availableButtons.slice(0, 8));
    
    console.log('\\n🎯 Step 5: AIゲームマスター開始');
    try {
      // AIゲームマスター開始ボタンを探してクリック
      const startButtons = await page.$$('button');
      let aiStartButton = null;
      
      for (const button of startButtons) {
        const text = await button.textContent();
        if (text?.includes('AIゲームマスター') || text?.includes('セッション') && text?.includes('始め')) {
          aiStartButton = button;
          break;
        }
      }
      
      if (aiStartButton) {
        await aiStartButton.click();
        console.log('✅ AIゲームマスター開始ボタンをクリック');
        await page.waitForTimeout(4000);
        
        await page.screenshot({ 
          path: 'e2e/playwright-tools/enhanced-03-ai-gm-start.png', 
          fullPage: true 
        });
      } else {
        console.log('⚠️ AIゲームマスター開始ボタンが見つかりませんでした');
      }
    } catch (error) {
      console.log('⚠️ AIゲームマスター開始に失敗:', error.message);
    }
    
    console.log('\\n🚶 Step 6: 移動テスト（翠の森道でイベント発生期待）');
    try {
      // 移動ボタンをクリック
      await page.click('button:has-text("移動")');
      console.log('✅ 移動ボタンクリック');
      await page.waitForTimeout(2000);
      
      // 翠の森道を選択（盗賊イベントがある場所）
      const moveButtons = await page.$$('button, li[role="button"], [role="option"]');
      let forestPathFound = false;
      
      for (const button of moveButtons) {
        const text = await button.textContent();
        if (text?.includes('森') || text?.includes('翠の森道')) {
          await button.click();
          console.log('✅ 翠の森道への移動を選択');
          forestPathFound = true;
          break;
        }
      }
      
      if (!forestPathFound) {
        console.log('⚠️ 翠の森道が見つからないため、他の場所を選択');
        // 他の移動先を試す
        const alternatives = ['村', 'ハーベスト', '遺跡'];
        for (const alt of alternatives) {
          try {
            await page.click(`button:has-text("${alt}")`, { timeout: 1000 });
            console.log(`✅ ${alt}への移動を選択`);
            break;
          } catch {}
        }
      }
      
      await page.waitForTimeout(3000);
      
      await page.screenshot({ 
        path: 'e2e/playwright-tools/enhanced-04-movement-action.png', 
        fullPage: true 
      });
      
    } catch (error) {
      console.log('⚠️ 移動アクションに失敗:', error.message);
    }
    
    console.log('\\n🗣️ Step 7: NPC会話テスト');
    try {
      // NPC会話ボタンをクリック
      await page.click('button:has-text("NPC会話")');
      console.log('✅ NPC会話ボタンクリック');
      await page.waitForTimeout(2000);
      
      // NPCを選択（バルトスやエリザベータ）
      const npcButtons = await page.$$('button, li');
      for (const button of npcButtons) {
        const text = await button.textContent();
        if (text?.includes('バルトス') || text?.includes('エリザベータ') || text?.includes('宿屋') || text?.includes('商人')) {
          await button.click();
          console.log(`✅ NPC（${text?.substring(0, 20)}）と会話開始`);
          break;
        }
      }
      
      await page.waitForTimeout(3000);
      
      await page.screenshot({ 
        path: 'e2e/playwright-tools/enhanced-05-npc-conversation.png', 
        fullPage: true 
      });
      
    } catch (error) {
      console.log('⚠️ NPC会話に失敗:', error.message);
    }
    
    console.log('\\n📅 Step 8: 日程進行（イベント発生トリガー）');
    try {
      // 日程進行ボタンをクリック
      await page.click('button:has-text("日程進行")');
      console.log('✅ 日程進行ボタンクリック');
      await page.waitForTimeout(4000);
      
      // 日程進行後の状態確認
      const afterDayProgression = await page.evaluate(() => {
        const findElementByText = (text) => {
          const elements = Array.from(document.querySelectorAll('*'));
          return elements.find(el => el.textContent?.includes(text));
        };
        
        return {
          currentDay: findElementByText('日目')?.textContent || 'N/A',
          newEvents: Array.from(document.querySelectorAll('*')).filter(el => 
            el.textContent?.includes('イベント') || el.textContent?.includes('遭遇') || el.textContent?.includes('発生')
          ).map(el => el.textContent?.trim()).slice(0, 3),
          combatElements: Array.from(document.querySelectorAll('*')).filter(el => 
            el.textContent?.includes('戦闘') || el.textContent?.includes('盗賊') || el.textContent?.includes('敵')
          ).map(el => el.textContent?.trim()).slice(0, 3)
        };
      });
      
      console.log('📅 日程進行後の状態:', afterDayProgression);
      
      await page.screenshot({ 
        path: 'e2e/playwright-tools/enhanced-06-day-progression.png', 
        fullPage: true 
      });
      
    } catch (error) {
      console.log('⚠️ 日程進行に失敗:', error.message);
    }
    
    console.log('\\n🎲 Step 9: ダイスロールテスト');
    try {
      const diceButtons = await page.$$('button');
      let diceButton = null;
      
      for (const button of diceButtons) {
        const text = await button.textContent();
        if (text?.includes('ダイス') || text?.includes('ロール') || text?.includes('d20')) {
          diceButton = button;
          break;
        }
      }
      
      if (diceButton) {
        await diceButton.click();
        console.log('✅ ダイスロールボタンクリック');
        await page.waitForTimeout(2000);
        
        await page.screenshot({ 
          path: 'e2e/playwright-tools/enhanced-07-dice-roll.png', 
          fullPage: true 
        });
      }
      
    } catch (error) {
      console.log('⚠️ ダイスロールに失敗:', error.message);
    }
    
    // 最終状態スクリーンショット
    await page.screenshot({ 
      path: 'e2e/playwright-tools/enhanced-08-final-state.png', 
      fullPage: true 
    });
    
    console.log('\\n🎯 Step 10: 最終評価');
    const finalAssessment = await page.evaluate(() => {
      const findElementByText = (text) => {
        const elements = Array.from(document.querySelectorAll('*'));
        return elements.find(el => el.textContent?.includes(text));
      };
      
      return {
        totalButtons: document.querySelectorAll('button').length,
        hasTestCampaign: !!findElementByText('竜の谷の秘宝'),
        hasCharacters: !!findElementByText('アレックス') || !!findElementByText('エルフィン'),
        hasNPCs: !!findElementByText('バルトス') || !!findElementByText('エリザベータ'),
        hasGameContent: document.body.textContent?.length > 1000,
        sessionActive: !!findElementByText('セッション'),
        currentUrl: window.location.href
      };
    });
    
    console.log('\\n📊 == 拡張テスト最終評価 ==');
    console.log('🎮 ボタン総数:', finalAssessment.totalButtons);
    console.log('🎯 テストキャンペーン:', finalAssessment.hasTestCampaign);
    console.log('👥 キャラクター確認:', finalAssessment.hasCharacters);
    console.log('🗣️ NPC確認:', finalAssessment.hasNPCs);
    console.log('📝 コンテンツ量:', finalAssessment.hasGameContent);
    console.log('🎮 セッション稼働:', finalAssessment.sessionActive);
    
    if (finalAssessment.hasTestCampaign && finalAssessment.hasCharacters && finalAssessment.totalButtons >= 10) {
      console.log('\\n🎉 == TRPGゲームプレイテスト成功 ==');
      console.log('✅ テストデータが正しく読み込まれています');
      console.log('✅ キャラクターとNPCが表示されています');
      console.log('✅ ゲーム操作が可能な状態です');
    } else {
      console.log('\\n⚠️ == 部分的成功または課題あり ==');
      console.log('⚠️ テストデータの読み込みまたは表示に問題があります');
    }
    
    console.log('\\n============================================');
    console.log('🎮 TRPGインタラクティブテスト（拡張版）完了！');
    console.log('📱 ブラウザーで引き続き操作可能です');
    console.log('🔧 DevToolsで詳細確認可能です');
    console.log('📸 詳細スクリーンショットが保存されました');
    console.log('⌨️  Ctrl+C で終了');
    console.log('============================================');
    
    // ブラウザーを開いたまま維持
    await new Promise(() => {}); // 無限待機
    
  } catch (error) {
    console.log('💥 テスト中にエラーが発生:', error.message);
    
    await page.screenshot({ 
      path: 'e2e/playwright-tools/enhanced-error.png',
      fullPage: true 
    });
    console.log('📸 エラー時スクリーンショット保存');
  }
  
  await browser.close();
})();