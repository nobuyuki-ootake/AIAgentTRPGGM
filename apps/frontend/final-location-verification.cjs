const { chromium } = require('playwright');

async function finalLocationVerification() {
  console.log('Starting final location display verification...');
  
  try {
    const browser = await chromium.launch({ 
      headless: false,
      args: ['--no-sandbox', '--disable-web-security']
    });
    const context = await browser.newContext({
      viewport: { width: 1280, height: 720 }
    });
    const page = await context.newPage();
    
    console.log('Navigating to TRPG session page...');
    await page.goto('http://localhost:5173/trpg-session', { waitUntil: 'networkidle' });
    
    // フルページスクリーンショット
    await page.screenshot({ 
      path: 'final-location-verification.png', 
      fullPage: true 
    });
    console.log('Full page screenshot saved as final-location-verification.png');
    
    // 各要素の存在確認
    console.log('\\n=== Final Verification Results ===');
    
    // 1. ヘッダーの現在地表示
    const headerText = await page.locator('header').first().textContent();
    const hasLocationInfo = headerText && headerText.includes('場所の情報がありません');
    console.log(`1. Header location display: ${hasLocationInfo ? '✅' : '❌'}`);
    
    // 2. 探索タブの選択状態
    const explorationTabSelected = await page.locator('button[aria-selected="true"]:has-text("探索")').isVisible();
    console.log(`2. Exploration tab selected: ${explorationTabSelected ? '✅' : '❌'}`);
    
    // 3. 場所情報なしメッセージ
    const noLocationMessage = await page.locator('text=📍 場所の情報がありません').isVisible();
    console.log(`3. No location message visible: ${noLocationMessage ? '✅' : '❌'}`);
    
    // 4. 場所を登録するボタン
    const registerButton = await page.locator('text=場所を登録する').isVisible();
    console.log(`4. Register location button visible: ${registerButton ? '✅' : '❌'}`);
    
    // 5. 案内メッセージ
    const guidanceMessage = await page.locator('text=世界観構築 → 拠点タブから場所を追加できます').isVisible();
    console.log(`5. Guidance message visible: ${guidanceMessage ? '✅' : '❌'}`);
    
    // 6. 拠点タブとクエストタブの存在
    const baseTab = await page.locator('text=拠点').isVisible();
    const questTab = await page.locator('text=クエスト').isVisible();
    console.log(`6. Base tab visible: ${baseTab ? '✅' : '❌'}`);
    console.log(`7. Quest tab visible: ${questTab ? '✅' : '❌'}`);
    
    // 8. 右側パネル（チャットとダイス）
    const chatTab = await page.locator('text=チャット').isVisible();
    const diceTab = await page.locator('text=ダイス').isVisible();
    console.log(`8. Chat tab visible: ${chatTab ? '✅' : '❌'}`);
    console.log(`9. Dice tab visible: ${diceTab ? '✅' : '❌'}`);
    
    console.log('\\n=== Summary ===');
    const allChecks = [hasLocationInfo, explorationTabSelected, noLocationMessage, registerButton, guidanceMessage, baseTab, questTab, chatTab, diceTab];
    const passedChecks = allChecks.filter(check => check).length;
    console.log(`Passed: ${passedChecks}/${allChecks.length} checks`);
    
    if (passedChecks === allChecks.length) {
      console.log('🎉 All verification checks passed!');
    } else {
      console.log('⚠️ Some checks failed. Please review the implementation.');
    }
    
    console.log('\\nFinal verification completed successfully');
    await browser.close();
    
  } catch (error) {
    console.error('Error during final verification:', error);
    process.exit(1);
  }
}

finalLocationVerification();