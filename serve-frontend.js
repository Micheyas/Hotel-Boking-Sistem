const http = require('http');
const fs = require('fs');
const path = require('path');

// Determine build directory whether run from root or frontend folder
let buildDir = path.resolve(__dirname, 'frontend', 'build');
if (!fs.existsSync(buildDir)) {
  buildDir = path.resolve(__dirname, 'build');
}

const PORT = process.env.PORT || 3000;
const BACKEND_PORT = process.env.BACKEND_PORT || 5000;

const mimeTypes = {
  '.html': 'text/html',
  '.js': 'text/javascript',
  '.css': 'text/css',
  '.json': 'application/json',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon',
  '.woff': 'font/woff',
  '.woff2': 'font/woff2',
  '.txt': 'text/plain',
  '.map': 'application/json',
};

const server = http.createServer((req, res) => {
  // Proxy API and upload requests directly to backend
  if (req.url.startsWith('/api') || req.url.startsWith('/uploads')) {
    const options = {
      hostname: 'localhost',
      port: BACKEND_PORT,
      path: req.url,
      method: req.method,
      headers: {
        ...req.headers,
        host: `localhost:${BACKEND_PORT}`,
      },
    };

    const proxyReq = http.request(options, (proxyRes) => {
      res.writeHead(proxyRes.statusCode, proxyRes.headers);
      proxyRes.pipe(res, { end: true });
    });

    proxyReq.on('error', (err) => {
      console.error('[Proxy Error]', err.message);
      if (!res.headersSent) {
        res.writeHead(502, { 'Content-Type': 'application/json' });
      }
      res.end(JSON.stringify({ error: `Backend unavailable on port ${BACKEND_PORT}: ${err.message}` }));
    });

    req.pipe(proxyReq, { end: true });
    return;
  }

  let relativePath = req.url.split('?')[0];
  let filePath = path.join(buildDir, relativePath);

  // SPA fallback
  if (!fs.existsSync(filePath) || fs.statSync(filePath).isDirectory()) {
    filePath = path.join(buildDir, 'index.html');
  }

  if (!fs.existsSync(filePath)) {
    res.writeHead(404, { 'Content-Type': 'text/plain' });
    return res.end('Build folder index.html not found. Please run npm run build in frontend.');
  }

  const ext = path.extname(filePath).toLowerCase();
  const contentType = mimeTypes[ext] || 'application/octet-stream';

  res.writeHead(200, { 'Content-Type': contentType });
  const stream = fs.createReadStream(filePath);
  stream.on('error', () => {
    if (!res.headersSent) {
      res.writeHead(500, { 'Content-Type': 'text/plain' });
    }
    res.end('Server error reading file');
  });
  stream.pipe(res);
});

server.listen(PORT, () => {
  console.log(`Frontend running at http://localhost:${PORT}`);
  console.log(`Serving build from: ${buildDir}`);
  console.log(`Proxying /api and /uploads to http://localhost:${BACKEND_PORT}`);
});
