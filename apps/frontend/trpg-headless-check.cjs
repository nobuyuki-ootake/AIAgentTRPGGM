const { chromium } = require('playwright');

async function headlessCheck() {
  const browser = await chromium.launch({ 
    headless: true // ヘッドレスモードで高速化
  });
  
  const context = await browser.newContext();
  const page = await context.newPage();
  
  let consoleMessages = [];
  let consoleErrors = [];
  
  page.on('console', msg => {
    consoleMessages.push(`[${msg.type()}] ${msg.text()}`);
    if (msg.type() === 'error') {
      consoleErrors.push(msg.text());
    }
  });
  
  page.on('pageerror', error => {
    consoleErrors.push(`PAGE ERROR: ${error.message}`);
  });
  
  try {
    console.log('ヘッドレスチェック開始...');
    
    console.log('1. TRPGセッション画面に直接アクセス');
    await page.goto('http://localhost:5173/trpg-session', { 
      waitUntil: 'domcontentloaded', 
      timeout: 15000 
    });
    
    // Wait for React to render
    await page.waitForTimeout(5000);
    
    console.log('2. ページの基本情報');
    const title = await page.title();
    console.log(`ページタイトル: ${title}`);
    
    const url = page.url();
    console.log(`現在のURL: ${url}`);
    
    console.log('3. 主要な要素の確認');
    
    // Check if React root is present
    const reactRoot = await page.locator('#root').count();
    console.log(`React root要素: ${reactRoot > 0 ? '存在' : '存在しない'}`);
    
    // Check for main content
    const hasContent = await page.locator('main, [role="main"], .main-content').count();
    console.log(`メインコンテンツ要素: ${hasContent > 0 ? '存在' : '存在しない'}`);
    
    // Check for TRPG-specific elements
    const trpgElements = await page.locator('[data-testid*="trpg"], [class*="trpg"], [class*="session"]').count();
    console.log(`TRPGセッション関連要素: ${trpgElements}個`);
    
    console.log('4. コンソールメッセージの分析');
    console.log(`総メッセージ数: ${consoleMessages.length}`);
    console.log(`エラー数: ${consoleErrors.length}`);
    
    if (consoleErrors.length > 0) {
      console.log('主要なエラー:');
      consoleErrors.slice(0, 5).forEach((error, index) => {
        console.log(`  ${index + 1}. ${error.substring(0, 100)}...`);
      });
    }
    
    // Look for infinite loop indicators
    const infiniteLoopIndicators = consoleErrors.filter(error => 
      error.includes('Maximum update depth exceeded') || 
      error.includes('Too many re-renders')
    );
    
    if (infiniteLoopIndicators.length > 0) {
      console.log(`⚠️ 無限ループエラーが検出されました: ${infiniteLoopIndicators.length}件`);
    } else {
      console.log('✅ 無限ループエラーは検出されませんでした');
    }
    
    console.log('5. キャンペーンデータの確認');
    
    // Check for campaign data logs
    const campaignLogs = consoleMessages.filter(msg => 
      msg.includes('キャンペーン') || 
      msg.includes('Campaign') ||
      msg.includes('test-campaign')
    );
    
    console.log(`キャンペーン関連ログ: ${campaignLogs.length}件`);
    if (campaignLogs.length > 0) {
      campaignLogs.slice(0, 3).forEach((log, index) => {
        console.log(`  ${index + 1}. ${log.substring(0, 80)}...`);
      });
    }
    
    console.log('6. スクリーンショット撮影');
    await page.screenshot({ 
      path: 'trpg-headless-check-screenshot.png',
      fullPage: true 
    });
    
    console.log('ヘッドレスチェック完了');
    
  } catch (error) {
    console.error('エラーが発生しました:', error.message);
    await page.screenshot({ 
      path: 'trpg-headless-check-error.png',
      fullPage: true 
    });
  } finally {
    await browser.close();
  }
}

headlessCheck();