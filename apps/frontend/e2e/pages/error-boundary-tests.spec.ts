import { test, expect } from '@playwright/test';

test.describe('Error Boundary Tests', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
  });

  test.describe('Component Error Boundaries', () => {
    test('should catch JavaScript errors in character components', async ({ page }) => {
      // Inject script to cause an error in character component
      await page.addInitScript(() => {
        // Mock a React component error
        window.addEventListener('error', (event) => {
          if (event.message.includes('CharacterForm')) {
            console.log('Character component error caught:', event.message);
          }
        });
      });

      await page.click('[data-testid="new-campaign-button"]');
      await page.fill('[data-testid="campaign-name-input"]', 'Test Campaign');
      await page.click('[data-testid="create-campaign-button"]');
      
      await page.click('[data-testid="characters-tab"]');
      
      // Simulate component error by injecting faulty code
      await page.evaluate(() => {
        // Force a React error in character component
        const event = new CustomEvent('trpg-component-error', {
          detail: { component: 'CharacterForm', error: 'Simulated render error' }
        });
        window.dispatchEvent(event);
      });

      // Should show error boundary fallback
      await expect(page.locator('[data-testid="error-boundary-fallback"]')).toBeVisible();
      await expect(page.locator('text=キャラクターでエラーが発生しました')).toBeVisible();
      
      // Should have error recovery options
      await expect(page.locator('button:has-text("再試行")')).toBeVisible();
      await expect(page.locator('button:has-text("ホームに戻る")')).toBeVisible();
    });

    test('should catch errors in timeline components', async ({ page }) => {
      await page.click('[data-testid="new-campaign-button"]');
      await page.fill('[data-testid="campaign-name-input"]', 'Test Campaign');
      await page.click('[data-testid="create-campaign-button"]');
      
      await page.click('[data-testid="timeline-tab"]');
      
      // Simulate timeline component error
      await page.evaluate(() => {
        const event = new CustomEvent('trpg-component-error', {
          detail: { component: 'Timeline', error: 'Timeline render error' }
        });
        window.dispatchEvent(event);
      });

      await expect(page.locator('text=TRPGタイムラインでエラーが発生しました')).toBeVisible();
      await expect(page.locator('text=タイムラインデータを再読み込みする')).toBeVisible();
    });

    test('should catch errors in dice rolling components', async ({ page }) => {
      await page.click('[data-testid="dice-roller-button"]');
      
      // Simulate dice component error
      await page.evaluate(() => {
        // Force an error in dice component
        throw new Error('Dice component error');
      });

      // Should be caught by dice error boundary
      await expect(page.locator('text=ダイスロールエラー')).toBeVisible();
      await expect(page.locator('text=ダイス設定を確認する')).toBeVisible();
    });

    test('should catch errors in world building components', async ({ page }) => {
      await page.click('[data-testid="new-campaign-button"]');
      await page.fill('[data-testid="campaign-name-input"]', 'Test Campaign');
      await page.click('[data-testid="create-campaign-button"]');
      
      await page.click('[data-testid="worldbuilding-tab"]');
      
      // Simulate world building error
      await page.evaluate(() => {
        const event = new CustomEvent('trpg-component-error', {
          detail: { component: 'WorldBuilding', error: 'World data corruption' }
        });
        window.dispatchEvent(event);
      });

      await expect(page.locator('text=世界観構築エラー')).toBeVisible();
      await expect(page.locator('text=世界観データを再読み込みする')).toBeVisible();
    });

    test('should catch errors in AI components', async ({ page }) => {
      await page.click('[data-testid="ai-assist-button"]');
      
      // Simulate AI component error
      await page.evaluate(() => {
        const event = new CustomEvent('trpg-component-error', {
          detail: { component: 'AI', error: 'AI service connection error' }
        });
        window.dispatchEvent(event);
      });

      await expect(page.locator('text=AIアシスタントエラー')).toBeVisible();
      await expect(page.locator('text=AIサービスの接続を確認する')).toBeVisible();
    });
  });

  test.describe('Error Boundary Recovery', () => {
    test('should reset component state on retry', async ({ page }) => {
      await page.click('[data-testid="new-campaign-button"]');
      await page.fill('[data-testid="campaign-name-input"]', 'Test Campaign');
      await page.click('[data-testid="create-campaign-button"]');
      
      await page.click('[data-testid="characters-tab"]');
      
      // Cause an error
      await page.evaluate(() => {
        const event = new CustomEvent('trpg-component-error', {
          detail: { component: 'CharacterForm', error: 'Test error' }
        });
        window.dispatchEvent(event);
      });

      await expect(page.locator('[data-testid="error-boundary-fallback"]')).toBeVisible();
      
      // Click retry
      await page.click('button:has-text("再試行")');
      
      // Should return to normal component state
      await expect(page.locator('[data-testid="error-boundary-fallback"]')).not.toBeVisible();
      await expect(page.locator('[data-testid="characters-content"]')).toBeVisible();
    });

    test('should navigate home from error boundary', async ({ page }) => {
      await page.goto('/campaigns/test-campaign/characters');
      
      // Simulate error
      await page.evaluate(() => {
        throw new Error('Navigation test error');
      });

      // Should show error boundary
      await expect(page.locator('button:has-text("ホームに戻る")')).toBeVisible();
      
      // Click home button
      await page.click('button:has-text("ホームに戻る")');
      
      // Should navigate to home
      await expect(page).toHaveURL('/');
    });

    test('should log errors in development mode', async ({ page }) => {
      // Enable development mode
      await page.addInitScript(() => {
        window.ENV = { NODE_ENV: 'development' };
      });

      let consoleMessages: string[] = [];
      page.on('console', msg => {
        if (msg.type() === 'error') {
          consoleMessages.push(msg.text());
        }
      });

      await page.click('[data-testid="new-campaign-button"]');
      await page.fill('[data-testid="campaign-name-input"]', 'Test Campaign');
      await page.click('[data-testid="create-campaign-button"]');
      
      // Cause an error
      await page.evaluate(() => {
        throw new Error('Development mode error test');
      });

      // Should log error details in development
      await page.waitForTimeout(1000);
      expect(consoleMessages.some(msg => msg.includes('Development mode error test'))).toBe(true);
    });
  });

  test.describe('Async Error Boundaries', () => {
    test('should catch async errors from API calls', async ({ page }) => {
      // Mock API to return error after delay
      await page.route('**/api/campaigns', async (route) => {
        await new Promise(resolve => setTimeout(resolve, 500));
        route.fulfill({
          status: 500,
          contentType: 'application/json',
          body: JSON.stringify({
            success: false,
            error: { message: 'Async error test' }
          })
        });
      });

      await page.click('[data-testid="new-campaign-button"]');
      await page.fill('[data-testid="campaign-name-input"]', 'Test Campaign');
      await page.click('[data-testid="create-campaign-button"]');
      
      // Should catch async error
      await expect(page.locator('text=Async error test')).toBeVisible();
    });

    test('should handle promise rejections', async ({ page }) => {
      // Add promise rejection handler
      await page.addInitScript(() => {
        window.addEventListener('unhandledrejection', (event) => {
          console.error('Unhandled promise rejection:', event.reason);
          event.preventDefault();
        });
      });

      await page.evaluate(() => {
        // Create unhandled promise rejection
        Promise.reject(new Error('Unhandled promise rejection test'));
      });

      // Should handle gracefully without crashing
      await page.waitForTimeout(1000);
      await expect(page.locator('body')).toBeVisible();
    });
  });

  test.describe('Error Boundary Context', () => {
    test('should provide error context for different sections', async ({ page }) => {
      // Test campaign context
      await page.goto('/campaigns/test-id');
      
      await page.evaluate(() => {
        throw new Error('Campaign context error');
      });

      await expect(page.locator('text=キャンペーンでエラーが発生しました')).toBeVisible();
      
      // Test character context
      await page.goto('/campaigns/test-id/characters');
      
      await page.evaluate(() => {
        throw new Error('Character context error');
      });

      await expect(page.locator('text=キャラクターでエラーが発生しました')).toBeVisible();
    });

    test('should show different error messages for different components', async ({ page }) => {
      const errorTests = [
        { component: 'campaign', message: 'キャンペーン' },
        { component: 'character', message: 'キャラクター' },
        { component: 'timeline', message: 'タイムライン' },
        { component: 'worldbuilding', message: '世界観構築' },
        { component: 'session', message: 'セッション' },
        { component: 'dice', message: 'ダイスロール' },
        { component: 'ai', message: 'AIアシスタント' }
      ];

      for (const { component, message } of errorTests) {
        await page.evaluate((comp) => {
          const event = new CustomEvent('trpg-component-error', {
            detail: { component: comp, error: `${comp} error test` }
          });
          window.dispatchEvent(event);
        }, component);

        await expect(page.locator(`text=${message}エラー`)).toBeVisible();
        
        // Dismiss error for next test
        const dismissButton = page.locator('button:has-text("閉じる")');
        if (await dismissButton.isVisible()) {
          await dismissButton.click();
        }
      }
    });
  });

  test.describe('Error Boundary Performance', () => {
    test('should not affect performance after error recovery', async ({ page }) => {
      await page.click('[data-testid="new-campaign-button"]');
      await page.fill('[data-testid="campaign-name-input"]', 'Performance Test Campaign');
      await page.click('[data-testid="create-campaign-button"]');
      
      // Measure initial performance
      const startTime = Date.now();
      await page.click('[data-testid="characters-tab"]');
      const initialLoadTime = Date.now() - startTime;
      
      // Cause and recover from error
      await page.evaluate(() => {
        throw new Error('Performance test error');
      });
      
      await page.click('button:has-text("再試行")');
      
      // Measure performance after error recovery
      const recoveryStartTime = Date.now();
      await page.click('[data-testid="timeline-tab"]');
      await page.click('[data-testid="characters-tab"]');
      const recoveryLoadTime = Date.now() - recoveryStartTime;
      
      // Performance should not be significantly degraded
      expect(recoveryLoadTime).toBeLessThan(initialLoadTime * 2);
    });

    test('should clean up resources after error', async ({ page }) => {
      // Monitor memory usage (simplified)
      const memoryBefore = await page.evaluate(() => {
        return (performance as any).memory?.usedJSHeapSize || 0;
      });

      // Create and destroy components with errors
      for (let i = 0; i < 5; i++) {
        await page.evaluate((index) => {
          throw new Error(`Memory test error ${index}`);
        }, i);
        
        await page.click('button:has-text("再試行")');
        await page.waitForTimeout(100);
      }

      const memoryAfter = await page.evaluate(() => {
        return (performance as any).memory?.usedJSHeapSize || 0;
      });

      // Memory usage should not grow excessively
      if (memoryBefore > 0 && memoryAfter > 0) {
        const memoryGrowth = memoryAfter - memoryBefore;
        expect(memoryGrowth).toBeLessThan(10 * 1024 * 1024); // Less than 10MB growth
      }
    });
  });
});