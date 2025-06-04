import { chromium, FullConfig } from "@playwright/test";

/**
 * Global setup for TRPG E2E testing framework
 * Sets up test environment, mock data, and shared resources
 */
async function globalSetup(config: FullConfig) {
  console.log("🎲 TRPG E2E Test Framework - Global Setup Starting...");

  const browser = await chromium.launch();
  const context = await browser.newContext();
  const page = await context.newPage();

  try {
    // 1. Verify application server is running
    console.log("📡 Checking application server status...");
    const baseURL = config.projects[0].use.baseURL || "http://localhost:5173";
    
    try {
      await page.goto(baseURL, { timeout: 10000 });
      console.log("✅ Application server is running");
    } catch (error) {
      console.error("❌ Application server is not accessible:", error);
      throw new Error(`Application server at ${baseURL} is not running. Please start the development server first.`);
    }

    // 2. Initialize test environment
    console.log("🔧 Initializing test environment...");
    
    // Clear any existing data
    await page.evaluate(() => {
      localStorage.clear();
      sessionStorage.clear();
      // Clear IndexedDB if used
      if (window.indexedDB) {
        const databases = ['trpg-campaigns', 'trpg-characters', 'trpg-sessions'];
        databases.forEach(dbName => {
          const deleteReq = indexedDB.deleteDatabase(dbName);
          deleteReq.onsuccess = () => console.log(`Cleared ${dbName} database`);
        });
      }
    });

    // 3. Set up test configuration
    await page.evaluate(() => {
      // Set development mode for comprehensive testing
      localStorage.setItem('trpg-dev-mode', 'true');
      localStorage.setItem('trpg-test-mode', 'true');
      
      // Configure AI settings for testing (mock keys)
      localStorage.setItem('ai-settings', JSON.stringify({
        provider: 'mock',
        apiKey: 'test-key-for-e2e',
        enableMockResponses: true
      }));

      // Set performance monitoring
      localStorage.setItem('trpg-performance-monitoring', 'true');
    });

    // 4. Create test data directory structure
    console.log("📁 Setting up test data directories...");
    
    // This would typically create necessary directories for test artifacts
    // In browser context, we'll prepare the data structures
    await page.evaluate(() => {
      // Initialize test data structures
      const testData = {
        campaigns: [],
        characters: [],
        sessions: [],
        worldBuilding: [],
        setupTimestamp: Date.now()
      };
      
      localStorage.setItem('trpg-test-data', JSON.stringify(testData));
    });

    console.log("✅ Global setup completed successfully");

  } catch (error) {
    console.error("❌ Global setup failed:", error);
    throw error;
  } finally {
    await browser.close();
  }
}

export default globalSetup;