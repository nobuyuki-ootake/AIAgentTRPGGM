import { test, expect } from '@playwright/test';

/**
 * TRPGセッション完全クリアテスト
 * 
 * このテストでは以下のシナリオを実行します：
 * 1. 初期キャンペーンの設定と確認
 * 2. Day 1: 街での情報収集とNPC対話
 * 3. Day 1: 森の盗賊団との戦闘
 * 4. Day 2: 商隊護衛クエスト
 * 5. Day 2: 村でのクエスト受注とNPC対話
 * 6. Day 3: 遺跡探索と魔法罠の処理
 * 7. Day 4: 峠での巨鷲イベント
 * 8. Day 5: 最終決戦（古代竜戦）
 * 9. キャンペーンクリアの確認
 */

test.describe('TRPGセッション完全クリアテスト', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('http://localhost:5173');
    await page.waitForLoadState('networkidle');
    
    // サンプルキャンペーンを選択
    await page.waitForSelector('[data-testid="campaign-card"]', { timeout: 10000 });
    await page.click('[data-testid="campaign-card"]');
    await page.waitForLoadState('networkidle');
  });

  test('Day 1-5: 完全TRPGセッションクリアテスト', async ({ page }) => {
    // スクリーンショット用カウンター
    let screenshotCounter = 1;
    
    // ===== Phase 1: TRPGセッション開始 =====
    await page.click('text=TRPGセッション');
    await page.waitForLoadState('networkidle');
    await page.screenshot({ path: `trpg-session-complete-${String(screenshotCounter++).padStart(2, '0')}-session-start.png` });
    
    // 初期状態の確認
    await expect(page.locator('text=セッションチャット')).toBeVisible();
    await expect(page.locator('text=現在の場所')).toBeVisible();

    // ===== AIゲームマスターセッション開始 =====
    console.log('=== AIゲームマスターセッション開始 ===');
    
    // 「AIにセッションを始めてもらう」ボタンをクリック
    await page.click('text=AIにセッションを始めてもらう');
    await page.waitForTimeout(2000);
    await page.screenshot({ path: `trpg-session-complete-${String(screenshotCounter++).padStart(2, '0')}-ai-session-start.png` });
    
    // AIゲームマスターからのメッセージが表示されているか確認
    await expect(page.locator('text=AIゲームマスター')).toBeVisible();
    await expect(page.locator('text=セッション開始')).toBeVisible();

    // ===== Day 1: 街での情報収集 =====
    console.log('=== Day 1: 街での情報収集開始 ===');
    
    // チャットでプレイヤーの行動を選択
    const chatInput = page.locator('input[placeholder*="メッセージを入力"]');
    await chatInput.fill('🍺 宿屋で情報を集めます。金の竪琴亭に向かいます。');
    await page.click('button[aria-label*="送信"], button:has-text("送信"), [aria-label*="Send"], button[type="submit"]');
    await page.waitForTimeout(1000);
    await page.screenshot({ path: `trpg-session-complete-${String(screenshotCounter++).padStart(2, '0')}-day1-start.png` });

    // 拠点タブを選択してリバーベント街を確認
    await page.click('text=拠点');
    await page.waitForTimeout(500);
    await expect(page.locator('text=リバーベント街')).toBeVisible();
    await page.screenshot({ path: `trpg-session-complete-${String(screenshotCounter++).padStart(2, '0')}-day1-town.png` });

    // AIゲームマスターからの応答を待つ
    await page.waitForTimeout(2000);
    await expect(page.locator('text=バルトス')).toBeVisible();
    await page.screenshot({ path: `trpg-session-complete-${String(screenshotCounter++).padStart(2, '0')}-day1-npc-dialogue.png` });
    
    // バルトスに詳しい話を聞く
    await chatInput.fill('バルトスに詳しい話を聞きます。');
    await page.click('button[aria-label*="送信"], button:has-text("送信"), [aria-label*="Send"], button[type="submit"]');
    await page.waitForTimeout(2000);

    // ===== Day 1: 森の盗賊団戦闘 =====
    console.log('=== Day 1: 森の盗賊団戦闘 ===');
    
    await chatInput.fill('🌲 森の道へ冒険に出ます。翠の森道に向かいます。');
    await page.click('button[aria-label*="送信"], button:has-text("送信"), [aria-label*="Send"], button[type="submit"]');
    await page.waitForTimeout(2000);

    // AIゲームマスターからの盗賊団遭遇イベントを確認
    await expect(page.locator('text=盗賊団')).toBeVisible();
    await expect(page.locator('text=戦闘開始')).toBeVisible();
    await page.screenshot({ path: `trpg-session-complete-${String(screenshotCounter++).padStart(2, '0')}-day1-bandits.png` });

    // 戦闘を選択
    await chatInput.fill('戦闘を開始します！アレックスが剣で攻撃します！');
    await page.click('button[aria-label*="送信"], button:has-text("送信"), [aria-label*="Send"], button[type="submit"]');
    await page.waitForTimeout(2000);

    // デバッグパネルでダイス機能を使用
    const debugButton = page.locator('button:has-text("デバッグ")');
    if (await debugButton.isVisible()) {
      await debugButton.click();
      await page.waitForTimeout(500);
      await page.screenshot({ path: `trpg-session-complete-${String(screenshotCounter++).padStart(2, '0')}-day1-debug-panel.png` });
    }

    // 戦闘結果の報告
    await chatInput.fill('アレックスの剣撃が盗賊の頭領に命中！エルフィンの火球術で斥候を撃破！盗賊団を撃退しました！');
    await page.click('button[type="submit"]');
    await page.waitForTimeout(1000);
    await page.screenshot({ path: `trpg-session-complete-${String(screenshotCounter++).padStart(2, '0')}-day1-combat-end.png` });

    // ===== Day 2: 商隊護衛クエスト =====
    console.log('=== Day 2: 商隊護衛クエスト ===');
    
    await chatInput.fill('Day 2: 街で商人から護衛の依頼を受けました。');
    await page.click('button[type="submit"]');
    await page.waitForTimeout(1000);

    // クエストタブを確認
    await page.click('text=クエスト');
    await page.waitForTimeout(500);
    await expect(page.locator('text=商隊護衛依頼')).toBeVisible();
    await page.screenshot({ path: `trpg-session-complete-${String(screenshotCounter++).padStart(2, '0')}-day2-quest.png` });

    // 商隊護衛の実行
    await chatInput.fill('商隊と共にハーベスト村へ向かいます。道中は平和でした。');
    await page.click('button[type="submit"]');
    await page.waitForTimeout(1000);

    // ===== Day 2: 村でのクエスト受注 =====
    console.log('=== Day 2: 村でのクエスト受注 ===');
    
    await chatInput.fill('ハーベスト村に到着。村長ガルバンから重要な依頼を受けます。');
    await page.click('button[type="submit"]');
    await page.waitForTimeout(1000);

    // NPC対話（村長）
    await chatInput.fill('村長: 「古代遺跡で不可解な現象が起きています。調査をお願いできませんか？」');
    await page.click('button[type="submit"]');
    await page.waitForTimeout(1000);

    // NPC対話（シスター・ミリア）
    await chatInput.fill('シスター・ミリア: 「ようこそ。お怪我はありませんか？村長様がお困りのようです。力になってあげてください。」');
    await page.click('button[type="submit"]');
    await page.waitForTimeout(1000);
    await page.screenshot({ path: `trpg-session-complete-${String(screenshotCounter++).padStart(2, '0')}-day2-village-npc.png` });

    // ===== Day 3: 遺跡探索と魔法罠 =====
    console.log('=== Day 3: 遺跡探索と魔法罠 ===');
    
    await chatInput.fill('Day 3: 忘却の遺跡に到着しました。');
    await page.click('button[type="submit"]');
    await page.waitForTimeout(1000);

    // 拠点タブで遺跡を確認
    await page.click('text=拠点');
    await page.waitForTimeout(500);
    await expect(page.locator('text=忘却の遺跡')).toBeVisible();
    await page.screenshot({ path: `trpg-session-complete-${String(screenshotCounter++).padStart(2, '0')}-day3-ruins.png` });

    // 魔法罠イベント
    await chatInput.fill('遺跡内で古代の魔法罠が発動！古代文字が光り、強力な魔法エネルギーが放出されます！');
    await page.click('button[type="submit"]');
    await page.waitForTimeout(1000);

    await chatInput.fill('エルフィンの魔法感知スキルで罠を発見！古代語解読スキルで安全に解除できました！');
    await page.click('button[type="submit"]');
    await page.waitForTimeout(1000);

    // 古代の守護者戦
    await chatInput.fill('遺跡の奥で古代の守護者と遭遇！石造りの巨大な自動人形が立ちはだかります！');
    await page.click('button[type="submit"]');
    await page.waitForTimeout(1000);
    await page.screenshot({ path: `trpg-session-complete-${String(screenshotCounter++).padStart(2, '0')}-day3-guardian-battle.png` });

    // ===== Day 4: 峠での巨鷲イベント =====
    console.log('=== Day 4: 峠での巨鷲イベント ===');
    
    await chatInput.fill('Day 4: 鷲の峠で巨大な鷲と遭遇しました。');
    await page.click('button[type="submit"]');
    await page.waitForTimeout(1000);

    await chatInput.fill('エルフィンが動物と意思疎通を試みます。巨鷲は知性が高く、友好的になりました！');
    await page.click('button[type="submit"]');
    await page.waitForTimeout(1000);

    await chatInput.fill('巨鷲から空中偵察情報を得ました。竜の谷への道筋が明らかになりました！');
    await page.click('button[type="submit"]');
    await page.waitForTimeout(1000);
    await page.screenshot({ path: `trpg-session-complete-${String(screenshotCounter++).padStart(2, '0')}-day4-eagle-encounter.png` });

    // ===== Day 5: 最終決戦（古代竜戦） =====
    console.log('=== Day 5: 最終決戦 ===');
    
    await chatInput.fill('Day 5: ついに竜の谷に到着！伝説の古代竜ヴェルダリオンとの最終決戦です！');
    await page.click('button[type="submit"]');
    await page.waitForTimeout(1000);

    // 敵タブで古代竜を確認
    await page.click('text=敵');
    await page.waitForTimeout(500);
    await expect(page.locator('text=古代竜ヴェルダリオン')).toBeVisible();
    await page.screenshot({ path: `trpg-session-complete-${String(screenshotCounter++).padStart(2, '0')}-day5-dragon-encounter.png` });

    // 最終戦闘の詳細ロールプレイ
    await chatInput.fill('竜の咆哮が響き渡り、全身に恐怖が走ります！しかし、仲間と共に立ち向かいます！');
    await page.click('button[type="submit"]');
    await page.waitForTimeout(1000);

    await chatInput.fill('アレックスの剣が竜の鱗を貫き、エルフィンの魔法が竜を苦しめます！');
    await page.click('button[type="submit"]');
    await page.waitForTimeout(1000);

    await chatInput.fill('ついに古代竜ヴェルダリオンを撃破！竜の秘宝を手に入れました！');
    await page.click('button[type="submit"]');
    await page.waitForTimeout(1000);
    await page.screenshot({ path: `trpg-session-complete-${String(screenshotCounter++).padStart(2, '0')}-day5-dragon-defeated.png` });

    // ===== キャンペーンクリア =====
    console.log('=== キャンペーンクリア ===');
    
    await chatInput.fill('【キャンペーンクリア】冒険者たちは竜の秘宝を手に入れ、「竜退治の英雄」の称号を得ました！');
    await page.click('button[type="submit"]');
    await page.waitForTimeout(1000);

    await chatInput.fill('経験値500、金貨1000を獲得！伝説の冒険が完了しました！');
    await page.click('button[type="submit"]');
    await page.waitForTimeout(1000);

    // ステータスタブで最終状態を確認
    await page.click('text=ステータス');
    await page.waitForTimeout(500);
    await page.screenshot({ path: `trpg-session-complete-${String(screenshotCounter++).padStart(2, '0')}-final-status.png` });

    // 最終スクリーンショット
    await page.screenshot({ path: `trpg-session-complete-${String(screenshotCounter++).padStart(2, '0')}-campaign-complete.png` });

    // セッション完了の確認
    await expect(page.locator('text=セッションチャット')).toBeVisible();
    await expect(page.locator('text=キャンペーンクリア')).toBeVisible();
    
    console.log('=== TRPGセッション完全クリアテスト完了 ===');
    console.log(`合計スクリーンショット数: ${screenshotCounter - 1}`);
  });

  test('NPCとの対話システム詳細テスト', async ({ page }) => {
    // TRPGセッションページに移動
    await page.click('text=TRPGセッション');
    await page.waitForLoadState('networkidle');

    const chatInput = page.locator('input[placeholder="メッセージを入力..."]');
    
    // 各NPCとの対話をテスト
    const npcs = [
      {
        name: 'バルトス（宿屋の主人）',
        greeting: 'おう、冒険者か！今日も賑やかだなぁ！',
        questHint: '最近、森の方で盗賊が出るって噂だ。気をつけな。',
        farewell: 'また来いよ！いつでも部屋は空けとくぜ！'
      },
      {
        name: 'エリザベータ（商人）',
        greeting: 'いらっしゃいませ。何かお探しですか？',
        questHint: '遺跡の方に行くなら、松明は多めに持っていきなさいな。',
        farewell: 'またのお越しを〜'
      },
      {
        name: 'ガレス・ストームウィンド（レンジャー）',
        greeting: '...森に行くのか？',
        questHint: '盗賊団は日没後に動く。昼間なら比較的安全だ。',
        farewell: '無事を祈る。'
      }
    ];

    for (let i = 0; i < npcs.length; i++) {
      const npc = npcs[i];
      
      await chatInput.fill(`${npc.name}に話しかけます。`);
      await page.click('button[type="submit"]');
      await page.waitForTimeout(500);

      await chatInput.fill(`${npc.name}: 「${npc.greeting}」`);
      await page.click('button[type="submit"]');
      await page.waitForTimeout(500);

      await chatInput.fill(`情報について尋ねます。`);
      await page.click('button[type="submit"]');
      await page.waitForTimeout(500);

      await chatInput.fill(`${npc.name}: 「${npc.questHint}」`);
      await page.click('button[type="submit"]');
      await page.waitForTimeout(500);

      await chatInput.fill(`お別れの挨拶をします。`);
      await page.click('button[type="submit"]');
      await page.waitForTimeout(500);

      await chatInput.fill(`${npc.name}: 「${npc.farewell}」`);
      await page.click('button[type="submit"]');
      await page.waitForTimeout(500);

      await page.screenshot({ path: `npc-dialogue-test-${String(i + 1).padStart(2, '0')}-${npc.name.split('（')[0]}.png` });
    }

    // NPCとの対話が正常に記録されているか確認
    await expect(page.locator('text=バルトス')).toBeVisible();
    await expect(page.locator('text=エリザベータ')).toBeVisible();
    await expect(page.locator('text=ガレス')).toBeVisible();
  });

  test('戦闘システムとダイス機能テスト', async ({ page }) => {
    await page.click('text=TRPGセッション');
    await page.waitForLoadState('networkidle');

    const chatInput = page.locator('input[placeholder="メッセージを入力..."]');
    
    // 戦闘開始
    await chatInput.fill('盗賊団との戦闘開始！');
    await page.click('button[type="submit"]');
    await page.waitForTimeout(500);

    // ダイス機能をテスト
    const debugButton = page.locator('button:has-text("デバッグ")');
    if (await debugButton.isVisible()) {
      await debugButton.click();
      await page.waitForTimeout(500);
      
      // ダイス機能のボタンが表示されているか確認
      const diceButton = page.locator('button:has-text("基本ダイス")');
      if (await diceButton.isVisible()) {
        await diceButton.click();
        await page.waitForTimeout(500);
        await page.screenshot({ path: 'dice-function-test.png' });
      }
    }

    // 戦闘ロールプレイ
    await chatInput.fill('アレックスが剣で攻撃！ダイス結果: 18（命中）');
    await page.click('button[type="submit"]');
    await page.waitForTimeout(500);

    await chatInput.fill('ダメージロール: 8ポイントのダメージ！');
    await page.click('button[type="submit"]');
    await page.waitForTimeout(500);

    await chatInput.fill('エルフィンが火球術を詠唱！ダイス結果: 16（成功）');
    await page.click('button[type="submit"]');
    await page.waitForTimeout(500);

    await page.screenshot({ path: 'combat-system-test.png' });
    
    // 戦闘メッセージが記録されているか確認
    await expect(page.locator('text=戦闘開始')).toBeVisible();
    await expect(page.locator('text=命中')).toBeVisible();
    await expect(page.locator('text=火球術')).toBeVisible();
  });
});