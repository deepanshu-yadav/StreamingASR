/**
 * AuditLogger.js
 * 
 * Browser Extension Client Audit Logging Infrastructure:
 * Captures an exhaustive, chronologically accurate audit trail of all form assistant operations:
 * 
 * 1. Form fields scanned inventory & subsequent DOM mutations
 * 2. Movements across form fields (previousField -> currentField transition, statuses, triggers)
 * 3. Audio chunk streaming, VAD speech turns, and commit timestamps
 * 4. Confirmation debounce buffer lifecycle (starts, extensions, fire timing, and STT dumps)
 * 5. Final STT server utterances, live vs server transcript resolution, and wake word gating
 * 6. Intent classification (Tier 1 Heuristic matches vs Tier 2 LLM prompts, latencies, decisions)
 * 7. Corrections (Local regex patch matches vs LLM correction prompts, parameters, raw responses, diffs)
 * 8. System parameters snapshots and real-time parameter slider adjustments
 * 9. Sub-millisecond timing for every action and round-trip latency
 * 
 * Dual persistence:
 * - Real-time sync to local Companion Orchestrator (/api/audit/...) for disk persistence (.jsonl & .log)
 * - In-memory and browser storage fallback with direct one-click download (.jsonl & .log)
 */

(function () {
    'use strict';

    class AuditLogger {
        constructor(options = {}) {
            this.companionUrl = options.companionUrl || 'http://127.0.0.1:8000';
            this.sessionId = null;
            this.sessionStartTime = null;
            this.sessionStartEpoch = 0;
            this.sessionStartPerf = 0;
            this.pageInfo = {};
            this.parameters = {};
            this.events = [];
            this.pendingQueue = [];
            this.isFlushing = false;
            this.flushTimer = null;
            this.listeners = new Set();
            this.isCompanionConnected = false;

            this.startFlushInterval();
        }

        /**
         * Initialize or restart an audit session
         */
        startSession(pageInfo = {}, initialParams = {}) {
            const now = Date.now();
            this.sessionId = `session_${now}_${Math.random().toString(36).substring(2, 8)}`;
            this.sessionStartTime = new Date(now).toISOString();
            this.sessionStartEpoch = now;
            this.sessionStartPerf = performance.now();
            this.pageInfo = {
                url: pageInfo.url || (typeof window !== 'undefined' ? window.location?.href : ''),
                pageTitle: pageInfo.pageTitle || (typeof document !== 'undefined' ? document.title : ''),
                tabId: pageInfo.tabId || null,
                language: pageInfo.language || 'hi-IN'
            };
            this.parameters = { ...initialParams };
            this.events = [];
            this.pendingQueue = [];

            // Notify companion server of session creation
            this.notifyCompanionStart();

            // Record initial configuration snapshot
            this.recordEvent('PARAMETERS', 'SESSION_CONFIG_SNAPSHOT', {
                ...this.parameters,
                url: this.pageInfo.url,
                pageTitle: this.pageInfo.pageTitle,
                language: this.pageInfo.language
            });

            console.log(`[AuditLogger] New Audit Session initialized: ${this.sessionId}`);
            return this.sessionId;
        }

        async notifyCompanionStart() {
            try {
                const resp = await fetch(`${this.companionUrl}/api/audit/session/start`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        sessionId: this.sessionId,
                        timestamp: this.sessionStartTime,
                        url: this.pageInfo.url,
                        pageTitle: this.pageInfo.pageTitle,
                        language: this.pageInfo.language,
                        parameters: this.parameters
                    })
                });
                if (resp.ok) {
                    this.isCompanionConnected = true;
                }
            } catch (_) {
                this.isCompanionConnected = false;
            }
        }

        /**
         * Core Event Ingestion with Sub-Millisecond Precision
         */
        recordEvent(category, eventType, data = {}, timingMetrics = {}) {
            if (!this.sessionId) {
                const initialInfo = {
                    url: data.url || this.pageInfo.url || (typeof window !== 'undefined' ? window.location?.href : ''),
                    pageTitle: data.pageTitle || this.pageInfo.pageTitle || (typeof document !== 'undefined' ? document.title : ''),
                    tabId: data.tabId || this.pageInfo.tabId || null,
                    language: data.language || this.pageInfo.language || 'hi-IN'
                };
                this.startSession(initialInfo, this.parameters);
            }

            const epochMs = Date.now();
            const sessionElapsedMs = Math.round(performance.now() - this.sessionStartPerf);
            const isoTime = new Date(epochMs).toISOString();

            const eventObj = {
                sessionId: this.sessionId,
                seq: this.events.length + 1,
                timestamp: isoTime,
                epochMs,
                sessionElapsedMs,
                category: category || 'GENERAL',
                event: eventType || 'GENERIC_EVENT',
                timingMs: timingMetrics.latencyMs ?? timingMetrics.durationMs ?? undefined,
                data: { ...data, ...timingMetrics }
            };

            this.events.push(eventObj);
            this.pendingQueue.push(eventObj);

            // Notify UI listeners
            for (const listener of this.listeners) {
                try { listener(eventObj); } catch (_) { }
            }

            // High-priority events flush immediately
            const urgentEvents = [
                'FORM_FIELDS_SCANNED',
                'FIELD_MOVEMENT',
                'STT_FINAL_UTTERANCE',
                'CONFIRMATION_DEBOUNCE_FIRED',
                'INTENT_CLASSIFIED',
                'CORRECTION_PROCESSED'
            ];
            if (urgentEvents.includes(eventType)) {
                this.flushQueue();
            }

            return eventObj;
        }

        /**
         * 1. PARAMETERS LOGGING
         */
        logParametersSnapshot(params) {
            this.parameters = { ...this.parameters, ...params };
            return this.recordEvent('PARAMETERS', 'SESSION_CONFIG_SNAPSHOT', params);
        }

        logParameterChange(parameter, oldValue, newValue) {
            if (this.parameters) {
                this.parameters[parameter] = newValue;
            }
            return this.recordEvent('PARAMETERS', 'PARAMETER_CHANGED', {
                parameter,
                oldValue,
                newValue
            });
        }

        /**
         * 2. FORM FIELDS SCANNING LOGGING
         */
        logFieldsScanned(fields, pageInfo = {}) {
            if (pageInfo.url) this.pageInfo.url = pageInfo.url;
            if (pageInfo.pageTitle) this.pageInfo.pageTitle = pageInfo.pageTitle;

            const sanitizedFields = (fields || []).map((f, idx) => ({
                index: idx,
                id: f.id || `field_${idx}`,
                name: f.name || '',
                label: f.label || '',
                type: f.type || 'text',
                required: !!f.required,
                currentValue: f.currentValue || '',
                initialValue: f.initialValue || f.currentValue || '',
                selector: f.selector || '',
                placeholder: f.placeholder || '',
                options: f.options ? f.options.slice(0, 20) : undefined
            }));

            return this.recordEvent('SCAN', 'FORM_FIELDS_SCANNED', {
                url: this.pageInfo.url,
                pageTitle: this.pageInfo.pageTitle,
                count: sanitizedFields.length,
                fields: sanitizedFields
            });
        }

        logFieldsMutated(fields, diff = {}) {
            return this.recordEvent('SCAN', 'FORM_FIELDS_MUTATED', {
                newCount: fields?.length || 0,
                diff
            });
        }

        /**
         * 3. FIELD MOVEMENT LOGGING (previous field -> current field)
         */
        logFieldMovement({ previousField = null, currentField = null, trigger = 'SEQUENTIAL_ADVANCE', ttsPrompt = '' }) {
            const formatField = (f) => {
                if (!f) return null;
                return {
                    index: f.index !== undefined ? f.index : null,
                    id: f.id || null,
                    name: f.name || null,
                    label: f.label || null,
                    type: f.type || 'text',
                    value: f.value !== undefined ? f.value : (f.currentValue || ''),
                    status: f.status || (f.confirmed ? 'CONFIRMED' : (f.tentative ? 'TENTATIVE' : 'PENDING')),
                    required: !!f.required
                };
            };

            return this.recordEvent('MOVEMENT', 'FIELD_MOVEMENT', {
                trigger,
                previousField: formatField(previousField),
                currentField: formatField(currentField),
                ttsPrompt
            });
        }

        /**
         * 4. AUDIO DUMPING & STT COMMITS
         */
        logAudioSpeechStart({ vadProb, rms }) {
            return this.recordEvent('AUDIO_DUMP', 'AUDIO_SPEECH_START', {
                vadProb,
                rms
            });
        }

        logAudioChunkDump({ chunkIndex, samplesCount, bytesCount, bufferState }) {
            return this.recordEvent('AUDIO_DUMP', 'AUDIO_CHUNK_DUMP', {
                chunkIndex,
                samplesCount,
                bytesCount,
                bufferState
            });
        }

        logAudioTurnCommit({ reason = 'silence', speechDurationMs = 0, silenceMs = 0 }) {
            return this.recordEvent('AUDIO_DUMP', 'AUDIO_TURN_COMMIT', {
                reason,
                speechDurationMs,
                silenceMs
            });
        }

        /**
         * 5. CONFIRMATION DEBOUNCE LIFECYCLE
         */
        logConfirmationDebounceStart({ candidateText, debounceMs }) {
            return this.recordEvent('DEBOUNCE', 'CONFIRMATION_DEBOUNCE_START', {
                candidateText,
                debounceMs,
                scheduledFireEpoch: Date.now() + debounceMs
            });
        }

        logConfirmationDebounceExtended({ newText, currentBuffer, debounceMs }) {
            return this.recordEvent('DEBOUNCE', 'CONFIRMATION_DEBOUNCE_EXTENDED', {
                newText,
                currentBuffer,
                debounceMs,
                rescheduledFireEpoch: Date.now() + debounceMs
            });
        }

        logConfirmationDebounceFired({ mergedText, elapsedMs, configuredDebounceMs }) {
            return this.recordEvent('DEBOUNCE', 'CONFIRMATION_DEBOUNCE_FIRED', {
                mergedText,
                elapsedMs,
                configuredDebounceMs,
                delayDriftMs: elapsedMs - configuredDebounceMs
            });
        }

        /**
         * 6. STT FINAL UTTERANCE LOGGING
         */
        logSttFinalUtterance({ serverTranscript, liveTranscript, finalChosenTranscript, latencyMs = 0, gateResult = { allow: true } }) {
            return this.recordEvent('STT', 'STT_FINAL_UTTERANCE', {
                serverTranscript,
                liveTranscript,
                finalChosenTranscript,
                latencyMs,
                gateResult
            }, { latencyMs });
        }

        /**
         * 7. INTENT CLASSIFICATION LOGGING
         */
        logIntentClassified({ inputText, fieldContext, tier = 1, source = 'heuristic', heuristicDetails = null, llmDetails = null, classifiedIntent = {}, latencyMs = 0 }) {
            return this.recordEvent('INTENT', 'INTENT_CLASSIFIED', {
                inputText,
                fieldContext: {
                    index: fieldContext?.index,
                    id: fieldContext?.id,
                    label: fieldContext?.label,
                    type: fieldContext?.type
                },
                tier,
                source,
                heuristicDetails,
                llmDetails,
                classifiedIntent,
                latencyMs
            }, { latencyMs });
        }

        /**
         * 8. CORRECTION LOGGING (Regex & LLM)
         */
        logCorrectionProcessed({
            fieldContext,
            previousValue,
            instruction,
            method = 'local_regex',
            isHistoricalCorrection = false,
            historicalTargetIndex = null,
            regexDetails = null,
            llmDetails = null,
            finalValue,
            latencyMs = 0
        }) {
            return this.recordEvent('CORRECTION', 'CORRECTION_PROCESSED', {
                fieldContext: {
                    index: fieldContext?.index,
                    id: fieldContext?.id,
                    label: fieldContext?.label
                },
                isHistoricalCorrection,
                historicalTargetIndex,
                previousValue,
                instruction,
                method,
                regexDetails,
                llmDetails,
                finalValue,
                latencyMs
            }, { latencyMs });
        }

        /**
         * 9. ACTION EXECUTION
         */
        logActionExecuted({ verb, targetIndex = null, context = {} }) {
            return this.recordEvent('ACTION', 'ACTION_EXECUTED', {
                verb,
                targetIndex,
                context
            });
        }

        /**
         * End session
         */
        async endSession(reason = 'completed', summaryData = {}) {
            const sid = this.sessionId;
            if (!sid) return null;
            this.sessionId = null; // Clear immediately so subsequent calls start fresh without waiting

            const endEpoch = Date.now();
            const totalDurationMs = endEpoch - this.sessionStartEpoch;

            const endEvent = this.recordEvent('SESSION', 'SESSION_ENDED', {
                reason,
                totalDurationMs,
                totalEvents: this.events.length,
                summaryData
            });

            // Flush remaining events and notify companion in background with safety timeout
            (async () => {
                try {
                    await this.flushQueue();
                    const controller = new AbortController();
                    const timer = setTimeout(() => controller.abort(), 800);
                    await fetch(`${this.companionUrl}/api/audit/session/end`, {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({
                            sessionId: sid,
                            summary: {
                                reason,
                                totalDurationMs,
                                totalEvents: this.events.length,
                                ...summaryData
                            }
                        }),
                        signal: controller.signal
                    });
                    clearTimeout(timer);
                } catch (_) {}
            })();

            return endEvent;
        }

        /**
         * Periodic Batch Queue Flush to Companion Server
         */
        startFlushInterval() {
            if (this.flushTimer) clearInterval(this.flushTimer);
            this.flushTimer = setInterval(() => {
                this.flushQueue();
            }, 600);
        }

        async flushQueue() {
            if (this.isFlushing || this.pendingQueue.length === 0 || !this.sessionId) return;
            this.isFlushing = true;
            const batch = this.pendingQueue.splice(0, 50);

            try {
                const resp = await fetch(`${this.companionUrl}/api/audit/batch`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        sessionId: this.sessionId,
                        events: batch
                    })
                });
                if (resp.ok) {
                    this.isCompanionConnected = true;
                } else {
                    // Put back on failure
                    this.pendingQueue.unshift(...batch);
                }
            } catch (_) {
                this.isCompanionConnected = false;
                // Keep in queue for next retry
                this.pendingQueue.unshift(...batch);
            } finally {
                this.isFlushing = false;
            }
        }

        /**
         * Subscribe for live UI updates
         */
        onEvent(callback) {
            if (typeof callback === 'function') {
                this.listeners.add(callback);
            }
            return () => this.listeners.delete(callback);
        }

        /**
         * Direct Export Helpers for In-Browser Downloads
         */
        exportJsonl() {
            return this.events.map(e => JSON.stringify(e)).join('\n');
        }

        exportFormattedLog() {
            const header = [
                '================================================================================',
                '                    VOICE FORM ASSISTANT — AUDIT LOG TRAIL',
                `Session ID:  ${this.sessionId}`,
                `Started At:  ${this.sessionStartTime}`,
                `Page URL:    ${this.pageInfo.url || 'N/A'}`,
                `Page Title:  ${this.pageInfo.pageTitle || 'N/A'}`,
                '================================================================================\n'
            ].join('\n');

            const lines = [header];
            for (const ev of this.events) {
                const timeStr = new Date(ev.epochMs).toLocaleTimeString('en-GB', { hour12: false }) + '.' + String(ev.epochMs % 1000).padStart(3, '0');
                const offsetStr = `+${ev.sessionElapsedMs}ms`.padStart(8);
                const prefix = `[${timeStr} ${offsetStr}] [${ev.category}]`;
                const d = ev.data || {};

                switch (ev.event) {
                    case 'SESSION_CONFIG_SNAPSHOT':
                        lines.push(`${prefix} Parameters: Debounce=${d.CONFIRM_DEBOUNCE_MS || 1000}ms, VAD=${d.VAD_THRESHOLD || 0.5}, Silence=${d.SILENCE_MS || 800}ms, Lang=${d.language || 'hi-IN'}`);
                        break;
                    case 'PARAMETER_CHANGED':
                        lines.push(`${prefix} Parameter Changed: ${d.parameter} "${d.oldValue}" -> "${d.newValue}"`);
                        break;
                    case 'FORM_FIELDS_SCANNED':
                        lines.push(`${prefix} Scanned ${d.count} fields from "${d.url}":`);
                        (d.fields || []).forEach(f => {
                            lines.push(`    • #${f.index + 1} "${f.label}" (${f.type}, required=${f.required})`);
                        });
                        break;
                    case 'FIELD_MOVEMENT':
                        lines.push(`${prefix} MOVEMENT [${d.trigger}]:`);
                        lines.push(`    ◄ PREV: ${d.previousField ? `#${d.previousField.index + 1} "${d.previousField.label}" ("${d.previousField.value}")` : '(None)'}`);
                        lines.push(`    ► CURR: ${d.currentField ? `#${d.currentField.index + 1} "${d.currentField.label}"` : '(None)'}`);
                        if (d.ttsPrompt) lines.push(`    ► Spoken Prompt: "${d.ttsPrompt}"`);
                        break;
                    case 'AUDIO_SPEECH_START':
                        lines.push(`${prefix} Speech Detected (VAD Prob: ${d.vadProb?.toFixed(3)}, RMS: ${d.rms?.toFixed(4)})`);
                        break;
                    case 'AUDIO_TURN_COMMIT':
                        lines.push(`${prefix} Turn Committed to STT (Reason: ${d.reason}, Speech: ${d.speechDurationMs}ms, Silence: ${d.silenceMs}ms)`);
                        break;
                    case 'CONFIRMATION_DEBOUNCE_START':
                        lines.push(`${prefix} Debounce Started (${d.debounceMs}ms): "${d.candidateText}"`);
                        break;
                    case 'CONFIRMATION_DEBOUNCE_EXTENDED':
                        lines.push(`${prefix} Debounce Extended: Buffer="${d.currentBuffer}"`);
                        break;
                    case 'CONFIRMATION_DEBOUNCE_FIRED':
                        lines.push(`${prefix} Debounce Fired (${d.elapsedMs}ms): Dumped merged "${d.mergedText}" to router`);
                        break;
                    case 'STT_FINAL_UTTERANCE':
                        lines.push(`${prefix} STT Completed (Latency: ${d.latencyMs}ms): Server="${d.serverTranscript}", Chosen="${d.finalChosenTranscript}"`);
                        break;
                    case 'INTENT_CLASSIFIED':
                        lines.push(`${prefix} Intent: ${d.classifiedIntent?.type} (Source: ${d.source}, Latency: ${d.latencyMs}ms) for utterance "${d.inputText}"`);
                        break;
                    case 'CORRECTION_PROCESSED':
                        lines.push(`${prefix} Correction Applied (${d.method}, Latency: ${d.latencyMs}ms): Target="${d.fieldContext?.label}", "${d.previousValue}" -> "${d.finalValue}"`);
                        if (d.llmDetails) {
                            lines.push(`    • LLM Prompt: "${d.llmDetails.userPrompt}"`);
                            lines.push(`    • LLM Raw:    "${d.llmDetails.rawResponse}"`);
                        }
                        break;
                    case 'SESSION_ENDED':
                        lines.push(`${prefix} Session Ended. Total duration: ${(d.totalDurationMs / 1000).toFixed(2)}s, Events: ${d.totalEvents}`);
                        break;
                    default:
                        lines.push(`${prefix} [${ev.event}] ${JSON.stringify(d)}`);
                }
            }
            return lines.join('\n');
        }

        /**
         * Browser File Download Trigger
         */
        downloadFile(content, filename, mimeType = 'text/plain') {
            const blob = new Blob([content], { type: mimeType });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = filename;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);
        }

        downloadJsonl() {
            const name = `audit_${this.sessionId || 'session'}_${new Date().toISOString().replace(/[:.]/g, '-')}.jsonl`;
            this.downloadFile(this.exportJsonl(), name, 'application/json');
        }

        downloadFormattedLog() {
            const name = `audit_${this.sessionId || 'session'}_${new Date().toISOString().replace(/[:.]/g, '-')}.log`;
            this.downloadFile(this.exportFormattedLog(), name, 'text/plain');
        }

        formatEventSummary(ev) {
            const d = ev.data || {};
            switch (ev.event) {
                case 'FORM_FIELDS_SCANNED':
                    return `Scanned ${d.count} fields from "${d.url || ''}"`;
                case 'FORM_FIELDS_MUTATED':
                    return `DOM mutation updated fields count to ${d.newCount}`;
                case 'FIELD_MOVEMENT':
                    return `Movement [${d.trigger}]: ${d.previousField ? '#' + (d.previousField.index + 1) + ' ' + d.previousField.label : 'Start'} ➔ ${d.currentField ? '#' + (d.currentField.index + 1) + ' ' + d.currentField.label : 'End'}`;
                case 'AUDIO_SPEECH_START':
                    return `Speech detected (VAD: ${d.vadProb !== undefined ? d.vadProb.toFixed(2) : '0'}, RMS: ${d.rms !== undefined ? d.rms.toFixed(3) : '0'})`;
                case 'AUDIO_TURN_COMMIT':
                    return `Turn committed to STT (${d.reason}, Speech: ${d.speechDurationMs || 0}ms)`;
                case 'CONFIRMATION_DEBOUNCE_START':
                    return `Debounce started (${d.debounceMs}ms): "${d.candidateText || ''}"`;
                case 'CONFIRMATION_DEBOUNCE_EXTENDED':
                    return `Debounce extended: Buffer="${d.currentBuffer || ''}"`;
                case 'CONFIRMATION_DEBOUNCE_FIRED':
                    return `Debounce fired (${d.elapsedMs}ms): Dumped merged "${d.mergedText || ''}" to router`;
                case 'STT_FINAL_UTTERANCE':
                    return `STT utterance (${d.latencyMs || 0}ms): "${d.finalChosenTranscript || ''}"`;
                case 'INTENT_CLASSIFIED':
                    return `Intent: ${d.classifiedIntent?.type || 'UNKNOWN'} (${d.source || 'tier1'}, ${d.latencyMs || 0}ms) for "${d.inputText || ''}"`;
                case 'CORRECTION_PROCESSED':
                    return `Correction (${d.method || 'local'}, ${d.latencyMs || 0}ms): "${d.previousValue || ''}" ➔ "${d.finalValue || ''}"`;
                case 'FIELD_VALUE_CONFIRMED':
                    return `Field #${(d.fieldIndex !== undefined ? d.fieldIndex + 1 : 1)} "${d.fieldLabel || ''}" confirmed: "${d.value || ''}"`;
                case 'ACTION_EXECUTED':
                    return `Action executed: ${d.verb} ${d.targetIndex !== null && d.targetIndex !== undefined ? 'to #' + (d.targetIndex + 1) : ''}`;
                case 'PARAMETER_CHANGED':
                    return `Parameter changed: ${d.parameter} "${d.oldValue}" ➔ "${d.newValue}"`;
                case 'SESSION_CONFIG_SNAPSHOT':
                    return `Config: Debounce=${d.CONFIRM_DEBOUNCE_MS || 1000}ms, VAD=${d.VAD_THRESHOLD || 0.5}, Lang=${d.language || 'hi-IN'}`;
                case 'SESSION_STARTED':
                    return `Session started: ${d.sessionId || ''}`;
                case 'SESSION_ENDED':
                    return `Session ended (${((d.totalDurationMs || 0) / 1000).toFixed(1)}s, ${d.totalEvents || 0} events)`;
                default:
                    return `${ev.event}: ${JSON.stringify(d).substring(0, 80)}`;
            }
        }
    }

    if (typeof window !== 'undefined') {
        window.AuditLogger = AuditLogger;
    }
    if (typeof module !== 'undefined' && module.exports) {
        module.exports = AuditLogger;
    }
})();
