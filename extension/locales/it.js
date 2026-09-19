/**
 * it.js - Italian Localization Resource (it-IT)
 */

(function () {
    const it = {
        code: 'it-IT',
        name: 'Italiano (Italia)',
        speechLang: 'it-IT',

        labels: {
            brandTitle: 'ASSISTENTE MODULI VOCALE • NEMOTRON & GEMMA',
            appTitle: 'Signal — Assistente Moduli Vocale',
            tagline: 'Scansiona e compila automaticamente i moduli web usando la tua voce',

            orchestratorTitle: 'Servizi Backend (Orchestrator)',
            companionOffline: 'Companion Offline',
            companionConnected: 'Companion Online',
            btnStartServices: 'Avvia Servizi',
            btnStopServices: 'Ferma',
            btnCheckAssets: 'Verifica File',
            btnLaunchCompanion: '⚡ Avvia Orchestrator Companion',
            orchestratorNotice: 'Se è la prima volta, assicurati di aver eseguito <kbd>register_protocol.bat</kbd> (o <kbd>register_protocol.sh</kbd>).',

            svsAsrName: 'Nemotron ASR',
            svsTtsName: 'Piper TTS',
            svsLlmName: 'Gemma 4 LLM',

            statusIdle: 'inattivo',
            micPermLink: 'Permesso Microfono',
            interruptBtn: '🔇 Muto TTS',

            btnScanPage: 'Scansiona Modulo',
            btnStartFormFlow: 'Compila a Voce',
            btnStopFormFlow: 'Termina Sessione',

            pageLabel: 'Pagina:',
            fieldCountBadge: '{count} campi',
            allFieldsComplete: 'Tutti i campi completati!',

            micMutedBadge: '🔇 microfono silenziato — assistente parla',

            spotlightStep: 'Campo {current} / {total}',
            spotlightRequired: '*Obbligatorio',
            spotlightPhaseAsking: 'In richiesta…',
            spotlightPhaseListening: 'In ascolto…',
            spotlightPhaseConfirming: 'Conferma…',
            spotlightPhaseEvaluating: 'Verifica…',
            spotlightPhaseConfirmed: '✓ Verificato',
            spotlightPromptListening: 'In ascolto: pronuncia la tua risposta…',
            spotlightValLabel: 'Valore Acquisito:',
            spotlightNoValYet: 'Nessuna risposta ancora',

            btnPrevField: '⏮️ Precedente',
            btnReaskField: '🔄 Ripeti',
            btnSkipField: '⏭️ Salta',

            transcriptLabel: '🎙️ Trascrizione Vocale in Tempo Reale (STT Streaming)',
            transcriptIdle: 'Fai clic su "Compila a Voce" per iniziare…',
            transcriptListeningPrompt: 'Pronuncia la risposta per {label}…',
            transcriptConfirmPrompt: 'Di\' sì o specifica una correzione…',

            scannedFieldsTitle: '📋 Campi Rilevati (<b id="scannedFieldsCount">{count}</b>)',
            accordionHint: 'Clicca per saltare al campo',

            tuningTitle: '⚙️ Impostazioni & Calibrazione',
            settingWsUrl: 'URL WebSocket',
            settingThreshold: 'Soglia Vocale Silero',
            settingSilence: 'Silenzio prima di finalizzare',
            settingMaxTurn: 'Limite massimo frase',
            settingPadding: 'Pre-roll Padding',
            settingLlmUrl: 'URL Server Proxy LLM',
            settingDebounce: 'Debounce Conferma',

            noFieldsFound: 'Nessun campo compilabile trovato in questa pagina.',
            fieldsScannedSuccess: '¡{count} campi scansionati con successo!',
            fieldsScannedBadge: '{count} campi trovati',
            fieldsZeroBadge: '0 campi trovati',
            scanningBadge: 'Scansione in corso…',
            scanFailedBadge: 'Scansione fallita',
            invalidPageBadge: 'Pagina non valida',
            tabNotFoundBadge: 'Scheda non trovata',
            activeTabNotFoundToast: 'Scheda attiva non trovata',
            cannotScanInternalToast: 'Impossibile scansionare le pagine interne del browser',
            unableToScanToast: 'Impossibile scansionare il modulo',
            firstFieldToast: 'Questo è il primo campo',
            sessionStoppedToast: 'Sessione di compilazione interrotta',
            sessionEndedToast: 'Sessione terminata',
            connectionClosed: 'Connessione chiusa',
            transcriptListening: 'In ascolto…',
            pleaseWaitToast: 'Attendere, elaborazione in corso…',
            checkingConfirmation: 'Verifica conferma…',
            wsConnectFailed: 'Impossibile connettersi a WebSocket',
            micPermTabOpened: 'Scheda permessi aperta — clicca su "Consenti"',
            micAccessDenied: 'Accesso al microfono negato: ',
            asrError: 'Errore ASR: ',
            servicesStartingToast: 'Avvio servizi in corso…',
            servicesStartedToast: 'Servizi avviati',
            servicesStartFailedToast: 'Avvio fallito: ',
            servicesStoppedToast: 'Servizi fermati',
            servicesStopFailedToast: 'Arresto fallito: ',
            modelsAllPresentToast: 'Tutti i modelli sono disponibili ✓',
            modelsMissingToast: 'Alcuni modelli risultano mancanti',
            checkFailedToast: 'Verifica fallita: ',
            companionStartingToast: 'Avvio companion…',
            companionOnlineToast: 'Companion online ✓',
            companionFailedToast: 'Companion non avviato? Esegui register_protocol',
            companionStartingBtn: '⏳ Avvio…',
            companionReadyBtn: '⚡ Avvia Orchestrator Companion',
            ttsInterrupted: 'TTS interrotto',
            ttsError: 'Errore TTS: ',

            launchPageTitle: 'Avvio Orchestrator Companion - Assistente Vocale',
            launchTitle: 'Avvio dell\'Orchestrator Companion...',
            launchDesc: 'Se il browser richiede di <b>"Aprire Companion Orchestrator"</b>, seleziona <b>"Apri"</b>.',
            launchStatusWaiting: '⏳ In attesa di connessione con il server companion…',
            launchManualBtn: '🚀 Clicca qui se non si apre automaticamente',
            launchHint: 'Se non accade nulla, assicurati che <kbd>register_protocol.bat</kbd> (o <kbd>register_protocol.sh</kbd>) sia stato eseguito.',
            launchSuccessTitle: 'Companion avviato con successo!',
            launchSuccessDesc: 'Il server companion è online. Questa scheda si chiuderà…',
            launchSuccessStatus: '✓ Companion Online su http://127.0.0.1:8000',
            launchFailStatus: 'Impossibile connettersi al companion. Esegui start_companion.',

            // Restart Confirmation Modal Strings
            restartModalTitle: 'Riavviare il server Companion?',
            restartModalDesc: 'La modifica della lingua in {name} richiede il riavvio del server Companion con le nuove impostazioni linguistiche. I processi attuali verranno interrotti e si aprirà una nuova finestra del prompt dei comandi.',
            btnRestartCancel: 'Annulla',
            btnRestartConfirm: 'Riavvia Server',
            restartingToast: 'Riavvio del server Companion in {name}...'
        },

        dictation: {
            sessionFinished: 'Ottimo! Tutti i campi di questa pagina sono stati compilati.',
            askFieldRepeat: (label) => `Per favore ripeti la tua risposta per ${label}.`,
            askFieldExisting: (label, val) => `Il prossimo campo è ${label}. Il valore attuale è ${val}. Vuoi modificarlo? Pronuncia un nuovo valore oppure dì sì per mantenerlo.`,
            askFieldSelect: (label, required) => `Il prossimo campo è ${label}. ${required ? 'Questo campo è obbligatorio.' : ''} Quale opzione desideri selezionare?`,
            askFieldDefault: (label, required) => `Il prossimo campo è ${label}. ${required ? 'Questo campo è obbligatorio.' : ''} Cosa devo inserire qui?`,

            confirmField: (label, val) => `Per ${label}: ${val}. È corretto? Di' sì o spiegami cosa modificare.`,
            fieldRecorded: (label) => `Perfetto, ${label} è stato salvato.`,
            askCorrection: (label) => `Dimmi pure la correzione. Cosa dobbiamo inserire in ${label}?`,
            confirmCorrection: (corrected) => `Valore aggiornato: ${corrected}. Va bene ora?`,
            clarifyValue: (label) => `Per favore scandisci chiaramente l'intero valore per ${label}.`,
            fieldSkipped: (label) => `Va bene, saltiamo ${label || 'questo campo'}.`,
            reaskPrompt: (label) => `Per favore ripeti la tua risposta per ${label}.`
        },

        prompts: {
            intentClassifierSystem:
                'Sei un assistente per la classificazione dell\'intento.\n' +
                'È stato chiesto all\'utente se il valore inserito è corretto.\n\n' +
                'Regole:\n' +
                '1. Se l\'utente conferma ("sì", "si", "esatto", "corretto", "va bene", "ok", "procedi", "avanti") → Rispondi SOLO "CONFIRM".\n' +
                '2. Se l\'utente nega, segnala un errore o corregge ("no", "sbagliato", "cambia", "errato", "in realtà è...") → Rispondi SOLO "CORRECT".\n\n' +
                'Rispondi con esattamente UNA parola: CONFIRM o CORRECT.',

            intentClassifierUser: (reply) => `Risposta utente: "${reply}"\nDecisione:`,

            extractorSystem:
                `Sei un assistente per l'estrazione di dati dai campi modulo.
Estrai ESCLUSIVAMENTE il valore pulito eliminando i convenevoli e le parole riempitive.`,

            extractorUser: (fieldLabel, cleanSpoken) => `Campo: ${fieldLabel}\nRisposta vocale: "${cleanSpoken}"\nValore Pulito:`,

            correctorSystem:
                `Sei un assistente per la correzione dei campi del modulo.
Applica l'istruzione di correzione al valore precedente e restituisci SOLO il nuovo valore pulito finale.`,

            correctorUser: (fieldLabel, cleanOriginal, cleanInstruction) =>
                `Campo: ${fieldLabel}\nValore precedente: ${cleanOriginal}\nIstruzione: "${cleanInstruction}"\nNuovo Valore:`
        },

        heuristics: {
            negationWords: [
                'no', 'non', 'sbagliato', 'errato', 'cambia', 'modifica', 'errore', 'correggi', 'non va'
            ],
            confirmWords: [
                'sì', 'si', 'esatto', 'corretto', 'ok', 'bene', 'va bene', 'procedi', 'avanti', 'perfetto', 'confermo'
            ],
            skipPhrases: [
                'salta', 'ignora', 'passa', 'lascia stare', 'prossimo campo'
            ],
            pureRejectionWords: [
                'no', 'sbagliato', 'errato', 'non questo'
            ]
        }
    };

    if (typeof window !== 'undefined') {
        window.__LOCALES__ = window.__LOCALES__ || {};
        window.__LOCALES__['it-IT'] = it;
        window.__LOCALES__['it'] = it;
    }
})();
