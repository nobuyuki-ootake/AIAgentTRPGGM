const { chromium } = require('playwright');

(async () => {
  console.log('空のキャンペーンの確認を開始...');
  
  let browser;
  try {
    browser = await chromium.launch({ 
      headless: false,
      slowMo: 1000 
    });
    
    const context = await browser.newContext({
      viewport: { width: 1200, height: 800 }
    });
    
    const page = await context.newPage();
    
    // コンソールログとエラーをキャプチャ
    page.on('console', msg => {
      console.log(`[Console ${msg.type()}]:`, msg.text());
    });
    
    page.on('pageerror', error => {
      console.error('[Page Error]:', error.message);
    });
    
    console.log('1. ホームページにアクセス...');
    await page.goto('http://localhost:5173', { waitUntil: 'networkidle' });
    
    // ローカルストレージをクリア（完全に空の状態にするため）
    console.log('2. ローカルストレージをクリア...');
    await page.evaluate(() => {
      localStorage.clear();
      // サンプルキャンペーンの自動作成を無効化
      localStorage.setItem('disable_sample_creation', 'true');
    });
    
    // ページをリロード
    await page.reload({ waitUntil: 'networkidle' });
    
    // TRPGセッションページに直接アクセス
    console.log('3. TRPGセッションページにアクセス...');
    await page.goto('http://localhost:5173/trpg-session', { waitUntil: 'networkidle' });
    
    // 少し待機
    await page.waitForTimeout(2000);
    
    console.log('4. ページの内容を確認中...');
    
    // キャンペーン名の確認
    try {
      const campaignName = await page.textContent('[data-testid="campaign-name"]');
      console.log('✓ キャンペーン名:', campaignName);
    } catch (error) {
      console.log('⚠ キャンペーン名が見つかりません');
    }
    
    // 現在地の確認
    try {
      const currentLocation = await page.textContent('[data-testid="current-location"]');
      console.log('✓ 現在地:', currentLocation);
    } catch (error) {
      console.log('⚠ 現在地が見つかりません');
    }
    
    // パーティメンバー数の確認
    try {
      const partyCount = await page.textContent('[data-testid="party-count"]');
      console.log('✓ パーティメンバー数:', partyCount);
    } catch (error) {
      console.log('⚠ パーティメンバー数が見つかりません');
    }
    
    // 拠点タブの確認
    try {
      // 拠点タブをクリック
      const baseTab = await page.locator('button:has-text("拠点")');
      if (await baseTab.isVisible()) {
        await baseTab.click();
        await page.waitForTimeout(1000);
        
        const facilityMessage = await page.locator('text=この場所には利用可能な施設がありません').textContent();
        console.log('✓ 施設メッセージ:', facilityMessage);
      } else {
        console.log('⚠ 拠点タブが見つかりません');
      }
    } catch (error) {
      console.log('⚠ 拠点タブの確認でエラー:', error.message);
    }
    
    // スクリーンショットを撮影
    console.log('5. スクリーンショットを撮影...');
    await page.screenshot({
      path: 'empty-campaign-verification.png',
      fullPage: true
    });
    
    // ページの構造を詳しく確認
    console.log('6. ページ構造の詳細確認...');
    const sessionPageContent = await page.content();
    console.log('ページHTML長:', sessionPageContent.length);
    
    // 主要な要素の存在確認
    const mainElements = [
      '[data-testid="campaign-name"]',
      '[data-testid="current-location"]', 
      '[data-testid="party-count"]',
      'button:has-text("拠点")',
      'button:has-text("チャット")',
      'button:has-text("ダイス")'
    ];
    
    for (const selector of mainElements) {
      try {
        const element = await page.locator(selector);
        const isVisible = await element.isVisible();
        console.log(`✓ ${selector}: ${isVisible ? '表示' : '非表示'}`);
      } catch (error) {
        console.log(`⚠ ${selector}: 見つかりません`);
      }
    }
    
    // 開発者ツールを開いてコンソールエラーを確認
    console.log('7. 開発者ツールでエラー確認...');
    const logs = await page.evaluate(() => {
      const errors = [];
      const originalError = console.error;
      console.error = (...args) => {
        errors.push(args.join(' '));
        originalError.apply(console, args);
      };
      return errors;
    });
    
    if (logs.length > 0) {
      console.log('⚠ コンソールエラー:', logs);
    } else {
      console.log('✓ コンソールエラーなし');
    }
    
    console.log('8. 確認完了 - スクリーンショット: empty-campaign-verification.png');
    
  } catch (error) {
    console.error('確認中にエラーが発生:', error);
  } finally {
    if (browser) {
      await browser.close();
    }
  }
})();