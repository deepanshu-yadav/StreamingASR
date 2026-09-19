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

    // FIX: Helper to detect if a raw string looks like a confirmation reply
    function looksLikeConfirmation(text) {
        const lower = text.toLowerCase().trim();
        if (!lower) return false;
        const heuristics = window.i18n ? window.i18n.getHeuristics() : null;
        const confirmWords = heuristics?.confirmWords || ['हाँ', 'हां', 'हा', 'जी', 'yes', 'haan', 'ha', 'ok', 'proceed', 'next', 'बिल्कुल', 'ठीक', 'ठीक है', 'theek hai', 'सही है', 'sahi hai', 'सही', 'sahi', 'आगे बढ़ो', 'बढ़ो', 'continue', 'confirm'];
        const negWords = heuristics?.negationWords || ['नहीं', 'नही', 'गलत', 'wrong', 'no', 'not', 'incorrect', 'change', 'sudhar', 'सुधार', 'बदलो', 'बदल', 'नहि', 'ना', 'न'];
        const hasConfirm = confirmWords.some(w => lower.includes(w));
        const hasNegate = negWords.some(w => lower.includes(w));
        return hasConfirm && !hasNegate;
    }

    function looksLikeSkip(text) {
        const lower = text.toLowerCase().trim();
        if (!lower) return false;
        const heuristics = window.i18n ? window.i18n.getHeuristics() : null;
        const skipWords = heuristics?.skipPhrases || [
            'छोड़ दो', 'छोड़ो', 'छोड़', 'आगे बढ़ें', 'आगे बढ़ो', 'आगे चलो', 'आगे',
            'अगला', 'अगली', 'skip', 'next', 'pass', 'baad me', 'बाद में', 'कैंसिल'
        ];
        return skipWords.some(w => lower.includes(w));
    }

    // Helper to detect whether an utterance is purely a rejection/negation without a replacement value
    function isPureRejection(text) {
        if (!text) return true;
        const heuristics = window.i18n ? window.i18n.getHeuristics() : null;
        const defaultNegationTokens = new Set([
            'नहीं', 'नही', 'ना', 'गलत', 'सही', 'ठीक', 'है', 'हैं', 'यह', 'ये', 'था', 'थी', 'गया', 'गई',
            'हो', 'अरे', 'बिल्कुल', 'बदलो', 'सुधारो', 'सुधार', 'गलती', 'बोल', 'दिया', 'का', 'के', 'की',
            'इसको', 'इसे', 'करना', 'करो', 'मुझे', 'आप', 'तो', 'भी', 'no', 'not', 'wrong', 'incorrect',
            'false', 'nope', 'nah', 'it', 'is', 'this', 'that', 'change', 'fix'
        ]);
        const tokens = text.toLowerCase()
            .replace(/[।.,!?\-]/g, ' ')
            .split(/\s+/)
            .filter(Boolean);
        if (tokens.length === 0) return true;
        const pureWords = heuristics?.pureRejectionWords ? new Set(heuristics.pureRejectionWords) : defaultNegationTokens;
        return tokens.every(w => defaultNegationTokens.has(w) || pureWords.has(w));
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
        if (flowState === 'form_awaiting_input') {
            handleFormFieldInput(text);
        } else if (flowState === 'form_awaiting_confirmation') {
            bufferFormConfirmationReply(text);
        } else if (flowState === 'form_awaiting_correction') {
            handleFormCorrectionInstruction(text);
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
            handleFormConfirmationReply(merged);
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

    function speak(text) {
        const cleanText = formatForSpeech(text);
        console.log('[TTS] speak() → "' + cleanText + '"');
        return new Promise(async (resolve) => {
            if (!cleanText || !cleanText.trim()) { resolve(); return; }

            const myToken = ++ttsCurrentToken;

            // Clear any active timers or previous TTS
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
            if (ttsSourceNode) {
                try { ttsSourceNode.stop(); } catch (e) { }
                ttsSourceNode = null;
            }

            ttsPlaying = true;
            ttsMicMuted = true;
            vadSpeechFrames = 0;
            vadSilenceFrames = 0;
            vadTriggered = false;
            el.micMutedBadge.classList.add('visible');
            el.interruptBtn.classList.add('visible');
            setTTSStatus('playing', 'tts playing…');

            ttsAbortController = new AbortController();
            ttsResolve = resolve;

            function cleanupTTS() {
                if (ttsSafetyTimer) {
                    clearTimeout(ttsSafetyTimer);
                    ttsSafetyTimer = null;
                }
                if (ttsSettleTimer) {
                    clearTimeout(ttsSettleTimer);
                    ttsSettleTimer = null;
                }
                if (myToken !== ttsCurrentToken) return;
                ttsPlaying = false;
                if (ttsSourceNode) {
                    try { ttsSourceNode.stop(); } catch (e) { }
                    ttsSourceNode = null;
                }
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
            }

            // Phase 1: Fetch/synthesis failsafe timeout
            // Piper Hindi on CPU takes ~50-80ms/char. Allow generous budget (min 45s, 300ms/char)
            // so long sentences or slower CPUs are never aborted prematurely during backend generation.
            const fetchTimeoutMs = Math.max(45000, cleanText.length * 300);
            ttsSafetyTimer = setTimeout(() => {
                if (myToken === ttsCurrentToken && (ttsPlaying || ttsMicMuted)) {
                    console.warn('[TTS] Synthesis timeout reached for token', myToken, '- Aborting TTS fetch.');
                    if (ttsAbortController) {
                        try { ttsAbortController.abort(); } catch (e) { }
                    }
                    cleanupTTS();
                }
            }, fetchTimeoutMs);

            try {
                const resp = await fetch('http://127.0.0.1:8000/v1/audio/speech', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        model: 'piper', input: cleanText, spoken_disclaimer: false,
                        stream: true, response_format: 'pcm'
                    }),
                    signal: ttsAbortController.signal
                });

                if (myToken !== ttsCurrentToken) return;
                if (!resp.ok) throw new Error(`TTS error: ${resp.status}`);
                const ab = await resp.arrayBuffer();

                if (myToken !== ttsCurrentToken) return;

                // Clear synthesis timeout now that audio has arrived
                if (ttsSafetyTimer) {
                    clearTimeout(ttsSafetyTimer);
                    ttsSafetyTimer = null;
                }

                const TTS_SAMPLE_RATE = 22050;
                const int16 = new Int16Array(ab);
                const f32 = new Float32Array(int16.length);
                for (let i = 0; i < int16.length; i++) f32[i] = int16[i] / 32768;

                ensureTTSContext();
                if (ttsPlaybackCtx.state === 'suspended') {
                    await ttsPlaybackCtx.resume().catch(() => { });
                }

                const buf = ttsPlaybackCtx.createBuffer(1, f32.length, TTS_SAMPLE_RATE);
                buf.getChannelData(0).set(f32);
                ttsSourceNode = ttsPlaybackCtx.createBufferSource();
                ttsSourceNode.buffer = buf;
                ttsSourceNode.connect(ttsPlaybackCtx.destination);

                const audioDurationMs = (f32.length / TTS_SAMPLE_RATE) * 1000;
                console.log(`[TTS] Audio ready: ${(audioDurationMs / 1000).toFixed(2)}s duration for token ${myToken}`);

                // Phase 2: Playback failsafe safety timeout based on EXACT audio duration + 5s buffer
                // This guarantees long sentences will NEVER be cut off during active playback,
                // while ensuring the mic is never permanently muted if onended fails to trigger.
                const playbackTimeoutMs = Math.round(audioDurationMs + 5000);
                ttsSafetyTimer = setTimeout(() => {
                    if (myToken === ttsCurrentToken && (ttsPlaying || ttsMicMuted)) {
                        console.warn('[TTS] Playback safety timeout reached for token', myToken);
                        cleanupTTS();
                    }
                }, playbackTimeoutMs);

                ttsSourceNode.onended = () => {
                    if (myToken !== ttsCurrentToken) return;
                    if (ttsSafetyTimer) {
                        clearTimeout(ttsSafetyTimer);
                        ttsSafetyTimer = null;
                    }
                    // Brief 300ms acoustic settling buffer to prevent mic picking up speaker reverberation
                    ttsSettleTimer = setTimeout(() => {
                        if (myToken !== ttsCurrentToken) return;
                        cleanupTTS();
                    }, 300);
                };

                ttsSourceNode.start();
            } catch (e) {
                if (myToken !== ttsCurrentToken) return;
                if (e.name === 'AbortError') {
                    console.log('[TTS] speak() aborted for token', myToken);
                    cleanupTTS();
                    return;
                }
                console.error('[TTS] Error:', e);
                showToast('TTS error: ' + e.message);
                cleanupTTS();
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
        if (ttsSourceNode) {
            try { ttsSourceNode.stop(); } catch (e) { }
            ttsSourceNode = null;
        }
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

    // ---------- LLM HELPERS ----------
    async function classifyIntentWithLLM(replyText) {
        const url = el.llmUrl.value.trim();
        const cleanReply = stripTags(replyText);
        console.log('[LLM] classifyIntentWithLLM() raw="' + replyText + '" clean="' + cleanReply + '" url=' + url);
        const lower = cleanReply.toLowerCase();
        const heuristics = window.i18n ? window.i18n.getHeuristics() : {};
        const negationPhrases = heuristics.negationWords || [
            'नहीं', 'नही', 'गलत', 'सुधार', 'बदल', 'ठीक नहीं', 'सही नहीं', 'गलती',
            'wrong', 'incorrect', 'change', 'not right', 'no', 'not'
        ];
        if (negationPhrases.some(w => lower.includes(w))) {
            console.log('[LLM] Heuristic found negation → CORRECT');
            return 'CORRECT';
        }
        const prompts = window.i18n ? window.i18n.getPrompts() : {};
        const system = prompts.intentClassifierSystem || 'Reply ONLY "CONFIRM" or "CORRECT".';
        const user = prompts.intentClassifierUser ? prompts.intentClassifierUser(cleanReply) : `User reply: "${cleanReply}"\nDecision:`;
        try {
            const resp = await fetch(url, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    messages: [{ role: 'system', content: system }, {
                        role: 'user',
                        content: user
                    }], temperature: 0.1, max_tokens: 10, stream: false
                })
            });
            if (!resp.ok) throw new Error(`LLM classification error: ${resp.status}`);
            const data = await resp.json();
            const content = (data?.choices?.[0]?.message?.content || '').trim().toUpperCase();
            console.log('[LLM] Classification raw response: "' + content + '"');
            const result = content.includes('CONFIRM') ? 'CONFIRM' : 'CORRECT';
            console.log('[LLM] Intent → ' + result);
            return result;
        } catch (e) {
            console.log('[LLM] Classifier error, fallback to heuristic:', e);
            const lower2 = cleanReply.toLowerCase();
            const neg = heuristics.negationWords || ['नहीं', 'नही', 'गलत', 'wrong', 'no', 'not', 'incorrect', 'change'];
            if (neg.some(w => lower2.includes(w))) {
                console.log('[LLM] Fallback heuristic → CORRECT');
                return 'CORRECT';
            }
            const pos = heuristics.confirmWords || ['हाँ', 'हां', 'हा', 'जी', 'yes', 'ok', 'proceed', 'next'];
            if (pos.some(w => lower2.includes(w))) {
                console.log('[LLM] Fallback heuristic → CONFIRM');
                return 'CONFIRM';
            }
            return 'CONFIRM';
        }
    }

    async function extractFormFieldValueWithLLM(fieldLabel, rawSpoken) {
        const cleanSpoken = cleanSpokenTranscript(rawSpoken);
        if (!cleanSpoken) return '';
        const isAadhaar = /aadhaar|आधार/i.test(fieldLabel);
        const isPhone = /phone|mobile|फोन|फ़ोन|मोबाइल/i.test(fieldLabel);

        // If already very short and clean (1-2 words), use directly (unless speech contains Devanagari in English mode)
        const curLang = window.i18n ? window.i18n.getLanguage() : 'en';
        const hasDevanagari = /[\u0900-\u097F]/.test(cleanSpoken);
        const conversationalTokens = ['मेरा', 'नाम', 'है', 'लिख', 'my', 'name', 'is', 'please', 'enter', 'write'];
        if ((curLang === 'hi' || !hasDevanagari) && cleanSpoken.split(/\s+/).length <= 2 && !conversationalTokens.some(t => cleanSpoken.toLowerCase().includes(t))) {
            return cleanSpoken.replace(/[।\.]+\s*$/, '').trim();
        }
        const url = el.llmUrl.value.trim();
        console.log(`[LLM] extractFormFieldValueWithLLM() field="${fieldLabel}" input="${cleanSpoken}"`);
        const prompts = window.i18n ? window.i18n.getPrompts() : {};
        const system = prompts.extractorSystem || 'Extract ONLY the clean value for the form field without conversational filler.';
        const user = prompts.extractorUser ? prompts.extractorUser(fieldLabel, cleanSpoken) : `Field: ${fieldLabel}\nSpoken: "${cleanSpoken}"\nClean Value:`;
        try {
            const resp = await fetch(url, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    messages: [
                        { role: 'system', content: system },
                        { role: 'user', content: user }
                    ],
                    temperature: 0.1,
                    max_tokens: 100,
                    stream: false
                })
            });
            if (!resp.ok) throw new Error(`LLM error: ${resp.status}`);
            const data = await resp.json();
            let content = (data?.choices?.[0]?.message?.content || '').trim();
            content = content.replace(/^(?:शुद्ध मान|Clean Value|Value)\s*[:：\-]\s*/i, '').trim();
            content = content.replace(/^["']|["']$/g, '').trim();
            content = content.replace(/[।\.]+\s*$/, '').trim();
            if (isAadhaar || isPhone) {
                const digits = content.replace(/\D/g, '');
                if (digits) content = digits;
            }
            console.log(`[LLM] Extracted clean value: "${content}"`);
            return content || cleanSpoken.replace(/[।\.]+\s*$/, '').trim();
        } catch (e) {
            console.warn('[LLM] Extraction failed, using raw:', e);
            return cleanSpoken.replace(/[।\.]+\s*$/, '').trim();
        }
    }

    async function correctFormFieldWithLLM(fieldLabel, currentValue, instruction) {
        const url = el.llmUrl.value.trim();
        const cleanOriginal = stripTags(currentValue).trim();
        const cleanInstruction = cleanSpokenTranscript(instruction);
        console.log(`[LLM] correctFormFieldWithLLM() field="${fieldLabel}" orig="${cleanOriginal}" instr="${cleanInstruction}"`);

        const isAadhaar = /aadhaar|आधार/i.test(fieldLabel);
        const isPhone = /phone|mobile|फोन|फ़ोन|मोबाइल/i.test(fieldLabel);
        const isNumeric = isAadhaar || isPhone || /pin|पिन|zip|number|संख्या/i.test(fieldLabel);

        const prompts = window.i18n ? window.i18n.getPrompts() : {};
        const system = prompts.correctorSystem || 'You are a form field correction assistant. Apply the user correction instruction to the previous value. Output ONLY the new clean value.';
        const user = prompts.correctorUser ? prompts.correctorUser(fieldLabel, cleanOriginal, cleanInstruction) : `Field: ${fieldLabel}\nPrevious: ${cleanOriginal}\nInstruction: "${cleanInstruction}"\nClean Value:`;

        try {
            const resp = await fetch(url, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    messages: [
                        { role: 'system', content: system },
                        { role: 'user', content: user }
                    ],
                    temperature: 0.1,
                    max_tokens: 120,
                    stream: false
                })
            });
            if (!resp.ok) throw new Error(`LLM error: ${resp.status}`);
            const data = await resp.json();
            let content = (data?.choices?.[0]?.message?.content || '').trim();
            content = content.replace(/^(?:शुद्ध मान|Clean Value|Corrected Value)\s*[:：\-]\s*/i, '').trim();
            content = content.replace(/^["']|["']$/g, '').trim();
            content = content.replace(/[।\.\?!,،;:]+\s*$/, '').trim();
            if (isNumeric) {
                const digits = content.replace(/\D/g, '');
                if (digits) content = digits;
            }
            console.log(`[LLM] Form field correction result → "${content}"`);
            if (content && content !== cleanOriginal) {
                return content;
            }
            console.warn('[LLM] Form field correction returned unchanged value.');
            return null;
        } catch (e) {
            console.warn('[LLM] Form field correction failed, using fallback:', e);
            return null;
        }
    }

    // ==========================================================
    // FORM FIELD SCANNER & SEQUENTIAL VOICE ITERATOR
    // ==========================================================
    let currentScannedTabId = null;
    let currentScannedUrl = '';
    let scannedFields = [];
    let currentFieldIndex = -1;
    let formFlowActive = false;
    let fieldValues = {}; // fieldId -> { value, confirmed: bool, timestamp }
    let pendingFieldValue = '';
    let currentFieldOriginalValue = '';
    let currentFieldCorrections = [];

    function setFormScanBadge(state, text) {
        if (!el.formScanBadge || !el.formScanBadgeText) return;
        el.formScanBadge.dataset.state = state;
        el.formScanBadgeText.textContent = text;
    }

    function renderScannedFieldsList() {
        if (!el.fieldsListContainer || !el.scannedFieldsCount) return;

        const emptyMsg = window.i18n ? window.i18n.t('noFieldsFound') : 'कोई फ़ील्ड नहीं मिला।';
        const reqTagText = window.i18n ? window.i18n.t('spotlightRequired') : '*आवश्यक';

        if (!scannedFields || scannedFields.length === 0) {
            el.fieldsListContainer.innerHTML = `<div style="color:var(--text-muted);font-size:11px;padding:4px;">${emptyMsg}</div>`;
            el.scannedFieldsCount.textContent = '0';
            if (el.formFieldsAccordion) el.formFieldsAccordion.style.display = 'none';
            return;
        }

        el.scannedFieldsCount.textContent = scannedFields.length;
        const summaryLabel = document.getElementById('scannedFieldsSummaryLabel');
        if (summaryLabel) {
            summaryLabel.innerHTML = window.i18n ? window.i18n.t('scannedFieldsTitle', { count: scannedFields.length }) : `📋 स्कैन किए गए फ़ील्ड्स (<b id="scannedFieldsCount">${scannedFields.length}</b>)`;
        }
        if (el.formFieldsAccordion) el.formFieldsAccordion.style.display = 'block';

        let html = '';
        scannedFields.forEach((f, idx) => {
            const isCur = formFlowActive && currentFieldIndex === idx;
            const record = fieldValues[f.id];
            const isConfirmed = record && record.confirmed;
            const cls = `field-item-row ${isCur ? 'active' : ''} ${isConfirmed ? 'confirmed' : ''}`;
            const valPreview = record ? escapeHtml(record.value) : '';
            const statusIcon = isConfirmed ? '✓' : (isCur ? '🎙️' : '⏳');
            const statusColor = isConfirmed ? 'color:var(--accent-green);font-weight:700;' : (isCur ? 'color:var(--accent-blue);' : 'color:var(--text-muted);');

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
        currentFieldIndex = index;
        const f = scannedFields[index];
        if (currentScannedTabId) {
            chrome.tabs.sendMessage(currentScannedTabId, { type: 'VFF_FOCUS_FIELD', fieldId: f.id }).catch(() => { });
        }
        renderScannedFieldsList();
        if (formFlowActive) {
            await askField(index);
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
        await speak(dict.sessionFinished || 'बहुत बढ़िया! इस पृष्ठ के सभी फ़ील्ड पूरे हो चुके हैं।');
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
            prompt = dict.askFieldRepeat ? dict.askFieldRepeat(f.label) : `कृपया ${f.label} के लिए अपना उत्तर बताएं।`;
        } else if (existingVal) {
            prompt = dict.askFieldExisting ? dict.askFieldExisting(f.label, existingVal) : `अगला फ़ील्ड है ${f.label}। इसका वर्तमान मान है ${existingVal}। क्या आप इसे बदलना चाहते हैं? नया मान बोलें या हाँ कहें।`;
        } else if (f.type === 'select') {
            prompt = dict.askFieldSelect ? dict.askFieldSelect(f.label, f.required) : `अगला फ़ील्ड है ${f.label}। ${f.required ? 'यह आवश्यक है।' : ''} कृपया बताएं इसमें क्या चुनना है?`;
        } else {
            prompt = dict.askFieldDefault ? dict.askFieldDefault(f.label, f.required) : `अगला फ़ील्ड है ${f.label}। ${f.required ? 'यह आवश्यक है।' : ''} कृपया बताएं इसमें क्या भरना है?`;
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

    async function handleFormFieldInput(text) {
        const myEpoch = flowEpoch;
        const clean = cleanSpokenTranscript(text).replace(/[।\.\?!,،;:]+\s*$/, '').trim();
        if (!clean) return;

        console.log(`[VFF] Field input received for #${currentFieldIndex}: "${clean}"`);

        // Check if user asked to skip
        if (looksLikeSkip(clean)) {
            await skipField();
            return;
        }

        const f = scannedFields[currentFieldIndex];
        const t = (k, p) => (window.i18n ? window.i18n.t(k, p) : k);
        const dict = window.i18n ? window.i18n.getDictation() : {};

        // Extract clean field value using LLM if conversational
        let cleanValue = clean;
        try {
            cleanValue = await extractFormFieldValueWithLLM(f.label, clean);
        } catch (e) {
            console.warn('[VFF] LLM extraction fallback:', e);
        }
        if (myEpoch !== flowEpoch) return;

        cleanValue = (cleanValue || clean).replace(/[।\.\?!,،;:]+\s*$/, '').trim();

        if (!currentFieldOriginalValue) currentFieldOriginalValue = cleanValue;
        pendingFieldValue = cleanValue;

        // Update spotlight value preview
        if (el.spotlightValue) {
            el.spotlightValue.textContent = cleanValue;
            el.spotlightValue.classList.remove('empty');
        }
        setLiveText(cleanValue);

        // Prompt for confirmation
        flowState = 'busy';
        if (el.spotlightStatus) {
            el.spotlightStatus.dataset.phase = 'confirming';
            el.spotlightStatus.textContent = t('spotlightPhaseConfirming');
        }
        setTurnMode('confirming', f.label);

        const confirmPrompt = dict.confirmField ? dict.confirmField(f.label, cleanValue) : `${f.label} के लिए: ${cleanValue}। क्या यह सही है? हाँ बोलें, या बताएं कि क्या सुधारना है।`;
        await speak(confirmPrompt);
        if (myEpoch !== flowEpoch) return;

        flowState = 'form_awaiting_confirmation';
        if (el.spotlightStatus) el.spotlightStatus.textContent = t('spotlightPhaseConfirming');
        setTurnMode('listening', f.label);
        resetLiveLine(t('transcriptConfirmPrompt'));
        drainTranscriptQueue();
    }

    async function handleFormConfirmationReply(replyText) {
        const myEpoch = flowEpoch;
        clearDebounceBuffers();
        const cleanReply = stripTags(replyText).trim();
        if (!cleanReply) return;

        console.log(`[VFF] Field confirmation reply: "${cleanReply}"`);

        // Check for skip command
        if (looksLikeSkip(cleanReply)) {
            await skipField();
            return;
        }

        const t = (k, p) => (window.i18n ? window.i18n.t(k, p) : k);
        const dict = window.i18n ? window.i18n.getDictation() : {};

        flowState = 'evaluating_intent';
        setTurnMode('finalizing', t('spotlightPhaseEvaluating'));

        const intent = await classifyIntentWithLLM(cleanReply);
        if (myEpoch !== flowEpoch) return;

        const f = scannedFields[currentFieldIndex];

        if (intent === 'CONFIRM') {
            const confirmedVal = pendingFieldValue;
            console.log(`[VFF] Field #${currentFieldIndex} "${f.label}" CONFIRMED with value: "${confirmedVal}"`);

            // Save confirmed value
            fieldValues[f.id] = {
                value: confirmedVal,
                confirmed: true,
                timestamp: Date.now()
            };

            // Call content script action hook (to reflect or prepare in page DOM)
            if (currentScannedTabId) {
                chrome.tabs.sendMessage(currentScannedTabId, {
                    type: 'VFF_SET_FIELD_VALUE',
                    fieldId: f.id,
                    value: confirmedVal
                }).catch(() => { });
            }

            currentFieldCorrections = [];
            currentFieldOriginalValue = '';

            // Update UI
            if (el.spotlightStatus) {
                el.spotlightStatus.dataset.phase = 'confirmed';
                el.spotlightStatus.textContent = t('spotlightPhaseConfirmed');
            }
            renderScannedFieldsList();

            // Speak brief confirmation
            flowState = 'busy';
            await speak(dict.fieldRecorded ? dict.fieldRecorded(f.label) : `ठीक है, ${f.label} दर्ज हो गया।`);
            if (myEpoch !== flowEpoch) return;

            // Move to next field!
            currentFieldIndex++;
            if (currentFieldIndex < scannedFields.length) {
                await askField(currentFieldIndex);
            } else {
                await finishFormFlow();
            }
        } else {
            // User indicated that the current value is NOT correct
            console.log(`[VFF] Field #${currentFieldIndex} "${f.label}" rejected. Reply: "${cleanReply}"`);

            // Check for skip command
            if (looksLikeSkip(cleanReply)) {
                await skipField();
                return;
            }

            // Check if user spoke a pure rejection vs providing instructions or new value
            if (isPureRejection(cleanReply)) {
                flowState = 'busy';
                if (el.spotlightStatus) {
                    el.spotlightStatus.dataset.phase = 'asking';
                    el.spotlightStatus.textContent = t('spotlightPhaseAsking');
                }
                setTurnMode('confirming', f.label);
                await speak(dict.askCorrection ? dict.askCorrection(f.label) : `कृपया सुधार बताएं, ${f.label} में क्या भरना है?`);
                if (myEpoch !== flowEpoch) return;

                flowState = 'form_awaiting_correction';
                if (el.spotlightStatus) {
                    el.spotlightStatus.dataset.phase = 'listening';
                    el.spotlightStatus.textContent = t('spotlightPhaseListening');
                }
                setTurnMode('listening', f.label);
                resetLiveLine(t('transcriptConfirmPrompt'));
                drainTranscriptQueue();
            } else {
                // User already provided the correction phrase (e.g. "नहीं, 8178524055", "डॉट हटा दो", "remove dot")
                await handleFormCorrectionInstruction(cleanReply);
            }
        }
    }

    async function handleFormCorrectionInstruction(instructionText) {
        const myEpoch = flowEpoch;
        clearDebounceBuffers();
        const clean = stripTags(instructionText).trim();
        if (!clean) return;

        console.log(`[VFF] Correction instruction received for #${currentFieldIndex}: "${clean}"`);

        // Check if user decided to skip
        if (looksLikeSkip(clean)) {
            await skipField();
            return;
        }

        // Check if user confirmed instead
        if (looksLikeConfirmation(clean)) {
            await handleFormConfirmationReply('हाँ');
            return;
        }

        const f = scannedFields[currentFieldIndex];
        const t = (k, p) => (window.i18n ? window.i18n.t(k, p) : k);
        const dict = window.i18n ? window.i18n.getDictation() : {};

        // If the user spoke only a pure rejection without giving the new value, ask for the new value again
        if (isPureRejection(clean)) {
            console.log(`[VFF] Pure rejection in correction state for #${currentFieldIndex}: "${clean}"`);
            flowState = 'busy';
            if (el.spotlightStatus) {
                el.spotlightStatus.dataset.phase = 'asking';
                el.spotlightStatus.textContent = t('spotlightPhaseAsking');
            }
            setTurnMode('confirming', f.label);
            await speak(dict.clarifyValue ? dict.clarifyValue(f.label) : `कृपया ${f.label} के लिए नया या सही मान बोलें।`);
            if (myEpoch !== flowEpoch) return;

            flowState = 'form_awaiting_correction';
            if (el.spotlightStatus) {
                el.spotlightStatus.dataset.phase = 'listening';
                el.spotlightStatus.textContent = t('spotlightPhaseListening');
            }
            setTurnMode('listening', f.label);
            resetLiveLine(t('transcriptConfirmPrompt'));
            drainTranscriptQueue();
            return;
        }

        flowState = 'correcting';
        setTurnMode('finalizing', t('spotlightPhaseEvaluating'));

        try {
            const corrected = await correctFormFieldWithLLM(f.label, pendingFieldValue, clean);
            if (myEpoch !== flowEpoch) return;

            if (!corrected || corrected === pendingFieldValue) {
                console.warn(`[VFF] Correction could not be applied for #${currentFieldIndex} (${f.label})`);
                flowState = 'busy';
                if (el.spotlightStatus) {
                    el.spotlightStatus.dataset.phase = 'asking';
                    el.spotlightStatus.textContent = t('spotlightPhaseAsking');
                }
                setTurnMode('confirming', f.label);
                await speak(dict.clarifyValue ? dict.clarifyValue(f.label) : `कृपया ${f.label} के लिए सही मान दोबारा बोलें।`);
                if (myEpoch !== flowEpoch) return;

                flowState = 'form_awaiting_correction';
                if (el.spotlightStatus) {
                    el.spotlightStatus.dataset.phase = 'listening';
                    el.spotlightStatus.textContent = t('spotlightPhaseListening');
                }
                setTurnMode('listening', f.label);
                resetLiveLine(t('transcriptConfirmPrompt'));
                drainTranscriptQueue();
                return;
            }

            currentFieldCorrections.push({ instruction: clean, corrected });
            pendingFieldValue = corrected;
            if (el.spotlightValue) {
                el.spotlightValue.textContent = corrected;
                el.spotlightValue.classList.remove('empty');
            }
            setLiveText(corrected);

            flowState = 'busy';
            if (el.spotlightStatus) {
                el.spotlightStatus.dataset.phase = 'confirming';
                el.spotlightStatus.textContent = t('spotlightPhaseConfirming');
            }
            await speak(dict.confirmCorrection ? dict.confirmCorrection(corrected) : `सुधारा गया: ${corrected}।`);
            if (myEpoch !== flowEpoch) return;

            flowState = 'form_awaiting_confirmation';
            if (el.spotlightStatus) {
                el.spotlightStatus.dataset.phase = 'confirming';
                el.spotlightStatus.textContent = t('spotlightPhaseConfirming');
            }
            setTurnMode('listening', f.label);
            resetLiveLine(t('transcriptConfirmPrompt'));
            drainTranscriptQueue();
        } catch (err) {
            console.warn('[VFF] Correction error:', err);
            flowState = 'busy';
            await speak(dict.clarifyValue ? dict.clarifyValue(f.label) : `कृपया ${f.label} के लिए सही मान दोबारा बोलें।`);
            if (myEpoch !== flowEpoch) return;
            flowState = 'form_awaiting_correction';
            setTurnMode('listening', f.label);
            drainTranscriptQueue();
        }
    }

    async function skipField() {
        const f = scannedFields[currentFieldIndex];
        const dict = window.i18n ? window.i18n.getDictation() : {};
        console.log(`[VFF] Skipping field #${currentFieldIndex} "${f?.label}"`);
        flowState = 'busy';
        await speak(dict.fieldSkipped ? dict.fieldSkipped(f?.label) : 'ठीक है, इस फ़ील्ड को छोड़ रहे हैं।');
        currentFieldIndex++;
        if (currentFieldIndex < scannedFields.length) {
            await askField(currentFieldIndex);
        } else {
            await finishFormFlow();
        }
    }

    async function prevField() {
        if (currentFieldIndex > 0) {
            currentFieldIndex--;
            await askField(currentFieldIndex);
        } else {
            showToast(window.i18n ? window.i18n.t('firstFieldToast') : 'This is the first field');
        }
    }

    async function reaskCurrentField() {
        if (currentFieldIndex >= 0 && currentFieldIndex < scannedFields.length) {
            await askField(currentFieldIndex, true);
        }
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
            if (flowState === 'form_awaiting_input') {
                handleFormFieldInput(finalText);
            } else if (flowState === 'form_awaiting_confirmation') {
                bufferFormConfirmationReply(finalText);
            } else if (flowState === 'form_awaiting_correction') {
                handleFormCorrectionInstruction(finalText);
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

