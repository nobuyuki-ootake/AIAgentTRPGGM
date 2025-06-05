const { chromium } = require('playwright');

(async () => {
  console.log('🔍 詳細エラーデバッグ開始');
  
  const browser = await chromium.launch({ 
    headless: false,
    slowMo: 500,
    devtools: true
  });
  
  const context = await browser.newContext();
  const page = await context.newPage();
  
  // エラーの詳細ログ
  page.on('console', msg => {
    const type = msg.type();
    const text = msg.text();
    const location = msg.location();
    
    console.log(`[${type.toUpperCase()}] ${text}`);
    if (location.url) {
      console.log(`  🗂️  ${location.url}:${location.lineNumber}:${location.columnNumber}`);
    }
  });
  
  page.on('pageerror', err => {
    console.log('💥 PAGE ERROR DETAILS:');
    console.log('  Message:', err.message);
    console.log('  Name:', err.name);
    console.log('  Stack:', err.stack);
    
    // エラーの行を特定
    if (err.stack) {
      const stackLines = err.stack.split('\n');
      stackLines.forEach((line, index) => {
        if (line.includes('http://localhost:5173')) {
          console.log(`  📍 Line ${index}: ${line.trim()}`);
        }
      });
    }
  });
  
  page.on('requestfailed', request => {
    console.log(`🌐 REQUEST FAILED: ${request.url()}`);
    console.log(`  Failure: ${request.failure()?.errorText}`);
  });
  
  try {
    console.log('🚀 ページロード開始...');
    await page.goto('http://localhost:5173', { 
      waitUntil: 'networkidle',
      timeout: 30000 
    });
    
    console.log('✅ ページロード完了');
    
    // エラーがあってもUI要素をチェック
    console.log('🔍 UI要素を探索中...');
    
    const pageInfo = await page.evaluate(() => {
      return {
        title: document.title,
        hasRoot: !!document.querySelector('#root'),
        rootContent: document.querySelector('#root')?.innerHTML?.substring(0, 500),
        bodyText: document.body.textContent?.substring(0, 200),
        scripts: Array.from(document.querySelectorAll('script')).map(s => s.src || 'inline'),
        errors: window.console?.error ? 'console.error available' : 'no console.error'
      };
    });
    
    console.log('📊 ページ情報:', pageInfo);
    
    // Reactのマウント状態を確認
    const reactStatus = await page.evaluate(() => {
      return {
        reactDevTools: !!window.React,
        reactDOMRender: !!window.ReactDOM,
        rootElement: document.querySelector('#root'),
        reactFiberNode: document.querySelector('#root')?._reactInternalFiber ? 'found' : 'not found'
      };
    });
    
    console.log('⚛️  React状態:', reactStatus);
    
    // エラーが解決されたらTRPGセッションにナビゲート
    if (pageInfo.hasRoot && pageInfo.rootContent && pageInfo.rootContent.length > 100) {
      console.log('🎯 コンテンツが読み込まれた！TRPGセッションを探索');
      
      // TRPGセッション関連のURLを試行
      const trpgUrls = [
        '/trpg-session',
        '/session',
        '/game',
        '/play',
        '/campaign'
      ];
      
      for (const url of trpgUrls) {
        try {
          console.log(`🚪 ${url}へナビゲート中...`);
          await page.goto(`http://localhost:5173${url}`, { 
            waitUntil: 'networkidle',
            timeout: 5000 
          });
          
          const urlContent = await page.evaluate(() => ({
            url: window.location.pathname,
            title: document.title,
            hasContent: document.body.textContent?.trim().length > 50
          }));
          
          console.log(`📍 ${url} 結果:`, urlContent);
          
          if (urlContent.hasContent) {
            await page.screenshot({ 
              path: `e2e/playwright-tools/trpg-found-${url.replace('/', '')}.png`, 
              fullPage: true 
            });
            console.log(`📸 ${url}でコンテンツ発見！スクリーンショット保存`);
            break;
          }
          
        } catch (navError) {
          console.log(`❌ ${url}ナビゲート失敗:`, navError.message);
        }
      }
    }
    
    console.log('⏳ 10秒間ブラウザー表示でデバッグ確認...');
    await page.waitForTimeout(10000);
    
  } catch (error) {
    console.log('💥 メインエラー:', error.message);
    console.log('📸 エラー時スクリーンショット撮影...');
    await page.screenshot({ 
      path: 'e2e/playwright-tools/detailed-error.png',
      fullPage: true 
    });
  }
  
  await browser.close();
  console.log('🏁 詳細エラーデバッグ完了');
})();