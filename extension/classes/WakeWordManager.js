/**
 * WakeWordManager.js
 * 
 * Phase 2: Wake Word Detection, Sleep/Pause State Machine, Audio Gating,
 * and Auditory Feedback Cues (Web Audio API).
 * 
 * When sleeping:
 * - Incoming ASR audio streams stay connected via Silero VAD (no reconnect latency).
 * - Transcripts that do not contain a wake word are silently discarded (zero TTS/LLM thrash).
 * - Upon wake word detection:
 *   1. Plays a pleasant ascending audio chime (D5 -> A5).
 *   2. Transitions state from sleeping to active.
 *   3. If the user spoke a command with the wake word (e.g., "Hey Assistant, my email is test@gmail.com"),
 *      extracts the trailing utterance and routes it immediately so the user doesn't wait or repeat!
 *   4. If isolated wake word, speaks a brief resume cue ("I'm listening. We were on [Field Name].").
 */

(function () {
    'use strict';

    // Universal Multilingual Wake Words across all 15 supported languages
    const DEFAULT_MULTILINGUAL_WAKE_WORDS = [
        // English
        'hey assistant', 'assistant', 'wake up', 'form fill', 'resume', 'start', "i'm back", 'im back', 'listen',
        // Hindi
        'सुनो', 'जागो', 'फॉर्म भरो', 'जारी रखो', 'शुरू करो', 'आ गया', 'असिस्टेंट', 'दोबारा शुरू', 'वापस आ गया',
        // Spanish
        'oye', 'asistente', 'despierta', 'continuar', 'reanudar', 'estoy aquí', 'escucha',
        // French
        'réveille-toi', 'reprendre', 'écoute', 'assistant', 'continue',
        // German
        'aufwachen', 'weiter', 'hör zu', 'assistent', 'fortsetzen',
        // Russian
        'проснись', 'слушай', 'продолжить', 'ассистент', 'я вернулся',
        // Arabic
        'استيقظ', 'استمع', 'تابع', 'يا مساعد', 'أنا هنا',
        // Portuguese
        'acorda', 'continuar', 'retomar', 'assistente', 'voltei',
        // Italian
        'svegliati', 'continua', 'riprendi', 'assistente', 'sono tornato',
        // Dutch
        'word wakker', 'hervatten', 'luister', 'assistent', 'ik ben terug',
        // Turkish
        'uyan', 'devam et', 'dinle', 'asistan', 'buradayım',
        // Vietnamese
        'thức dậy', 'tiếp tục', 'trợ lý', 'nghe đây', 'bắt đầu lại',
        // Japanese
        '起きて', '再開', 'アシスタント', '聞いて', '戻りました',
        // Korean
        '일어나', '재개', '듣고 있어', '어시스턴트', '돌아왔어',
        // Ukrainian
        'прокинься', 'слухай', 'продовжити', 'асистент'
    ];

    class WakeWordManager {
        constructor(options = {}) {
            this.state = 'active'; // 'active' | 'sleeping'
            this.onSleepCallback = options.onSleep || null;
            this.onWakeCallback = options.onWake || null;
            this.speak = options.speak || null;
            this.getDictation = options.getDictation || (() => ({}));
            this.getCurrentFieldLabel = options.getCurrentFieldLabel || (() => '');
            this.audioCtx = null;
        }

        /**
         * Check if assistant is currently sleeping
         */
        isSleeping() {
            return this.state === 'sleeping';
        }

        /**
         * Retrieve all active wake words merged with current locale heuristics
         */
        getWakeWords() {
            let activeLocaleWords = [];
            if (typeof window !== 'undefined' && window.i18n) {
                const heuristics = window.i18n.getHeuristics ? window.i18n.getHeuristics() : {};
                if (heuristics.resumeWords) {
                    activeLocaleWords = activeLocaleWords.concat(heuristics.resumeWords);
                }
                if (heuristics.wakeWords) {
                    activeLocaleWords = activeLocaleWords.concat(heuristics.wakeWords);
                }
            }
            return Array.from(new Set([...activeLocaleWords, ...DEFAULT_MULTILINGUAL_WAKE_WORDS]));
        }

        /**
         * Clean text with script-agnostic combining marks preservation
         */
        normalizeText(text) {
            if (!text) return '';
            return text.toString()
                .toLowerCase()
                .replace(/<[a-zA-Z]{2,}(?:-[a-zA-Z0-9]+)?\s*>?/g, '')
                .replace(/<[^>]+>/g, '')
                .replace(/[^\p{L}\p{M}\p{N}\s]/gu, ' ')
                .replace(/\s+/g, ' ')
                .trim();
        }

        /**
         * Web Audio API synthesized Chimes:
         * Generates pleasant pure-sine dual-tone cues without requiring external assets.
         */
        ensureAudioContext() {
            if (!this.audioCtx && typeof window !== 'undefined') {
                const AudioCtxClass = window.AudioContext || window.webkitAudioContext;
                if (AudioCtxClass) {
                    this.audioCtx = new AudioCtxClass();
                }
            }
            if (this.audioCtx && this.audioCtx.state === 'suspended') {
                this.audioCtx.resume().catch(() => {});
            }
            return this.audioCtx;
        }

        /**
         * Play ascending wake chime (D5: 587.33 Hz -> A5: 880 Hz)
         */
        playWakeChime() {
            try {
                const ctx = this.ensureAudioContext();
                if (!ctx) return;
                const now = ctx.currentTime;

                // Note 1 (D5)
                const osc1 = ctx.createOscillator();
                const gain1 = ctx.createGain();
                osc1.type = 'sine';
                osc1.frequency.setValueAtTime(587.33, now);
                gain1.gain.setValueAtTime(0.001, now);
                gain1.gain.exponentialRampToValueAtTime(0.25, now + 0.02);
                gain1.gain.exponentialRampToValueAtTime(0.001, now + 0.09);
                osc1.connect(gain1);
                gain1.connect(ctx.destination);
                osc1.start(now);
                osc1.stop(now + 0.10);

                // Note 2 (A5)
                const osc2 = ctx.createOscillator();
                const gain2 = ctx.createGain();
                osc2.type = 'sine';
                osc2.frequency.setValueAtTime(880.00, now + 0.09);
                gain2.gain.setValueAtTime(0.001, now + 0.09);
                gain2.gain.exponentialRampToValueAtTime(0.30, now + 0.11);
                gain2.gain.exponentialRampToValueAtTime(0.0001, now + 0.28);
                osc2.connect(gain2);
                gain2.connect(ctx.destination);
                osc2.start(now + 0.09);
                osc2.stop(now + 0.30);
            } catch (err) {
                console.warn('[WakeWordManager] Wake chime audio error:', err);
            }
        }

        /**
         * Play descending sleep chime (A5: 880 Hz -> D5: 587.33 Hz)
         */
        playSleepChime() {
            try {
                const ctx = this.ensureAudioContext();
                if (!ctx) return;
                const now = ctx.currentTime;

                // Note 1 (A5)
                const osc1 = ctx.createOscillator();
                const gain1 = ctx.createGain();
                osc1.type = 'sine';
                osc1.frequency.setValueAtTime(880.00, now);
                gain1.gain.setValueAtTime(0.001, now);
                gain1.gain.exponentialRampToValueAtTime(0.20, now + 0.02);
                gain1.gain.exponentialRampToValueAtTime(0.001, now + 0.09);
                osc1.connect(gain1);
                gain1.connect(ctx.destination);
                osc1.start(now);
                osc1.stop(now + 0.10);

                // Note 2 (D5)
                const osc2 = ctx.createOscillator();
                const gain2 = ctx.createGain();
                osc2.type = 'sine';
                osc2.frequency.setValueAtTime(587.33, now + 0.09);
                gain2.gain.setValueAtTime(0.001, now + 0.09);
                gain2.gain.exponentialRampToValueAtTime(0.20, now + 0.11);
                gain2.gain.exponentialRampToValueAtTime(0.0001, now + 0.28);
                osc2.connect(gain2);
                gain2.connect(ctx.destination);
                osc2.start(now + 0.09);
                osc2.stop(now + 0.30);
            } catch (err) {
                console.warn('[WakeWordManager] Sleep chime audio error:', err);
            }
        }

        /**
         * Detect if text contains a wake word and extract any trailing utterance
         */
        detectWakeWord(rawText) {
            if (!rawText) return { matched: false };
            const clean = rawText.toString().trim();
            const wakeWords = this.getWakeWords();

            for (const word of wakeWords) {
                // Allow hyphens, dashes, and spaces interchangeably in multi-word wake phrases (e.g. "réveille-toi" vs "réveille toi")
                const escaped = word.replace(/[.*+?^${}()|[\]\\]/g, '\\$&').replace(/[- ]+/g, '[-—\\s]+');
                // Script-agnostic word boundaries using Unicode Marks and Letters
                const regex = new RegExp(`(?:^|[^\\p{L}\\p{M}\\p{N}])(${escaped})(?=[^\\p{L}\\p{M}\\p{N}]|$)`, 'iu');
                const match = clean.match(regex);
                if (match) {
                    const matchWord = match[1];
                    const idx = clean.toLowerCase().indexOf(matchWord.toLowerCase());
                    // Extract trailing utterance after wake word from original text preserving casing & symbols
                    let trailing = clean.slice(idx + matchWord.length).trim();
                    // Strip leading separators or conjunctions: e.g. ", my name is..." -> "my name is..."
                    trailing = trailing.replace(/^[,:：\-_\s]+/, '').trim();

                    return {
                        matched: true,
                        wakeWord: word,
                        trailingUtterance: trailing
                    };
                }
            }

            return { matched: false };
        }

        /**
         * Enter sleep/pause mode
         */
        sleep(options = {}) {
            if (this.state === 'sleeping') return;
            console.log('[WakeWordManager] Entering sleep state 💤');
            this.state = 'sleeping';

            if (!options.silent) {
                this.playSleepChime();
            }

            if (this.onSleepCallback) {
                this.onSleepCallback();
            }
        }

        /**
         * Wake up and resume active voice flow
         * 
         * @param {string} [trailingUtterance] - Additional text spoken in the same breath as the wake word
         */
        async wake(trailingUtterance = '') {
            if (this.state === 'active') return;
            console.log('[WakeWordManager] Waking up from sleep! 🎙️ Trailing utterance:', trailingUtterance || '(none)');
            this.state = 'active';

            this.playWakeChime();

            if (this.onWakeCallback) {
                this.onWakeCallback(trailingUtterance);
            }

            // If user did not provide an immediate command with the wake word, speak resume cue
            if (!trailingUtterance && this.speak) {
                const dict = this.getDictation();
                const currentLabel = this.getCurrentFieldLabel();
                const resumePrompt = dict.sessionResumed
                    ? dict.sessionResumed(currentLabel)
                    : (currentLabel ? `I'm listening. We are on ${currentLabel}.` : "I'm listening. Please continue.");
                await this.speak(resumePrompt);
            }
        }

        /**
         * Toggle between active and sleeping states
         */
        toggleSleep() {
            if (this.isSleeping()) {
                this.wake();
            } else {
                this.sleep();
            }
        }

        /**
         * Audio Gating: Filter completed ASR transcripts before any downstream processing
         * 
         * @param {string} rawTranscript - Streaming ASR completed text
         * @returns {{ allow: boolean, transcript?: string, wakeTriggered?: boolean, remainingTranscript?: string }}
         */
        filterTranscript(rawTranscript) {
            if (!this.isSleeping()) {
                return {
                    allow: true,
                    transcript: rawTranscript,
                    wakeTriggered: false
                };
            }

            // Assistant is sleeping: test for wake word
            const detection = this.detectWakeWord(rawTranscript);
            if (detection.matched) {
                console.log(`[WakeWordManager] Wake word detected: "${detection.wakeWord}" from utterance: "${rawTranscript}"`);
                this.wake(detection.trailingUtterance);
                return {
                    allow: true,
                    wakeTriggered: true,
                    remainingTranscript: detection.trailingUtterance
                };
            }

            // Speech ignored while sleeping
            return {
                allow: false,
                wakeTriggered: false
            };
        }
    }

    if (typeof window !== 'undefined') {
        window.WakeWordManager = WakeWordManager;
    }
    if (typeof module !== 'undefined' && module.exports) {
        module.exports = WakeWordManager;
    }
})();
