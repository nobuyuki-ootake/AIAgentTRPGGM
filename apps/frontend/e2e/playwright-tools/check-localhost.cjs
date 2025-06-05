const { chromium } = require('playwright');

(async () => {
  console.log('Chromiumブラウザーを起動中...');
  const browser = await chromium.launch({ 
    headless: false,
    slowMo: 1000 
  });
  
  const context = await browser.newContext({
    viewport: { width: 1920, height: 1080 }
  });
  
  const page = await context.newPage();
  
  // コンソールログとエラーをキャプチャ
  page.on('console', msg => console.log('🔥 PAGE LOG:', msg.text()));
  page.on('pageerror', err => console.log('❌ PAGE ERROR:', err.message));
  
  try {
    console.log('📍 localhost:5173にアクセス中...');
    await page.goto('http://localhost:5173', { 
      waitUntil: 'networkidle',
      timeout: 30000 
    });

    console.log('✅ ページ読み込み完了');
    
    // ページタイトルを確認
    const title = await page.title();
    console.log('📄 ページタイトル:', title);
    
    // HTML内容を確認
    const bodyHTML = await page.locator('body').innerHTML();
    console.log('📝 Body HTML（最初の500文字）:', bodyHTML.substring(0, 500));
    
    // Reactルート要素の確認
    const rootExists = await page.locator('#root').count() > 0;
    console.log('⚛️  Reactルート要素:', rootExists ? '✅ 存在' : '❌ なし');
    
    if (rootExists) {
      const rootContent = await page.locator('#root').textContent();
      console.log('⚛️  ルート内容:', rootContent?.substring(0, 300));
    }
    
    // スクリーンショット撮影
    await page.screenshot({ 
      path: 'localhost-debug.png',
      fullPage: true 
    });
    console.log('📸 スクリーンショット保存: localhost-debug.png');
    
    // 5秒間ブラウザーを表示
    console.log('🔍 5秒間ブラウザーを表示します...');
    await page.waitForTimeout(5000);
    
  } catch (error) {
    console.log('💥 エラー発生:', error.message);
    
    // エラー時のスクリーンショット
    await page.screenshot({ 
      path: 'localhost-error.png',
      fullPage: true 
    });
    console.log('📸 エラー時スクリーンショット保存: localhost-error.png');
  }
  
  await browser.close();
  console.log('🏁 ブラウザーを閉じました');
})();