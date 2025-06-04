import { Page, expect } from '@playwright/test';

export interface LoadingTestConfig {
  operationType: string;
  expectedDuration: number;
  maxDuration: number;
  shouldShowProgress?: boolean;
  shouldShowTimeEstimate?: boolean;
  shouldShowSteps?: boolean;
  retryable?: boolean;
}

export interface MockLoadingResponse {
  delay: number;
  status?: number;
  body?: any;
  headers?: Record<string, string>;
  shouldFail?: boolean;
  progressUpdates?: { progress: number; message?: string; delay: number }[];
}

export class LoadingTestHelper {
  constructor(private page: Page) {}

  /**
   * Mock an API endpoint with loading behavior
   */
  async mockLoadingEndpoint(
    pattern: string, 
    config: MockLoadingResponse
  ): Promise<void> {
    await this.page.route(pattern, async route => {
      if (config.shouldFail) {
        await route.fulfill({
          status: config.status || 500,
          body: JSON.stringify({ error: 'Mock error' })
        });
        return;
      }

      // Simulate progressive updates if configured
      if (config.progressUpdates) {
        for (const update of config.progressUpdates) {
          await new Promise(resolve => setTimeout(resolve, update.delay));
          
          // Inject progress update into page
          await this.page.evaluate((updateData) => {
            const event = new CustomEvent('mockProgressUpdate', {
              detail: updateData
            });
            window.dispatchEvent(event);
          }, update);
        }
      } else {
        await new Promise(resolve => setTimeout(resolve, config.delay));
      }

      await route.fulfill({
        status: config.status || 200,
        body: JSON.stringify(config.body || { success: true }),
        headers: config.headers
      });
    });
  }

  /**
   * Wait for loading state to appear and verify its properties
   */
  async verifyLoadingState(
    testId: string,
    config: LoadingTestConfig
  ): Promise<void> {
    const startTime = Date.now();

    // Should show loading state
    await expect(this.page.locator(`[data-testid="${testId}"]`)).toBeVisible({
      timeout: 1000
    });

    if (config.shouldShowProgress) {
      await expect(this.page.locator('[data-testid*="progress"]')).toBeVisible();
    }

    if (config.shouldShowTimeEstimate) {
      await expect(this.page.locator('[data-testid*="time-estimate"]')).toBeVisible();
    }

    if (config.shouldShowSteps) {
      await expect(this.page.locator('[data-testid*="steps"], [data-testid*="stepper"]')).toBeVisible();
    }

    // Wait for loading to complete
    await expect(this.page.locator(`[data-testid="${testId}"]`)).not.toBeVisible({
      timeout: config.maxDuration
    });

    const actualDuration = Date.now() - startTime;
    
    // Verify timing
    if (actualDuration > config.maxDuration) {
      throw new Error(`Loading took ${actualDuration}ms, expected max ${config.maxDuration}ms`);
    }

    console.log(`✅ Loading operation "${config.operationType}" completed in ${actualDuration}ms`);
  }

  /**
   * Test loading state accessibility
   */
  async verifyAccessibility(loadingTestId: string): Promise<void> {
    const loadingElement = this.page.locator(`[data-testid="${loadingTestId}"]`);
    
    // Should have proper ARIA attributes
    await expect(loadingElement).toHaveAttribute('aria-live', /polite|assertive/);
    
    // Should have progress indicators with proper roles
    const progressElements = this.page.locator('[role="progressbar"]');
    if (await progressElements.count() > 0) {
      await expect(progressElements.first()).toHaveAttribute('aria-valuemin');
      await expect(progressElements.first()).toHaveAttribute('aria-valuemax');
    }

    // Should have descriptive text for screen readers
    const loadingText = this.page.locator('[aria-live] *');
    await expect(loadingText.first()).toContainText(/loading|processing|generating/i);
  }

  /**
   * Test error handling in loading states
   */
  async testErrorHandling(
    triggerSelector: string,
    config: LoadingTestConfig & { errorType: 'network' | 'timeout' | 'server' | 'validation' }
  ): Promise<void> {
    const errorConfigs = {
      network: { shouldFail: true, status: 0 },
      timeout: { delay: config.maxDuration + 1000, shouldFail: false },
      server: { shouldFail: true, status: 500 },
      validation: { shouldFail: true, status: 400 }
    };

    await this.mockLoadingEndpoint('**/api/**', {
      ...errorConfigs[config.errorType],
      delay: 1000
    });

    await this.page.click(triggerSelector);

    // Should show error state
    await expect(this.page.locator('[data-testid*="error"]')).toBeVisible({
      timeout: config.maxDuration + 2000
    });

    // Should show retry button if retryable
    if (config.retryable) {
      await expect(this.page.locator('[data-testid*="retry"]')).toBeVisible();
    }

    // Should show appropriate error message
    const errorMessages = {
      network: /network|connection/i,
      timeout: /timeout|too long/i,
      server: /server|error/i,
      validation: /validation|invalid/i
    };

    await expect(this.page.locator('[data-testid*="error"]')).toContainText(
      errorMessages[config.errorType]
    );
  }

  /**
   * Test performance metrics collection
   */
  async verifyPerformanceTracking(operationType: string): Promise<void> {
    // Enable performance monitoring
    await this.page.addInitScript((opType) => {
      (window as any).performanceTracker = {
        operations: [],
        startOperation: function(id: string, type: string) {
          this.operations.push({
            id,
            type,
            startTime: Date.now(),
            status: 'started'
          });
        },
        completeOperation: function(id: string) {
          const op = this.operations.find(o => o.id === id);
          if (op) {
            op.endTime = Date.now();
            op.duration = op.endTime - op.startTime;
            op.status = 'completed';
          }
        }
      };
    }, operationType);

    // After operation completes, verify metrics were collected
    const metrics = await this.page.evaluate(() => 
      (window as any).performanceTracker?.operations || []
    );

    expect(metrics.length).toBeGreaterThan(0);
    expect(metrics[0]).toMatchObject({
      type: operationType,
      status: 'completed',
      duration: expect.any(Number)
    });
  }

  /**
   * Test loading state on different screen sizes
   */
  async testResponsiveLoading(
    triggerSelector: string,
    loadingTestId: string,
    viewports: { name: string; width: number; height: number }[]
  ): Promise<void> {
    for (const viewport of viewports) {
      await this.page.setViewportSize({ width: viewport.width, height: viewport.height });
      
      await this.page.click(triggerSelector);
      
      // Verify loading state appears and is properly sized
      const loadingElement = this.page.locator(`[data-testid="${loadingTestId}"]`);
      await expect(loadingElement).toBeVisible();
      
      const boundingBox = await loadingElement.boundingBox();
      
      // Verify element fits within viewport
      expect(boundingBox?.width).toBeLessThanOrEqual(viewport.width);
      expect(boundingBox?.height).toBeLessThanOrEqual(viewport.height);
      
      // Take screenshot for visual verification
      await this.page.screenshot({
        path: `test-results/loading-${viewport.name}-${Date.now()}.png`,
        fullPage: false
      });
      
      // Wait for completion before next viewport
      await expect(loadingElement).not.toBeVisible({ timeout: 5000 });
    }
  }

  /**
   * Test memory usage during loading operations
   */
  async measureMemoryUsage(operations: string[]): Promise<any[]> {
    const memorySnapshots: any[] = [];

    await this.page.addInitScript(() => {
      (window as any).memoryTracker = {
        snapshots: [],
        takeSnapshot: function(label: string) {
          if ((performance as any).memory) {
            this.snapshots.push({
              label,
              usedJSSize: (performance as any).memory.usedJSSize,
              totalJSSize: (performance as any).memory.totalJSSize,
              timestamp: Date.now()
            });
          }
        }
      };
    });

    for (const operation of operations) {
      await this.page.evaluate((op) => {
        (window as any).memoryTracker.takeSnapshot(`before-${op}`);
      }, operation);

      // Perform operation (implementation specific)
      await this.page.click(`[data-testid="trigger-${operation}"]`);
      await this.page.waitForSelector(`[data-testid="${operation}-complete"]`, { timeout: 10000 });

      await this.page.evaluate((op) => {
        (window as any).memoryTracker.takeSnapshot(`after-${op}`);
      }, operation);
    }

    const snapshots = await this.page.evaluate(() => 
      (window as any).memoryTracker?.snapshots || []
    );

    return snapshots;
  }

  /**
   * Create a comprehensive loading test scenario
   */
  async runLoadingScenario(scenario: {
    name: string;
    operations: {
      trigger: string;
      loadingTestId: string;
      config: LoadingTestConfig;
      mockResponse: MockLoadingResponse;
    }[];
    concurrent?: boolean;
  }): Promise<void> {
    console.log(`🧪 Running loading scenario: ${scenario.name}`);

    // Set up all mocks
    for (const [index, operation] of scenario.operations.entries()) {
      await this.mockLoadingEndpoint(
        `**/api/${operation.config.operationType}${index}`,
        operation.mockResponse
      );
    }

    if (scenario.concurrent) {
      // Run operations concurrently
      const promises = scenario.operations.map(async (operation) => {
        await this.page.click(operation.trigger);
        return this.verifyLoadingState(operation.loadingTestId, operation.config);
      });

      await Promise.all(promises);
    } else {
      // Run operations sequentially
      for (const operation of scenario.operations) {
        await this.page.click(operation.trigger);
        await this.verifyLoadingState(operation.loadingTestId, operation.config);
      }
    }

    console.log(`✅ Completed loading scenario: ${scenario.name}`);
  }

  /**
   * Generate a comprehensive loading test report
   */
  async generateLoadingReport(): Promise<string> {
    const metrics = await this.page.evaluate(() => {
      return {
        performanceMetrics: (window as any).performanceTracker?.operations || [],
        memorySnapshots: (window as any).memoryTracker?.snapshots || [],
        errorLogs: (window as any).errorLogs || [],
        timestamp: Date.now()
      };
    });

    const report = {
      testRun: {
        timestamp: new Date().toISOString(),
        userAgent: await this.page.evaluate(() => navigator.userAgent),
        viewport: await this.page.viewportSize()
      },
      metrics,
      summary: {
        totalOperations: metrics.performanceMetrics.length,
        avgDuration: metrics.performanceMetrics.reduce((sum: number, op: any) => 
          sum + (op.duration || 0), 0) / Math.max(metrics.performanceMetrics.length, 1),
        errorCount: metrics.errorLogs.length
      }
    };

    return JSON.stringify(report, null, 2);
  }
}

// Predefined configurations for common TRPG loading scenarios
export const TRPG_LOADING_CONFIGS = {
  campaignLoad: {
    operationType: 'campaign-load',
    expectedDuration: 2000,
    maxDuration: 5000,
    shouldShowProgress: true,
    retryable: true
  },
  characterSheet: {
    operationType: 'character-sheet',
    expectedDuration: 1500,
    maxDuration: 3000,
    shouldShowProgress: true,
    retryable: true
  },
  aiGeneration: {
    operationType: 'ai-generation',
    expectedDuration: 25000,
    maxDuration: 60000,
    shouldShowProgress: true,
    shouldShowTimeEstimate: true,
    shouldShowSteps: true,
    retryable: true
  },
  imageGeneration: {
    operationType: 'image-generation',
    expectedDuration: 35000,
    maxDuration: 90000,
    shouldShowProgress: true,
    shouldShowTimeEstimate: true,
    retryable: true
  },
  sessionInit: {
    operationType: 'session-initialization',
    expectedDuration: 8000,
    maxDuration: 20000,
    shouldShowProgress: true,
    shouldShowSteps: true,
    retryable: false
  },
  diceRoll: {
    operationType: 'dice-animation',
    expectedDuration: 1000,
    maxDuration: 3000,
    shouldShowProgress: false,
    retryable: false
  }
} as const;

export const COMMON_VIEWPORTS = [
  { name: 'mobile', width: 375, height: 667 },
  { name: 'tablet', width: 768, height: 1024 },
  { name: 'desktop', width: 1920, height: 1080 }
] as const;