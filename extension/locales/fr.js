/**
 * fr.js - French Localization Resource (fr-FR, fr-CA)
 */

(function () {
    const fr = {
        code: 'fr-FR',
        name: 'Français (France)',
        speechLang: 'fr-FR',

        labels: {
            brandTitle: 'ASSISTANT DE FORMULAIRE VOCAL • NEMOTRON & GEMMA',
            appTitle: 'Signal — Assistant Vocal de Formulaires',
            tagline: 'Scannez et remplissez automatiquement les formulaires web avec votre voix',

            orchestratorTitle: 'Services Backend (Orchestrateur)',
            companionOffline: 'Companion Hors Ligne',
            companionConnected: 'Companion En Ligne',
            btnStartServices: 'Démarrer Services',
            btnStopServices: 'Arrêter',
            btnCheckAssets: 'Vérifier Fichiers',
            btnLaunchCompanion: '⚡ Lancer l\'Orchestrateur Companion',
            orchestratorNotice: 'Si c\'est votre première fois, assurez-vous d\'avoir exécuté <kbd>register_protocol.bat</kbd> (ou <kbd>register_protocol.sh</kbd>).',

            svsAsrName: 'Nemotron ASR',
            svsTtsName: 'Piper TTS',
            svsLlmName: 'Gemma 4 LLM',

            statusIdle: 'inactif',
            micPermLink: 'Autorisation Micro',
            interruptBtn: '🔇 Couper TTS',

            btnScanPage: 'Scanner Formulaire',
            btnStartFormFlow: 'Remplir à la Voix',
            btnStopFormFlow: 'Arrêter Session',

            pageLabel: 'Page :',
            fieldCountBadge: '{count} champs',
            allFieldsComplete: 'Tous les champs sont remplis !',

            micMutedBadge: '🔇 micro coupé — assistant parle',

            spotlightStep: 'Champ {current} / {total}',
            spotlightRequired: '*Obligatoire',
            spotlightPhaseAsking: 'Demande…',
            spotlightPhaseListening: 'Écoute…',
            spotlightPhaseConfirming: 'Confirmation…',
            spotlightPhaseEvaluating: 'Vérification…',
            spotlightPhaseConfirmed: '✓ Vérifié',
            spotlightPromptListening: 'Écoute : prononcez votre réponse…',
            spotlightValLabel: 'Valeur Capturée :',
            spotlightNoValYet: 'Aucune réponse pour le moment',

            btnPrevField: '⏮️ Précédent',
            btnReaskField: '🔄 Répéter',
            btnSkipField: '⏭️ Ignorer',

            transcriptLabel: '🎙️ Transcription Vocale en Direct (Streaming STT)',
            transcriptIdle: 'Cliquez sur "Remplir à la Voix" pour commencer…',
            transcriptListeningPrompt: 'Prononcez la réponse pour {label}…',
            transcriptConfirmPrompt: 'Dites oui ou précisez une correction…',

            scannedFieldsTitle: '📋 Champs Scannés (<b id="scannedFieldsCount">{count}</b>)',
            accordionHint: 'Cliquer pour accéder',

            tuningTitle: '⚙️ Paramètres & Réglages',
            settingWsUrl: 'URL WebSocket',
            settingThreshold: 'Seuil Vocal Silero',
            settingSilence: 'Silence avant validation',
            settingMaxTurn: 'Plafond max de réplique',
            settingPadding: 'Marge avant parole (Padding)',
            settingLlmUrl: 'URL du Serveur Proxy LLM',
            settingDebounce: 'Délai de Confirmation',

            noFieldsFound: 'Aucun champ de saisie trouvé sur cette page.',
            fieldsScannedSuccess: '{count} champs scannés avec succès !',
            fieldsScannedBadge: '{count} champs trouvés',
            fieldsZeroBadge: '0 champ trouvé',
            scanningBadge: 'Scan en cours…',
            scanFailedBadge: 'Échec du scan',
            invalidPageBadge: 'Page non valide',
            tabNotFoundBadge: 'Onglet non trouvé',
            activeTabNotFoundToast: 'Onglet actif introuvable',
            cannotScanInternalToast: 'Impossible de scanner les pages internes du navigateur',
            unableToScanToast: 'Impossible de scanner le formulaire',
            firstFieldToast: 'C\'est le premier champ',
            sessionStoppedToast: 'Session de saisie interrompue',
            sessionEndedToast: 'Session terminée — activités arrêtées',
            connectionClosed: 'Connexion fermée',
            transcriptListening: 'Écoute en cours…',
            pleaseWaitToast: 'Veuillez patienter, traitement en cours…',
            checkingConfirmation: 'Vérification de la confirmation…',
            wsConnectFailed: 'Impossible de se connecter au WebSocket',
            micPermTabOpened: 'Onglet d\'autorisation ouvert — veuillez cliquer sur "Autoriser"',
            micAccessDenied: 'Accès microphone refusé : ',
            asrError: 'Erreur ASR : ',
            servicesStartingToast: 'Démarrage des services…',
            servicesStartedToast: 'Services démarrés',
            servicesStartFailedToast: 'Échec du démarrage : ',
            servicesStoppedToast: 'Services arrêtés',
            servicesStopFailedToast: 'Échec de l\'arrêt : ',
            modelsAllPresentToast: 'Tous les modèles sont disponibles ✓',
            modelsMissingToast: 'Certains modèles sont manquants',
            checkFailedToast: 'Échec de vérification : ',
            companionStartingToast: 'Démarrage du companion…',
            companionOnlineToast: 'Companion en ligne ✓',
            companionFailedToast: 'Companion non démarré ? Lancez register_protocol',
            companionStartingBtn: '⏳ Démarrage…',
            companionReadyBtn: '⚡ Lancer l\'Orchestrateur Companion',
            ttsInterrupted: 'TTS interrompu',
            ttsError: 'Erreur TTS : ',

            launchPageTitle: 'Démarrage de l\'Orchestrateur Companion - Voice Assistant',
            launchTitle: 'Démarrage de l\'Orchestrateur Companion...',
            launchDesc: 'Si le navigateur demande d\'<b>"Ouvrir Companion Orchestrator"</b>, veuillez sélectionner <b>"Ouvrir"</b>.',
            launchStatusWaiting: '⏳ En attente de connexion avec le serveur companion…',
            launchManualBtn: '🚀 Cliquez ici si la fenêtre ne s\'ouvre pas automatiquement',
            launchHint: 'Si rien ne se passe, vérifiez que <kbd>register_protocol.bat</kbd> (ou <kbd>register_protocol.sh</kbd>) a été exécuté.',
            launchSuccessTitle: 'Companion démarré avec succès !',
            launchSuccessDesc: 'Le serveur companion est en ligne. Cet onglet va se fermer…',
            launchSuccessStatus: '✓ Companion en ligne sur http://127.0.0.1:8000',
            launchFailStatus: 'Connexion impossible. Veuillez lancer start_companion.',

            // Restart Confirmation Modal Strings
            restartModalTitle: 'Redémarrer le serveur Companion ?',
            restartModalDesc: 'Changer la langue vers {name} nécessite de redémarrer le serveur Companion avec les nouveaux paramètres de langue. Les processus actuels seront arrêtés et une nouvelle fenêtre d\'invite de commande s\'ouvrira.',
            btnRestartCancel: 'Annuler',
            btnRestartConfirm: 'Redémarrer le serveur',
            restartingToast: 'Redémarrage du serveur Companion en {name}...'
        },

        dictation: {
            sessionFinished: 'Formidable ! Tous les champs de cette page ont été complétés.',
            askFieldRepeat: (label) => `Veuillez répéter votre réponse pour ${label}.`,
            askFieldExisting: (label, val) => `Le champ suivant est ${label}. La valeur actuelle est ${val}. Souhaitez-vous la modifier ? Dites une nouvelle valeur ou dites oui pour la conserver.`,
            askFieldSelect: (label, required) => `Le champ suivant est ${label}. ${required ? 'Ce champ est obligatoire.' : ''} Quelle option voulez-vous choisir ?`,
            askFieldDefault: (label, required) => `Le champ suivant est ${label}. ${required ? 'Ce champ est obligatoire.' : ''} Que dois-je inscrire ici ?`,

            confirmField: (label, val) => `Pour ${label} : ${val}. Est-ce correct ? Dites oui ou indiquez ce qu'il faut changer.`,
            fieldRecorded: (label) => `Bien noté, ${label} a été enregistré.`,
            askCorrection: (label) => `Veuillez indiquer la correction. Que faut-il mettre dans ${label} ?`,
            confirmCorrection: (corrected) => `Valeur mise à jour : ${corrected}. Est-ce bien cela ?`,
            clarifyValue: (label) => `Veuillez énoncer clairement la valeur complète pour ${label}.`,
            fieldSkipped: (label) => `D'accord, nous ignorons ${label || 'ce champ'}.`,
            reaskPrompt: (label) => `Veuillez répéter votre réponse pour ${label}.`
        },

        prompts: {
            intentClassifierSystem:
                'Vous êtes un assistant de classification d\'intention.\n' +
                'On a demandé à l\'utilisateur si la valeur saisie est correcte.\n\n' +
                'Règles :\n' +
                '1. Si l\'utilisateur confirme ("oui", "ouais", "correct", "c\'est bon", "exact", "parfait", "continuer") → Répondez UNIQUEMENT "CONFIRM".\n' +
                '2. Si l\'utilisateur refuse, signale une erreur ou propose une modification ("non", "faux", "erreur", "change", "en fait c\'est...") → Répondez UNIQUEMENT "CORRECT".\n\n' +
                'Répondez par exactement UN mot : CONFIRM ou CORRECT.',

            intentClassifierUser: (reply) => `Réponse utilisateur : "${reply}"\nDécision :`,

            extractorSystem:
                `Vous êtes un Assistant d'Extraction de Données de Formulaires.
L'utilisateur a donné une réponse vocale pour un champ. Extrayez UNIQUEMENT la valeur propre voulue sans fioritures de conversation.`,

            extractorUser: (fieldLabel, cleanSpoken) => `Champ : ${fieldLabel}\nRéponse vocale : "${cleanSpoken}"\nValeur Propre :`,

            correctorSystem:
                `Vous êtes un assistant expert en correction de champs de formulaire.
Appliquez l'instruction de correction à la valeur précédente et renvoyez UNIQUEMENT la nouvelle valeur finale propre.`,

            correctorUser: (fieldLabel, cleanOriginal, cleanInstruction) =>
                `Champ : ${fieldLabel}\nValeur précédente : ${cleanOriginal}\nInstruction de correction : "${cleanInstruction}"\nNouvelle Valeur :`
        },

        heuristics: {
            negationWords: [
                'non', 'pas', 'faux', 'erreur', 'changer', 'remplacer', 'modifier',
                'incorrect', 'mauvais', 'pas bon', 'rectifier', 'corrige'
            ],
            confirmWords: [
                'oui', 'ouais', 'exact', 'correct', 'd\'accord', 'c\'est bon', 'parfait',
                'suivant', 'continuer', 'valider', 'tout à fait', 'bien'
            ],
            skipPhrases: [
                'passer', 'ignorer', 'laisser', 'suivant', 'champ suivant', 'saute'
            ],
            pureRejectionWords: [
                'non', 'faux', 'pas ça', 'incorrect', 'mauvais'
            ]
        }
    };

    const frCA = {
        ...fr,
        code: 'fr-CA',
        name: 'Français (Canada)',
        speechLang: 'fr-CA'
    };

    if (typeof window !== 'undefined') {
        window.__LOCALES__ = window.__LOCALES__ || {};
        window.__LOCALES__['fr-FR'] = fr;
        window.__LOCALES__['fr-CA'] = frCA;
        window.__LOCALES__['fr'] = fr;
    }
})();
