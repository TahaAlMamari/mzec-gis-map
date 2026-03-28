const http = require('http');
const fs = require('fs');
const path = require('path');

const PORT = 8098;
const ROOT = __dirname;

const MIME = {
  '.html': 'text/html',
  '.js': 'application/javascript',
  '.css': 'text/css',
  '.json': 'application/json',
  '.pbf': 'application/x-protobuf',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
};

const server = http.createServer((req, res) => {
  let url = req.url.split('?')[0];
  if (url === '/') url = '/index.html';

  const filePath = path.join(ROOT, url);
  const ext = path.extname(filePath);

  fs.readFile(filePath, (err, data) => {
    if (err) {
      res.writeHead(404, { 'Access-Control-Allow-Origin': '*' });
      res.end();
      return;
    }
    res.writeHead(200, {
      'Content-Type': MIME[ext] || 'application/octet-stream',
      'Access-Control-Allow-Origin': '*',
      'Cache-Control': 'max-age=3600',
    });
    res.end(data);
  });
});

server.listen(PORT, () => console.log(`Tile server on http://localhost:${PORT}`));
