/**
 * audit_manager.js
 * 
 * Companion Audit Logging Engine:
 * Manages structured JSONL and formatted human-readable .log files for form assistant sessions.
 * 
 * Records:
 * - Scanned form fields inventory & DOM mutations
 * - Audio streaming chunks, VAD turn commits, and STT dumps
 * - Confirmation debounce buffer delays and scheduled dump timings
 * - Final STT server utterances, confidence & latencies
 * - Intent classifications (Tier 1 Heuristics & Tier 2 LLM)
 * - Corrections (Regex local patches and LLM prompts, raw outputs, latencies, and diffs)
 * - Movements across form fields (previous field -> current field transitions)
 * - System runtime parameters snapshot & dynamic parameter updates
 * - Comprehensive millisecond timing on every event
 */

const fs = require('fs');
const path = require('path');

class AuditManager {
    constructor(rootDir, workspaceDir) {
        const homeDir = process.env.USERPROFILE || process.env.HOME || require('os').homedir();
        const defaultRootDir = path.join(homeDir, 'Downloads', 'signal');

        this.rootDir = rootDir || (process.env.COMPANION_ROOT && fs.existsSync(process.env.COMPANION_ROOT)
            ? path.resolve(process.env.COMPANION_ROOT)
            : defaultRootDir);
        this.workspaceDir = workspaceDir || path.resolve(__dirname, '..');
        
        // Setup audit log directory: stored in ROOT_DIR/audit_logs (e.g. C:\Users\DEEPANSHU\Downloads\signal\audit_logs)
        // keeping audit logs external to the repository source tree
        this.primaryLogDir = path.join(this.rootDir, 'audit_logs');
        this.secondaryLogDir = this.primaryLogDir;

        this.ensureDir(this.primaryLogDir);

        // Migrate any remaining legacy audit logs found in the repository workspace to the central signal directory
        this._migrateLegacyRepoLogs();

        // Active session file streams: sessionId -> { jsonlStream, logStream, metadata, startTime }
        this.sessions = new Map();

        console.log(`[AuditManager] Initialized. Audit log dir: ${this.primaryLogDir}`);
    }

    _migrateLegacyRepoLogs() {
        try {
            const legacyRepoDir = path.join(this.workspaceDir, 'audit_logs');
            if (fs.existsSync(legacyRepoDir) && path.resolve(legacyRepoDir) !== path.resolve(this.primaryLogDir)) {
                const files = fs.readdirSync(legacyRepoDir);
                let migratedCount = 0;
                for (const file of files) {
                    const src = path.join(legacyRepoDir, file);
                    const dest = path.join(this.primaryLogDir, file);
                    try {
                        const stat = fs.statSync(src);
                        if (stat.isFile()) {
                            if (!fs.existsSync(dest)) {
                                fs.copyFileSync(src, dest);
                            }
                            fs.unlinkSync(src);
                            migratedCount++;
                        }
                    } catch (_) {}
                }
                // Try to remove the empty legacy folder if it has no items
                try {
                    const remaining = fs.readdirSync(legacyRepoDir);
                    if (remaining.length === 0) {
                        fs.rmdirSync(legacyRepoDir);
                    }
                } catch (_) {}
                if (migratedCount > 0) {
                    console.log(`[AuditManager] Migrated ${migratedCount} legacy audit logs from repository to ${this.primaryLogDir}`);
                }
            }
        } catch (err) {
            console.warn('[AuditManager] Legacy log migration notice:', err.message);
        }
    }

    ensureDir(dirPath) {
        try {
            if (!fs.existsSync(dirPath)) {
                fs.mkdirSync(dirPath, { recursive: true });
            }
        } catch (err) {
            console.error(`[AuditManager] Failed to create directory ${dirPath}:`, err.message);
        }
    }

    /**
     * Start a new audit logging session
     */
    startSession(sessionData = {}) {
        const sessionId = sessionData.sessionId || `session_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`;
        const startTime = sessionData.timestamp ? new Date(sessionData.timestamp) : new Date();
        const timeFormatted = startTime.toISOString().replace(/[:.]/g, '-');

        const baseFileName = `audit_${sessionId}_${timeFormatted}`;
        const jsonlFileName = `${baseFileName}.jsonl`;
        const logFileName = `${baseFileName}.log`;
        const summaryFileName = `${baseFileName}_summary.json`;

        const jsonlPath = path.join(this.primaryLogDir, jsonlFileName);
        const logPath = path.join(this.primaryLogDir, logFileName);
        const summaryPath = path.join(this.primaryLogDir, summaryFileName);

        // If a session with this ID is already active, close it first to release OS file locks
        if (this.sessions.has(sessionId)) {
            const oldSession = this.sessions.get(sessionId);
            try { oldSession.jsonlStream?.end(); } catch (_) {}
            try { oldSession.logStream?.end(); } catch (_) {}
            this.sessions.delete(sessionId);
        }

        const jsonlStream = fs.createWriteStream(jsonlPath, { flags: 'a', encoding: 'utf8' });
        const logStream = fs.createWriteStream(logPath, { flags: 'a', encoding: 'utf8' });

        jsonlStream.on('error', (err) => {
            console.warn(`[AuditManager] JSONL stream warning for ${sessionId}:`, err.message);
        });
        logStream.on('error', (err) => {
            console.warn(`[AuditManager] Log stream warning for ${sessionId}:`, err.message);
        });

        const sessionObj = {
            sessionId,
            startTime: startTime.toISOString(),
            startEpochMs: startTime.getTime(),
            baseFileName,
            jsonlPath,
            logPath,
            summaryPath,
            jsonlStream,
            logStream,
            eventCount: 0,
            url: sessionData.url || '',
            pageTitle: sessionData.pageTitle || '',
            parameters: sessionData.parameters || {},
            scannedFields: [],
            movements: [],
            corrections: [],
            turns: 0,
            ended: false
        };

        this.sessions.set(sessionId, sessionObj);

        // Write header to .log
        const header = [
            '================================================================================',
            '                    VOICE FORM ASSISTANT — AUDIT LOG TRAIL',
            `Session ID:  ${sessionId}`,
            `Started At:  ${startTime.toISOString()} (${startTime.toLocaleString()})`,
            `Page URL:    ${sessionData.url || '(No URL provided)'}`,
            `Page Title:  ${sessionData.pageTitle || '(No Title)'}`,
            '================================================================================\n'
        ].join('\n');
        logStream.write(header);

        // Record start session event
        this.appendEvent(sessionId, {
            category: 'SESSION',
            event: 'SESSION_STARTED',
            level: 'INFO',
            timestamp: startTime.toISOString(),
            epochMs: startTime.getTime(),
            sessionElapsedMs: 0,
            data: {
                sessionId,
                url: sessionData.url,
                pageTitle: sessionData.pageTitle,
                userAgent: sessionData.userAgent,
                language: sessionData.language
            }
        });

        // Record parameters snapshot if provided
        if (sessionData.parameters && Object.keys(sessionData.parameters).length > 0) {
            this.appendEvent(sessionId, {
                category: 'PARAMETERS',
                event: 'SESSION_CONFIG_SNAPSHOT',
                level: 'INFO',
                timestamp: startTime.toISOString(),
                epochMs: startTime.getTime(),
                sessionElapsedMs: 0,
                data: sessionData.parameters
            });
        }

        return {
            sessionId,
            jsonlPath,
            logPath,
            summaryPath
        };
    }

    /**
     * Append a single audit event
     */
    appendEvent(sessionId, event) {
        let session = this.sessions.get(sessionId);
        if (!session) {
            // Auto-create session if not explicitly started
            this.startSession({ sessionId });
            session = this.sessions.get(sessionId);
        }

        session.eventCount++;
        const now = Date.now();
        const timestamp = event.timestamp || new Date(now).toISOString();
        const epochMs = event.epochMs || now;
        const sessionElapsedMs = event.sessionElapsedMs !== undefined ? event.sessionElapsedMs : (epochMs - session.startEpochMs);

        const structuredEvent = {
            sessionId,
            seq: session.eventCount,
            timestamp,
            epochMs,
            sessionElapsedMs,
            category: event.category || 'GENERAL',
            event: event.event || 'UNKNOWN_EVENT',
            level: event.level || 'INFO',
            timingMs: event.timingMs,
            data: event.data || {}
        };

        // 1. Write to JSONL
        try {
            session.jsonlStream.write(JSON.stringify(structuredEvent) + '\n');
        } catch (err) {
            console.error(`[AuditManager] JSONL write error for ${sessionId}:`, err.message);
        }

        // 2. Format and write to human-readable .log
        try {
            const formattedLogLine = this.formatEventForLog(structuredEvent);
            if (formattedLogLine) {
                session.logStream.write(formattedLogLine + '\n');
            }
        } catch (err) {
            console.error(`[AuditManager] Log stream write error for ${sessionId}:`, err.message);
        }

        // Track key session entities for final summary
        if (event.event === 'FORM_FIELDS_SCANNED' && Array.isArray(event.data?.fields)) {
            session.scannedFields = event.data.fields;
        } else if (event.event === 'FIELD_MOVEMENT') {
            session.movements.push(event.data);
        } else if (event.event === 'CORRECTION_PROCESSED') {
            session.corrections.push(event.data);
        } else if (event.event === 'STT_FINAL_UTTERANCE') {
            session.turns++;
        }

        return structuredEvent;
    }

    /**
     * Batch append events
     */
    appendBatch(sessionId, events) {
        if (!Array.isArray(events)) return [];
        return events.map(ev => this.appendEvent(sessionId, ev));
    }

    /**
     * End session and write summary file
     */
    async endSession(sessionId, summaryData = {}) {
        const session = this.sessions.get(sessionId);
        if (!session) return null;

        const endEpoch = Date.now();
        const totalDurationMs = endEpoch - session.startEpochMs;

        // Record end event
        this.appendEvent(sessionId, {
            category: 'SESSION',
            event: 'SESSION_ENDED',
            level: 'INFO',
            data: {
                totalDurationMs,
                totalEvents: session.eventCount,
                turnsCount: session.turns,
                movementsCount: session.movements.length,
                correctionsCount: session.corrections.length,
                summary: summaryData
            }
        });

        // Close streams and await complete disk flush
        const footer = [
            '\n================================================================================',
            `SESSION COMPLETED: ${new Date(endEpoch).toISOString()}`,
            `Total Duration:    ${(totalDurationMs / 1000).toFixed(2)}s (${totalDurationMs} ms)`,
            `Total Events:      ${session.eventCount}`,
            `Speech Turns:      ${session.turns}`,
            `Field Movements:   ${session.movements.length}`,
            `Corrections Made:  ${session.corrections.length}`,
            '================================================================================\n'
        ].join('\n');

        await new Promise((resolve) => {
            let logDone = false;
            let jsonlDone = false;
            let timer = null;
            const finish = () => {
                if (timer) clearTimeout(timer);
                resolve();
            };
            const check = () => {
                if (logDone && jsonlDone) finish();
            };
            // Hard timeout: never hang longer than 400ms under any circumstances
            timer = setTimeout(finish, 400);

            const onLogEnd = () => { logDone = true; check(); };
            const onJsonlEnd = () => { jsonlDone = true; check(); };

            session.logStream.once('finish', onLogEnd);
            session.logStream.once('close', onLogEnd);
            session.logStream.once('error', onLogEnd);

            session.jsonlStream.once('finish', onJsonlEnd);
            session.jsonlStream.once('close', onJsonlEnd);
            session.jsonlStream.once('error', onJsonlEnd);

            try {
                session.logStream.end(footer);
                session.jsonlStream.end();
            } catch (err) {
                console.error(`[AuditManager] Stream close error:`, err.message);
                finish();
            }
        });

        // Write summary JSON
        const summary = {
            sessionId: session.sessionId,
            startTime: session.startTime,
            endTime: new Date(endEpoch).toISOString(),
            durationMs: totalDurationMs,
            url: session.url,
            pageTitle: session.pageTitle,
            parameters: session.parameters,
            totalFieldsScanned: session.scannedFields.length,
            scannedFields: session.scannedFields,
            totalTurns: session.turns,
            totalMovements: session.movements.length,
            totalCorrections: session.corrections.length,
            movements: session.movements,
            corrections: session.corrections,
            summaryData
        };

        try {
            fs.writeFileSync(session.summaryPath, JSON.stringify(summary, null, 2), 'utf8');
        } catch (err) {
            console.error(`[AuditManager] Summary write error:`, err.message);
        }

        session.ended = true;
        this.sessions.delete(sessionId);

        return summary;
    }

    /**
     * Closes and flushes all active audit sessions, freeing file handles.
     */
    async closeAllSessions(reason = 'SERVER_RESTART') {
        const activeIds = Array.from(this.sessions.keys());
        for (const sid of activeIds) {
            try {
                await this.endSession(sid, { reason });
            } catch (err) {
                console.warn(`[AuditManager] Error closing session ${sid}:`, err.message);
            }
        }
        this.sessions.clear();
    }

    /**
     * Format an event into human-readable timeline presentation
     */
    formatEventForLog(ev) {
        const timeStr = new Date(ev.epochMs).toLocaleTimeString('en-GB', { hour12: false }) + '.' + String(ev.epochMs % 1000).padStart(3, '0');
        const offsetStr = `+${ev.sessionElapsedMs}ms`.padStart(8);
        const prefix = `[${timeStr} ${offsetStr}] [${ev.category}]`;

        const d = ev.data || {};

        switch (ev.event) {
            case 'SESSION_STARTED':
                return `${prefix} Session Started on URL: "${d.url || 'N/A'}" (Title: "${d.pageTitle || 'N/A'}")`;

            case 'SESSION_CONFIG_SNAPSHOT': {
                const lines = [`${prefix} System Runtime Parameters Snapshot:`];
                lines.push(`  • Confirmation Debounce:  ${d.CONFIRM_DEBOUNCE_MS ?? d.confirmDebounceMs ?? 1000} ms`);
                lines.push(`  • VAD Threshold:          ${d.VAD_THRESHOLD ?? d.vadThreshold ?? 0.5}`);
                lines.push(`  • VAD Min Speech Frames:  ${d.VAD_MIN_SPEECH ?? d.vadMinSpeech ?? 3}`);
                lines.push(`  • VAD Min Silence Frames: ${d.VAD_MIN_SILENCE ?? d.vadMinSilence ?? 25}`);
                lines.push(`  • Silence Timeout:        ${d.SILENCE_MS ?? d.silenceMs ?? 800} ms`);
                lines.push(`  • Max Turn Length:        ${d.MAX_TURN_MS ?? d.maxTurnMs ?? 12000} ms`);
                lines.push(`  • Pre-roll Audio Padding: ${d.VAD_PAD_MS ?? d.vadPadMs ?? 200} ms`);
                lines.push(`  • Speech RMS Threshold:   ${d.SPEECH_RMS_THRESHOLD ?? d.speechRmsThreshold ?? 0.012}`);
                lines.push(`  • Target Audio Rate:      ${d.TARGET_RATE ?? d.targetRate ?? 16000} Hz`);
                lines.push(`  • STT WebSocket URL:      ${d.wsUrl || 'ws://127.0.0.1:8081'}`);
                lines.push(`  • LLM Proxy Endpoint:     ${d.llmUrl || 'http://127.0.0.1:8000/v1/chat/completions'}`);
                lines.push(`  • Active Language:        ${d.language || 'hi-IN'}`);
                return lines.join('\n');
            }

            case 'PARAMETER_CHANGED':
                return `${prefix} PARAMETER MODIFIED: "${d.parameter}" changed from "${d.oldValue}" -> "${d.newValue}"`;

            case 'FORM_FIELDS_SCANNED': {
                const fields = d.fields || [];
                const lines = [`${prefix} Form Fields Scanned (Total: ${fields.length}) from "${d.url || ''}":`];
                if (fields.length > 0) {
                    lines.push('  ┌─────┬──────────────────────────────┬────────────┬──────────┬─────────────────────────────┐');
                    lines.push('  │   # │ Field Label                  │ Type       │ Required │ Current/Initial Value       │');
                    lines.push('  ├─────┼──────────────────────────────┼────────────┼──────────┼─────────────────────────────┤');
                    fields.forEach((f, idx) => {
                        const num = String(idx + 1).padStart(3);
                        const label = String(f.label || f.name || f.id || '').substring(0, 28).padEnd(28);
                        const type = String(f.type || 'text').substring(0, 10).padEnd(10);
                        const req = (f.required ? 'YES' : 'NO').padEnd(8);
                        const val = String(f.currentValue || '(empty)').substring(0, 27).padEnd(27);
                        lines.push(`  │ ${num} │ ${label} │ ${type} │ ${req} │ ${val} │`);
                    });
                    lines.push('  └─────┴──────────────────────────────┴────────────┴──────────┴─────────────────────────────┘');
                } else {
                    lines.push('  (No form input fields detected on page)');
                }
                return lines.join('\n');
            }

            case 'FORM_FIELDS_MUTATED':
                return `${prefix} DOM Mutation Detected: Scanned fields count updated to ${d.newCount || 0} (delta: ${d.delta || 0})`;

            case 'FIELD_MOVEMENT': {
                const prev = d.previousField;
                const curr = d.currentField;
                const trigger = d.trigger || 'UNKNOWN_TRANSITION';
                const lines = [`${prefix} [FIELD MOVEMENT: ${trigger}]`];
                if (prev) {
                    lines.push(`  ◄ PREVIOUS FIELD: #${prev.index !== undefined ? prev.index + 1 : '?'} "${prev.label || 'Unknown'}" (Value: "${prev.value || ''}", Status: ${prev.status || 'tentative'})`);
                } else {
                    lines.push(`  ◄ PREVIOUS FIELD: (None - Flow Initiation)`);
                }
                if (curr) {
                    lines.push(`  ► CURRENT FIELD:  #${curr.index !== undefined ? curr.index + 1 : '?'} "${curr.label || 'Unknown'}" (Type: ${curr.type || 'text'}, Required: ${curr.required ? 'YES' : 'NO'}, Value: "${curr.value || ''}")`);
                } else {
                    lines.push(`  ► CURRENT FIELD:  (None - Flow Finished)`);
                }
                if (d.ttsPrompt) {
                    lines.push(`  ► Spoken Assistant Prompt: "${d.ttsPrompt}"`);
                }
                return lines.join('\n');
            }

            case 'AUDIO_SPEECH_START':
                return `${prefix} Speech Detected (VAD Prob: ${d.vadProb !== undefined ? d.vadProb.toFixed(3) : 'N/A'}, RMS: ${d.rms !== undefined ? d.rms.toFixed(4) : 'N/A'})`;

            case 'AUDIO_CHUNK_DUMP':
                return `${prefix} Audio Chunk Dumped -> STT: #${d.chunkIndex} (${d.samplesCount} samples, ${d.bytesCount} bytes, buffered: ${d.bufferState || 0}B)`;

            case 'AUDIO_TURN_COMMIT':
                return `${prefix} Audio Buffer Finalized & Committed -> STT (Reason: ${d.reason || 'silence'}, Speech Duration: ${d.speechDurationMs || 0}ms, Silence: ${d.silenceMs || 0}ms)`;

            case 'CONFIRMATION_DEBOUNCE_START':
                return `${prefix} [CONFIRMATION DEBOUNCE STARTED] Configured Delay: ${d.debounceMs}ms. Candidate text: "${d.candidateText}"`;

            case 'CONFIRMATION_DEBOUNCE_EXTENDED':
                return `${prefix} [CONFIRMATION DEBOUNCE EXTENDED] New incoming text: "${d.newText}". Updated merged buffer: "${d.currentBuffer}". Resetting timer to ${d.debounceMs}ms.`;

            case 'CONFIRMATION_DEBOUNCE_FIRED':
                return `${prefix} [CONFIRMATION DEBOUNCE FIRED] Dumped merged buffer to Router after ${d.elapsedMs}ms elapsed (Configured: ${d.configuredDebounceMs}ms). Merged: "${d.mergedText}"`;

            case 'STT_FINAL_UTTERANCE': {
                const lines = [`${prefix} [STT FINAL UTTERANCE RECEIVED] (Roundtrip Latency: ${d.latencyMs ?? '?'}ms)`];
                lines.push(`  • Server Transcript: "${d.serverTranscript || ''}"`);
                lines.push(`  • Live Text Buffer:  "${d.liveTranscript || ''}"`);
                lines.push(`  • Final Chosen:      "${d.finalChosenTranscript || ''}"`);
                lines.push(`  • Wake-word Gating:  ${d.gateResult?.allow ? 'PASSED (Active)' : 'BLOCKED (Asleep)'}`);
                return lines.join('\n');
            }

            case 'INTENT_CLASSIFIED': {
                const lines = [`${prefix} [INTENT CLASSIFIED] (Latency: ${d.latencyMs ?? '?'}ms, Source: ${d.source || 'Tier 1 Heuristic'})`];
                lines.push(`  • Input Utterance:   "${d.inputText || ''}"`);
                lines.push(`  • Active Field:      #${d.fieldContext?.index !== undefined ? d.fieldContext.index + 1 : '?'} "${d.fieldContext?.label || 'None'}"`);
                lines.push(`  • Classified Type:   ${d.classifiedIntent?.type || 'UNKNOWN'}`);
                if (d.classifiedIntent?.action?.verb) {
                    lines.push(`  • Action Verb:       ${d.classifiedIntent.action.verb} (Target: #${d.classifiedIntent.action.targetIndex !== undefined ? d.classifiedIntent.action.targetIndex + 1 : 'N/A'})`);
                }
                if (d.classifiedIntent?.payload) {
                    lines.push(`  • Extracted Payload: "${d.classifiedIntent.payload}"`);
                }
                if (d.llmDetails) {
                    lines.push(`  • LLM Fallback Used: Duration=${d.llmDetails.durationMs}ms, Raw="${(d.llmDetails.rawResponse || '').replace(/\n/g, ' ')}"`);
                }
                return lines.join('\n');
            }

            case 'CORRECTION_PROCESSED': {
                const lines = [`${prefix} [CORRECTION PROCESSED] (Method: ${d.method || 'Local'}, Latency: ${d.latencyMs ?? '?'}ms)`];
                lines.push(`  • Target Field:      #${d.fieldContext?.index !== undefined ? d.fieldContext.index + 1 : '?'} "${d.fieldContext?.label || ''}" (${d.isHistoricalCorrection ? 'HISTORICAL CROSS-FIELD' : 'ACTIVE FIELD'})`);
                lines.push(`  • Spoken Instruction:"${d.instruction || ''}"`);
                lines.push(`  • Value Before:      "${d.previousValue || ''}"`);
                lines.push(`  • Value After:       "${d.finalValue || ''}"`);
                lines.push(`  • Value Diff:        "${d.previousValue || ''}" ──► "${d.finalValue || ''}"`);
                if (d.llmDetails) {
                    lines.push(`  • LLM Prompt Sent:   System: "${(d.llmDetails.systemPrompt || '').substring(0, 60)}..."`);
                    lines.push(`  • LLM User Prompt:   "${(d.llmDetails.userPrompt || '').replace(/\n/g, ' | ')}"`);
                    lines.push(`  • LLM Raw Response:  "${d.llmDetails.rawResponse || ''}"`);
                    lines.push(`  • LLM Roundtrip:     ${d.llmDetails.latencyMs || '?'} ms`);
                }
                return lines.join('\n');
            }

            case 'ACTION_EXECUTED':
                return `${prefix} Action Executed: ${d.verb || 'ACTION'} (Target: #${d.targetIndex !== undefined ? d.targetIndex + 1 : 'N/A'})`;

            case 'SESSION_ENDED':
                return `${prefix} Session Finalized. Total Duration: ${((d.totalDurationMs || 0) / 1000).toFixed(2)}s, Events: ${d.totalEvents || 0}, Turns: ${d.turnsCount || 0}`;

            default:
                return `${prefix} [${ev.event}] ${JSON.stringify(d)}`;
        }
    }

    /**
     * List all logged sessions
     */
    listSessions() {
        try {
            const files = fs.readdirSync(this.primaryLogDir);
            const sessionsMap = new Map();

            for (const f of files) {
                const match = f.match(/^audit_(.+?)_([0-9T\-Zz]+)(?:_summary\.json|\.(jsonl|log))$/);
                if (match) {
                    const sessionId = match[1];
                    const timestamp = match[2];
                    const isSummary = f.endsWith('_summary.json');
                    const ext = isSummary ? '_summary.json' : match[3];

                    if (!sessionsMap.has(sessionId)) {
                        sessionsMap.set(sessionId, {
                            sessionId,
                            timestamp,
                            hasJsonl: false,
                            hasLog: false,
                            hasSummary: false,
                            jsonlFile: null,
                            logFile: null,
                            summaryFile: null
                        });
                    }
                    const s = sessionsMap.get(sessionId);
                    if (ext === 'jsonl') { s.hasJsonl = true; s.jsonlFile = f; }
                    if (ext === 'log') { s.hasLog = true; s.logFile = f; }
                    if (isSummary) { s.hasSummary = true; s.summaryFile = f; }
                }
            }

            return Array.from(sessionsMap.values()).reverse();
        } catch (err) {
            console.error('[AuditManager] Error listing sessions:', err.message);
            return [];
        }
    }

    /**
     * Get session log content
     */
    getSessionContent(sessionId, format = 'log') {
        const list = this.listSessions();
        const found = list.find(s => s.sessionId === sessionId);
        if (!found) return null;

        let filename = null;
        if (format === 'jsonl') filename = found.jsonlFile;
        else if (format === 'summary') filename = found.summaryFile;
        else filename = found.logFile;

        if (!filename) return null;
        const filePath = path.join(this.primaryLogDir, filename);
        if (!fs.existsSync(filePath)) return null;

        return {
            filename,
            filePath,
            content: fs.readFileSync(filePath, 'utf8')
        };
    }
}

module.exports = { AuditManager };
