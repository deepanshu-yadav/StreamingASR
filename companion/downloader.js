/**
 * downloader.js
 * 
 * Verifies existence of required binaries and models.
 * Only downloads missing files, reporting byte-level progress.
 */

const fs = require('fs');
const path = require('path');
const https = require('https');
const http = require('http');

// Manifest of required items with verification thresholds and official download URLs
const ASSETS_MANIFEST = [
    {
        id: 'crispasr_bin',
        name: 'CrispASR Executable',
        type: 'binary',
        relPath: path.join('bin', 'crispasr.exe'),
        minSizeBytes: 5 * 1024 * 1024, // ~17MB expected
        url: 'https://github.com/CrispStrobe/CrispASR/releases/download/v0.8.30/crispasr-windows-x86_64-cpu.zip',
        isZip: true,
        extractFiles: ['crispasr.exe', 'crispasr-quantize.exe']
    },
    {
        id: 'llama_server_bin',
        name: 'llama-server Executable',
        type: 'binary',
        relPath: path.join('bin', 'llama-server.exe'),
        minSizeBytes: 4096, // llama-server.exe is a 9KB wrapper around llama-server-impl.dll
        url: 'https://github.com/ggml-org/llama.cpp/releases/download/b10686/llama-b10686-bin-win-cpu-x64.zip',
        isZip: true,
        extractFiles: ['llama-server.exe', 'llama-server-impl.dll', 'llama.dll', 'ggml.dll']
    },
    {
        id: 'tts_model',
        name: 'Piper Hindi TTS Model (Rohan GGUF)',
        type: 'model',
        relPath: path.join('models', 'hi_IN-rohan-medium.gguf'),
        minSizeBytes: 20 * 1024 * 1024, // ~31MB expected
        url: 'https://huggingface.co/pronoobie/piper-voices-hindi/resolve/main/hi_IN-rohan-medium.gguf',
        isZip: false
    },
    {
        id: 'asr_model',
        name: 'Nemotron 3.5 Streaming ASR (GGUF)',
        type: 'model',
        relPath: path.join('models', 'nemotron-3.5-asr-streaming-0.6b-q4_k.gguf'),
        minSizeBytes: 250 * 1024 * 1024, // ~408MB expected
        url: 'https://huggingface.co/cstr/nemotron-3.5-asr-streaming-GGUF/resolve/main/nemotron-3.5-asr-streaming-0.6b-q4_k.gguf',
        isZip: false
    },
    {
        id: 'llm_model',
        name: 'Gemma 4 E2B LLM (GGUF)',
        type: 'model',
        relPath: path.join('models', 'gemma-4-E2B-it-UD-Q4_K_XL.gguf'),
        minSizeBytes: 1000 * 1024 * 1024, // ~3.1GB expected
        url: 'https://huggingface.co/unsloth/gemma-4-E2B-it-GGUF/resolve/main/gemma-4-E2B-it-UD-Q4_K_XL.gguf',
        isZip: false
    }
];

class AssetDownloader {
    constructor(rootDir) {
        this.rootDir = rootDir;
        this.currentDownload = null;
    }

    /**
     * Inspects all required files and returns status for each.
     */
    checkAssets() {
        const results = [];
        let allPresent = true;

        for (const item of ASSETS_MANIFEST) {
            const absPath = path.join(this.rootDir, item.relPath);
            let exists = false;
            let size = 0;

            try {
                if (fs.existsSync(absPath)) {
                    const stat = fs.statSync(absPath);
                    size = stat.size;
                    exists = size >= item.minSizeBytes;
                }
            } catch (err) {
                exists = false;
            }

            if (!exists) {
                allPresent = false;
            }

            results.push({
                id: item.id,
                name: item.name,
                type: item.type,
                relPath: item.relPath,
                absPath,
                exists,
                sizeBytes: size,
                formattedSize: this.formatBytes(size),
                minSizeBytes: item.minSizeBytes
            });
        }

        return { allPresent, assets: results };
    }

    /**
     * Downloads a single missing file with redirect handling and progress callback.
     */
    downloadFile(url, destPath, onProgress) {
        return new Promise((resolve, reject) => {
            const dir = path.dirname(destPath);
            if (!fs.existsSync(dir)) {
                fs.mkdirSync(dir, { recursive: true });
            }

            const tempPath = destPath + '.download';
            const fileStream = fs.createWriteStream(tempPath);

            const handleRequest = (currentUrl, redirectCount = 0) => {
                if (redirectCount > 10) {
                    return reject(new Error('Too many redirects'));
                }

                const lib = currentUrl.startsWith('https') ? https : http;
                const req = lib.get(currentUrl, (res) => {
                    // Handle HTTP redirects (301, 302, 303, 307, 308)
                    if ([301, 302, 303, 307, 308].includes(res.statusCode)) {
                        const newUrl = res.headers.location;
                        if (!newUrl) {
                            return reject(new Error(`Redirect status ${res.statusCode} but no Location header`));
                        }
                        const resolvedUrl = new URL(newUrl, currentUrl).toString();
                        return handleRequest(resolvedUrl, redirectCount + 1);
                    }

                    if (res.statusCode !== 200) {
                        return reject(new Error(`Download failed with status ${res.statusCode} for ${currentUrl}`));
                    }

                    const totalBytes = parseInt(res.headers['content-length'] || '0', 10);
                    let downloadedBytes = 0;
                    let lastProgressTime = 0;

                    res.on('data', (chunk) => {
                        downloadedBytes += chunk.length;
                        fileStream.write(chunk);

                        const now = Date.now();
                        if (now - lastProgressTime > 200 || downloadedBytes === totalBytes) {
                            lastProgressTime = now;
                            if (onProgress) {
                                onProgress({
                                    downloadedBytes,
                                    totalBytes,
                                    percent: totalBytes ? Math.round((downloadedBytes / totalBytes) * 100) : 0
                                });
                            }
                        }
                    });

                    res.on('end', () => {
                        fileStream.end(() => {
                            try {
                                if (fs.existsSync(destPath)) {
                                    fs.unlinkSync(destPath);
                                }
                                fs.renameSync(tempPath, destPath);
                                resolve(destPath);
                            } catch (err) {
                                reject(err);
                            }
                        });
                    });
                });

                req.on('error', (err) => {
                    try { if (fs.existsSync(tempPath)) fs.unlinkSync(tempPath); } catch (_) {}
                    reject(err);
                });

                this.currentDownload = req;
            };

            handleRequest(url);
        });
    }

    /**
     * Downloads missing assets sequentially.
     */
    async downloadMissingAssets(onItemStart, onItemProgress, onItemDone) {
        const { assets } = this.checkAssets();
        const missing = assets.filter(a => !a.exists);

        for (const item of missing) {
            const manifestItem = ASSETS_MANIFEST.find(m => m.id === item.id);
            if (!manifestItem) continue;

            if (onItemStart) onItemStart(manifestItem);

            const destPath = item.absPath;
            await this.downloadFile(manifestItem.url, destPath, (p) => {
                if (onItemProgress) onItemProgress(manifestItem, p);
            });

            if (onItemDone) onItemDone(manifestItem);
        }

        return this.checkAssets();
    }

    formatBytes(bytes) {
        if (bytes === 0) return '0 B';
        const k = 1024;
        const sizes = ['B', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return (bytes / Math.pow(k, i)).toFixed(2) + ' ' + sizes[i];
    }
}

module.exports = { AssetDownloader, ASSETS_MANIFEST };
