import { test, expect, Page } from '@playwright/test';

test.describe('TRPG Loading States Comprehensive Testing', () => {
  
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    // Ensure we have a clean state
    await page.evaluate(() => {
      localStorage.clear();
      sessionStorage.clear();
    });
  });

  test.describe('Campaign Loading States', () => {
    test('should display campaign loading spinner when loading campaign data', async ({ page }) => {
      // Mock slow campaign loading
      await page.route('**/api/campaigns/**', async route => {
        await new Promise(resolve => setTimeout(resolve, 2000));
        await route.fulfill({
          status: 200,
          body: JSON.stringify({ id: 1, name: 'Test Campaign' })
        });
      });

      await page.click('[data-testid="create-campaign-button"]');
      
      // Should show loading spinner
      await expect(page.locator('[data-testid="campaign-loading-spinner"]')).toBeVisible();
      await expect(page.locator('text=Loading campaign data...')).toBeVisible();
      
      // Wait for loading to complete
      await expect(page.locator('[data-testid="campaign-loading-spinner"]')).not.toBeVisible({ timeout: 10000 });
    });

    test('should display skeleton loaders for campaign list', async ({ page }) => {
      // Mock delayed campaign list response
      await page.route('**/api/campaigns', async route => {
        await new Promise(resolve => setTimeout(resolve, 1500));
        await route.fulfill({
          status: 200,
          body: JSON.stringify([])
        });
      });

      await page.goto('/campaigns');
      
      // Should show skeleton loaders
      await expect(page.locator('[data-testid="campaign-list-skeleton"]')).toBeVisible();
      await expect(page.locator('.MuiSkeleton-root')).toHaveCount(3); // 3 skeleton cards
      
      // Wait for actual content
      await expect(page.locator('[data-testid="campaign-list-skeleton"]')).not.toBeVisible({ timeout: 5000 });
    });
  });

  test.describe('Character Sheet Loading States', () => {
    test('should show character sheet loading state', async ({ page }) => {
      // Mock character sheet loading
      await page.route('**/api/characters/**', async route => {
        await new Promise(resolve => setTimeout(resolve, 1800));
        await route.fulfill({
          status: 200,
          body: JSON.stringify({
            id: 1,
            name: 'Test Character',
            class: 'Fighter',
            level: 5
          })
        });
      });

      await page.goto('/characters/1');
      
      // Should show character sheet loading
      await expect(page.locator('[data-testid="character-sheet-loading"]')).toBeVisible();
      await expect(page.locator('text=Loading character sheet...')).toBeVisible();
      
      // Should show skeleton for character avatar and stats
      await expect(page.locator('[data-testid="character-avatar-skeleton"]')).toBeVisible();
      await expect(page.locator('[data-testid="ability-scores-skeleton"]')).toBeVisible();
      
      // Wait for completion
      await expect(page.locator('[data-testid="character-sheet-loading"]')).not.toBeVisible({ timeout: 5000 });
      await expect(page.locator('text=Test Character')).toBeVisible();
    });

    test('should display progress for bulk character loading', async ({ page }) => {
      const characters = Array.from({ length: 5 }, (_, i) => ({
        id: i + 1,
        name: `Character ${i + 1}`
      }));

      let loadedCount = 0;
      await page.route('**/api/characters/bulk', async route => {
        // Simulate progressive loading
        const response = characters.slice(0, ++loadedCount);
        await new Promise(resolve => setTimeout(resolve, 800));
        
        await route.fulfill({
          status: 200,
          body: JSON.stringify({
            characters: response,
            total: characters.length,
            loaded: loadedCount
          })
        });
      });

      await page.goto('/characters?bulk=true');
      
      // Should show bulk loading progress
      await expect(page.locator('[data-testid="bulk-character-loading"]')).toBeVisible();
      await expect(page.locator('[data-testid="loading-progress-bar"]')).toBeVisible();
      
      // Check progress updates
      await expect(page.locator('text=Loading 1 of 5')).toBeVisible();
      await page.waitForTimeout(1000);
      await expect(page.locator('text=Loading 2 of 5')).toBeVisible();
      
      // Wait for completion
      await expect(page.locator('[data-testid="bulk-character-loading"]')).not.toBeVisible({ timeout: 10000 });
    });
  });

  test.describe('AI Operation Loading States', () => {
    test('should display AI generation progress with time estimates', async ({ page }) => {
      // Mock AI generation with progressive updates
      let progress = 0;
      await page.route('**/api/ai-agent/generate', async route => {
        progress += 25;
        await new Promise(resolve => setTimeout(resolve, 3000));
        
        await route.fulfill({
          status: 200,
          body: JSON.stringify({
            progress,
            message: `AI processing step ${progress / 25}...`,
            estimatedRemaining: Math.max(0, 30 - (progress / 25) * 7.5)
          })
        });
      });

      await page.goto('/ai-assistant');
      await page.fill('[data-testid="ai-prompt-input"]', 'Generate a character backstory');
      await page.click('[data-testid="generate-button"]');
      
      // Should show AI operation progress
      await expect(page.locator('[data-testid="ai-operation-progress"]')).toBeVisible();
      await expect(page.locator('[data-testid="ai-progress-bar"]')).toBeVisible();
      await expect(page.locator('text=AI is generating')).toBeVisible();
      
      // Should show time estimate
      await expect(page.locator('[data-testid="estimated-time"]')).toBeVisible();
      await expect(page.locator('text=30s remaining')).toBeVisible();
      
      // Should show provider info
      await expect(page.locator('[data-testid="ai-provider-avatar"]')).toBeVisible();
      
      // Wait for completion
      await expect(page.locator('[data-testid="ai-operation-progress"]')).not.toBeVisible({ timeout: 15000 });
    });

    test('should handle AI operation timeout gracefully', async ({ page }) => {
      // Mock AI operation that times out
      await page.route('**/api/ai-agent/generate', async route => {
        // Never resolve to simulate timeout
        await new Promise(resolve => setTimeout(resolve, 60000));
      });

      await page.goto('/ai-assistant');
      await page.fill('[data-testid="ai-prompt-input"]', 'Generate content');
      await page.click('[data-testid="generate-button"]');
      
      // Should show loading initially
      await expect(page.locator('[data-testid="ai-operation-progress"]')).toBeVisible();
      
      // Should show timeout error after specified time
      await expect(page.locator('[data-testid="loading-error"]')).toBeVisible({ timeout: 35000 });
      await expect(page.locator('text=Operation timed out')).toBeVisible();
      
      // Should show retry button
      await expect(page.locator('[data-testid="retry-button"]')).toBeVisible();
    });

    test('should display different AI provider loading states', async ({ page }) => {
      const providers = ['openai', 'claude', 'gemini'];
      
      for (const provider of providers) {
        await page.route(`**/api/ai-agent/generate?provider=${provider}`, async route => {
          await new Promise(resolve => setTimeout(resolve, 2000));
          await route.fulfill({
            status: 200,
            body: JSON.stringify({ result: 'Generated content' })
          });
        });

        await page.goto(`/ai-assistant?provider=${provider}`);
        await page.fill('[data-testid="ai-prompt-input"]', 'Test prompt');
        await page.click('[data-testid="generate-button"]');
        
        // Should show provider-specific loading
        await expect(page.locator(`[data-testid="ai-provider-${provider}"]`)).toBeVisible();
        await expect(page.locator('[data-testid="ai-operation-progress"]')).toBeVisible();
        
        // Wait for completion
        await expect(page.locator('[data-testid="ai-operation-progress"]')).not.toBeVisible({ timeout: 5000 });
      }
    });
  });

  test.describe('Image Generation Loading States', () => {
    test('should display image generation progress', async ({ page }) => {
      // Mock image generation
      await page.route('**/api/ai-agent/generate-image', async route => {
        await new Promise(resolve => setTimeout(resolve, 4000));
        await route.fulfill({
          status: 200,
          body: JSON.stringify({
            imageUrl: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg=='
          })
        });
      });

      await page.goto('/image-generator');
      await page.fill('[data-testid="image-prompt"]', 'A fantasy character');
      await page.click('[data-testid="generate-image-button"]');
      
      // Should show image generation loading
      await expect(page.locator('[data-testid="image-generation-loading"]')).toBeVisible();
      await expect(page.locator('[data-testid="image-placeholder-skeleton"]')).toBeVisible();
      await expect(page.locator('text=Generating character image...')).toBeVisible();
      
      // Should show progress with longer time estimate
      await expect(page.locator('text=45s remaining')).toBeVisible();
      
      // Wait for completion
      await expect(page.locator('[data-testid="image-generation-loading"]')).not.toBeVisible({ timeout: 8000 });
      await expect(page.locator('[data-testid="generated-image"]')).toBeVisible();
    });
  });

  test.describe('Timeline Processing Loading States', () => {
    test('should show timeline event processing progress', async ({ page }) => {
      const events = Array.from({ length: 10 }, (_, i) => ({
        id: i + 1,
        title: `Event ${i + 1}`,
        date: new Date().toISOString()
      }));

      let processedEvents = 0;
      await page.route('**/api/timeline/process', async route => {
        processedEvents++;
        await new Promise(resolve => setTimeout(resolve, 500));
        
        await route.fulfill({
          status: 200,
          body: JSON.stringify({
            processed: processedEvents,
            total: events.length,
            currentEvent: events[processedEvents - 1]?.title
          })
        });
      });

      await page.goto('/timeline');
      await page.click('[data-testid="process-timeline-button"]');
      
      // Should show timeline processing
      await expect(page.locator('[data-testid="timeline-processing"]')).toBeVisible();
      await expect(page.locator('[data-testid="timeline-progress-bar"]')).toBeVisible();
      await expect(page.locator('text=Processing timeline events')).toBeVisible();
      
      // Should show current event being processed
      await expect(page.locator('text=Processing Event 1')).toBeVisible();
      
      // Wait for completion
      await expect(page.locator('[data-testid="timeline-processing"]')).not.toBeVisible({ timeout: 8000 });
    });
  });

  test.describe('Session Initialization Loading States', () => {
    test('should display session initialization with step progress', async ({ page }) => {
      const initSteps = [
        'Loading campaign data',
        'Preparing character sheets',
        'Setting up AI game master',
        'Initializing dice systems',
        'Ready to play!'
      ];

      let currentStep = 0;
      await page.route('**/api/session/initialize', async route => {
        await new Promise(resolve => setTimeout(resolve, 2000));
        currentStep++;
        
        await route.fulfill({
          status: 200,
          body: JSON.stringify({
            step: currentStep,
            totalSteps: initSteps.length,
            message: initSteps[currentStep - 1]
          })
        });
      });

      await page.goto('/session/new');
      await page.click('[data-testid="start-session-button"]');
      
      // Should show session initialization
      await expect(page.locator('[data-testid="session-initialization"]')).toBeVisible();
      await expect(page.locator('[data-testid="session-init-stepper"]')).toBeVisible();
      
      // Should show dice icon and TRPG branding
      await expect(page.locator('[data-testid="trpg-dice-icon"]')).toBeVisible();
      await expect(page.locator('text=Preparing TRPG Session')).toBeVisible();
      
      // Should progress through steps
      await expect(page.locator('text=Loading campaign data')).toBeVisible();
      await page.waitForTimeout(2500);
      await expect(page.locator('text=Preparing character sheets')).toBeVisible();
      
      // Wait for completion
      await expect(page.locator('[data-testid="session-initialization"]')).not.toBeVisible({ timeout: 15000 });
    });
  });

  test.describe('Dice Animation Loading States', () => {
    test('should show dice rolling animation', async ({ page }) => {
      // Mock dice roll
      await page.route('**/api/dice/roll', async route => {
        await new Promise(resolve => setTimeout(resolve, 1500));
        await route.fulfill({
          status: 200,
          body: JSON.stringify({
            dice: '2d6',
            results: [4, 6],
            total: 10
          })
        });
      });

      await page.goto('/session/active');
      await page.click('[data-testid="roll-dice-button"]');
      
      // Should show dice animation
      await expect(page.locator('[data-testid="dice-animation-loading"]')).toBeVisible();
      await expect(page.locator('[data-testid="rolling-dice-icon"]')).toBeVisible();
      await expect(page.locator('text=Rolling 2d6')).toBeVisible();
      await expect(page.locator('text=Dice are tumbling...')).toBeVisible();
      
      // Wait for result
      await expect(page.locator('[data-testid="dice-animation-loading"]')).not.toBeVisible({ timeout: 3000 });
      await expect(page.locator('[data-testid="dice-result"]')).toBeVisible();
    });
  });

  test.describe('Error Handling in Loading States', () => {
    test('should handle network errors gracefully', async ({ page }) => {
      // Mock network error
      await page.route('**/api/campaigns', async route => {
        await route.abort('failed');
      });

      await page.goto('/campaigns');
      
      // Should show network error
      await expect(page.locator('[data-testid="loading-error"]')).toBeVisible();
      await expect(page.locator('text=Network connection error')).toBeVisible();
      await expect(page.locator('[data-testid="retry-button"]')).toBeVisible();
      
      // Should show recovery actions
      await expect(page.locator('text=Check your internet connection')).toBeVisible();
    });

    test('should handle server errors with retry functionality', async ({ page }) => {
      let attemptCount = 0;
      
      await page.route('**/api/ai-agent/generate', async route => {
        attemptCount++;
        if (attemptCount < 3) {
          await route.fulfill({ status: 500, body: 'Internal Server Error' });
        } else {
          await route.fulfill({
            status: 200,
            body: JSON.stringify({ result: 'Success after retry' })
          });
        }
      });

      await page.goto('/ai-assistant');
      await page.fill('[data-testid="ai-prompt-input"]', 'Test prompt');
      await page.click('[data-testid="generate-button"]');
      
      // Should show server error
      await expect(page.locator('[data-testid="loading-error"]')).toBeVisible();
      await expect(page.locator('text=Server error occurred')).toBeVisible();
      
      // Click retry
      await page.click('[data-testid="retry-button"]');
      
      // Should show retrying
      await expect(page.locator('text=Attempt 2 of 3')).toBeVisible();
      
      // Eventually succeed
      await expect(page.locator('text=Success after retry')).toBeVisible({ timeout: 10000 });
    });

    test('should handle rate limiting errors', async ({ page }) => {
      // Mock rate limit error
      await page.route('**/api/ai-agent/generate', async route => {
        await route.fulfill({
          status: 429,
          body: JSON.stringify({ error: 'Rate limit exceeded' })
        });
      });

      await page.goto('/ai-assistant');
      await page.fill('[data-testid="ai-prompt-input"]', 'Test prompt');
      await page.click('[data-testid="generate-button"]');
      
      // Should show rate limit error
      await expect(page.locator('[data-testid="loading-error"]')).toBeVisible();
      await expect(page.locator('text=Too many requests')).toBeVisible();
      await expect(page.locator('text=Wait a moment before trying again')).toBeVisible();
    });
  });

  test.describe('Performance Monitoring', () => {
    test('should track loading performance metrics', async ({ page }) => {
      // Enable performance monitoring
      await page.addInitScript(() => {
        (window as any).ENABLE_PERFORMANCE_MONITORING = true;
      });

      await page.route('**/api/campaigns', async route => {
        await new Promise(resolve => setTimeout(resolve, 1000));
        await route.fulfill({
          status: 200,
          body: JSON.stringify([{ id: 1, name: 'Test Campaign' }])
        });
      });

      await page.goto('/campaigns');
      
      // Wait for loading to complete
      await expect(page.locator('[data-testid="campaign-list"]')).toBeVisible();
      
      // Check if performance metrics were recorded
      const metrics = await page.evaluate(() => {
        return (window as any).performanceMetrics || [];
      });
      
      expect(metrics.length).toBeGreaterThan(0);
      expect(metrics[0]).toMatchObject({
        operationType: 'campaign-load',
        status: 'completed'
      });
    });

    test('should provide performance dashboard access', async ({ page }) => {
      await page.goto('/');
      
      // Access performance dashboard (usually through dev tools or admin panel)
      await page.keyboard.press('Control+Shift+P'); // Dev tools shortcut
      
      // Should be able to open performance dashboard
      await expect(page.locator('[data-testid="performance-dashboard"]')).toBeVisible({ timeout: 5000 });
      
      // Should show performance metrics
      await expect(page.locator('text=Performance Score')).toBeVisible();
      await expect(page.locator('text=Avg Duration')).toBeVisible();
      await expect(page.locator('text=Success Rate')).toBeVisible();
    });
  });

  test.describe('Loading State Accessibility', () => {
    test('should provide proper ARIA labels for loading states', async ({ page }) => {
      await page.route('**/api/campaigns', async route => {
        await new Promise(resolve => setTimeout(resolve, 2000));
        await route.fulfill({ status: 200, body: '[]' });
      });

      await page.goto('/campaigns');
      
      // Check ARIA labels
      await expect(page.locator('[aria-label*="Loading"]')).toBeVisible();
      await expect(page.locator('[role="progressbar"]')).toBeVisible();
      
      // Check screen reader announcements
      const loadingAnnouncement = page.locator('[aria-live="polite"]');
      await expect(loadingAnnouncement).toContainText(/loading|progress/i);
    });

    test('should be keyboard accessible during loading', async ({ page }) => {
      await page.route('**/api/ai-agent/generate', async route => {
        await new Promise(resolve => setTimeout(resolve, 3000));
        await route.fulfill({ status: 200, body: '{"result": "test"}' });
      });

      await page.goto('/ai-assistant');
      await page.fill('[data-testid="ai-prompt-input"]', 'Test');
      await page.press('[data-testid="ai-prompt-input"]', 'Enter');
      
      // Should be able to focus and activate cancel button with keyboard
      await page.keyboard.press('Tab');
      await expect(page.locator('[data-testid="cancel-button"]:focus')).toBeVisible();
      
      // Should be able to cancel with Enter key
      await page.keyboard.press('Enter');
      await expect(page.locator('[data-testid="ai-operation-progress"]')).not.toBeVisible();
    });
  });

  test.describe('Mobile Loading States', () => {
    test('should display mobile-optimized loading states', async ({ page }) => {
      // Set mobile viewport
      await page.setViewportSize({ width: 375, height: 667 });
      
      await page.route('**/api/campaigns', async route => {
        await new Promise(resolve => setTimeout(resolve, 1500));
        await route.fulfill({ status: 200, body: '[]' });
      });

      await page.goto('/campaigns');
      
      // Should show mobile-optimized loading
      await expect(page.locator('[data-testid="mobile-loading-state"]')).toBeVisible();
      
      // Loading components should be appropriately sized
      const spinner = page.locator('[data-testid="loading-spinner"]');
      await expect(spinner).toBeVisible();
      
      const spinnerSize = await spinner.boundingBox();
      expect(spinnerSize?.width).toBeLessThan(100); // Smaller on mobile
    });
  });
});