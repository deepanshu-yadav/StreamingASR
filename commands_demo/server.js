/**
 * Static file server + TTS proxy
 * 
 * Serves the new_client directory on port 8000 and proxies
 * /v1/audio/speech requests to the TTS server at localhost:8089
 * to avoid CORS issues.
 * 
 * Usage:  node server.js
 */

const http = require('http');
const fs = require('fs');
const path = require('path');

const PORT = 8000;
const TTS_HOST = 'localhost';
const TTS_PORT = 8089;

const MIME_TYPES = {
    '.html': 'text/html; charset=utf-8',
    '.js': 'application/javascript',
    '.css': 'text/css',
    '.json': 'application/json',
    '.png': 'image/png',
    '.jpg': 'image/jpeg',
    '.svg': 'image/svg+xml',
    '.onnx': 'application/octet-stream',
    '.txt': 'text/plain',
};

const server = http.createServer((req, res) => {
    // ---- TTS Proxy: forward /v1/audio/speech to localhost:8089 ----
    if (req.url === '/v1/audio/speech' && req.method === 'POST') {
        let body = [];
        req.on('data', chunk => body.push(chunk));
        req.on('end', () => {
            const payload = Buffer.concat(body);

            const proxyReq = http.request({
                hostname: TTS_HOST,
                port: TTS_PORT,
                path: '/v1/audio/speech',
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Content-Length': payload.length,
                },
            }, (proxyRes) => {
                // Forward status + headers, add CORS
                res.writeHead(proxyRes.statusCode, {
                    ...proxyRes.headers,
                    'Access-Control-Allow-Origin': '*',
                });
                proxyRes.pipe(res);
            });

            proxyReq.on('error', (err) => {
                console.error('[TTS Proxy] Error:', err.message);
                res.writeHead(502, { 'Content-Type': 'text/plain' });
                res.end('TTS proxy error: ' + err.message);
            });

            proxyReq.write(payload);
            proxyReq.end();
        });
        return;
    }

    // ---- CORS preflight for the TTS proxy route ----
    if (req.url === '/v1/audio/speech' && req.method === 'OPTIONS') {
        res.writeHead(204, {
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Methods': 'POST, OPTIONS',
            'Access-Control-Allow-Headers': 'Content-Type',
            'Access-Control-Max-Age': '86400',
        });
        res.end();
        return;
    }

    // ---- Static file server ----
    let filePath = path.join(__dirname, req.url === '/' ? 'index.html' : req.url);
    filePath = decodeURIComponent(filePath);

    fs.stat(filePath, (err, stats) => {
        if (err || !stats.isFile()) {
            res.writeHead(404, { 'Content-Type': 'text/plain' });
            res.end('Not Found');
            return;
        }

        const ext = path.extname(filePath).toLowerCase();
        const contentType = MIME_TYPES[ext] || 'application/octet-stream';
        res.writeHead(200, { 'Content-Type': contentType });
        fs.createReadStream(filePath).pipe(res);
    });
});

server.listen(PORT, () => {
    console.log(`\n  ✦  Static server + TTS proxy running`);
    console.log(`     http://localhost:${PORT}/`);
    console.log(`     TTS proxy → http://${TTS_HOST}:${TTS_PORT}/v1/audio/speech\n`);
});
