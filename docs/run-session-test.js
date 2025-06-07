/**
 * TRPGセッション機能テスト自動実行スクリプト
 * Playwrightを使用して、テストガイドに従った自動テストを実行
 */

const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');

// テスト結果を記録するためのログファイル
const TEST_LOG_FILE = path.join(__dirname, 'test-results', 'session-test-log.json');
const SCREENSHOT_DIR = path.join(__dirname, 'test-screenshots');

// ディレクトリ作成
if (!fs.existsSync(path.dirname(TEST_LOG_FILE))) {
  fs.mkdirSync(path.dirname(TEST_LOG_FILE), { recursive: true });
}
if (!fs.existsSync(SCREENSHOT_DIR)) {
  fs.mkdirSync(SCREENSHOT_DIR, { recursive: true });
}

async function runSessionTest() {
  const browser = await chromium.launch({ headless: false });
  const context = await browser.newContext();
  const page = await context.newPage();
  
  const testResults = {
    timestamp: new Date().toISOString(),
    tests: [],
    summary: { passed: 0, failed: 0, total: 0 }
  };

  try {
    // ステップ1: 初期画面の確認
    console.log('ステップ1: 初期画面の確認');
    await page.goto('http://localhost:5173/trpg-session');
    
    // デベロッパーモード有効化
    await page.evaluate(() => {
      localStorage.setItem('developerMode', 'true');
    });
    await page.reload();
    await page.waitForTimeout(2000);
    
    await page.screenshot({ 
      path: path.join(SCREENSHOT_DIR, `${Date.now()}-step1-initial.png`),
      fullPage: true 
    });
    
    // セッション開始ボタンの確認
    const sessionButton = await page.locator('button:has-text("AIにセッションを始めてもらう")');
    const isInitialButtonVisible = await sessionButton.isVisible();
    
    testResults.tests.push({
      name: '初期画面表示',
      passed: isInitialButtonVisible,
      details: `セッション開始ボタン表示: ${isInitialButtonVisible}`
    });

    // ステップ2: テストデータロード
    console.log('ステップ2: テストデータロード');
    
    // デバッグパネルを開く
    const debugButton = await page.locator('button:has-text("Debug")');
    if (await debugButton.isVisible()) {
      await debugButton.click();
      await page.waitForTimeout(1000);
    }
    
    // テストデータリロード
    const reloadButton = await page.locator('button:has-text("JSONから再ロード")');
    if (await reloadButton.isVisible()) {
      await reloadButton.click();
      await page.waitForTimeout(3000);
    }
    
    await page.screenshot({ 
      path: path.join(SCREENSHOT_DIR, `${Date.now()}-step2-data-loaded.png`),
      fullPage: true 
    });

    // ステップ3: キャラクター選択
    console.log('ステップ3: キャラクター選択');
    
    // アレックスを選択
    const alexButton = await page.locator('text=アレックス・ブレイブハート');
    if (await alexButton.isVisible()) {
      await alexButton.click();
      await page.waitForTimeout(1000);
    }
    
    await page.screenshot({ 
      path: path.join(SCREENSHOT_DIR, `${Date.now()}-step3-character-selected.png`),
      fullPage: true 
    });
    
    // 選択状態の確認
    const selectedChip = await page.locator('text=操作: アレックス・ブレイブハート');
    const isCharacterSelected = await selectedChip.isVisible();
    
    testResults.tests.push({
      name: 'キャラクター選択',
      passed: isCharacterSelected,
      details: `選択チップ表示: ${isCharacterSelected}`
    });

    // ステップ4: セッション開始
    console.log('ステップ4: セッション開始');
    
    const startButton = await page.locator('button:has-text("AIにセッションを始めてもらう")');
    if (await startButton.isEnabled()) {
      await startButton.click();
      await page.waitForTimeout(5000); // AI応答待ち
    }
    
    await page.screenshot({ 
      path: path.join(SCREENSHOT_DIR, `${Date.now()}-step4-session-started.png`),
      fullPage: true 
    });
    
    // セッション進行中ボタンの確認
    const progressButton = await page.locator('button:has-text("セッション進行中")');
    const isSessionStarted = await progressButton.isVisible();
    
    testResults.tests.push({
      name: 'セッション開始',
      passed: isSessionStarted,
      details: `セッション進行中ボタン表示: ${isSessionStarted}`
    });

    // コンソールエラーのチェック
    const consoleErrors = [];
    page.on('console', msg => {
      if (msg.type() === 'error') {
        consoleErrors.push(msg.text());
      }
    });
    
    testResults.tests.push({
      name: 'コンソールエラーチェック',
      passed: consoleErrors.length === 0,
      details: `エラー数: ${consoleErrors.length}, エラー: ${consoleErrors.join('; ')}`
    });

  } catch (error) {
    console.error('テスト実行エラー:', error);
    testResults.tests.push({
      name: 'テスト実行',
      passed: false,
      details: `エラー: ${error.message}`
    });
  } finally {
    // テスト結果の集計
    testResults.summary.total = testResults.tests.length;
    testResults.summary.passed = testResults.tests.filter(t => t.passed).length;
    testResults.summary.failed = testResults.summary.total - testResults.summary.passed;
    
    // 結果をファイルに保存
    const existingLogs = fs.existsSync(TEST_LOG_FILE) 
      ? JSON.parse(fs.readFileSync(TEST_LOG_FILE, 'utf8'))
      : [];
    existingLogs.push(testResults);
    fs.writeFileSync(TEST_LOG_FILE, JSON.stringify(existingLogs, null, 2));
    
    console.log('\n=== テスト結果 ===');
    console.log(`合格: ${testResults.summary.passed}/${testResults.summary.total}`);
    console.log('詳細結果:');
    testResults.tests.forEach(test => {
      console.log(`${test.passed ? '✅' : '❌'} ${test.name}: ${test.details}`);
    });
    
    await browser.close();
  }
}

// 前提条件チェック
async function checkPrerequisites() {
  const fetch = (await import('node-fetch')).default;
  
  try {
    // フロントエンドサーバーチェック
    const frontendResponse = await fetch('http://localhost:5173', { timeout: 5000 });
    console.log('✅ フロントエンドサーバー起動確認');
    
    // プロキシサーバーチェック
    const proxyResponse = await fetch('http://localhost:4001/health', { timeout: 5000 });
    const healthData = await proxyResponse.json();
    console.log('✅ プロキシサーバー起動確認:', healthData.status);
    
    return true;
  } catch (error) {
    console.error('❌ 前提条件チェック失敗:', error.message);
    console.log('\n以下のコマンドでサーバーを起動してください:');
    console.log('1. フロントエンド: pnpm dev');
    console.log('2. プロキシサーバー: cd apps/proxy-server && pnpm dev');
    return false;
  }
}

// メイン実行
async function main() {
  console.log('TRPGセッション機能テスト開始...\n');
  
  const prerequisitesOk = await checkPrerequisites();
  if (!prerequisitesOk) {
    process.exit(1);
  }
  
  await runSessionTest();
}

if (require.main === module) {
  main();
}

module.exports = { runSessionTest, checkPrerequisites };