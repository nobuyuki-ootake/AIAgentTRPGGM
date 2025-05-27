import { test, expect } from "@playwright/test";

// ページ名とパスのマッピング
const pages = [
  { name: "Home", path: "/" },
  { name: "Writing", path: "/writing" },
  { name: "Characters", path: "/characters" },
  { name: "Plot", path: "/plot" },
  { name: "WorldBuilding", path: "/world-building" },
  { name: "Timeline", path: "/timeline" },
  { name: "Synopsis", path: "/synopsis" },
];

// 開発サーバーのURL（ポート5173に修正）
const BASE_URL = "http://localhost:5173";

// すべてのテストでブラウザを表示する設定
test.use({ headless: false });

test.describe("全ページビジュアルスナップショット", () => {
  for (const pageInfo of pages) {
    test(`${pageInfo.name}ページのビジュアルスナップショット`, async ({
      page,
    }) => {
      await page.goto(`${BASE_URL}${pageInfo.path}`);
      // 画面全体のスクリーンショット
      await expect(page).toHaveScreenshot(`${pageInfo.name.toLowerCase()}.png`);
    });
  }
});

// UIの構造に合わせて修正したデータ入力済み状態のスナップショットテスト
test.describe("データ入力済み状態のビジュアルスナップショット", () => {
  // 1. まずは初期ページの状態をキャプチャするシンプルなテスト
  test("各ページの初期状態をキャプチャ", async ({ page }) => {
    // キャラクターページの初期状態
    await page.goto(`${BASE_URL}/characters`);
    await page.waitForLoadState("networkidle");
    await expect(page).toHaveScreenshot("characters-initial.png");

    // プロットページの初期状態
    await page.goto(`${BASE_URL}/plot`);
    await page.waitForLoadState("networkidle");
    await expect(page).toHaveScreenshot("plot-initial.png");

    // 世界観ページの初期状態
    await page.goto(`${BASE_URL}/world-building`);
    await page.waitForLoadState("networkidle");
    await expect(page).toHaveScreenshot("worldbuilding-initial.png");
  });

  // 2. モーダルや操作画面が表示された状態のキャプチャ
  test("モーダルや操作画面が表示された状態をキャプチャ", async ({ page }) => {
    // ホームページで新規プロジェクトモーダルを表示
    await page.goto(BASE_URL);
    await page.waitForLoadState("networkidle");
    const newProjectButton = page.getByRole("button", {
      name: "新規プロジェクト",
    });
    await newProjectButton.click();
    await page.waitForTimeout(500); // モーダルの表示を待つ
    await expect(page).toHaveScreenshot("home-with-project-modal.png");

    // キャラクターページで追加モーダルを表示
    await page.goto(`${BASE_URL}/characters`);
    await page.waitForLoadState("networkidle");
    const addCharacterButton = page.getByRole("button", {
      name: /キャラクター追加|追加|新規/,
    });
    if (await addCharacterButton.isVisible()) {
      await addCharacterButton.click();
      await page.waitForTimeout(500); // モーダルの表示を待つ
      await expect(page).toHaveScreenshot("characters-with-modal.png");
    }

    // プロットページで追加モーダルを表示
    await page.goto(`${BASE_URL}/plot`);
    await page.waitForLoadState("networkidle");
    const addPlotButton = page.getByRole("button", {
      name: /シナリオ追加|追加|新規/,
    });
    if (await addPlotButton.isVisible()) {
      await addPlotButton.click();
      await page.waitForTimeout(500); // モーダルの表示を待つ
      await expect(page).toHaveScreenshot("plot-with-modal.png");
    }
  });

  // 3. プロジェクト作成後の各ページ状態をキャプチャする新しいテスト
  test("プロジェクト作成後の各ページ状態をキャプチャ", async ({ page }) => {
    // ホームページにアクセスしてプロジェクトを作成
    await page.goto(BASE_URL);
    await page.waitForLoadState("networkidle");

    // 新規プロジェクトボタンをクリック
    await page.getByRole("button", { name: "新規プロジェクト" }).click();
    await page.waitForTimeout(500); // モーダルの表示を待つ

    // プロジェクト情報を入力
    await page
      .locator('input[type="text"]')
      .first()
      .fill("テスト小説プロジェクト");

    // セレクトボックスがある場合は選択
    const genreSelect = page.locator("select").first();
    if (await genreSelect.isVisible()) {
      await genreSelect.selectOption({ index: 1 }); // 最初のオプション以外を選択
    }

    // 作成ボタンをクリック
    await page.getByRole("button", { name: /作成|保存|確定/ }).click();

    // プロジェクトが作成されるまで待機
    await page.waitForTimeout(1000);

    // ホームページのプロジェクト作成後の状態を保存（あらすじページが表示されている）
    await page.waitForLoadState("networkidle");
    await expect(page).toHaveScreenshot("home-with-project.png");

    // 各ページにメニューから移動してプロジェクト作成後の状態をキャプチャ
    const pagesToCapture = [
      { name: "characters", label: "キャラクター" },
      { name: "plot", label: "プロット" },
      { name: "world-building", label: "世界観構築" },
      { name: "timeline", label: "タイムライン" },
      { name: "writing", label: "本文執筆" },
      { name: "synopsis", label: "あらすじ" },
    ];

    // まず全ページのスナップショットを取得
    for (const pageInfo of pagesToCapture) {
      // サイドバーメニューから対象のページを選択
      await page.getByRole("button", { name: pageInfo.label }).click();
      await page.waitForLoadState("networkidle");
      await page.waitForTimeout(500); // UI更新を待つ

      // 対象ページの状態をキャプチャ
      await expect(page).toHaveScreenshot(`${pageInfo.name}-with-project.png`);
    }

    // 各ページでデータを追加した状態をキャプチャ（可能な場合のみ）

    // 1. キャラクターページでキャラクターを追加
    await page.getByRole("button", { name: "キャラクター" }).click();
    await page.waitForLoadState("networkidle");

    // キャラクター追加ボタンを探す
    const addCharButton = page.getByRole("button", {
      name: /キャラクター追加|追加|新規/,
    });

    // ボタンが表示され、有効な場合のみ処理を実行
    if (
      (await addCharButton.isVisible()) &&
      (await addCharButton.isEnabled())
    ) {
      await addCharButton.click();
      await page.waitForTimeout(500);

      // 入力フィールドを探して入力
      const nameInput = page
        .locator('input[placeholder*="名前"], input[name*="name"]')
        .first();
      if (await nameInput.isVisible()) {
        await nameInput.fill("テスト主人公");

        // その他のフィールドも可能な限り入力
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

        // テキストエリアに入力
        const textareas = await page.locator("textarea").all();
        for (let i = 0; i < Math.min(textareas.length, 3); i++) {
          // 最大3つまで
          const textarea = textareas[i];
          if (await textarea.isVisible()) {
            await textarea.fill(
              `テスト${
                i + 1
              }データです。このキャラクターのサンプル情報として入力しています。`
            );
          }
        }

        // 保存ボタンをクリック
        const saveButton = page.getByRole("button", { name: /保存|登録|確定/ });
        if ((await saveButton.isVisible()) && (await saveButton.isEnabled())) {
          await saveButton.click();
          await page.waitForTimeout(1000);
        }
      }

      // キャラクター追加後の状態をキャプチャ
      await page.waitForLoadState("networkidle");
      await expect(page).toHaveScreenshot("characters-with-data.png");
    } else {
      console.log(
        "キャラクター追加ボタンが見つからないか、無効化されています。キャラクター追加のテストをスキップします。"
      );
    }

    // 2. 世界観構築ページで場所を追加
    await page.getByRole("button", { name: "世界観構築" }).click();
    await page.waitForLoadState("networkidle");
    await page.waitForTimeout(500);

    // 場所追加ボタンを探す
    const addPlaceButton = page.getByRole("button", {
      name: /場所追加|追加|新規/,
    });

    if (
      (await addPlaceButton.isVisible()) &&
      (await addPlaceButton.isEnabled())
    ) {
      await addPlaceButton.click();
      await page.waitForTimeout(500);

      // 場所の名前を入力
      const placeNameInput = page
        .locator('input[placeholder*="名前"], input[name*="name"]')
        .first();
      if (await placeNameInput.isVisible()) {
        await placeNameInput.fill("テスト舞台");

        // 説明を入力
        const descTextarea = page.locator("textarea").first();
        if (await descTextarea.isVisible()) {
          await descTextarea.fill(
            "これはテスト用の舞台設定です。タイムラインイベントの場所として使用します。"
          );
        }

        // 保存ボタンをクリック
        const savePlaceButton = page.getByRole("button", {
          name: /保存|登録|確定/,
        });
        if (
          (await savePlaceButton.isVisible()) &&
          (await savePlaceButton.isEnabled())
        ) {
          await savePlaceButton.click();
          await page.waitForTimeout(1000);
        }
      }

      // 場所追加後の状態をキャプチャ
      await page.waitForLoadState("networkidle");
      await expect(page).toHaveScreenshot("worldbuilding-with-place.png");
    }

    // 3. タイムラインページでイベントを追加
    await page.getByRole("button", { name: "タイムライン" }).click();
    await page.waitForLoadState("networkidle");
    await page.waitForTimeout(1000); // しっかり待機

    // タイムラインページのUIをキャプチャ（イベント追加前）
    await expect(page).toHaveScreenshot("timeline-before-event.png");

    // ----- イベント追加処理の強化部分 -----

    console.log("タイムラインページで「イベント追加」ボタンを検索...");

    // 複数の方法でイベント追加ボタンを検索
    // 1. テキスト内容で検索
    let addEventButton = page.getByText("イベント追加", { exact: true });

    // 2. ボタン要素のロールと内容で検索
    if (!(await addEventButton.isVisible())) {
      console.log("方法1失敗、方法2を試行...");
      addEventButton = page.getByRole("button", { name: "イベント追加" });
    }

    // 3. CSSセレクタで直接検索
    if (!(await addEventButton.isVisible())) {
      console.log("方法2失敗、方法3を試行...");
      addEventButton = page.locator("button:has-text('イベント追加')").first();
    }

    // 4. 青いボタンから検索（MUIの主要ボタンはたいていcontainedスタイル）
    if (!(await addEventButton.isVisible())) {
      console.log("方法3失敗、方法4を試行...");
      addEventButton = page.locator(".MuiButton-contained").first();
    }

    if (await addEventButton.isVisible()) {
      console.log(
        "イベント追加ボタンが見つかりました。スクリーンショット撮影..."
      );
      await page.screenshot({ path: "found-add-event-button.png" });

      console.log("ボタンをクリック...");
      await addEventButton.click({ force: true });
      await page.waitForTimeout(1500); // ダイアログ表示を待機

      // ダイアログが表示された状態をキャプチャ
      await page.screenshot({ path: "timeline-after-button-click.png" });

      // ダイアログが表示されているか確認
      const dialog = page.locator(".MuiDialog-paper");
      if (await dialog.isVisible()) {
        console.log("イベント追加ダイアログが表示されました");
        await expect(page).toHaveScreenshot("timeline-add-event-dialog.png");

        // イベント情報入力
        console.log("イベント情報を入力...");

        // タイトル入力
        const eventTitleInput = page
          .locator('input[placeholder*="タイトル"], input[name*="title"]')
          .first();
        if (await eventTitleInput.isVisible()) {
          await eventTitleInput.fill("テストイベント1");

          // 日付入力
          const dateInput = page.locator('input[type="date"]').first();
          if (await dateInput.isVisible()) {
            await dateInput.fill("2023-01-01");
            console.log("日付入力完了");
          }

          // 場所選択（セレクトボックスの場合）
          try {
            console.log("関連地名を選択しています...");

            // ドロップダウンを開く - 様々な方法を試す
            // 1. MUIのセレクト要素
            const placeDropdown = page
              .locator('div[role="button"]')
              .filter({ hasText: "関連地名" })
              .first();
            if (await placeDropdown.isVisible()) {
              console.log("MUIセレクト形式の関連地名フィールドを発見");
              await placeDropdown.click();
              await page.waitForTimeout(800); // メニュー表示を待つ

              // スクリーンショットを撮って状態を確認
              await page.screenshot({ path: "place-dropdown-opened.png" });

              // ドロップダウンメニューから選択肢を選ぶ
              // 様々なセレクタでメニュー項目を探す
              const placeMenuItems = [
                page.locator('[role="option"]').first(),
                page.locator('li[role="option"]').first(),
                page.locator(".MuiMenuItem-root").first(),
                page.locator(".MuiMenu-paper li").first(),
              ];

              for (const menuItem of placeMenuItems) {
                if (await menuItem.isVisible()) {
                  await menuItem.click();
                  console.log("場所の選択肢をクリックしました");
                  await page.waitForTimeout(500);
                  break;
                }
              }
            } else {
              // 2. 通常のセレクトボックス
              console.log("通常のセレクトボックスを探しています");
              const placeSelect = page.locator("select").nth(1); // 1番目のセレクトを試す
              if (await placeSelect.isVisible()) {
                await placeSelect.selectOption({ index: 0 });
                console.log("場所を通常のセレクトボックスから選択しました");
              } else {
                // 3. ラベルでフィールドを探す
                console.log("ラベルで場所の選択フィールドを探します");
                const placeField = page
                  .locator("label", { hasText: "関連地名" })
                  .locator("..")
                  .first();
                if (await placeField.isVisible()) {
                  await placeField.click();
                  await page.waitForTimeout(500);
                  await page.keyboard.press("ArrowDown");
                  await page.keyboard.press("Enter");
                  console.log("ラベルから場所フィールドを選択しました");
                } else {
                  console.log("関連地名の選択フィールドが見つかりません");
                }
              }
            }

            // 入力状態をキャプチャ
            await page.screenshot({ path: "after-place-selection.png" });
          } catch (e) {
            console.log("関連地名選択でエラー:", e);
          }

          // キャラクター選択（複数の可能性に対応）
          try {
            console.log("関連キャラクターを選択しています...");

            // フォーム内で最初に見つかる全てのセレクトコンポーネントをクリックして試す
            const selectComponents = [
              page
                .locator('div[role="button"]')
                .filter({ hasText: "関連キャラクター" })
                .first(),
              page
                .locator("label", { hasText: "関連キャラクター" })
                .locator("..")
                .first(),
              page
                .locator("div")
                .filter({ hasText: "関連キャラクター" })
                .first(),
              page.locator(".MuiAutocomplete-root").first(),
            ];

            let characterSelected = false;

            for (const component of selectComponents) {
              if (await component.isVisible()) {
                console.log("キャラクター選択コンポーネントを発見しました");
                await component.click();
                await page.waitForTimeout(800);

                // ドロップダウンが開いたらスクリーンショット
                await page.screenshot({
                  path: "character-dropdown-opened.png",
                });

                // 選択肢を選ぶ
                const menuVisible = await page
                  .locator('[role="listbox"], [role="menu"]')
                  .isVisible();
                if (menuVisible) {
                  // 選択肢をクリック
                  const option = page
                    .locator('[role="option"], li.MuiMenuItem-root')
                    .first();
                  if (await option.isVisible()) {
                    await option.click();
                    characterSelected = true;
                    console.log("キャラクター選択肢をクリックしました");
                    break;
                  } else {
                    // 選択肢が見つからない場合はキーボード操作
                    await page.keyboard.press("ArrowDown");
                    await page.keyboard.press("Enter");
                    characterSelected = true;
                    console.log("キーボードでキャラクターを選択しました");
                    break;
                  }
                } else {
                  console.log(
                    "キャラクターのドロップダウンメニューが表示されませんでした"
                  );
                }
              }
            }

            if (!characterSelected) {
              console.log(
                "キャラクター選択コンポーネントが見つかりませんでした"
              );
            }

            // 入力状態をキャプチャ
            await page.screenshot({ path: "after-character-selection.png" });
          } catch (e) {
            console.log("関連キャラクター選択でエラー:", e);
          }

          // 説明入力
          const eventDescTextarea = page.locator("textarea").first();
          if (await eventDescTextarea.isVisible()) {
            await eventDescTextarea.fill(
              "これはテスト用のイベントです。タイムラインに表示されます。"
            );
            console.log("説明入力完了");
          }

          // 入力後の状態をキャプチャ
          await page.screenshot({ path: "timeline-form-filled.png" });
          await expect(page).toHaveScreenshot("timeline-event-form-filled.png");

          // 保存ボタンをクリック
          console.log("保存ボタンを探しています...");
          const saveButtons = [
            page.getByRole("button", { name: /保存|登録|追加/ }),
            page.locator(".MuiDialogActions-root button").last(),
            page.locator("button.MuiButton-contained").last(),
            page.locator("button:has-text('保存')"),
            page.locator("button:has-text('登録')"),
            page.locator("button:has-text('追加')"),
          ];

          let saved = false;
          for (let i = 0; i < saveButtons.length; i++) {
            const btn = saveButtons[i];
            if ((await btn.isVisible()) && (await btn.isEnabled())) {
              console.log(`保存ボタン発見（方法${i + 1}）。クリックします...`);
              await btn.click({ force: true });
              await page.waitForTimeout(3000); // 十分な待機時間
              saved = true;
              break;
            }
          }

          if (!saved) {
            console.log("保存ボタンが見つからないか、使用できない状態です");
            await page.screenshot({ path: "no-save-button.png" });
          } else {
            console.log("保存ボタンをクリックしました。処理完了を待機中...");
          }
        } else {
          console.log("イベントタイトル入力フィールドが見つかりません");
          await page.screenshot({ path: "no-title-field.png" });
        }
      } else {
        console.log("イベント追加ダイアログが表示されませんでした");
        await page.screenshot({ path: "no-dialog.png" });
      }

      // イベント追加後の状態確認
      await page.waitForLoadState("networkidle");
      console.log("ページの状態をチェック中...");

      // イベントリストのテキストをチェック
      const emptyMessage = page.locator("text=イベントはまだありません");
      if (await emptyMessage.isVisible()) {
        console.log("警告: イベントが追加されていないようです");
      } else {
        console.log("成功: イベントが追加されたようです");
      }

      // イベント追加後の状態をキャプチャ
      await page.screenshot({ path: "timeline-after-save.png" });
      await expect(page).toHaveScreenshot("timeline-with-event.png");

      // タイムラインチャートを表示
      await page.evaluate(() => {
        window.scrollTo(0, document.body.scrollHeight / 2);
      });
      await page.waitForTimeout(1000);

      // チャート部分をキャプチャ
      await page.screenshot({ path: "timeline-chart-section.png" });
      await expect(page).toHaveScreenshot("timeline-with-event-chart.png");
    } else {
      console.log(
        "イベント追加ボタンが見つかりません。ページ内容をキャプチャします。"
      );
      await page.screenshot({ path: "timeline-no-add-button.png" });
      await expect(page).toHaveScreenshot("timeline-no-add-button.png");
    }
  });
});
