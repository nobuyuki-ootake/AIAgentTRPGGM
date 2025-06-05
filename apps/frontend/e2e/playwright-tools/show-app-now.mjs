import { chromium } from 'playwright';

console.log('Launching browser to display TRPG application...');

const browser = await chromium.launch({
  headless: false,
  args: ['--start-maximized', '--disable-web-security'],
  devtools: true
});

const page = await browser.newPage({
  ignoreHTTPSErrors: true,
  bypassCSP: true
});

// Log all console messages
page.on('console', msg => {
  const type = msg.type();
  const text = msg.text();
  if (type === 'error') {
    console.log('ERROR:', text);
  } else if (type === 'warning') {
    console.log('WARN:', text);
  } else {
    console.log('LOG:', text);
  }
});

// Navigate to the app
console.log('\nNavigating to http://localhost:5173...\n');
await page.goto('http://localhost:5173', {
  waitUntil: 'domcontentloaded'
});

// Wait a bit for React
await page.waitForTimeout(3000);

// Get the page state
const pageTitle = await page.title();
const pageURL = page.url();
const hasRoot = await page.locator('#root').count() > 0;
const rootHTML = hasRoot ? await page.locator('#root').innerHTML() : 'No root element';

console.log('=== Page Information ===');
console.log('Title:', pageTitle);
console.log('URL:', pageURL);
console.log('Has #root element:', hasRoot);
console.log('Root content preview:', rootHTML.substring(0, 200) + '...');

// Take screenshot
await page.screenshot({ 
  path: '/mnt/c/Users/irure/git/AIAgentTRPGGM/apps/frontend/trpg-app-debug.png',
  fullPage: true 
});

// Try to inject a fix for the Timeline import
console.log('\nAttempting to bypass the import error...');
await page.evaluate(() => {
  // Try to see if we can access React
  if (window.React) {
    console.log('React is available');
  }
  // Check for errors in the console
  if (window.__REACT_DEVTOOLS_GLOBAL_HOOK__) {
    console.log('React DevTools hook is available');
  }
});

console.log('\n================================================');
console.log('Browser is now open showing the TRPG application');
console.log('DevTools are open - check the Console tab for errors');
console.log('The import error for Timeline is preventing the app from loading');
console.log('');
console.log('To fix this manually in the browser:');
console.log('1. Open DevTools Console (F12)');
console.log('2. Check the error messages');
console.log('3. The app needs @mui/lab package installed');
console.log('');
console.log('Press Ctrl+C to close the browser');
console.log('================================================\n');

// Keep browser open
await new Promise(() => {});