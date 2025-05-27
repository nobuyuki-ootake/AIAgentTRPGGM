import { test } from "@playwright/test";
import { join } from "path";
import { existsSync, mkdirSync } from "fs";

// スナップショット保存ディレクトリの絶対パスを設定
const SNAPSHOT_DIR = join(process.cwd(), "test-results", "timeline-workflow");

// ディレクトリを作成
if (!existsSync(SNAPSHOT_DIR)) {
  mkdirSync(SNAPSHOT_DIR, { recursive: true });
  console.log(`スナップショットディレクトリを作成しました: ${SNAPSHOT_DIR}`);
}

// 開発サーバーのURL
const BASE_URL = "http://localhost:5173";

test.describe("タイムラインワークフロー", () => {
  test("プロジェクト作成から地名・キャラクター登録、タイムラインイベント追加までの流れ", async ({
    page,
  }) => {
    // 1. ホームページにアクセス
    await page.goto(BASE_URL);
    await page.waitForLoadState("networkidle");
    console.log("ホームページにアクセスしました");

    // スナップショット: ホーム画面の初期状態
    await page.screenshot({
      path: join(SNAPSHOT_DIR, "01-home-initial.png"),
      fullPage: true,
    });

    // 2. 新規プロジェクト作成
    const newProjectButton = page.getByRole("button", {
      name: "新規プロジェクト",
    });
    await newProjectButton.click();
    await page.waitForTimeout(500);
    console.log("新規プロジェクトモーダルを表示しました");

    // スナップショット: 新規プロジェクトモーダル
    await page.screenshot({
      path: join(SNAPSHOT_DIR, "02-new-project-modal.png"),
      fullPage: true,
    });

    // プロジェクト情報を入力
    await page.locator('input[type="text"]').first().fill("テストプロジェクト");

    // ジャンル選択がある場合は選択
    const genreSelect = page.locator("select").first();
    if (await genreSelect.isVisible()) {
      await genreSelect.selectOption({ index: 1 });
    }

    // 作成ボタンをクリック
    await page.getByRole("button", { name: /作成|保存|確定/ }).click();
    await page.waitForTimeout(1000);
    console.log("プロジェクトを作成しました");

    // 3. 世界観構築ページで地名を追加
    // サイドバーから世界観構築ページへ移動
    const worldBuildingNavLink = page.getByRole("button", { name: /世界観/ });
    if (await worldBuildingNavLink.isVisible()) {
      await worldBuildingNavLink.click();
    } else {
      // 直接URLで移動
      await page.goto(`${BASE_URL}/world-building`);
    }

    await page.waitForLoadState("networkidle");
    await page.waitForTimeout(1000);
    console.log("世界観構築ページに移動しました");

    // スナップショット: 世界観構築ページの初期状態
    await page.screenshot({
      path: join(SNAPSHOT_DIR, "03-world-building-initial.png"),
      fullPage: true,
    });

    // 場所追加ボタンをクリック
    const addPlaceButton = page.getByRole("button", {
      name: /場所追加|追加|新規/,
    });

    if (await addPlaceButton.isVisible()) {
      await addPlaceButton.click();
      await page.waitForTimeout(500);
      console.log("場所追加モーダルを表示しました");

      // スナップショット: 場所追加モーダル
      await page.screenshot({
        path: join(SNAPSHOT_DIR, "04-add-place-modal.png"),
        fullPage: true,
      });

      // 場所情報を入力
      const nameInput = page
        .locator('input[placeholder*="名前"], input[name*="name"]')
        .first();
      if (await nameInput.isVisible()) {
        await nameInput.fill("テスト王国");

        // その他のフィールドも入力
        const typeSelect = page.locator('select[name*="type"]').first();
        if (await typeSelect.isVisible()) {
          await typeSelect.selectOption({ index: 0 });
        }

        // 説明などのテキストエリアに入力
        const textarea = page.locator("textarea").first();
        if (await textarea.isVisible()) {
          await textarea.fill(
            "テスト用の王国です。タイムラインイベントに関連付けるために作成しました。"
          );
        }

        // 保存ボタンをクリック
        const saveButton = page.getByRole("button", { name: /保存|登録|確定/ });
        if (await saveButton.isVisible()) {
          await saveButton.click();
          await page.waitForTimeout(1000);
          console.log("場所情報を保存しました");

          // スナップショット: 場所追加後
          await page.screenshot({
            path: join(SNAPSHOT_DIR, "05-after-place-creation.png"),
            fullPage: true,
          });
        }
      }
    }

    // 4. キャラクターページでキャラクターを追加
    // サイドバーからキャラクターページへ移動
    const charactersNavLink = page.getByRole("button", {
      name: /キャラクター/,
    });
    if (await charactersNavLink.isVisible()) {
      await charactersNavLink.click();
    } else {
      // 直接URLで移動
      await page.goto(`${BASE_URL}/characters`);
    }

    await page.waitForLoadState("networkidle");
    await page.waitForTimeout(1000);
    console.log("キャラクターページに移動しました");

    // スナップショット: キャラクターページの初期状態
    await page.screenshot({
      path: join(SNAPSHOT_DIR, "06-characters-initial.png"),
      fullPage: true,
    });

    // キャラクター追加ボタンをクリック
    const addCharacterButton = page.getByRole("button", {
      name: /キャラクター追加|追加|新規/,
    });

    if (await addCharacterButton.isVisible()) {
      await addCharacterButton.click();
      await page.waitForTimeout(500);
      console.log("キャラクター追加モーダルを表示しました");

      // スナップショット: キャラクター追加モーダル
      await page.screenshot({
        path: join(SNAPSHOT_DIR, "07-add-character-modal.png"),
        fullPage: true,
      });

      // キャラクター情報を入力
      const nameInput = page
        .locator('input[placeholder*="名前"], input[name*="name"]')
        .first();
      if (await nameInput.isVisible()) {
        await nameInput.fill("テスト主人公");

        // 年齢入力
        const ageInput = page
          .locator('input[placeholder*="年齢"], input[name*="age"]')
          .first();
        if (await ageInput.isVisible()) {
          await ageInput.fill("25");
        }

        // 役割選択
        const roleSelect = page.locator('select[name*="role"]').first();
        if (await roleSelect.isVisible()) {
          await roleSelect.selectOption({ index: 0 });
        }

        // 説明などのテキストエリアに入力
        const textareas = await page.locator("textarea").all();
        for (let i = 0; i < Math.min(textareas.length, 2); i++) {
          if (await textareas[i].isVisible()) {
            await textareas[i].fill(
              `テストキャラクターの説明${
                i + 1
              }です。タイムラインイベントに関連付けるために作成しました。`
            );
          }
        }

        // 保存ボタンをクリック
        const saveButton = page.getByRole("button", { name: /保存|登録|確定/ });
        if (await saveButton.isVisible()) {
          await saveButton.click();
          await page.waitForTimeout(1000);
          console.log("キャラクター情報を保存しました");

          // スナップショット: キャラクター追加後
          await page.screenshot({
            path: join(SNAPSHOT_DIR, "08-after-character-creation.png"),
            fullPage: true,
          });
        }
      }
    }

    // 5. タイムラインページでイベントを追加
    // サイドバーからタイムラインページへ移動
    const timelineNavLink = page.getByRole("button", { name: /タイムライン/ });
    if (await timelineNavLink.isVisible()) {
      await timelineNavLink.click();
    } else {
      // 直接URLで移動
      await page.goto(`${BASE_URL}/timeline`);
    }

    await page.waitForLoadState("networkidle");
    await page.waitForTimeout(1000);
    console.log("タイムラインページに移動しました");

    // スナップショット: タイムラインページの初期状態
    await page.screenshot({
      path: join(SNAPSHOT_DIR, "09-timeline-initial.png"),
      fullPage: true,
    });

    // イベント追加ボタンを検索
    console.log("イベント追加ボタンを検索しています...");
    const addEventButton = page.getByRole("button", {
      name: /イベント追加|追加|新規/,
    });

    if (await addEventButton.isVisible()) {
      console.log("イベント追加ボタンを発見しました");

      // スナップショット: イベント追加ボタン発見時
      await page.screenshot({
        path: join(SNAPSHOT_DIR, "10-found-add-event-button.png"),
        fullPage: true,
      });

      // イベント追加ボタンをクリック
      await addEventButton.click();
      await page.waitForTimeout(500);
      console.log("イベント追加モーダルを表示しました");

      // スナップショット: イベント追加モーダル
      await page.screenshot({
        path: join(SNAPSHOT_DIR, "11-add-event-modal.png"),
        fullPage: true,
      });

      // イベント情報を入力
      // タイトル入力
      const titleInput = page
        .locator('input[placeholder*="タイトル"], input[name*="title"]')
        .first();
      if (await titleInput.isVisible()) {
        await titleInput.fill("テストイベント");

        // 日付入力
        const dateInput = page.locator('input[type="date"]').first();
        if (await dateInput.isVisible()) {
          await dateInput.fill("2023-01-01");
          console.log("日付入力完了");
        }

        // 説明入力
        const descriptionTextarea = page.locator("textarea").first();
        if (await descriptionTextarea.isVisible()) {
          await descriptionTextarea.fill(
            "これはテストイベントの説明です。スナップショット取得のために作成しました。"
          );
        }

        // 関連地名を選択
        console.log("関連地名を選択しています...");

        // 場所選択フィールドを探す方法はUIによって異なる
        // 1. 通常のセレクトボックスを探す
        console.log("通常のセレクトボックスを探しています");
        const placeSelect = page.locator('select[name*="place"]').first();

        if (await placeSelect.isVisible()) {
          await placeSelect.selectOption({ index: 1 }); // 最初の場所を選択
        } else {
          // 2. ラベルで検索
          console.log("ラベルで場所の選択フィールドを探します");
          const placeLabel = page
            .locator("label")
            .filter({ hasText: "関連地名" });

          if (await placeLabel.isVisible()) {
            const placeField = placeLabel.locator("..").first();
            console.log("ラベルから場所フィールドを選択しました");

            // セレクトボックスを開く
            await placeField.click();
            await page.waitForTimeout(500);

            // 最初の選択肢を選ぶ
            const options = page
              .locator("li")
              .filter({ hasText: "テスト王国" })
              .first();
            if (await options.isVisible()) {
              await options.click();
              await page.waitForTimeout(500);
            }
          }
        }

        // 関連キャラクターを選択
        console.log("関連キャラクターを選択しています...");

        // キャラクター選択フィールドを探す方法もUIによって異なる
        const characterLabel = page
          .locator("label")
          .filter({ hasText: "関連キャラクター" });

        if (await characterLabel.isVisible()) {
          console.log("キャラクター選択コンポーネントを発見しました");
          const characterField = characterLabel.locator("..").first();

          // セレクトボックスを開く
          await characterField.click();
          await page.waitForTimeout(500);

          // 最初の選択肢を選ぶ
          const options = page
            .locator("li")
            .filter({ hasText: "テスト主人公" })
            .first();
          if (await options.isVisible()) {
            await options.click();
            await page.waitForTimeout(500);
          }
        }

        // イベント入力完了後のスナップショット
        await page.screenshot({
          path: join(SNAPSHOT_DIR, "12-event-form-filled.png"),
          fullPage: true,
        });

        // 保存ボタンをクリック
        const saveButton = page.getByRole("button", { name: /保存|登録|確定/ });
        if ((await saveButton.isVisible()) && (await saveButton.isEnabled())) {
          await saveButton.click();
          await page.waitForTimeout(1000);
          console.log("イベント情報を保存しました");

          // スナップショット: イベント追加後
          await page.screenshot({
            path: join(SNAPSHOT_DIR, "13-after-event-creation.png"),
            fullPage: true,
          });

          // タイムラインチャート部分があればスナップショット
          const timelineChart = page
            .locator('.timeline-chart, [data-testid="timeline-chart"]')
            .first();
          if (await timelineChart.isVisible()) {
            await timelineChart.screenshot({
              path: join(SNAPSHOT_DIR, "14-timeline-chart.png"),
            });
            console.log("タイムラインチャートのスナップショットを保存しました");
          }
        }
      }
    } else {
      console.log("イベント追加ボタンが見つかりませんでした");
    }
  });
});
