const http = require('http');

const server = http.createServer((req, res) => {
  res.writeHead(200, { 'Content-Type': 'text/html' });
  res.end(`
    <html>
      <head><title>Test Server</title></head>
      <body>
        <h1>Test Server Running</h1>
        <p>Developer Mode Test</p>
        <button data-testid="developer-toggle">Developer Toggle</button>
      </body>
    </html>
  `);
});

server.listen(5175, '0.0.0.0', () => {
  console.log('Simple test server running on http://localhost:5175');
});