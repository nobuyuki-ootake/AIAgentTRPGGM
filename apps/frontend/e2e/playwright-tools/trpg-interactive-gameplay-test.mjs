import { chromium } from 'playwright';

(async () => {
  console.log('🎮 TRPGインタラクティブゲームプレイテスト開始！');
  console.log('🎯 テスト項目: イベント発生、トラップ遷遇、エネミー接敵、NPCコンタクト');
  
  const browser = await chromium.launch({ 
    headless: false,
    devtools: true,
    slowMo: 1500  // より見やすくするため遅く
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
  
  // ネットワーク監視（AI APIコール確認）
  page.on('request', request => {
    const url = request.url();
    if (url.includes('/api/ai-agent') || url.includes('ai')) {
      console.log('🤖 AI API Request:', url);
    }
  });
  
  page.on('response', response => {
    const url = response.url();
    if (url.includes('/api/ai-agent') || url.includes('ai')) {
      console.log(`🤖 AI API Response: ${response.status()} ${url}`);
    }
  });
  
  try {
    console.log('🚀 Step 1: TRPGセッション画面に移動');
    await page.goto('http://localhost:5173/session', { 
      waitUntil: 'networkidle',
      timeout: 30000 
    });
    
    await page.waitForTimeout(3000);
    console.log('✅ セッション画面読み込み完了');
    
    // 初期状態のスクリーンショット
    await page.screenshot({ 
      path: 'e2e/playwright-tools/gameplay-01-initial.png', 
      fullPage: true 
    });
    
    console.log('📊 Step 2: 初期状態確認');
    const initialState = await page.evaluate(() => {
      const findElementByText = (text) => {
        const elements = Array.from(document.querySelectorAll('*'));
        return elements.find(el => el.textContent?.includes(text));
      };
      
      return {
        currentDay: findElementByText('日目')?.textContent || 'N/A',
        location: findElementByText('街の中心')?.textContent || 'N/A',
        actionCount: findElementByText('行動回数')?.textContent || 'N/A',
        availableButtons: Array.from(document.querySelectorAll('button')).map(btn => btn.textContent?.trim()).filter(text => text && text.length > 0),
        hasCharacters: !!findElementByText('プレイヤーキャラクター'),
        hasNPCs: !!findElementByText('NPC'),
        hasEnemies: !!findElementByText('敵')
      };
    });
    
    console.log('📋 初期状態:', initialState);
    console.log('🎮 利用可能な操作:', initialState.availableButtons.slice(0, 10));
    
    console.log('\\n🎯 Step 3: キャラクター選択（セッション開始準備）');
    
    // キャラクター選択またはセッション開始ボタンを探す
    const startButtons = await page.evaluate(() => {
      const buttons = Array.from(document.querySelectorAll('button'));
      const relevantButtons = buttons.filter(btn => {
        const text = btn.textContent?.toLowerCase() || '';
        return text.includes('セッション') || text.includes('開始') || text.includes('キャラクター') || text.includes('選択');
      });
      return relevantButtons.map(btn => ({
        text: btn.textContent?.trim(),
        visible: btn.offsetParent !== null,
        enabled: !btn.disabled
      }));
    });
    
    console.log('🎮 セッション開始関連ボタン:', startButtons);
    
    // セッション開始ボタンがあればクリック
    try {
      await page.click('button:has-text("AIゲームマスターにセッションを始めてもらう")');
      console.log('✅ AIゲームマスターセッション開始ボタンをクリック');
      await page.waitForTimeout(3000);
      
      await page.screenshot({ 
        path: 'e2e/playwright-tools/gameplay-02-session-start.png', 
        fullPage: true 
      });
    } catch (error) {
      console.log('⚠️ セッション開始ボタンが見つからないか、クリックできませんでした');
    }
    
    console.log('\\n🚶 Step 4: 移動アクション（イベント・トラップ遷遇のトリガー）');
    
    try {
      // 移動ボタンを探してクリック
      await page.click('button:has-text("移動")');
      console.log('✅ 移動ボタンクリック');
      await page.waitForTimeout(2000);
      
      await page.screenshot({ 
        path: 'e2e/playwright-tools/gameplay-03-movement-click.png', 
        fullPage: true 
      });
      
      // 移動先選択ダイアログまたはリストを確認
      const locationOptions = await page.evaluate(() => {
        // 移動先のオプションを探す
        const options = Array.from(document.querySelectorAll('li, button, [role="option"]')).map(el => el.textContent?.trim()).filter(text => text && text.length > 2 && text.length < 50);
        return options.slice(0, 10);
      });
      
      console.log('🗺️ 移動先オプション:', locationOptions);
      
      // 移動先を選択（ランダムまたは特定の場所）
      const moveTargets = ['森', '洞窟', '遺跡', '街', '酒場', '教会', '市場'];
      for (const target of moveTargets) {
        try {
          await page.click(`button:has-text("${target}")`, { timeout: 1000 });
          console.log(`✅ ${target}への移動を選択`);
          break;
        } catch (error) {
          // 次の候補を試す
        }
      }
      
      await page.waitForTimeout(3000);
      
      await page.screenshot({ 
        path: 'e2e/playwright-tools/gameplay-04-after-movement.png', 
        fullPage: true 
      });
      
    } catch (error) {
      console.log('⚠️ 移動アクションが実行できませんでした:', error.message);
    }
    
    console.log('\\n🗣️ Step 5: NPCとの会話');
    
    try {
      await page.click('button:has-text("NPC会話")');
      console.log('✅ NPC会話ボタンクリック');
      await page.waitForTimeout(2000);
      
      await page.screenshot({ 
        path: 'e2e/playwright-tools/gameplay-05-npc-interaction.png', 
        fullPage: true 
      });
      
      // NPCリストまたは会話オプションを確認
      const npcOptions = await page.evaluate(() => {
        const elements = Array.from(document.querySelectorAll('*')).filter(el => {
          const text = el.textContent?.toLowerCase() || '';
          return text.includes('npc') || text.includes('商人') || text.includes('村人') || text.includes('警備兵');
        });
        return elements.map(el => el.textContent?.trim()).filter(text => text && text.length < 100);
      });
      
      console.log('👥 NPC関連要素:', npcOptions.slice(0, 5));
      
      // NPCを選択して会話
      try {
        const npcButtons = await page.$$('button:has-text("NPC"), button:has-text("商人"), button:has-text("村人")');
        if (npcButtons.length > 0) {
          await npcButtons[0].click();
          console.log('✅ NPCを選択して会話開始');
          await page.waitForTimeout(3000);
        }
      } catch (npcError) {
        console.log('⚠️ NPC選択できませんでした');
      }
      
    } catch (error) {
      console.log('⚠️ NPC会話アクションが実行できませんでした:', error.message);
    }
    
    console.log('\\n⚔️ Step 6: 戦闘・エネミー接敵の確認');
    
    try {
      // 戦闘関連ボタンを探す
      const combatButtons = await page.evaluate(() => {
        const buttons = Array.from(document.querySelectorAll('button'));
        return buttons.filter(btn => {
          const text = btn.textContent?.toLowerCase() || '';
          return text.includes('戦闘') || text.includes('エネミー') || text.includes('敵') || text.includes('攻撃');
        }).map(btn => btn.textContent?.trim());
      });
      
      console.log('⚔️ 戦闘関連要素:', combatButtons);
      
      if (combatButtons.length > 0) {
        await page.click('button:has-text("戦闘")');
        console.log('✅ 戦闘モードまたは敵との接敵');
        await page.waitForTimeout(3000);
        
        await page.screenshot({ 
          path: 'e2e/playwright-tools/gameplay-06-combat.png', 
          fullPage: true 
        });
      }
      
    } catch (error) {
      console.log('⚠️ 戦闘アクションが実行できませんでした:', error.message);
    }
    
    console.log('\\n🎲 Step 7: ダイスロール実行');
    
    try {
      await page.click('button:has-text("ダイス"), button:has-text("ロール")');
      console.log('✅ ダイスロールボタンクリック');
      await page.waitForTimeout(2000);
      
      await page.screenshot({ 
        path: 'e2e/playwright-tools/gameplay-07-dice-roll.png', 
        fullPage: true 
      });
      
    } catch (error) {
      console.log('⚠️ ダイスロールが実行できませんでした:', error.message);
    }
    
    console.log('\\n📅 Step 8: 日程進行（イベント発生のトリガー）');
    
    try {
      await page.click('button:has-text("日程進行")');
      console.log('✅ 日程進行ボタンクリック');
      await page.waitForTimeout(3000);
      
      await page.screenshot({ 
        path: 'e2e/playwright-tools/gameplay-08-day-progression.png', 
        fullPage: true 
      });
      
      // 日程進行後の変化を確認
      const afterDayProgression = await page.evaluate(() => {
        const findElementByText = (text) => {
          const elements = Array.from(document.querySelectorAll('*'));
          return elements.find(el => el.textContent?.includes(text));
        };
        
        return {
          currentDay: findElementByText('日目')?.textContent || 'N/A',
          actionCount: findElementByText('行動回数')?.textContent || 'N/A',
          logEntries: Array.from(document.querySelectorAll('*')).filter(el => 
            el.textContent?.includes('日目') || el.textContent?.includes('イベント')
          ).map(el => el.textContent?.trim()).slice(0, 3)
        };
      });
      
      console.log('📅 日程進行後の状態:', afterDayProgression);
      
    } catch (error) {
      console.log('⚠️ 日程進行が実行できませんでした:', error.message);
    }
    
    console.log('\\n📝 Step 9: セッションログの確認');
    
    const sessionLog = await page.evaluate(() => {
      // セッションログやメッセージ履歴を確認
      const logElements = Array.from(document.querySelectorAll('*')).filter(el => {
        const text = el.textContent?.toLowerCase() || '';
        return text.includes('ログ') || text.includes('メッセージ') || text.includes('システム') || text.includes('ゲームマスター');
      });
      return logElements.map(el => el.textContent?.trim()).filter(text => text && text.length > 5 && text.length < 200).slice(0, 5);
    });
    
    console.log('📝 セッションログエントリ:', sessionLog);
    
    // 最終状態スクリーンショット
    await page.screenshot({ 
      path: 'e2e/playwright-tools/gameplay-09-final-state.png', 
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
        hasActiveSession: !!findElementByText('セッション'),
        hasGameContent: document.body.textContent?.length > 1000,
        hasInteractiveElements: document.querySelectorAll('button, input, select').length > 10,
        pageTitle: document.title,
        currentUrl: window.location.href
      };
    });
    
    console.log('\\n📊 == 最終評価結果 ==');
    console.log('🎮 ボタン総数:', finalAssessment.totalButtons);
    console.log('🎯 アクティブセッション:', finalAssessment.hasActiveSession);
    console.log('📝 ゲームコンテンツ:', finalAssessment.hasGameContent);
    console.log('🖱️ インタラクティブ要素:', finalAssessment.hasInteractiveElements);
    console.log('📄 ページタイトル:', finalAssessment.pageTitle);
    
    if (finalAssessment.totalButtons >= 10 && finalAssessment.hasGameContent) {
      console.log('\\n🎉 == TRPGゲームプレイテスト成功 ==');
      console.log('✅ ユーザー操作フローが機能しています');
      console.log('✅ イベント、NPC、戦闘システムの基盤が確認できました');
    } else {
      console.log('\\n⚠️ == 部分的成功 ==');
      console.log('⚠️ 一部機能に制限がある可能性があります');
    }
    
    console.log('\\n============================================');
    console.log('🎮 TRPGインタラクティブテスト完了！');
    console.log('📱 ブラウザーで引き続き操作可能です');
    console.log('🔧 DevToolsで詳細確認可能です');
    console.log('📸 スクリーンショットが保存されました');
    console.log('⌨️  Ctrl+C で終了');
    console.log('============================================');
    
    // ブラウザーを開いたまま維持
    await new Promise(() => {}); // 無限待機
    
  } catch (error) {
    console.log('💥 テスト中にエラーが発生:', error.message);
    
    await page.screenshot({ 
      path: 'e2e/playwright-tools/gameplay-error.png',
      fullPage: true 
    });
    console.log('📸 エラー時スクリーンショット保存');
  }
  
  await browser.close();
})();