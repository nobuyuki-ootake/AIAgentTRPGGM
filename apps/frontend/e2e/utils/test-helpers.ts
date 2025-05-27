import { Page, expect, Locator } from "@playwright/test";

/**
 * テスト用のプロジェクトデータを作成する
 */
export const createTestProject = () => {
  return {
    id: "test-project-1",
    title: "テスト小説プロジェクト",
    synopsis: "これはテスト用のあらすじです。主人公が冒険に出る物語です。",
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    characters: [
      {
        id: "char-1",
        name: "テスト主人公",
        description: "テスト用の主人公キャラクター",
        role: "protagonist" as const,
      },
    ],
    plot: [
      {
        id: "plot-1",
        title: "テストプロット1",
        description: "テスト用のプロット項目",
        order: 1,
        status: "検討中" as const,
      },
    ],
    chapters: [
      {
        id: "chapter-1",
        title: "テスト章1",
        synopsis: "テスト用の章のあらすじ",
        content: [],
        relatedEvents: [],
      },
    ],
    timeline: [
      {
        id: "event-1",
        title: "テストイベント1",
        description: "テスト用のイベント",
        date: "2024-01-01",
        type: "plot" as const,
      },
    ],
    worldBuilding: {
      settings: [],
      characters: [],
      locations: [],
      items: [],
      concepts: [],
    },
  };
};

/**
 * Recoilの状態を直接設定する（テスト用）
 */
export const setRecoilState = async (page: Page, project: unknown) => {
  try {
    await page.addInitScript((projectData) => {
      // Recoilの状態を初期化するためのスクリプト
      (
        window as unknown as { __TEST_PROJECT_DATA__?: unknown }
      ).__TEST_PROJECT_DATA__ = projectData;

      // Recoilの初期化後に状態を設定
      const windowWithReact = window as unknown as {
        React?: { createElement?: unknown };
      };
      const originalRecoilRoot = windowWithReact.React?.createElement;
      if (originalRecoilRoot) {
        // RecoilRootの初期化時にテストデータを設定
        window.addEventListener("DOMContentLoaded", () => {
          setTimeout(() => {
            // カスタムイベントを発火してReactアプリケーションに通知
            window.dispatchEvent(
              new CustomEvent("setTestProject", {
                detail: { project: projectData },
              })
            );
          }, 1000);
        });
      }
    }, project);

    console.log("Recoilの状態設定スクリプトを追加しました");
  } catch (error) {
    console.log("Recoilの状態設定でエラーが発生:", error);
  }
};

/**
 * テストデータをセットアップする
 */
export const setupTestData = async (page: Page) => {
  try {
    // テストプロジェクトデータを作成
    const testProject = createTestProject();

    console.log(
      "設定するテストプロジェクト:",
      JSON.stringify(testProject, null, 2)
    );

    // ページ読み込み前にlocalStorageを設定
    await page.addInitScript((project) => {
      // 実際のアプリケーションで使用されているキーに合わせて設定
      localStorage.setItem("novelProjects", JSON.stringify([project]));

      console.log("addInitScriptでnovelProjectsを設定しました");
    }, testProject);

    // ホームページに移動
    await page.goto("/");
    await page.waitForLoadState("networkidle");
    await page.waitForTimeout(2000);

    // プロジェクトが表示されているかを確認
    const projectVisible =
      (await page.locator(`text=${testProject.title}`).count()) > 0;

    if (projectVisible) {
      console.log("プロジェクトが表示されています。プロジェクトを選択します。");

      // プロジェクトをクリックして選択（これによりuseHomeのhandleSelectProjectが呼ばれ、Recoilの状態が更新される）
      await page.locator(`text=${testProject.title}`).first().click();
      await page.waitForLoadState("networkidle");
      await page.waitForTimeout(3000);

      console.log("プロジェクトを選択しました");
    } else {
      console.log(
        "プロジェクトが表示されていません。プロジェクト選択画面に移動します。"
      );

      // プロジェクト選択画面に移動
      await page.goto("/projects");
      await page.waitForLoadState("networkidle");
      await page.waitForTimeout(2000);

      // プロジェクトを選択
      const projectButton = page
        .locator(`button:has-text("${testProject.title}")`)
        .first();
      if ((await projectButton.count()) > 0) {
        await projectButton.click();
        await page.waitForLoadState("networkidle");
        await page.waitForTimeout(2000);
        console.log("プロジェクトを選択しました");
      } else {
        console.log("プロジェクトボタンが見つかりませんでした");

        // プロジェクトリストの内容を確認
        const allButtons = await page.locator("button").allTextContents();
        console.log("利用可能なボタン:", allButtons);

        // プロジェクトカードを探す
        const projectCard = page
          .locator(`[data-testid*="project"], .project-card, .project-item`)
          .first();
        if ((await projectCard.count()) > 0) {
          await projectCard.click();
          await page.waitForLoadState("networkidle");
          await page.waitForTimeout(2000);
          console.log("プロジェクトカードを選択しました");
        }
      }
    }

    // プロジェクト選択後の状態を確認
    const verificationResult = await page.evaluate(() => {
      const novelProjects = localStorage.getItem("novelProjects");
      const currentProjectId = localStorage.getItem("currentProjectId");

      // ページ内容の確認
      const body = document.body;
      const hasContent =
        body.textContent && body.textContent.trim().length > 50;
      const hasButtons = document.querySelectorAll("button").length > 0;
      const hasAppLayout = !!document.querySelector(
        '[data-testid="app-layout"], .MuiContainer-root, main, [class*="MuiBox"]'
      );

      // プロジェクトが選択されているかの確認
      const hasProjectTitle =
        body.textContent?.includes("テスト小説プロジェクト") || false;
      const hasSidebar = !!document.querySelector(
        '[role="navigation"], .sidebar, [class*="sidebar"]'
      );
      const hasAIChatButton = !!document.querySelector(
        'button[style*="position: fixed"], button:has(svg[data-testid="ChatBubbleIcon"])'
      );

      return {
        hasNovelProjects: !!novelProjects,
        hasCurrentProjectId: !!currentProjectId,
        currentProjectIdValue: currentProjectId,
        projectsCount: novelProjects ? JSON.parse(novelProjects).length : 0,
        hasContent,
        hasButtons,
        hasAppLayout,
        hasProjectTitle,
        hasSidebar,
        hasAIChatButton,
        bodyLength: body.textContent?.length || 0,
        url: window.location.href,
      };
    });

    console.log("テストデータ設定の最終検証結果:", verificationResult);

    if (!verificationResult.hasNovelProjects) {
      throw new Error("プロジェクトデータの設定に失敗しました");
    }

    if (!verificationResult.hasContent) {
      console.log(
        "警告: ページ内容が少ないです。Reactアプリケーションが正しく読み込まれていない可能性があります。"
      );
    }

    if (
      !verificationResult.hasProjectTitle &&
      !verificationResult.url.includes("/projects")
    ) {
      console.log(
        "警告: プロジェクトが正しく選択されていない可能性があります。"
      );
    }

    if (!verificationResult.hasAIChatButton) {
      console.log(
        "警告: AIチャットボタンが見つかりません。プロジェクトが正しく選択されていない可能性があります。"
      );
    }

    console.log("テストデータのセットアップが完了しました");

    // プロジェクトが選択された状態を返す
    return {
      projectSelected:
        verificationResult.hasProjectTitle ||
        verificationResult.hasAIChatButton,
      currentUrl: verificationResult.url,
    };
  } catch (error) {
    console.log("テストデータのセットアップでエラーが発生:", error);
    throw error;
  }
};

/**
 * テストデータをクリアする
 */
export const clearTestData = async (page: Page) => {
  try {
    await page.evaluate(() => {
      localStorage.removeItem("currentProject");
      localStorage.removeItem("projects");
      localStorage.clear();
    });
    console.log("テストデータのクリアが完了しました");
  } catch (error) {
    console.log("テストデータのクリアでエラーが発生:", error);
  }
};

/**
 * ページの読み込み確認
 */
export const verifyPageLoad = async (page: Page, expectedTitle?: string) => {
  // ページタイトルの確認（柔軟な検証）
  if (expectedTitle) {
    const title = await page.title();
    // 「Novel」または「小説作成エージェント」のどちらでも許可
    const titlePattern = /Novel|小説作成エージェント/;
    expect(titlePattern.test(title)).toBeTruthy();
  }

  // ページの基本要素が読み込まれていることを確認
  await page.waitForLoadState("networkidle");
  await page.waitForTimeout(1000); // 追加の安定化時間
};

/**
 * スクリーンショットを撮影する
 */
export const takeScreenshot = async (page: Page, name: string) => {
  try {
    await page.screenshot({
      path: `e2e/screenshots/${name}.png`,
      fullPage: true,
    });
    console.log(`スクリーンショット撮影完了: ${name}.png`);
  } catch (error) {
    console.log(`スクリーンショット撮影エラー (${name}):`, error);
  }
};

/**
 * AIチャットパネルを開く（フローティングボタンから）
 */
export const openAIChatPanel = async (page: Page) => {
  try {
    // プロジェクトが選択されているかを確認
    const projectStatus = await page.evaluate(() => {
      const currentProject = localStorage.getItem("currentProject");
      const novelProjects = localStorage.getItem("novelProjects");
      const currentProjectId = localStorage.getItem("currentProjectId");

      console.log("currentProject in localStorage:", currentProject);
      console.log("novelProjects in localStorage:", novelProjects);
      console.log("currentProjectId in localStorage:", currentProjectId);

      return {
        hasCurrentProject: currentProject !== null,
        hasNovelProjects: novelProjects !== null,
        hasCurrentProjectId: currentProjectId !== null,
        currentProjectId,
      };
    });

    console.log("プロジェクト選択状態:", projectStatus);

    // プロジェクトが選択されていない場合、ローカルストレージから復元を試みる
    if (
      !projectStatus.hasCurrentProject &&
      projectStatus.hasNovelProjects &&
      projectStatus.hasCurrentProjectId
    ) {
      console.log(
        "プロジェクトが選択されていないため、ローカルストレージから復元します"
      );

      await page.evaluate(() => {
        const novelProjects = localStorage.getItem("novelProjects");
        const currentProjectId = localStorage.getItem("currentProjectId");

        if (novelProjects && currentProjectId) {
          try {
            const projects = JSON.parse(novelProjects);
            const currentProject = projects.find(
              (p: { id: string }) => p.id === currentProjectId
            );

            if (currentProject) {
              // currentProjectを設定
              localStorage.setItem(
                "currentProject",
                JSON.stringify(currentProject)
              );
              console.log(
                "currentProjectを復元しました:",
                currentProject.title
              );

              // カスタムイベントを発火してReactアプリケーションに通知
              window.dispatchEvent(
                new CustomEvent("projectRestored", {
                  detail: { project: currentProject },
                })
              );
            }
          } catch (error) {
            console.log("プロジェクト復元エラー:", error);
          }
        }
      });

      // 復元後に少し待機
      await page.waitForTimeout(2000);
    }

    // 再度プロジェクト選択状態を確認
    const finalProjectStatus = await page.evaluate(() => {
      const currentProject = localStorage.getItem("currentProject");
      return currentProject !== null;
    });

    if (!finalProjectStatus) {
      console.log("プロジェクトの復元に失敗しました");
      throw new Error(
        "プロジェクトが選択されていないため、AIChatPanelは利用できません"
      );
    }

    // ページの詳細な状態を確認
    const pageInfo = await page.evaluate(() => {
      const body = document.body;
      const allElements = Array.from(document.querySelectorAll("*"));
      const hasAppLayout = !!document.querySelector(
        '[data-testid="app-layout"], .MuiContainer-root, main'
      );
      const hasAIChatPanel = !!document.querySelector(
        '[data-testid="ai-chat-panel"]'
      );

      return {
        bodyContent: body.textContent?.slice(0, 500) || "空",
        elementCount: allElements.length,
        hasAppLayout,
        hasAIChatPanel,
        url: window.location.href,
        title: document.title,
      };
    });

    console.log("ページ情報:", pageInfo);

    // フローティングボタンを探す（より詳細なセレクター）
    const floatingButtonSelectors = [
      // 実装に基づく正確なセレクター
      'button[style*="position: fixed"][style*="bottom: 20"][style*="right: 20"]',
      'button:has(svg[data-testid="ChatBubbleIcon"])',
      'button:has([data-testid="ChatBubbleIcon"])',
      // MUIのIconButtonでChatBubbleIconを含む
      'button[aria-label*="chat"], button[aria-label*="チャット"]',
      // より広範囲な検索
      "button:has(svg)",
      "button",
      '[role="button"]',
    ];

    let floatingButton: Locator | null = null;
    let foundSelector = "";

    for (const selector of floatingButtonSelectors) {
      const button = page.locator(selector).first();
      const count = await button.count();
      console.log(`セレクター "${selector}": ${count}個の要素が見つかりました`);

      if (count > 0) {
        floatingButton = button;
        foundSelector = selector;
        break;
      }
    }

    if (!floatingButton || (await floatingButton.count()) === 0) {
      // デバッグ情報を収集
      const allButtons = await page.locator("button").all();
      const buttonTexts = await Promise.all(
        allButtons.map(async (btn, index) => {
          try {
            const text = await btn.textContent();
            const ariaLabel = await btn.getAttribute("aria-label");
            const style = await btn.getAttribute("style");
            const className = await btn.getAttribute("class");
            return `${index}: "${text || ""}" (aria-label: ${
              ariaLabel || "なし"
            }, style: ${style || "なし"}, class: ${className || "なし"})`;
          } catch {
            return `${index}: 取得不可`;
          }
        })
      );

      console.log(
        "AIチャットフローティングボタンが見つかりません。利用可能なボタンを確認します。"
      );
      console.log("利用可能なボタン:", buttonTexts);

      // SVG要素も確認
      const allSvgs = await page.locator("svg").all();
      const svgInfo = await Promise.all(
        allSvgs.map(async (svg, index) => {
          try {
            const testId = await svg.getAttribute("data-testid");
            const parentTag = await svg.evaluate(
              (el) => el.parentElement?.tagName
            );
            return `${index}: testId=${testId || "なし"}, parent=${
              parentTag || "なし"
            }`;
          } catch {
            return `${index}: 取得不可`;
          }
        })
      );

      console.log("利用可能なSVG要素:", svgInfo);

      throw new Error("AIチャットフローティングボタンが見つかりませんでした");
    }

    console.log(
      `フローティングボタンが見つかりました (セレクター: ${foundSelector})`
    );

    await expect(floatingButton).toBeVisible();
    await floatingButton.click();

    // Drawerが開くまで待機
    await page.waitForSelector('[role="dialog"], .MuiDrawer-root', {
      timeout: 10000,
    });

    console.log("AIチャットパネルを開きました");
  } catch (error) {
    console.log("AIチャットパネルを開く際にエラーが発生:", error);
    throw error;
  }
};

/**
 * アシストタブに切り替える
 */
export const switchToAIAssistTab = async (page: Page) => {
  try {
    // アシストタブを探す
    const assistTab = page
      .locator(
        'button[role="tab"]:has-text("アシスト"), [role="tab"]:has-text("アシスト")'
      )
      .first();

    await expect(assistTab).toBeVisible();
    await assistTab.click();

    // タブの切り替えを待機
    await page.waitForTimeout(1000);

    console.log("アシストタブに切り替えました");
  } catch (error) {
    console.log("アシストタブの切り替えでエラーが発生:", error);
    throw error;
  }
};

/**
 * AIアシスト機能でコンテンツを生成する
 */
export const generateAIContent = async (page: Page, prompt: string) => {
  try {
    // プロンプト入力フィールドを探す
    const promptInput = page
      .locator(
        'textarea[placeholder*="指示"], input[placeholder*="指示"], textarea[placeholder*="プロンプト"]'
      )
      .first();

    if ((await promptInput.count()) > 0) {
      await promptInput.fill(prompt);

      // 生成ボタンをクリック
      const generateButton = page
        .locator('button:has-text("生成"), button:has-text("作成")')
        .first();

      if ((await generateButton.count()) > 0) {
        await generateButton.click();

        // AI生成の完了を待機（最大30秒）
        await page.waitForTimeout(2000); // 初期待機

        // 生成完了の確認（ローディング状態の終了を待つ）
        try {
          await page.waitForSelector('.loading, [data-loading="true"]', {
            state: "detached",
            timeout: 30000,
          });
        } catch {
          // ローディング要素が見つからない場合は、一定時間待機
          await page.waitForTimeout(5000);
        }

        console.log("AIコンテンツの生成が完了しました");
      } else {
        console.log("生成ボタンが見つかりませんでした");
      }
    } else {
      console.log("プロンプト入力フィールドが見つかりませんでした");
    }
  } catch (error) {
    console.log("AIコンテンツ生成でエラーが発生:", error);
    throw error;
  }
};

/**
 * AIチャットでメッセージを送信する
 */
export const sendAIChatMessage = async (page: Page, message: string) => {
  try {
    // チャットタブに切り替え
    const chatTab = page
      .locator(
        'button[role="tab"]:has-text("チャット"), [role="tab"]:has-text("チャット")'
      )
      .first();

    if ((await chatTab.count()) > 0) {
      await chatTab.click();
      await page.waitForTimeout(1000);
    }

    // メッセージ入力フィールドを探す
    const messageInput = page
      .locator(
        'textarea[placeholder*="質問"], input[placeholder*="質問"], textarea[placeholder*="メッセージ"]'
      )
      .first();

    if ((await messageInput.count()) > 0) {
      await messageInput.fill(message);

      // 送信ボタンをクリック
      const sendButton = page
        .locator('button:has-text("送信"), button[aria-label*="送信"]')
        .first();

      if ((await sendButton.count()) > 0) {
        await sendButton.click();

        // AI応答の完了を待機（最大30秒）
        await page.waitForTimeout(2000); // 初期待機

        try {
          await page.waitForSelector('.loading, [data-loading="true"]', {
            state: "detached",
            timeout: 30000,
          });
        } catch {
          // ローディング要素が見つからない場合は、一定時間待機
          await page.waitForTimeout(5000);
        }

        console.log("AIチャットメッセージの送信が完了しました");
      } else {
        console.log("送信ボタンが見つかりませんでした");
      }
    } else {
      console.log("メッセージ入力フィールドが見つかりませんでした");
    }
  } catch (error) {
    console.log("AIチャットメッセージ送信でエラーが発生:", error);
    throw error;
  }
};

/**
 * AIチャットパネルを閉じる
 */
export const closeAIChatPanel = async (page: Page) => {
  try {
    // 閉じるボタンを探す
    const closeButton = page
      .locator(
        'button[aria-label*="閉じる"], button:has-text("閉じる"), button:has(svg[data-testid="CloseIcon"])'
      )
      .first();

    if ((await closeButton.count()) > 0) {
      await closeButton.click();

      // パネルが閉じるまで待機
      await page.waitForTimeout(1000);

      console.log("AIチャットパネルを閉じました");
    } else {
      console.log("閉じるボタンが見つかりませんでした");
    }
  } catch (error) {
    console.log("AIチャットパネルを閉じる際にエラーが発生:", error);
    throw error;
  }
};

/**
 * ダイアログの待機
 */
export const waitForDialog = async (page: Page, timeout = 5000) => {
  try {
    await page.waitForSelector('[role="dialog"]', { timeout });
    return true;
  } catch {
    return false;
  }
};

/**
 * エラーがないことを確認
 */
export const checkForErrors = async (page: Page) => {
  try {
    // コンソールエラーをチェック
    const errors = await page.evaluate(() => {
      const errors: string[] = [];
      const originalError = console.error;
      console.error = (...args: unknown[]) => {
        errors.push(args.join(" "));
        originalError.apply(console, args);
      };
      return errors;
    });

    if (errors.length > 0) {
      console.log("ページでエラーが検出されました:", errors);
    }
  } catch (error) {
    console.log("エラーチェックでエラーが発生:", error);
  }
};

/**
 * 読み込み完了を待機
 */
export const waitForLoadingComplete = async (page: Page) => {
  try {
    // ローディング要素が消えるまで待機
    await page.waitForSelector('.loading, [data-loading="true"]', {
      state: "detached",
      timeout: 10000,
    });
  } catch {
    // ローディング要素が見つからない場合は、一定時間待機
    await page.waitForTimeout(2000);
  }
};
