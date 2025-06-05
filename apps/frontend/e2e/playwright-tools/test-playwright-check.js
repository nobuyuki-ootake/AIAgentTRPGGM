const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch({ headless: false });
  const context = await browser.newContext();
  const page = await context.newPage();

  // Console error tracking
  const consoleErrors = [];
  page.on('console', msg => {
    if (msg.type() === 'error') {
      consoleErrors.push({
        text: msg.text(),
        location: msg.location()
      });
    }
  });

  // Page error tracking
  const pageErrors = [];
  page.on('pageerror', error => {
    pageErrors.push({
      message: error.message,
      stack: error.stack
    });
  });

  try {
    console.log('Navigating to localhost:5173...');
    await page.goto('http://localhost:5173', { 
      waitUntil: 'networkidle',
      timeout: 30000 
    });

    console.log('Page loaded successfully');

    // Wait for main content
    await page.waitForTimeout(3000);

    // Take screenshot
    await page.screenshot({ 
      path: 'homepage-check.png',
      fullPage: true 
    });
    console.log('Screenshot saved as homepage-check.png');

    // Check for key elements
    const checks = {
      navigation: await page.locator('nav, [role="navigation"], .MuiDrawer-root').count() > 0,
      mainContent: await page.locator('main, .MuiContainer-root').count() > 0,
      title: await page.title(),
      url: page.url()
    };

    console.log('\n=== Page Status ===');
    console.log('Title:', checks.title);
    console.log('URL:', checks.url);
    console.log('Navigation present:', checks.navigation);
    console.log('Main content present:', checks.mainContent);

    // Check for specific TRPG elements
    const trpgElements = {
      projectButton: await page.locator('button:has-text("新規プロジェクト"), button:has-text("New Project")').count() > 0,
      welcomeText: await page.locator('text=/TRPGキャンペーン管理ツール|Welcome to TRPG/i').count() > 0
    };

    console.log('\n=== TRPG Elements ===');
    console.log('Project button found:', trpgElements.projectButton);
    console.log('Welcome text found:', trpgElements.welcomeText);

    // Report console errors
    if (consoleErrors.length > 0) {
      console.log('\n=== Console Errors ===');
      consoleErrors.forEach((error, index) => {
        console.log(`Error ${index + 1}:`, error.text);
        if (error.location) {
          console.log('  Location:', error.location.url);
        }
      });

      // Check for specific 3D library errors
      const threeFiberErrors = consoleErrors.filter(e => 
        e.text.includes('@react-three/fiber') || 
        e.text.includes('@react-three/drei') ||
        e.text.includes('DiceVisualization')
      );

      if (threeFiberErrors.length > 0) {
        console.log('\n=== 3D Library Errors Detected ===');
        threeFiberErrors.forEach(error => {
          console.log('- ', error.text);
        });
      }
    } else {
      console.log('\n✓ No console errors detected');
    }

    // Report page errors
    if (pageErrors.length > 0) {
      console.log('\n=== Page Errors ===');
      pageErrors.forEach((error, index) => {
        console.log(`Error ${index + 1}:`, error.message);
      });
    }

    // Get page HTML structure for debugging
    const bodyHTML = await page.evaluate(() => {
      const body = document.body;
      return {
        childrenCount: body.children.length,
        hasReactRoot: !!document.getElementById('root'),
        rootContent: document.getElementById('root')?.innerHTML?.substring(0, 200) + '...'
      };
    });

    console.log('\n=== Page Structure ===');
    console.log('React root found:', bodyHTML.hasReactRoot);
    console.log('Body children count:', bodyHTML.childrenCount);
    
    // Final status
    console.log('\n=== Final Status ===');
    if (consoleErrors.length === 0 && pageErrors.length === 0) {
      console.log('✓ Page loads without errors');
    } else {
      console.log('✗ Page has errors that need attention');
    }

  } catch (error) {
    console.error('Failed to load page:', error.message);
  } finally {
    await browser.close();
  }
})();