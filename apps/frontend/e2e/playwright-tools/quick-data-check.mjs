import { chromium } from 'playwright';

(async () => {
  console.log('🔍 簡易データ連携チェック開始');
  
  const browser = await chromium.launch({ 
    headless: false,
    devtools: true,
    slowMo: 1000
  });
  
  const context = await browser.newContext();
  const page = await context.newPage();
  
  // ログ監視
  page.on('console', msg => {
    console.log(`📋 [${msg.type()}]: ${msg.text()}`);
  });
  
  try {
    console.log('🎯 Step 1: セッション画面直行');
    await page.goto('http://localhost:5173/session', { 
      waitUntil: 'domcontentloaded',
      timeout: 30000 
    });
    
    await page.waitForTimeout(5000);
    
    console.log('🔍 Step 2: 現在の状態確認');
    const pageState = await page.evaluate(() => {
      return {
        title: document.title,
        campaignData: JSON.parse(localStorage.getItem('currentCampaign') || 'null'),
        campaignId: localStorage.getItem('currentCampaignId'),
        pageText: document.body.textContent?.substring(0, 300),
        buttonTexts: Array.from(document.querySelectorAll('button')).map(btn => btn.textContent?.trim()).filter(text => text && text.length > 0).slice(0, 8)
      };
    });
    
    console.log('📊 ページ状態詳細:');
    console.log('  タイトル:', pageState.title);
    console.log('  キャンペーンID:', pageState.campaignId);
    console.log('  キャンペーンタイトル:', pageState.campaignData?.title || 'なし');
    console.log('  キャラクター数:', pageState.campaignData?.characters?.length || 0);
    console.log('  NPC数:', pageState.campaignData?.npcs?.length || 0);
    console.log('  ボタン:', pageState.buttonTexts);
    console.log('  ページ内容:', pageState.pageText);
    
    await page.screenshot({ 
      path: 'e2e/playwright-tools/quick-data-check.png', 
      fullPage: true 
    });
    
    if (pageState.campaignData && pageState.campaignData.characters && pageState.campaignData.characters.length > 0) {
      console.log('✅ キャンペーンデータが正常に設定されています');
    } else {
      console.log('❌ キャンペーンデータに問題があります');
    }
    
    console.log('⏳ 10秒待機...');
    await page.waitForTimeout(10000);
    
  } catch (error) {
    console.log('💥 エラー:', error.message);
    await page.screenshot({ 
      path: 'e2e/playwright-tools/quick-data-check-error.png',
      fullPage: true 
    });
  }
  
  await browser.close();
  console.log('🏁 簡易データチェック完了');
})();