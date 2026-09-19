/**
 * downloader.js
 * 
 * Verifies existence of required binaries and models.
 * Only downloads missing files, reporting byte-level progress.
 * Supports Windows, Linux, and macOS.
 */

const fs = require('fs');
const path = require('path');
const https = require('https');
const http = require('http');
const { exec } = require('child_process');

const PLATFORM = process.platform; // 'win32', 'linux', 'darwin'
const ARCH = process.arch; // 'x64', 'arm64'
const IS_WINDOWS = PLATFORM === 'win32';
const IS_DARWIN = PLATFORM === 'darwin';
const IS_LINUX = PLATFORM === 'linux';

// Piper GGUF repository base URL
const PIPER_GGUF_BASE_URL = 'https://huggingface.co/LocalAI-Community/piper-voices-GGUF/resolve/main/';

// Complete voice model catalog for all supported languages
const VOICE_MODELS = {
    'hi-IN': {
        name: 'Piper Hindi (Rohan GGUF)',
        file: 'hi_IN-rohan-medium.gguf',
        url: 'https://huggingface.co/pronoobie/piper-voices-hindi/resolve/main/hi_IN-rohan-medium.gguf',
        fallbackUrl: PIPER_GGUF_BASE_URL + 'piper-hi_IN-pratham-medium-f16.gguf',
        minSizeBytes: 20 * 1024 * 1024
    },
    'hi': {
        name: 'Piper Hindi (Rohan GGUF)',
        file: 'hi_IN-rohan-medium.gguf',
        url: 'https://huggingface.co/pronoobie/piper-voices-hindi/resolve/main/hi_IN-rohan-medium.gguf',
        minSizeBytes: 20 * 1024 * 1024
    },
    'en-US': {
        name: 'Piper English US (Lessac GGUF)',
        file: 'piper-en_US-lessac-medium-f16.gguf',
        url: PIPER_GGUF_BASE_URL + 'piper-en_US-lessac-medium-f16.gguf',
        minSizeBytes: 20 * 1024 * 1024
    },
    'en-GB': {
        name: 'Piper English UK (Cori GGUF)',
        file: 'piper-en_GB-cori-medium-f16.gguf',
        url: PIPER_GGUF_BASE_URL + 'piper-en_GB-cori-medium-f16.gguf',
        minSizeBytes: 20 * 1024 * 1024
    },
    'en': {
        name: 'Piper English US (Lessac GGUF)',
        file: 'piper-en_US-lessac-medium-f16.gguf',
        url: PIPER_GGUF_BASE_URL + 'piper-en_US-lessac-medium-f16.gguf',
        minSizeBytes: 20 * 1024 * 1024
    },
    'es-ES': {
        name: 'Piper Spanish Spain (Davefx GGUF)',
        file: 'piper-es_ES-davefx-medium-f16.gguf',
        url: PIPER_GGUF_BASE_URL + 'piper-es_ES-davefx-medium-f16.gguf',
        minSizeBytes: 20 * 1024 * 1024
    },
    'es-US': {
        name: 'Piper Spanish Americas (Ald GGUF)',
        file: 'piper-es_MX-ald-medium-f16.gguf',
        url: PIPER_GGUF_BASE_URL + 'piper-es_MX-ald-medium-f16.gguf',
        minSizeBytes: 20 * 1024 * 1024
    },
    'es': {
        name: 'Piper Spanish Spain (Davefx GGUF)',
        file: 'piper-es_ES-davefx-medium-f16.gguf',
        url: PIPER_GGUF_BASE_URL + 'piper-es_ES-davefx-medium-f16.gguf',
        minSizeBytes: 20 * 1024 * 1024
    },
    'fr-FR': {
        name: 'Piper French (Siwis GGUF)',
        file: 'piper-fr_FR-siwis-medium-f16.gguf',
        url: PIPER_GGUF_BASE_URL + 'piper-fr_FR-siwis-medium-f16.gguf',
        minSizeBytes: 20 * 1024 * 1024
    },
    'fr-CA': {
        name: 'Piper French Canada (Tom GGUF)',
        file: 'piper-fr_FR-tom-medium-f16.gguf',
        url: PIPER_GGUF_BASE_URL + 'piper-fr_FR-tom-medium-f16.gguf',
        minSizeBytes: 20 * 1024 * 1024
    },
    'fr': {
        name: 'Piper French (Siwis GGUF)',
        file: 'piper-fr_FR-siwis-medium-f16.gguf',
        url: PIPER_GGUF_BASE_URL + 'piper-fr_FR-siwis-medium-f16.gguf',
        minSizeBytes: 20 * 1024 * 1024
    },
    'it-IT': {
        name: 'Piper Italian (Paola GGUF)',
        file: 'piper-it_IT-paola-medium-f16.gguf',
        url: PIPER_GGUF_BASE_URL + 'piper-it_IT-paola-medium-f16.gguf',
        minSizeBytes: 20 * 1024 * 1024
    },
    'it': {
        name: 'Piper Italian (Paola GGUF)',
        file: 'piper-it_IT-paola-medium-f16.gguf',
        url: PIPER_GGUF_BASE_URL + 'piper-it_IT-paola-medium-f16.gguf',
        minSizeBytes: 20 * 1024 * 1024
    },
    'pt-BR': {
        name: 'Piper Portuguese Brazil (Faber GGUF)',
        file: 'piper-pt_BR-faber-medium-f16.gguf',
        url: PIPER_GGUF_BASE_URL + 'piper-pt_BR-faber-medium-f16.gguf',
        minSizeBytes: 20 * 1024 * 1024
    },
    'pt-PT': {
        name: 'Piper Portuguese Portugal (Tugão GGUF)',
        file: 'piper-pt_PT-tugão-medium-f16.gguf',
        url: PIPER_GGUF_BASE_URL + 'piper-pt_PT-tug%C3%A3o-medium-f16.gguf',
        minSizeBytes: 20 * 1024 * 1024
    },
    'pt': {
        name: 'Piper Portuguese Brazil (Faber GGUF)',
        file: 'piper-pt_BR-faber-medium-f16.gguf',
        url: PIPER_GGUF_BASE_URL + 'piper-pt_BR-faber-medium-f16.gguf',
        minSizeBytes: 20 * 1024 * 1024
    },
    'nl-NL': {
        name: 'Piper Dutch (Alex GGUF)',
        file: 'piper-nl_NL-alex-medium-f16.gguf',
        url: PIPER_GGUF_BASE_URL + 'piper-nl_NL-alex-medium-f16.gguf',
        minSizeBytes: 20 * 1024 * 1024
    },
    'nl': {
        name: 'Piper Dutch (Alex GGUF)',
        file: 'piper-nl_NL-alex-medium-f16.gguf',
        url: PIPER_GGUF_BASE_URL + 'piper-nl_NL-alex-medium-f16.gguf',
        minSizeBytes: 20 * 1024 * 1024
    },
    'de-DE': {
        name: 'Piper German (Thorsten GGUF)',
        file: 'piper-de_DE-thorsten-medium-f16.gguf',
        url: PIPER_GGUF_BASE_URL + 'piper-de_DE-thorsten-medium-f16.gguf',
        minSizeBytes: 20 * 1024 * 1024
    },
    'de': {
        name: 'Piper German (Thorsten GGUF)',
        file: 'piper-de_DE-thorsten-medium-f16.gguf',
        url: PIPER_GGUF_BASE_URL + 'piper-de_DE-thorsten-medium-f16.gguf',
        minSizeBytes: 20 * 1024 * 1024
    },
    'tr-TR': {
        name: 'Piper Turkish (DFKI GGUF)',
        file: 'piper-tr_TR-dfki-medium-f16.gguf',
        url: PIPER_GGUF_BASE_URL + 'piper-tr_TR-dfki-medium-f16.gguf',
        minSizeBytes: 20 * 1024 * 1024
    },
    'tr': {
        name: 'Piper Turkish (DFKI GGUF)',
        file: 'piper-tr_TR-dfki-medium-f16.gguf',
        url: PIPER_GGUF_BASE_URL + 'piper-tr_TR-dfki-medium-f16.gguf',
        minSizeBytes: 20 * 1024 * 1024
    },
    'ru-RU': {
        name: 'Piper Russian (Denis GGUF)',
        file: 'piper-ru_RU-denis-medium-f16.gguf',
        url: PIPER_GGUF_BASE_URL + 'piper-ru_RU-denis-medium-f16.gguf',
        minSizeBytes: 20 * 1024 * 1024
    },
    'ru': {
        name: 'Piper Russian (Denis GGUF)',
        file: 'piper-ru_RU-denis-medium-f16.gguf',
        url: PIPER_GGUF_BASE_URL + 'piper-ru_RU-denis-medium-f16.gguf',
        minSizeBytes: 20 * 1024 * 1024
    },
    'ar-AR': {
        name: 'Piper Arabic (Kareem GGUF)',
        file: 'piper-ar_JO-kareem-medium-f16.gguf',
        url: PIPER_GGUF_BASE_URL + 'piper-ar_JO-kareem-medium-f16.gguf',
        minSizeBytes: 20 * 1024 * 1024
    },
    'ar': {
        name: 'Piper Arabic (Kareem GGUF)',
        file: 'piper-ar_JO-kareem-medium-f16.gguf',
        url: PIPER_GGUF_BASE_URL + 'piper-ar_JO-kareem-medium-f16.gguf',
        minSizeBytes: 20 * 1024 * 1024
    },
    'vi-VN': {
        name: 'Piper Vietnamese (Vais1000 GGUF)',
        file: 'piper-vi_VN-vais1000-medium-f16.gguf',
        url: PIPER_GGUF_BASE_URL + 'piper-vi_VN-vais1000-medium-f16.gguf',
        minSizeBytes: 20 * 1024 * 1024
    },
    'vi': {
        name: 'Piper Vietnamese (Vais1000 GGUF)',
        file: 'piper-vi_VN-vais1000-medium-f16.gguf',
        url: PIPER_GGUF_BASE_URL + 'piper-vi_VN-vais1000-medium-f16.gguf',
        minSizeBytes: 20 * 1024 * 1024
    },
    'uk-UA': {
        name: 'Piper Ukrainian (Lada GGUF)',
        file: 'piper-uk_UA-lada-x_low-f16.gguf',
        url: PIPER_GGUF_BASE_URL + 'piper-uk_UA-lada-x_low-f16.gguf',
        minSizeBytes: 8 * 1024 * 1024
    },
    'uk': {
        name: 'Piper Ukrainian (Lada GGUF)',
        file: 'piper-uk_UA-lada-x_low-f16.gguf',
        url: PIPER_GGUF_BASE_URL + 'piper-uk_UA-lada-x_low-f16.gguf',
        minSizeBytes: 8 * 1024 * 1024
    },
    'ja-JP': {
        name: 'Piper Japanese (English Fallback)',
        file: 'piper-en_US-lessac-medium-f16.gguf',
        url: PIPER_GGUF_BASE_URL + 'piper-en_US-lessac-medium-f16.gguf',
        minSizeBytes: 20 * 1024 * 1024
    },
    'ja': {
        name: 'Piper Japanese (English Fallback)',
        file: 'piper-en_US-lessac-medium-f16.gguf',
        url: PIPER_GGUF_BASE_URL + 'piper-en_US-lessac-medium-f16.gguf',
        minSizeBytes: 20 * 1024 * 1024
    },
    'ko-KR': {
        name: 'Piper Korean (English Fallback)',
        file: 'piper-en_US-lessac-medium-f16.gguf',
        url: PIPER_GGUF_BASE_URL + 'piper-en_US-lessac-medium-f16.gguf',
        minSizeBytes: 20 * 1024 * 1024
    },
    'ko': {
        name: 'Piper Korean (English Fallback)',
        file: 'piper-en_US-lessac-medium-f16.gguf',
        url: PIPER_GGUF_BASE_URL + 'piper-en_US-lessac-medium-f16.gguf',
        minSizeBytes: 20 * 1024 * 1024
    }
};

/**
 * Returns platform-specific binaries for CrispASR and llama.cpp
 */
function getPlatformBinaries() {
    if (IS_WINDOWS) {
        return {
            crispasr: {
                relPath: path.join('bin', 'crispasr', 'crispasr.exe'),
                url: 'https://github.com/CrispStrobe/CrispASR/releases/download/v0.8.30/crispasr-windows-x86_64-cpu.zip',
                isArchive: true,
                archiveType: 'zip',
                minSizeBytes: 5 * 1024 * 1024
            },
            llamaServer: {
                relPath: path.join('bin', 'llama_cpp', 'llama-server.exe'),
                url: 'https://github.com/ggml-org/llama.cpp/releases/download/b10686/llama-b10686-bin-win-cpu-x64.zip',
                isArchive: true,
                archiveType: 'zip',
                minSizeBytes: 4096
            }
        };
    }

    if (IS_DARWIN) {
        const llamaMacUrl = ARCH === 'arm64'
            ? 'https://github.com/ggml-org/llama.cpp/releases/download/b10686/llama-b10686-bin-macos-arm64.zip'
            : 'https://github.com/ggml-org/llama.cpp/releases/download/b10686/llama-b10686-bin-macos-x64.zip';

        return {
            crispasr: {
                relPath: path.join('bin', 'crispasr', 'crispasr'),
                url: 'https://github.com/CrispStrobe/CrispASR/releases/download/v0.8.30/crispasr-macos.tar.gz',
                isArchive: true,
                archiveType: 'tar.gz',
                minSizeBytes: 5 * 1024 * 1024
            },
            llamaServer: {
                relPath: path.join('bin', 'llama_cpp', 'llama-server'),
                url: llamaMacUrl,
                isArchive: true,
                archiveType: 'zip',
                minSizeBytes: 100 * 1024
            }
        };
    }

    // Default Linux (x86_64)
    return {
        crispasr: {
            relPath: path.join('bin', 'crispasr', 'crispasr'),
            url: 'https://github.com/CrispStrobe/CrispASR/releases/download/v0.8.30/crispasr-linux-x86_64.tar.gz',
            isArchive: true,
            archiveType: 'tar.gz',
            minSizeBytes: 5 * 1024 * 1024
        },
        llamaServer: {
            relPath: path.join('bin', 'llama_cpp', 'llama-server'),
            url: 'https://github.com/ggml-org/llama.cpp/releases/download/b10686/llama-b10686-bin-ubuntu-x64.zip',
            isArchive: true,
            archiveType: 'zip',
            minSizeBytes: 100 * 1024
        }
    };
}

const platformBins = getPlatformBinaries();

// Core manifest required for backend services to operate
const ASSETS_MANIFEST = [
    {
        id: 'crispasr_bin',
        name: `CrispASR Executable (${PLATFORM}-${ARCH})`,
        type: 'binary',
        relPath: platformBins.crispasr.relPath,
        minSizeBytes: platformBins.crispasr.minSizeBytes,
        url: platformBins.crispasr.url,
        isArchive: platformBins.crispasr.isArchive,
        archiveType: platformBins.crispasr.archiveType
    },
    {
        id: 'llama_server_bin',
        name: `llama-server Executable (${PLATFORM}-${ARCH})`,
        type: 'binary',
        relPath: platformBins.llamaServer.relPath,
        minSizeBytes: platformBins.llamaServer.minSizeBytes,
        url: platformBins.llamaServer.url,
        isArchive: platformBins.llamaServer.isArchive,
        archiveType: platformBins.llamaServer.archiveType
    },

    {
        id: 'asr_model',
        name: 'Nemotron 3.5 Streaming ASR (GGUF)',
        type: 'model',
        relPath: path.join('models', 'nemotron-3.5-asr-streaming-0.6b-q4_k.gguf'),
        minSizeBytes: 250 * 1024 * 1024, // ~408MB expected
        url: 'https://huggingface.co/cstr/nemotron-3.5-asr-streaming-GGUF/resolve/main/nemotron-3.5-asr-streaming-0.6b-q4_k.gguf',
        isArchive: false
    },
    {
        id: 'llm_model',
        name: 'Gemma 4 E2B LLM (GGUF)',
        type: 'model',
        relPath: path.join('models', 'gemma-4-E2B-it-UD-Q4_K_XL.gguf'),
        minSizeBytes: 1000 * 1024 * 1024, // ~3.1GB expected
        url: 'https://huggingface.co/unsloth/gemma-4-E2B-it-GGUF/resolve/main/gemma-4-E2B-it-UD-Q4_K_XL.gguf',
        isArchive: false
    },
    {
        id: 'vad_model',
        name: 'Silero VAD v5 (ONNX)',
        type: 'model',
        relPath: path.join('models', 'silero_vad.onnx'),
        minSizeBytes: 2 * 1024 * 1024,
        url: 'https://huggingface.co/runanywhere/silero-vad-v5/resolve/main/silero_vad.onnx',
        isArchive: false,
        isBackendRequired: false
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
        let backendReady = true;

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

            // Auto-heal VAD model: if missing in models/ but present in extension or demo, copy it
            if (!exists && item.id === 'vad_model') {
                const extPath = path.resolve(__dirname, '..', 'extension', 'silero_vad.onnx');
                const demoPath = path.resolve(__dirname, '..', 'commands_demo', 'silero_vad.onnx');
                const src = fs.existsSync(extPath) ? extPath : (fs.existsSync(demoPath) ? demoPath : null);
                if (src) {
                    try {
                        const dir = path.dirname(absPath);
                        if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
                        fs.copyFileSync(src, absPath);
                        const stat = fs.statSync(absPath);
                        size = stat.size;
                        exists = size >= item.minSizeBytes;
                    } catch (_) {}
                }
            }

            if (!exists) {
                allPresent = false;
                if (item.isBackendRequired !== false) {
                    backendReady = false;
                }
            }

            results.push({
                id: item.id,
                name: item.name,
                type: item.type,
                relPath: item.relPath,
                absPath,
                exists,
                isBackendRequired: item.isBackendRequired !== false,
                sizeBytes: size,
                formattedSize: this.formatBytes(size),
                minSizeBytes: item.minSizeBytes
            });
        }

        return { allPresent, backendReady, assets: results, platform: PLATFORM, arch: ARCH };
    }

    /**
     * Checks if a voice model for a given language is present.
     */
    checkLanguageVoice(langCode) {
        const v = VOICE_MODELS[langCode] || VOICE_MODELS[langCode.split('-')[0]];
        if (!v) return { supported: false };

        const absPath = path.join(this.rootDir, 'models', v.file);
        let exists = false;
        let size = 0;

        try {
            if (fs.existsSync(absPath)) {
                size = fs.statSync(absPath).size;
                exists = size >= (v.minSizeBytes || 1024 * 1024);
            }
        } catch (_) {}

        return {
            supported: true,
            lang: langCode,
            name: v.name,
            file: v.file,
            absPath,
            exists,
            sizeBytes: size,
            url: v.url
        };
    }

    /**
     * Ensures voice model for requested language exists, downloading it if missing.
     */
    async ensureLanguageVoice(langCode, onProgress) {
        const voiceInfo = this.checkLanguageVoice(langCode);
        if (!voiceInfo.supported) {
            console.log(`[Downloader] Voice for "${langCode}" not in catalog or uses system/default voice.`);
            return true;
        }

        if (voiceInfo.exists) {
            return true;
        }

        console.log(`[Downloader] Voice model for "${langCode}" is missing. Downloading ${voiceInfo.name}...`);
        await this.downloadFile(voiceInfo.url, voiceInfo.absPath, onProgress);
        return true;
    }

    /**
     * Extracts an archive (.zip or .tar.gz) into destination directory.
     */
    extractArchive(archivePath, destDir, archiveType) {
        return new Promise((resolve, reject) => {
            if (!fs.existsSync(destDir)) fs.mkdirSync(destDir, { recursive: true });

            if (archiveType === 'tar.gz') {
                exec(`tar -xzf "${archivePath}" -C "${destDir}"`, (err, stdout, stderr) => {
                    if (err) return reject(new Error(`tar extraction failed: ${stderr || err.message}`));
                    resolve();
                });
            } else if (archiveType === 'zip') {
                if (IS_WINDOWS) {
                    const psCmd = `powershell -NoProfile -Command "Expand-Archive -Path '${archivePath}' -DestinationPath '${destDir}' -Force"`;
                    exec(psCmd, (err, stdout, stderr) => {
                        if (err) return reject(new Error(`PowerShell unzip failed: ${stderr || err.message}`));
                        resolve();
                    });
                } else {
                    exec(`unzip -o -q "${archivePath}" -d "${destDir}"`, (err, stdout, stderr) => {
                        if (err) return reject(new Error(`unzip failed: ${stderr || err.message}`));
                        resolve();
                    });
                }
            } else {
                resolve();
            }
        });
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

                                // Ensure execute permissions on Linux and macOS
                                if (!IS_WINDOWS && (destPath.includes('/bin/') || destPath.includes('\\bin\\'))) {
                                    try { fs.chmodSync(destPath, 0o755); } catch (_) {}
                                }

                                resolve(destPath);
                            } catch (err) {
                                reject(err);
                            }
                        });
                    });
                });

                req.on('error', (err) => {
                    try { if (fs.existsSync(tempPath)) fs.unlinkSync(tempPath); } catch (_) { }
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

            if (manifestItem.isArchive) {
                // Download archive to temporary file and extract into the binary's own subdirectory
                const archiveExt = manifestItem.archiveType === 'tar.gz' ? '.tar.gz' : '.zip';
                // Extract into the parent directory of the expected binary path
                // e.g. bin/crispasr/ for bin/crispasr/crispasr.exe
                const extractDir = path.dirname(destPath);
                if (!fs.existsSync(extractDir)) fs.mkdirSync(extractDir, { recursive: true });
                const archiveTempPath = path.join(extractDir, `temp_download${archiveExt}`);
                
                await this.downloadFile(manifestItem.url, archiveTempPath, (p) => {
                    if (onItemProgress) onItemProgress(manifestItem, p);
                });

                try {
                    await this.extractArchive(archiveTempPath, extractDir, manifestItem.archiveType);
                } finally {
                    try { if (fs.existsSync(archiveTempPath)) fs.unlinkSync(archiveTempPath); } catch (_) {}
                }

                // Post-extraction: flatten binary and its dependent sibling files (e.g. openblas.dll)
                // from nested subdirectories (e.g. crispasr-windows-x86_64-cpu/) to expected path
                if (!fs.existsSync(destPath)) {
                    const targetBasename = path.basename(destPath);
                    const found = this._findFileRecursive(extractDir, targetBasename);
                    if (found) {
                        try {
                            const subDir = path.dirname(found);
                            // Copy all sibling files (like openblas.dll) from the nested folder to extractDir
                            if (subDir !== extractDir && fs.existsSync(subDir)) {
                                const siblings = fs.readdirSync(subDir, { withFileTypes: true });
                                for (const sib of siblings) {
                                    if (sib.isFile()) {
                                        const src = path.join(subDir, sib.name);
                                        const dst = path.join(extractDir, sib.name);
                                        fs.copyFileSync(src, dst);
                                    }
                                }
                                console.log(`[Downloader] Flattened files and dependencies from ${path.relative(extractDir, subDir)} to ${extractDir}`);
                            } else {
                                fs.copyFileSync(found, destPath);
                            }
                        } catch (cpErr) {
                            console.warn(`[Downloader] Could not flatten ${targetBasename} dependencies: ${cpErr.message}`);
                        }
                    }
                }

                // Chmod all binaries on POSIX
                if (!IS_WINDOWS && fs.existsSync(extractDir)) {
                    const files = fs.readdirSync(extractDir);
                    for (const f of files) {
                        try { fs.chmodSync(path.join(extractDir, f), 0o755); } catch (_) {}
                    }
                }
            } else {
                await this.downloadFile(manifestItem.url, destPath, (p) => {
                    if (onItemProgress) onItemProgress(manifestItem, p);
                });
            }

            if (onItemDone) onItemDone(manifestItem);

            // If VAD model was downloaded, also mirror it to commands_demo and extension directories if available
            if (manifestItem.id === 'vad_model' && fs.existsSync(destPath)) {
                try {
                    const demoVad = path.resolve(__dirname, '..', 'commands_demo', 'silero_vad.onnx');
                    const extVad = path.resolve(__dirname, '..', 'extension', 'silero_vad.onnx');
                    if (fs.existsSync(path.dirname(demoVad)) && !fs.existsSync(demoVad)) {
                        fs.copyFileSync(destPath, demoVad);
                    }
                    if (fs.existsSync(path.dirname(extVad)) && !fs.existsSync(extVad)) {
                        fs.copyFileSync(destPath, extVad);
                    }
                } catch (_) {}
            }
        }

        return this.checkAssets();
    }

    /**
     * Recursively searches a directory for a file by basename.
     * Returns the absolute path of the first match, or null.
     */
    _findFileRecursive(dir, filename) {
        try {
            const entries = fs.readdirSync(dir, { withFileTypes: true });
            for (const entry of entries) {
                const full = path.join(dir, entry.name);
                if (entry.isFile() && entry.name === filename) {
                    return full;
                }
                if (entry.isDirectory()) {
                    const found = this._findFileRecursive(full, filename);
                    if (found) return found;
                }
            }
        } catch (_) {}
        return null;
    }

    formatBytes(bytes) {
        if (bytes === 0) return '0 B';
        const k = 1024;
        const sizes = ['B', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return (bytes / Math.pow(k, i)).toFixed(2) + ' ' + sizes[i];
    }
}

module.exports = { AssetDownloader, ASSETS_MANIFEST, VOICE_MODELS };
