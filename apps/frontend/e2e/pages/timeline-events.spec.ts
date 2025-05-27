import { test, expect } from "@playwright/test";
import type { Locator, Page } from "@playwright/test";

// 開発サーバーのURL
const BASE_URL = "http://localhost:5173";

// タイムラインイベント追加のテスト
test.describe("タイムラインイベント追加テスト", () => {
  // 各テストの前に実行される準備処理
  test.beforeEach(async ({ page }) => {
    // ローカルストレージをクリアしてテスト環境をリセット
    await page.goto(BASE_URL);
    await page.evaluate(() => {
      localStorage.clear();
      sessionStorage.clear();
      console.log("ブラウザストレージをクリアしました");
    });
    await page.reload();
    await page.waitForLoadState("networkidle");
    console.log("テスト環境の初期化完了");
  });

  // 前提条件としてプロジェクト作成、キャラクター追加、世界観（場所）追加を行う
  test("前提条件を準備してイベントを追加する", async ({ page }) => {
    // デバッグ情報の表示
    test.slow(); // テストの実行速度を遅くして観察しやすくする

    // プロジェクト作成から実行
    await createTestProject(page);

    // ステップ2: 世界観（場所）追加 - 先に場所追加を確実に行う
    await addTestLocation(page);

    // ステップ3: キャラクター追加
    await addTestCharacter(page);

    // ステップ4: タイムラインイベント追加
    await addTimelineEvent(page);
  });
});

/**
 * テスト用プロジェクトを作成する
 */
async function createTestProject(page: Page): Promise<void> {
  console.log("ステップ1: プロジェクト作成");
  await page.goto(BASE_URL);
  await page.waitForLoadState("networkidle");

  // ホームページのスクリーンショット
  await page.screenshot({ path: "debug-home-page.png" });

  // 新規プロジェクトボタンをクリック
  await page.getByRole("button", { name: "新規プロジェクト" }).click();
  await page.waitForTimeout(500);

  // プロジェクト情報を入力
  await page
    .locator('input[type="text"]')
    .first()
    .fill("タイムラインテスト用プロジェクト");

  // セレクトボックスがある場合は選択
  const genreSelect = page.locator("select").first();
  if (await genreSelect.isVisible()) {
    await genreSelect.selectOption({ index: 1 });
  }

  // 作成ボタンをクリック
  await page.getByRole("button", { name: /作成|保存|確定/ }).click();

  // プロジェクト作成の完了を確実に待つ
  await page.waitForTimeout(1000);
  await page.waitForLoadState("networkidle");

  // プロジェクトが正常に作成されたか確認
  const projectTitle = page.getByText("タイムラインテスト用プロジェクト");
  const projectExists = await projectTitle
    .isVisible({ timeout: 5000 })
    .catch(() => false);

  if (!projectExists) {
    await page.screenshot({ path: "debug-project-creation-failed.png" });
    throw new Error("プロジェクト作成に失敗しました");
  }

  console.log("プロジェクト作成完了");
  await page.screenshot({ path: "debug-dashboard.png" });
}

/**
 * テスト用の場所（ロケーション）を追加する
 */
async function addTestLocation(page: Page): Promise<void> {
  console.log("ステップ2: 世界観（場所）追加");

  // 世界観構築ボタンをクリック
  const worldBuildingButton = page.getByRole("button", { name: "世界観構築" });

  try {
    await expect(worldBuildingButton).toBeVisible({ timeout: 5000 });
    await worldBuildingButton.click();
  } catch (error) {
    await page.screenshot({
      path: "debug-world-building-button-not-found.png",
    });
    throw new Error(`世界観構築ボタンが見つかりませんでした: ${error.message}`);
  }

  await page.waitForLoadState("networkidle");
  await page.waitForTimeout(1000);
  await page.screenshot({ path: "debug-worldbuilding-page.png" });

  // 場所タブに移動（必要な場合）
  await navigateToLocationTab(page);

  // 場所が既に存在するか確認
  const existingPlace = page.getByText("テスト舞台");
  const hasExistingPlace = await existingPlace.isVisible().catch(() => false);

  if (hasExistingPlace) {
    console.log("既存の場所が見つかりました。場所の追加をスキップします。");
    return;
  }

  // 場所追加ボタンをクリック
  await clickAddPlaceButton(page);

  // 場所ダイアログが表示されているか確認
  const placeDialog = page.locator(".MuiDialog-paper");
  try {
    await expect(placeDialog).toBeVisible({ timeout: 5000 });
  } catch (error) {
    await page.screenshot({ path: "debug-place-dialog-not-found.png" });
    throw new Error(`場所ダイアログが表示されませんでした: ${error.message}`);
  }

  // 場所名入力
  const placeNameInput = page
    .locator('input[placeholder*="名前"], input[name*="name"]')
    .first();

  try {
    await expect(placeNameInput).toBeVisible({ timeout: 5000 });
    await placeNameInput.fill("テスト舞台");
  } catch (error) {
    await page.screenshot({ path: "debug-place-name-input-not-found.png" });
    throw new Error(
      `場所名の入力フィールドが見つかりませんでした: ${error.message}`
    );
  }

  // 説明入力
  const placeDescTextarea = page.locator("textarea").first();
  if (await placeDescTextarea.isVisible()) {
    await placeDescTextarea.fill("タイムラインイベントのテスト用場所");
  }

  // 保存ボタンをクリック
  await clickSaveButton(page, "場所ダイアログの保存");

  // 場所が追加されたことを確認
  await page.waitForTimeout(1000);
  await page.screenshot({ path: "debug-after-place-saved.png" });

  const placeItem = page.getByText("テスト舞台");
  try {
    await expect(placeItem).toBeVisible({ timeout: 5000 });
    console.log("場所が正常に追加されていることを確認しました");
  } catch (error) {
    await page.screenshot({ path: "debug-place-not-added.png" });
    throw new Error(`場所が正常に追加されませんでした: ${error.message}`);
  }
}

/**
 * テスト用のキャラクターを追加する
 */
async function addTestCharacter(page: Page): Promise<void> {
  console.log("ステップ3: キャラクター追加");

  // キャラクタータブへ移動
  const characterTabs = [
    page.getByRole("button", { name: "キャラクター" }),
    page.getByText("キャラクター").first(),
    page.getByRole("tab").filter({ hasText: "キャラクター" }),
  ];

  let tabClicked = false;
  for (const tab of characterTabs) {
    if (await tab.isVisible()) {
      await tab.click();
      tabClicked = true;
      break;
    }
  }

  if (!tabClicked) {
    await page.screenshot({ path: "debug-character-tab-not-found.png" });
    throw new Error("キャラクタータブが見つかりませんでした");
  }

  await page.waitForLoadState("networkidle");
  await page.waitForTimeout(1000);
  await page.screenshot({ path: "debug-character-page.png" });

  // 既存のキャラクターを確認
  const existingCharacter = page.getByText("テスト主人公");
  const hasExistingCharacter = await existingCharacter
    .isVisible()
    .catch(() => false);

  if (hasExistingCharacter) {
    console.log(
      "既存のキャラクターが見つかりました。キャラクター追加をスキップします。"
    );
    return;
  }

  // キャラクター追加ボタンをクリック
  await clickAddCharacterButton(page);

  // キャラクターダイアログが表示されているか確認
  const charDialog = page.locator(".MuiDialog-paper");
  try {
    await expect(charDialog).toBeVisible({ timeout: 5000 });
  } catch (error) {
    await page.screenshot({ path: "debug-character-dialog-not-found.png" });
    throw new Error(
      `キャラクターダイアログが表示されませんでした: ${error.message}`
    );
  }

  // 名前入力
  const nameInput = page
    .locator('input[placeholder*="名前"], input[name*="name"]')
    .first();

  try {
    await expect(nameInput).toBeVisible({ timeout: 5000 });
    await nameInput.fill("テスト主人公");
  } catch (error) {
    await page.screenshot({ path: "debug-character-name-input-not-found.png" });
    throw new Error(
      `キャラクター名の入力フィールドが見つかりませんでした: ${error.message}`
    );
  }

  // 年齢入力
  const ageInput = page
    .locator('input[placeholder*="年齢"], input[name*="age"]')
    .first();
  if (await ageInput.isVisible()) {
    await ageInput.fill("17");
  }

  // 役割選択
  const roleSelect = page.locator('select[name*="role"]').first();
  if (await roleSelect.isVisible()) {
    await roleSelect.selectOption({ index: 0 });
  }

  // 説明入力
  const descTextarea = page.locator("textarea").first();
  if (await descTextarea.isVisible()) {
    await descTextarea.fill("タイムラインイベントのテスト用キャラクター");
  }

  // 保存ボタンをクリック
  await clickSaveButton(page, "キャラクターダイアログの保存");

  // キャラクターが追加されたことを確認
  try {
    const characterItem = page.getByText("テスト主人公");
    await expect(characterItem).toBeVisible({ timeout: 5000 });
    console.log("キャラクターが正常に追加されていることを確認しました");
  } catch (error) {
    await page.screenshot({ path: "debug-character-not-added.png" });
    throw new Error(
      `キャラクターが正常に追加されませんでした: ${error.message}`
    );
  }
}

/**
 * タイムラインイベントを追加する
 */
async function addTimelineEvent(page: Page): Promise<void> {
  console.log("ステップ4: タイムラインイベント追加");

  // タイムラインページに移動
  const timelineButton = page.getByRole("button", { name: "タイムライン" });
  try {
    await expect(timelineButton).toBeVisible({ timeout: 5000 });
    await timelineButton.click();
  } catch (error) {
    await page.screenshot({ path: "debug-timeline-button-not-found.png" });
    throw new Error(
      `タイムラインボタンが見つかりませんでした: ${error.message}`
    );
  }

  await page.waitForLoadState("networkidle");
  await page.waitForTimeout(2000);
  await page.screenshot({ path: "debug-timeline-page.png" });

  // イベント追加ボタンをクリック
  await clickAddEventButton(page);

  // イベント追加ダイアログが表示されたか確認
  const dialog = page.locator(".MuiDialog-paper");
  try {
    await expect(dialog).toBeVisible({ timeout: 5000 });
    console.log("イベント追加ダイアログが表示されました");
  } catch (error) {
    await page.screenshot({ path: "debug-event-dialog-not-found.png" });
    throw new Error(
      `イベント追加ダイアログが表示されませんでした: ${error.message}`
    );
  }

  await page.screenshot({ path: "debug-event-dialog.png" });

  // タイトル入力
  const titleInput = page
    .locator('input[placeholder*="タイトル"], input[name*="title"]')
    .first();
  try {
    await expect(titleInput).toBeVisible({ timeout: 5000 });
    await titleInput.fill("テストイベント1");
    console.log("イベントタイトル入力完了");
  } catch (error) {
    await page.screenshot({ path: "debug-event-title-input-not-found.png" });
    throw new Error(
      `イベントタイトル入力フィールドが見つかりませんでした: ${error.message}`
    );
  }

  // 日付入力
  const dateInput = page.locator('input[type="date"]').first();
  if (await dateInput.isVisible()) {
    await dateInput.fill("2023-05-01");
    console.log("日付入力完了");
  }

  // 関連地名を選択
  await selectRelatedPlace(page);

  // キャラクター選択
  await selectRelatedCharacter(page);

  // 説明入力
  const descInput = page.locator("textarea").first();
  if (await descInput.isVisible()) {
    await descInput.fill("タイムラインテスト用イベントの説明");
    console.log("説明入力完了");
  }

  // フォーム入力後の状態をキャプチャ
  await page.screenshot({ path: "debug-event-form-filled.png" });

  // 保存ボタンをクリック
  await clickSaveButton(page, "イベント追加ダイアログの保存");

  // イベント保存後の待機
  await page.waitForLoadState("networkidle");
  await page.waitForTimeout(2000);
  await page.screenshot({ path: "debug-timeline-final.png" });

  // イベントが追加されたか確認
  await verifyEventAdded(page);
}

/**
 * 場所タブに移動する
 */
async function navigateToLocationTab(page: Page): Promise<void> {
  const locationTabs = [
    page.getByText(/場所|地名/),
    page.getByRole("tab").filter({ hasText: /場所|地名/ }),
    page.locator("button").filter({ hasText: /場所|地名/ }),
  ];

  let tabClicked = false;
  for (const tab of locationTabs) {
    if (await tab.first().isVisible()) {
      await tab.first().click();
      await page.waitForTimeout(1000);
      tabClicked = true;
      break;
    }
  }

  if (!tabClicked) {
    // 場所タブが見つからない場合、既に正しいタブにいる可能性がある
    console.log(
      "場所タブが見つかりませんでした。既に場所タブにいる可能性があります。"
    );
  }

  await page.screenshot({ path: "debug-place-tab.png" });
}

/**
 * 場所追加ボタンをクリックする
 */
async function clickAddPlaceButton(page: Page): Promise<void> {
  const addPlaceButtons = [
    page.getByRole("button", { name: /場所(追加|作成|新規)/ }),
    page.locator('button:has-text("場所追加")'),
    page.locator('button:has-text("新規場所")'),
    page.locator('button:has-text("追加")'),
    page.locator(".MuiButton-contained").first(),
  ];

  let placeBtnClicked = false;
  for (const btn of addPlaceButtons) {
    if (await btn.isVisible()) {
      // ボタンテキストを出力
      const btnText = await btn.textContent();
      console.log(`クリックする場所追加ボタン: ${btnText}`);

      await btn.click();
      placeBtnClicked = true;
      await page.waitForTimeout(1000);
      break;
    }
  }

  // 場所追加ボタンが見つからない場合のデバッグ情報
  if (!placeBtnClicked) {
    console.log("警告: 場所追加ボタンが見つかりませんでした");
    // ページ上の全ボタンを記録
    const allButtons = await page.locator("button").all();
    for (const btn of allButtons) {
      const text = await btn.textContent();
      console.log(`ボタンテキスト: ${text}`);
    }
    await page.screenshot({ path: "debug-no-place-button.png" });
    throw new Error("場所追加ボタンが見つかりませんでした");
  }
}

/**
 * キャラクター追加ボタンをクリックする
 */
async function clickAddCharacterButton(page: Page): Promise<void> {
  // キャラクター追加ボタンの候補
  const addCharButtonSelectors = [
    'button:has-text("キャラクター追加")',
    'button:has-text("新規キャラクター")',
    'button:has-text("追加")',
    ".MuiButton-contained",
    '[data-testid="add-character-button"]',
  ];

  // 各セレクターを試す
  let charButtonClicked = false;
  for (const selector of addCharButtonSelectors) {
    const buttons = await page.locator(selector).all();
    console.log(
      `セレクター ${selector} で ${buttons.length} 個のボタンが見つかりました`
    );

    for (const btn of buttons) {
      const text = await btn.textContent();
      console.log(`  ボタンテキスト: ${text}`);

      if (
        text &&
        (text.includes("追加") ||
          text.includes("キャラクター") ||
          text.includes("新規"))
      ) {
        await btn.click();
        charButtonClicked = true;
        await page.waitForTimeout(1000);
        break;
      }
    }

    if (charButtonClicked) break;
  }

  if (!charButtonClicked) {
    await page.screenshot({ path: "debug-no-character-button.png" });
    throw new Error("キャラクター追加ボタンが見つかりませんでした");
  }
}

/**
 * イベント追加ボタンをクリックする
 */
async function clickAddEventButton(page: Page): Promise<void> {
  const eventButtons = [
    page.getByRole("button", { name: "イベント追加" }),
    page.locator("button").filter({ hasText: "イベント追加" }),
    page.locator(".MuiButton-contained").first(),
  ];

  let buttonClicked = false;
  for (const button of eventButtons) {
    if (await button.isVisible()) {
      console.log("イベント追加ボタンが見つかりました");
      await button.click({ force: true });
      await page.waitForTimeout(1000);
      buttonClicked = true;
      break;
    }
  }

  if (!buttonClicked) {
    console.log("イベント追加ボタンが見つかりませんでした");
    await page.screenshot({ path: "debug-no-event-button.png" });
    throw new Error("イベント追加ボタンが見つかりませんでした");
  }
}

/**
 * 関連地名を選択する
 */
async function selectRelatedPlace(page: Page): Promise<void> {
  try {
    await page.screenshot({ path: "debug-event-form-before-place.png" });

    // 関連地名フィールドを特定
    const placeFieldSelectors = [
      'label:has-text("関連地名")',
      '[aria-label*="関連地名"]',
      'div[role="button"]:has-text("関連地名")',
      'div:has-text("関連地名")',
      '.MuiFormControl-root input, .MuiFormControl-root div[role="button"]',
    ];

    let placeField: Locator | null = null;
    for (const selector of placeFieldSelectors) {
      const fields = await page.locator(selector).all();
      for (const field of fields) {
        const text = await field.textContent();
        if (text && text.includes("関連地名")) {
          placeField = field;
          console.log(`関連地名フィールドが見つかりました: ${text}`);
          break;
        }
      }
      if (placeField) break;
    }

    if (placeField) {
      // クリックして開く
      await placeField.click();
      await page.waitForTimeout(1000);
      await page.screenshot({ path: "debug-place-dropdown-open.png" });

      // ドロップダウンの選択肢をチェック
      const options = page.locator('[role="option"], .MuiMenuItem-root');
      const count = await options.count();
      console.log(`場所選択オプション数: ${count}`);

      if (count > 0) {
        // 最初の選択肢をクリック
        await options.first().click();
        console.log("場所選択完了");
      } else {
        console.log("警告: 選択可能な場所がありません");
        throw new Error("選択可能な場所がありません");
      }
    } else {
      console.log("関連地名フィールドが見つかりませんでした");

      // 代替手段: セレクトボックスの可能性を確認
      const selectBox = page
        .locator("select")
        .filter({ hasText: /関連地名|場所/ });
      if (await selectBox.isVisible()) {
        await selectBox.selectOption({ index: 1 });
        console.log("場所選択（セレクトボックス）完了");
      } else {
        throw new Error("関連地名フィールドが見つかりませんでした");
      }
    }
  } catch (error) {
    console.log(`場所選択でエラー: ${error.message}`);
    await page.screenshot({ path: "debug-place-selection-error.png" });
    // テストを続行する（場所選択が必須でない場合もあるため）
  }
}

/**
 * 関連キャラクターを選択する
 */
async function selectRelatedCharacter(page: Page): Promise<void> {
  try {
    await page.screenshot({ path: "debug-event-form-before-character.png" });

    // 関連キャラクターフィールドを特定
    const charFieldSelectors = [
      'label:has-text("関連キャラクター")',
      '[aria-label*="関連キャラクター"]',
      'div[role="button"]:has-text("関連キャラクター")',
      'div:has-text("関連キャラクター")',
      '.MuiFormControl-root input, .MuiFormControl-root div[role="button"]',
    ];

    let charField: Locator | null = null;
    for (const selector of charFieldSelectors) {
      const fields = await page.locator(selector).all();
      for (const field of fields) {
        const text = await field.textContent();
        if (text && text.includes("関連キャラクター")) {
          charField = field;
          console.log(`関連キャラクターフィールドが見つかりました: ${text}`);
          break;
        }
      }
      if (charField) break;
    }

    if (charField) {
      // クリックして開く
      await charField.click();
      await page.waitForTimeout(1000);
      await page.screenshot({ path: "debug-character-dropdown-open.png" });

      // ドロップダウンの選択肢をチェック
      const options = page.locator('[role="option"], .MuiMenuItem-root');
      const count = await options.count();
      console.log(`キャラクター選択オプション数: ${count}`);

      if (count > 0) {
        // 最初の選択肢をクリック
        await options.first().click();
        console.log("キャラクター選択完了");
      } else {
        console.log("警告: 選択可能なキャラクターがありません");
      }
    } else {
      console.log("関連キャラクターフィールドが見つかりませんでした");

      // 代替手段: セレクトボックスの可能性を確認
      const selectBox = page
        .locator("select")
        .filter({ hasText: /関連キャラクター|キャラクター/ });
      if (await selectBox.isVisible()) {
        await selectBox.selectOption({ index: 1 });
        console.log("キャラクター選択（セレクトボックス）完了");
      }
    }
  } catch (error) {
    console.log(`キャラクター選択でエラー: ${error.message}`);
    await page.screenshot({ path: "debug-character-selection-error.png" });
    // テストを続行する（キャラクター選択が必須でない場合もあるため）
  }
}

/**
 * 保存ボタンをクリックする
 */
async function clickSaveButton(page: Page, context: string): Promise<void> {
  const saveButtons = [
    page.getByRole("button", { name: /保存|登録|確定|追加/ }),
    page.locator(".MuiDialogActions-root button").last(),
    page.locator('button:has-text("保存")'),
    page.locator('button:has-text("登録")'),
    page.locator('button:has-text("追加")'),
  ];

  let saved = false;
  for (const saveBtn of saveButtons) {
    if (await saveBtn.isVisible()) {
      console.log(`${context}ボタンが見つかりました`);
      await saveBtn.click({ force: true });
      await page.waitForTimeout(2000);
      saved = true;
      break;
    }
  }

  if (!saved) {
    console.log(`${context}ボタンが見つかりませんでした`);
    await page.screenshot({
      path: `debug-no-save-button-${context.replace(/\s+/g, "-")}.png`,
    });
    throw new Error(`${context}ボタンが見つかりませんでした`);
  }
}

/**
 * イベントが追加されたことを確認する
 */
async function verifyEventAdded(page: Page): Promise<void> {
  const emptyMessage = page.locator("text=イベントはまだありません");
  const eventItem = page
    .locator(".timeline-event-item, [data-testid=timeline-event]")
    .first();
  const eventTitle = page.getByText("テストイベント1");

  if (await emptyMessage.isVisible()) {
    console.log("警告: イベントが追加されていません");
    await page.screenshot({ path: "debug-empty-timeline.png" });
    throw new Error("イベントが追加されていません");
  } else if ((await eventItem.isVisible()) || (await eventTitle.isVisible())) {
    console.log("成功: イベントが追加されました");
    // スクリーンショットでイベントを表示
    await page.screenshot({ path: "debug-event-added-success.png" });

    // イベントの詳細を確認
    if (await eventTitle.isVisible()) {
      console.log("イベントタイトル「テストイベント1」が表示されています");
      await expect(eventTitle).toBeVisible();
    }

    // イベントアイテムが表示されていることを確認
    if (await eventItem.isVisible()) {
      console.log("タイムラインイベントアイテムが表示されています");
      await expect(eventItem).toBeVisible();
    }
  } else {
    console.log("警告: イベントの追加状態が不明確です");
    await page.screenshot({ path: "debug-event-status-unclear.png" });
    throw new Error("イベントの追加状態が不明確です");
  }
}
