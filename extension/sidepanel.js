(() => {
    // ---------- CONFIG ----------
    const TARGET_RATE = 16000,
        CHUNK_MS = 100,
        BAR_COUNT = 44,
        MAX_WS_BUFFERED_BYTES = 512 * 1024;

    // VAD / RMS defaults
    let VAD_THRESHOLD = 0.50;
    let VAD_MIN_SPEECH = 3;
    let VAD_MIN_SILENCE = 25; // 25 * 32ms = 800 ms
    let MAX_UNCOMMITTED_MS = 12000; // 12 seconds cap
    let VAD_PAD_MS = 200;
    let SPEECH_RMS_THRESHOLD = 0.012;
    let SILENCE_MS = 800;
    let MAX_TURN_MS = 12000;

    // Confirmation debounce (ms)
    let CONFIRM_DEBOUNCE_MS = 1000;

    // ---------- DOM REFS ----------
    const el = {
        wsUrl: document.getElementById('wsUrl'),
        statusPill: document.getElementById('statusPill'),
        statusText: document.getElementById('statusText'),
        turnState: document.getElementById('turnState'),
        turnStateText: document.getElementById('turnStateText'),
        signalStrip: document.getElementById('signalStrip'),
        liveLine: document.getElementById('liveLine'),
        toast: document.getElementById('toast'),
        thresholdSlider: document.getElementById('thresholdSlider'),
        thresholdVal: document.getElementById('thresholdVal'),
        silenceSlider: document.getElementById('silenceSlider'),
        silenceVal: document.getElementById('silenceVal'),
        maxTurnSlider: document.getElementById('maxTurnSlider'),
        maxTurnVal: document.getElementById('maxTurnVal'),
        padSlider: document.getElementById('padSlider'),
        padVal: document.getElementById('padVal'),
        ttsStatus: document.getElementById('ttsStatus'),
        ttsStatusText: document.getElementById('ttsStatusText'),
        interruptBtn: document.getElementById('interruptBtn'),
        micMutedBadge: document.getElementById('micMutedBadge'),
        llmUrl: document.getElementById('llmUrl'),
        debounceSlider: document.getElementById('debounceSlider'),
        debounceVal: document.getElementById('debounceVal'),
        // Form Assistant DOM refs
        formCard: document.getElementById('formCard'),
        formScanBadge: document.getElementById('formScanBadge'),
        formScanBadgeText: document.getElementById('formScanBadgeText'),
        formPageInfo: document.getElementById('formPageInfo'),
        formTabUrl: document.getElementById('formTabUrl'),
        btnScanPage: document.getElementById('btnScanPage'),
        btnStartFormFlow: document.getElementById('btnStartFormFlow'),
        btnStopFormFlow: document.getElementById('btnStopFormFlow'),
        formStepControls: document.getElementById('formStepControls'),
        btnPrevField: document.getElementById('btnPrevField'),
        btnReaskField: document.getElementById('btnReaskField'),
        btnSkipField: document.getElementById('btnSkipField'),
        formActiveSpotlight: document.getElementById('formActiveSpotlight'),
        spotlightStep: document.getElementById('spotlightStep'),
        spotlightStatus: document.getElementById('spotlightStatus'),
        spotlightLabel: document.getElementById('spotlightLabel'),
        spotlightRequired: document.getElementById('spotlightRequired'),
        spotlightPrompt: document.getElementById('spotlightPrompt'),
        spotlightValueBox: document.getElementById('spotlightValueBox'),
        spotlightValue: document.getElementById('spotlightValue'),
        formFieldsAccordion: document.getElementById('formFieldsAccordion'),
        scannedFieldsCount: document.getElementById('scannedFieldsCount'),
        fieldsListContainer: document.getElementById('fieldsListContainer'),
        languageSelect: document.getElementById('languageSelect'),
    };

    // ---------- HELPERS ----------
    function stripTags(s) {
        if (!s) return '';
        return s.toString()
            .replace(/<[a-zA-Z]{2,}(?:-[a-zA-Z0-9]+)?\s*>?/g, '')
            .replace(/<[^>]+>/g, '')
            .trim();
    }

    function escapeHtml(s) {
        return s.replace(/[&<>"']/g, c => ({
            '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;',
            "'": '&#39;'
        }[c]));
    }

    function formatTime(ts) { return new Date(ts).toLocaleTimeString('en-GB', { hour12: false }); }

    function showToast(msg) { el.toast.textContent = msg || ''; }

    function setStatus(state, text) {
        el.statusPill.dataset.state = state;
        el.statusText.textContent = text;
    }

    function setTurnMode(mode, text) {
        el.turnState.dataset.mode = mode;
        el.turnStateText.textContent = text;
    }

    function setTTSStatus(state, text) {
        el.ttsStatus.dataset.tts = state;
        el.ttsStatusText.textContent = text;
    }

    // Clean ASR tags (<hi-IN>, <en-US>), commas, and trailing dandas / periods
    function cleanSpokenTranscript(text) {
        if (!text) return '';
        return text
            .replace(/<[a-zA-Z]{2,}(?:-[a-zA-Z0-9]+)?\s*>?/g, '')
            .replace(/<[^>]+>/g, '')
            .replace(/[,，]/g, ' ')
            .replace(/[।\.]+\s*$/, '')
            .replace(/\s+/g, ' ')
            .trim();
    }

    // FIX: Central helper to wipe debounce buffers so stale text never leaks across turns
    function clearDebounceBuffers() {
        if (typeof formConfirmDebounceTimer !== 'undefined' && formConfirmDebounceTimer) {
            clearTimeout(formConfirmDebounceTimer);
            formConfirmReplyBuffer = '';
            formConfirmDebounceTimer = null;
        }
    }

    // ---------- SLIDER BINDING ----------
    el.thresholdSlider.addEventListener('input', () => {
        VAD_THRESHOLD = parseFloat(el.thresholdSlider.value);
        el.thresholdVal.textContent = VAD_THRESHOLD.toFixed(2);
    });
    el.silenceSlider.addEventListener('input', () => {
        const ms = parseInt(el.silenceSlider.value, 10);
        VAD_MIN_SILENCE = Math.max(3, Math.round(ms / 32));
        el.silenceVal.textContent = ms + ' ms';
    });
    el.maxTurnSlider.addEventListener('input', () => {
        MAX_UNCOMMITTED_MS = parseInt(el.maxTurnSlider.value, 10);
        el.maxTurnVal.textContent = MAX_UNCOMMITTED_MS + ' ms';
    });
    el.padSlider.addEventListener('input', () => {
        VAD_PAD_MS = parseInt(el.padSlider.value, 10);
        el.padVal.textContent = VAD_PAD_MS + ' ms';
        trimPreRoll();
    });
    el.debounceSlider.addEventListener('input', () => {
        CONFIRM_DEBOUNCE_MS = parseInt(el.debounceSlider.value, 10);
        el.debounceVal.textContent = CONFIRM_DEBOUNCE_MS + ' ms';
    });

    // ---------- SIGNAL BARS ----------
    const bars = [];
    for (let i = 0; i < BAR_COUNT; i++) {
        const wrap = document.createElement('div');
        wrap.className = 'bar-wrap';
        const up = document.createElement('div');
        up.className = 'seg up';
        up.style.height = '1px';
        const down = document.createElement('div');
        down.className = 'seg down';
        down.style.height = '1px';
        wrap.appendChild(up);
        wrap.appendChild(down);
        el.signalStrip.appendChild(wrap);
        bars.push({ wrap, up, down });
    }
    let barHistory = new Array(BAR_COUNT).fill(0);

    function pushLevel(rms, mode) {
        barHistory.push(rms);
        barHistory.shift();
        barHistory.forEach((v, i) => {
            const h = Math.max(1, Math.min(28, v * 28 * 9));
            bars[i].up.style.height = h + 'px';
            bars[i].down.style.height = h + 'px';
            const isLoud = v > SPEECH_RMS_THRESHOLD * 0.6;
            bars[i].wrap.classList.toggle('active', isLoud && mode !== 'finalizing');
            bars[i].wrap.classList.toggle('finalizing', isLoud && mode === 'finalizing');
        });
    }

    // ---------- STATE ----------
    let ws = null,
        audioCtx = null,
        workletNode = null,
        micStream = null;
    let sessionActive = false,
        chunkCount = 0,
        droppedChunks = 0;
    let liveText = '',
        speaking = false,
        lastSpeechAt = 0,
        turnStartedAt = 0,
        finalizing = false;
    let sessionStartedAt = 0,
        durationTimer = null;
    let flowState = 'idle';
    let pendingTranscript = '';
    let transcriptQueue = [];
    let flowEpoch = 0;
    let ttsPlaying = false,
        ttsAbortController = null,
        ttsPlaybackCtx = null,
        ttsSourceNode = null,
        ttsMicMuted = false,
        ttsResolve = null,
        ttsSafetyTimer = null,
        ttsSettleTimer = null;
    let pendingCommit = false,
        preRollBuffer = [],
        preRollSamples = 0,
        gatedSamplesSkipped = 0;

    // ---------- DEBOUNCE BUFFERS ----------
    let formConfirmReplyBuffer = '';
    let formConfirmDebounceTimer = null;

    // ---------- QUEUE ----------
    function queueTranscript(text) {
        transcriptQueue.push(text);
        showToast(window.i18n ? window.i18n.t('pleaseWaitToast') : 'Please wait, processing…');
    }

    function drainTranscriptQueue() {
        if (transcriptQueue.length === 0) return;
        const text = transcriptQueue.shift();
        if (formFlowActive) {
            routeTranscript(text);
        } else {
            transcriptQueue.unshift(text);
        }
    }

    // ---------- DEBOUNCE FUNCTIONS ----------
    function bufferFormConfirmationReply(text) {
        const clean = stripTags(text);
        if (!clean) return;
        formConfirmReplyBuffer = formConfirmReplyBuffer ? (formConfirmReplyBuffer + ' ' + clean) : clean;
        clearTimeout(formConfirmDebounceTimer);
        setTurnMode('finalizing', window.i18n ? window.i18n.t('checkingConfirmation') : 'checking confirmation…');
        formConfirmDebounceTimer = setTimeout(() => {
            const merged = formConfirmReplyBuffer;
            formConfirmReplyBuffer = '';
            formConfirmDebounceTimer = null;
            routeTranscript(merged);
        }, CONFIRM_DEBOUNCE_MS);
    }

    // ---------- LIVE LINE ----------
    function resetLiveLine(placeholder) {
        liveText = '';
        el.liveLine.classList.add('empty');
        el.liveLine.textContent = placeholder;
    }

    function setLiveText(text) {
        liveText = text;
        el.liveLine.classList.remove('empty');
        el.liveLine.innerHTML = escapeHtml(text) + '<span class="cursor"></span>';
    }

    // ---------- TTS ----------
    let ttsCurrentToken = 0;
    let ttsActiveSources = new Set();
    let ttsNextStartTime = 0;
    let ttsStreamRemainder = null;
    let ttsWebSocket = null;
    let lastScheduledSource = null;
    let ttsStreamEnded = false;

    function ensureTTSContext() {
        const TTS_SAMPLE_RATE = 22050;
        if (!ttsPlaybackCtx || ttsPlaybackCtx.state === 'closed') {
            ttsPlaybackCtx = new (window.AudioContext || window.webkitAudioContext)({
                sampleRate: TTS_SAMPLE_RATE
            });
        }
        if (ttsPlaybackCtx.state === 'suspended') {
            ttsPlaybackCtx.resume().catch((err) => console.warn('[TTS] AudioContext resume failed:', err));
        }
        return ttsPlaybackCtx;
    }

    function formatForSpeech(text) {
        if (!text) return '';
        let s = stripTags(text);
        // Format telephone/account numbers with hyphens/pluses into space-separated digits
        s = s.replace(/(?:\+\d{1,3}[- ]?)?\b\d{2,5}[- ]\d{2,5}(?:[- ]\d{2,5})?\b/g, (m) =>
            m.replace(/[-+]/g, ' ').split('').filter(c => c.trim()).join(' ')
        );
        // Format continuous digit sequences (5+ digits, e.g. phone numbers, zip codes, account numbers)
        // so they are spoken as individual digits (e.g. "1 7 8 5 2 4 0 5 5 4 4")
        // rather than astronomical cardinal numbers ("सत्रह अरब पचासी करोड़...").
        s = s.replace(/\b\d{5,}\b/g, (m) => m.split('').join(' '));
        return s;
    }

    function stopTTSPlayback() {
        if (ttsWebSocket) {
            try {
                if (ttsWebSocket.readyState === WebSocket.OPEN) {
                    ttsWebSocket.send(JSON.stringify({ action: 'stop' }));
                    ttsWebSocket.close();
                }
            } catch (_) { }
            ttsWebSocket = null;
        }
        for (const src of ttsActiveSources) {
            try { src.stop(); } catch (_) { }
        }
        ttsActiveSources.clear();
        ttsSourceNode = null;
        lastScheduledSource = null;
        ttsNextStartTime = 0;
        ttsStreamRemainder = null;
        ttsStreamEnded = false;
    }

    function scheduleTTSAudioChunk(chunkData, sampleRate = 22050, onChunkEnded = null) {
        if (!chunkData) return;
        let bytes = chunkData instanceof Uint8Array ? chunkData : new Uint8Array(chunkData);
        if (bytes.length === 0) return;

        if (ttsStreamRemainder && ttsStreamRemainder.length > 0) {
            const merged = new Uint8Array(ttsStreamRemainder.length + bytes.length);
            merged.set(ttsStreamRemainder, 0);
            merged.set(bytes, ttsStreamRemainder.length);
            bytes = merged;
            ttsStreamRemainder = null;
        }

        const sampleCount = Math.floor(bytes.length / 2);
        if (sampleCount === 0) {
            ttsStreamRemainder = bytes;
            return;
        }

        const usableBytes = sampleCount * 2;
        if (bytes.length > usableBytes) {
            ttsStreamRemainder = bytes.slice(usableBytes);
        }

        // Safe DataView decoding: completely immune to any odd byteOffset alignment restrictions!
        const view = new DataView(bytes.buffer, bytes.byteOffset, usableBytes);
        const f32 = new Float32Array(sampleCount);
        for (let i = 0; i < sampleCount; i++) {
            f32[i] = view.getInt16(i * 2, true) / 32768.0;
        }

        ensureTTSContext();
        const chunkDuration = sampleCount / sampleRate;
        const now = ttsPlaybackCtx.currentTime;

        if (ttsNextStartTime < now) {
            // First chunk or gap after CPU generation: schedule with small 25ms cushion
            ttsNextStartTime = now + 0.025;
        }

        const buf = ttsPlaybackCtx.createBuffer(1, sampleCount, sampleRate);
        buf.getChannelData(0).set(f32);

        const src = ttsPlaybackCtx.createBufferSource();
        src.buffer = buf;
        src.connect(ttsPlaybackCtx.destination);
        src.start(ttsNextStartTime);

        ttsActiveSources.add(src);
        ttsSourceNode = src;
        lastScheduledSource = src;

        src.onended = () => {
            ttsActiveSources.delete(src);
            if (onChunkEnded) onChunkEnded(src);
        };

        ttsNextStartTime += chunkDuration;
    }

    function speak(text) {
        const cleanText = formatForSpeech(text);
        console.log('[TTS] speak() → "' + cleanText + '"');
        return new Promise(async (resolve) => {
            if (!cleanText || !cleanText.trim()) { resolve(); return; }

            const myToken = ++ttsCurrentToken;

            // Clear any active timers or previous playback
            if (ttsSafetyTimer) {
                clearTimeout(ttsSafetyTimer);
                ttsSafetyTimer = null;
            }
            if (ttsSettleTimer) {
                clearTimeout(ttsSettleTimer);
                ttsSettleTimer = null;
            }
            if (ttsAbortController) {
                try { ttsAbortController.abort(); } catch (e) { }
                ttsAbortController = null;
            }
            stopTTSPlayback();

            ttsPlaying = true;
            ttsMicMuted = true;
            ttsStreamEnded = false;
            lastScheduledSource = null;
            vadSpeechFrames = 0;
            vadSilenceFrames = 0;
            vadTriggered = false;
            el.micMutedBadge.classList.add('visible');
            el.interruptBtn.classList.add('visible');
            setTTSStatus('playing', 'tts playing…');

            ttsAbortController = new AbortController();
            ttsResolve = resolve;

            function onAllPlaybackComplete() {
                if (myToken !== ttsCurrentToken) return;
                if (ttsSafetyTimer) {
                    clearTimeout(ttsSafetyTimer);
                    ttsSafetyTimer = null;
                }
                if (ttsSettleTimer) {
                    clearTimeout(ttsSettleTimer);
                    ttsSettleTimer = null;
                }
                // Brief 300ms acoustic settling buffer to prevent mic picking up speaker reverberation
                ttsSettleTimer = setTimeout(() => {
                    if (myToken !== ttsCurrentToken) return;
                    ttsPlaying = false;
                    setTTSStatus('idle', 'tts done');
                    ttsMicMuted = false;
                    el.micMutedBadge.classList.remove('visible');
                    el.interruptBtn.classList.remove('visible');
                    drainTranscriptQueue();
                    if (ttsResolve) {
                        const r = ttsResolve;
                        ttsResolve = null;
                        r();
                    }
                }, 300);
            }

            function handleChunkEnded() {
                if (ttsStreamEnded && ttsActiveSources.size === 0) {
                    onAllPlaybackComplete();
                }
            }

            function resetSafetyTimer() {
                if (ttsSafetyTimer) clearTimeout(ttsSafetyTimer);
                const currentRemaining = ttsPlaybackCtx ? Math.max(0, (ttsNextStartTime - ttsPlaybackCtx.currentTime) * 1000) : 0;
                // Allow generous timeout during active generation/streaming
                const timeoutMs = Math.max(25000, currentRemaining + 15000);
                ttsSafetyTimer = setTimeout(() => {
                    if (myToken === ttsCurrentToken && (ttsPlaying || ttsMicMuted)) {
                        console.warn('[TTS] Synthesis/playback timeout reached for token', myToken);
                        onAllPlaybackComplete();
                    }
                }, timeoutMs);
            }

            resetSafetyTimer();

            // Attempt 1: Stream via WebSocket (Companion Orchestrator ws://127.0.0.1:8000/ws/tts)
            let streamedViaSocket = false;
            try {
                await new Promise((wsResolve, wsReject) => {
                    let socket;
                    try {
                        socket = new WebSocket('ws://127.0.0.1:8000/ws/tts');
                    } catch (err) {
                        return wsReject(err);
                    }
                    socket.binaryType = 'arraybuffer'; // Crucial: ensure synchronous binary delivery without async Blob delays
                    ttsWebSocket = socket;

                    const socketConnTimeout = setTimeout(() => {
                        try { socket.close(); } catch (_) { }
                        wsReject(new Error('TTS WebSocket connection timeout'));
                    }, 1500);

                    socket.onopen = () => {
                        clearTimeout(socketConnTimeout);
                        if (myToken !== ttsCurrentToken) {
                            try { socket.close(); } catch (_) { }
                            return wsReject(new Error('Aborted'));
                        }
                        streamedViaSocket = true;
                        socket.send(JSON.stringify({
                            model: 'piper',
                            input: cleanText,
                            spoken_disclaimer: false,
                            stream: true,
                            response_format: 'pcm'
                        }));
                    };

                    socket.onmessage = (event) => {
                        if (myToken !== ttsCurrentToken) return;
                        resetSafetyTimer();

                        if (typeof event.data === 'string') {
                            try {
                                const msg = JSON.parse(event.data);
                                if (msg.event === 'done') {
                                    wsResolve();
                                } else if (msg.event === 'error') {
                                    wsReject(new Error(msg.error || 'TTS WS error'));
                                }
                            } catch (_) { }
                        } else {
                            // Binary ArrayBuffer chunk received in exact sequence
                            scheduleTTSAudioChunk(event.data, 22050, handleChunkEnded);
                        }
                    };

                    socket.onerror = (e) => {
                        clearTimeout(socketConnTimeout);
                        wsReject(new Error('TTS WebSocket error'));
                    };

                    socket.onclose = () => {
                        clearTimeout(socketConnTimeout);
                        if (!streamedViaSocket) {
                            wsReject(new Error('TTS WebSocket closed early'));
                        } else {
                            wsResolve();
                        }
                    };
                });
            } catch (wsErr) {
                console.warn('[TTS] WebSocket streaming unavailable, falling back to HTTP chunked streaming:', wsErr.message);
            }

            if (myToken !== ttsCurrentToken) return;

            // Attempt 2: If WebSocket wasn't used or failed, stream via HTTP fetch ReadableStream
            if (!streamedViaSocket) {
                try {
                    let resp;
                    try {
                        resp = await fetch('http://127.0.0.1:8089/v1/audio/speech', {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({
                                model: 'piper', input: cleanText, spoken_disclaimer: false,
                                stream: true, response_format: 'pcm'
                            }),
                            signal: ttsAbortController.signal
                        });
                    } catch (_) {
                        resp = await fetch('http://127.0.0.1:8000/v1/audio/speech', {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({
                                model: 'piper', input: cleanText, spoken_disclaimer: false,
                                stream: true, response_format: 'pcm'
                            }),
                            signal: ttsAbortController.signal
                        });
                    }

                    if (myToken !== ttsCurrentToken) return;
                    if (!resp.ok) throw new Error(`TTS error: ${resp.status}`);

                    if (!resp.body || !resp.body.getReader) {
                        const ab = await resp.arrayBuffer();
                        if (myToken !== ttsCurrentToken) return;
                        scheduleTTSAudioChunk(ab, 22050, handleChunkEnded);
                    } else {
                        const reader = resp.body.getReader();
                        while (true) {
                            const { done, value } = await reader.read();
                            if (done) break;
                            if (myToken !== ttsCurrentToken) {
                                try { reader.cancel(); } catch (_) { }
                                return;
                            }
                            resetSafetyTimer();
                            scheduleTTSAudioChunk(value, 22050, handleChunkEnded);
                        }
                    }
                } catch (e) {
                    if (myToken !== ttsCurrentToken) return;
                    if (e.name === 'AbortError') {
                        console.log('[TTS] speak() aborted for token', myToken);
                        stopTTSPlayback();
                        onAllPlaybackComplete();
                        return;
                    }
                    console.error('[TTS] Error:', e);
                    showToast('TTS error: ' + e.message);
                    stopTTSPlayback();
                    onAllPlaybackComplete();
                    return;
                }
            }

            if (myToken !== ttsCurrentToken) return;

            // Mark stream as complete
            ttsStreamEnded = true;
            ensureTTSContext();

            // Check if all scheduled audio has finished playing
            if (ttsActiveSources.size === 0) {
                onAllPlaybackComplete();
            } else {
                const remainingPlayTimeMs = Math.max(0, (ttsNextStartTime - ttsPlaybackCtx.currentTime) * 1000);
                console.log(`[TTS] Stream complete. Waiting for playback to finish (~${(remainingPlayTimeMs / 1000).toFixed(2)}s)`);

                if (ttsSafetyTimer) {
                    clearTimeout(ttsSafetyTimer);
                    ttsSafetyTimer = null;
                }

                // Generous safety timer to prevent hanging if onended ever fails
                ttsSafetyTimer = setTimeout(() => {
                    if (myToken === ttsCurrentToken && (ttsPlaying || ttsMicMuted)) {
                        console.warn('[TTS] Playback safety timer expired');
                        onAllPlaybackComplete();
                    }
                }, Math.round(remainingPlayTimeMs + 5000));
            }
        });
    }

    function interruptTTS() {
        ttsCurrentToken++;
        if (ttsSafetyTimer) {
            clearTimeout(ttsSafetyTimer);
            ttsSafetyTimer = null;
        }
        if (ttsSettleTimer) {
            clearTimeout(ttsSettleTimer);
            ttsSettleTimer = null;
        }
        if (ttsAbortController) {
            try { ttsAbortController.abort(); } catch (e) { }
            ttsAbortController = null;
        }
        stopTTSPlayback();
        ttsPlaying = false;
        ttsMicMuted = false;
        el.micMutedBadge.classList.remove('visible');
        el.interruptBtn.classList.remove('visible');
        setTTSStatus('idle', 'tts interrupted');
        if (ttsResolve) {
            const r = ttsResolve;
            ttsResolve = null;
            r();
        }
        showToast('TTS interrupted');
    }

    // ==========================================================
    // FORM FIELD SCANNER & SEQUENTIAL VOICE ITERATOR
    // ==========================================================
    let currentScannedTabId = null;
    let currentScannedUrl = '';
    let scannedFields = [];
    let currentFieldIndex = -1;
    let formFlowActive = false;
    let sessionPaused = false;
    let fieldValues = {}; // fieldId -> { value, confirmed: bool, tentative: bool, timestamp }
    let pendingFieldValue = '';
    let currentFieldOriginalValue = '';
    let currentFieldCorrections = [];

    // Phase 1 Intent-Driven Architecture instances
    const fieldResolver = new window.FieldResolver();
    const inputClassifier = new window.InputClassifier({ fieldResolver, llmUrl: el.llmUrl?.value?.trim() });
    const actionHandler = new window.ActionHandler();
    const informationHandler = new window.InformationHandler({ llmUrl: el.llmUrl?.value?.trim() });
    const correctionHandler = new window.CorrectionHandler({ llmUrl: el.llmUrl?.value?.trim() });

    if (el.llmUrl) {
        el.llmUrl.addEventListener('change', () => {
            const u = el.llmUrl.value.trim();
            inputClassifier.setLlmUrl(u);
            informationHandler.setLlmUrl(u);
            correctionHandler.setLlmUrl(u);
        });
    }

    function getActionContext() {
        const t = (k, p) => (window.i18n ? window.i18n.t(k, p) : k);
        return {
            scannedFields,
            currentFieldIndex,
            fieldValues,
            pendingFieldValue,
            tabId: currentScannedTabId,
            flowState,
            speak,
            askField,
            finishFormFlow,
            showToast,
            setPendingValue: (val) => {
                pendingFieldValue = val;
                if (el.spotlightValue) {
                    el.spotlightValue.textContent = val;
                    el.spotlightValue.classList.remove('empty');
                }
                setLiveText(val);
            },
            updateSpotlightPreview: (val, phase) => {
                if (el.spotlightStatus) {
                    el.spotlightStatus.dataset.phase = phase || 'confirming';
                    el.spotlightStatus.textContent = t('spotlightPhaseConfirming');
                }
                if (el.spotlightValue) {
                    el.spotlightValue.textContent = val;
                    el.spotlightValue.classList.remove('empty');
                }
                setTurnMode('confirming', scannedFields[currentFieldIndex]?.label || '');
            },
            setFlowState: (newState) => {
                flowState = newState;
            },
            pauseSession: () => {
                pauseVoiceSession();
            },
            renderScannedFieldsList,
            fieldResolver,
            informationHandler
        };
    }

    function pauseVoiceSession() {
        sessionPaused = true;
        flowState = 'paused';
        setTurnMode('idle', 'sleeping 💤');
        if (el.spotlightStatus) {
            el.spotlightStatus.dataset.phase = 'paused';
            el.spotlightStatus.textContent = '💤 Paused';
        }
        showToast(window.i18n ? window.i18n.t('sessionPausedToast') : 'Voice assistant paused — speak wake word to resume');
    }

    function resumeVoiceSession() {
        if (!sessionPaused) return;
        sessionPaused = false;
        flowState = 'form_awaiting_input';
        const f = scannedFields[currentFieldIndex];
        setTurnMode('listening', f?.label || 'listening');
        if (el.spotlightStatus) {
            el.spotlightStatus.dataset.phase = 'listening';
            el.spotlightStatus.textContent = window.i18n ? window.i18n.t('spotlightPhaseListening') : 'Listening…';
        }
        showToast('Assistant Resumed ✓');
    }

    function setFormScanBadge(state, text) {
        if (!el.formScanBadge || !el.formScanBadgeText) return;
        el.formScanBadge.dataset.state = state;
        el.formScanBadgeText.textContent = text;
    }

    function renderScannedFieldsList() {
        if (!el.fieldsListContainer || !el.scannedFieldsCount) return;

        const emptyMsg = window.i18n ? window.i18n.t('noFieldsFound') : 'No fields found';
        const reqTagText = window.i18n ? window.i18n.t('spotlightRequired') : '*Required';

        if (!scannedFields || scannedFields.length === 0) {
            el.fieldsListContainer.innerHTML = `<div style="color:var(--text-muted);font-size:11px;padding:4px;">${emptyMsg}</div>`;
            el.scannedFieldsCount.textContent = '0';
            if (el.formFieldsAccordion) el.formFieldsAccordion.style.display = 'none';
            return;
        }

        el.scannedFieldsCount.textContent = scannedFields.length;
        const summaryLabel = document.getElementById('scannedFieldsSummaryLabel');
        if (summaryLabel) {
            summaryLabel.innerHTML = window.i18n ? window.i18n.t('scannedFieldsTitle', { count: scannedFields.length }) : `📋 Scanned Fields (<b id="scannedFieldsCount">${scannedFields.length}</b>)`;
        }
        if (el.formFieldsAccordion) el.formFieldsAccordion.style.display = 'block';

        let html = '';
        scannedFields.forEach((f, idx) => {
            const isCur = formFlowActive && currentFieldIndex === idx;
            const record = fieldValues[f.id];
            const isConfirmed = record && record.confirmed;
            const isTentative = record && record.tentative && !record.confirmed;
            const cls = `field-item-row ${isCur ? 'active' : ''} ${isConfirmed ? 'confirmed' : ''} ${isTentative ? 'tentative' : ''}`;
            const valPreview = record ? escapeHtml(record.value) : '';
            const statusIcon = isConfirmed ? '✓' : (isTentative ? '⚠️' : (isCur ? '🎙️' : '⏳'));
            const statusColor = isConfirmed ? 'color:var(--accent-green);font-weight:700;' : (isTentative ? 'color:#f59e0b;font-weight:600;' : (isCur ? 'color:var(--accent-blue);' : 'color:var(--text-muted);'));

            html += `
                <div class="${cls}" data-index="${idx}" id="field-row-${idx}">
                    <div class="field-item-left">
                        <span class="field-index-chip">#${idx + 1}</span>
                        <span class="field-label-text" title="${escapeHtml(f.label)}">${escapeHtml(f.label)}</span>
                        <span class="field-type-pill">${escapeHtml(f.type || f.tagName)}</span>
                        ${f.required ? `<span class="spotlight-req-tag">${reqTagText}</span>` : ''}
                    </div>
                    <div class="field-item-right">
                        ${valPreview ? `<span class="field-val-badge" title="${valPreview}">${valPreview}</span>` : ''}
                        <span class="field-status-icon" style="${statusColor}">${statusIcon}</span>
                    </div>
                </div>
            `;
        });
        el.fieldsListContainer.innerHTML = html;

        // Attach click listeners to select / jump to field
        scannedFields.forEach((f, idx) => {
            const row = document.getElementById(`field-row-${idx}`);
            if (row) {
                row.addEventListener('click', () => {
                    selectField(idx);
                });
            }
        });
    }

    async function getActiveTab() {
        if (typeof chrome === 'undefined' || !chrome.tabs || !chrome.tabs.query) return null;
        try {
            const tabs = await chrome.tabs.query({ active: true, currentWindow: true });
            return tabs && tabs.length > 0 ? tabs[0] : null;
        } catch (err) {
            console.warn('[VFF] getActiveTab error:', err);
            return null;
        }
    }

    async function ensureScannerInjected(tabId) {
        if (typeof chrome === 'undefined' || !chrome.scripting) return false;
        try {
            await chrome.scripting.executeScript({
                target: { tabId },
                files: ['form-field-scanner.js']
            });
            return true;
        } catch (err) {
            console.warn('[VFF] ensureScannerInjected failed:', err);
            return false;
        }
    }

    async function scanActivePage(showToastNotice = true) {
        const t = (k, p) => (window.i18n ? window.i18n.t(k, p) : k);
        setFormScanBadge('pending', t('scanningBadge'));
        const tab = await getActiveTab();
        if (!tab || !tab.id) {
            if (showToastNotice) showToast(t('activeTabNotFoundToast'));
            setFormScanBadge('error', t('tabNotFoundBadge'));
            return;
        }

        // Restrict chrome:// or edge:// pages
        if (tab.url && (tab.url.startsWith('chrome://') || tab.url.startsWith('chrome-extension://') || tab.url.startsWith('edge://') || tab.url.startsWith('about:'))) {
            if (showToastNotice) showToast(t('cannotScanInternalToast'));
            setFormScanBadge('error', t('invalidPageBadge'));
            return;
        }

        currentScannedTabId = tab.id;
        currentScannedUrl = tab.url || '';
        if (el.formPageInfo) el.formPageInfo.style.display = 'flex';
        if (el.formTabUrl) {
            el.formTabUrl.textContent = currentScannedUrl;
            el.formTabUrl.title = currentScannedUrl;
        }

        // Ensure background registers session
        if (typeof chrome !== 'undefined' && chrome.runtime && chrome.runtime.sendMessage) {
            chrome.runtime.sendMessage({ type: 'VFF_START_SESSION', tabId: tab.id }).catch(() => { });
        }

        // Ensure script injection if page was loaded before extension
        await ensureScannerInjected(tab.id);

        const response = await requestScanWithRetry(tab.id, 2);
        if (!response || !Array.isArray(response.fields)) {
            console.warn('[VFF] Scan message failed after retries');
            setFormScanBadge('error', t('scanFailedBadge'));
            if (showToastNotice) showToast(t('unableToScanToast'));
            return;
        }

        scannedFields = response.fields;
        console.log(`[VFF] Scanned ${scannedFields.length} fields from ${response.url}`);
        if (scannedFields.length === 0) {
            setFormScanBadge('ready', t('fieldsZeroBadge'));
            if (el.btnStartFormFlow) el.btnStartFormFlow.disabled = true;
            if (showToastNotice) showToast(t('noFieldsFound'));
        } else {
            setFormScanBadge('success', t('fieldsScannedBadge', { count: scannedFields.length }));
            if (el.btnStartFormFlow) el.btnStartFormFlow.disabled = false;
            if (showToastNotice) showToast(t('fieldsScannedSuccess', { count: scannedFields.length }));
        }
        renderScannedFieldsList();
    }

    async function requestScanWithRetry(tabId, retries = 2) {
        return new Promise((resolve) => {
            function attempt(remaining) {
                chrome.tabs.sendMessage(tabId, { type: 'VFF_SCAN_FORM' }, async (response) => {
                    const err = chrome.runtime.lastError;
                    if (err || !response || !Array.isArray(response.fields)) {
                        if (remaining > 0) {
                            await ensureScannerInjected(tabId);
                            setTimeout(() => attempt(remaining - 1), 300);
                        } else {
                            if (err) console.warn('[VFF] Last scan error:', err.message);
                            resolve(null);
                        }
                    } else {
                        resolve(response);
                    }
                });
            }
            attempt(retries);
        });
    }

    function handleFieldsUpdated(msg) {
        if (!msg || !Array.isArray(msg.fields)) return;
        console.log('[VFF] MutationObserver detected DOM change. New field count:', msg.fields.length);
        scannedFields = msg.fields;
        const t = (k, p) => (window.i18n ? window.i18n.t(k, p) : k);
        setFormScanBadge('success', t('fieldsScannedBadge', { count: scannedFields.length }));
        if (el.btnStartFormFlow) el.btnStartFormFlow.disabled = scannedFields.length === 0;
        renderScannedFieldsList();
        if (formFlowActive && currentFieldIndex >= 0 && currentFieldIndex < scannedFields.length) {
            // Re-highlight active field if DOM mutated
            const f = scannedFields[currentFieldIndex];
            if (currentScannedTabId) {
                chrome.tabs.sendMessage(currentScannedTabId, { type: 'VFF_FOCUS_FIELD', fieldId: f.id }).catch(() => { });
            }
        }
    }

    // Continuous listener for DOM mutations from content script
    if (typeof chrome !== 'undefined' && chrome.runtime && chrome.runtime.onMessage) {
        chrome.runtime.onMessage.addListener((msg) => {
            if (msg && msg.type === 'VFF_FIELDS_UPDATED') {
                handleFieldsUpdated(msg);
            }
        });
    }

    async function selectField(index) {
        if (index < 0 || index >= scannedFields.length) return;
        if (formFlowActive) {
            await actionHandler.handleJump(index, getActionContext());
        } else {
            currentFieldIndex = index;
            const f = scannedFields[index];
            if (currentScannedTabId) {
                chrome.tabs.sendMessage(currentScannedTabId, { type: 'VFF_FOCUS_FIELD', fieldId: f.id }).catch(() => { });
            }
            renderScannedFieldsList();
        }
    }

    async function startFormFlow() {
        if (scannedFields.length === 0) {
            await scanActivePage(false);
            if (scannedFields.length === 0) {
                showToast(window.i18n ? window.i18n.t('noFieldsFound') : 'No fields found');
                return;
            }
        }

        // Auto-start microphone session if not running
        if (!sessionActive) {
            console.log('[VFF] Starting mic session for form fill');
            await startSession();
        }

        sessionPaused = false;
        formFlowActive = true;
        if (el.btnStartFormFlow) el.btnStartFormFlow.disabled = true;
        if (el.btnStopFormFlow) el.btnStopFormFlow.disabled = false;
        if (el.formActiveSpotlight) el.formActiveSpotlight.style.display = 'flex';

        // Find first unconfirmed field, or index 0
        let targetIdx = scannedFields.findIndex(f => !fieldValues[f.id]?.confirmed);
        if (targetIdx === -1) targetIdx = 0;
        currentFieldIndex = targetIdx;

        await askField(currentFieldIndex);
    }

    function stopFormFlow() {
        sessionPaused = false;
        formFlowActive = false;
        if (el.btnStartFormFlow) el.btnStartFormFlow.disabled = scannedFields.length === 0;
        if (el.btnStopFormFlow) el.btnStopFormFlow.disabled = true;
        if (el.formActiveSpotlight) el.formActiveSpotlight.style.display = 'none';
        if (currentScannedTabId) {
            chrome.tabs.sendMessage(currentScannedTabId, { type: 'VFF_CLEAR_FOCUS' }).catch(() => { });
        }
        flowState = 'idle';
        setTurnMode('idle', 'idle');
        renderScannedFieldsList();
        showToast(window.i18n ? window.i18n.t('sessionStoppedToast') : 'Form filling stopped');
    }

    async function finishFormFlow() {
        formFlowActive = false;
        if (el.btnStartFormFlow) el.btnStartFormFlow.disabled = false;
        if (el.btnStopFormFlow) el.btnStopFormFlow.disabled = true;
        if (el.formActiveSpotlight) el.formActiveSpotlight.style.display = 'none';
        if (currentScannedTabId) {
            chrome.tabs.sendMessage(currentScannedTabId, { type: 'VFF_CLEAR_FOCUS' }).catch(() => { });
        }
        renderScannedFieldsList();
        const t = (k, p) => (window.i18n ? window.i18n.t(k, p) : k);
        const dict = window.i18n ? window.i18n.getDictation() : {};
        setFormScanBadge('success', t('allFieldsComplete'));
        flowState = 'busy';
        await speak(dict.sessionFinished || 'All fields on this page have been completed.');
        flowState = 'idle';
        setTurnMode('idle', t('allFieldsComplete'));
    }

    async function askField(index, isRepeat = false) {
        if (index < 0 || index >= scannedFields.length) {
            await finishFormFlow();
            return;
        }

        currentFieldIndex = index;
        const f = scannedFields[index];
        const myEpoch = flowEpoch;
        const t = (k, p) => (window.i18n ? window.i18n.t(k, p) : k);
        const dict = window.i18n ? window.i18n.getDictation() : {};

        // Focus & highlight on page
        if (currentScannedTabId) {
            chrome.tabs.sendMessage(currentScannedTabId, { type: 'VFF_FOCUS_FIELD', fieldId: f.id }).catch(() => { });
        }

        // Update spotlight UI
        if (el.spotlightStep) el.spotlightStep.textContent = t('spotlightStep', { current: index + 1, total: scannedFields.length });
        if (el.spotlightLabel) el.spotlightLabel.textContent = f.label;
        if (el.spotlightRequired) el.spotlightRequired.style.display = f.required ? 'inline-block' : 'none';
        if (el.spotlightStatus) {
            el.spotlightStatus.dataset.phase = 'asking';
            el.spotlightStatus.textContent = t('spotlightPhaseAsking');
        }
        if (el.spotlightPrompt) el.spotlightPrompt.textContent = t('spotlightPromptListening');

        const existingVal = fieldValues[f.id]?.value || f.currentValue || '';
        currentFieldCorrections = [];
        currentFieldOriginalValue = existingVal || '';
        if (el.spotlightValue) {
            if (existingVal) {
                el.spotlightValue.textContent = existingVal;
                el.spotlightValue.classList.remove('empty');
            } else {
                el.spotlightValue.textContent = t('spotlightNoValYet');
                el.spotlightValue.classList.add('empty');
            }
        }

        renderScannedFieldsList();

        // Formulate spoken prompt
        let prompt = '';
        if (isRepeat) {
            prompt = dict.askFieldRepeat ? dict.askFieldRepeat(f.label) : `Please state your answer for ${f.label}.`;
        } else if (existingVal) {
            prompt = dict.askFieldExisting ? dict.askFieldExisting(f.label, existingVal) : `Next field is ${f.label}. Current value is ${existingVal}. Would you like to change it?`;
        } else if (f.type === 'select') {
            prompt = dict.askFieldSelect ? dict.askFieldSelect(f.label, f.required) : `Next field is ${f.label}. ${f.required ? 'This is required.' : ''} Which option would you like to select?`;
        } else {
            prompt = dict.askFieldDefault ? dict.askFieldDefault(f.label, f.required) : `Next field is ${f.label}. ${f.required ? 'This is required.' : ''} What should I enter here?`;
        }

        flowState = 'busy';
        clearDebounceBuffers();
        await speak(prompt);
        if (myEpoch !== flowEpoch) return;

        flowState = 'form_awaiting_input';
        if (el.spotlightStatus) {
            el.spotlightStatus.dataset.phase = 'listening';
            el.spotlightStatus.textContent = t('spotlightPhaseListening');
        }
        setTurnMode('listening', f.label);
        resetLiveLine(t('transcriptListeningPrompt', { label: f.label }));
        drainTranscriptQueue();
    }

    async function routeTranscript(text) {
        const myEpoch = flowEpoch;
        clearDebounceBuffers();
        const clean = stripTags(text).trim();
        if (!clean) return;

        if (currentFieldIndex < 0 || currentFieldIndex >= scannedFields.length) {
            console.log('[VFF Router] No active field selected, ignoring transcript:', clean);
            return;
        }

        console.log(`[VFF Router] Routing transcript: "${clean}", flowState=${flowState}, activeField=#${currentFieldIndex} ("${scannedFields[currentFieldIndex]?.label}")`);

        const ctx = getActionContext();
        const t = (k, p) => (window.i18n ? window.i18n.t(k, p) : k);

        // State indicator while classifying
        flowState = 'evaluating_intent';
        setTurnMode('finalizing', t('spotlightPhaseEvaluating'));

        const classified = await inputClassifier.classify(clean, ctx);
        if (myEpoch !== flowEpoch) return;

        console.log('[VFF Router] Intent result:', classified);

        switch (classified.type) {
            case 'ACTION': {
                const verb = classified.action?.verb;
                if (verb === 'JUMP') {
                    const targetIdx = classified.action.targetIndex;
                    await actionHandler.handleJump(targetIdx, ctx);
                } else if (verb === 'SKIP') {
                    await actionHandler.handleSkip(ctx);
                } else if (verb === 'PREVIOUS') {
                    await actionHandler.handlePrevious(ctx);
                } else if (verb === 'REPEAT') {
                    await actionHandler.handleRepeat(ctx);
                } else if (verb === 'PAUSE') {
                    await actionHandler.handlePause(ctx);
                } else if (verb === 'SUBMIT') {
                    await actionHandler.handleSubmit(ctx);
                } else {
                    console.warn('[VFF Router] Unknown action verb:', verb);
                    await actionHandler.handleSkip(ctx);
                }
                break;
            }

            case 'CONFIRMATION': {
                await confirmCurrentField();
                break;
            }

            case 'CORRECTION': {
                flowState = 'correcting';
                setTurnMode('finalizing', t('spotlightPhaseEvaluating'));

                if (classified.isHistoricalCorrection && classified.historicalTargetIndex !== undefined) {
                    // Historical / cross-field correction
                    await correctionHandler.applyHistoricalCorrection(
                        classified.historicalTargetIndex,
                        classified.payload,
                        ctx
                    );
                    // Return to listening on current field
                    flowState = 'form_awaiting_input';
                    setTurnMode('listening', scannedFields[currentFieldIndex]?.label || '');
                    resetLiveLine(t('transcriptListeningPrompt', { label: scannedFields[currentFieldIndex]?.label || '' }));
                    drainTranscriptQueue();
                } else {
                    // Active field correction
                    if (!classified.payload || !classified.payload.trim()) {
                        // Pure rejection ("it's wrong", "that is wrong", "गलत है") -> clear bad value and ask for new value
                        const f = scannedFields[currentFieldIndex];
                        const dict = window.i18n ? window.i18n.getDictation() : {};
                        pendingFieldValue = '';
                        if (el.spotlightValue) {
                            el.spotlightValue.textContent = '';
                            el.spotlightValue.classList.add('empty');
                        }
                        if (f && fieldValues[f.id]?.tentative) {
                            delete fieldValues[f.id];
                            renderScannedFieldsList();
                        }
                        flowState = 'busy';
                        await speak(dict.askCorrection ? dict.askCorrection(f?.label) : `Please state the correction for ${f?.label}.`);
                        if (myEpoch !== flowEpoch) return;
                        flowState = 'form_awaiting_input';
                        setTurnMode('listening', f?.label || '');
                        resetLiveLine(t('transcriptListeningPrompt', { label: f?.label || '' }));
                        drainTranscriptQueue();
                    } else {
                        await correctionHandler.applyCurrentFieldCorrection(classified.payload, ctx);
                    }
                }
                break;
            }

            case 'INFORMATION':
            default: {
                const f = scannedFields[currentFieldIndex];
                flowState = 'busy';
                setTurnMode('finalizing', f.label);

                const cleanValue = await informationHandler.processValue(classified.payload || clean, f);
                if (myEpoch !== flowEpoch) return;

                if (!currentFieldOriginalValue) currentFieldOriginalValue = cleanValue;

                await informationHandler.stageAndAskConfirmation(cleanValue, f, ctx);
                break;
            }
        }
    }

    async function confirmCurrentField() {
        const myEpoch = flowEpoch;
        const f = scannedFields[currentFieldIndex];
        if (!f) return;
        const confirmedVal = pendingFieldValue || fieldValues[f.id]?.value || f.currentValue || '';
        console.log(`[VFF] Field #${currentFieldIndex} "${f.label}" CONFIRMED with value: "${confirmedVal}"`);

        fieldValues[f.id] = {
            value: confirmedVal,
            confirmed: true,
            tentative: false,
            timestamp: Date.now()
        };

        if (currentScannedTabId) {
            chrome.tabs.sendMessage(currentScannedTabId, {
                type: 'VFF_SET_FIELD_VALUE',
                fieldId: f.id,
                value: confirmedVal
            }).catch(() => {});
        }

        currentFieldCorrections = [];
        currentFieldOriginalValue = '';

        const t = (k, p) => (window.i18n ? window.i18n.t(k, p) : k);
        const dict = window.i18n ? window.i18n.getDictation() : {};
        if (el.spotlightStatus) {
            el.spotlightStatus.dataset.phase = 'confirmed';
            el.spotlightStatus.textContent = t('spotlightPhaseConfirmed');
        }
        renderScannedFieldsList();

        flowState = 'busy';
        await speak(dict.fieldRecorded ? dict.fieldRecorded(f.label) : `${f.label} recorded.`);
        if (myEpoch !== flowEpoch) return;

        let nextIdx = currentFieldIndex + 1;
        while (nextIdx < scannedFields.length && fieldValues[scannedFields[nextIdx].id]?.confirmed) {
            nextIdx++;
        }
        if (nextIdx < scannedFields.length) {
            await askField(nextIdx);
        } else {
            const remainingIdx = scannedFields.findIndex(fld => !fieldValues[fld.id]?.confirmed);
            if (remainingIdx !== -1) {
                await askField(remainingIdx);
            } else {
                await finishFormFlow();
            }
        }
    }

    async function skipField() {
        await actionHandler.handleSkip(getActionContext());
    }

    async function prevField() {
        await actionHandler.handlePrevious(getActionContext());
    }

    async function reaskCurrentField() {
        await actionHandler.handleRepeat(getActionContext());
    }

    // ---------- WEBSOCKET ----------
    function normalizeWsUrl(url) {
        let clean = (url || '').trim();
        if (!clean) clean = 'ws://127.0.0.1:8082/v1/realtime';
        clean = clean.replace(':8081', ':8082');
        if (!clean.includes('/v1/realtime')) {
            clean = clean.replace(/\/?$/, '/v1/realtime');
        }
        return clean;
    }

    function connectWs() {
        return new Promise((resolve, reject) => {
            el.wsUrl.value = normalizeWsUrl(el.wsUrl.value);
            setStatus('connecting', 'connecting');
            let socket;
            try { socket = new WebSocket(el.wsUrl.value); } catch (e) { reject(e); return; }
            ws = socket;
            socket.onopen = () => {
                setStatus('connected', 'connected');
                resolve();
            };
            socket.onerror = (e) => {
                setStatus('error', 'ws error');
                reject(e);
            };
            socket.onclose = (ev) => {
                setStatus('idle', 'disconnected');
                if (sessionActive) endSession(window.i18n ? window.i18n.t('connectionClosed') : 'Connection closed');
            };
            socket.onmessage = (ev) => {
                let msg; try { msg = JSON.parse(ev.data); } catch { return; }
                handleServerEvent(msg);
            };
        });
    }

    function handleServerEvent(msg) {
        if (!msg) return;
        if (msg.error) {
            console.error('[WS Error]', msg.error);
            const errText = typeof msg.error === 'string' ? msg.error : (msg.error.message || JSON.stringify(msg.error));
            showToast((window.i18n ? window.i18n.t('asrError') : 'ASR error: ') + errText);
            return;
        }
        if (!msg.type || msg.type === 'session.created') return;
        if (msg.type.endsWith('.delta')) {
            const text = msg.delta ?? msg.text ?? '';
            if (text) {
                if (liveText && text.startsWith(liveText) && text.length >= liveText.length) {
                    setLiveText(text);
                } else {
                    setLiveText(liveText + text);
                }
            }
        } else if (msg.type.endsWith('.completed')) {
            const serverTranscript = stripTags(msg.transcript ?? msg.text ?? '');
            const currentLive = stripTags(liveText ?? '');
            // Preserve whichever text is longer and more complete so trailing words are never discarded
            const finalText = (serverTranscript && serverTranscript.length >= currentLive.length)
                ? serverTranscript
                : (currentLive || serverTranscript);
            liveText = '';
            finalizing = false;
            console.log('[WS] Completed, server="' + serverTranscript + '" live="' + currentLive + '" chosen="' + finalText + '", flowState=' + flowState);
            if (!finalText || !finalText.trim()) {
                if (flowState === 'form_awaiting_input' || flowState === 'form_awaiting_confirmation' || flowState === 'form_awaiting_correction') {
                    setTurnMode('listening', 'listening');
                }
                return;
            }
            if (flowState === 'evaluating_intent' || flowState === 'correcting' || flowState === 'busy') {
                queueTranscript(finalText);
                return;
            }
            if (formFlowActive) {
                if (flowState === 'paused' || sessionPaused) {
                    const heuristics = inputClassifier.getHeuristics();
                    const cleanLower = finalText.trim().toLowerCase();
                    const isWake = (heuristics.resumeWords && heuristics.resumeWords.some(w => cleanLower.includes(w.toLowerCase())))
                        || /^(?:resume|wake\s+up|start|continue)$/i.test(cleanLower);
                    if (isWake) {
                        resumeVoiceSession();
                    } else {
                        console.log('[WS] Dropped transcript while paused:', finalText);
                    }
                    return;
                }
                if (flowState === 'form_awaiting_confirmation') {
                    bufferFormConfirmationReply(finalText);
                } else {
                    routeTranscript(finalText);
                }
            } else {
                setLiveText(finalText);
            }
        } else if (msg.type === 'error') {
            showToast(msg.message || msg.error?.message || 'server error');
        }
    }

    // ---------- AUDIO SEND ----------
    function sendAppend(int16Array) {
        if (!ws || ws.readyState !== WebSocket.OPEN) return;
        if (ws.bufferedAmount > MAX_WS_BUFFERED_BYTES) { droppedChunks++; return; }
        const bytes = new Uint8Array(int16Array.buffer);
        let binary = '';
        for (let i = 0; i < bytes.length; i++) binary += String.fromCharCode(bytes[i]);
        ws.send(JSON.stringify({ type: 'input_audio_buffer.append', audio: btoa(binary) }));
        chunkCount++;
    }

    function sendCommit() {
        if (!ws || ws.readyState !== WebSocket.OPEN) return;
        ws.send(JSON.stringify({ type: 'input_audio_buffer.commit' }));
    }

    // ---------- PCM UTILITIES ----------
    function floatTo16BitPCM(float32, srcRate, dstRate) {
        let src = float32;
        if (Math.round(srcRate) !== dstRate) {
            const ratio = srcRate / dstRate;
            const outLen = Math.round(float32.length / ratio);
            const resampled = new Float32Array(outLen);
            for (let i = 0; i < outLen; i++) {
                const srcIdx = i * ratio;
                const i0 = Math.floor(srcIdx);
                const i1 = Math.min(i0 + 1, float32.length - 1);
                const frac = srcIdx - i0;
                resampled[i] = float32[i0] * (1 - frac) + float32[i1] * frac;
            }
            src = resampled;
        }
        const out = new Int16Array(src.length);
        for (let i = 0; i < src.length; i++) {
            const s = Math.max(-1, Math.min(1, src[i]));
            out[i] = s < 0 ? s * 0x8000 : s * 0x7fff;
        }
        return out;
    }

    let accumBuf = [],
        accumLen = 0;

    function flushAccumIfAny() {
        if (accumLen === 0 || !audioCtx) return;
        const merged = new Float32Array(accumLen);
        let off = 0;
        for (const arr of accumBuf) {
            merged.set(arr, off);
            off += arr.length;
        }
        accumBuf = [];
        accumLen = 0;
        sendAppend(floatTo16BitPCM(merged, audioCtx.sampleRate, TARGET_RATE));
    }

    function trimPreRoll() {
        if (!audioCtx) return;
        const maxPad = Math.round(audioCtx.sampleRate * VAD_PAD_MS / 1000);
        while (preRollSamples > maxPad && preRollBuffer.length > 0) {
            const removed = preRollBuffer.shift();
            preRollSamples -= removed.length;
        }
    }

    // ---------- VAD ----------
    const VAD_WINDOW = 512,
        VAD_CONTEXT = 64;
    let vadSession = null,
        vadState = null,
        vadCtx = null,
        vadBuf = [];
    let vadSpeechFrames = 0,
        vadSilenceFrames = 0,
        vadTriggered = false,
        vadReady = false;

    async function initSileroVAD() {
        try {
            if (typeof ort !== 'undefined' && ort.env && ort.env.wasm) {
                const libBase = (typeof chrome !== 'undefined' && chrome.runtime?.getURL)
                    ? chrome.runtime.getURL('lib/')
                    : './lib/';
                ort.env.wasm.wasmPaths = {
                    mjs: libBase + 'ort-wasm-simd-threaded.mjs',
                    wasm: libBase + 'ort-wasm-simd-threaded.wasm'
                };
                ort.env.wasm.numThreads = 1;
            }

            // Candidates to locate silero_vad.onnx:
            // 1. Packaged directly inside extension
            // 2. Served by companion server from downloaded models/ directory (:8000)
            // 3. Direct /silero_vad.onnx from companion
            // 4. Relative path
            const candidates = [];
            if (typeof chrome !== 'undefined' && chrome.runtime?.getURL) {
                candidates.push({ path: chrome.runtime.getURL('silero_vad.onnx'), label: 'extension bundle' });
            }
            candidates.push({ path: 'http://127.0.0.1:8000/models/silero_vad.onnx', label: 'companion /models/' });
            candidates.push({ path: 'http://127.0.0.1:8000/silero_vad.onnx', label: 'companion /silero_vad.onnx' });
            candidates.push({ path: './silero_vad.onnx', label: 'relative path' });

            let loaded = false;
            let lastErr = null;
            for (const cand of candidates) {
                try {
                    console.log(`[VAD] Attempting to load Silero VAD from ${cand.label} (${cand.path})...`);
                    const resp = await fetch(cand.path);
                    if (!resp.ok) {
                        console.warn(`[VAD] HTTP ${resp.status} fetching from ${cand.label}`);
                        continue;
                    }
                    const buffer = await resp.arrayBuffer();
                    vadSession = await ort.InferenceSession.create(buffer);
                    loaded = true;
                    console.log(`[VAD] Silero VAD successfully loaded from ${cand.label}`);
                    break;
                } catch (err) {
                    lastErr = err;
                    console.warn(`[VAD] Error initializing from ${cand.label}:`, err);
                }
            }

            if (loaded) {
                resetVAD();
                vadReady = true;
                showToast('Silero VAD loaded ✓');
            } else {
                throw lastErr || new Error('All VAD candidate sources unreachable');
            }
        } catch (e) {
            console.warn('[VAD] Could not load Silero VAD model, falling back to RMS speech detection:', e);
            showToast('Silero VAD load failed — using RMS fallback');
            vadReady = false;
        }
    }

    function resetVAD() {
        vadState = new Float32Array(2 * 1 * 128).fill(0);
        vadCtx = new Float32Array(VAD_CONTEXT).fill(0);
        vadBuf = [];
        vadSpeechFrames = 0;
        vadSilenceFrames = 0;
        vadTriggered = false;
        pendingCommit = false;
        preRollBuffer = [];
        preRollSamples = 0;
        accumBuf = [];
        accumLen = 0;
    }

    const WORKLET_SRC =
        `class MicProcessor extends AudioWorkletProcessor { process(inputs) { const input = inputs[0]; if (input && input[0]) { const ch = input[0]; let sum = 0; for (let i = 0; i < ch.length; i++) sum += ch[i] * ch[i]; const rms = Math.sqrt(sum / ch.length); const copy = ch.slice(0); this.port.postMessage({ samples: copy, rms }, [copy.buffer]); } return true; } } registerProcessor('mic-processor', MicProcessor);`;

    async function handleVAD(float32Samples, rms) {
        if (ttsMicMuted) { pushLevel(0, 'muted'); return; }
        pushLevel(rms, finalizing ? 'finalizing' : 'live');
        if (!vadReady) { handleLevelLegacy(rms); return; }
        let samples16k = float32Samples;
        if (audioCtx && audioCtx.sampleRate !== 16000) {
            const ratio = audioCtx.sampleRate / 16000;
            const outLen = Math.round(float32Samples.length / ratio);
            samples16k = new Float32Array(outLen);
            for (let i = 0; i < outLen; i++) {
                const srcIdx = i * ratio;
                const i0 = Math.floor(srcIdx);
                const i1 = Math.min(i0 + 1, float32Samples.length - 1);
                const frac = srcIdx - i0;
                samples16k[i] = float32Samples[i0] * (1 - frac) + float32Samples[i1] * frac;
            }
        }
        for (let i = 0; i < samples16k.length; i++) vadBuf.push(samples16k[i]);
        while (vadBuf.length >= VAD_WINDOW) {
            const frame = vadBuf.slice(0, VAD_WINDOW);
            vadBuf = vadBuf.slice(VAD_WINDOW);
            const input = new Float32Array(VAD_CONTEXT + VAD_WINDOW);
            input.set(vadCtx);
            input.set(frame, VAD_CONTEXT);
            vadCtx.set(frame.slice(frame.length - VAD_CONTEXT));
            const feeds = {
                input: new ort.Tensor('float32', input, [1, VAD_CONTEXT + VAD_WINDOW]),
                state: new ort.Tensor('float32', vadState, [2, 1, 128]),
                sr: new ort.Tensor('int64', new BigInt64Array([BigInt(16000)]), [1])
            };
            try {
                const out = await vadSession.run(feeds);
                const prob = out.output.data[0];
                vadState = new Float32Array(out.stateN.data);
                if (prob >= VAD_THRESHOLD) {
                    vadSpeechFrames++;
                    vadSilenceFrames = 0;
                    if (!vadTriggered && vadSpeechFrames >= VAD_MIN_SPEECH) {
                        vadTriggered = true;
                        if (!speaking) {
                            speaking = true;
                            turnStartedAt = performance.now();
                            resetLiveLine(window.i18n ? window.i18n.t('transcriptListening') : 'Listening…');
                            setTurnMode('speaking', 'speaking');
                        }
                        lastSpeechAt = performance.now();
                    }
                } else {
                    vadSilenceFrames++;
                    vadSpeechFrames = 0;
                    if (vadTriggered && vadSilenceFrames >= VAD_MIN_SILENCE) {
                        vadTriggered = false;
                        if (speaking && !finalizing) {
                            speaking = false;
                            finalizing = true;
                            setTurnMode('finalizing', 'finalizing turn…');
                            pendingCommit = true;
                        }
                    }
                }
            } catch (e) {
                vadReady = false;
                handleLevelLegacy(rms); return;
            }
        }
        if (speaking && !finalizing && performance.now() - turnStartedAt > MAX_UNCOMMITTED_MS) {
            speaking = false;
            finalizing = true;
            setTurnMode('finalizing', 'max turn length hit…');
            pendingCommit = true;
        }
    }

    function handleLevelLegacy(rms) {
        const now = performance.now();
        if (finalizing) return;
        if (rms > SPEECH_RMS_THRESHOLD) {
            if (!speaking) {
                speaking = true;
                turnStartedAt = now;
                resetLiveLine(window.i18n ? window.i18n.t('transcriptListening') : 'Listening…');
                setTurnMode('speaking', 'speaking');
            }
            lastSpeechAt = now;
        } else if (speaking && now - lastSpeechAt > SILENCE_MS) {
            speaking = false;
            finalizing = true;
            setTurnMode('finalizing', 'finalizing turn…');
            pendingCommit = true;
        }
        if (speaking && now - turnStartedAt > MAX_TURN_MS) {
            speaking = false;
            finalizing = true;
            setTurnMode('finalizing', 'max turn length hit…');
            pendingCommit = true;
        }
    }

    // ---------- SESSION ----------
    async function startSession() {
        resetLiveLine(window.i18n ? window.i18n.t('transcriptListening') : 'Listening…');
        showToast('');
        flowEpoch++;
        pendingTranscript = '';
        transcriptQueue = [];
        clearDebounceBuffers();
        try { await connectWs(); } catch (e) {
            showToast(window.i18n ? window.i18n.t('wsConnectFailed') : 'Could not connect to WebSocket');
            return;
        }
        try { await initSileroVAD(); } catch (e) {
            showToast('VAD init failed');
            if (ws) ws.close();
            return;
        }
        try {
            micStream = await navigator.mediaDevices.getUserMedia({
                audio: {
                    channelCount: 1,
                    echoCancellation: true, noiseSuppression: true
                }
            });
        } catch (e) {
            console.error('[Mic Error]', e);
            const isPerm = e.name === 'NotAllowedError' || (e.message && (e.message.includes('dismissed') || e.message.includes('Permission')));
            if (isPerm) {
                showToast(window.i18n ? window.i18n.t('micPermTabOpened') : 'Microphone permission tab opened — please click "Allow"');
                if (typeof chrome !== 'undefined' && chrome.tabs?.create) {
                    chrome.tabs.create({ url: chrome.runtime.getURL('permission.html') });
                }
            } else {
                showToast((window.i18n ? window.i18n.t('micAccessDenied') : 'Microphone access denied: ') + e.message);
            }
            if (ws) ws.close();
            return;
        }
        try {
            audioCtx = new (window.AudioContext || window.webkitAudioContext)({ sampleRate: TARGET_RATE });
        } catch (e) { audioCtx = new (window.AudioContext || window.webkitAudioContext)(); }
        const workletUrl = (typeof chrome !== 'undefined' && chrome.runtime?.getURL)
            ? chrome.runtime.getURL('worklet-processor.js')
            : URL.createObjectURL(new Blob([WORKLET_SRC], { type: 'application/javascript' }));
        await audioCtx.audioWorklet.addModule(workletUrl);
        const source = audioCtx.createMediaStreamSource(micStream);
        workletNode = new AudioWorkletNode(audioCtx, 'mic-processor');
        const chunkSamples = Math.round(audioCtx.sampleRate * (CHUNK_MS / 1000));
        workletNode.port.onmessage = async (ev) => {
            const { samples, rms } = ev.data;
            const wasSpeaking = speaking;
            await handleVAD(samples, rms);
            if (ttsMicMuted) {
                preRollBuffer.push(samples);
                preRollSamples += samples.length;
                gatedSamplesSkipped += samples.length;
                trimPreRoll();
            } else if (speaking) {
                if (!wasSpeaking) {
                    for (const buf of preRollBuffer) {
                        accumBuf.push(buf);
                        accumLen += buf.length;
                    }
                    preRollBuffer = [];
                    preRollSamples = 0;
                }
                accumBuf.push(samples);
                accumLen += samples.length;
                if (accumLen >= chunkSamples) flushAccumIfAny();
            } else {
                preRollBuffer.push(samples);
                preRollSamples += samples.length;
                gatedSamplesSkipped += samples.length;
                trimPreRoll();
            }
            if (pendingCommit && !ttsMicMuted) {
                flushAccumIfAny();
                sendCommit();
                pendingCommit = false;
            }
        };
        source.connect(workletNode);
        sessionActive = true;
        sessionStartedAt = Date.now();
        if (el.btnStopFormFlow) el.btnStopFormFlow.disabled = false;
        setTurnMode('listening', 'listening');
    }

    function endSession(reason) {
        flowEpoch++;
        sessionActive = false;
        speaking = false;
        finalizing = false;
        flowState = 'idle';
        pendingTranscript = '';
        transcriptQueue = [];
        clearDebounceBuffers();
        setTurnMode('idle', 'idle');
        if (ttsPlaying) interruptTTS();
        ttsMicMuted = false;
        el.micMutedBadge.classList.remove('visible');
        sessionStartedAt = 0;
        if (workletNode) {
            workletNode.port.onmessage = null;
            workletNode.disconnect();
            workletNode = null;
        }
        if (audioCtx) {
            audioCtx.close().catch(() => { });
            audioCtx = null;
        }
        if (micStream) {
            micStream.getTracks().forEach(t => t.stop());
            micStream = null;
        }
        if (ws && ws.readyState === WebSocket.OPEN) ws.close();
        resetVAD();
        gatedSamplesSkipped = 0;
        barHistory = new Array(BAR_COUNT).fill(0);
        pushLevel(0, 'idle');
        if (formFlowActive) {
            stopFormFlow();
        }
        if (el.btnStopFormFlow) el.btnStopFormFlow.disabled = true;
        if (el.btnStartFormFlow) el.btnStartFormFlow.disabled = scannedFields.length === 0;
        if (reason) showToast(reason);
        else showToast(window.i18n ? window.i18n.t('sessionEndedToast') : 'Session ended');
        if (!liveText) resetLiveLine(window.i18n ? window.i18n.t('transcriptIdle') : 'Click "Fill with Voice" to begin…');
    }

    // ---------- EVENT BINDING ----------
    if (el.interruptBtn) el.interruptBtn.addEventListener('click', () => { if (ttsPlaying) interruptTTS(); });

    // Form button bindings
    if (el.btnScanPage) el.btnScanPage.addEventListener('click', () => {
        ensureTTSContext();
        scanActivePage(true);
    });
    if (el.btnStartFormFlow) el.btnStartFormFlow.addEventListener('click', () => {
        ensureTTSContext();
        startFormFlow();
    });
    if (el.btnStopFormFlow) el.btnStopFormFlow.addEventListener('click', () => {
        endSession(window.i18n ? window.i18n.t('sessionEndedToast') : 'Session ended');
    });
    if (el.btnSkipField) el.btnSkipField.addEventListener('click', () => skipField());
    if (el.btnPrevField) el.btnPrevField.addEventListener('click', () => prevField());
    if (el.btnReaskField) el.btnReaskField.addEventListener('click', () => reaskCurrentField());

    console.log('[INIT] All event listeners attached. Form Assistant ready.');
    console.log('[FIX] Prefix-aware delta handling, liveText reset, debounce purge, and confirmation escape hatch are ACTIVE.');

    // ---------- COMPANION ORCHESTRATOR CLIENT ----------
    const COMPANION_BASE = 'http://127.0.0.1:8000';
    const compEl = {
        companionPill: document.getElementById('companionPill'),
        companionStatusText: document.getElementById('companionStatusText'),
        svcAasr: document.getElementById('svc-asr'),
        svcTts: document.getElementById('svc-tts'),
        svcLlm: document.getElementById('svc-llm'),
        btnStartServices: document.getElementById('btnStartServices'),
        btnStopServices: document.getElementById('btnStopServices'),
        btnCheckAssets: document.getElementById('btnCheckAssets'),
        btnLaunchCompanion: document.getElementById('btnLaunchCompanion'),
        companionOfflineBanner: document.getElementById('companionOfflineBanner'),
        orchestratorNotice: document.getElementById('orchestratorNotice'),
        linkMicPerm: document.getElementById('linkMicPerm')
    };

    if (compEl.linkMicPerm) {
        compEl.linkMicPerm.addEventListener('click', (e) => {
            e.preventDefault();
            if (typeof chrome !== 'undefined' && chrome.tabs?.create) {
                chrome.tabs.create({ url: chrome.runtime.getURL('permission.html') });
            }
        });
    }

    function triggerProtocolLaunch(url) {
        // Chrome extension side panels cannot directly navigate to custom protocols.
        // Opening launch.html in a top-level tab triggers the Windows OS protocol handler cleanly.
        if (typeof chrome !== 'undefined' && chrome.tabs?.create) {
            const lang = window.i18n ? window.i18n.getLanguage() : 'en';
            chrome.tabs.create({ url: chrome.runtime.getURL(`launch.html?lang=${encodeURIComponent(lang)}`) });
            return;
        }
        window.location.href = url;
    }

    let launchPollTimer = null;
    if (compEl.btnLaunchCompanion) {
        compEl.btnLaunchCompanion.addEventListener('click', () => {
            const t = (k, p) => (window.i18n ? window.i18n.t(k, p) : k);
            compEl.btnLaunchCompanion.disabled = true;
            compEl.btnLaunchCompanion.innerHTML = `<span>${t('companionStartingBtn')}</span>`;
            showToast(t('companionStartingToast'));

            triggerProtocolLaunch('voice-companion://start');

            if (launchPollTimer) clearInterval(launchPollTimer);
            let attempts = 0;
            launchPollTimer = setInterval(async () => {
                attempts++;
                try {
                    const resp = await fetch(`${COMPANION_BASE}/api/status`, { cache: 'no-store' });
                    if (resp.ok) {
                        clearInterval(launchPollTimer);
                        launchPollTimer = null;
                        compEl.btnLaunchCompanion.disabled = false;
                        compEl.btnLaunchCompanion.innerHTML = `<span>${t('companionReadyBtn')}</span>`;
                        checkCompanion();
                        showToast(t('companionOnlineToast'));
                        return;
                    }
                } catch (_) { }

                if (attempts >= 18) {
                    clearInterval(launchPollTimer);
                    launchPollTimer = null;
                    compEl.btnLaunchCompanion.disabled = false;
                    compEl.btnLaunchCompanion.innerHTML = `<span>${t('companionReadyBtn')}</span>`;
                    showToast(t('companionFailedToast'));
                }
            }, 1000);
        });
    }

    let isCompanionOnline = false;
    let previousAppLanguage = 'hi-IN';
    let isSyncingLanguage = false;

    async function checkCompanion() {
        try {
            const resp = await fetch(`${COMPANION_BASE}/api/status`, { cache: 'no-store' });
            if (!resp.ok) throw new Error();
            const data = await resp.json();
            isCompanionOnline = true;

            if (compEl.companionPill) {
                compEl.companionPill.className = 'badge badge-connected';
                compEl.companionStatusText.textContent = 'Companion Online';
            }
            if (compEl.companionOfflineBanner) compEl.companionOfflineBanner.style.display = 'none';
            if (compEl.btnStartServices) compEl.btnStartServices.disabled = false;
            if (compEl.btnStopServices) compEl.btnStopServices.disabled = false;
            if (compEl.btnCheckAssets) compEl.btnCheckAssets.disabled = false;

            function updateCard(card, live) {
                if (!card) return;
                card.dataset.status = live ? 'ready' : 'stopped';
                const b = card.querySelector('.svc-badge');
                if (b) b.textContent = live ? 'ready' : 'stopped';
            }
            updateCard(compEl.svcAasr, data.services?.asr?.live);
            updateCard(compEl.svcTts, data.services?.tts?.live);
            updateCard(compEl.svcLlm, data.services?.llm?.live);

            if (data.allReady) {
                if (el.btnStartFormFlow && scannedFields.length > 0 && !formFlowActive) {
                    el.btnStartFormFlow.disabled = false;
                }
            }

            // Sync companion backend language with active extension language if they differ
            const curLang = window.i18n ? window.i18n.getLanguage() : 'hi-IN';
            if (data.language && curLang && data.language !== curLang && !isSyncingLanguage) {
                isSyncingLanguage = true;
                try {
                    console.log(`[VFF] Synchronizing companion language (${data.language} -> ${curLang})...`);
                    await fetch(`${COMPANION_BASE}/api/language`, {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ language: curLang })
                    });
                } catch (syncErr) {
                    console.warn('[VFF] Language sync failed:', syncErr);
                } finally {
                    isSyncingLanguage = false;
                }
            }
        } catch (_) {
            isCompanionOnline = false;
            if (compEl.companionPill) {
                compEl.companionPill.className = 'badge badge-disconnected';
                compEl.companionStatusText.textContent = 'Companion Offline';
            }
            if (compEl.companionOfflineBanner) compEl.companionOfflineBanner.style.display = 'flex';
            if (compEl.btnStartServices) compEl.btnStartServices.disabled = true;
            if (compEl.btnStopServices) compEl.btnStopServices.disabled = true;
            if (compEl.btnCheckAssets) compEl.btnCheckAssets.disabled = true;
        }
    }

    if (compEl.btnStartServices) {
        compEl.btnStartServices.addEventListener('click', async () => {
            const t = (k, p) => (window.i18n ? window.i18n.t(k, p) : k);
            compEl.btnStartServices.disabled = true;
            showToast(t('servicesStartingToast'));
            try {
                await fetch(`${COMPANION_BASE}/api/start`, { method: 'POST' });
                showToast(t('servicesStartedToast'));
            } catch (e) {
                showToast(t('servicesStartFailedToast') + e.message);
            } finally {
                compEl.btnStartServices.disabled = false;
                checkCompanion();
            }
        });
    }

    if (compEl.btnStopServices) {
        compEl.btnStopServices.addEventListener('click', async () => {
            const t = (k, p) => (window.i18n ? window.i18n.t(k, p) : k);
            compEl.btnStopServices.disabled = true;
            try {
                await fetch(`${COMPANION_BASE}/api/stop`, { method: 'POST' });
                showToast(t('servicesStoppedToast'));
            } catch (e) {
                showToast(t('servicesStopFailedToast') + e.message);
            } finally {
                compEl.btnStopServices.disabled = false;
                checkCompanion();
            }
        });
    }

    if (compEl.btnCheckAssets) {
        compEl.btnCheckAssets.addEventListener('click', async () => {
            const t = (k, p) => (window.i18n ? window.i18n.t(k, p) : k);
            try {
                const resp = await fetch(`${COMPANION_BASE}/api/status`);
                const d = await resp.json();
                showToast(d.assets?.allPresent ? t('modelsAllPresentToast') : t('modelsMissingToast'));
            } catch (e) {
                showToast(t('checkFailedToast') + e.message);
            }
        });
    }

    // ---------- MULTILINGUAL I18N SUPPORT ----------
    async function setAppLanguage(lang, syncCompanion = false) {
        if (window.i18n) {
            await window.i18n.setLanguage(lang);
        }
        if (el.languageSelect) {
            el.languageSelect.value = lang;
        }
        renderScannedFieldsList();

        // Update companion backend with active language if requested
        if (syncCompanion && isCompanionOnline) {
            try {
                await fetch(`${COMPANION_BASE}/api/language`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ language: lang })
                });
            } catch (e) {
                console.warn('[VFF] Failed to inform companion of language change:', e);
            }
        }

        // Notify active tab content script if any
        const tab = await getActiveTab();
        if (tab && tab.id) {
            chrome.tabs.sendMessage(tab.id, { type: 'VFF_SET_LANGUAGE', language: lang }).catch(() => { });
        }
    }

    if (el.languageSelect) {
        el.languageSelect.addEventListener('change', async (e) => {
            const chosen = e.target.value;
            if (chosen === previousAppLanguage) return;

            const localeObj = window.__LOCALES__?.[chosen] || {};
            const chosenName = localeObj.name || chosen;

            previousAppLanguage = chosen;
            const t = (k, p) => (window.i18n ? window.i18n.t(k, p) : k);
            showToast(t('restartingToast', { name: chosenName }) || `Switching to ${chosenName}...`);

            // 1. Update UI, stored language in extension & active tab
            // 2. If companion is online, hot-restart ASR/TTS backend services via POST /api/language
            await setAppLanguage(chosen, true);
            await checkCompanion();
            showToast(`Language: ${chosenName}`);
        });
    }

    // Initialize i18n
    if (window.i18n) {
        window.i18n.init().then(async (curLang) => {
            previousAppLanguage = curLang;
            if (el.languageSelect) el.languageSelect.value = curLang;
            renderScannedFieldsList();
        });
    }

    checkCompanion();
    setInterval(checkCompanion, 3000);

    // Auto-scan current active tab on startup
    setTimeout(() => {
        scanActivePage(false);
    }, 600);

    // Auto-rescan on tab switch if not currently in active form fill flow
    if (typeof chrome !== 'undefined' && chrome.tabs && chrome.tabs.onActivated) {
        chrome.tabs.onActivated.addListener(() => {
            if (!formFlowActive) {
                scanActivePage(false);
            }
        });
    }

})();

