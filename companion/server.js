/**
 * server.js (Companion Orchestrator & Proxy Server)
 * 
 * Port: 8000
 * 
 * Responsibilities:
 * 1. Reverse Proxy for TTS (/v1/audio/speech -> :8089) with permissive CORS
 * 2. Reverse Proxy for LLM (/v1/chat/completions -> :8084) with permissive CORS
 * 3. Management REST API for Chrome Extension (/api/status, /api/start, /api/stop, /api/download)
 * 4. Static asset server for client demo
 */

const http = require('http');
const fs = require('fs');
const path = require('path');
const { AssetDownloader } = require('./downloader');
const { ProcessManager } = require('./process_manager');

const PORT = 8000;
const TTS_HOST = '127.0.0.1';
const TTS_PORT = 8089;
const LLM_HOST = '127.0.0.1';
const LLM_PORT = 8084;

// Workspace root is two levels up from this script (Desktop/workspace/browser-form-fill)
const ROOT_DIR = path.resolve(__dirname, '..', '..');
const STATIC_DIR = path.resolve(__dirname, '..', 'commands_demo');

console.log(`[Companion] Workspace root: ${ROOT_DIR}`);
console.log(`[Companion] Static UI dir:  ${STATIC_DIR}`);

const downloader = new AssetDownloader(ROOT_DIR);
const processManager = new ProcessManager(ROOT_DIR);

function setCors(res) {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS, PUT, DELETE');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With');
}

const MIME_TYPES = {
    '.html': 'text/html; charset=utf-8',
    '.js': 'application/javascript',
    '.css': 'text/css',
    '.json': 'application/json',
    '.png': 'image/png',
    '.jpg': 'image/jpeg',
    '.svg': 'image/svg+xml',
    '.onnx': 'application/octet-stream',
    '.wasm': 'application/wasm',
    '.txt': 'text/plain',
    '.wav': 'audio/wav',
};

const server = http.createServer(async (req, res) => {
    setCors(res);

    // Handle CORS preflight
    if (req.method === 'OPTIONS') {
        res.writeHead(204);
        res.end();
        return;
    }

    const parsedUrl = new URL(req.url, `http://${req.headers.host}`);
    const pathname = parsedUrl.pathname;

    // ==========================================
    // 1. TTS PROXY (/v1/audio/speech -> :8089)
    // ==========================================
    if (pathname === '/v1/audio/speech' && req.method === 'POST') {
        const chunks = [];
        req.on('data', chunk => chunks.push(chunk));
        req.on('end', () => {
            const body = Buffer.concat(chunks);
            const proxyReq = http.request({
                hostname: TTS_HOST,
                port: TTS_PORT,
                path: '/v1/audio/speech',
                method: 'POST',
                headers: {
                    'Content-Type': req.headers['content-type'] || 'application/json',
                    'Content-Length': body.length
                }
            }, (proxyRes) => {
                setCors(res);
                res.writeHead(proxyRes.statusCode, proxyRes.headers);
                proxyRes.pipe(res);
            });

            proxyReq.on('error', (err) => {
                console.error('[TTS Proxy Error]:', err.message);
                res.writeHead(502, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({ error: 'TTS service unavailable on port 8089', details: err.message }));
            });

            proxyReq.write(body);
            proxyReq.end();
        });
        return;
    }

    // ==========================================
    // 2. LLM PROXY (/v1/chat/completions -> :8084)
    // ==========================================
    if (pathname === '/v1/chat/completions' && req.method === 'POST') {
        const chunks = [];
        req.on('data', chunk => chunks.push(chunk));
        req.on('end', () => {
            const body = Buffer.concat(chunks);
            const proxyReq = http.request({
                hostname: LLM_HOST,
                port: LLM_PORT,
                path: '/v1/chat/completions',
                method: 'POST',
                headers: {
                    'Content-Type': req.headers['content-type'] || 'application/json',
                    'Content-Length': body.length
                }
            }, (proxyRes) => {
                setCors(res);
                res.writeHead(proxyRes.statusCode, proxyRes.headers);
                proxyRes.pipe(res);
            });

            proxyReq.on('error', (err) => {
                console.error('[LLM Proxy Error]:', err.message);
                res.writeHead(502, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({ error: 'LLM service unavailable on port 8084', details: err.message }));
            });

            proxyReq.write(body);
            proxyReq.end();
        });
        return;
    }

    // ==========================================
    // 3. REST API: GET /api/status
    // ==========================================
    if (pathname === '/api/status' && req.method === 'GET') {
        const assetStatus = downloader.checkAssets();
        const procStatus = await processManager.getStatus();

        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({
            allReady: assetStatus.allPresent && procStatus.allReady,
            assets: assetStatus,
            services: procStatus.services,
            rootDir: ROOT_DIR
        }));
        return;
    }

    // ==========================================
    // 4. REST API: POST /api/start
    // ==========================================
    if (pathname === '/api/start' && req.method === 'POST') {
        // First verify assets are present
        const assetStatus = downloader.checkAssets();
        if (!assetStatus.allPresent) {
            res.writeHead(400, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({
                error: 'Cannot start: some binaries or models are missing',
                assets: assetStatus
            }));
            return;
        }

        console.log('[Companion] Starting services on demand...');
        const startResult = await processManager.startAll();
        const procStatus = await processManager.getStatus();

        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({
            success: startResult.allReady,
            details: startResult,
            status: procStatus
        }));
        return;
    }

    // ==========================================
    // 5. REST API: POST /api/stop
    // ==========================================
    if (pathname === '/api/stop' && req.method === 'POST') {
        console.log('[Companion] Stopping all services on request...');
        await processManager.stopAll();
        const procStatus = await processManager.getStatus();

        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({
            success: true,
            status: procStatus
        }));
        return;
    }

    // ==========================================
    // 6. REST API: POST /api/download
    // ==========================================
    if (pathname === '/api/download' && req.method === 'POST') {
        const assetStatus = downloader.checkAssets();
        if (assetStatus.allPresent) {
            res.writeHead(200, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({
                message: 'All binaries and models already exist. No download required.',
                assets: assetStatus
            }));
            return;
        }

        console.log('[Companion] Missing assets found. Initiating download...');
        try {
            const updated = await downloader.downloadMissingAssets(
                (item) => console.log(`[Download Start] ${item.name}`),
                (item, p) => console.log(`[Download Progress] ${item.name}: ${p.percent}%`),
                (item) => console.log(`[Download Complete] ${item.name}`)
            );
            res.writeHead(200, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ success: true, assets: updated }));
        } catch (err) {
            res.writeHead(500, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ error: err.message }));
        }
        return;
    }

    // ==========================================
    // 7. REST API: GET /api/logs
    // ==========================================
    if (pathname.startsWith('/api/logs')) {
        const service = parsedUrl.searchParams.get('service') || 'all';
        let logs = {};
        if (service === 'all') {
            logs = {
                tts: processManager.processes.tts.logs,
                asr: processManager.processes.asr.logs,
                llm: processManager.processes.llm.logs
            };
        } else if (processManager.processes[service]) {
            logs = { [service]: processManager.processes[service].logs };
        }

        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify(logs));
        return;
    }

    // ==========================================
    // 8. STATIC ASSET SERVING (Fallback to commands_demo)
    // ==========================================
    let filePath = path.join(STATIC_DIR, pathname === '/' ? 'index.html' : pathname);
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

server.listen(PORT, '127.0.0.1', () => {
    console.log(`\n======================================================`);
    console.log(`  ✦  Companion Orchestrator & Proxy Running`);
    console.log(`     API & Static: http://127.0.0.1:${PORT}/`);
    console.log(`     TTS Proxy:    http://localhost:${PORT}/v1/audio/speech -> :8089`);
    console.log(`     LLM Proxy:    http://localhost:${PORT}/v1/chat/completions -> :8084`);
    console.log(`     ASR WS Port:  ws://127.0.0.1:8081`);
    console.log(`======================================================\n`);
});
