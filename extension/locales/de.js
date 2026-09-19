/**
 * de.js - German Localization Resource (de-DE)
 */

(function () {
    const de = {
        code: 'de-DE',
        name: 'Deutsch (Deutschland)',
        speechLang: 'de-DE',

        labels: {
            brandTitle: 'SPRACH-FORMULARASSISTENT • NEMOTRON & GEMMA',
            appTitle: 'Signal — Sprach-Formularassistent',
            tagline: 'Webformulare automatisch mit der eigenen Stimme scannen und ausfüllen',

            orchestratorTitle: 'Backend-Dienste (Orchestrator)',
            companionOffline: 'Companion Offline',
            companionConnected: 'Companion Online',
            btnStartServices: 'Dienste Starten',
            btnStopServices: 'Stoppen',
            btnCheckAssets: 'Dateien Prüfen',
            btnLaunchCompanion: '⚡ Companion Orchestrator Starten',
            orchestratorNotice: 'Falls dies das erste Mal ist, stellen Sie sicher, dass <kbd>register_protocol.bat</kbd> (oder <kbd>register_protocol.sh</kbd>) ausgeführt wurde.',

            svsAsrName: 'Nemotron ASR',
            svsTtsName: 'Piper TTS',
            svsLlmName: 'Gemma 4 LLM',

            statusIdle: 'inaktiv',
            micPermLink: 'Mikrofonfreigabe',
            interruptBtn: '🔇 TTS Stummschalten',

            btnScanPage: 'Formular Scannen',
            btnStartFormFlow: 'Mit Sprache Ausfüllen',
            btnStopFormFlow: 'Sitzung Beenden',

            pageLabel: 'Seite:',
            fieldCountBadge: '{count} Felder',
            allFieldsComplete: 'Alle Felder vollständig!',

            micMutedBadge: '🔇 Mikrofon stummgeschaltet — Assistent spricht',

            spotlightStep: 'Feld {current} / {total}',
            spotlightRequired: '*Erforderlich',
            spotlightPhaseAsking: 'Fragt…',
            spotlightPhaseListening: 'Hört zu…',
            spotlightPhaseConfirming: 'Bestätigung…',
            spotlightPhaseEvaluating: 'Prüft…',
            spotlightPhaseConfirmed: '✓ Bestätigt',
            spotlightPromptListening: 'Hört zu: Bitte Antwort einsprechen…',
            spotlightValLabel: 'Erfasster Wert:',
            spotlightNoValYet: 'Noch keine Antwort',

            btnPrevField: '⏮️ Zurück',
            btnReaskField: '🔄 Wiederholen',
            btnSkipField: '⏭️ Überspringen',

            transcriptLabel: '🎙️ Live-Sprachtranskription (Streaming STT)',
            transcriptIdle: 'Klicken Sie auf "Mit Sprache Ausfüllen", um zu beginnen…',
            transcriptListeningPrompt: 'Antwort für {label} einsprechen…',
            transcriptConfirmPrompt: 'Sagen Sie Ja oder nennen Sie eine Korrektur…',

            scannedFieldsTitle: '📋 Erkannte Felder (<b id="scannedFieldsCount">{count}</b>)',
            accordionHint: 'Klicken zum Springen',

            tuningTitle: '⚙️ Einstellungen & Feineinstellung',
            settingWsUrl: 'WebSocket-URL',
            settingThreshold: 'Silero Sprach-Schwellenwert',
            settingSilence: 'Stille vor Abschluss',
            settingMaxTurn: 'Maximale Redezeit',
            settingPadding: 'Pre-roll Padding',
            settingLlmUrl: 'LLM-Proxy Server URL',
            settingDebounce: 'Bestätigungs-Verzögerung',

            noFieldsFound: 'Keine ausfüllbaren Felder auf dieser Seite gefunden.',
            fieldsScannedSuccess: '{count} Felder erfolgreich gescannt!',
            fieldsScannedBadge: '{count} Felder gefunden',
            fieldsZeroBadge: '0 Felder gefunden',
            scanningBadge: 'Scannt…',
            scanFailedBadge: 'Scan fehlgeschlagen',
            invalidPageBadge: 'Ungültige Seite',
            tabNotFoundBadge: 'Tab nicht gefunden',
            activeTabNotFoundToast: 'Aktiver Tab nicht gefunden',
            cannotScanInternalToast: 'Interne Browserseiten können nicht gescannt werden',
            unableToScanToast: 'Formular konnte nicht gescannt werden',
            firstFieldToast: 'Dies ist das erste Feld',
            sessionStoppedToast: 'Ausfüllsitzung angehalten',
            sessionEndedToast: 'Sitzung beendet',
            connectionClosed: 'Verbindung geschlossen',
            transcriptListening: 'Hört zu…',
            pleaseWaitToast: 'Bitte warten, verarbeitet…',
            checkingConfirmation: 'Prüfe Bestätigung…',
            wsConnectFailed: 'Verbindung zu WebSocket fehlgeschlagen',
            micPermTabOpened: 'Freigabe-Tab geöffnet — bitte auf "Zulassen" klicken',
            micAccessDenied: 'Mikrofonzugriff verweigert: ',
            asrError: 'ASR-Fehler: ',
            servicesStartingToast: 'Starte Dienste…',
            servicesStartedToast: 'Dienste gestartet',
            servicesStartFailedToast: 'Start fehlgeschlagen: ',
            servicesStoppedToast: 'Dienste gestoppt',
            servicesStopFailedToast: 'Stoppen fehlgeschlagen: ',
            modelsAllPresentToast: 'Alle Modelle verfügbar ✓',
            modelsMissingToast: 'Einige Modelle fehlen',
            checkFailedToast: 'Prüfung fehlgeschlagen: ',
            companionStartingToast: 'Companion startet…',
            companionOnlineToast: 'Companion ist online ✓',
            companionFailedToast: 'Companion nicht gestartet? Führen Sie register_protocol aus',
            companionStartingBtn: '⏳ Startet…',
            companionReadyBtn: '⚡ Companion Orchestrator Starten',
            ttsInterrupted: 'TTS unterbrochen',
            ttsError: 'TTS-Fehler: ',

            launchPageTitle: 'Companion Orchestrator wird gestartet - Sprachassistent',
            launchTitle: 'Companion Orchestrator wird gestartet...',
            launchDesc: 'Wenn der Browser fragt, ob <b>"Companion Orchestrator geöffnet"</b> werden soll, wählen Sie <b>"Öffnen"</b>.',
            launchStatusWaiting: '⏳ Warte auf Verbindung mit Companion-Server…',
            launchManualBtn: '🚀 Hier klicken, falls es nicht automatisch öffnet',
            launchHint: 'Stellen Sie sicher, dass <kbd>register_protocol.bat</kbd> (oder <kbd>register_protocol.sh</kbd>) ausgeführt wurde.',
            launchSuccessTitle: 'Companion erfolgreich gestartet!',
            launchSuccessDesc: 'Companion-Server ist online. Dieser Tab schließt sich…',
            launchSuccessStatus: '✓ Companion Online unter http://127.0.0.1:8000',
            launchFailStatus: 'Keine Verbindung zum Companion. Bitte start_companion ausführen.',

            // Restart Confirmation Modal Strings
            restartModalTitle: 'Companion-Server neu starten?',
            restartModalDesc: 'Das Ändern der Sprache zu {name} erfordert einen Neustart des Companion-Servers mit den neuen Spracheinstellungen. Bestehende Prozesse werden beendet und ein neues Eingabeaufforderungsfenster wird geöffnet.',
            btnRestartCancel: 'Abbrechen',
            btnRestartConfirm: 'Server neu starten',
            restartingToast: 'Companion-Server wird auf {name} neu gestartet...'
        },

        dictation: {
            sessionFinished: 'Ausgezeichnet! Alle Felder auf dieser Seite wurden ausgefüllt.',
            askFieldRepeat: (label) => `Bitte wiederholen Sie Ihre Antwort für ${label}.`,
            askFieldExisting: (label, val) => `Das nächste Feld ist ${label}. Der aktuelle Wert ist ${val}. Möchten Sie ihn ändern? Nennen Sie einen neuen Wert oder sagen Sie Ja zum Beibehalten.`,
            askFieldSelect: (label, required) => `Das nächste Feld ist ${label}. ${required ? 'Dies ist ein Pflichtfeld.' : ''} Welche Option möchten Sie auswählen?`,
            askFieldDefault: (label, required) => `Das nächste Feld ist ${label}. ${required ? 'Dies ist ein Pflichtfeld.' : ''} Was soll ich hier eintragen?`,

            confirmField: (label, val) => `Für ${label}: ${val}. Ist das so korrekt? Sagen Sie Ja oder nennen Sie eine Korrektur.`,
            fieldRecorded: (label) => `Verstanden, ${label} wurde gespeichert.`,
            askCorrection: (label) => `Bitte nennen Sie die Korrektur für ${label}.`,
            confirmCorrection: (corrected) => `Aktualisierter Wert: ${corrected}. Ist das jetzt korrekt?`,
            clarifyValue: (label) => `Bitte sprechen Sie den vollständigen Wert für ${label} deutlich ein.`,
            fieldSkipped: (label) => `In Ordnung, ${label || 'dieses Feld'} wurde übersprungen.`,
            reaskPrompt: (label) => `Bitte wiederholen Sie Ihre Antwort für ${label}.`
        },

        prompts: {
            intentClassifierSystem:
                'Sie sind ein Assistent zur Absichtserkennung.\n' +
                'Der Benutzer wurde gefragt, ob der eingetragene Wert korrekt ist.\n\n' +
                'Regeln:\n' +
                '1. Bestätigt der Benutzer ("ja", "richtig", "korrekt", "stimmt", "genau", "weiter", "in ordnung") → Antworten Sie NUR "CONFIRM".\n' +
                '2. Verneint der Benutzer oder nennt eine Korrektur ("nein", "falsch", "ändern", "nicht", "eigentlich ist es...") → Antworten Sie NUR "CORRECT".\n\n' +
                'Antworten Sie mit genau EINEM Wort: CONFIRM oder CORRECT.',

            intentClassifierUser: (reply) => `Benutzerantwort: "${reply}"\nEntscheidung:`,

            extractorSystem:
                `Sie sind ein Assistent zur Datenextraktion aus Formularen.
Extrahieren Sie AUSSCHLIESSLICH den bereinigten Zielwert ohne Füllwörter oder Höflichkeitsfloskeln.`,

            extractorUser: (fieldLabel, cleanSpoken) => `Feld: ${fieldLabel}\nGesprochene Antwort: "${cleanSpoken}"\nBereinigter Wert:`,

            correctorSystem:
                `Sie sind ein Experte für Formularfeldkorrekturen.
Wenden Sie die Korrekturanweisung auf den vorherigen Wert an und geben Sie NUR den neuen bereinigten Wert aus.`,

            correctorUser: (fieldLabel, cleanOriginal, cleanInstruction) =>
                `Feld: ${fieldLabel}\nVorheriger Wert: ${cleanOriginal}\nKorrekturanweisung: "${cleanInstruction}"\nNeuer Wert:`
        },

        heuristics: {
            negationWords: [
                'nein', 'nicht', 'falsch', 'korrektur', 'ändern', 'ändere', 'fehler', 'unrichtig', 'ersetze'
            ],
            confirmWords: [
                'ja', 'korrekt', 'richtig', 'stimmt', 'genau', 'weiter', 'in ordnung', 'passt', 'ok', 'sicher', 'perfekt'
            ],
            skipPhrases: [
                'überspringen', 'ueberspringen', 'weiter', 'nächstes feld', 'auslassen', 'skip'
            ],
            pureRejectionWords: [
                'nein', 'falsch', 'stimmt nicht', 'nicht so'
            ]
        }
    };

    if (typeof window !== 'undefined') {
        window.__LOCALES__ = window.__LOCALES__ || {};
        window.__LOCALES__['de-DE'] = de;
        window.__LOCALES__['de'] = de;
    }
})();
