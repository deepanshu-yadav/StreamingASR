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
const crypto = require('crypto');

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

// ---- WebSocket TTS streaming proxy ----
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

server.on('upgrade', (req, socket, head) => {
    if (req.url !== '/ws/tts' && req.url !== '/v1/audio/speech/ws') {
        socket.destroy();
        return;
    }
    const key = req.headers['sec-websocket-key'];
    if (!key) { socket.destroy(); return; }
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

            if (opcode === 0x08) {
                abortActive();
                socket.end(Buffer.from([0x88, 0x00]));
                return;
            }
            if (opcode === 0x09) {
                socket.write(Buffer.from([0x8A, 0x00]));
                continue;
            }
            if (opcode === 0x01) {
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
});

server.listen(PORT, () => {
    console.log(`\n  ✦  Static server + TTS proxy running`);
    console.log(`     http://localhost:${PORT}/`);
    console.log(`     TTS proxy → http://${TTS_HOST}:${TTS_PORT}/v1/audio/speech`);
    console.log(`     TTS WS    → ws://localhost:${PORT}/ws/tts\n`);
});
