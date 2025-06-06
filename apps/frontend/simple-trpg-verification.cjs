const { chromium } = require('playwright');

async function quickTRPGCheck() {
  console.log('🚀 TRPGセッション画面の簡易確認を開始...');
  
  const browser = await chromium.launch({ 
    headless: false,
    slowMo: 1000  // 操作を1秒間隔で実行
  });
  
  const page = await browser.newPage();
  
  try {
    console.log('📱 localhost:5174にアクセス中...');
    await page.goto('http://localhost:5174');
    await page.waitForTimeout(3000);
    
    // ページタイトルを確認
    const title = await page.title();
    console.log(`📄 ページタイトル: ${title}`);
    
    // スクリーンショット撮影
    await page.screenshot({ path: 'test-results/quick-home.png' });
    console.log('📸 ホームページのスクリーンショット撮影完了');
    
    // TRPGセッションページに直接アクセス
    console.log('🎮 /trpg-sessionに直接アクセス...');
    await page.goto('http://localhost:5174/trpg-session');
    await page.waitForTimeout(3000);
    
    // スクリーンショット撮影
    await page.screenshot({ path: 'test-results/quick-trpg-session.png' });
    console.log('📸 TRPGセッションページのスクリーンショット撮影完了');
    
    // 基本的な要素の存在確認
    const h4Elements = await page.locator('h4').count();
    const buttonElements = await page.locator('button').count();
    const paperElements = await page.locator('.MuiPaper-root').count();
    
    console.log(`\n🔍 要素数確認:`);
    console.log(`   - H4タイトル: ${h4Elements}個`);
    console.log(`   - ボタン: ${buttonElements}個`);
    console.log(`   - Paperコンポーネント: ${paperElements}個`);
    
    if (h4Elements > 0 && buttonElements > 0 && paperElements > 0) {
      console.log('✅ 基本的な要素が表示されています');
    } else {
      console.log('❌ 一部の要素が見つかりません');
    }
    
    console.log('\n✅ 確認完了！ブラウザは5秒後に自動で閉じます...');
    await page.waitForTimeout(5000);
    
  } catch (error) {
    console.error('❌ エラー:', error.message);
    await page.screenshot({ path: 'test-results/error.png' });
  } finally {
    await browser.close();
  }
}

quickTRPGCheck().catch(console.error);
EOF < /dev/null
