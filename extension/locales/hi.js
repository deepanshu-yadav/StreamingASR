/**
 * hi.js - Hindi Localization Resource
 * 
 * Contains:
 * 1. labels: All UI text for sidepanel HTML elements
 * 2. dictation: Spoken assistant voice phrases and templates (Piper TTS)
 * 3. prompts: System and user templates for LLM (Gemma 4)
 * 4. heuristics: Intent classification keywords and skip triggers
 */

(function () {
    const hi = {
        code: 'hi',
        name: 'हिन्दी (Hindi)',
        speechLang: 'hi',

        // ===== 1. HTML UI LABELS =====
        labels: {
            brandTitle: 'VOICE FORM ASSISTANT • NEMOTRON & GEMMA',
            appTitle: 'सिग्नल — वॉइस फ़ॉर्म असिस्टेंट',
            tagline: 'वेबसाइट फ़ॉर्म्स को वॉइस द्वारा स्वचालित रूप से स्कैन करें और भरें',

            // Orchestrator Card
            orchestratorTitle: 'बैकएंड सर्विसेज (Orchestrator)',
            companionOffline: 'Companion Offline',
            companionConnected: 'Companion Online',
            btnStartServices: 'स्टार्ट सर्विसेज',
            btnStopServices: 'स्टॉप',
            btnCheckAssets: 'चेक फाइल्स',
            btnLaunchCompanion: '⚡ कम्पैनियन चालू करें (Launch Companion)',
            orchestratorNotice: 'यदि यह पहली बार है, तो सुनिश्चित करें कि <kbd>register_protocol.bat</kbd> चला लिया गया है।',

            // Service names
            svsAsrName: 'Nemotron ASR',
            svsTtsName: 'Piper TTS',
            svsLlmName: 'Gemma 4 LLM',

            // Toolbar
            statusIdle: 'idle',
            micPermLink: 'माइक अनुमति',
            interruptBtn: '🔇 म्यूट TTS',

            // Hero Actions
            btnScanPage: 'फ़ॉर्म स्कैन करें',
            btnStartFormFlow: 'वॉइस से भरें',
            btnStopFormFlow: 'सत्र समाप्त करें',

            // Page info
            pageLabel: 'पृष्ठ:',
            fieldCountBadge: '{count} फ़ील्ड',
            allFieldsComplete: 'सभी फ़ील्ड पूर्ण!',

            // Audio states
            micMutedBadge: '🔇 mic muted — assistant speaking',

            // Spotlight box
            spotlightStep: 'फ़ील्ड {current} / {total}',
            spotlightRequired: '*आवश्यक',
            spotlightPhaseAsking: 'पूछ रहे हैं…',
            spotlightPhaseListening: 'सुन रहे हैं…',
            spotlightPhaseConfirming: 'पुष्टि पूछ रहे हैं…',
            spotlightPhaseEvaluating: 'जाँच रहे हैं…',
            spotlightPhaseConfirmed: '✓ सत्यापित',
            spotlightPromptListening: 'सुन रहे हैं: अपना उत्तर बोलें…',
            spotlightValLabel: 'प्राप्त मान:',
            spotlightNoValYet: 'अभी कोई उत्तर नहीं',

            // Spotlight buttons
            btnPrevField: '⏮️ पिछला',
            btnReaskField: '🔄 दोबारा पूछें',
            btnSkipField: '⏭️ छोड़ें',

            // Transcript Box
            transcriptLabel: '🎙️ लाइव वॉइस ट्रांसक्रिप्शन (Streaming STT)',
            transcriptIdle: 'फ़ॉर्म भरने के लिए "वॉइस से भरें" दबाएं…',
            transcriptListeningPrompt: '{label} के लिए उत्तर बोलें…',
            transcriptConfirmPrompt: 'हाँ बोलें या सुधार बताएं…',

            // Scanned fields list
            scannedFieldsTitle: '📋 स्कैन किए गए फ़ील्ड्स (<b id="scannedFieldsCount">{count}</b>)',
            accordionHint: 'क्लिक कर चुनें',

            // Tuning Settings
            tuningTitle: '⚙️ सेटिंग्स और ट्यूनिंग (Settings)',
            settingWsUrl: 'WebSocket URL',
            settingThreshold: 'Silero Speech Threshold',
            settingSilence: 'Silence Before Turn Finalizes',
            settingMaxTurn: 'Max Utterance Hard Cap',
            settingPadding: 'Pre-roll Padding',
            settingLlmUrl: 'LLM Proxy Server URL',
            settingDebounce: 'Confirmation Debounce',

            // Toasts & Alerts
            noFieldsFound: 'पृष्ठ पर कोई इनपुट फ़ील्ड नहीं मिला।',
            fieldsScannedSuccess: '{count} फ़ील्ड सफलतापूर्वक स्कैन किए गए',
            fieldsScannedBadge: '{count} फ़ील्ड मिले',
            fieldsZeroBadge: '0 फ़ील्ड मिले',
            scanningBadge: 'स्कैन हो रहा है…',
            scanFailedBadge: 'स्कैन विफल',
            invalidPageBadge: 'अमान्य पृष्ठ',
            tabNotFoundBadge: 'टैब नहीं मिला',
            activeTabNotFoundToast: 'सक्रिय टैब नहीं मिला',
            cannotScanInternalToast: 'ब्राउज़र आंतरिक पृष्ठों को स्कैन नहीं किया जा सकता',
            unableToScanToast: 'फ़ॉर्म स्कैन करने में असमर्थ',
            firstFieldToast: 'यह पहला फ़ील्ड है',
            sessionStoppedToast: 'फ़ॉर्म भरण प्रक्रिया रोक दी गई',
            sessionEndedToast: 'सत्र समाप्त — सभी गतिविधियाँ बंद कर दी गईं',
            connectionClosed: 'कनेक्शन बंद हो गया',
            transcriptListening: 'सुन रहा हूँ…',
            pleaseWaitToast: 'कृपया प्रतीक्षा करें, प्रक्रिया जारी है…',
            checkingConfirmation: 'पुष्टि जाँच रहे हैं…',
            wsConnectFailed: 'WebSocket से कनेक्ट नहीं हो सका',
            micPermTabOpened: 'माइक्रोफ़ोन अनुमति टैब खोला गया — कृपया "Allow" चुनें',
            micAccessDenied: 'माइक्रोफ़ोन एक्सेस नहीं मिला: ',
            asrError: 'ASR त्रुटि: ',
            servicesStartingToast: 'सर्विस शुरू हो रही हैं…',
            servicesStartedToast: 'सर्विस शुरू की गईं',
            servicesStartFailedToast: 'स्टार्ट विफल: ',
            servicesStoppedToast: 'सर्विस बंद कर दी गईं',
            servicesStopFailedToast: 'स्टॉप विफल: ',
            modelsAllPresentToast: 'सभी मॉडल्स उपलब्ध हैं ✓',
            modelsMissingToast: 'कुछ मॉडल्स गायब हैं',
            checkFailedToast: 'चेक विफल: ',
            companionStartingToast: 'कम्पैनियन शुरू किया जा रहा है…',
            companionOnlineToast: 'कम्पैनियन ऑनलाइन हो गया है ✓',
            companionFailedToast: 'कम्पैनियन चालू नहीं हुआ? register_protocol.bat चलाएं',
            companionStartingBtn: '⏳ चालू हो रहा है… (Starting…)',
            companionReadyBtn: '⚡ कम्पैनियन चालू करें (Launch Companion)',
            ttsInterrupted: 'TTS रोका गया',
            ttsError: 'TTS त्रुटि: ',

            // Launch Tab Strings
            launchPageTitle: 'कम्पैनियन चालू किया जा रहा है - Voice Assistant',
            launchTitle: 'कम्पैनियन चालू किया जा रहा है...',
            launchDesc: 'यदि ऊपर ब्राउज़र में <b>"Open Companion Orchestrator"</b> का डायलॉग आए, तो कृपया <b>"Open"</b> चुनें।',
            launchStatusWaiting: '⏳ कम्पैनियन सर्वर से जुड़ने की प्रतीक्षा…',
            launchManualBtn: '🚀 यदि अपने आप न खुले तो यहाँ क्लिक करें',
            launchHint: 'यदि कुछ भी न हो, तो कृपया सुनिश्चित करें कि <kbd>register_protocol.bat</kbd> एक बार चला लिया गया है।',
            launchSuccessTitle: 'कम्पैनियन सफलतापूर्वक चालू हो गया!',
            launchSuccessDesc: 'कम्पैनियन सर्वर ऑनलाइन है। यह टैब स्वतः बंद हो रहा है…',
            launchSuccessStatus: '✓ Companion Online at http://127.0.0.1:8000',
            launchFailStatus: 'कम्पैनियन से कनेक्शन नहीं हो पाया। कृपया start_companion.bat चलाएं।',

            // Restart Confirmation Modal Strings
            restartModalTitle: 'कम्पैनियन सर्वर रीस्टार्ट करें?',
            restartModalDesc: 'भाषा को {name} में बदलने के लिए कम्पैनियन सर्वर को नई भाषा सेटिंग के साथ रीस्टार्ट करना होगा। मौजूदा प्रक्रियाएं बंद हो जाएंगी और नया कमांड प्रॉम्प्ट विंडो खुलेगा।',
            btnRestartCancel: 'रद्द करें',
            btnRestartConfirm: 'सर्वर रीस्टार्ट करें',
            restartingToast: '{name} में कम्पैनियन सर्वर रीस्टार्ट हो रहा है...'
        },

        // ===== 2. SPOKEN DICTATION TEMPLATES (TTS) =====
        dictation: {
            sessionFinished: 'बहुत बढ़िया! इस पृष्ठ के सभी फ़ील्ड पूरे हो चुके हैं।',
            askFieldRepeat: (label) => `कृपया ${label} के लिए अपना उत्तर बताएं।`,
            askFieldExisting: (label, val) => `अगला फ़ील्ड है ${label}। इसका वर्तमान मान है ${val}। क्या आप इसे बदलना चाहते हैं? नया मान बोलें या हाँ कहें।`,
            askFieldSelect: (label, required) => `अगला फ़ील्ड है ${label}। ${required ? 'यह आवश्यक है।' : ''} कृपया बताएं इसमें क्या चुनना है?`,
            askFieldDefault: (label, required) => `अगला फ़ील्ड है ${label}। ${required ? 'यह आवश्यक है।' : ''} कृपया बताएं इसमें क्या भरना है?`,

            confirmField: (label, val) => `${label} के लिए: ${val}। क्या यह सही है? हाँ बोलें, या बताएं कि क्या सुधारना है।`,
            fieldRecorded: (label) => `ठीक है, ${label} दर्ज हो गया।`,
            askCorrection: (label) => `कृपया सुधार बताएं, ${label} में क्या भरना है?`,
            confirmCorrection: (corrected) => `संशोधित मान: ${corrected}। क्या यह अब सही है?`,
            clarifyValue: (label) => `कृपया ${label} के लिए पूरा मान स्पष्ट बोलिए।`,
            fieldSkipped: (label) => `ठीक है, ${label || 'यह फ़ील्ड'} छोड़ दिया गया।`,
            reaskPrompt: (label) => `कृपया ${label} के लिए फिर से बोलें।`
        },

        // ===== 3. LLM PROMPTS (Gemma 4) =====
        prompts: {
            // Intent classification: CONFIRM vs CORRECT
            intentClassifierSystem:
                'आप एक वर्गीकरण सहायक (intent classifier) हैं।\n' +
                'उपयोगकर्ता से पूछा गया है कि क्या उनका बोला गया वाक्य सही है।\n\n' +
                'नियम:\n' +
                '1. यदि उपयोगकर्ता हाँ, ठीक, बिल्कुल, आगे बढ़ो, या पुष्टि करता है → केवल "CONFIRM" लिखें।\n' +
                '2. यदि उपयोगकर्ता नहीं, सही नहीं है, गलत है, बदलाव चाहता है, सुधार बताता है, या नया निर्देश देता है → केवल "CORRECT" लिखें।\n\n' +
                'महत्वपूर्ण:\n' +
                '- "सही नहीं है", "नहीं", "गलत", "change", "sudhar" जैसे शब्द CORRECT का संकेत हैं।\n' +
                '- केवल "सही है", "हाँ", "ठीक" जैसे शब्द CONFIRM का संकेत हैं।\n' +
                '- किसी भी संदेह में CORRECT चुनें।\n\n' +
                'केवल एक शब्द उत्तर दें: CONFIRM या CORRECT।',

            intentClassifierUser: (reply) => `उपयोगकर्ता का जवाब: "${reply}"\nनिर्णय:`,

            // Value extractor
            extractorSystem:
                `आप एक फ़ॉर्म डेटा निष्कर्षण सहायक (Form Field Extractor) हैं।
उपयोगकर्ता ने फ़ील्ड के लिए बोला है। बोली गई बात में से केवल फ़ील्ड का शुद्ध मान (Clean Value) निकालें।
बातचीत के शब्द (जैसे "मेरा नाम ... है", "लिख दीजिए", "भर दो", "यह है") हटा दें।
नियम:
1. यदि फ़ील्ड आधार (Aadhaar), मोबाइल (Phone/Mobile), पिन कोड (PIN/ZIP) या संख्यात्मक (Number) है, और उपयोगकर्ता ने अंक शब्दों में बोले हैं (जैसे 'एक दो तीन...'), तो उन्हें अंकों (Digits, जैसे '123...') में बदलें।
2. केवल शुद्ध मान लिखें। कोई व्याख्या या उद्धरण चिह्न नहीं।`,

            extractorUser: (fieldLabel, cleanSpoken) => `फ़ॉर्म फ़ील्ड: ${fieldLabel}\nबोला गया उत्तर: "${cleanSpoken}"\nशुद्ध मान:`,

            // Correction assistant
            correctorSystem:
                `आप एक अत्यंत कुशल फ़ॉर्म फ़ील्ड सुधार सहायक हैं।
उपयोगकर्ता फ़ॉर्म भरते समय पिछली प्रविष्टि (Previous Value) में सुधार बता रहा है।
वाक्-पहचान (STT) के कारण अंक शब्दों में हो सकते हैं (जैसे 'एक एक शून्य एक' = 1101, 'एक शून्य एक' = 101) और बीच में विराम या बातचीत हो सकती है।

निर्देश:
1. उपयोगकर्ता के सुधार निर्देश को समझें:
   - यदि वह किसी हिस्से को बदलने को कहे (जैसे "X की जगह Y होगा" / "X नहीं Y" / "replace X with Y"), तो पिछले मान में X की जगह Y लगाएँ।
   - यदि वह पूरा नया मान बोले (जैसे "नहीं मेरा आधार 1234... है"), तो वह पूरा नया मान निकालें।
   - यदि ईमेल में डॉट हटाने को कहे, तो यूज़रनेम से डॉट हटाएँ।
2. यदि फ़ील्ड आधार (Aadhaar), मोबाइल (Phone/Mobile) या संख्यात्मक है, तो अंतिम मान में केवल अंक (Digits: 0-9) लिखें।
3. उत्तर में केवल और केवल अंतिम शुद्ध मान (Clean Value) लिखें। कोई व्याख्या या उद्धरण चिह्न नहीं।`,

            correctorUser: (fieldLabel, cleanOriginal, cleanInstruction) =>
                `फ़ील्ड: ${fieldLabel}\nपिछला मान: ${cleanOriginal}\nसुधार निर्देश: "${cleanInstruction}"\nनया शुद्ध मान:`
        },

        // ===== 4. HEURISTICS & INTENT KEYWORDS =====
        heuristics: {
            negationWords: [
                'नहीं', 'नही', 'गलत', 'सुधार', 'बदल', 'ठीक नहीं', 'सही नहीं', 'गलती',
                'wrong', 'incorrect', 'change', 'not right', 'no', 'not', 'sudhar', 'बदलो'
            ],
            confirmWords: [
                'हाँ', 'हां', 'हा', 'जी', 'yes', 'haan', 'ha', 'ok', 'proceed', 'next', 'बिल्कुल',
                'ठीक', 'सही है', 'sahi hai'
            ],
            skipPhrases: [
                'छोड़ दो', 'छोड़ो', 'स्किप', 'skip', 'skip field', 'leave it', 'pass', 'आगे बढ़ो बिना'
            ],
            pureRejectionWords: [
                'नहीं', 'नही', 'no', 'गलत', 'wrong', 'not this', 'incorrect', 'nah'
            ]
        }
    };

    const hiIN = {
        ...hi,
        code: 'hi-IN',
        name: 'हिन्दी (भारत)',
        speechLang: 'hi-IN'
    };

    if (typeof window !== 'undefined') {
        window.__LOCALES__ = window.__LOCALES__ || {};
        window.__LOCALES__['hi-IN'] = hiIN;
        window.__LOCALES__['hi'] = hiIN;
    }
})();
