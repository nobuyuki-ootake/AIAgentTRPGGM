import { test, expect, Page, BrowserContext } from '@playwright/test';

interface PerformanceMetrics {
  navigationStart: number;
  domContentLoaded: number;
  loadComplete: number;
  firstContentfulPaint: number;
  largestContentfulPaint: number;
  memoryUsage?: {
    usedJSHeapSize: number;
    totalJSHeapSize: number;
    jsHeapSizeLimit: number;
  };
  resourceCount: number;
  totalResourceSize: number;
}

interface TRPGPerformanceThresholds {
  pageLoad: {
    navigation: number;
    domReady: number;
    loadComplete: number;
    fcp: number;
    lcp: number;
  };
  interaction: {
    diceRoll: number;
    characterSheet: number;
    aiAssist: number;
    search: number;
  };
  memory: {
    maxHeapSize: number;
    memoryLeakThreshold: number;
  };
}

const PERFORMANCE_THRESHOLDS: TRPGPerformanceThresholds = {
  pageLoad: {
    navigation: 2000,   // 2 seconds
    domReady: 3000,     // 3 seconds
    loadComplete: 5000, // 5 seconds
    fcp: 2500,          // 2.5 seconds
    lcp: 4000           // 4 seconds
  },
  interaction: {
    diceRoll: 1500,     // 1.5 seconds
    characterSheet: 3000, // 3 seconds
    aiAssist: 30000,    // 30 seconds
    search: 1000        // 1 second
  },
  memory: {
    maxHeapSize: 100 * 1024 * 1024,  // 100MB
    memoryLeakThreshold: 10 * 1024 * 1024 // 10MB increase per operation
  }
};

async function measurePagePerformance(page: Page): Promise<PerformanceMetrics> {
  return await page.evaluate(() => {
    const navigation = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming;
    const paint = performance.getEntriesByType('paint');
    const resources = performance.getEntriesByType('resource');

    const fcp = paint.find(entry => entry.name === 'first-contentful-paint')?.startTime || 0;
    
    // Get LCP via PerformanceObserver (simplified)
    let lcp = 0;
    try {
      const lcpEntries = performance.getEntriesByType('largest-contentful-paint') as any[];
      lcp = lcpEntries.length > 0 ? lcpEntries[lcpEntries.length - 1].startTime : 0;
    } catch (e) {
      // LCP might not be available in all contexts
    }

    // Memory usage (if available)
    const memoryUsage = (performance as any).memory ? {
      usedJSHeapSize: (performance as any).memory.usedJSHeapSize,
      totalJSHeapSize: (performance as any).memory.totalJSHeapSize,
      jsHeapSizeLimit: (performance as any).memory.jsHeapSizeLimit
    } : undefined;

    const totalResourceSize = resources.reduce((total, resource: any) => {
      return total + (resource.transferSize || 0);
    }, 0);

    return {
      navigationStart: navigation.navigationStart,
      domContentLoaded: navigation.domContentLoadedEventEnd - navigation.navigationStart,
      loadComplete: navigation.loadEventEnd - navigation.navigationStart,
      firstContentfulPaint: fcp,
      largestContentfulPaint: lcp,
      memoryUsage,
      resourceCount: resources.length,
      totalResourceSize
    };
  });
}

async function measureInteractionPerformance(page: Page, action: () => Promise<void>): Promise<number> {
  const startTime = Date.now();
  await action();
  return Date.now() - startTime;
}

async function createTestCampaign(page: Page, size: 'small' | 'medium' | 'large' = 'small') {
  // Navigate to home page
  await page.goto('/');
  
  // Create new project
  await page.click('[data-testid="new-project-button"]');
  await page.fill('[data-testid="project-name-input"]', `Performance Test Campaign ${size}`);
  await page.fill('[data-testid="project-description-input"]', 'A test campaign for performance testing');
  await page.click('[data-testid="create-project-button"]');
  
  // Wait for project creation
  await page.waitForSelector('[data-testid="project-created"]', { timeout: 10000 });
}

test.describe('TRPG Performance Testing', () => {
  let context: BrowserContext;
  let page: Page;

  test.beforeEach(async ({ browser }) => {
    context = await browser.newContext();
    page = await context.newPage();
    
    // Enable performance monitoring
    await page.addInitScript(() => {
      // Enable performance observers
      (window as any).performanceData = [];
    });
  });

  test.afterEach(async () => {
    await context.close();
  });

  test.describe('Page Load Performance', () => {
    test('Home page load performance', async () => {
      const startTime = Date.now();
      
      await page.goto('/');
      await page.waitForLoadState('networkidle');
      
      const metrics = await measurePagePerformance(page);
      const totalLoadTime = Date.now() - startTime;

      console.log('Home Page Performance Metrics:', {
        totalLoadTime,
        ...metrics
      });

      // Assertions
      expect(metrics.domContentLoaded).toBeLessThan(PERFORMANCE_THRESHOLDS.pageLoad.domReady);
      expect(metrics.loadComplete).toBeLessThan(PERFORMANCE_THRESHOLDS.pageLoad.loadComplete);
      expect(totalLoadTime).toBeLessThan(PERFORMANCE_THRESHOLDS.pageLoad.navigation);
      
      if (metrics.firstContentfulPaint > 0) {
        expect(metrics.firstContentfulPaint).toBeLessThan(PERFORMANCE_THRESHOLDS.pageLoad.fcp);
      }
      
      if (metrics.largestContentfulPaint > 0) {
        expect(metrics.largestContentfulPaint).toBeLessThan(PERFORMANCE_THRESHOLDS.pageLoad.lcp);
      }

      // Resource optimization checks
      expect(metrics.resourceCount).toBeLessThan(100); // Should not load excessive resources
      expect(metrics.totalResourceSize).toBeLessThan(5 * 1024 * 1024); // Should not exceed 5MB
    });

    test('Characters page load performance', async () => {
      await createTestCampaign(page);
      
      const startTime = Date.now();
      await page.goto('/characters');
      await page.waitForLoadState('networkidle');
      
      const metrics = await measurePagePerformance(page);
      const totalLoadTime = Date.now() - startTime;

      console.log('Characters Page Performance Metrics:', {
        totalLoadTime,
        ...metrics
      });

      expect(metrics.domContentLoaded).toBeLessThan(PERFORMANCE_THRESHOLDS.pageLoad.domReady);
      expect(totalLoadTime).toBeLessThan(PERFORMANCE_THRESHOLDS.pageLoad.navigation);
    });

    test('Timeline page load performance', async () => {
      await createTestCampaign(page);
      
      const startTime = Date.now();
      await page.goto('/timeline');
      await page.waitForLoadState('networkidle');
      
      const metrics = await measurePagePerformance(page);
      const totalLoadTime = Date.now() - startTime;

      console.log('Timeline Page Performance Metrics:', {
        totalLoadTime,
        ...metrics
      });

      expect(metrics.domContentLoaded).toBeLessThan(PERFORMANCE_THRESHOLDS.pageLoad.domReady);
      expect(totalLoadTime).toBeLessThan(PERFORMANCE_THRESHOLDS.pageLoad.navigation);
    });

    test('World Building page load performance', async () => {
      await createTestCampaign(page);
      
      const startTime = Date.now();
      await page.goto('/world-building');
      await page.waitForLoadState('networkidle');
      
      const metrics = await measurePagePerformance(page);
      const totalLoadTime = Date.now() - startTime;

      console.log('World Building Page Performance Metrics:', {
        totalLoadTime,
        ...metrics
      });

      expect(metrics.domContentLoaded).toBeLessThan(PERFORMANCE_THRESHOLDS.pageLoad.domReady);
      expect(totalLoadTime).toBeLessThan(PERFORMANCE_THRESHOLDS.pageLoad.navigation);
    });

    test('TRPG Session page load performance', async () => {
      await createTestCampaign(page);
      
      const startTime = Date.now();
      await page.goto('/trpg-session');
      await page.waitForLoadState('networkidle');
      
      const metrics = await measurePagePerformance(page);
      const totalLoadTime = Date.now() - startTime;

      console.log('TRPG Session Page Performance Metrics:', {
        totalLoadTime,
        ...metrics
      });

      expect(metrics.domContentLoaded).toBeLessThan(PERFORMANCE_THRESHOLDS.pageLoad.domReady);
      expect(totalLoadTime).toBeLessThan(PERFORMANCE_THRESHOLDS.pageLoad.navigation);
    });
  });

  test.describe('Large Data Performance', () => {
    test('Campaign with 100 characters load performance', async () => {
      await page.goto('/');
      
      // Create campaign and add multiple characters via API simulation
      await page.evaluate(() => {
        const characters = Array.from({ length: 100 }, (_, i) => ({
          id: `char-${i}`,
          name: `Test Character ${i}`,
          class: ['Warrior', 'Mage', 'Rogue', 'Cleric'][i % 4],
          level: Math.floor(Math.random() * 20) + 1,
          stats: {
            strength: Math.floor(Math.random() * 18) + 3,
            dexterity: Math.floor(Math.random() * 18) + 3,
            constitution: Math.floor(Math.random() * 18) + 3,
            intelligence: Math.floor(Math.random() * 18) + 3,
            wisdom: Math.floor(Math.random() * 18) + 3,
            charisma: Math.floor(Math.random() * 18) + 3
          }
        }));

        // Store in localStorage to simulate loaded campaign
        localStorage.setItem('test_campaign_characters', JSON.stringify(characters));
      });

      const startTime = Date.now();
      await page.goto('/characters');
      await page.waitForSelector('[data-testid="character-list"]', { timeout: 15000 });
      
      const loadTime = Date.now() - startTime;
      console.log('Large Character Dataset Load Time:', loadTime);

      expect(loadTime).toBeLessThan(10000); // Should load within 10 seconds
      
      // Check if all characters are rendered
      const characterCount = await page.locator('[data-testid="character-card"]').count();
      expect(characterCount).toBeGreaterThan(0);
    });

    test('Timeline with 1000 events performance', async () => {
      await page.goto('/');
      
      // Create large timeline dataset
      await page.evaluate(() => {
        const events = Array.from({ length: 1000 }, (_, i) => ({
          id: `event-${i}`,
          title: `Event ${i}`,
          description: `Description for event ${i}`,
          date: new Date(Date.now() + i * 24 * 60 * 60 * 1000).toISOString(),
          location: `Location ${Math.floor(i / 10)}`,
          participants: [`Character ${i % 20}`, `Character ${(i + 1) % 20}`]
        }));

        localStorage.setItem('test_campaign_timeline', JSON.stringify(events));
      });

      const startTime = Date.now();
      await page.goto('/timeline');
      await page.waitForSelector('[data-testid="timeline-container"]', { timeout: 20000 });
      
      const loadTime = Date.now() - startTime;
      console.log('Large Timeline Dataset Load Time:', loadTime);

      expect(loadTime).toBeLessThan(15000); // Should load within 15 seconds
    });
  });

  test.describe('Interaction Performance', () => {
    test('Dice rolling animation performance', async () => {
      await createTestCampaign(page);
      await page.goto('/trpg-session');
      
      // Test multiple dice rolls
      const rollTimes: number[] = [];
      
      for (let i = 0; i < 10; i++) {
        const rollTime = await measureInteractionPerformance(page, async () => {
          await page.click('[data-testid="dice-roll-button"]');
          await page.waitForSelector('[data-testid="dice-result"]', { timeout: 5000 });
        });
        rollTimes.push(rollTime);
      }

      const avgRollTime = rollTimes.reduce((sum, time) => sum + time, 0) / rollTimes.length;
      const maxRollTime = Math.max(...rollTimes);

      console.log('Dice Roll Performance:', {
        avgRollTime,
        maxRollTime,
        allRollTimes: rollTimes
      });

      expect(avgRollTime).toBeLessThan(PERFORMANCE_THRESHOLDS.interaction.diceRoll);
      expect(maxRollTime).toBeLessThan(PERFORMANCE_THRESHOLDS.interaction.diceRoll * 2);
    });

    test('Character sheet rendering performance', async () => {
      await createTestCampaign(page);
      await page.goto('/characters');
      
      // Create a character
      await page.click('[data-testid="add-character-button"]');
      await page.fill('[data-testid="character-name-input"]', 'Performance Test Character');
      await page.click('[data-testid="save-character-button"]');
      
      // Measure character sheet opening time
      const openTime = await measureInteractionPerformance(page, async () => {
        await page.click('[data-testid="character-card"]:first-child');
        await page.waitForSelector('[data-testid="character-sheet-dialog"]', { timeout: 5000 });
      });

      console.log('Character Sheet Open Time:', openTime);
      expect(openTime).toBeLessThan(PERFORMANCE_THRESHOLDS.interaction.characterSheet);
    });

    test('Search functionality performance', async () => {
      await createTestCampaign(page);
      
      // Generate test data
      await page.evaluate(() => {
        const characters = Array.from({ length: 200 }, (_, i) => ({
          id: `char-${i}`,
          name: `Test Character ${i}`,
          class: ['Warrior', 'Mage', 'Rogue', 'Cleric'][i % 4]
        }));
        localStorage.setItem('test_campaign_characters', JSON.stringify(characters));
      });

      await page.goto('/characters');
      await page.waitForSelector('[data-testid="character-list"]');

      // Test search performance
      const searchTerms = ['warrior', 'mage', 'test', 'character'];
      const searchTimes: number[] = [];

      for (const term of searchTerms) {
        const searchTime = await measureInteractionPerformance(page, async () => {
          await page.fill('[data-testid="search-input"]', term);
          await page.waitForSelector('[data-testid="search-results"]', { timeout: 3000 });
        });
        searchTimes.push(searchTime);
      }

      const avgSearchTime = searchTimes.reduce((sum, time) => sum + time, 0) / searchTimes.length;

      console.log('Search Performance:', {
        avgSearchTime,
        searchTimes
      });

      expect(avgSearchTime).toBeLessThan(PERFORMANCE_THRESHOLDS.interaction.search);
    });
  });

  test.describe('Memory Performance', () => {
    test('Memory usage monitoring', async () => {
      await page.goto('/');
      
      // Get initial memory
      const initialMemory = await page.evaluate(() => {
        return (performance as any).memory ? {
          usedJSHeapSize: (performance as any).memory.usedJSHeapSize,
          totalJSHeapSize: (performance as any).memory.totalJSHeapSize
        } : null;
      });

      if (!initialMemory) {
        test.skip('Memory API not available');
        return;
      }

      // Perform memory-intensive operations
      await createTestCampaign(page);
      
      // Navigate through multiple pages
      const pages = ['/characters', '/timeline', '/world-building', '/plot', '/synopsis'];
      for (const pagePath of pages) {
        await page.goto(pagePath);
        await page.waitForLoadState('networkidle');
      }

      // Get final memory
      const finalMemory = await page.evaluate(() => {
        return {
          usedJSHeapSize: (performance as any).memory.usedJSHeapSize,
          totalJSHeapSize: (performance as any).memory.totalJSHeapSize
        };
      });

      const memoryIncrease = finalMemory.usedJSHeapSize - initialMemory.usedJSHeapSize;

      console.log('Memory Usage:', {
        initial: initialMemory.usedJSHeapSize,
        final: finalMemory.usedJSHeapSize,
        increase: memoryIncrease,
        increasePercentage: (memoryIncrease / initialMemory.usedJSHeapSize) * 100
      });

      // Memory should not increase by more than threshold
      expect(memoryIncrease).toBeLessThan(PERFORMANCE_THRESHOLDS.memory.memoryLeakThreshold);
      expect(finalMemory.usedJSHeapSize).toBeLessThan(PERFORMANCE_THRESHOLDS.memory.maxHeapSize);
    });

    test('Memory leak detection in repeated operations', async () => {
      await createTestCampaign(page);
      await page.goto('/characters');

      const memorySnapshots: number[] = [];

      // Perform repeated operations
      for (let i = 0; i < 10; i++) {
        // Create and delete character
        await page.click('[data-testid="add-character-button"]');
        await page.fill('[data-testid="character-name-input"]', `Temp Character ${i}`);
        await page.click('[data-testid="save-character-button"]');
        
        await page.click('[data-testid="character-card"]:last-child [data-testid="delete-button"]');
        await page.click('[data-testid="confirm-delete-button"]');

        // Take memory snapshot
        const memory = await page.evaluate(() => {
          return (performance as any).memory ? (performance as any).memory.usedJSHeapSize : 0;
        });

        if (memory > 0) {
          memorySnapshots.push(memory);
        }
      }

      if (memorySnapshots.length > 2) {
        const firstHalf = memorySnapshots.slice(0, Math.floor(memorySnapshots.length / 2));
        const secondHalf = memorySnapshots.slice(Math.floor(memorySnapshots.length / 2));
        
        const firstAvg = firstHalf.reduce((sum, val) => sum + val, 0) / firstHalf.length;
        const secondAvg = secondHalf.reduce((sum, val) => sum + val, 0) / secondHalf.length;
        
        const memoryGrowth = secondAvg - firstAvg;
        const growthPercentage = (memoryGrowth / firstAvg) * 100;

        console.log('Memory Leak Detection:', {
          snapshots: memorySnapshots,
          firstHalfAvg: firstAvg,
          secondHalfAvg: secondAvg,
          growth: memoryGrowth,
          growthPercentage
        });

        // Memory growth should be minimal (less than 20%)
        expect(growthPercentage).toBeLessThan(20);
      }
    });
  });

  test.describe('API Performance', () => {
    test('AI API response time measurement', async () => {
      await createTestCampaign(page);
      await page.goto('/characters');

      // Mock AI API to control response time
      await page.route('**/api/ai-agent/**', async (route) => {
        // Simulate realistic AI response time
        await new Promise(resolve => setTimeout(resolve, Math.random() * 5000 + 2000));
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            success: true,
            data: {
              name: 'AI Generated Character',
              class: 'Warrior',
              background: 'A brave warrior from the northern lands.'
            }
          })
        });
      });

      const apiResponseTime = await measureInteractionPerformance(page, async () => {
        await page.click('[data-testid="ai-generate-character-button"]');
        await page.waitForSelector('[data-testid="ai-generated-character"]', { timeout: 35000 });
      });

      console.log('AI API Response Time:', apiResponseTime);
      expect(apiResponseTime).toBeLessThan(PERFORMANCE_THRESHOLDS.interaction.aiAssist);
    });

    test('Multiple concurrent API calls performance', async () => {
      await createTestCampaign(page);
      await page.goto('/world-building');

      // Track API calls
      const apiCalls: Array<{ url: string; startTime: number; endTime?: number }> = [];
      
      await page.route('**/api/**', async (route) => {
        const call = { url: route.request().url(), startTime: Date.now() };
        apiCalls.push(call);
        
        // Simulate API response
        await new Promise(resolve => setTimeout(resolve, Math.random() * 1000 + 500));
        call.endTime = Date.now();
        
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({ success: true, data: {} })
        });
      });

      // Trigger multiple AI operations simultaneously
      const startTime = Date.now();
      
      await Promise.all([
        page.click('[data-testid="generate-location-button"]'),
        page.click('[data-testid="generate-culture-button"]'),
        page.click('[data-testid="generate-history-button"]')
      ]);

      await page.waitForSelector('[data-testid="generation-complete"]', { timeout: 40000 });
      
      const totalTime = Date.now() - startTime;
      const completedCalls = apiCalls.filter(call => call.endTime);
      const avgResponseTime = completedCalls.reduce((sum, call) => 
        sum + (call.endTime! - call.startTime), 0) / completedCalls.length;

      console.log('Concurrent API Performance:', {
        totalTime,
        apiCallCount: completedCalls.length,
        avgResponseTime
      });

      expect(totalTime).toBeLessThan(45000); // Should complete within 45 seconds
      expect(avgResponseTime).toBeLessThan(10000); // Individual calls under 10 seconds
    });
  });

  test.describe('Resource Loading Performance', () => {
    test('Image loading performance', async () => {
      await createTestCampaign(page);
      
      // Monitor resource loading
      const resourceTimings: Array<{ name: string; duration: number; size: number }> = [];
      
      page.on('response', async (response) => {
        if (response.url().match(/\.(jpg|jpeg|png|gif|svg|webp)$/i)) {
          const timing = await page.evaluate((url) => {
            const entries = performance.getEntriesByName(url, 'resource');
            return entries.length > 0 ? {
              duration: entries[0].duration,
              transferSize: (entries[0] as any).transferSize || 0
            } : null;
          }, response.url());

          if (timing) {
            resourceTimings.push({
              name: response.url(),
              duration: timing.duration,
              size: timing.transferSize
            });
          }
        }
      });

      await page.goto('/characters');
      await page.waitForLoadState('networkidle');

      // Add some characters with images
      for (let i = 0; i < 5; i++) {
        await page.click('[data-testid="add-character-button"]');
        await page.fill('[data-testid="character-name-input"]', `Character ${i}`);
        // Simulate image upload
        await page.click('[data-testid="upload-character-image"]');
        await page.click('[data-testid="save-character-button"]');
      }

      const avgImageLoadTime = resourceTimings.length > 0 
        ? resourceTimings.reduce((sum, timing) => sum + timing.duration, 0) / resourceTimings.length
        : 0;
      
      const totalImageSize = resourceTimings.reduce((sum, timing) => sum + timing.size, 0);

      console.log('Image Loading Performance:', {
        imageCount: resourceTimings.length,
        avgLoadTime: avgImageLoadTime,
        totalSize: totalImageSize,
        resourceTimings
      });

      if (resourceTimings.length > 0) {
        expect(avgImageLoadTime).toBeLessThan(2000); // Images should load within 2 seconds
        expect(totalImageSize).toBeLessThan(10 * 1024 * 1024); // Total images under 10MB
      }
    });

    test('Bundle size and loading optimization', async () => {
      const resourceSizes: Record<string, number> = {};
      
      page.on('response', async (response) => {
        if (response.url().match(/\.(js|css)$/)) {
          const size = parseInt(response.headers()['content-length'] || '0');
          resourceSizes[response.url()] = size;
        }
      });

      await page.goto('/');
      await page.waitForLoadState('networkidle');

      const totalBundleSize = Object.values(resourceSizes).reduce((sum, size) => sum + size, 0);
      const jsFiles = Object.keys(resourceSizes).filter(url => url.endsWith('.js'));
      const cssFiles = Object.keys(resourceSizes).filter(url => url.endsWith('.css'));

      console.log('Bundle Performance:', {
        totalBundleSize,
        jsFileCount: jsFiles.length,
        cssFileCount: cssFiles.length,
        resourceSizes
      });

      // Bundle size should be reasonable
      expect(totalBundleSize).toBeLessThan(5 * 1024 * 1024); // Under 5MB total
      expect(jsFiles.length).toBeLessThan(20); // Not too many JS files
      expect(cssFiles.length).toBeLessThan(10); // Not too many CSS files
    });
  });
});