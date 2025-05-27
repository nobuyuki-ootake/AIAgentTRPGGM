# Test info

- Name: SynopsisPage Tests >> AIアシスト機能の確認
- Location: C:\Users\irure\git\NovelWithAgent\apps\frontend\e2e\pages\synopsis-page.spec.ts:126:3

# Error details

```
Error: page.goto: Protocol error (Page.navigate): Cannot navigate to invalid URL
Call log:
  - navigating to "/", waiting until "load"

    at C:\Users\irure\git\NovelWithAgent\apps\frontend\e2e\pages\synopsis-page.spec.ts:15:16
```

# Test source

```ts
   1 | import { test, expect } from "@playwright/test";
   2 | import {
   3 |   setupTestData,
   4 |   clearTestData,
   5 |   verifyPageLoad,
   6 |   takeScreenshot,
   7 |   openAIAssistPanel,
   8 |   checkForErrors,
   9 |   waitForLoadingComplete,
   10 | } from "../utils/test-helpers";
   11 |
   12 | test.describe("SynopsisPage Tests", () => {
   13 |   test.beforeEach(async ({ page }) => {
   14 |     // まずホームページに移動してからテストデータを設定
>  15 |     await page.goto("/");
      |                ^ Error: page.goto: Protocol error (Page.navigate): Cannot navigate to invalid URL
   16 |     await setupTestData(page);
   17 |   });
   18 |
   19 |   test("ページの初期表示確認とスクリーンショット", async ({ page }) => {
   20 |     // あらすじページに移動
   21 |     await page.goto("/synopsis");
   22 |
   23 |     // ページの読み込み確認
   24 |     await verifyPageLoad(page, "小説作成エージェント");
   25 |
   26 |     // ページの読み込みを待機
   27 |     await page.waitForTimeout(3000);
   28 |
   29 |     // プロジェクトタイトルまたはあらすじセクションが表示されることを確認
   30 |     const titleOrSection = page.locator("text=あらすじ, h1, h2, h3").first();
   31 |     if ((await titleOrSection.count()) > 0) {
   32 |       await expect(titleOrSection).toBeVisible();
   33 |     }
   34 |
   35 |     // エラーがないことを確認
   36 |     await checkForErrors(page);
   37 |
   38 |     // 初期表示のスクリーンショット
   39 |     await takeScreenshot(page, "synopsis-page-initial");
   40 |   });
   41 |
   42 |   test("あらすじ編集機能の確認", async ({ page }) => {
   43 |     await page.goto("/synopsis");
   44 |     await verifyPageLoad(page, "Novel");
   45 |
   46 |     // 編集ボタンを探してクリック
   47 |     const editButton = page
   48 |       .locator('button:has-text("編集"), button[aria-label*="編集"]')
   49 |       .first();
   50 |
   51 |     if ((await editButton.count()) > 0) {
   52 |       await editButton.click();
   53 |
   54 |       // 編集モードに入ったことを確認
   55 |       const textArea = page
   56 |         .locator('textarea, [contenteditable="true"]')
   57 |         .first();
   58 |       await expect(textArea).toBeVisible();
   59 |
   60 |       // 編集モードのスクリーンショット
   61 |       await takeScreenshot(page, "synopsis-page-edit-mode");
   62 |
   63 |       // テキストを編集
   64 |       await textArea.clear();
   65 |       await textArea.fill("編集されたあらすじです。新しい内容を追加しました。");
   66 |
   67 |       // 編集後のスクリーンショット
   68 |       await takeScreenshot(page, "synopsis-page-edited");
   69 |
   70 |       // 保存ボタンをクリック
   71 |       const saveButton = page
   72 |         .locator('button:has-text("保存"), button:has-text("更新")')
   73 |         .first();
   74 |       if ((await saveButton.count()) > 0) {
   75 |         await saveButton.click();
   76 |
   77 |         // 保存完了を待機
   78 |         await waitForLoadingComplete(page);
   79 |
   80 |         // 保存後のスクリーンショット
   81 |         await takeScreenshot(page, "synopsis-page-saved");
   82 |       }
   83 |     }
   84 |   });
   85 |
   86 |   test("あらすじ編集のキャンセル機能", async ({ page }) => {
   87 |     await page.goto("/synopsis");
   88 |     await verifyPageLoad(page, "Novel");
   89 |
   90 |     // 編集ボタンをクリック
   91 |     const editButton = page
   92 |       .locator('button:has-text("編集"), button[aria-label*="編集"]')
   93 |       .first();
   94 |
   95 |     if ((await editButton.count()) > 0) {
   96 |       await editButton.click();
   97 |
   98 |       // テキストを編集
   99 |       const textArea = page
  100 |         .locator('textarea, [contenteditable="true"]')
  101 |         .first();
  102 |       await textArea.clear();
  103 |       await textArea.fill("キャンセルされる予定のテキスト");
  104 |
  105 |       // 編集中のスクリーンショット
  106 |       await takeScreenshot(page, "synopsis-page-before-cancel");
  107 |
  108 |       // キャンセルボタンをクリック
  109 |       const cancelButton = page
  110 |         .locator('button:has-text("キャンセル"), button:has-text("取消")')
  111 |         .first();
  112 |       if ((await cancelButton.count()) > 0) {
  113 |         await cancelButton.click();
  114 |
  115 |         // 元の内容が表示されることを確認
```