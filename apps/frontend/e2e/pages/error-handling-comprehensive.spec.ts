import { test, expect } from '@playwright/test';

test.describe('TRPG Error Handling - Comprehensive Tests', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
  });

  test.describe('Campaign Error Scenarios', () => {
    test('should handle campaign not found error', async ({ page }) => {
      // Navigate to a non-existent campaign
      await page.goto('/campaigns/non-existent-campaign-id');
      
      // Should show error boundary or error message
      await expect(page.locator('[data-testid="error-display"]')).toBeVisible();
      await expect(page.locator('text=キャンペーンが見つかりません')).toBeVisible();
      
      // Should have retry button
      const retryButton = page.locator('button:has-text("再試行")');
      await expect(retryButton).toBeVisible();
      
      // Should have home button
      const homeButton = page.locator('button:has-text("ホームに戻る")');
      await expect(homeButton).toBeVisible();
      
      // Test retry functionality
      await retryButton.click();
      await page.waitForTimeout(1000);
      
      // Test home navigation
      await homeButton.click();
      await expect(page).toHaveURL('/');
    });

    test('should handle campaign data corruption error', async ({ page }) => {
      // Mock network request to return corrupted data error
      await page.route('**/api/campaigns/*', (route) => {
        route.fulfill({
          status: 500,
          contentType: 'application/json',
          body: JSON.stringify({
            success: false,
            error: {
              code: 'CAMPAIGN_DATA_CORRUPTED',
              message: 'キャンペーンデータが破損しています',
              suggestions: [
                'バックアップから復元してください',
                'データベースの整合性をチェックしてください'
              ]
            }
          })
        });
      });

      // Create new campaign first
      await page.click('[data-testid="new-campaign-button"]');
      await page.fill('[data-testid="campaign-name-input"]', 'Test Campaign');
      await page.click('[data-testid="create-campaign-button"]');

      // Should show corruption error
      await expect(page.locator('text=キャンペーンデータが破損しています')).toBeVisible();
      
      // Should show suggestions
      await expect(page.locator('text=バックアップから復元してください')).toBeVisible();
    });

    test('should handle campaign creation validation errors', async ({ page }) => {
      await page.click('[data-testid="new-campaign-button"]');
      
      // Try to create campaign without name
      await page.click('[data-testid="create-campaign-button"]');
      
      // Should show validation error
      await expect(page.locator('text=キャンペーン名は必須です')).toBeVisible();
      
      // Try with name too long
      await page.fill('[data-testid="campaign-name-input"]', 'a'.repeat(101));
      await page.click('[data-testid="create-campaign-button"]');
      
      await expect(page.locator('text=100文字以内で入力してください')).toBeVisible();
      
      // Try with name too short
      await page.fill('[data-testid="campaign-name-input"]', 'a');
      await page.click('[data-testid="create-campaign-button"]');
      
      await expect(page.locator('text=2文字以上で入力してください')).toBeVisible();
    });
  });

  test.describe('Character Error Scenarios', () => {
    test('should handle character creation errors', async ({ page }) => {
      // Create campaign first
      await page.click('[data-testid="new-campaign-button"]');
      await page.fill('[data-testid="campaign-name-input"]', 'Test Campaign');
      await page.click('[data-testid="create-campaign-button"]');
      
      // Navigate to characters
      await page.click('[data-testid="characters-tab"]');
      await page.click('[data-testid="add-character-button"]');
      
      // Test character name validation
      await page.click('[data-testid="save-character-button"]');
      await expect(page.locator('text=キャラクター名は必須です')).toBeVisible();
      
      // Test name too long
      await page.fill('[data-testid="character-name-input"]', 'a'.repeat(51));
      await page.click('[data-testid="save-character-button"]');
      await expect(page.locator('text=50文字以内で入力してください')).toBeVisible();
      
      // Test valid name
      await page.fill('[data-testid="character-name-input"]', 'Test Character');
      
      // Test ability score validation
      await page.fill('[data-testid="ability-str-input"]', '25'); // Too high
      await page.click('[data-testid="save-character-button"]');
      await expect(page.locator('text=20以下の数値で入力してください')).toBeVisible();
      
      await page.fill('[data-testid="ability-str-input"]', '0'); // Too low
      await page.click('[data-testid="save-character-button"]');
      await expect(page.locator('text=1以上の数値で入力してください')).toBeVisible();
    });

    test('should handle character ability total validation', async ({ page }) => {
      // Create campaign and navigate to character creation
      await page.click('[data-testid="new-campaign-button"]');
      await page.fill('[data-testid="campaign-name-input"]', 'Test Campaign');
      await page.click('[data-testid="create-campaign-button"]');
      await page.click('[data-testid="characters-tab"]');
      await page.click('[data-testid="add-character-button"]');
      
      await page.fill('[data-testid="character-name-input"]', 'Test Character');
      
      // Set all abilities to maximum (20) - should trigger warning
      await page.fill('[data-testid="ability-str-input"]', '20');
      await page.fill('[data-testid="ability-dex-input"]', '20');
      await page.fill('[data-testid="ability-con-input"]', '20');
      await page.fill('[data-testid="ability-int-input"]', '20');
      await page.fill('[data-testid="ability-wis-input"]', '20');
      await page.fill('[data-testid="ability-cha-input"]', '20');
      
      await page.click('[data-testid="save-character-button"]');
      await expect(page.locator('text=能力値の合計が高すぎます')).toBeVisible();
      
      // Set all abilities to very low values
      await page.fill('[data-testid="ability-str-input"]', '3');
      await page.fill('[data-testid="ability-dex-input"]', '3');
      await page.fill('[data-testid="ability-con-input"]', '3');
      await page.fill('[data-testid="ability-int-input"]', '3');
      await page.fill('[data-testid="ability-wis-input"]', '3');
      await page.fill('[data-testid="ability-cha-input"]', '3');
      
      await page.click('[data-testid="save-character-button"]');
      await expect(page.locator('text=能力値の平均が低すぎます')).toBeVisible();
    });
  });

  test.describe('AI Service Error Scenarios', () => {
    test('should handle AI API key errors', async ({ page }) => {
      // Mock AI request to return API key error
      await page.route('**/api/ai-agent/**', (route) => {
        route.fulfill({
          status: 401,
          contentType: 'application/json',
          body: JSON.stringify({
            success: false,
            error: {
              code: 'AI_API_KEY_INVALID',
              message: 'AIサービスのAPIキーが無効です',
              suggestions: [
                'AI設定画面でAPIキーを再入力してください',
                'APIキーの権限設定を確認してください'
              ]
            }
          })
        });
      });

      // Create campaign and try to use AI
      await page.click('[data-testid="new-campaign-button"]');
      await page.fill('[data-testid="campaign-name-input"]', 'Test Campaign');
      await page.click('[data-testid="create-campaign-button"]');
      
      await page.click('[data-testid="ai-assist-button"]');
      await page.fill('[data-testid="ai-prompt-input"]', 'Generate a character');
      await page.click('[data-testid="ai-generate-button"]');
      
      // Should show API key error
      await expect(page.locator('text=APIキーが無効です')).toBeVisible();
      await expect(page.locator('text=AI設定画面でAPIキーを再入力してください')).toBeVisible();
    });

    test('should handle AI rate limit errors', async ({ page }) => {
      // Mock AI request to return rate limit error
      await page.route('**/api/ai-agent/**', (route) => {
        route.fulfill({
          status: 429,
          contentType: 'application/json',
          body: JSON.stringify({
            success: false,
            error: {
              code: 'AI_RATE_LIMIT_EXCEEDED',
              message: 'AIサービスのレート制限に達しました',
              suggestions: [
                'しばらく待ってから再試行してください'
              ]
            }
          })
        });
      });

      await page.click('[data-testid="new-campaign-button"]');
      await page.fill('[data-testid="campaign-name-input"]', 'Test Campaign');
      await page.click('[data-testid="create-campaign-button"]');
      
      await page.click('[data-testid="ai-assist-button"]');
      await page.fill('[data-testid="ai-prompt-input"]', 'Generate content');
      await page.click('[data-testid="ai-generate-button"]');
      
      // Should show rate limit error with retry functionality
      await expect(page.locator('text=レート制限に達しました')).toBeVisible();
      await expect(page.locator('button:has-text("再試行")')).toBeVisible();
    });
  });

  test.describe('Dice Rolling Error Scenarios', () => {
    test('should handle invalid dice expressions', async ({ page }) => {
      // Navigate to dice rolling interface
      await page.click('[data-testid="dice-roller-button"]');
      
      // Test empty expression
      await page.click('[data-testid="roll-dice-button"]');
      await expect(page.locator('text=ダイス記法を入力してください')).toBeVisible();
      
      // Test invalid expression
      await page.fill('[data-testid="dice-expression-input"]', 'invalid-dice');
      await page.click('[data-testid="roll-dice-button"]');
      await expect(page.locator('text=正しいダイス記法で入力してください')).toBeVisible();
      
      // Test too many dice
      await page.fill('[data-testid="dice-expression-input"]', '200d6');
      await page.click('[data-testid="roll-dice-button"]');
      await expect(page.locator('text=ダイスの数が多すぎます')).toBeVisible();
    });

    test('should handle dice rolling server errors', async ({ page }) => {
      // Mock dice API to return server error
      await page.route('**/api/dice/**', (route) => {
        route.fulfill({
          status: 500,
          contentType: 'application/json',
          body: JSON.stringify({
            success: false,
            error: {
              code: 'DICE_SERVER_ERROR',
              message: 'ダイスロールサーバーでエラーが発生しました'
            }
          })
        });
      });

      await page.click('[data-testid="dice-roller-button"]');
      await page.fill('[data-testid="dice-expression-input"]', '3d6');
      await page.click('[data-testid="roll-dice-button"]');
      
      await expect(page.locator('text=ダイスロールサーバーでエラーが発生しました')).toBeVisible();
      await expect(page.locator('button:has-text("再試行")')).toBeVisible();
    });
  });

  test.describe('Timeline Event Error Scenarios', () => {
    test('should handle timeline event validation errors', async ({ page }) => {
      // Create campaign and navigate to timeline
      await page.click('[data-testid="new-campaign-button"]');
      await page.fill('[data-testid="campaign-name-input"]', 'Test Campaign');
      await page.click('[data-testid="create-campaign-button"]');
      await page.click('[data-testid="timeline-tab"]');
      
      // Try to add event without title
      await page.click('[data-testid="add-event-button"]');
      await page.click('[data-testid="save-event-button"]');
      
      await expect(page.locator('text=イベントタイトルは必須です')).toBeVisible();
      
      // Try with invalid date
      await page.fill('[data-testid="event-title-input"]', 'Test Event');
      await page.fill('[data-testid="event-date-input"]', 'invalid-date');
      await page.click('[data-testid="save-event-button"]');
      
      await expect(page.locator('text=有効な日時を入力してください')).toBeVisible();
      
      // Try with past date
      const pastDate = new Date();
      pastDate.setDate(pastDate.getDate() - 1);
      await page.fill('[data-testid="event-date-input"]', pastDate.toISOString().split('T')[0]);
      await page.click('[data-testid="save-event-button"]');
      
      await expect(page.locator('text=過去の日時は設定できません')).toBeVisible();
    });
  });

  test.describe('Session Error Scenarios', () => {
    test('should handle session state corruption', async ({ page }) => {
      // Mock session API to return corruption error
      await page.route('**/api/sessions/**', (route) => {
        route.fulfill({
          status: 500,
          contentType: 'application/json',
          body: JSON.stringify({
            success: false,
            error: {
              code: 'SESSION_STATE_CORRUPTED',
              message: 'セッション状態が破損しています',
              suggestions: [
                'セッションを一度終了して再開してください',
                '最新の保存データから復元してください'
              ]
            }
          })
        });
      });

      // Create campaign and start session
      await page.click('[data-testid="new-campaign-button"]');
      await page.fill('[data-testid="campaign-name-input"]', 'Test Campaign');
      await page.click('[data-testid="create-campaign-button"]');
      await page.click('[data-testid="start-session-button"]');
      
      await expect(page.locator('text=セッション状態が破損しています')).toBeVisible();
      await expect(page.locator('text=セッションを一度終了して再開してください')).toBeVisible();
    });
  });

  test.describe('Network Error Scenarios', () => {
    test('should handle network connection failures', async ({ page }) => {
      // Simulate network failure
      await page.route('**/*', (route) => {
        route.abort('failed');
      });

      await page.click('[data-testid="new-campaign-button"]');
      await page.fill('[data-testid="campaign-name-input"]', 'Test Campaign');
      await page.click('[data-testid="create-campaign-button"]');
      
      // Should show network error
      await expect(page.locator('text=ネットワークエラー')).toBeVisible();
      await expect(page.locator('text=インターネット接続を確認してください')).toBeVisible();
      
      // Should have retry button
      await expect(page.locator('button:has-text("再試行")')).toBeVisible();
    });

    test('should handle timeout errors', async ({ page }) => {
      // Mock slow network response
      await page.route('**/api/**', async (route) => {
        await new Promise(resolve => setTimeout(resolve, 31000)); // Longer than timeout
        route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({ success: true })
        });
      });

      await page.click('[data-testid="new-campaign-button"]');
      await page.fill('[data-testid="campaign-name-input"]', 'Test Campaign');
      await page.click('[data-testid="create-campaign-button"]');
      
      // Should show timeout error
      await expect(page.locator('text=タイムアウト')).toBeVisible();
      await expect(page.locator('button:has-text("再試行")')).toBeVisible();
    });
  });

  test.describe('Error Recovery and User Experience', () => {
    test('should maintain user data during error recovery', async ({ page }) => {
      await page.click('[data-testid="new-campaign-button"]');
      await page.fill('[data-testid="campaign-name-input"]', 'Test Campaign');
      
      // Mock temporary server error
      let requestCount = 0;
      await page.route('**/api/campaigns', (route) => {
        requestCount++;
        if (requestCount === 1) {
          route.fulfill({
            status: 500,
            contentType: 'application/json',
            body: JSON.stringify({
              success: false,
              error: { message: 'Server temporarily unavailable' }
            })
          });
        } else {
          route.fulfill({
            status: 200,
            contentType: 'application/json',
            body: JSON.stringify({
              success: true,
              data: { id: 'test-campaign', name: 'Test Campaign' }
            })
          });
        }
      });

      await page.click('[data-testid="create-campaign-button"]');
      
      // Should show error
      await expect(page.locator('text=Server temporarily unavailable')).toBeVisible();
      
      // User data should still be in form
      await expect(page.locator('[data-testid="campaign-name-input"]')).toHaveValue('Test Campaign');
      
      // Retry should work
      await page.click('button:has-text("再試行")');
      await expect(page.locator('text=Test Campaign')).toBeVisible();
    });

    test('should show error notification center', async ({ page }) => {
      // Trigger multiple errors
      await page.route('**/api/**', (route) => {
        route.fulfill({
          status: 500,
          contentType: 'application/json',
          body: JSON.stringify({
            success: false,
            error: { message: 'Multiple errors test' }
          })
        });
      });

      // Trigger several actions that would cause errors
      await page.click('[data-testid="new-campaign-button"]');
      await page.fill('[data-testid="campaign-name-input"]', 'Test');
      await page.click('[data-testid="create-campaign-button"]');
      
      await page.click('[data-testid="dice-roller-button"]');
      await page.fill('[data-testid="dice-expression-input"]', '3d6');
      await page.click('[data-testid="roll-dice-button"]');
      
      // Should show error notification FAB
      await expect(page.locator('[data-testid="error-notification-fab"]')).toBeVisible();
      
      // Click to open error center
      await page.click('[data-testid="error-notification-fab"]');
      await expect(page.locator('[data-testid="error-history-drawer"]')).toBeVisible();
      
      // Should show multiple errors
      await expect(page.locator('text=Multiple errors test')).toHaveCount({ min: 2 });
      
      // Should be able to clear all errors
      await page.click('button:has-text("すべてのエラーをクリア")');
      await expect(page.locator('text=エラーはありません')).toBeVisible();
    });
  });
});