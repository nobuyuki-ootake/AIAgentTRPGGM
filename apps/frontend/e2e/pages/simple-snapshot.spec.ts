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

// 開発サーバーのURL
const BASE_URL = "http://localhost:5173";

// シンプルなスナップショットテスト - 各ページの初期表示のみをテスト
test.describe("基本ページスナップショット", () => {
  for (const pageInfo of pages) {
    test(`${pageInfo.name}ページの基本スナップショット`, async ({ page }) => {
      // ページに移動
      await page.goto(`${BASE_URL}${pageInfo.path}`);

      // ページの読み込みを待機
      await page.waitForLoadState("networkidle");

      // アニメーションなどが完了するまで少し待機
      await page.waitForTimeout(1000);

      // スクリーンショットを撮影
      await expect(page).toHaveScreenshot(
        `${pageInfo.name.toLowerCase()}-basic.png`,
        {
          fullPage: true,
          timeout: 5000,
        }
      );
    });
  }
});

// 特定のコンポーネントにフォーカスしたスナップショットテスト
test.describe("コンポーネントスナップショット", () => {
  // ナビゲーションメニュー
  test("ナビゲーションメニューのスナップショット", async ({ page }) => {
    await page.goto(BASE_URL);
    await page.waitForLoadState("networkidle");

    // サイドバーメニューのセレクタを特定してスナップショットを撮影
    const navigationMenu = page.locator("nav");

    if (await navigationMenu.isVisible()) {
      await expect(navigationMenu).toHaveScreenshot("navigation-menu.png", {
        timeout: 5000,
      });
    }
  });

  // ヘッダー
  test("ヘッダーのスナップショット", async ({ page }) => {
    await page.goto(BASE_URL);
    await page.waitForLoadState("networkidle");

    const header = page.locator("header");

    if (await header.isVisible()) {
      await expect(header).toHaveScreenshot("header.png", {
        timeout: 5000,
      });
    }
  });
});

// ユーザーインタラクションを最小限に抑えたスナップショット
test.describe("シンプルなユーザーインタラクション後のスナップショット", () => {
  test("キャラクターページで追加ボタンを表示", async ({ page }) => {
    await page.goto(`${BASE_URL}/characters`);
    await page.waitForLoadState("networkidle");

    // 追加ボタンを探す（様々な表記に対応）
    const addButton = page.getByRole("button", {
      name: /キャラクター追加|追加|新規/,
    });

    if (await addButton.isVisible()) {
      // ボタンをクリック
      await addButton.click();
      await page.waitForTimeout(1000);

      // モーダルが表示された状態をキャプチャ
      await expect(page).toHaveScreenshot("characters-add-modal.png", {
        fullPage: true,
        timeout: 5000,
      });
    }
  });

  test("世界観ページで追加ボタンを表示", async ({ page }) => {
    await page.goto(`${BASE_URL}/world-building`);
    await page.waitForLoadState("networkidle");

    // 追加ボタンを探す
    const addButton = page.getByRole("button", {
      name: /場所追加|追加|新規/,
    });

    if (await addButton.isVisible()) {
      // ボタンをクリック
      await addButton.click();
      await page.waitForTimeout(1000);

      // モーダルが表示された状態をキャプチャ
      await expect(page).toHaveScreenshot("worldbuilding-add-modal.png", {
        fullPage: true,
        timeout: 5000,
      });
    }
  });
});
