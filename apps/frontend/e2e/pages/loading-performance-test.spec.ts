import { test, expect, Page } from '@playwright/test';

test.describe('TRPG Loading Performance Tests', () => {
  
  test.beforeEach(async ({ page }) => {
    // Enable performance tracking
    await page.addInitScript(() => {
      (window as any).performance.mark('test-start');
    });
    
    await page.goto('/');
  });

  test.describe('Performance Benchmarks', () => {
    test('campaign loading should complete within acceptable time', async ({ page }) => {
      const startTime = Date.now();
      
      await page.route('**/api/campaigns', async route => {
        // Simulate realistic response time
        await new Promise(resolve => setTimeout(resolve, 800));
        await route.fulfill({
          status: 200,
          body: JSON.stringify([
            { id: 1, name: 'Campaign 1', description: 'Test campaign' },
            { id: 2, name: 'Campaign 2', description: 'Another campaign' }
          ])
        });
      });

      await page.goto('/campaigns');
      await expect(page.locator('[data-testid="campaign-list"]')).toBeVisible();
      
      const endTime = Date.now();
      const loadTime = endTime - startTime;
      
      // Should load within 3 seconds (including network simulation)
      expect(loadTime).toBeLessThan(3000);
      
      // Take screenshot for performance verification
      await page.screenshot({ 
        path: 'test-results/campaign-load-performance.png',
        fullPage: true 
      });
    });

    test('character sheet loading should be optimized', async ({ page }) => {
      const performanceMetrics: any[] = [];
      
      // Capture performance metrics
      await page.addInitScript(() => {
        const originalFetch = window.fetch;
        window.fetch = async (...args) => {
          const start = performance.now();
          const response = await originalFetch(...args);
          const end = performance.now();
          
          (window as any).performanceLog = (window as any).performanceLog || [];
          (window as any).performanceLog.push({
            url: args[0],
            duration: end - start,
            timestamp: Date.now()
          });
          
          return response;
        };
      });

      await page.route('**/api/characters/1', async route => {
        await new Promise(resolve => setTimeout(resolve, 600));
        await route.fulfill({
          status: 200,
          body: JSON.stringify({
            id: 1,
            name: 'Test Character',
            class: 'Fighter',
            level: 5,
            stats: { str: 16, dex: 14, con: 15, int: 10, wis: 12, cha: 8 }
          })
        });
      });

      const startTime = performance.now();
      await page.goto('/characters/1');
      await expect(page.locator('[data-testid="character-sheet"]')).toBeVisible();
      const endTime = performance.now();
      
      const metrics = await page.evaluate(() => (window as any).performanceLog || []);
      
      // Verify performance
      expect(endTime - startTime).toBeLessThan(2000);
      expect(metrics.length).toBeGreaterThan(0);
      
      // Log performance data
      console.log('Character sheet load metrics:', {
        totalTime: endTime - startTime,
        apiCalls: metrics.length,
        networkTime: metrics.reduce((sum: number, m: any) => sum + m.duration, 0)
      });
    });

    test('AI operation should provide accurate time estimates', async ({ page }) => {
      let requestStartTime: number;
      const estimatedDuration = 25000; // 25 seconds
      
      await page.route('**/api/ai-agent/generate', async route => {
        requestStartTime = Date.now();
        
        // Simulate AI processing with realistic timing
        await new Promise(resolve => setTimeout(resolve, estimatedDuration * 0.8)); // 80% of estimate
        
        await route.fulfill({
          status: 200,
          body: JSON.stringify({
            result: 'Generated character backstory...',
            actualDuration: Date.now() - requestStartTime
          })
        });
      });

      await page.goto('/ai-assistant');
      await page.fill('[data-testid="ai-prompt-input"]', 'Generate a character backstory');
      
      const operationStartTime = Date.now();
      await page.click('[data-testid="generate-button"]');
      
      // Check initial time estimate
      await expect(page.locator('text=25s remaining')).toBeVisible({ timeout: 1000 });
      
      // Verify progress updates
      await page.waitForTimeout(5000);
      const remainingTimeElement = page.locator('[data-testid="remaining-time"]');
      const remainingText = await remainingTimeElement.textContent();
      
      // Should show decreasing time
      expect(remainingText).toMatch(/1[0-9]s|[0-9]s/);
      
      // Wait for completion
      await expect(page.locator('[data-testid="ai-result"]')).toBeVisible({ timeout: 30000 });
      
      const actualDuration = Date.now() - operationStartTime;
      const estimateAccuracy = Math.abs(actualDuration - estimatedDuration) / estimatedDuration;
      
      // Estimate should be within 30% of actual time
      expect(estimateAccuracy).toBeLessThan(0.3);
    });

    test('image generation should handle large file processing efficiently', async ({ page }) => {
      const imageData = 'data:image/png;base64,' + 'a'.repeat(50000); // Large base64 image
      
      await page.route('**/api/ai-agent/generate-image', async route => {
        // Simulate image processing time
        await new Promise(resolve => setTimeout(resolve, 3000));
        
        await route.fulfill({
          status: 200,
          body: JSON.stringify({
            imageUrl: imageData,
            metadata: {
              size: imageData.length,
              processingTime: 3000
            }
          })
        });
      });

      const startTime = Date.now();
      await page.goto('/image-generator');
      await page.fill('[data-testid="image-prompt"]', 'A detailed fantasy landscape');
      await page.click('[data-testid="generate-image-button"]');
      
      // Should show progressive loading
      await expect(page.locator('[data-testid="image-generation-progress"]')).toBeVisible();
      
      // Wait for image to load and render
      await expect(page.locator('[data-testid="generated-image"]')).toBeVisible({ timeout: 8000 });
      
      const totalTime = Date.now() - startTime;
      
      // Should handle large images efficiently
      expect(totalTime).toBeLessThan(6000);
      
      // Verify image loaded correctly
      const imageElement = page.locator('[data-testid="generated-image"]');
      const imageSrc = await imageElement.getAttribute('src');
      expect(imageSrc).toContain('data:image');
    });
  });

  test.describe('Memory and Resource Usage', () => {
    test('should not cause memory leaks during repeated loading operations', async ({ page }) => {
      // Monitor performance metrics
      await page.addInitScript(() => {
        (window as any).memorySnapshots = [];
        
        setInterval(() => {
          if ((performance as any).memory) {
            (window as any).memorySnapshots.push({
              usedJSSize: (performance as any).memory.usedJSSize,
              totalJSSize: (performance as any).memory.totalJSSize,
              timestamp: Date.now()
            });
          }
        }, 1000);
      });

      // Perform multiple loading operations
      for (let i = 0; i < 5; i++) {
        await page.route(`**/api/campaigns?iteration=${i}`, async route => {
          await new Promise(resolve => setTimeout(resolve, 500));
          await route.fulfill({
            status: 200,
            body: JSON.stringify([{ id: i, name: `Campaign ${i}` }])
          });
        });

        await page.goto(`/campaigns?iteration=${i}`);
        await expect(page.locator('[data-testid="campaign-list"]')).toBeVisible();
        await page.waitForTimeout(1000);
      }

      // Check memory usage
      const memorySnapshots = await page.evaluate(() => (window as any).memorySnapshots || []);
      
      if (memorySnapshots.length > 3) {
        const firstSnapshot = memorySnapshots[0];
        const lastSnapshot = memorySnapshots[memorySnapshots.length - 1];
        
        // Memory usage shouldn't increase dramatically
        const memoryIncrease = (lastSnapshot.usedJSSize - firstSnapshot.usedJSSize) / firstSnapshot.usedJSSize;
        expect(memoryIncrease).toBeLessThan(0.5); // Less than 50% increase
      }
    });

    test('should handle concurrent loading operations efficiently', async ({ page }) => {
      const operationCount = 3;
      const operations = ['campaigns', 'characters', 'timeline'];
      
      // Set up routes for concurrent operations
      for (const operation of operations) {
        await page.route(`**/api/${operation}`, async route => {
          await new Promise(resolve => setTimeout(resolve, 1000 + Math.random() * 1000));
          await route.fulfill({
            status: 200,
            body: JSON.stringify([{ id: 1, name: `Test ${operation}` }])
          });
        });
      }

      // Start concurrent operations
      const startTime = Date.now();
      
      const promises = operations.map(async (operation, index) => {
        const context = await page.context().newPage();
        await context.goto(`/${operation}`);
        await expect(context.locator('[data-testid="loading-spinner"]')).toBeVisible();
        await expect(context.locator('[data-testid="content-loaded"]')).toBeVisible({ timeout: 5000 });
        await context.close();
      });

      await Promise.all(promises);
      
      const totalTime = Date.now() - startTime;
      
      // Concurrent operations should complete faster than sequential
      expect(totalTime).toBeLessThan(4000); // Should be faster than 3 sequential 2s operations
    });
  });

  test.describe('Network Performance', () => {
    test('should handle slow network conditions gracefully', async ({ page }) => {
      // Simulate slow network
      await page.route('**/api/**', async route => {
        await new Promise(resolve => setTimeout(resolve, 3000)); // 3s delay
        await route.fulfill({
          status: 200,
          body: JSON.stringify({ data: 'test' })
        });
      });

      const startTime = Date.now();
      await page.goto('/campaigns');
      
      // Should show loading state immediately
      await expect(page.locator('[data-testid="loading-spinner"]')).toBeVisible({ timeout: 500 });
      
      // Should provide user feedback about slow loading
      await expect(page.locator('text=This is taking longer than usual')).toBeVisible({ timeout: 5000 });
      
      // Should eventually complete
      await expect(page.locator('[data-testid="content-loaded"]')).toBeVisible({ timeout: 8000 });
      
      const totalTime = Date.now() - startTime;
      expect(totalTime).toBeGreaterThan(3000); // Verify delay was applied
    });

    test('should optimize loading for mobile networks', async ({ page }) => {
      // Simulate mobile network (slower)
      await page.route('**/api/**', async route => {
        // Add mobile network delay
        await new Promise(resolve => setTimeout(resolve, 1200));
        
        // Return smaller data payloads for mobile
        const url = route.request().url();
        let responseData;
        
        if (url.includes('characters')) {
          // Reduced character data for mobile
          responseData = [{
            id: 1,
            name: 'Character',
            class: 'Fighter',
            level: 5
            // Omit detailed stats for initial load
          }];
        } else {
          responseData = [{ id: 1, name: 'Test' }];
        }
        
        await route.fulfill({
          status: 200,
          body: JSON.stringify(responseData),
          headers: {
            'content-type': 'application/json',
            'cache-control': 'max-age=300' // 5 minute cache
          }
        });
      });

      // Set mobile viewport
      await page.setViewportSize({ width: 375, height: 667 });
      
      await page.goto('/characters');
      
      // Should show mobile-optimized loading
      await expect(page.locator('[data-testid="mobile-loading"]')).toBeVisible();
      
      // Should load essential content first
      await expect(page.locator('[data-testid="character-list"]')).toBeVisible({ timeout: 3000 });
      
      // Detailed data should load progressively
      await expect(page.locator('[data-testid="character-details"]')).toBeVisible({ timeout: 5000 });
    });
  });

  test.describe('User Experience During Loading', () => {
    test('should maintain interactivity during background loading', async ({ page }) => {
      // Long-running background operation
      await page.route('**/api/background-sync', async route => {
        await new Promise(resolve => setTimeout(resolve, 5000));
        await route.fulfill({ status: 200, body: '{}' });
      });

      await page.goto('/dashboard');
      
      // Start background sync
      await page.click('[data-testid="sync-button"]');
      
      // UI should remain interactive
      await expect(page.locator('[data-testid="background-loading"]')).toBeVisible();
      
      // Should be able to navigate to other pages
      await page.click('[data-testid="characters-nav"]');
      await expect(page.locator('[data-testid="characters-page"]')).toBeVisible();
      
      // Background operation should continue
      await expect(page.locator('[data-testid="sync-in-progress"]')).toBeVisible();
      
      // Should complete eventually
      await expect(page.locator('[data-testid="sync-completed"]')).toBeVisible({ timeout: 8000 });
    });

    test('should provide helpful loading messages based on operation type', async ({ page }) => {
      const operations = [
        {
          route: '**/api/ai-agent/generate-character',
          message: 'AI is creating your character',
          expectedText: 'Creating unique personality and backstory'
        },
        {
          route: '**/api/ai-agent/generate-world',
          message: 'AI is building your world',
          expectedText: 'Crafting locations, cultures, and history'
        },
        {
          route: '**/api/session/initialize',
          message: 'Preparing your adventure',
          expectedText: 'Setting up dice, characters, and game master'
        }
      ];

      for (const operation of operations) {
        await page.route(operation.route, async route => {
          await new Promise(resolve => setTimeout(resolve, 2000));
          await route.fulfill({ status: 200, body: '{"result": "success"}' });
        });

        // Trigger the operation (implementation depends on UI)
        await page.goto('/ai-assistant');
        await page.click(`[data-testid="trigger-${operation.route.split('/').pop()}"]`);
        
        // Should show contextual loading message
        await expect(page.locator(`text=${operation.expectedText}`)).toBeVisible({ timeout: 1000 });
        
        // Wait for completion
        await expect(page.locator('[data-testid="operation-complete"]')).toBeVisible({ timeout: 4000 });
      }
    });
  });

  test.describe('Loading State Edge Cases', () => {
    test('should handle rapid consecutive operations', async ({ page }) => {
      let operationCount = 0;
      
      await page.route('**/api/quick-operation', async route => {
        operationCount++;
        await new Promise(resolve => setTimeout(resolve, 300));
        await route.fulfill({
          status: 200,
          body: JSON.stringify({ operation: operationCount })
        });
      });

      await page.goto('/test-operations');
      
      // Trigger multiple rapid operations
      for (let i = 0; i < 5; i++) {
        await page.click('[data-testid="quick-operation-button"]');
        await page.waitForTimeout(50); // Very quick succession
      }
      
      // Should handle all operations
      await expect(page.locator('text=Operation 5')).toBeVisible({ timeout: 3000 });
      
      // Should not show stale loading states
      await expect(page.locator('[data-testid="loading-spinner"]')).not.toBeVisible();
    });

    test('should handle operation cancellation correctly', async ({ page }) => {
      let operationCancelled = false;
      
      await page.route('**/api/long-operation', async route => {
        if (operationCancelled) {
          await route.fulfill({ status: 200, body: '{"cancelled": true}' });
          return;
        }
        
        await new Promise(resolve => setTimeout(resolve, 10000)); // Very long operation
        await route.fulfill({ status: 200, body: '{"completed": true}' });
      });

      await page.goto('/operations');
      await page.click('[data-testid="start-long-operation"]');
      
      // Should show loading with cancel option
      await expect(page.locator('[data-testid="operation-loading"]')).toBeVisible();
      await expect(page.locator('[data-testid="cancel-button"]')).toBeVisible();
      
      // Cancel operation
      await page.click('[data-testid="cancel-button"]');
      operationCancelled = true;
      
      // Should stop loading immediately
      await expect(page.locator('[data-testid="operation-loading"]')).not.toBeVisible({ timeout: 1000 });
      await expect(page.locator('text=Operation cancelled')).toBeVisible();
    });
  });
});