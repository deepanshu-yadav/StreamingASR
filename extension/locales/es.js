/**
 * es.js - Spanish Localization Resource (es-ES, es-US)
 */

(function () {
    const es = {
        code: 'es-ES',
        name: 'Español (España)',
        speechLang: 'es-ES',

        // ===== 1. HTML UI LABELS =====
        labels: {
            brandTitle: 'ASISTENTE DE FORMULARIOS POR VOZ • NEMOTRON & GEMMA',
            appTitle: 'Signal — Asistente de Formularios por Voz',
            tagline: 'Escanea y completa formularios web automáticamente usando tu voz',

            // Orchestrator Card
            orchestratorTitle: 'Servicios Backend (Orquestador)',
            companionOffline: 'Companion Desconectado',
            companionConnected: 'Companion en Línea',
            btnStartServices: 'Iniciar Servicios',
            btnStopServices: 'Detener',
            btnCheckAssets: 'Verificar Archivos',
            btnLaunchCompanion: '⚡ Iniciar Orquestador Companion',
            orchestratorNotice: 'Si es tu primera vez, asegúrate de haber ejecutado <kbd>register_protocol.bat</kbd> (o <kbd>register_protocol.sh</kbd>).',

            // Service names
            svsAsrName: 'Nemotron ASR',
            svsTtsName: 'Piper TTS',
            svsLlmName: 'Gemma 4 LLM',

            // Toolbar
            statusIdle: 'inactivo',
            micPermLink: 'Permiso de Micrófono',
            interruptBtn: '🔇 Silenciar TTS',

            // Hero Actions
            btnScanPage: 'Escanear Formulario',
            btnStartFormFlow: 'Llenar con Voz',
            btnStopFormFlow: 'Finalizar Sesión',

            // Page info
            pageLabel: 'Página:',
            fieldCountBadge: '{count} campos',
            allFieldsComplete: '¡Todos los campos completados!',

            // Audio states
            micMutedBadge: '🔇 micrófono silenciado — asistente hablando',

            // Spotlight box
            spotlightStep: 'Campo {current} / {total}',
            spotlightRequired: '*Obligatorio',
            spotlightPhaseAsking: 'Preguntando…',
            spotlightPhaseListening: 'Escuchando…',
            spotlightPhaseConfirming: 'Confirmando…',
            spotlightPhaseEvaluating: 'Verificando…',
            spotlightPhaseConfirmed: '✓ Verificado',
            spotlightPromptListening: 'Escuchando: di tu respuesta…',
            spotlightValLabel: 'Valor Capturado:',
            spotlightNoValYet: 'Sin respuesta aún',

            // Spotlight buttons
            btnPrevField: '⏮️ Anterior',
            btnReaskField: '🔄 Repetir',
            btnSkipField: '⏭️ Omitir',

            // Transcript Box
            transcriptLabel: '🎙️ Transcripción en Vivo (STT en tiempo real)',
            transcriptIdle: 'Haz clic en "Llenar con Voz" para comenzar…',
            transcriptListeningPrompt: 'Di tu respuesta para {label}…',
            transcriptConfirmPrompt: 'Di sí o especifica una corrección…',

            // Scanned fields list
            scannedFieldsTitle: '📋 Campos Escaneados (<b id="scannedFieldsCount">{count}</b>)',
            accordionHint: 'Clic para saltar',

            // Tuning Settings
            tuningTitle: '⚙️ Configuración y Ajustes',
            settingWsUrl: 'URL de WebSocket',
            settingThreshold: 'Umbral de Voz Silero',
            settingSilence: 'Silencio antes de finalizar turno',
            settingMaxTurn: 'Límite máximo de turno',
            settingPadding: 'Margen previo (Padding)',
            settingLlmUrl: 'URL del Servidor Proxy LLM',
            settingDebounce: 'Retardo de Confirmación',

            // Toasts & Alerts
            noFieldsFound: 'No se encontraron campos rellenables en esta página.',
            fieldsScannedSuccess: '¡{count} campos escaneados con éxito!',
            fieldsScannedBadge: '{count} campos encontrados',
            fieldsZeroBadge: '0 campos encontrados',
            scanningBadge: 'Escaneando…',
            scanFailedBadge: 'Error de escaneo',
            invalidPageBadge: 'Página no válida',
            tabNotFoundBadge: 'Pestaña no encontrada',
            activeTabNotFoundToast: 'Pestaña activa no encontrada',
            cannotScanInternalToast: 'No se pueden escanear páginas internas del navegador',
            unableToScanToast: 'No se pudo escanear el formulario',
            firstFieldToast: 'Este es el primer campo',
            sessionStoppedToast: 'Sesión de llenado detenida',
            sessionEndedToast: 'Sesión finalizada — actividades detenidas',
            connectionClosed: 'Conexión cerrada',
            transcriptListening: 'Escuchando…',
            pleaseWaitToast: 'Por favor espera, procesando…',
            checkingConfirmation: 'Verificando confirmación…',
            wsConnectFailed: 'No se pudo conectar a WebSocket',
            micPermTabOpened: 'Pestaña de permisos abierta — haz clic en "Permitir"',
            micAccessDenied: 'Acceso al micrófono denegado: ',
            asrError: 'Error de ASR: ',
            servicesStartingToast: 'Iniciando servicios…',
            servicesStartedToast: 'Servicios iniciados',
            servicesStartFailedToast: 'Error al iniciar: ',
            servicesStoppedToast: 'Servicios detenidos',
            servicesStopFailedToast: 'Error al detener: ',
            modelsAllPresentToast: 'Todos los modelos están disponibles ✓',
            modelsMissingToast: 'Faltan algunos modelos',
            checkFailedToast: 'Error de verificación: ',
            companionStartingToast: 'Iniciando companion…',
            companionOnlineToast: 'Companion está en línea ✓',
            companionFailedToast: '¿El companion no inició? Ejecuta register_protocol',
            companionStartingBtn: '⏳ Iniciando…',
            companionReadyBtn: '⚡ Iniciar Orquestador Companion',
            ttsInterrupted: 'TTS interrumpido',
            ttsError: 'Error de TTS: ',

            // Launch Tab Strings
            launchPageTitle: 'Iniciando Orquestador Companion - Asistente de Voz',
            launchTitle: 'Iniciando Orquestador Companion...',
            launchDesc: 'Si el navegador pregunta si desea <b>"Abrir Companion Orchestrator"</b>, seleccione <b>"Abrir"</b>.',
            launchStatusWaiting: '⏳ Esperando conexión con el servidor companion…',
            launchManualBtn: '🚀 Haz clic aquí si no se abre automáticamente',
            launchHint: 'Si no sucede nada, asegúrate de haber ejecutado <kbd>register_protocol.bat</kbd> (o <kbd>register_protocol.sh</kbd>).',
            launchSuccessTitle: '¡Companion iniciado con éxito!',
            launchSuccessDesc: 'El servidor companion está en línea. Esta pestaña se cerrará automáticamente…',
            launchSuccessStatus: '✓ Companion en línea en http://127.0.0.1:8000',
            launchFailStatus: 'No se pudo conectar al companion. Por favor ejecuta start_companion.',

            // Restart Confirmation Modal Strings
            restartModalTitle: '¿Reiniciar el Servidor Companion?',
            restartModalDesc: 'Cambiar el idioma a {name} requiere reiniciar el Servidor Companion con la nueva configuración de idioma. Los procesos existentes se detendrán y se abrirá una nueva ventana de consola.',
            btnRestartCancel: 'Cancelar',
            btnRestartConfirm: 'Reiniciar Servidor',
            restartingToast: 'Reiniciando el Servidor Companion en {name}...'
        },

        // ===== 2. SPOKEN DICTATION TEMPLATES (TTS) =====
        dictation: {
            sessionFinished: '¡Excelente! Se han completado todos los campos de esta página.',
            askFieldRepeat: (label) => `Por favor, repite tu respuesta para ${label}.`,
            askFieldExisting: (label, val) => `El siguiente campo es ${label}. El valor actual es ${val}. ¿Deseas cambiarlo? Di un nuevo valor o di sí para mantenerlo.`,
            askFieldSelect: (label, required) => `El siguiente campo es ${label}. ${required ? 'Este campo es obligatorio.' : ''} ¿Cuál opción deseas seleccionar?`,
            askFieldDefault: (label, required) => `El siguiente campo es ${label}. ${required ? 'Este campo es obligatorio.' : ''} ¿Qué debo ingresar aquí?`,

            confirmField: (label, val) => `Para ${label}: ${val}. ¿Es correcto? Di sí o dime qué corregir.`,
            fieldRecorded: (label) => `Entendido, ${label} ha sido registrado.`,
            askCorrection: (label) => `Por favor dime la corrección. ¿Qué valor debe ir en ${label}?`,
            confirmCorrection: (corrected) => `Valor actualizado: ${corrected}. ¿Está correcto ahora?`,
            clarifyValue: (label) => `Por favor di el valor completo claramente para ${label}.`,
            fieldSkipped: (label) => `De acuerdo, omitiendo ${label || 'este campo'}.`,
            reaskPrompt: (label) => `Por favor repite tu respuesta para ${label}.`
        },

        // ===== 3. LLM PROMPTS (Gemma 4) =====
        prompts: {
            intentClassifierSystem:
                'Eres un asistente de clasificación de intenciones.\n' +
                'Se le preguntó al usuario si el valor para un campo del formulario es correcto.\n\n' +
                'Reglas:\n' +
                '1. Si el usuario confirma ("sí", "correcto", "está bien", "exacto", "procede", "adelante", "perfecto") → Responde ÚNICAMENTE "CONFIRM".\n' +
                '2. Si el usuario niega, indica un error, pide un cambio o da un valor nuevo ("no", "mal", "cámbialo", "incorrecto", "en realidad es...") → Responde ÚNICAMENTE "CORRECT".\n\n' +
                'Responde con exactamente UNA palabra: CONFIRM o CORRECT.',

            intentClassifierUser: (reply) => `Respuesta del usuario: "${reply}"\nDecisión:`,

            extractorSystem:
                `Eres un Asistente de Extracción de Datos de Formularios.
El usuario dio una respuesta hablada para un campo de formulario. Extrae ÚNICAMENTE el valor limpio pretendido.
Elimina frases conversacionales como "mi nombre es...", "por favor pon...", "es...", "rellena con...".
Reglas:
1. Si el campo es DNI, teléfono, código postal o numérico, y el usuario dijo números en palabras (ej. "uno dos tres"), conviértelos a dígitos (ej. "123").
2. Corrige mayúsculas según corresponda.
3. Devuelve ÚNICAMENTE el valor limpio. No añadas comillas ni explicaciones.`,

            extractorUser: (fieldLabel, cleanSpoken) => `Campo: ${fieldLabel}\nRespuesta hablada: "${cleanSpoken}"\nValor Limpio:`,

            correctorSystem:
                `Eres un asistente experto en corrección de campos de formularios.
El usuario está corrigiendo un valor registrado previamente.
Aplica la instrucción de corrección al valor anterior y devuelve ÚNICAMENTE el nuevo valor final limpio. Sin explicaciones ni comillas.`,

            correctorUser: (fieldLabel, cleanOriginal, cleanInstruction) =>
                `Campo: ${fieldLabel}\nValor anterior: ${cleanOriginal}\nInstrucción de corrección: "${cleanInstruction}"\nNuevo Valor:`
        },

        // ===== 4. HEURISTICS & INTENT KEYWORDS =====
        heuristics: {
            negationWords: [
                'no', 'mal', 'incorrecto', 'cambiar', 'cambia', 'corrige', 'corrección',
                'error', 'falso', 'equivocado', 'diferente', 'modificar', 'no es', 'otra cosa'
            ],
            confirmWords: [
                'sí', 'si', 'correcto', 'exacto', 'bien', 'está bien', 'perfecto', 'adelante',
                'proceder', 'siguiente', 'claro', 'vale', 'de acuerdo', 'confirmo', 'así es'
            ],
            skipPhrases: [
                'omitir', 'saltar', 'pasar', 'dejarlo', 'siguiente campo', 'ignorar', 'pasa'
            ],
            pureRejectionWords: [
                'no', 'mal', 'incorrecto', 'eso no', 'así no', 'error'
            ]
        }
    };

    const esUS = {
        ...es,
        code: 'es-US',
        name: 'Español (Estados Unidos)',
        speechLang: 'es-US'
    };

    if (typeof window !== 'undefined') {
        window.__LOCALES__ = window.__LOCALES__ || {};
        window.__LOCALES__['es-ES'] = es;
        window.__LOCALES__['es-US'] = esUS;
        window.__LOCALES__['es'] = es;
    }
})();
