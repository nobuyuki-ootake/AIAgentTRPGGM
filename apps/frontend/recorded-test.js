const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch({
    headless: false
  });
  const context = await browser.newContext();
  const page = await context.newPage();
  await page.goto('http://localhost:5173/home');
  // await expect(page.getByRole('button')).toMatchAriaSnapshot(`- button "新規プロジェクト"`);
  // await expect(page.locator('html')).toMatchAriaSnapshot(`
  //   - document:
  //     - heading "小説創作支援ツール" [level=1]
  //     - button "新規プロジェクト"
  //     - heading "プロジェクト一覧" [level=2]
  //     - paragraph: プロジェクトがありません。新規プロジェクトを作成してください。
  //     - heading "ツールの特徴" [level=2]
  //     - list:
  //       - listitem:
  //         - text: 物語の構造化
  //         - paragraph: あらすじ、プロット、キャラクター設定などを体系的に管理できます。
  //       - listitem:
  //         - text: 世界観構築支援
  //         - paragraph: 小説の世界観や設定を詳細に作り込むための各種ツールを提供します。
  //       - listitem:
  //         - text: タイムライン管理
  //         - paragraph: 物語の時系列を視覚的に管理し、整合性を保ちながら創作できます。
  //       - listitem:
  //         - text: AIアシスタント連携
  //         - paragraph: 創作過程でAIアシスタントからアドバイスやアイデアを得られます。
  //     - heading "使い方" [level=2]
  //     - list:
  //       - listitem:
  //         - text: 1. プロジェクトの作成
  //         - paragraph: 「新規プロジェクト」ボタンから小説のプロジェクトを作成します。
  //       - listitem:
  //         - text: 2. 設定の作成
  //         - paragraph: あらすじ、プロット、キャラクター、世界観などの設定を作成します。
  //       - listitem:
  //         - text: 3. タイムラインの整理
  //         - paragraph: 物語の出来事を時系列順に配置し、整合性を確認します。
  //       - listitem:
  //         - text: 4. 執筆と編集
  //         - paragraph: 設定に基づいて執筆を進め、必要に応じてAIのサポートを受けられます。
  //   `);
  await page.getByRole('button', { name: '新規プロジェクト' }).click();
  await page.getByRole('textbox', { name: 'プロジェクト名' }).click();
  await page.getByRole('textbox', { name: 'プロジェクト名' }).fill('テスト　プロジェクト');
  await page.getByRole('button', { name: '作成' }).click();
  await page.getByRole('button', { name: 'キャラクター' }).click();
  await page.getByRole('button').filter({ hasText: /^$/ }).click();
  await page.getByRole('button', { name: 'キャラクターを作成する' }).click();
  await page.getByRole('textbox', { name: '名前' }).click();
  await page.getByRole('textbox', { name: '名前' }).fill('太郎');
  await page.getByRole('combobox', { name: '役割 脇役' }).click();
  await page.getByRole('option', { name: '主人公' }).click();
  await page.getByRole('button', { name: '保存' }).click();
  await page.getByRole('button', { name: 'menu' }).click();
  await page.getByRole('button', { name: '世界観構築' }).click();
  await page.getByRole('button').filter({ hasText: /^$/ }).click();
  await page.getByRole('tab', { name: '地名' }).click();
  await page.getByRole('textbox', { name: '地名' }).click();
  await page.getByRole('textbox', { name: '地名' }).fill('じゃぱん');
  await page.getByRole('button', { name: '追加' }).click();
  await page.getByRole('button', { name: '保存' }).click();
  await page.getByRole('button', { name: 'menu' }).click();
  await page.getByRole('button', { name: 'タイムライン' }).click();
  await page.getByRole('button').filter({ hasText: /^$/ }).click();
  await page.getByRole('button', { name: 'イベント追加' }).click();
  await page.getByRole('combobox', { name: '関連キャラクター' }).click();
  await page.getByRole('option', { name: '👑 太郎' }).click();
  await page.locator('#menu- > .MuiBackdrop-root').click();
  await page.getByRole('combobox', { name: '関連地名' }).click();
  await page.getByRole('option', { name: 'じゃぱん' }).click();
  await page.locator('#menu- div').first().click();
  // await expect(page.locator('body')).toMatchAriaSnapshot(`
  //   - dialog "新しいイベントを追加":
  //     - heading "新しいイベントを追加" [level=2]
  //     - textbox "イベントタイトル"
  //     - textbox "日付": /\\d+-\\d+-\\d+/
  //     - textbox "説明"
  //     - combobox "関連キャラクター"
  //     - combobox "関連地名": じゃぱん
  //     - button "キャンセル"
  //     - button "追加" [disabled]
  //   `);
  await page.getByRole('textbox', { name: 'イベントタイトル' }).click();
  await page.getByRole('textbox', { name: 'イベントタイトル' }).fill('新規イベント');
  await page.getByRole('button', { name: '追加' }).click();
  // await expect(page.locator('html')).toMatchAriaSnapshot(`
  //   - document:
  //     - main:
  //       - heading "タイムライン" [level=5]
  //       - button "タイムライン設定"
  //       - separator
  //       - heading "タイムラインイベント一覧" [level=6]
  //       - button "イベント追加"
  //       - button "保存"
  //       - text: 新規イベント
  //       - button "編集"
  //       - paragraph: /\\d+年\\d+月\\d+日/
  //       - paragraph: じゃぱん
  //       - text: 太郎
  //       - heading "タイムラインチャート" [level=6]
  //       - heading "未分類" [level=6]
  //       - heading "じゃぱん" [level=6]
  //       - text: /\\d+\\/\\d+\\/\\d+ \\d+\\/\\d+\\/\\d+ \\d+\\/\\d+\\/\\d+ \\d+\\/\\d+\\/\\d+ \\d+\\/\\d+\\/\\d+ \\d+\\/\\d+\\/\\d+ \\d+\\/\\d+\\/\\d+ \\d+\\/\\d+\\/\\d+ \\d+\\/\\d+\\/\\d+ \\d+\\/\\d+\\/\\d+ \\d+\\/\\d+\\/\\d+ 👑/
  //       - button "menu"
  //     - button
  //     - heading "AIアシスタント" [level=6]
  //     - list:
  //       - paragraph: AIアシスタントとの会話を開始しましょう。 プロットやキャラクター、文章について質問や相談ができます。
  //     - textbox "メッセージを入力..."
  //     - button "送信" [disabled]
  //   `);
  await page.getByRole('button', { name: 'menu' }).click();
  await page.getByRole('button', { name: '本文執筆' }).click();
  await page.getByRole('button').filter({ hasText: /^$/ }).click();
  await page.locator('div').filter({ hasText: /^章が作成されていません章が選択されていません左側のリストから章を選択するか、新しい章を作成してください。新規章作成$/ }).getByRole('button').click();
  await page.getByRole('textbox', { name: '章のタイトル' }).click();
  await page.getByRole('textbox', { name: '章のタイトル' }).fill('1章');
  await page.getByRole('button', { name: '作成' }).click();
  await page.getByRole('button', { name: 'イベントを割り当て' }).click();
  await page.getByRole('button', { name: '閉じる' }).click();
  await page.getByRole('button', { name: 'イベントを割り当て' }).click();
  await page.getByRole('button', { name: '新規イベント作成' }).click();
  await page.getByRole('textbox', { name: 'イベントタイトル' }).click();
  await page.getByRole('textbox', { name: 'イベントタイトル' }).fill('1章イベント');
  await page.getByRole('combobox', { name: '関連キャラクター' }).click();
  await page.getByRole('option', { name: '👑 太郎' }).click();
  await page.locator('#menu- > .MuiBackdrop-root').click();
  await page.getByRole('combobox', { name: '関連地名' }).click();
  await page.getByRole('option', { name: 'じゃぱん' }).click();
  await page.locator('#menu- div').first().click();
  await page.getByRole('button', { name: '追加' }).click();
  await page.getByRole('button', { name: '閉じる' }).click();

  // ---------------------
  await context.close();
  await browser.close();
})();