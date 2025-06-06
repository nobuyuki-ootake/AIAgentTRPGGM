const { chromium } = require('playwright');

async function testNetworkAddress() {
  console.log('🌐 Testing network address access...');
  
  const browser = await chromium.launch({ 
    headless: false,
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });
  
  const context = await browser.newContext({
    viewport: { width: 1920, height: 1080 }
  });
  
  const page = await context.newPage();
  
  try {
    // Try the network address that was shown in the Vite output
    console.log('📋 Trying network address: http://172.19.214.178:5173/');
    await page.goto('http://172.19.214.178:5173/', { waitUntil: 'networkidle' });
    await page.waitForTimeout(2000);
    
    console.log('✅ Successfully connected to network address');
    
    // Take initial screenshot
    await page.screenshot({ 
      path: '/mnt/c/Users/irure/git/AIAgentTRPGGM/apps/frontend/test-results/network-connection-test.png',
      fullPage: true 
    });
    
    await page.waitForTimeout(3000);
    
  } catch (error) {
    console.error('❌ Network address test failed:', error.message);
    
    // Try localhost as fallback
    try {
      console.log('📋 Trying localhost fallback...');
      await page.goto('http://localhost:5173/', { waitUntil: 'networkidle' });
      await page.waitForTimeout(2000);
      console.log('✅ Localhost connection successful');
    } catch (localhostError) {
      console.error('❌ Localhost also failed:', localhostError.message);
    }
  } finally {
    await browser.close();
  }
}

testNetworkAddress().catch(console.error);