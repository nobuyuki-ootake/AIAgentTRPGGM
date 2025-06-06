const { chromium } = require('playwright');

async function debugTRPGNavigation() {
  console.log('🔍 TRPGセッション画面ナビゲーションのデバッグを開始します...');
  
  const browser = await chromium.launch({ headless: false });
  const context = await browser.newContext({
    viewport: { width: 1920, height: 1080 }
  });
  const page = await context.newPage();

  try {
    // ホーム画面に移動
    console.log('📍 ホーム画面にアクセス');
    await page.goto('http://localhost:5173');
    await page.waitForLoadState('networkidle');
    
    // スクリーンショット
    await page.screenshot({ 
      path: '/mnt/c/Users/irure/git/AIAgentTRPGGM/apps/frontend/test-results/debug-01-home.png',
      fullPage: true 
    });

    // デベロッパーモード確認・有効化
    console.log('🔧 デベロッパーモードを確認');
    const devToggle = page.locator('[data-testid="developer-mode-toggle"]');
    if (await devToggle.isVisible()) {
      await devToggle.click();
      console.log('✅ デベロッパーモードを有効化しました');
      await page.waitForTimeout(1000);
    }

    // 利用可能なナビゲーションリンクを確認
    console.log('🔍 利用可能なナビゲーションリンクを確認');
    const navLinks = page.locator('nav a, .sidebar a, [role="navigation"] a');
    const linkCount = await navLinks.count();
    console.log(`📋 ナビゲーションリンク数: ${linkCount}`);
    
    for (let i = 0; i < linkCount; i++) {
      const link = navLinks.nth(i);
      const href = await link.getAttribute('href');
      const text = await link.textContent();
      console.log(`🔗 リンク ${i+1}: "${text}" -> ${href}`);
    }

    // TRPGセッション関連のリンクを探す
    console.log('🎮 TRPGセッション関連のリンクを探索');
    const trpgLinks = page.locator('a[href*="trpg"], a[href*="session"], a:has-text("TRPG"), a:has-text("セッション")');
    const trpgLinkCount = await trpgLinks.count();
    console.log(`🎯 TRPGセッション関連リンク数: ${trpgLinkCount}`);
    
    for (let i = 0; i < trpgLinkCount; i++) {
      const link = trpgLinks.nth(i);
      const href = await link.getAttribute('href');
      const text = await link.textContent();
      console.log(`🎲 TRPGリンク ${i+1}: "${text}" -> ${href}`);
    }

    // 直接URLでTRPGセッション画面にアクセスを試行
    console.log('🎮 直接URLでTRPGセッション画面にアクセス');
    await page.goto('http://localhost:5173/trpg-session');
    await page.waitForLoadState('networkidle');
    
    // エラーページかどうか確認
    const pageTitle = await page.title();
    const pageContent = await page.textContent('body');
    console.log(`📄 ページタイトル: ${pageTitle}`);
    console.log(`📝 ページにエラーが含まれているか: ${pageContent.includes('404') || pageContent.includes('Not Found') || pageContent.includes('エラー')}`);
    
    // スクリーンショット
    await page.screenshot({ 
      path: '/mnt/c/Users/irure/git/AIAgentTRPGGM/apps/frontend/test-results/debug-02-trpg-session-direct.png',
      fullPage: true 
    });

    // 実際のページ内容を確認
    console.log('🔍 ページ内容の詳細確認');
    const mainContent = await page.locator('main, #root, .app').textContent() || '';
    console.log(`📋 メインコンテンツの一部: ${mainContent.substring(0, 200)}...`);

    // TRPGセッション関連のコンポーネントが存在するか確認
    const sessionComponents = page.locator('[data-testid*="session"], [data-testid*="trpg"], .session, .trpg');
    const sessionComponentCount = await sessionComponents.count();
    console.log(`🎮 セッション関連コンポーネント数: ${sessionComponentCount}`);

    console.log('\n✅ TRPGナビゲーションデバッグが完了しました');

  } catch (error) {
    console.error('❌ デバッグ中にエラーが発生しました:', error);
    
    await page.screenshot({ 
      path: '/mnt/c/Users/irure/git/AIAgentTRPGGM/apps/frontend/test-results/debug-error.png',
      fullPage: true 
    });
  } finally {
    await browser.close();
  }
}

debugTRPGNavigation().catch(console.error);