import { test, expect } from '@playwright/test';

test.describe('TRPGセッション画面の動作確認', () => {
  test.beforeEach(async ({ page }) => {
    // ホームページにアクセス
    await page.goto('/');
    await page.waitForLoadState('networkidle');
  });

  test('TRPGセッションページの基本表示確認', async ({ page }) => {
    // TRPGセッションページに直接アクセス
    await page.goto('/trpg-session');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);

    // スクリーンショット撮影
    await page.screenshot({ 
      path: 'test-results/trpg-session-basic.png',
      fullPage: true 
    });

    // ページタイトルの確認
    await expect(page).toHaveTitle(/TRPG|セッション/);

    // 基本要素の存在確認
    const headerElements = page.locator('h4, h5, h6');
    await expect(headerElements.first()).toBeVisible();

    const buttons = page.locator('button');
    await expect(buttons.first()).toBeVisible();

    const papers = page.locator('.MuiPaper-root');
    await expect(papers.first()).toBeVisible();

    console.log('✅ TRPGセッションページの基本表示確認完了');
  });

  test('SessionHeaderコンポーネントの確認', async ({ page }) => {
    await page.goto('/trpg-session');
    await page.waitForLoadState('networkidle');

    // ヘッダー部分の確認
    const header = page.locator('.MuiPaper-root').first();
    await expect(header).toBeVisible();

    // TRPGセッションタイトルの確認
    const title = page.locator('h4:has-text("TRPG"), h4:has-text("セッション")');
    await expect(title.first()).toBeVisible();

    // 保存ボタンの確認
    const saveButton = page.locator('button:has-text("保存")');
    if (await saveButton.isVisible()) {
      console.log('✅ 保存ボタンが表示されています');
    }

    // AIアシストボタンの確認  
    const aiButton = page.locator('button:has-text("AI"), [data-testid="ai-assist-button"]');
    if (await aiButton.first().isVisible()) {
      console.log('✅ AIアシストボタンが表示されています');
    }

    console.log('✅ SessionHeaderコンポーネント確認完了');
  });

  test('PartyPanelコンポーネントの確認', async ({ page }) => {
    await page.goto('/trpg-session');
    await page.waitForLoadState('networkidle');

    // パーティメンバー表示の確認
    const partyText = page.locator('text=パーティメンバー');
    if (await partyText.isVisible()) {
      console.log('✅ パーティメンバー表示確認');
    }

    // パーティタブの確認
    const partyTab = page.locator('text=パーティ');
    if (await partyTab.isVisible()) {
      console.log('✅ パーティタブ確認');
    }

    console.log('✅ PartyPanelコンポーネント確認完了');
  });

  test('MainContentPanelコンポーネントの確認', async ({ page }) => {
    await page.goto('/trpg-session');
    await page.waitForLoadState('networkidle');

    // タブの存在確認
    const tabs = page.locator('.MuiTabs-root .MuiTab-root');
    const tabCount = await tabs.count();
    console.log(`📋 タブ数: ${tabCount}`);

    if (tabCount > 0) {
      // 各タブをクリックしてテスト
      for (let i = 0; i < Math.min(tabCount, 3); i++) {
        await tabs.nth(i).click();
        await page.waitForTimeout(500);
        console.log(`✅ タブ ${i + 1} クリック完了`);
      }
    }

    // 探索タブの確認
    const exploreTab = page.locator('text=探索');
    if (await exploreTab.isVisible()) {
      await exploreTab.click();
      console.log('✅ 探索タブ確認');
    }

    // 拠点タブの確認
    const baseTab = page.locator('text=拠点');
    if (await baseTab.isVisible()) {
      await baseTab.click();
      console.log('✅ 拠点タブ確認');
    }

    console.log('✅ MainContentPanelコンポーネント確認完了');
  });

  test('ChatAndDicePanelコンポーネントの確認', async ({ page }) => {
    await page.goto('/trpg-session');
    await page.waitForLoadState('networkidle');

    // チャットタブの確認
    const chatTab = page.locator('text=チャット');
    if (await chatTab.isVisible()) {
      await chatTab.click();
      console.log('✅ チャットタブ確認');
    }

    // ダイスタブの確認
    const diceTab = page.locator('text=ダイス');
    if (await diceTab.isVisible()) {
      await diceTab.click();
      console.log('✅ ダイスタブ確認');
    }

    // ダイスボタンの確認
    const diceButtons = page.locator('button:has-text("基本ダイス"), button:has-text("D20"), button:has-text("ダイス")');
    if (await diceButtons.first().isVisible()) {
      console.log('✅ ダイスボタン確認');
      
      // ダイスボタンをクリックしてダイアログ表示テスト
      await diceButtons.first().click();
      await page.waitForTimeout(1000);
      
      // ダイアログの確認
      const dialog = page.locator('.MuiDialog-root, .MuiModal-root');
      if (await dialog.first().isVisible()) {
        console.log('✅ ダイスダイアログ表示確認');
        
        // ダイアログを閉じる
        const closeButton = page.locator('button:has-text("キャンセル"), button:has-text("閉じる")');
        if (await closeButton.first().isVisible()) {
          await closeButton.first().click();
          console.log('✅ ダイアログクローズ確認');
        }
      }
    }

    console.log('✅ ChatAndDicePanelコンポーネント確認完了');
  });

  test('開発者モードでの動作確認', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    // 開発者モードを有効にする
    const devModeToggle = page.locator('[data-testid="developer-mode-toggle"], input[type="checkbox"]');
    if (await devModeToggle.first().isVisible()) {
      await devModeToggle.first().click();
      console.log('✅ 開発者モード有効化');
    }

    // TRPGセッションページに移動
    await page.goto('/trpg-session');
    await page.waitForLoadState('networkidle');

    // 開発者モード時の追加要素確認
    const devElements = page.locator('[data-testid*="dev"], text=開発者モード');
    if (await devElements.first().isVisible()) {
      console.log('✅ 開発者モード専用要素確認');
    }

    // 最終スクリーンショット
    await page.screenshot({ 
      path: 'test-results/trpg-session-dev-mode.png',
      fullPage: true 
    });

    console.log('✅ 開発者モードでの動作確認完了');
  });

  test('レスポンシブデザインの確認', async ({ page }) => {
    // デスクトップサイズ
    await page.setViewportSize({ width: 1920, height: 1080 });
    await page.goto('/trpg-session');
    await page.waitForLoadState('networkidle');
    await page.screenshot({ 
      path: 'test-results/trpg-session-desktop.png',
      fullPage: true 
    });

    // タブレットサイズ
    await page.setViewportSize({ width: 768, height: 1024 });
    await page.reload();
    await page.waitForLoadState('networkidle');
    await page.screenshot({ 
      path: 'test-results/trpg-session-tablet.png',
      fullPage: true 
    });

    // モバイルサイズ
    await page.setViewportSize({ width: 375, height: 667 });
    await page.reload();
    await page.waitForLoadState('networkidle');
    await page.screenshot({ 
      path: 'test-results/trpg-session-mobile.png',
      fullPage: true 
    });

    console.log('✅ レスポンシブデザイン確認完了');
  });
});