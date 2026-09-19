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
const { ProcessManager, LANGUAGE_CONFIG } = require('./process_manager');

const PORT = 8000;
const TTS_HOST = '127.0.0.1';
const TTS_PORT = 8089;
const LLM_HOST = '127.0.0.1';
const LLM_PORT = 8084;

// Resolve models/bin root directory:
// 1. COMPANION_ROOT environment variable (if set and exists)
// 2. Parent directory (e.g. dev workspace Desktop/workspace/browser-form-fill) if it has models/ or bin/
// 3. Project root (streaming_demos) so new downloads remain completely self-contained
function resolveRootDir() {
    if (process.env.COMPANION_ROOT && fs.existsSync(process.env.COMPANION_ROOT)) {
        return path.resolve(process.env.COMPANION_ROOT);
    }
    const parentRoot = path.resolve(__dirname, '..', '..');
    if (fs.existsSync(path.join(parentRoot, 'models')) || fs.existsSync(path.join(parentRoot, 'bin'))) {
        return parentRoot;
    }
    return path.resolve(__dirname, '..');
}

const ROOT_DIR = resolveRootDir();
const STATIC_DIR = path.resolve(__dirname, '..', 'commands_demo');

console.log(`[Companion] Workspace root: ${ROOT_DIR}`);
console.log(`[Companion] Static UI dir:  ${STATIC_DIR}`);

const downloader = new AssetDownloader(ROOT_DIR);
const processManager = new ProcessManager(ROOT_DIR, downloader);

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
            language: procStatus.language,
            assets: assetStatus,
            services: procStatus.services,
            rootDir: ROOT_DIR
        }));
        return;
    }

    // ==========================================
    // REST API: GET / POST /api/language
    // ==========================================
    if (pathname === '/api/language') {
        if (req.method === 'GET') {
            res.writeHead(200, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({
                language: processManager.currentLanguage,
                supportedLanguages: Object.keys(LANGUAGE_CONFIG)
            }));
            return;
        }
        if (req.method === 'POST') {
            const chunks = [];
            req.on('data', c => chunks.push(c));
            req.on('end', async () => {
                try {
                    const body = JSON.parse(Buffer.concat(chunks).toString() || '{}');
                    const targetLang = body.language || 'hi-IN';

                    // Ensure voice model exists for this language, downloading if needed
                    try {
                        await downloader.ensureLanguageVoice(targetLang, (p) => {
                            console.log(`[Companion] Downloading voice for ${targetLang}: ${p.percent}%`);
                        });
                    } catch (dlErr) {
                        console.warn(`[Companion] Voice download notice for ${targetLang}:`, dlErr.message);
                    }

                    const result = await processManager.setLanguage(targetLang);
                    res.writeHead(200, { 'Content-Type': 'application/json' });
                    res.end(JSON.stringify({ success: true, ...result }));
                } catch (err) {
                    res.writeHead(400, { 'Content-Type': 'application/json' });
                    res.end(JSON.stringify({ error: err.message }));
                }
            });
            return;
        }
    }

    // ==========================================
    // 4. REST API: POST /api/start
    // ==========================================
    if (pathname === '/api/start' && req.method === 'POST') {
        // First verify backend assets are present
        const assetStatus = downloader.checkAssets();
        if (!assetStatus.backendReady) {
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
    // 5b. REST API: POST /api/shutdown
    // ==========================================
    if (pathname === '/api/shutdown' && req.method === 'POST') {
        const chunks = [];
        req.on('data', c => chunks.push(c));
        req.on('end', async () => {
            try {
                const body = JSON.parse(Buffer.concat(chunks).toString() || '{}');
                if (body.language) {
                    processManager.saveLanguageConfig(body.language);
                    console.log(`[Companion] Persisted new language "${body.language}" for upcoming restart`);
                }
            } catch (_) {}

            console.log('[Companion] Received shutdown request from extension. Terminating services and exiting...');
            res.writeHead(200, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({
                success: true,
                message: 'Companion server is shutting down.'
            }));

            setTimeout(async () => {
                try { await processManager.stopAll(); } catch (_) {}
                process.exit(0);
            }, 300);
        });
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
    // 8. MODELS SERVING (/models/* -> ROOT_DIR/models/*)
    // ==========================================
    if (pathname.startsWith('/models/')) {
        const modelRel = pathname.replace(/^\/models\//, '');
        const modelPath = path.join(ROOT_DIR, 'models', decodeURIComponent(modelRel));

        fs.stat(modelPath, (err, stats) => {
            if (err || !stats.isFile()) {
                res.writeHead(404, { 'Content-Type': 'text/plain' });
                res.end('Model Not Found');
                return;
            }

            const ext = path.extname(modelPath).toLowerCase();
            const contentType = MIME_TYPES[ext] || 'application/octet-stream';
            res.writeHead(200, { 'Content-Type': contentType });
            fs.createReadStream(modelPath).pipe(res);
        });
        return;
    }

    // Direct /silero_vad.onnx route check (serves from STATIC_DIR or ROOT_DIR/models)
    if (pathname === '/silero_vad.onnx') {
        const staticVad = path.join(STATIC_DIR, 'silero_vad.onnx');
        const modelVad = path.join(ROOT_DIR, 'models', 'silero_vad.onnx');
        const vadTarget = fs.existsSync(staticVad) ? staticVad : (fs.existsSync(modelVad) ? modelVad : null);
        if (vadTarget) {
            res.writeHead(200, { 'Content-Type': 'application/octet-stream' });
            fs.createReadStream(vadTarget).pipe(res);
            return;
        }
    }

    // ==========================================
    // 9. STATIC ASSET SERVING (Fallback to commands_demo)
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

server.on('error', (err) => {
    if (err.code === 'EADDRINUSE') {
        console.error(`[Companion] Error: Port ${PORT} is already in use by another process.`);
    } else {
        console.error('[Companion] Server error:', err);
    }
    process.exit(1);
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
