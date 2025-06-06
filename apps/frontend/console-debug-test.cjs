const { chromium } = require('playwright');

async function debugTRPGSession() {
  console.log('🚀 TRPGセッション画面のデバッグテストを開始...');
  
  const browser = await chromium.launch({ 
    headless: false,
    slowMo: 1000
  });
  
  const page = await browser.newPage();
  
  // コンソールメッセージを監視
  const consoleLogs = [];
  page.on('console', msg => {
    const message = `[${msg.type().toUpperCase()}] ${msg.text()}`;
    consoleLogs.push(message);
    console.log(`📝 Console: ${message}`);
  });

  // エラーを監視
  const pageErrors = [];
  page.on('pageerror', error => {
    const errorMessage = `[PAGE ERROR] ${error.message}`;
    pageErrors.push(errorMessage);
    console.error(`❌ Page Error: ${error.message}`);
    console.error(`Stack: ${error.stack}`);
  });

  // Request失敗を監視
  page.on('requestfailed', request => {
    console.error(`❌ Request Failed: ${request.url()} - ${request.failure()?.errorText}`);
  });

  // Response監視
  page.on('response', response => {
    if (!response.ok()) {
      console.warn(`⚠️ HTTP ${response.status()}: ${response.url()}`);
    }
  });
  
  try {
    console.log('📱 ホームページにアクセス...');
    await page.goto('http://localhost:5173');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);
    
    console.log('📄 ページタイトル:', await page.title());
    console.log('🌐 現在のURL:', page.url());
    
    // ページの内容を確認
    const bodyText = await page.locator('body').textContent();
    console.log(`📝 ページ内容の文字数: ${bodyText?.length || 0}文字`);
    
    if (bodyText && bodyText.length > 0) {
      console.log('📝 ページ内容の一部:', bodyText.substring(0, 200) + '...');
    }
    
    // スクリーンショット
    await page.screenshot({ path: 'test-results/debug-01-home.png' });
    
    // TRPGセッションページに移動
    console.log('\n🎮 TRPGセッションページにアクセス...');
    await page.goto('http://localhost:5173/trpg-session');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(3000);
    
    console.log('📄 ページタイトル:', await page.title());
    console.log('🌐 現在のURL:', page.url());
    
    // ページの内容を再確認
    const sessionBodyText = await page.locator('body').textContent();
    console.log(`📝 セッションページ内容の文字数: ${sessionBodyText?.length || 0}文字`);
    
    if (sessionBodyText && sessionBodyText.length > 0) {
      console.log('📝 セッションページ内容の一部:', sessionBodyText.substring(0, 200) + '...');
    }
    
    // DOM構造を確認
    const rootElement = await page.locator('#root').innerHTML();
    console.log(`📝 #root要素の内容の文字数: ${rootElement?.length || 0}文字`);
    
    if (rootElement && rootElement.length > 0) {
      console.log('📝 #root要素の内容の一部:', rootElement.substring(0, 300) + '...');
    }
    
    // React DevToolsでの確認
    const reactElements = await page.locator('[data-reactroot], [data-react-helmet]').count();
    console.log(`⚛️ React要素数: ${reactElements}個`);
    
    // エラーバウンダリの確認
    const errorBoundaryElements = await page.locator('text=エラーが発生しました, text=Error').count();
    console.log(`🚨 エラーバウンダリ要素数: ${errorBoundaryElements}個`);
    
    // ローディング状態の確認
    const loadingElements = await page.locator('text=読み込み中, text=Loading').count();
    console.log(`⏳ ローディング要素数: ${loadingElements}個`);
    
    // スクリーンショット
    await page.screenshot({ path: 'test-results/debug-02-session.png', fullPage: true });
    
    // ネットワークの状態確認
    console.log('\n🌐 ネットワークの状態確認...');
    const networkRequests = [];
    page.on('request', request => {
      networkRequests.push({
        url: request.url(),
        method: request.method(),
        resourceType: request.resourceType()
      });
    });
    
    // 少し待ってからネットワーク状況を確認
    await page.waitForTimeout(2000);
    
    console.log(`📡 ネットワークリクエスト数: ${networkRequests.length}件`);
    if (networkRequests.length > 0) {
      console.log('📡 最近のリクエスト:');
      networkRequests.slice(-5).forEach((req, index) => {
        console.log(`   ${index + 1}. ${req.method} ${req.resourceType}: ${req.url}`);
      });
    }
    
    console.log('\n📊 デバッグ結果サマリー:');
    console.log('=================================');
    console.log(`📝 コンソールログ数: ${consoleLogs.length}件`);
    console.log(`❌ ページエラー数: ${pageErrors.length}件`);
    console.log(`📡 ネットワークリクエスト数: ${networkRequests.length}件`);
    console.log(`⚛️ React要素数: ${reactElements}個`);
    console.log(`📝 ページ内容文字数: ${sessionBodyText?.length || 0}文字`);
    console.log('=================================');
    
    if (pageErrors.length > 0) {
      console.log('\n❌ 発生したページエラー:');
      pageErrors.forEach((error, index) => {
        console.log(`   ${index + 1}. ${error}`);
      });
    }
    
    if (consoleLogs.length > 0) {
      console.log('\n📝 コンソールログ（最新10件）:');
      consoleLogs.slice(-10).forEach((log, index) => {
        console.log(`   ${index + 1}. ${log}`);
      });
    }
    
    console.log('\n⏰ 15秒後にブラウザを閉じます（手動確認用）...');
    await page.waitForTimeout(15000);
    
  } catch (error) {
    console.error('❌ テスト中にエラーが発生しました:', error.message);
    console.error('Stack:', error.stack);
    await page.screenshot({ path: 'test-results/debug-error.png', fullPage: true });
  } finally {
    await browser.close();
    console.log('✅ デバッグテスト完了');
  }
}

debugTRPGSession().catch(console.error);