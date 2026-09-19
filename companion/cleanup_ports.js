/**
 * cleanup_ports.js
 * 
 * Safely releases ports 8000, 8089, 8084, 8081, 8080 across Windows, Linux, and macOS
 * before starting the companion orchestrator.
 */

const { execSync } = require('child_process');

const PORTS = [8000, 8089, 8084, 8081, 8080];
const IS_WIN = process.platform === 'win32';

function cleanup() {
    for (const port of PORTS) {
        try {
            if (IS_WIN) {
                const out = execSync('netstat -ano', { encoding: 'utf8', stdio: ['pipe', 'pipe', 'ignore'] });
                const lines = out.split('\n');
                const pids = new Set();
                for (const line of lines) {
                    if (line.includes(`:${port}`) && line.includes('LISTENING')) {
                        const parts = line.trim().split(/\s+/);
                        const pid = parts[parts.length - 1];
                        if (pid && pid !== '0' && pid !== String(process.pid)) {
                            pids.add(pid);
                        }
                    }
                }
                for (const pid of pids) {
                    try {
                        execSync(`taskkill /pid ${pid} /T /F`, { stdio: 'ignore' });
                        console.log(`[*] Terminated stale process on port ${port} (PID ${pid})`);
                    } catch (_) {}
                }
            } else {
                try {
                    const pids = execSync(`lsof -ti :${port}`, { encoding: 'utf8', stdio: ['pipe', 'pipe', 'ignore'] }).trim();
                    if (pids) {
                        execSync(`kill -9 ${pids.split(/\s+/).join(' ')} 2>/dev/null`, { stdio: 'ignore' });
                        console.log(`[*] Terminated stale process on port ${port} (PID ${pids})`);
                    }
                } catch (_) {
                    try {
                        execSync(`fuser -k -n tcp ${port} 2>/dev/null`, { stdio: 'ignore' });
                    } catch (_) {}
                }
            }
        } catch (_) {}
    }
}

cleanup();
