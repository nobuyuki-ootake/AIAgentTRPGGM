const puppeteer = require('puppeteer');
const path = require('path');

async function captureSessionPage() {
  let browser;
  try {
    console.log('Launching browser...');
    browser = await puppeteer.launch({
      headless: 'new',
      args: [
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-dev-shm-usage',
        '--disable-accelerated-2d-canvas',
        '--no-first-run',
        '--no-zygote',
        '--single-process',
        '--disable-gpu'
      ]
    });

    console.log('Creating new page...');
    const page = await browser.newPage();
    
    // Set viewport to capture full page
    await page.setViewport({ width: 1280, height: 800 });
    
    console.log('Navigating to TRPG session page...');
    await page.goto('http://localhost:5173/session', { 
      waitUntil: 'networkidle0',
      timeout: 30000 
    });
    
    console.log('Waiting for page content to load...');
    // Wait a bit more for any dynamic content
    await page.waitForTimeout(3000);
    
    console.log('Taking screenshot...');
    const screenshotPath = path.join(__dirname, 'trpg-session-screenshot.png');
    await page.screenshot({ 
      path: screenshotPath,
      fullPage: true 
    });
    
    console.log(`Screenshot saved to: ${screenshotPath}`);
    return screenshotPath;
    
  } catch (error) {
    console.error('Error capturing screenshot:', error);
    throw error;
  } finally {
    if (browser) {
      console.log('Closing browser...');
      await browser.close();
    }
  }
}

// Run the function
captureSessionPage()
  .then((path) => {
    console.log('Success! Screenshot captured at:', path);
    process.exit(0);
  })
  .catch((error) => {
    console.error('Failed to capture screenshot:', error);
    process.exit(1);
  });