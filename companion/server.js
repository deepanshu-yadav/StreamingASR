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
const crypto = require('crypto');
const { AssetDownloader } = require('./downloader');
const { ProcessManager, LANGUAGE_CONFIG } = require('./process_manager');

const PORT = 8000;
const TTS_HOST = '127.0.0.1';
const TTS_PORT = 8089;
const LLM_HOST = '127.0.0.1';
const LLM_PORT = 8084;

// Resolve models/bin root directory:
// 1. COMPANION_ROOT environment variable (if set and exists)
// 2. Default: ~/Downloads/signal (keeps binaries out of the source tree)
function resolveRootDir() {
    if (process.env.COMPANION_ROOT && fs.existsSync(process.env.COMPANION_ROOT)) {
        return path.resolve(process.env.COMPANION_ROOT);
    }
    const homeDir = process.env.USERPROFILE || process.env.HOME || require('os').homedir();
    const signalDir = path.join(homeDir, 'Downloads', 'signal');
    // Ensure directory structure exists
    for (const sub of ['', 'models', 'bin']) {
        const dir = path.join(signalDir, sub);
        if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    }
    return signalDir;
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
            } catch (_) { }

            console.log('[Companion] Received shutdown request from extension. Terminating services and exiting...');
            res.writeHead(200, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({
                success: true,
                message: 'Companion server is shutting down.'
            }));

            setTimeout(async () => {
                try { await processManager.stopAll(); } catch (_) { }
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
    });
});

// ==========================================
// 5. WEBSOCKET TTS STREAMING PROXY (/ws/tts)
// ==========================================
function makeWsFrame(payload, isBinary = true) {
    const buf = Buffer.isBuffer(payload) ? payload : Buffer.from(payload, 'utf8');
    const len = buf.length;
    let header;
    const opcode = isBinary ? 0x82 : 0x81;
    if (len < 126) {
        header = Buffer.alloc(2);
        header[0] = opcode;
        header[1] = len;
    } else if (len <= 0xFFFF) {
        header = Buffer.alloc(4);
        header[0] = opcode;
        header[1] = 126;
        header.writeUInt16BE(len, 2);
    } else {
        header = Buffer.alloc(10);
        header[0] = opcode;
        header[1] = 127;
        header.writeBigUInt64BE(BigInt(len), 2);
    }
    return Buffer.concat([header, buf]);
}

function handleTtsWebSocket(req, socket, head) {
    const key = req.headers['sec-websocket-key'];
    if (!key) {
        socket.destroy();
        return;
    }
    const accept = crypto.createHash('sha1').update(key + '258EAFA5-E914-47DA-95CA-C5AB0DC85B11').digest('base64');
    socket.write(
        'HTTP/1.1 101 Switching Protocols\r\n' +
        'Upgrade: websocket\r\n' +
        'Connection: Upgrade\r\n' +
        'Sec-WebSocket-Accept: ' + accept + '\r\n\r\n'
    );

    let activeTtsReq = null;
    let buffer = Buffer.alloc(0);

    const abortActive = () => {
        if (activeTtsReq) {
            try { activeTtsReq.destroy(); } catch (_) { }
            activeTtsReq = null;
        }
    };

    socket.on('data', (chunk) => {
        buffer = Buffer.concat([buffer, chunk]);
        while (buffer.length >= 2) {
            const byte0 = buffer[0];
            const byte1 = buffer[1];
            const opcode = byte0 & 0x0f;
            const isMasked = (byte1 & 0x80) !== 0;
            let len = byte1 & 0x7f;
            let offset = 2;
            if (len === 126) {
                if (buffer.length < offset + 2) break;
                len = buffer.readUInt16BE(offset);
                offset += 2;
            } else if (len === 127) {
                if (buffer.length < offset + 8) break;
                len = Number(buffer.readBigUInt64BE(offset));
                offset += 8;
            }
            const maskLen = isMasked ? 4 : 0;
            if (buffer.length < offset + maskLen + len) break;
            let payload = buffer.subarray(offset + maskLen, offset + maskLen + len);
            if (isMasked) {
                const mask = buffer.subarray(offset, offset + 4);
                const unmasked = Buffer.alloc(len);
                for (let i = 0; i < len; i++) unmasked[i] = payload[i] ^ mask[i % 4];
                payload = unmasked;
            }
            buffer = buffer.subarray(offset + maskLen + len);

            if (opcode === 0x08) { // Close frame
                abortActive();
                socket.end(Buffer.from([0x88, 0x00]));
                return;
            }
            if (opcode === 0x09) { // Ping frame
                socket.write(Buffer.from([0x8A, 0x00])); // Pong
                continue;
            }
            if (opcode === 0x01) { // Text JSON frame
                try {
                    const data = JSON.parse(payload.toString('utf8'));
                    if (data.action === 'stop' || data.action === 'interrupt') {
                        abortActive();
                        return;
                    }
                    const cleanText = data.input || data.text || '';
                    if (!cleanText.trim()) return;

                    abortActive();

                    const postBody = JSON.stringify({
                        model: data.model || 'piper',
                        input: cleanText,
                        spoken_disclaimer: false,
                        stream: true,
                        response_format: 'pcm'
                    });

                    activeTtsReq = http.request({
                        hostname: TTS_HOST,
                        port: TTS_PORT,
                        path: '/v1/audio/speech',
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json',
                            'Content-Length': Buffer.byteLength(postBody)
                        }
                    }, (ttsRes) => {
                        ttsRes.on('data', (audioChunk) => {
                            if (!socket.destroyed) {
                                socket.write(makeWsFrame(audioChunk, true));
                            }
                        });
                        ttsRes.on('end', () => {
                            activeTtsReq = null;
                            if (!socket.destroyed) {
                                socket.write(makeWsFrame(JSON.stringify({ event: 'done' }), false));
                            }
                        });
                    });

                    activeTtsReq.on('error', (err) => {
                        console.error('[TTS WS Proxy Error]:', err.message);
                        activeTtsReq = null;
                        if (!socket.destroyed) {
                            socket.write(makeWsFrame(JSON.stringify({ event: 'error', error: err.message }), false));
                        }
                    });

                    activeTtsReq.write(postBody);
                    activeTtsReq.end();
                } catch (err) {
                    console.error('[TTS WS Payload Error]:', err.message);
                }
            }
        }
    });

    socket.on('close', abortActive);
    socket.on('error', abortActive);
}

server.on('upgrade', (req, socket, head) => {
    const parsedUrl = new URL(req.url, `http://${req.headers.host || 'localhost'}`);
    if (parsedUrl.pathname === '/ws/tts' || parsedUrl.pathname === '/v1/audio/speech/ws') {
        handleTtsWebSocket(req, socket, head);
    } else {
        socket.destroy();
    }
});

server.on('error', (err) => {
    if (err.code === 'EADDRINUSE') {
        console.error(`[Companion] Error: Port ${PORT} is already in use by another process.`);
    } else {
        console.error('[Companion] Server error:', err);
    }
    process.exit(1);
});

// ==========================================
// AUTO-DOWNLOAD & STARTUP
// ==========================================
(async () => {
    console.log(`\n[Startup] Checking assets in ${ROOT_DIR} ...`);
    const assetCheck = downloader.checkAssets();

    if (!assetCheck.allPresent) {
        const missing = assetCheck.assets.filter(a => !a.exists);
        console.log(`[Startup] ${missing.length} core asset(s) missing:`);
        for (const m of missing) {
            console.log(`  \u2022 ${m.name} (${m.relPath})`);
        }
        console.log('[Startup] Downloading missing core assets...\n');
        try {
            await downloader.downloadMissingAssets(
                (item) => console.log(`[Download Start]    ${item.name}`),
                (item, p) => {
                    process.stdout.write(`\r[Download Progress] ${item.name}: ${p.percent}% (${downloader.formatBytes(p.downloadedBytes)} / ${downloader.formatBytes(p.totalBytes)})`);
                },
                (item) => console.log(`\n[Download Complete]  ${item.name}`)
            );
        } catch (err) {
            console.error(`\n[Startup WARNING] Some downloads failed: ${err.message}`);
            console.error('[Startup WARNING] The server will start, but some services may not work.\n');
        }
    } else {
        console.log('[Startup] All core assets present. \u2713');
    }

    // Download TTS voice model for the currently selected language only
    const currentLang = processManager.currentLanguage;
    console.log(`[Startup] Ensuring TTS voice for selected language: "${currentLang}"...`);
    try {
        await downloader.ensureLanguageVoice(currentLang, (p) => {
            process.stdout.write(`\r[TTS Voice] ${currentLang}: ${p.percent}% (${downloader.formatBytes(p.downloadedBytes)} / ${downloader.formatBytes(p.totalBytes)})`);
        });
        console.log(`[Startup] TTS voice for "${currentLang}" ready. \u2713`);
    } catch (err) {
        console.warn(`[Startup WARNING] TTS voice download for "${currentLang}" failed: ${err.message}`);
    }

    // Now start listening
    server.listen(PORT, '127.0.0.1', () => {
        console.log(`\n======================================================`);
        console.log(`  \u2726  Companion Orchestrator & Proxy Running`);
        console.log(`     API & Static: http://127.0.0.1:${PORT}/`);
        console.log(`     TTS Proxy:    http://localhost:${PORT}/v1/audio/speech -> :8089`);
        console.log(`     TTS WS:       ws://127.0.0.1:${PORT}/ws/tts -> :8089`);
        console.log(`     LLM Proxy:    http://localhost:${PORT}/v1/chat/completions -> :8084`);
        console.log(`     ASR WS Port:  ws://127.0.0.1:8081`);
        console.log(`     Models/Bins:  ${ROOT_DIR}`);
        console.log(`======================================================\n`);
    });
})();