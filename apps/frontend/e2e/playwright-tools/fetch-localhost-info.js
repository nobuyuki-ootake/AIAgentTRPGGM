import fetch from 'node-fetch';
import { JSDOM } from 'jsdom';

async function fetchLocalhost() {
  console.log('Fetching localhost:5173 information...\n');
  
  try {
    // Fetch the HTML
    const response = await fetch('http://localhost:5173');
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    const html = await response.text();
    console.log('✓ Successfully connected to localhost:5173');
    console.log(`Response status: ${response.status}`);
    console.log(`Response headers:`, Object.fromEntries(response.headers));
    
    // Parse HTML
    const dom = new JSDOM(html);
    const document = dom.window.document;
    
    // Extract information
    const title = document.querySelector('title')?.textContent || 'No title';
    const metaTags = Array.from(document.querySelectorAll('meta')).map(meta => ({
      name: meta.getAttribute('name') || meta.getAttribute('property'),
      content: meta.getAttribute('content')
    }));
    
    const scripts = Array.from(document.querySelectorAll('script')).map(script => ({
      src: script.getAttribute('src'),
      type: script.getAttribute('type')
    }));
    
    const links = Array.from(document.querySelectorAll('link')).map(link => ({
      rel: link.getAttribute('rel'),
      href: link.getAttribute('href'),
      type: link.getAttribute('type')
    }));
    
    console.log('\n=== Page Information ===');
    console.log(`Title: ${title}`);
    
    console.log('\n=== Meta Tags ===');
    metaTags.forEach(meta => {
      if (meta.name || meta.content) {
        console.log(`${meta.name}: ${meta.content}`);
      }
    });
    
    console.log('\n=== Scripts ===');
    scripts.forEach(script => {
      if (script.src) {
        console.log(`${script.type || 'text/javascript'}: ${script.src}`);
      }
    });
    
    console.log('\n=== Stylesheets & Links ===');
    links.forEach(link => {
      console.log(`${link.rel}: ${link.href}${link.type ? ` (${link.type})` : ''}`);
    });
    
    console.log('\n=== HTML Structure ===');
    console.log('Body content:', html.includes('<div id="root"') ? '✓ React root element found' : '✗ React root element not found');
    
    // Try to fetch a resource to verify Vite is serving files
    try {
      const viteResponse = await fetch('http://localhost:5173/@vite/client');
      console.log('\n=== Vite Dev Server ===');
      console.log('Vite client script:', viteResponse.ok ? '✓ Available' : '✗ Not available');
    } catch (e) {
      console.log('\n=== Vite Dev Server ===');
      console.log('Vite client script: ✗ Error fetching');
    }
    
    console.log('\n✓ The TRPG application is running on localhost:5173');
    console.log('The development server is active and serving the React application.');
    
  } catch (error) {
    console.error('Error fetching localhost:5173:', error.message);
    console.log('\nPossible issues:');
    console.log('1. The development server is not running');
    console.log('2. The port 5173 is blocked or in use by another application');
    console.log('3. Network connectivity issues');
    console.log('\nTo start the dev server, run: pnpm dev');
  }
}

fetchLocalhost();