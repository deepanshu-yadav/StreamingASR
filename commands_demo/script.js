(() => {
    // ---------- CONFIG ----------
    const TARGET_RATE = 16000,
        CHUNK_MS = 100,
        BAR_COUNT = 44,
        MAX_WS_BUFFERED_BYTES = 512 * 1024;

    // VAD / RMS defaults
    let VAD_THRESHOLD = 0.50;
    let VAD_MIN_SPEECH = 3;
    let VAD_MIN_SILENCE = 10;
    let MAX_UNCOMMITTED_MS = 3500;
    let VAD_PAD_MS = 200;
    let SPEECH_RMS_THRESHOLD = 0.012;
    let SILENCE_MS = 700;
    let MAX_TURN_MS = 10000;

    // Confirmation debounce (ms)
    let CONFIRM_DEBOUNCE_MS = 1000;

    // ---------- DOM REFS ----------
    const el = {
        wsUrl: document.getElementById('wsUrl'),
        statusPill: document.getElementById('statusPill'),
        statusText: document.getElementById('statusText'),
        sessionBtn: document.getElementById('sessionBtn'),
        sessionBtnText: document.getElementById('sessionBtnText'),
        turnState: document.getElementById('turnState'),
        turnStateText: document.getElementById('turnStateText'),
        signalStrip: document.getElementById('signalStrip'),
        liveLine: document.getElementById('liveLine'),
        history: document.getElementById('history'),
        toast: document.getElementById('toast'),
        statDuration: document.getElementById('statDuration'),
        statCommands: document.getElementById('statCommands'),
        statWords: document.getElementById('statWords'),
        statChunks: document.getElementById('statChunks'),
        statSkipped: document.getElementById('statSkipped'),
        finalizeBtn: document.getElementById('finalizeBtn'),
        copyBtn: document.getElementById('copyBtn'),
        exportBtn: document.getElementById('exportBtn'),
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
    };

    // ---------- HELPERS ----------
    function stripTags(s) { if (!s) return ''; return s.toString().replace(/<[^>]+>/g, '').trim(); }

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
        const confirmWords = ['हाँ', 'हां', 'हा', 'जी', 'yes', 'haan', 'ha', 'ok', 'proceed', 'next', 'बिल्कुल', 'ठीक', 'ठीक है', 'theek hai', 'सही है', 'sahi hai', 'सही', 'sahi', 'आगे बढ़ो', 'बढ़ो', 'continue', 'confirm'];
        const negWords = ['नहीं', 'नही', 'गलत', 'wrong', 'no', 'not', 'incorrect', 'change', 'sudhar', 'सुधार', 'बदलो', 'बदल', 'नहि', 'ना', 'न'];
        const hasConfirm = confirmWords.some(w => lower.includes(w));
        const hasNegate = negWords.some(w => lower.includes(w));
        return hasConfirm && !hasNegate;
    }

    // FIX: Central helper to wipe debounce buffers so stale text never leaks across turns
    function clearDebounceBuffers() {
        clearTimeout(confirmDebounceTimer);
        confirmReplyBuffer = '';
        confirmDebounceTimer = null;
        clearTimeout(correctionDebounceTimer);
        correctionReplyBuffer = '';
        correctionDebounceTimer = null;
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
    let flowState = 'listening_command';
    let pendingTranscript = '',
        currentCommand = null,
        commands = [];
    let transcriptQueue = [];
    let flowEpoch = 0;
    let ttsPlaying = false,
        ttsAbortController = null,
        ttsPlaybackCtx = null,
        ttsSourceNode = null,
        ttsMicMuted = false,
        ttsResolve = null;
    let pendingCommit = false,
        preRollBuffer = [],
        preRollSamples = 0,
        gatedSamplesSkipped = 0;

    // ---------- DEBOUNCE BUFFERS ----------
    let confirmReplyBuffer = '';
    let confirmDebounceTimer = null;

    let correctionReplyBuffer = '';
    let correctionDebounceTimer = null;

    // ---------- QUEUE ----------
    function queueTranscript(text) {
        transcriptQueue.push(text);
        showToast('कृपया प्रतीक्षा करें, प्रक्रिया जारी है…');
    }

    function drainTranscriptQueue() {
        if (transcriptQueue.length === 0) return;
        const text = transcriptQueue.shift();
        if (flowState === 'awaiting_confirmation') {
            bufferConfirmationReply(text);
        } else if (flowState === 'listening_command') {
            currentCommand = {
                original: text, corrections: [], final: null, accepted: false,
                createdAt: Date.now()
            };
            renderHistory();
            beginConfirmation(text);
        } else if (flowState === 'awaiting_correction') {
            bufferCorrectionReply(text);
        } else {
            transcriptQueue.unshift(text);
        }
    }

    // ---------- DEBOUNCE FUNCTIONS ----------
    function bufferConfirmationReply(text) {
        const clean = stripTags(text);
        if (!clean) return;
        confirmReplyBuffer = confirmReplyBuffer ? (confirmReplyBuffer + ' ' + clean) : clean;
        clearTimeout(confirmDebounceTimer);
        setTurnMode('finalizing', 'सुन रहे हैं…');
        confirmDebounceTimer = setTimeout(() => {
            const merged = confirmReplyBuffer;
            confirmReplyBuffer = '';
            confirmDebounceTimer = null;
            handleConfirmationReply(merged);
        }, CONFIRM_DEBOUNCE_MS);
    }

    function bufferCorrectionReply(text) {
        const clean = stripTags(text);
        if (!clean) return;

        // FIX: Escape hatch — if the user says "हाँ / सही है / आगे बढ़ो" while we are asking for a correction,
        // route it to the confirmation handler instead of sending it to the LLM as a correction instruction.
        if (looksLikeConfirmation(clean)) {
            console.log('[FLOW] Correction buffer detected confirmation-like reply, routing to confirmation');
            bufferConfirmationReply(clean);
            return;
        }

        correctionReplyBuffer = correctionReplyBuffer ? (correctionReplyBuffer + ' ' + clean) : clean;
        clearTimeout(correctionDebounceTimer);
        setTurnMode('finalizing', 'सुधार सुन रहे हैं…');
        correctionDebounceTimer = setTimeout(() => {
            const merged = correctionReplyBuffer;
            correctionReplyBuffer = '';
            correctionDebounceTimer = null;
            handleCorrectionInstruction(merged);
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

    // ---------- RENDER HISTORY ----------
    function renderHistory() {
        const all = [...commands];
        if (currentCommand) all.push(currentCommand);
        if (all.length === 0) {
            el.history.innerHTML = '<div class="history-empty">अभी तक कोई पूर्ण command नहीं।</div>';
            el.statCommands.textContent = '0';
            return;
        }
        let html = '';
        all.forEach((cmd, idx) => {
            const num = idx + 1,
                t = cmd.createdAt ? formatTime(cmd.createdAt) : formatTime(Date.now());
            html += `<div class="cmd-group"><div class="label">command ${String(num).padStart(2, '0')} &middot; ${t}</div>`;
            html +=
                `<div class="line"><span class="badge no">✗</span><span class="text-original">${escapeHtml(cmd.original)}</span></div>`;
            if (cmd.corrections && cmd.corrections.length > 0) {
                cmd.corrections.forEach(c => {
                    html +=
                        `<div class="line" style="padding-left:30px;"><span class="badge corr">🟡</span><span class="text-correction">${escapeHtml(c.instruction)} &rarr; <b>${escapeHtml(c.corrected)}</b></span></div>`;
                });
            }
            if (cmd.accepted) {
                html +=
                    `<div class="line"><span class="badge yes">✓</span><span class="text-final">${escapeHtml(cmd.final)}</span></div>`;
            }
            html += `</div>`;
        });
        el.history.innerHTML = html;
        el.statCommands.textContent = commands.length;
    }

    // ---------- TTS ----------
    function speak(text) {
        const cleanText = stripTags(text);
        console.log('[TTS] speak() → "' + cleanText + '"');
        return new Promise((resolve) => {
            if (!cleanText || !cleanText.trim()) { resolve(); return; }
            if (ttsAbortController) {
                ttsAbortController.abort();
                ttsAbortController = null;
            }
            if (ttsSourceNode) { try { ttsSourceNode.stop(); } catch (e) { } ttsSourceNode = null; }
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
            fetch('/v1/audio/speech', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    model: 'piper', input: cleanText, spoken_disclaimer: false,
                    stream: true, response_format: 'pcm'
                }),
                signal: ttsAbortController.signal
            })
                .then(resp => {
                    if (!resp.ok) throw new Error(`TTS error: ${resp.status}`);
                    return resp.arrayBuffer();
                })
                .then(ab => {
                    if (!ttsPlaying) {
                        ttsResolve = null;
                        resolve(); return;
                    }
                    const TTS_SAMPLE_RATE = 22050;
                    const int16 = new Int16Array(ab);
                    const f32 = new Float32Array(int16.length);
                    for (let i = 0; i < int16.length; i++) f32[i] = int16[i] / 32768;
                    if (!ttsPlaybackCtx || ttsPlaybackCtx.state === 'closed') {
                        ttsPlaybackCtx = new (window.AudioContext || window.webkitAudioContext)({
                            sampleRate: TTS_SAMPLE_RATE
                        });
                    }
                    const buf = ttsPlaybackCtx.createBuffer(1, f32.length, TTS_SAMPLE_RATE);
                    buf.getChannelData(0).set(f32);
                    ttsSourceNode = ttsPlaybackCtx.createBufferSource();
                    ttsSourceNode.buffer = buf;
                    ttsSourceNode.connect(ttsPlaybackCtx.destination);
                    ttsSourceNode.onended = () => {
                        ttsPlaying = false;
                        ttsSourceNode = null;
                        setTTSStatus('idle', 'tts done');
                        setTimeout(() => {
                            ttsMicMuted = false;
                            el.micMutedBadge.classList.remove('visible');
                            drainTranscriptQueue();
                        }, 300);
                        el.interruptBtn.classList.remove('visible');
                        if (ttsResolve) {
                            const r = ttsResolve;
                            ttsResolve = null;
                            r();
                        } else resolve();
                    };
                    ttsSourceNode.start();
                })
                .catch(e => {
                    if (e.name === 'AbortError') {
                        if (ttsResolve) {
                            const r = ttsResolve;
                            ttsResolve = null;
                            r();
                        } else resolve();
                        return;
                    }
                    showToast('TTS error: ' + e.message);
                    ttsPlaying = false;
                    setTTSStatus('idle', 'tts error');
                    ttsMicMuted = false;
                    el.micMutedBadge.classList.remove('visible');
                    el.interruptBtn.classList.remove('visible');
                    if (ttsResolve) {
                        const r = ttsResolve;
                        ttsResolve = null;
                        r();
                    } else resolve();
                });
        });
    }

    function interruptTTS() {
        if (ttsAbortController) {
            ttsAbortController.abort();
            ttsAbortController = null;
        }
        if (ttsSourceNode) { try { ttsSourceNode.stop(); } catch (e) { } ttsSourceNode = null; }
        ttsPlaying = false;
        setTTSStatus('idle', 'tts interrupted');
        ttsMicMuted = false;
        el.micMutedBadge.classList.remove('visible');
        el.interruptBtn.classList.remove('visible');
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
        const negationWords = ['नहीं', 'नही', 'गलत', 'सुधार', 'बदल', 'ठीक नहीं', 'नहि', 'ना', 'न', 'wrong',
            'incorrect', 'change'
        ];
        if (negationWords.some(w => lower.includes(w))) {
            console.log('[LLM] Heuristic found negation → CORRECT');
            return 'CORRECT';
        }
        const system = 'आप एक वर्गीकरण सहायक (intent classifier) हैं।\n' +
            'उपयोगकर्ता से पूछा गया है कि क्या उनका बोला गया वाक्य सही है।\n\n' +
            'नियम:\n' +
            '1. यदि उपयोगकर्ता हाँ, ठीक, बिल्कुल, आगे बढ़ो, या पुष्टि करता है → केवल "CONFIRM" लिखें।\n' +
            '2. यदि उपयोगकर्ता नहीं, सही नहीं है, गलत है, बदलाव चाहता है, सुधार बताता है, या नया निर्देश देता है → केवल "CORRECT" लिखें।\n\n' +
            'महत्वपूर्ण:\n' +
            '- "सही नहीं है", "नहीं", "गलत", "change", "sudhar" जैसे शब्द CORRECT का संकेत हैं।\n' +
            '- केवल "सही है", "हाँ", "ठीक" जैसे शब्द CONFIRM का संकेत हैं।\n' +
            '- किसी भी संदेह में CORRECT चुनें।\n\n' +
            'केवल एक शब्द उत्तर दें: CONFIRM या CORRECT।';
        const user = `उपयोगकर्ता का जवाब: "${cleanReply}"\nनिर्णय:`;
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
            const neg = ['नहीं', 'नही', 'गलत', 'wrong', 'no', 'not', 'incorrect', 'change', 'sudhar', 'सुधार',
                'बदलो', 'बदल'
            ];
            if (neg.some(w => lower2.includes(w))) {
                console.log('[LLM] Fallback heuristic → CORRECT');
                return 'CORRECT';
            }
            const pos = ['हाँ', 'हां', 'हा', 'जी', 'yes', 'haan', 'ha', 'ok', 'proceed', 'next', 'बिल्कुल',
                'ठीक'
            ];
            if (pos.some(w => lower2.includes(w))) {
                console.log('[LLM] Fallback heuristic → CONFIRM');
                return 'CONFIRM';
            }
            if (lower2.includes('सही है') || lower2.includes('sahi hai')) {
                console.log(
                    '[LLM] Fallback heuristic → CONFIRM');
                return 'CONFIRM';
            }

            // FIX: Default to CONFIRM for empty / ambiguous input so the user is never trapped.
            console.log('[LLM] Fallback heuristic → CONFIRM (ambiguous/empty, defaulting to confirm)');
            return 'CONFIRM';
        }
    }

    async function correctWithLLM(original, instruction) {
        const url = el.llmUrl.value.trim();
        const cleanOriginal = stripTags(original);
        const cleanInstruction = stripTags(instruction);
        console.log('[LLM] correctWithLLM() original="' + original + '"→"' + cleanOriginal + '" instruction="' +
            instruction + '"→"' + cleanInstruction + '"');
        const system = `आप एक हिंदी वाक्-पहचान (speech-to-text) सुधार सहायक हैं।
उपयोगकर्ता ने पिछली ट्रांसक्रिप्शन में सुधार बताया है।

नियम:
1. पिछली ट्रांसक्रिप्शन को आधार मानें।
2. केवल वही भाग बदलें जो सुधार निर्देश में कहा गया है।
3. बाकी पूरा वाक्य ज्यों का त्यों रखें।
4. अंतिम उत्तर **पूरा सही वाक्य** होना चाहिए — कोई अधूरा टुकड़ा नहीं।
5. कोई व्याख्या, उद्धरण चिह्न या अतिरिक्त शब्द न लिखें। केवल पूरा वाक्य।`;
        const user =
            `पिछली ट्रांसक्रिप्शन: "${cleanOriginal}"\nसुधार निर्देश: "${cleanInstruction}"\nसुधारा गया वाक्य:`;
        console.log('[LLM] Sending correction request…');
        const resp = await fetch(url, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                messages: [{ role: 'system', content: system }, {
                    role: 'user',
                    content: user
                }], temperature: 0.2, max_tokens: 200, stream: false
            })
        });
        if (!resp.ok) throw new Error(`LLM error: ${resp.status}`);
        const data = await resp.json();
        let content = data?.choices?.[0]?.message?.content?.trim();
        if (!content) throw new Error('LLM returned empty');
        content = content.replace(/^सुधारा गया वाक्य\s*[:：\-]\s*/, '').trim();
        content = content.replace(/^["']|["']$/g, '').trim();
        console.log('[LLM] Correction result → "' + content + '"');
        return content;
    }

    // ---------- FLOW: handleCorrectionInstruction ----------
    async function handleCorrectionInstruction(instructionText) {
        console.log('[FLOW] handleCorrectionInstruction() instruction="' + instructionText + '"');
        const myEpoch = flowEpoch;
        const original = pendingTranscript;
        const cleanInstruction = stripTags(instructionText);
        if (!currentCommand) {
            currentCommand = {
                original: original, corrections: [], final: null, accepted: false,
                createdAt: Date.now()
            };
            console.log('[FLOW] Created new currentCommand for correction.');
        }
        flowState = 'correcting';
        setTurnMode('finalizing', 'सुधार हो रहा है…');
        try {
            const corrected = await correctWithLLM(original, cleanInstruction);
            if (myEpoch !== flowEpoch) {
                console.log(
                    '[FLOW] handleCorrectionInstruction: session reset mid-correct — discarding.');
                return;
            }
            console.log('[FLOW] Corrected text → "' + corrected + '"');
            currentCommand.corrections.push({ instruction: cleanInstruction, corrected });
            pendingTranscript = corrected;
            renderHistory();
            setLiveText(corrected);
            flowState = 'busy';
            console.log('[FLOW] flowState → busy (speaking correction confirmation)');
            const prompt = `सुधारा गया: ${corrected}. क्या यह सही है?`;
            await speak(prompt);
            if (myEpoch !== flowEpoch) {
                console.log(
                    '[FLOW] handleCorrectionInstruction: session reset mid-TTS — discarding.');
                return;
            }
            flowState = 'awaiting_confirmation';
            console.log('[FLOW] flowState → awaiting_confirmation (after correction)');
            setTurnMode('listening', 'सुनाइए — हाँ या सुधार बताएं');
            drainTranscriptQueue();
        } catch (e) {
            console.log('[LLM] Error during correction:', e);
            showToast('सुधार करने में समस्या: ' + e.message);
            if (myEpoch !== flowEpoch) return;
            flowState = 'busy';
            await speak('सुधार करने में समस्या आई, कृपया दोबारा बताएं।');
            if (myEpoch !== flowEpoch) return;
            flowState = 'awaiting_correction';
            console.log('[FLOW] flowState → awaiting_correction (after error)');
            setTurnMode('listening', 'सुधार बताएं');
            // FIX: Drain stranded queue so the user is not locked out
            drainTranscriptQueue();
        }
    }

    // ---------- FLOW: beginConfirmation ----------
    function beginConfirmation(text) {
        const cleanText = stripTags(text);
        console.log('[FLOW] beginConfirmation() text="' + cleanText + '"');
        // FIX: Wipe any stale debounce text before starting a fresh confirmation cycle
        clearDebounceBuffers();
        pendingTranscript = cleanText;
        const myEpoch = flowEpoch;
        flowState = 'busy';
        console.log('[FLOW] flowState → busy (preparing confirmation prompt)');
        setLiveText(cleanText);
        setTurnMode('confirming', 'पुष्टि के लिए बोल रहे हैं…');
        const prompt = `${cleanText}. क्या यह सही है? हाँ बोलें, या बताएं कि क्या सुधारना है।`;
        speak(prompt).then(() => {
            if (myEpoch !== flowEpoch) {
                console.log(
                    '[FLOW] beginConfirmation: session reset mid-TTS — discarding.');
                return;
            }
            flowState = 'awaiting_confirmation';
            console.log('[FLOW] flowState → awaiting_confirmation');
            setTurnMode('listening', 'सुनाइए — हाँ या सुधार बताएं');
            drainTranscriptQueue();
        }).catch(e => {
            console.log('[FLOW] Error during confirmation prompt speech:', e);
            if (myEpoch !== flowEpoch) return;
            flowState = 'awaiting_confirmation';
            drainTranscriptQueue();
        });
    }

    // ---------- FLOW: handleConfirmationReply ----------
    async function handleConfirmationReply(replyText) {
        console.log('[FLOW] handleConfirmationReply() reply="' + replyText + '"');
        const myEpoch = flowEpoch;
        // FIX: Purge any lingering debounce buffers now that we are acting on a settled reply
        clearDebounceBuffers();
        flowState = 'evaluating_intent';
        console.log('[FLOW] flowState → evaluating_intent');
        setTurnMode('finalizing', 'जाँच रहे हैं…');
        showToast('');
        const intent = await classifyIntentWithLLM(replyText);
        if (myEpoch !== flowEpoch) {
            console.log(
                '[FLOW] handleConfirmationReply: session reset mid-classify — discarding.');
            return;
        }
        console.log('[FLOW] Intent classification → ' + intent);

        if (intent === 'CONFIRM') {
            const finalText = pendingTranscript;
            if (!currentCommand) {
                currentCommand = {
                    original: finalText, corrections: [], final: null, accepted: false,
                    createdAt: Date.now()
                };
                console.log('[FLOW] Created new currentCommand for confirmation.');
            }
            currentCommand.final = finalText;
            currentCommand.accepted = true;
            commands.push(currentCommand);
            currentCommand = null;
            console.log('[FLOW] Command ACCEPTED: "' + finalText + '"');
            el.copyBtn.disabled = false;
            el.exportBtn.disabled = false;
            const totalWords = commands.reduce((n, c) => n + (c.final || '').split(/\s+/).filter(Boolean)
                .length, 0);
            el.statWords.textContent = totalWords;
            console.log('[FLOW] Total words → ' + totalWords);
            renderHistory();
            pendingTranscript = '';
            flowState = 'busy';
            console.log('[FLOW] flowState → busy (speaking next prompt)');
            resetLiveLine('अगला कमांड बोलें…');
            try { await speak('ठीक है, अगला कमांड बोलें।'); } catch (e) {
                console.log(
                    '[FLOW] Error speaking next prompt:', e);
            }
            if (myEpoch !== flowEpoch) {
                console.log(
                    '[FLOW] handleConfirmationReply: session reset mid-TTS — discarding.');
                return;
            }
            flowState = 'listening_command';
            console.log('[FLOW] flowState → listening_command');
            setTurnMode('listening', 'अगला कमांड बोलें');
            drainTranscriptQueue();
        } else {
            // CORRECT
            flowState = 'busy';
            console.log('[FLOW] flowState → busy (asking for correction)');
            await speak('कृपया सुधार बताएं।');
            if (myEpoch !== flowEpoch) {
                console.log(
                    '[FLOW] handleConfirmationReply: session reset mid-TTS — discarding.');
                return;
            }
            flowState = 'awaiting_correction';
            console.log('[FLOW] flowState → awaiting_correction');
            setTurnMode('listening', 'सुधार बताएं');
            drainTranscriptQueue();
        }
    }

    // ---------- WEBSOCKET ----------
    function connectWs() {
        return new Promise((resolve, reject) => {
            setStatus('connecting', 'connecting');
            let socket;
            try { socket = new WebSocket(el.wsUrl.value.trim()); } catch (e) { reject(e); return; }
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
                setStatus('idle', 'disconnected'); if (sessionActive) endSession(
                    'कनेक्शन बंद हो गया');
            };
            socket.onmessage = (ev) => {
                let msg; try { msg = JSON.parse(ev.data); } catch { return; }
                handleServerEvent(msg);
            };
        });
    }

    function handleServerEvent(msg) {
        if (!msg || !msg.type) return;
        if (msg.type === 'session.created') return;
        if (msg.type.endsWith('.delta')) {
            const text = msg.delta ?? msg.text ?? '';
            if (text) {
                // FIX: Your ASR runs in prefix mode (--stream-final-mode prefix).
                // Each delta already contains the FULL text so far. Appending creates ghost duplication.
                // We now detect a prefix and replace instead of append.
                if (liveText && text.startsWith(liveText) && text.length >= liveText.length) {
                    setLiveText(text);
                } else {
                    setLiveText(liveText + text);
                }
            }
        } else if (msg.type.endsWith('.completed')) {
            const rawFinalText = (msg.transcript ?? msg.text ?? liveText ?? '').toString();
            const finalText = stripTags(rawFinalText);
            // FIX: Always reset liveText after a completed event so the next turn starts absolutely fresh.
            // This prevents the previous command from bleeding into the next confirmation reply.
            liveText = '';
            finalizing = false;
            console.log('[WS] Completed, raw="' + rawFinalText + '" clean="' + finalText + '", flowState=' +
                flowState);
            if (!finalText || !finalText.trim()) {
                if (flowState === 'listening_command' || flowState === 'awaiting_confirmation' ||
                    flowState === 'awaiting_correction') setTurnMode('listening', 'listening');
                return;
            }
            if (flowState === 'evaluating_intent' || flowState === 'correcting' || flowState === 'busy') {
                queueTranscript(finalText);
                return;
            }
            if (flowState === 'awaiting_confirmation') {
                bufferConfirmationReply(finalText);
            } else if (flowState === 'listening_command') {
                currentCommand = {
                    original: finalText, corrections: [], final: null, accepted: false,
                    createdAt: Date.now()
                };
                renderHistory();
                beginConfirmation(finalText);
            } else if (flowState === 'awaiting_correction') {
                bufferCorrectionReply(finalText);
            } else {
                console.log('[WS] Unexpected flowState="' + flowState + '" on completed.');
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
        el.statChunks.textContent = chunkCount + (droppedChunks ? ` (${droppedChunks} dropped)` : '');
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
            vadSession = await ort.InferenceSession.create('./silero_vad.onnx');
            resetVAD();
            vadReady = true;
            showToast('Silero VAD loaded ✓');
        } catch (e) {
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
                            resetLiveLine('सुन रहा हूँ…');
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
                resetLiveLine('सुन रहा हूँ…');
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
        el.sessionBtn.disabled = true;
        resetLiveLine('… सुन रहा हूँ');
        showToast('');
        flowState = 'listening_command';
        flowEpoch++;
        pendingTranscript = '';
        commands = [];
        currentCommand = null;
        transcriptQueue = [];
        // FIX: Use central helper to purge stale buffers
        clearDebounceBuffers();
        renderHistory();
        try { await connectWs(); } catch (e) {
            showToast('WebSocket से कनेक्ट नहीं हो सका');
            el.sessionBtn.disabled = false;
            return;
        }
        try { await initSileroVAD(); } catch (e) {
            showToast('VAD init failed');
            el.sessionBtn.disabled = false;
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
            showToast('माइक्रोफ़ोन एक्सेस नहीं मिला');
            el.sessionBtn.disabled = false;
            if (ws) ws.close();
            return;
        }
        try {
            audioCtx = new (window.AudioContext || window.webkitAudioContext)({ sampleRate: TARGET_RATE });
        } catch (e) { audioCtx = new (window.AudioContext || window.webkitAudioContext)(); }
        const blob = new Blob([WORKLET_SRC], { type: 'application/javascript' });
        const workletUrl = URL.createObjectURL(blob);
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
                el.statSkipped.textContent = (gatedSamplesSkipped / audioCtx.sampleRate).toFixed(1) + 's';
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
                el.statSkipped.textContent = (gatedSamplesSkipped / audioCtx.sampleRate).toFixed(1) + 's';
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
        durationTimer = setInterval(updateDuration, 1000);
        el.sessionBtn.classList.add('live');
        el.sessionBtn.disabled = false;
        el.sessionBtnText.textContent = 'सेशन समाप्त करें';
        el.finalizeBtn.disabled = false;
        setTurnMode('listening', 'listening');
        await speak('नमस्ते, कृपया अपना कमांड बोलें।');
    }

    function updateDuration() {
        if (!sessionStartedAt) return;
        const s = Math.floor((Date.now() - sessionStartedAt) / 1000);
        el.statDuration.textContent =
            `${String(Math.floor(s / 60)).padStart(2, '0')}:${String(s % 60).padStart(2, '0')}`;
    }

    function endSession(reason) {
        flowEpoch++;
        sessionActive = false;
        speaking = false;
        finalizing = false;
        flowState = 'listening_command';
        pendingTranscript = '';
        currentCommand = null;
        transcriptQueue = [];
        // FIX: Central clear
        clearDebounceBuffers();
        el.sessionBtn.classList.remove('live');
        el.sessionBtnText.textContent = 'सेशन शुरू करें';
        el.finalizeBtn.disabled = true;
        setTurnMode('idle', 'idle');
        if (ttsPlaying) interruptTTS();
        if (durationTimer) {
            clearInterval(durationTimer);
            durationTimer = null;
        }
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
        el.statSkipped.textContent = '0.0s';
        barHistory = new Array(BAR_COUNT).fill(0);
        pushLevel(0, 'idle');
        if (reason) showToast(reason);
        if (!liveText) resetLiveLine('सेशन शुरू करते ही यहाँ आंशिक ट्रांसक्रिप्शन दिखेगा…');
        renderHistory();
    }

    // ---------- EVENT BINDING ----------
    el.sessionBtn.addEventListener('click', () => {
        if (sessionActive) endSession();
        else startSession();
    });
    document.addEventListener('keydown', (e) => {
        if (e.code === 'Space' && e.target === document.body) {
            e
                .preventDefault();
            el.sessionBtn.click();
        }
    });
    el.finalizeBtn.addEventListener('click', () => {
        if (sessionActive && speaking && !finalizing) {
            speaking = false;
            finalizing = true;
            setTurnMode('finalizing', 'finalizing turn…');
            flushAccumIfAny();
            sendCommit();
        }
    });
    el.interruptBtn.addEventListener('click', () => { if (ttsPlaying) interruptTTS(); });
    el.copyBtn.addEventListener('click', () => {
        const text = commands.map(cmd => cmd.final).join('\n');
        navigator.clipboard?.writeText(text).then(() => showToast('transcript copied'));
    });
    el.exportBtn.addEventListener('click', () => {
        let text = '';
        commands.forEach((cmd, i) => {
            text += `[command ${i + 1}]\n  original: ${cmd.original}\n`;
            if (cmd.corrections && cmd.corrections.length) {
                cmd.corrections.forEach((c, j) => {
                    text += `  correction ${j + 1}: ${c.instruction} → ${c.corrected}\n`;
                });
            }
            text += `  final: ${cmd.final}\n\n`;
        });
        const blob = new Blob([text], { type: 'text/plain;charset=utf-8' });
        const a = document.createElement('a');
        a.href = URL.createObjectURL(blob);
        a.download = `transcript-${Date.now()}.txt`;
        a.click();
        URL.revokeObjectURL(a.href);
    });

    console.log('[INIT] All event listeners attached. Ready.');
    console.log('[FIX] Prefix-aware delta handling, liveText reset, debounce purge, and confirmation escape hatch are ACTIVE.');
})();