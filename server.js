/**
 * server.js — 로컬 개발용 서버
 * - 정적 파일 서빙 (index.html, js/, css/, assets/)
 * - Bareun API CORS 프록시 (/api/bareun/tokenize)
 *
 * 실행: node server.js
 * 접속: http://localhost:3000
 */
const http  = require('http');
const https = require('https');
const fs    = require('fs');
const path  = require('path');

const PORT = 3000;

const MIME = {
  '.html': 'text/html; charset=utf-8',
  '.js':   'application/javascript; charset=utf-8',
  '.css':  'text/css; charset=utf-8',
  '.json': 'application/json',
  '.png':  'image/png',
  '.jpg':  'image/jpeg',
  '.ico':  'image/x-icon',
  '.svg':  'image/svg+xml',
  '.txt':  'text/plain; charset=utf-8',
};

const server = http.createServer((req, res) => {

  // ── Bareun API 프록시 ──────────────────────────────
  if (req.url === '/api/bareun/tokenize') {

    // OPTIONS preflight
    if (req.method === 'OPTIONS') {
      res.writeHead(204, {
        'Access-Control-Allow-Origin':  '*',
        'Access-Control-Allow-Methods': 'POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, api-key',
      });
      res.end();
      return;
    }

    if (req.method !== 'POST') {
      res.writeHead(405); res.end('Method Not Allowed'); return;
    }

    let body = '';
    req.on('data', chunk => { body += chunk; });
    req.on('end', () => {
      const apiKey = req.headers['api-key'] || '';
      const options = {
        hostname: 'api.bareun.ai',
        port:     443,
        path:     '/v1/tokenize',
        method:   'POST',
        headers: {
          'Content-Type':   'application/json',
          'Content-Length': Buffer.byteLength(body),
          'api-key':        apiKey,
        },
      };

      const proxyReq = https.request(options, proxyRes => {
        const chunks = [];
        proxyRes.on('data', c => chunks.push(c));
        proxyRes.on('end', () => {
          const data = Buffer.concat(chunks);
          res.writeHead(proxyRes.statusCode, {
            'Content-Type':                 'application/json',
            'Access-Control-Allow-Origin':  '*',
          });
          res.end(data);
        });
      });

      proxyReq.on('error', err => {
        console.error('[프록시 오류]', err.message);
        res.writeHead(502, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: err.message }));
      });

      proxyReq.write(body);
      proxyReq.end();
    });
    return;
  }

  // ── 정적 파일 서빙 ─────────────────────────────────
  let urlPath = req.url.split('?')[0]; // 쿼리스트링 제거
  if (urlPath === '/') urlPath = '/index.html';

  const filePath   = path.join(__dirname, urlPath);
  const ext        = path.extname(filePath).toLowerCase();
  const contentType = MIME[ext] || 'application/octet-stream';

  fs.readFile(filePath, (err, data) => {
    if (err) {
      if (err.code === 'ENOENT') { res.writeHead(404); res.end('Not Found'); }
      else                        { res.writeHead(500); res.end('Server Error'); }
      return;
    }
    res.writeHead(200, { 'Content-Type': contentType });
    res.end(data);
  });
});

server.listen(PORT, () => {
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log(`  YouTube 댓글 분석기 서버 시작`);
  console.log(`  접속 주소: http://localhost:${PORT}`);
  console.log(`  Bareun API 프록시: /api/bareun/tokenize`);
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
});
