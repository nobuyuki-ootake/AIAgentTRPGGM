const { chromium } = require('playwright');

async function analyzeConsoleErrors() {
  console.log('🔍 コンソールエラー分析を開始します...');
  
  const browser = await chromium.launch({ headless: false });
  const context = await browser.newContext({
    viewport: { width: 1920, height: 1080 }
  });
  const page = await context.newPage();

  const allMessages = [];
  
  // すべてのコンソールメッセージをキャプチャ
  page.on('console', msg => {
    const type = msg.type();
    const text = msg.text();
    const location = msg.location();
    const timestamp = new Date().toISOString();
    
    const message = {
      type,
      text,
      location: `${location.url}:${location.lineNumber}:${location.columnNumber}`,
      timestamp
    };
    
    allMessages.push(message);
    
    // リアルタイムでエラーと警告を表示
    if (type === 'error') {
      console.log(`❌ [${timestamp}] ERROR: ${text}`);
      console.log(`   📍 Location: ${message.location}`);
    } else if (type === 'warning') {
      console.log(`⚠️ [${timestamp}] WARNING: ${text}`);
    }
  });

  // ページエラーをキャプチャ
  page.on('pageerror', error => {
    console.log(`💥 PAGE ERROR: ${error.message}`);
    console.log(`   📍 Stack: ${error.stack}`);
  });

  try {
    console.log('🎮 TRPGセッション画面にアクセス中...');
    await page.goto('http://localhost:5173/trpg-session');
    
    // 段階的に読み込みを待機
    console.log('⏳ 初期読み込み待機...');
    await page.waitForLoadState('domcontentloaded');
    await page.waitForTimeout(2000);
    
    console.log('⏳ ネットワーク読み込み待機...');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(3000);

    // 追加の要素読み込み待機
    console.log('⏳ 追加要素読み込み確認...');
    try {
      await page.waitForSelector('[data-testid="session-header"], .session-header, main', { timeout: 5000 });
    } catch (e) {
      console.log('⚠️ セッション要素の読み込みがタイムアウトしました');
    }

    // スクリーンショット
    await page.screenshot({ 
      path: '/mnt/c/Users/irure/git/AIAgentTRPGGM/apps/frontend/test-results/console-analysis-screenshot.png',
      fullPage: true 
    });

    // ページ内容の確認
    console.log('\n📝 ページ内容の確認:');
    const title = await page.title();
    console.log(`📄 タイトル: ${title}`);
    
    const bodyText = await page.textContent('body');
    const hasContent = bodyText && bodyText.trim().length > 10;
    console.log(`📋 ページに内容があるか: ${hasContent}`);
    
    if (hasContent) {
      console.log(`📝 内容の一部: ${bodyText.substring(0, 200)}...`);
    }

    // React要素の確認
    console.log('\n⚛️ React要素の確認:');
    const reactRoot = await page.locator('#root').count();
    console.log(`🏗️ React root要素: ${reactRoot > 0 ? '存在' : '不在'}`);
    
    if (reactRoot > 0) {
      const rootContent = await page.locator('#root').textContent();
      console.log(`📦 Root内容: ${rootContent ? rootContent.substring(0, 100) + '...' : '空'}`);
    }

    // 最終メッセージ要約
    console.log('\n📊 コンソールメッセージ要約:');
    const errors = allMessages.filter(m => m.type === 'error');
    const warnings = allMessages.filter(m => m.type === 'warning');
    const logs = allMessages.filter(m => m.type === 'log');
    
    console.log(`❌ エラー数: ${errors.length}`);
    console.log(`⚠️ 警告数: ${warnings.length}`);
    console.log(`📄 ログ数: ${logs.length}`);
    
    if (errors.length > 0) {
      console.log('\n🚨 詳細エラー情報:');
      errors.forEach((error, index) => {
        console.log(`\n❌ エラー ${index + 1}:`);
        console.log(`   💬 メッセージ: ${error.text}`);
        console.log(`   📍 場所: ${error.location}`);
        console.log(`   🕐 時刻: ${error.timestamp}`);
      });
    }

    if (warnings.length > 0) {
      console.log('\n⚠️ 詳細警告情報:');
      warnings.forEach((warning, index) => {
        console.log(`\n⚠️ 警告 ${index + 1}:`);
        console.log(`   💬 メッセージ: ${warning.text}`);
        console.log(`   📍 場所: ${warning.location}`);
      });
    }

  } catch (error) {
    console.error('❌ 分析中にエラーが発生しました:', error);
  } finally {
    await browser.close();
  }
}

analyzeConsoleErrors().catch(console.error);