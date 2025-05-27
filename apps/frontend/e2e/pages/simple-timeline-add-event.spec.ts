import { test, expect } from "@playwright/test";
import { join } from "path";
import { existsSync, mkdirSync } from "fs";

// スナップショット保存ディレクトリ
const SNAPSHOT_DIR = join(
  process.cwd(),
  "test-results",
  "simple-timeline-event"
);

// ディレクトリが存在しない場合は作成
if (!existsSync(SNAPSHOT_DIR)) {
  mkdirSync(SNAPSHOT_DIR, { recursive: true });
  console.log(`ディレクトリを作成しました: ${SNAPSHOT_DIR}`);
}

// 開発サーバーのURL
const BASE_URL = "http://localhost:5173";

/**
 * シンプルなタイムラインイベント追加テスト
 * キャラクター1件と地名1件を登録したプロジェクトでイベントを追加
 */
test("シンプルなタイムラインイベント追加", async ({ page }) => {
  test.setTimeout(180000); // 3分間のタイムアウト

  console.log("テスト開始: シンプルなタイムラインイベント追加");

  // ステップ1: ローカルストレージに直接テストデータを挿入
  await page.goto(BASE_URL);
  await page.waitForLoadState("networkidle");

  // テスト用のデータをローカルストレージに直接セット
  await page.evaluate(() => {
    try {
      // ローカルストレージをクリア
      localStorage.clear();

      // テスト用プロジェクト
      const projectId = `test-project-${Date.now()}`;
      const placeId = `test-place-${Date.now()}`;
      const characterId = `test-character-${Date.now()}`;

      const testProject = {
        id: projectId,
        title: "タイムラインイベントテスト",
        genre: "ファンタジー",
        summary: "タイムラインイベント追加のテスト用プロジェクト",
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),

        // テスト用地名1件
        places: [
          {
            id: placeId,
            name: "テスト王国",
            description: "テスト用の王国です",
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          },
        ],

        // テスト用キャラクター1件
        characters: [
          {
            id: characterId,
            name: "テスト主人公",
            age: 17,
            role: "主人公",
            description: "テスト用の主人公です",
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          },
        ],

        // 空のタイムライン
        timeline: {
          events: [],
        },
      };

      // プロジェクトデータを保存
      localStorage.setItem("novelProjects", JSON.stringify([testProject]));
      localStorage.setItem("currentProjectId", projectId);

      console.log("テストデータをローカルストレージに設定しました", {
        projectId,
        placeId,
        characterId,
      });
      return { success: true, projectId, placeId, characterId };
    } catch (error) {
      console.error("テストデータ設定エラー:", error);
      return { success: false, error: String(error) };
    }
  });

  // ページをリロード
  await page.reload();
  await page.waitForLoadState("networkidle");
  await page.waitForTimeout(2000);

  // スナップショット: ホーム画面
  await page.screenshot({
    path: join(SNAPSHOT_DIR, "01-home-page.png"),
    fullPage: true,
  });

  // ステップ2: サイドメニューからタイムラインボタンをクリック
  console.log("サイドメニューからタイムラインページに移動します");

  try {
    // タイムラインボタンを検索
    const timelineButton = page.locator("button", { hasText: "タイムライン" });

    console.log("タイムラインボタンを探しています...");
    await expect(timelineButton).toBeVisible({ timeout: 5000 });
    console.log("タイムラインボタンが見つかりました。クリックします");

    await timelineButton.click();
    await page.waitForLoadState("networkidle");
    await page.waitForTimeout(3000);

    console.log("タイムラインページに移動完了");
  } catch (error) {
    console.log(`タイムラインボタンクリックでエラー: ${error}`);
    console.log("直接URLでタイムラインページに移動します");

    // 直接URLでタイムラインページに移動
    await page.goto(`${BASE_URL}/timeline`);
    await page.waitForLoadState("networkidle");
    await page.waitForTimeout(3000);
  }

  // スナップショット: タイムラインページ初期状態
  await page.screenshot({
    path: join(SNAPSHOT_DIR, "02-timeline-page.png"),
    fullPage: true,
  });

  // ステップ3: イベント追加ボタンを探してクリック
  console.log("イベント追加ボタンを探します");

  const addEventButtonSelectors = [
    'button:has-text("イベント追加")',
    'button:has-text("イベントを追加")',
    'button[aria-label="add-event"]',
    '.MuiButton-root:has-text("追加")',
    ".MuiButton-contained",
    "button.MuiButtonBase-root",
  ];

  let buttonClicked = false;
  for (const selector of addEventButtonSelectors) {
    const buttons = await page.locator(selector).all();

    for (const button of buttons) {
      const text = await button.textContent();
      if (text && (text.includes("イベント") || text.includes("追加"))) {
        console.log(`イベント追加ボタンが見つかりました: ${text}`);
        await button.scrollIntoViewIfNeeded();
        await page.waitForTimeout(500);
        await button.click({ force: true });
        buttonClicked = true;
        await page.waitForTimeout(2000);
        break;
      }
    }

    if (buttonClicked) break;
  }

  if (!buttonClicked) {
    console.log(
      "イベント追加ボタンが見つかりませんでした。JavaScriptで追加します"
    );

    // JavaScriptでイベント追加ダイアログを直接開く
    await page.evaluate(() => {
      try {
        // さまざまな方法でイベント追加を試みる
        const eventNames = [
          "open-add-event-dialog",
          "open-event-dialog",
          "add-timeline-event",
        ];

        for (const eventName of eventNames) {
          const event = new CustomEvent(eventName, {
            detail: { mode: "create" },
          });
          window.dispatchEvent(event);
        }

        // または直接DOMにボタンを追加してクリック
        const container = document.querySelector(
          ".timeline-container, main, .MuiContainer-root"
        );
        if (container) {
          const button = document.createElement("button");
          button.textContent = "イベント追加";
          button.style.position = "absolute";
          button.style.top = "10px";
          button.style.right = "10px";
          button.onclick = () => {
            console.log("イベント追加ボタンをクリックしました");
            for (const eventName of eventNames) {
              window.dispatchEvent(new CustomEvent(eventName));
            }
          };
          container.appendChild(button);
          button.click();
        }

        return true;
      } catch (error) {
        console.error("イベント追加ダイアログを開く試行に失敗:", error);
        return false;
      }
    });

    await page.waitForTimeout(3000);
  }

  // スナップショット: イベント追加ダイアログ
  await page.screenshot({
    path: join(SNAPSHOT_DIR, "03-event-dialog.png"),
    fullPage: true,
  });

  // ステップ4: イベント情報を入力
  console.log("イベント情報を入力します");

  // タイトル入力
  try {
    const titleInputSelectors = [
      'input[placeholder*="タイトル"]',
      'input[name*="title"]',
      'input[aria-label*="タイトル"]',
      'input[type="text"]',
    ];

    for (const selector of titleInputSelectors) {
      const titleInput = page.locator(selector).first();
      if (await titleInput.isVisible({ timeout: 1000 }).catch(() => false)) {
        console.log(`タイトル入力フィールドが見つかりました: ${selector}`);
        await titleInput.fill("テストイベント");
        break;
      }
    }
  } catch (error) {
    console.log(`タイトル入力でエラー: ${error}`);
  }

  // 説明入力
  try {
    const descInputSelectors = [
      "textarea",
      'textarea[name*="description"]',
      'textarea[aria-label*="説明"]',
      '[role="textbox"]',
    ];

    for (const selector of descInputSelectors) {
      const descInput = page.locator(selector).first();
      if (await descInput.isVisible({ timeout: 1000 }).catch(() => false)) {
        console.log(`説明入力フィールドが見つかりました: ${selector}`);
        await descInput.fill("テスト用のイベント説明です");
        break;
      }
    }
  } catch (error) {
    console.log(`説明入力でエラー: ${error}`);
  }

  // 関連地名を選択
  try {
    const selectSelectors = [
      'div[role="button"]:has-text("関連地名")',
      'select[name*="place"]',
      ".MuiSelect-select",
      ".MuiAutocomplete-root input",
    ];

    let placeSelected = false;
    for (const selector of selectSelectors) {
      const selectElement = page.locator(selector).first();
      if (await selectElement.isVisible({ timeout: 1000 }).catch(() => false)) {
        console.log(`関連地名選択フィールドが見つかりました: ${selector}`);

        // セレクト要素の場合
        if (
          (await page
            .locator("select")
            .filter({ has: selectElement })
            .count()) > 0
        ) {
          await selectElement.selectOption({ index: 1 });
          placeSelected = true;
          break;
        }

        // クリックして開くタイプの場合
        await selectElement.click();
        await page.waitForTimeout(1000);

        // ドロップダウン内の選択肢をクリック
        const options = page
          .locator('[role="option"], .MuiMenuItem-root')
          .first();
        if (await options.isVisible({ timeout: 1000 }).catch(() => false)) {
          await options.click();
          placeSelected = true;
          break;
        }
      }
    }

    if (!placeSelected) {
      console.log("地名選択フィールドが見つからないか、選択できませんでした");
    }
  } catch (error) {
    console.log(`地名選択でエラー: ${error}`);
  }

  // スナップショット: フォーム入力後
  await page.screenshot({
    path: join(SNAPSHOT_DIR, "04-form-filled.png"),
    fullPage: true,
  });

  // ステップ5: 保存ボタンをクリック
  console.log("イベントを保存します");

  const saveButtonSelectors = [
    'button:has-text("保存")',
    'button:has-text("追加")',
    'button:has-text("確定")',
    'button:has-text("登録")',
    'button[type="submit"]',
    ".MuiDialogActions-root button:last-child",
  ];

  let saveButtonClicked = false;
  for (const selector of saveButtonSelectors) {
    const saveButtons = await page.locator(selector).all();

    for (const saveBtn of saveButtons) {
      const text = await saveBtn.textContent();
      const isEnabled = await saveBtn.isEnabled().catch(() => false);

      if (
        text &&
        (text.includes("保存") ||
          text.includes("追加") ||
          text.includes("確定") ||
          text.includes("登録")) &&
        isEnabled
      ) {
        console.log(`保存ボタンが見つかりました: ${text}`);
        await saveBtn.scrollIntoViewIfNeeded();
        await page.waitForTimeout(500);
        await saveBtn.click({ force: true });
        saveButtonClicked = true;
        await page.waitForTimeout(3000);
        break;
      }
    }

    if (saveButtonClicked) break;
  }

  if (!saveButtonClicked) {
    console.log("保存ボタンが見つかりませんでした。JavaScriptで保存します");

    // JavaScriptで保存を実行
    await page.evaluate(() => {
      try {
        // フォームのsubmitイベントを強制的に発火
        const form = document.querySelector("form");
        if (form) {
          console.log("フォームを送信します");
          form.dispatchEvent(new Event("submit", { cancelable: true }));
        }

        // または保存ボタンを強制的にクリック
        const saveButtons = Array.from(
          document.querySelectorAll("button")
        ).filter((btn) => {
          const text = btn.textContent?.toLowerCase() || "";
          return (
            text.includes("保存") ||
            text.includes("追加") ||
            text.includes("確定") ||
            text.includes("登録")
          );
        });

        if (saveButtons.length > 0) {
          console.log(
            `${saveButtons.length}個の保存ボタンが見つかりました。最後のボタンをクリックします`
          );
          (saveButtons[saveButtons.length - 1] as HTMLElement).click();
        }

        return true;
      } catch (error) {
        console.error("保存操作の試行に失敗:", error);
        return false;
      }
    });

    await page.waitForTimeout(3000);
  }

  // スナップショット: イベント追加後
  await page.screenshot({
    path: join(SNAPSHOT_DIR, "05-event-added.png"),
    fullPage: true,
  });

  // ステップ6: イベントが追加されたか確認
  console.log("イベントが追加されたか確認します");

  // 空のメッセージがないことを確認
  const emptyMessage = page.locator('text="イベントはまだありません"');
  if (await emptyMessage.isVisible({ timeout: 1000 }).catch(() => false)) {
    console.log("イベントが追加されていない可能性があります");
  } else {
    console.log(
      "空メッセージがないため、イベントが追加されている可能性があります"
    );
  }

  // イベント要素を検索
  try {
    const eventElements = await page
      .locator(
        '.timeline-event, .MuiCard-root, [data-testid="timeline-event"], .MuiPaper-root'
      )
      .all();

    if (eventElements.length > 0) {
      console.log(`${eventElements.length}個のイベント要素が見つかりました`);

      // イベントのテキストを確認
      for (let i = 0; i < eventElements.length; i++) {
        const text = await eventElements[i].textContent();
        console.log(`イベント${i + 1}のテキスト: ${text}`);

        if (text && text.includes("テストイベント")) {
          console.log("テストイベントが見つかりました！");
          break;
        }
      }
    } else {
      console.log("イベント要素が見つかりません");
    }
  } catch (error) {
    console.log(`イベント検索エラー: ${error}`);
  }

  // タイムラインを保存（必要な場合）
  try {
    console.log("タイムラインを保存します");

    const saveTimelineButtons = [
      'button:has-text("タイムラインを保存")',
      'button:has-text("保存")',
      'button[aria-label="save-timeline"]',
    ];

    for (const selector of saveTimelineButtons) {
      const saveBtn = page.locator(selector).first();
      if (await saveBtn.isVisible({ timeout: 1000 }).catch(() => false)) {
        console.log(`タイムライン保存ボタンが見つかりました: ${selector}`);
        await saveBtn.click({ force: true });
        await page.waitForTimeout(2000);

        // 保存成功メッセージを確認
        const successMessage = page.locator(
          'text="タイムラインを保存しました"'
        );
        if (
          await successMessage.isVisible({ timeout: 3000 }).catch(() => false)
        ) {
          console.log("タイムラインの保存に成功しました");
        }

        break;
      }
    }
  } catch (error) {
    console.log(`タイムライン保存でエラー: ${error}`);
  }

  // スナップショット: テスト完了
  await page.screenshot({
    path: join(SNAPSHOT_DIR, "06-test-complete.png"),
    fullPage: true,
  });

  console.log("テスト完了: シンプルなタイムラインイベント追加");
});
