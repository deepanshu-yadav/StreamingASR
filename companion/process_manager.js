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
const net = require('net');
const http = require('http');

class ProcessManager {
    constructor(rootDir) {
        this.rootDir = rootDir;
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
            const entry = { time: new Date().toISOString(), line: line.trim() };
            target.logs.push(entry);
            if (target.logs.length > 200) target.logs.shift();
        }
    }

    /**
     * Checks if a local TCP port is accepting connections.
     */
    checkPort(port, host = '127.0.0.1', timeout = 1000) {
        return new Promise((resolve) => {
            const socket = new net.Socket();
            let isConnected = false;

            socket.setTimeout(timeout);
            socket.on('connect', () => {
                isConnected = true;
                socket.destroy();
                resolve(true);
            });
            socket.on('timeout', () => {
                socket.destroy();
                resolve(false);
            });
            socket.on('error', () => {
                socket.destroy();
                resolve(false);
            });

            socket.connect(port, host);
        });
    }

    /**
     * Polls a port until it is open or timeout expires.
     */
    async waitForPort(port, maxWaitMs = 30000, intervalMs = 1000) {
        const start = Date.now();
        while (Date.now() - start < maxWaitMs) {
            const open = await this.checkPort(port);
            if (open) return true;
            await new Promise(r => setTimeout(r, intervalMs));
        }
        return false;
    }

    /**
     * Starts the Piper TTS server (:8089)
     */
    async startTTS() {
        const svc = this.processes.tts;
        if (svc.status === 'ready' || svc.status === 'starting') {
            const isAlive = await this.checkPort(svc.port);
            if (isAlive) { svc.status = 'ready'; return true; }
        }

        const binPath = path.join(this.rootDir, 'bin', 'crispasr.exe');
        const modelPath = path.join(this.rootDir, 'models', 'hi_IN-rohan-medium.gguf');
        const args = [
            '--server',
            '--backend', 'piper',
            '-m', modelPath,
            '--port', '8089',
            '-l', 'hi',
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
                svc.status = 'stopped';
                svc.proc = null;
                svc.pid = null;
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
    async startASR() {
        const svc = this.processes.asr;
        if (svc.status === 'ready' || svc.status === 'starting') {
            const isAlive = await this.checkPort(svc.port);
            if (isAlive) { svc.status = 'ready'; return true; }
        }

        const binPath = path.join(this.rootDir, 'bin', 'crispasr.exe');
        const modelPath = path.join(this.rootDir, 'models', 'nemotron-3.5-asr-streaming-0.6b-q4_k.gguf');
        const args = [
            '--server',
            '--backend', 'nemotron',
            '-m', modelPath,
            '-l', 'hi',
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
                svc.status = 'stopped';
                svc.proc = null;
                svc.pid = null;
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

        const binPath = path.join(this.rootDir, 'bin', 'llama-server.exe');
        const modelPath = path.join(this.rootDir, 'models', 'gemma-4-E2B-it-UD-Q4_K_XL.gguf');
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

    /**
     * Forcefully kills a process and all its children using Windows taskkill.
     */
    killPid(pid) {
        return new Promise((resolve) => {
            if (!pid) return resolve();
            exec(`taskkill /pid ${pid} /T /F`, () => resolve());
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
            services: {
                tts: { ...this.processes.tts, live: ttsLive, proc: undefined },
                asr: { ...this.processes.asr, live: asrLive, proc: undefined },
                llm: { ...this.processes.llm, live: llmLive, proc: undefined }
            }
        };
    }
}

module.exports = { ProcessManager };
