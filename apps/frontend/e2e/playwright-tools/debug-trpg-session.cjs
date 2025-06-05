const { chromium } = require('playwright');

(async () => {
  console.log('🚀 TRPG セッション突破作戦開始！');
  
  const browser = await chromium.launch({ 
    headless: false,
    slowMo: 500,
    devtools: true  // デベロッパーツールを開く
  });
  
  const context = await browser.newContext({
    viewport: { width: 1920, height: 1080 }
  });
  
  const page = await context.newPage();
  
  // すべてのログとエラーをキャプチャ
  page.on('console', msg => {
    const type = msg.type();
    const text = msg.text();
    const emoji = type === 'error' ? '❌' : type === 'warn' ? '⚠️' : '🔍';
    console.log(`${emoji} [${type.toUpperCase()}]:`, text);
  });
  
  page.on('pageerror', err => {
    console.log('💥 PAGE ERROR:', err.message);
    console.log('📍 STACK:', err.stack);
  });
  
  page.on('requestfailed', request => {
    console.log('🌐 REQUEST FAILED:', request.url(), request.failure()?.errorText);
  });
  
  try {
    console.log('📍 Step 1: localhost:5173にアクセス');
    await page.goto('http://localhost:5173', { 
      waitUntil: 'networkidle',
      timeout: 30000 
    });
    
    // 初期画面のスクリーンショット
    await page.screenshot({ path: 'e2e/playwright-tools/step1-initial.png', fullPage: true });
    console.log('📸 初期画面スクリーンショット保存');
    
    // Reactアプリが読み込まれるまで待機
    console.log('⏳ Reactアプリの読み込み待機...');
    await page.waitForTimeout(3000);
    
    // エラーチェック
    const hasErrors = await page.evaluate(() => {
      return window.console && window.console.error ? true : false;
    });
    
    // ホーム画面の要素確認
    console.log('🏠 Step 2: ホーム画面の要素確認');
    const homeElements = await page.evaluate(() => {
      const elements = {
        root: !!document.querySelector('#root'),
        title: document.title,
        bodyText: document.body.textContent?.substring(0, 200),
        buttons: Array.from(document.querySelectorAll('button')).length,
        links: Array.from(document.querySelectorAll('a')).length
      };
      return elements;
    });
    
    console.log('🔍 ホーム画面分析:', homeElements);
    
    if (homeElements.bodyText && homeElements.bodyText.trim()) {
      console.log('✅ コンテンツが表示されています！');
      
      // TRPGセッションページへのナビゲーション試行
      console.log('🎯 Step 3: TRPGセッションページを探索');
      
      // 可能なナビゲーション方法を試行
      const navigationAttempts = [
        { method: 'URL直接', url: '/trpg-session' },
        { method: 'URL直接', url: '/session' },
        { method: 'URL直接', url: '/trpg' },
      ];
      
      for (const attempt of navigationAttempts) {
        try {
          console.log(`🚪 ${attempt.method}: ${attempt.url}`);
          await page.goto(`http://localhost:5173${attempt.url}`, { 
            waitUntil: 'networkidle',
            timeout: 10000 
          });
          
          await page.waitForTimeout(2000);
          
          const pageContent = await page.evaluate(() => {
            return {
              title: document.title,
              hasContent: document.body.textContent?.trim().length > 0,
              url: window.location.pathname
            };
          });
          
          console.log(`📋 結果:`, pageContent);
          
          if (pageContent.hasContent) {
            await page.screenshot({ 
              path: `e2e/playwright-tools/trpg-session-${attempt.url.replace('/', '')}.png`, 
              fullPage: true 
            });
            console.log(`📸 ${attempt.url} スクリーンショット保存`);
          }
          
        } catch (navError) {
          console.log(`❌ ${attempt.method} 失敗:`, navError.message);
        }
      }
      
      // ホーム画面に戻ってナビゲーション要素を探す
      console.log('🏠 ホーム画面に戻ってナビゲーション探索');
      await page.goto('http://localhost:5173', { waitUntil: 'networkidle' });
      await page.waitForTimeout(2000);
      
      // クリック可能な要素を探す
      const clickableElements = await page.evaluate(() => {
        const elements = [];
        
        // ボタンとリンクを探す
        const buttons = document.querySelectorAll('button, a, [role="button"]');
        buttons.forEach((el, index) => {
          const text = el.textContent?.trim();
          const href = el.getAttribute('href');
          if (text || href) {
            elements.push({
              index,
              tag: el.tagName,
              text,
              href,
              id: el.id,
              className: el.className
            });
          }
        });
        
        return elements;
      });
      
      console.log('🔘 クリック可能要素:', clickableElements);
      
      // TRPGやセッション関連のキーワードを含む要素をクリック
      const trpgKeywords = ['trpg', 'session', 'セッション', 'ゲーム', 'キャンペーン'];
      
      for (const element of clickableElements) {
        const text = (element.text || '').toLowerCase();
        const matchesKeyword = trpgKeywords.some(keyword => 
          text.includes(keyword) || text.includes(keyword.toLowerCase())
        );
        
        if (matchesKeyword) {
          try {
            console.log(`🎯 TRPG関連要素をクリック: "${element.text}"`);
            
            if (element.href) {
              await page.click(`a[href="${element.href}"]`);
            } else {
              await page.click(`button:nth-child(${element.index + 1})`);
            }
            
            await page.waitForTimeout(3000);
            
            const currentUrl = await page.url();
            const currentContent = await page.evaluate(() => document.body.textContent?.substring(0, 300));
            
            console.log(`📍 遷移先: ${currentUrl}`);
            console.log(`📝 内容: ${currentContent}`);
            
            await page.screenshot({ 
              path: `e2e/playwright-tools/trpg-navigation-${Date.now()}.png`, 
              fullPage: true 
            });
            
            break;
            
          } catch (clickError) {
            console.log(`❌ クリック失敗: ${clickError.message}`);
          }
        }
      }
      
    } else {
      console.log('❌ コンテンツが表示されていません - エラー調査が必要');
    }
    
    // 最終的なブラウザー表示時間
    console.log('🔍 10秒間ブラウザーを表示してデバッグ確認...');
    await page.waitForTimeout(10000);
    
  } catch (error) {
    console.log('💥 メインエラー:', error.message);
    await page.screenshot({ 
      path: 'e2e/playwright-tools/debug-error.png',
      fullPage: true 
    });
  }
  
  await browser.close();
  console.log('🏁 デバッグセッション完了');
})();