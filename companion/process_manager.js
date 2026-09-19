/**
 * process_manager.js
 * 
 * Manages lifecycle (spawn, port health check, logs, terminate)
 * for the 3 background services:
 * 1. Piper TTS (:8089)
 * 2. Nemotron Streaming ASR (:8080 HTTP / :8081 WS)
 * 3. Gemma 4 LLM (:8084)
 */

const { spawn, exec } = require('child_process');
const path = require('path');
const fs = require('fs');
const net = require('net');
const http = require('http');

const IS_WINDOWS = process.platform === 'win32';
const CRISPASR_BIN_NAME = IS_WINDOWS ? path.join('crispasr', 'crispasr.exe') : path.join('crispasr', 'crispasr');
const LLAMA_SERVER_BIN_NAME = IS_WINDOWS ? path.join('llama_cpp', 'llama-server.exe') : path.join('llama_cpp', 'llama-server');

const LANGUAGE_CONFIG = {
    // Hindi (already done)
    'hi-IN': { asrLang: 'hi', ttsModel: 'hi_IN-rohan-medium.gguf', ttsLang: 'hi', label: 'हिन्दी (भारत)' },
    'hi': { asrLang: 'hi', ttsModel: 'hi_IN-rohan-medium.gguf', ttsLang: 'hi', label: 'हिन्दी' },

    // English (already done)
    'en-US': { asrLang: 'en', ttsModel: 'piper-en_US-lessac-medium-f16.gguf', ttsLang: 'en', label: 'English (US)' },
    'en-GB': { asrLang: 'en', ttsModel: 'piper-en_GB-cori-medium-f16.gguf', ttsLang: 'en', label: 'English (UK)' },
    'en': { asrLang: 'en', ttsModel: 'piper-en_US-lessac-medium-f16.gguf', ttsLang: 'en', label: 'English' },

    // Spanish
    'es-ES': { asrLang: 'es', ttsModel: 'piper-es_ES-davefx-medium-f16.gguf', ttsLang: 'es', label: 'Español (España)' },
    'es-US': { asrLang: 'es', ttsModel: 'piper-es_MX-ald-medium-f16.gguf', ttsLang: 'es', label: 'Español (EE. UU.)' },
    'es': { asrLang: 'es', ttsModel: 'piper-es_ES-davefx-medium-f16.gguf', ttsLang: 'es', label: 'Español' },

    // French
    'fr-FR': { asrLang: 'fr', ttsModel: 'piper-fr_FR-siwis-medium-f16.gguf', ttsLang: 'fr', label: 'Français (France)' },
    'fr-CA': { asrLang: 'fr', ttsModel: 'piper-fr_FR-tom-medium-f16.gguf', ttsLang: 'fr', label: 'Français (Canada)' },
    'fr': { asrLang: 'fr', ttsModel: 'piper-fr_FR-siwis-medium-f16.gguf', ttsLang: 'fr', label: 'Français' },

    // Italian
    'it-IT': { asrLang: 'it', ttsModel: 'piper-it_IT-paola-medium-f16.gguf', ttsLang: 'it', label: 'Italiano' },
    'it': { asrLang: 'it', ttsModel: 'piper-it_IT-paola-medium-f16.gguf', ttsLang: 'it', label: 'Italiano' },

    // Portuguese
    'pt-BR': { asrLang: 'pt', ttsModel: 'piper-pt_BR-faber-medium-f16.gguf', ttsLang: 'pt', label: 'Português (Brasil)' },
    'pt-PT': { asrLang: 'pt', ttsModel: 'piper-pt_PT-tugão-medium-f16.gguf', ttsLang: 'pt', label: 'Português (Portugal)' },
    'pt': { asrLang: 'pt', ttsModel: 'piper-pt_BR-faber-medium-f16.gguf', ttsLang: 'pt', label: 'Português' },

    // Dutch
    'nl-NL': { asrLang: 'nl', ttsModel: 'piper-nl_NL-alex-medium-f16.gguf', ttsLang: 'nl', label: 'Nederlands' },
    'nl': { asrLang: 'nl', ttsModel: 'piper-nl_NL-alex-medium-f16.gguf', ttsLang: 'nl', label: 'Nederlands' },

    // German
    'de-DE': { asrLang: 'de', ttsModel: 'piper-de_DE-thorsten-medium-f16.gguf', ttsLang: 'de', label: 'Deutsch' },
    'de': { asrLang: 'de', ttsModel: 'piper-de_DE-thorsten-medium-f16.gguf', ttsLang: 'de', label: 'Deutsch' },

    // Turkish
    'tr-TR': { asrLang: 'tr', ttsModel: 'piper-tr_TR-dfki-medium-f16.gguf', ttsLang: 'tr', label: 'Türkçe' },
    'tr': { asrLang: 'tr', ttsModel: 'piper-tr_TR-dfki-medium-f16.gguf', ttsLang: 'tr', label: 'Türkçe' },

    // Russian
    'ru-RU': { asrLang: 'ru', ttsModel: 'piper-ru_RU-denis-medium-f16.gguf', ttsLang: 'ru', label: 'Русский' },
    'ru': { asrLang: 'ru', ttsModel: 'piper-ru_RU-denis-medium-f16.gguf', ttsLang: 'ru', label: 'Русский' },

    // Arabic
    'ar-AR': { asrLang: 'ar', ttsModel: 'piper-ar_JO-kareem-medium-f16.gguf', ttsLang: 'ar', label: 'العربية' },
    'ar': { asrLang: 'ar', ttsModel: 'piper-ar_JO-kareem-medium-f16.gguf', ttsLang: 'ar', label: 'العربية' },

    // Japanese
    'ja-JP': { asrLang: 'ja', ttsModel: 'piper-en_US-lessac-medium-f16.gguf', ttsLang: 'en', label: '日本語' },
    'ja': { asrLang: 'ja', ttsModel: 'piper-en_US-lessac-medium-f16.gguf', ttsLang: 'en', label: '日本語' },

    // Korean
    'ko-KR': { asrLang: 'ko', ttsModel: 'piper-en_US-lessac-medium-f16.gguf', ttsLang: 'en', label: '한국어' },
    'ko': { asrLang: 'ko', ttsModel: 'piper-en_US-lessac-medium-f16.gguf', ttsLang: 'en', label: '한국어' },

    // Vietnamese
    'vi-VN': { asrLang: 'vi', ttsModel: 'piper-vi_VN-vais1000-medium-f16.gguf', ttsLang: 'vi', label: 'Tiếng Việt' },
    'vi': { asrLang: 'vi', ttsModel: 'piper-vi_VN-vais1000-medium-f16.gguf', ttsLang: 'vi', label: 'Tiếng Việt' },

    // Ukrainian
    'uk-UA': { asrLang: 'uk', ttsModel: 'piper-uk_UA-lada-x_low-f16.gguf', ttsLang: 'uk', label: 'Українська' },
    'uk': { asrLang: 'uk', ttsModel: 'piper-uk_UA-lada-x_low-f16.gguf', ttsLang: 'uk', label: 'Українська' }
};

class ProcessManager {
    constructor(rootDir, downloader = null) {
        this.rootDir = rootDir;
        this.downloader = downloader;
        this.currentLanguage = 'hi-IN';
        this.loadLanguageConfig();
        this.processes = {
            tts: {
                id: 'tts',
                name: 'CrispASR Piper TTS',
                port: 8089,
                proc: null,
                pid: null,
                status: 'stopped', // 'stopped' | 'starting' | 'ready' | 'error'
                logs: []
            },
            asr: {
                id: 'asr',
                name: 'Nemotron Streaming ASR',
                port: 8081, // WebSocket port
                httpPort: 8080,
                realtimePort: 8082,
                proc: null,
                pid: null,
                status: 'stopped',
                logs: []
            },
            llm: {
                id: 'llm',
                name: 'llama-server Gemma 4 E2B',
                port: 8084,
                proc: null,
                pid: null,
                status: 'stopped',
                logs: []
            }
        };

        // Clean up all child processes on companion exit
        const cleanup = () => this.stopAll();
        process.on('exit', cleanup);
        process.on('SIGINT', () => { cleanup(); process.exit(0); });
        process.on('SIGTERM', () => { cleanup(); process.exit(0); });
    }

    addLog(serviceKey, text) {
        const lines = text.toString().split('\n').filter(Boolean);
        const target = this.processes[serviceKey];
        if (!target) return;

        for (const line of lines) {
            const entry = `[${new Date().toLocaleTimeString()}] ${line}`;
            target.logs.push(entry);
            if (target.logs.length > 200) target.logs.shift(); // keep last 200
        }
    }

    /**
     * Checks if a port is listening.
     */
    checkPort(port) {
        return new Promise((resolve) => {
            const s = new net.Socket();
            s.setTimeout(500);
            s.on('connect', () => { s.destroy(); resolve(true); });
            s.on('error', () => { s.destroy(); resolve(false); });
            s.on('timeout', () => { s.destroy(); resolve(false); });
            s.connect(port, '127.0.0.1');
        });
    }

    /**
     * Waits for a port to be listening up to maxWaitMs.
     */
    waitForPort(port, maxWaitMs = 15000, intervalMs = 250) {
        const start = Date.now();
        return new Promise((resolve) => {
            const check = async () => {
                const alive = await this.checkPort(port);
                if (alive) {
                    resolve(true);
                } else if (Date.now() - start > maxWaitMs) {
                    resolve(false);
                } else {
                    setTimeout(check, intervalMs);
                }
            };
            check();
        });
    }

    /**
     * Starts the Piper TTS server (:8089)
     */
    async startTTS(forceRestart = false) {
        const svc = this.processes.tts;
        if (!forceRestart && (svc.status === 'ready' || svc.status === 'starting')) {
            const isAlive = await this.checkPort(svc.port);
            if (isAlive) { svc.status = 'ready'; return true; }
        }
        if (forceRestart) {
            await this.stopService('tts');
        }

        const langConfig = LANGUAGE_CONFIG[this.currentLanguage] || LANGUAGE_CONFIG['hi-IN'] || LANGUAGE_CONFIG.hi;
        const binPath = path.join(this.rootDir, 'bin', CRISPASR_BIN_NAME);

        // Ensure voice model exists via downloader if available
        if (this.downloader) {
            try {
                await this.downloader.ensureLanguageVoice(this.currentLanguage);
            } catch (dlErr) {
                console.warn(`[ProcessManager] Voice ensure notice for ${this.currentLanguage}:`, dlErr.message);
            }
        }

        let modelPath = path.join(this.rootDir, 'models', langConfig.ttsModel);

        if (!IS_WINDOWS && fs.existsSync(binPath)) {
            try { fs.chmodSync(binPath, 0o755); } catch (_) {}
        }

        // Fallback search if model file name differs slightly or is an alternative regional variant
        if (!fs.existsSync(modelPath)) {
            const modelsDir = path.join(this.rootDir, 'models');
            if (fs.existsSync(modelsDir)) {
                const files = fs.readdirSync(modelsDir);
                // Look for an exact language prefix match first (e.g. piper-en_US or piper-en)
                const matched = files.find(f => f.toLowerCase().includes(langConfig.ttsLang.toLowerCase()) && f.endsWith('.gguf') && f.startsWith('piper-'));
                if (matched) {
                    modelPath = path.join(modelsDir, matched);
                } else if (langConfig.ttsLang === 'en') {
                    // English fallback: any available english piper voice
                    const enMatch = files.find(f => (f.includes('en_US') || f.includes('en_GB') || f.includes('libritts')) && f.endsWith('.gguf'));
                    if (enMatch) modelPath = path.join(modelsDir, enMatch);
                } else if (langConfig.ttsLang === 'hi') {
                    // Hindi fallback
                    modelPath = path.join(modelsDir, 'hi_IN-rohan-medium.gguf');
                }
            }
        }

        if (!fs.existsSync(modelPath)) {
            this.addLog('tts', `[WARNING] TTS Model not found at ${modelPath}`);
        }

        const args = [
            '--server',
            '--backend', 'piper',
            '-m', modelPath,
            '--port', '8089',
            '-l', langConfig.ttsLang,
            '-t', '8',
            '--no-spoken-disclaimer',
            '--accept-marking-responsibility'
        ];

        svc.status = 'starting';
        this.addLog('tts', `[LAUNCH] ${binPath} ${args.join(' ')}`);

        try {
            const proc = spawn(binPath, args, {
                cwd: this.rootDir,
                windowsHide: false,
                shell: false
            });

            svc.proc = proc;
            svc.pid = proc.pid;

            proc.stdout.on('data', (d) => this.addLog('tts', d));
            proc.stderr.on('data', (d) => this.addLog('tts', d));
            proc.on('close', (code) => {
                this.addLog('tts', `[EXIT] Process exited with code ${code}`);
                if (svc.pid === proc.pid) {
                    svc.status = 'stopped';
                    svc.proc = null;
                    svc.pid = null;
                }
            });

            // Wait for port 8089 to become ready
            const ready = await this.waitForPort(8089, 20000);
            svc.status = ready ? 'ready' : 'error';
            return ready;
        } catch (err) {
            this.addLog('tts', `[ERROR] Failed to spawn: ${err.message}`);
            svc.status = 'error';
            return false;
        }
    }

    /**
     * Starts the Nemotron Streaming ASR server (:8080 HTTP, :8081 WS)
     */
    async startASR(forceRestart = false) {
        const svc = this.processes.asr;
        if (!forceRestart && (svc.status === 'ready' || svc.status === 'starting')) {
            const isAlive = await this.checkPort(svc.port);
            if (isAlive) { svc.status = 'ready'; return true; }
        }
        if (forceRestart) {
            await this.stopService('asr');
        }

        const langConfig = LANGUAGE_CONFIG[this.currentLanguage] || LANGUAGE_CONFIG['hi-IN'] || LANGUAGE_CONFIG.hi;
        const binPath = path.join(this.rootDir, 'bin', CRISPASR_BIN_NAME);
        const modelPath = path.join(this.rootDir, 'models', 'nemotron-3.5-asr-streaming-0.6b-q4_k.gguf');

        if (!IS_WINDOWS && fs.existsSync(binPath)) {
            try { fs.chmodSync(binPath, 0o755); } catch (_) {}
        }
        const args = [
            '--server',
            '--backend', 'nemotron',
            '-m', modelPath,
            '-l', langConfig.asrLang,
            '--stream',
            '--stream-json',
            '--stream-final-mode', 'prefix',
            '--port', '8080',
            '--ws-port', '8081'
        ];

        svc.status = 'starting';
        this.addLog('asr', `[LAUNCH] CRISPASR_NEMOTRON_STREAMING=1 ${binPath} ${args.join(' ')}`);

        try {
            const proc = spawn(binPath, args, {
                cwd: this.rootDir,
                env: {
                    ...process.env,
                    CRISPASR_NEMOTRON_STREAMING: '1'
                },
                windowsHide: false,
                shell: false
            });

            svc.proc = proc;
            svc.pid = proc.pid;

            proc.stdout.on('data', (d) => this.addLog('asr', d));
            proc.stderr.on('data', (d) => this.addLog('asr', d));
            proc.on('close', (code) => {
                this.addLog('asr', `[EXIT] Process exited with code ${code}`);
                if (svc.pid === proc.pid) {
                    svc.status = 'stopped';
                    svc.proc = null;
                    svc.pid = null;
                }
            });

            // Wait for WS port 8081 to become ready
            const ready = await this.waitForPort(8081, 25000);
            svc.status = ready ? 'ready' : 'error';
            return ready;
        } catch (err) {
            this.addLog('asr', `[ERROR] Failed to spawn: ${err.message}`);
            svc.status = 'error';
            return false;
        }
    }

    /**
     * Starts the Gemma 4 LLM server (:8084)
     */
    async startLLM() {
        const svc = this.processes.llm;
        if (svc.status === 'ready' || svc.status === 'starting') {
            const isAlive = await this.checkPort(svc.port);
            if (isAlive) { svc.status = 'ready'; return true; }
        }

        const binPath = path.join(this.rootDir, 'bin', LLAMA_SERVER_BIN_NAME);
        const modelPath = path.join(this.rootDir, 'models', 'gemma-4-E2B-it-UD-Q4_K_XL.gguf');

        if (!IS_WINDOWS && fs.existsSync(binPath)) {
            try { fs.chmodSync(binPath, 0o755); } catch (_) {}
        }
        const args = [
            '--model', modelPath,
            '--port', '8084',
            '--reasoning', 'off'
        ];

        svc.status = 'starting';
        this.addLog('llm', `[LAUNCH] ${binPath} ${args.join(' ')}`);

        try {
            const proc = spawn(binPath, args, {
                cwd: this.rootDir,
                windowsHide: false,
                shell: false
            });

            svc.proc = proc;
            svc.pid = proc.pid;

            proc.stdout.on('data', (d) => this.addLog('llm', d));
            proc.stderr.on('data', (d) => this.addLog('llm', d));
            proc.on('close', (code) => {
                this.addLog('llm', `[EXIT] Process exited with code ${code}`);
                svc.status = 'stopped';
                svc.proc = null;
                svc.pid = null;
            });

            // Wait for port 8084 to become ready
            const ready = await this.waitForPort(8084, 30000);
            svc.status = ready ? 'ready' : 'error';
            return ready;
        } catch (err) {
            this.addLog('llm', `[ERROR] Failed to spawn: ${err.message}`);
            svc.status = 'error';
            return false;
        }
    }

    /**
     * Starts all 3 services concurrently.
     */
    async startAll() {
        const results = await Promise.all([
            this.startTTS(),
            this.startASR(),
            this.startLLM()
        ]);

        return {
            tts: results[0],
            asr: results[1],
            llm: results[2],
            allReady: results.every(Boolean)
        };
    }

    loadLanguageConfig() {
        try {
            // 1. Check user-specific runtime settings outside git repo (rootDir/user_config.json)
            const userCfg = this.rootDir ? path.join(this.rootDir, 'user_config.json') : null;
            if (userCfg && fs.existsSync(userCfg)) {
                const data = JSON.parse(fs.readFileSync(userCfg, 'utf8'));
                if (data.language && LANGUAGE_CONFIG[data.language]) {
                    this.currentLanguage = data.language;
                    console.log(`[ProcessManager] Loaded persisted language from user config: "${this.currentLanguage}"`);
                    return;
                }
            }
            // 2. Fallback: read default language from repository config.json (never modified by code)
            const cfgFile = path.join(__dirname, 'config.json');
            if (fs.existsSync(cfgFile)) {
                const data = JSON.parse(fs.readFileSync(cfgFile, 'utf8'));
                if (data.language && LANGUAGE_CONFIG[data.language]) {
                    this.currentLanguage = data.language;
                    console.log(`[ProcessManager] Loaded default language: "${this.currentLanguage}"`);
                }
            }
        } catch (_) {}
    }

    saveLanguageConfig(lang) {
        try {
            // Persist ONLY to user-specific directory (rootDir/user_config.json)
            // NEVER modify git-tracked companion/config.json to keep repository clean
            if (this.rootDir) {
                const userCfg = path.join(this.rootDir, 'user_config.json');
                fs.writeFileSync(userCfg, JSON.stringify({ language: lang }, null, 2), 'utf8');
                console.log(`[ProcessManager] Persisted language "${lang}" to ${userCfg}`);
            }
        } catch (_) {}
    }

    /**
     * Forcefully kills any process listening on a port.
     */
    killPort(port) {
        return new Promise((resolve) => {
            if (!port) return resolve();
            if (IS_WINDOWS) {
                exec(`netstat -ano | findstr :${port}`, (err, stdout) => {
                    if (err || !stdout) return resolve();
                    const lines = stdout.trim().split('\n');
                    const pids = new Set();
                    for (const line of lines) {
                        const parts = line.trim().split(/\s+/);
                        if (parts.length >= 5) {
                            const state = parts[3];
                            const pid = parts[4];
                            if (state === 'LISTENING' && pid && pid !== '0') {
                                pids.add(pid);
                            }
                        }
                    }
                    if (pids.size === 0) return resolve();
                    const killCmds = Array.from(pids).map(p => `taskkill /pid ${p} /T /F`).join(' & ');
                    exec(killCmds, () => resolve());
                });
            } else {
                // Linux & macOS: try lsof then fuser
                exec(`lsof -ti :${port}`, (err, stdout) => {
                    if (!err && stdout && stdout.trim()) {
                        const pids = stdout.trim().split(/\s+/).filter(Boolean);
                        if (pids.length > 0) {
                            exec(`kill -9 ${pids.join(' ')} 2>/dev/null`, () => resolve());
                            return;
                        }
                    }
                    exec(`fuser -k -n tcp ${port} 2>/dev/null`, () => resolve());
                });
            }
        });
    }

    waitForPortClose(port, maxWaitMs = 6000, intervalMs = 200) {
        const start = Date.now();
        return new Promise((resolve) => {
            const check = async () => {
                const alive = await this.checkPort(port);
                if (!alive || Date.now() - start > maxWaitMs) {
                    resolve(!alive);
                } else {
                    setTimeout(check, intervalMs);
                }
            };
            check();
        });
    }

    /**
     * Forcefully kills a process and all its children across platforms.
     */
    killPid(pid) {
        return new Promise((resolve) => {
            if (!pid) return resolve();
            if (IS_WINDOWS) {
                exec(`taskkill /pid ${pid} /T /F`, () => resolve());
            } else {
                try {
                    process.kill(-pid, 'SIGKILL');
                } catch (_) {
                    try { process.kill(pid, 'SIGKILL'); } catch (_) {}
                }
                exec(`kill -9 ${pid} 2>/dev/null`, () => resolve());
            }
        });
    }

    /**
     * Stops a given service.
     */
    async stopService(serviceKey) {
        const svc = this.processes[serviceKey];
        if (!svc) return;

        if (svc.pid) {
            await this.killPid(svc.pid);
        }
        if (svc.port) {
            await this.killPort(svc.port);
            await this.waitForPortClose(svc.port);
        }
        if (svc.httpPort) {
            await this.killPort(svc.httpPort);
            await this.waitForPortClose(svc.httpPort);
        }
        if (svc.realtimePort) {
            await this.killPort(svc.realtimePort);
            await this.waitForPortClose(svc.realtimePort);
        }
        svc.proc = null;
        svc.pid = null;
        svc.status = 'stopped';
    }

    /**
     * Stops all services.
     */
    async stopAll() {
        await Promise.all([
            this.stopService('tts'),
            this.stopService('asr'),
            this.stopService('llm')
        ]);
    }

    /**
     * Changes active language (e.g. 'en-US', 'es-ES', 'fr-FR', etc.) and restarts ASR/TTS if currently running.
     */
    async setLanguage(lang) {
        if (!LANGUAGE_CONFIG[lang]) {
            // Check if base lang prefix matches (e.g. 'es' -> 'es-ES' or 'en-GB' -> 'en')
            const matchedKey = Object.keys(LANGUAGE_CONFIG).find(k => k === lang || k.startsWith(lang + '-') || lang.startsWith(k + '-'));
            if (matchedKey) {
                lang = matchedKey;
            } else {
                console.warn(`[ProcessManager] Unsupported language: "${lang}", keeping "${this.currentLanguage}"`);
                return { changed: false, language: this.currentLanguage };
            }
        }

        const prev = this.currentLanguage;
        this.currentLanguage = lang;
        this.saveLanguageConfig(lang);
        console.log(`[ProcessManager] Language switched: ${prev} -> ${lang}`);

        // Restart ASR & TTS with force restart
        const asrLive = await this.checkPort(this.processes.asr.port);
        const ttsLive = await this.checkPort(this.processes.tts.port);

        if (asrLive) {
            console.log(`[ProcessManager] Restarting ASR for language "${lang}"...`);
            await this.startASR(true);
        }
        if (ttsLive) {
            console.log(`[ProcessManager] Restarting TTS for language "${lang}"...`);
            await this.startTTS(true);
        }

        return { changed: true, previousLanguage: prev, language: this.currentLanguage };
    }

    /**
     * Gets current health status of all 3 services.
     */
    async getStatus() {
        const ttsLive = await this.checkPort(8089);
        const asrLive = await this.checkPort(8081);
        const llmLive = await this.checkPort(8084);

        if (ttsLive && this.processes.tts.status !== 'starting') this.processes.tts.status = 'ready';
        if (asrLive && this.processes.asr.status !== 'starting') this.processes.asr.status = 'ready';
        if (llmLive && this.processes.llm.status !== 'starting') this.processes.llm.status = 'ready';

        return {
            allReady: ttsLive && asrLive && llmLive,
            language: this.currentLanguage,
            services: {
                tts: { ...this.processes.tts, live: ttsLive, proc: undefined },
                asr: { ...this.processes.asr, live: asrLive, proc: undefined },
                llm: { ...this.processes.llm, live: llmLive, proc: undefined }
            }
        };
    }
}

module.exports = { ProcessManager, LANGUAGE_CONFIG };
