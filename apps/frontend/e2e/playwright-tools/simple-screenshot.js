// Simple screenshot script using Node.js built-in modules
import http from 'http';
import fs from 'fs';

// First, let's check if the page is accessible and get the HTML content
const options = {
  hostname: 'localhost',
  port: 5173,
  path: '/session',
  method: 'GET'
};

const req = http.request(options, (res) => {
  console.log(`statusCode: ${res.statusCode}`);
  console.log(`headers:`, res.headers);

  let data = '';
  res.on('data', (chunk) => {
    data += chunk;
  });

  res.on('end', () => {
    console.log('Page content length:', data.length);
    console.log('Page title:', data.match(/<title[^>]*>([^<]+)<\/title>/)?.[1] || 'No title found');
    console.log('Success! TRPG session page is accessible.');
    
    // Save the HTML content for inspection
    fs.writeFileSync('session-page-content.html', data);
    console.log('HTML content saved to session-page-content.html');
  });
});

req.on('error', (error) => {
  console.error('Error accessing page:', error);
});

req.end();