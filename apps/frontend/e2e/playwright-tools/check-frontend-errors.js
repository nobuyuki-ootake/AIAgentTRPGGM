const { chromium } = require('playwright');

async function checkFrontendErrors() {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();
  
  // エラーメッセージを捕捉
  const errors = [];
  const warnings = [];
  
  page.on('console', msg => {
    if (msg.type() === 'error') {
      errors.push(msg.text());
    } else if (msg.type() === 'warn') {
      warnings.push(msg.text());
    }
  });
  
  page.on('pageerror', err => {
    errors.push(`Page Error: ${err.message}`);
  });
  
  try {
    console.log('🔍 localhost:5173に接続中...');
    await page.goto('http://localhost:5173', { waitUntil: 'networkidle' });
    
    // ページが読み込まれるまで少し待つ
    await page.waitForTimeout(3000);
    
    console.log('\n📋 フロントエンドの状態:');
    console.log('ページタイトル:', await page.title());
    
    // エラーを報告
    if (errors.length > 0) {
      console.log('\n❌ エラー:');
      errors.forEach((error, index) => {
        console.log(`${index + 1}. ${error}`);
      });
    }
    
    if (warnings.length > 0) {
      console.log('\n⚠️  警告:');
      warnings.forEach((warning, index) => {
        console.log(`${index + 1}. ${warning}`);
      });
    }
    
    if (errors.length === 0 && warnings.length === 0) {
      console.log('\n✅ エラーは検出されませんでした!');
    }
    
    // スクリーンショットを撮影
    await page.screenshot({ path: 'frontend-status.png' });
    console.log('\n📸 スクリーンショットを frontend-status.png に保存しました');
    
  } catch (error) {
    console.log('\n❌ 接続エラー:', error.message);
  } finally {
    await browser.close();
  }
}

checkFrontendErrors().catch(console.error);