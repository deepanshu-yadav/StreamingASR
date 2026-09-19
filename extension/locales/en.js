/**
 * en.js - English Localization Resource
 * 
 * Contains:
 * 1. labels: All UI text for sidepanel HTML elements
 * 2. dictation: Spoken assistant voice phrases and templates (Piper TTS)
 * 3. prompts: System and user templates for LLM (Gemma 4)
 * 4. heuristics: Intent classification keywords and skip triggers
 */

(function () {
    const en = {
        code: 'en',
        name: 'English (US)',
        speechLang: 'en',

        // ===== 1. HTML UI LABELS =====
        labels: {
            brandTitle: 'VOICE FORM ASSISTANT • NEMOTRON & GEMMA',
            appTitle: 'Signal — Voice Form Assistant',
            tagline: 'Scan and automatically fill web forms using your voice',

            // Orchestrator Card
            orchestratorTitle: 'Backend Services (Orchestrator)',
            companionOffline: 'Companion Offline',
            companionConnected: 'Companion Online',
            btnStartServices: 'Start Services',
            btnStopServices: 'Stop',
            btnCheckAssets: 'Check Files',
            btnLaunchCompanion: '⚡ Launch Companion Orchestrator',
            orchestratorNotice: 'If this is your first time, make sure <kbd>register_protocol.bat</kbd> has been run.',

            // Service names
            svsAsrName: 'Nemotron ASR',
            svsTtsName: 'Piper TTS',
            svsLlmName: 'Gemma 4 LLM',

            // Toolbar
            statusIdle: 'idle',
            micPermLink: 'Mic Permission',
            interruptBtn: '🔇 Mute TTS',

            // Hero Actions
            btnScanPage: 'Scan Form',
            btnStartFormFlow: 'Fill with Voice',
            btnStopFormFlow: 'End Session',

            // Page info
            pageLabel: 'Page:',
            fieldCountBadge: '{count} fields',
            allFieldsComplete: 'All fields complete!',

            // Audio states
            micMutedBadge: '🔇 mic muted — assistant speaking',

            // Spotlight box
            spotlightStep: 'Field {current} / {total}',
            spotlightRequired: '*Required',
            spotlightPhaseAsking: 'Asking…',
            spotlightPhaseListening: 'Listening…',
            spotlightPhaseConfirming: 'Confirming…',
            spotlightPhaseEvaluating: 'Checking…',
            spotlightPhaseConfirmed: '✓ Verified',
            spotlightPromptListening: 'Listening: speak your answer…',
            spotlightValLabel: 'Captured Value:',
            spotlightNoValYet: 'No answer yet',

            // Spotlight buttons
            btnPrevField: '⏮️ Previous',
            btnReaskField: '🔄 Re-ask',
            btnSkipField: '⏭️ Skip',

            // Transcript Box
            transcriptLabel: '🎙️ Live Voice Transcription (Streaming STT)',
            transcriptIdle: 'Click "Fill with Voice" to begin…',
            transcriptListeningPrompt: 'Speak answer for {label}…',
            transcriptConfirmPrompt: 'Say yes or specify a correction…',

            // Scanned fields list
            scannedFieldsTitle: '📋 Scanned Fields (<b id="scannedFieldsCount">{count}</b>)',
            accordionHint: 'Click to jump',

            // Tuning Settings
            tuningTitle: '⚙️ Settings & Tuning',
            settingWsUrl: 'WebSocket URL',
            settingThreshold: 'Silero Speech Threshold',
            settingSilence: 'Silence Before Turn Finalizes',
            settingMaxTurn: 'Max Utterance Hard Cap',
            settingPadding: 'Pre-roll Padding',
            settingLlmUrl: 'LLM Proxy Server URL',
            settingDebounce: 'Confirmation Debounce',

            // Toasts & Alerts
            noFieldsFound: 'No fillable input fields found on this page.',
            fieldsScannedSuccess: '{count} fields scanned successfully!',
            fieldsScannedBadge: '{count} fields found',
            fieldsZeroBadge: '0 fields found',
            scanningBadge: 'Scanning…',
            scanFailedBadge: 'Scan failed',
            invalidPageBadge: 'Invalid page',
            tabNotFoundBadge: 'Tab not found',
            activeTabNotFoundToast: 'Active tab not found',
            cannotScanInternalToast: 'Cannot scan internal browser pages',
            unableToScanToast: 'Unable to scan form',
            firstFieldToast: 'This is the first field',
            sessionStoppedToast: 'Form filling session stopped',
            sessionEndedToast: 'Session ended — all activities stopped',
            connectionClosed: 'Connection closed',
            transcriptListening: 'Listening…',
            pleaseWaitToast: 'Please wait, processing…',
            checkingConfirmation: 'Checking confirmation…',
            wsConnectFailed: 'Could not connect to WebSocket',
            micPermTabOpened: 'Microphone permission tab opened — please click "Allow"',
            micAccessDenied: 'Microphone access denied: ',
            asrError: 'ASR error: ',
            servicesStartingToast: 'Starting services…',
            servicesStartedToast: 'Services started',
            servicesStartFailedToast: 'Start failed: ',
            servicesStoppedToast: 'Services stopped',
            servicesStopFailedToast: 'Stop failed: ',
            modelsAllPresentToast: 'All models are available ✓',
            modelsMissingToast: 'Some models are missing',
            checkFailedToast: 'Check failed: ',
            companionStartingToast: 'Starting companion…',
            companionOnlineToast: 'Companion is online ✓',
            companionFailedToast: 'Companion did not start? Run register_protocol.bat',
            companionStartingBtn: '⏳ Starting…',
            companionReadyBtn: '⚡ Launch Companion Orchestrator',
            ttsInterrupted: 'TTS interrupted',
            ttsError: 'TTS error: ',

            // Launch Tab Strings
            launchPageTitle: 'Starting Companion Orchestrator - Voice Assistant',
            launchTitle: 'Starting Companion Orchestrator...',
            launchDesc: 'If a browser dialog asks to <b>"Open Companion Orchestrator"</b>, please select <b>"Open"</b>.',
            launchStatusWaiting: '⏳ Waiting to connect with companion server…',
            launchManualBtn: '🚀 Click here if it does not open automatically',
            launchHint: 'If nothing happens, please ensure <kbd>register_protocol.bat</kbd> has been run once.',
            launchSuccessTitle: 'Companion started successfully!',
            launchSuccessDesc: 'Companion server is online. This tab will close automatically…',
            launchSuccessStatus: '✓ Companion Online at http://127.0.0.1:8000',
            launchFailStatus: 'Could not connect to companion. Please run start_companion.bat.',

            // Restart Confirmation Modal Strings
            restartModalTitle: 'Restart Companion Server?',
            restartModalDesc: 'Changing language to {name} requires restarting the Companion Server with the new language setting. Existing processes will be stopped and a new Command Prompt window will launch.',
            btnRestartCancel: 'Cancel',
            btnRestartConfirm: 'Restart Server',
            restartingToast: 'Restarting Companion Server in {name}...'
        },

        // ===== 2. SPOKEN DICTATION TEMPLATES (TTS) =====
        dictation: {
            sessionFinished: 'Awesome! All fields on this page have been completed.',
            askFieldRepeat: (label) => `Please state your answer for ${label}.`,
            askFieldExisting: (label, val) => `Next field is ${label}. Current value is ${val}. Would you like to change it? Speak a new value or say yes to keep it.`,
            askFieldSelect: (label, required) => `Next field is ${label}. ${required ? 'This is required.' : ''} Which option would you like to select?`,
            askFieldDefault: (label, required) => `Next field is ${label}. ${required ? 'This is required.' : ''} What should I enter here?`,

            confirmField: (label, val) => `For ${label}: ${val}. Is this correct? Say yes, or tell me what to change.`,
            fieldRecorded: (label) => `Got it, ${label} has been recorded.`,
            askCorrection: (label) => `Please tell me the correction. What should be entered in ${label}?`,
            confirmCorrection: (corrected) => `Updated value: ${corrected}. Is this correct now?`,
            clarifyValue: (label) => `Please speak the full clean value clearly for ${label}.`,
            fieldSkipped: (label) => `Alright, skipped ${label || 'this field'}.`,
            reaskPrompt: (label) => `Please repeat your answer for ${label}.`
        },

        // ===== 3. LLM PROMPTS (Gemma 4) =====
        prompts: {
            // Intent classification: CONFIRM vs CORRECT
            intentClassifierSystem:
                'You are an intent classification assistant.\n' +
                'The user was asked whether the spoken value for a form field is correct.\n\n' +
                'Rules:\n' +
                '1. If the user confirms (e.g., "yes", "yeah", "correct", "looks good", "proceed", "that is right", "sure", "ok") → Output ONLY "CONFIRM".\n' +
                '2. If the user denies, points out an error, specifies a change, or gives a new value (e.g., "no", "wrong", "change it", "incorrect", "actually it is...") → Output ONLY "CORRECT".\n\n' +
                'Important:\n' +
                '- Words like "no", "not right", "wrong", "change", "mistake", "fix" indicate CORRECT.\n' +
                '- Words like "yes", "correct", "fine", "perfect", "ok" indicate CONFIRM.\n' +
                '- When in doubt, choose CORRECT.\n\n' +
                'Reply with exactly ONE word: CONFIRM or CORRECT.',

            intentClassifierUser: (reply) => `User reply: "${reply}"\nDecision:`,

            // Value extractor
            extractorSystem:
                `You are a Form Field Data Extraction Assistant.
The user spoke an answer for a specific form field. Extract ONLY the clean, intended value.
Strip out all conversational phrases (e.g., "my name is...", "please write...", "it is...", "fill in...").
Rules:
1. If the field is an ID, phone number, mobile number, postal/PIN/ZIP code, or numeric, and the user spoke numbers as words (e.g. "one two three"), convert them into standard numeric digits (e.g. "123").
2. Capitalize text properly where appropriate.
3. Output ONLY the clean value. Do not add quotes, markdown, or explanations.`,

            extractorUser: (fieldLabel, cleanSpoken) => `Form Field: ${fieldLabel}\nSpoken Answer: "${cleanSpoken}"\nClean Value:`,

            // Correction assistant
            correctorSystem:
                `You are an expert form field correction assistant.
The user is correcting a previously recorded field value.
Due to Speech-to-Text, numbers might be spoken as words, and there may be speech pauses or conversational filler.

Instructions:
1. Understand the user's correction instruction:
   - If replacing a part (e.g. "replace X with Y" or "X should be Y"), replace X with Y in the previous value.
   - If providing a whole new value (e.g. "no my phone is 9876..."), extract that full new value.
   - If modifying email (e.g. "remove the dot in username"), apply that edit cleanly.
2. If the field is a phone, ID, or numeric field, ensure the final value contains only digits.
3. Output ONLY the final clean value. No explanations or quotes.`,

            correctorUser: (fieldLabel, cleanOriginal, cleanInstruction) =>
                `Field: ${fieldLabel}\nPrevious Value: ${cleanOriginal}\nCorrection Instruction: "${cleanInstruction}"\nNew Clean Value:`
        },

        // ===== 4. HEURISTICS & INTENT KEYWORDS =====
        heuristics: {
            negationWords: [
                'no', 'not', 'wrong', 'incorrect', 'change', 'replace', 'mistake', 'fix',
                'not right', 'nope', 'nah', 'error', 'different', 'modify'
            ],
            confirmWords: [
                'yes', 'yeah', 'yep', 'correct', 'right', 'ok', 'okay', 'proceed', 'next',
                'fine', 'perfect', 'sure', 'confirm', 'good', 'looks good', 'that is right', "that's right"
            ],
            skipPhrases: [
                'skip', 'skip field', 'leave it', 'pass', 'next field', 'move on', 'ignore'
            ],
            pureRejectionWords: [
                'no', 'wrong', 'not this', 'incorrect', 'nah', 'nope', 'not right'
            ]
        }
    };

    const enGB = {
        ...en,
        code: 'en-GB',
        name: 'English (UK)',
        speechLang: 'en-GB'
    };

    const enUS = {
        ...en,
        code: 'en-US',
        name: 'English (US)',
        speechLang: 'en-US'
    };

    if (typeof window !== 'undefined') {
        window.__LOCALES__ = window.__LOCALES__ || {};
        window.__LOCALES__['en-US'] = enUS;
        window.__LOCALES__['en-GB'] = enGB;
        window.__LOCALES__['en'] = enUS;
    }
})();
