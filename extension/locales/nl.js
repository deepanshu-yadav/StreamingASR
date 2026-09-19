/**
 * nl.js - Dutch Localization Resource (nl-NL)
 */

(function () {
    const nl = {
        code: 'nl-NL',
        name: 'Nederlands (Nederland)',
        speechLang: 'nl-NL',

        labels: {
            brandTitle: 'STEM FORMULIER ASSISTENT • NEMOTRON & GEMMA',
            appTitle: 'Signal — Stem Formulier Assistent',
            tagline: 'Scan en vul webformulieren automatisch in met je stem',

            orchestratorTitle: 'Backend Diensten (Orchestrator)',
            companionOffline: 'Companion Offline',
            companionConnected: 'Companion Online',
            btnStartServices: 'Start Diensten',
            btnStopServices: 'Stoppen',
            btnCheckAssets: 'Bestanden Controleren',
            btnLaunchCompanion: '⚡ Start Companion Orchestrator',
            orchestratorNotice: 'Als dit de eerste keer is, voer dan eerst <kbd>register_protocol.bat</kbd> (of <kbd>register_protocol.sh</kbd>) uit.',

            svsAsrName: 'Nemotron ASR',
            svsTtsName: 'Piper TTS',
            svsLlmName: 'Gemma 4 LLM',

            statusIdle: 'inactief',
            micPermLink: 'Microfoontoegang',
            interruptBtn: '🔇 Demp TTS',

            btnScanPage: 'Formulier Scannen',
            btnStartFormFlow: 'Invullen met Stem',
            btnStopFormFlow: 'Sessie Beëindigen',

            pageLabel: 'Pagina:',
            fieldCountBadge: '{count} velden',
            allFieldsComplete: 'Alle velden ingevuld!',

            micMutedBadge: '🔇 microfoon gedempt — assistent spreekt',

            spotlightStep: 'Veld {current} / {total}',
            spotlightRequired: '*Verplicht',
            spotlightPhaseAsking: 'Vragen…',
            spotlightPhaseListening: 'Luisteren…',
            spotlightPhaseConfirming: 'Bevestigen…',
            spotlightPhaseEvaluating: 'Controleren…',
            spotlightPhaseConfirmed: '✓ Bevestigd',
            spotlightPromptListening: 'Luisteren: spreek uw antwoord in…',
            spotlightValLabel: 'Vastgelegde Waarde:',
            spotlightNoValYet: 'Nog geen antwoord',

            btnPrevField: '⏮️ Vorige',
            btnReaskField: '🔄 Opnieuw',
            btnSkipField: '⏭️ Overslaan',

            transcriptLabel: '🎙️ Live Stemtranscriptie (Streaming STT)',
            transcriptIdle: 'Klik op "Invullen met Stem" om te beginnen…',
            transcriptListeningPrompt: 'Spreek antwoord in voor {label}…',
            transcriptConfirmPrompt: 'Zeg ja of geef een correctie door…',

            scannedFieldsTitle: '📋 Gescande Velden (<b id="scannedFieldsCount">{count}</b>)',
            accordionHint: 'Klik om naar veld te gaan',

            tuningTitle: '⚙️ Instellingen & Tuning',
            settingWsUrl: 'WebSocket URL',
            settingThreshold: 'Silero Spraakdrempel',
            settingSilence: 'Stilte voor afronding',
            settingMaxTurn: 'Maximale spreektijd cap',
            settingPadding: 'Pre-roll Padding',
            settingLlmUrl: 'LLM Proxy Server URL',
            settingDebounce: 'Bevestiging Debounce',

            noFieldsFound: 'Geen invulbare velden gevonden op deze pagina.',
            fieldsScannedSuccess: '{count} velden succesvol gescand!',
            fieldsScannedBadge: '{count} velden gevonden',
            fieldsZeroBadge: '0 velden gevonden',
            scanningBadge: 'Scannen…',
            scanFailedBadge: 'Scan mislukt',
            invalidPageBadge: 'Ongeldige pagina',
            tabNotFoundBadge: 'Tabblad niet gevonden',
            activeTabNotFoundToast: 'Actief tabblad niet gevonden',
            cannotScanInternalToast: 'Interne browserpagina\'s kunnen niet worden gescand',
            unableToScanToast: 'Kan formulier niet scannen',
            firstFieldToast: 'Dit is het eerste veld',
            sessionStoppedToast: 'Sessie gestopt',
            sessionEndedToast: 'Sessie beëindigd',
            connectionClosed: 'Verbinding verbroken',
            transcriptListening: 'Luisteren…',
            pleaseWaitToast: 'Even geduld, verwerken…',
            checkingConfirmation: 'Bevestiging controleren…',
            wsConnectFailed: 'Kan geen verbinding maken met WebSocket',
            micPermTabOpened: 'Permissietabblad geopend — klik op "Toestaan"',
            micAccessDenied: 'Microfoontoegang geweigerd: ',
            asrError: 'ASR fout: ',
            servicesStartingToast: 'Diensten starten…',
            servicesStartedToast: 'Diensten gestart',
            servicesStartFailedToast: 'Starten mislukt: ',
            servicesStoppedToast: 'Diensten gestopt',
            servicesStopFailedToast: 'Stoppen mislukt: ',
            modelsAllPresentToast: 'Alle modellen beschikbaar ✓',
            modelsMissingToast: 'Sommige modellen ontbreken',
            checkFailedToast: 'Controle mislukt: ',
            companionStartingToast: 'Companion starten…',
            companionOnlineToast: 'Companion online ✓',
            companionFailedToast: 'Companion niet gestart? Voer register_protocol uit',
            companionStartingBtn: '⏳ Starten…',
            companionReadyBtn: '⚡ Start Companion Orchestrator',
            ttsInterrupted: 'TTS onderbroken',
            ttsError: 'TTS fout: ',

            launchPageTitle: 'Companion Orchestrator Starten - Stemassistent',
            launchTitle: 'Companion Orchestrator Starten...',
            launchDesc: 'Als de browser vraagt om <b>"Companion Orchestrator openen"</b>, kies dan <b>"Openen"</b>.',
            launchStatusWaiting: '⏳ Wachten op verbinding met companion server…',
            launchManualBtn: '🚀 Klik hier als het niet automatisch opent',
            launchHint: 'Zorg ervoor dat <kbd>register_protocol.bat</kbd> (of <kbd>register_protocol.sh</kbd>) is uitgevoerd.',
            launchSuccessTitle: 'Companion succesvol gestart!',
            launchSuccessDesc: 'Companion server is online. Dit tabblad sluit automatisch…',
            launchSuccessStatus: '✓ Companion Online op http://127.0.0.1:8000',
            launchFailStatus: 'Kan geen verbinding maken met companion. Start start_companion.',

            // Restart Confirmation Modal Strings
            restartModalTitle: 'Companion-server herstarten?',
            restartModalDesc: 'Als u de taal wijzigt naar {name}, moet de Companion-server opnieuw worden gestart met de nieuwe taalinstellingen. Bestaande processen worden gestopt en er wordt een nieuw opdrachtpromptvenster geopend.',
            btnRestartCancel: 'Annuleren',
            btnRestartConfirm: 'Server herstarten',
            restartingToast: 'Companion-server wordt herstart in het {name}...'
        },

        dictation: {
            sessionFinished: 'Geweldig! Alle velden op deze pagina zijn ingevuld.',
            askFieldRepeat: (label) => `Herhaal alstublieft uw antwoord voor ${label}.`,
            askFieldExisting: (label, val) => `Het volgende veld is ${label}. De huidige waarde is ${val}. Wilt u dit wijzigen? Spreek een nieuwe waarde in of zeg ja om te behouden.`,
            askFieldSelect: (label, required) => `Het volgende veld is ${label}. ${required ? 'Dit is verplicht.' : ''} Welke optie wilt u selecteren?`,
            askFieldDefault: (label, required) => `Het volgende veld is ${label}. ${required ? 'Dit is verplicht.' : ''} Wat mag ik hier invullen?`,

            confirmField: (label, val) => `Voor ${label}: ${val}. Klopt dit? Zeg ja of vertel wat ik moet aanpassen.`,
            fieldRecorded: (label) => `Begrepen, ${label} is opgeslagen.`,
            askCorrection: (label) => `Wat is de juiste correctie voor ${label}?`,
            confirmCorrection: (corrected) => `Bijgewerkte waarde: ${corrected}. Is dit nu juist?`,
            clarifyValue: (label) => `Spreek alstublieft de volledige waarde duidelijk in voor ${label}.`,
            fieldSkipped: (label) => `Prima, we slaan ${label || 'dit veld'} over.`,
            reaskPrompt: (label) => `Herhaal alstublieft uw antwoord voor ${label}.`
        },

        prompts: {
            intentClassifierSystem:
                'Je bent een intentieclassificatie-assistent.\n' +
                'Er is aan de gebruiker gevraagd of de ingevulde waarde klopt.\n\n' +
                'Regels:\n' +
                '1. Als de gebruiker bevestigt ("ja", "klopt", "correct", "akkoord", "prima", "volgende") → Reageer ALLEEN met "CONFIRM".\n' +
                '2. Als de gebruiker ontkent of een correctie geeft ("nee", "fout", "verkeerd", "wijzigen", "eigenlijk is het...") → Reageer ALLEEN met "CORRECT".\n\n' +
                'Reageer met exact ÉÉN woord: CONFIRM of CORRECT.',

            intentClassifierUser: (reply) => `Antwoord van gebruiker: "${reply}"\nBeslissing:`,

            extractorSystem:
                `Je bent een Formulier Gegevensextractie Assistent.
Extraheer UITSLUITEND de schone, bedoelde waarde zonder opvulwoorden.`,

            extractorUser: (fieldLabel, cleanSpoken) => `Veld: ${fieldLabel}\nGesproken antwoord: "${cleanSpoken}"\nSchone Waarde:`,

            correctorSystem:
                `Je bent een assistent voor het corrigeren van formuliervelden.
Pas de correctie-instructie toe op de vorige waarde en geef UITSLUITEND de uiteindelijke schone waarde terug.`,

            correctorUser: (fieldLabel, cleanOriginal, cleanInstruction) =>
                `Veld: ${fieldLabel}\nVorige Waarde: ${cleanOriginal}\nInstructie: "${cleanInstruction}"\nNieuwe Waarde:`
        },

        heuristics: {
            negationWords: [
                'nee', 'niet', 'fout', 'verkeerd', 'wijzig', 'wijzigen', 'verander', 'foutje', 'onjuist', 'verbeter'
            ],
            confirmWords: [
                'ja', 'klopt', 'correct', 'prima', 'akkoord', 'goed', 'volgende', 'zeker', 'bevestigen', 'inderdaad'
            ],
            skipPhrases: [
                'overslaan', 'sla over', 'volgend veld', 'laat maar', 'skip'
            ],
            pureRejectionWords: [
                'nee', 'fout', 'niet dit', 'verkeerd'
            ]
        }
    };

    if (typeof window !== 'undefined') {
        window.__LOCALES__ = window.__LOCALES__ || {};
        window.__LOCALES__['nl-NL'] = nl;
        window.__LOCALES__['nl'] = nl;
    }
})();
