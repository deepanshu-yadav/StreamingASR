/**
 * pt.js - Portuguese Localization Resource (pt-BR, pt-PT)
 */

(function () {
    const pt = {
        code: 'pt-BR',
        name: 'Português (Brasil)',
        speechLang: 'pt-BR',

        labels: {
            brandTitle: 'ASSISTENTE DE FORMULÁRIO POR VOZ • NEMOTRON & GEMMA',
            appTitle: 'Signal — Assistente de Formulários por Voz',
            tagline: 'Escaneie e preencha formulários da web automaticamente usando sua voz',

            orchestratorTitle: 'Serviços Backend (Orquestrador)',
            companionOffline: 'Companion Offline',
            companionConnected: 'Companion Online',
            btnStartServices: 'Iniciar Serviços',
            btnStopServices: 'Parar',
            btnCheckAssets: 'Verificar Arquivos',
            btnLaunchCompanion: '⚡ Iniciar Orquestrador Companion',
            orchestratorNotice: 'Se esta for sua primeira vez, certifique-se de executar <kbd>register_protocol.bat</kbd> (ou <kbd>register_protocol.sh</kbd>).',

            svsAsrName: 'Nemotron ASR',
            svsTtsName: 'Piper TTS',
            svsLlmName: 'Gemma 4 LLM',

            statusIdle: 'inativo',
            micPermLink: 'Permissão de Microfone',
            interruptBtn: '🔇 Silenciar TTS',

            btnScanPage: 'Escanear Formulário',
            btnStartFormFlow: 'Preencher com Voz',
            btnStopFormFlow: 'Finalizar Sessão',

            pageLabel: 'Página:',
            fieldCountBadge: '{count} campos',
            allFieldsComplete: 'Todos os campos preenchidos!',

            micMutedBadge: '🔇 microfone mudo — assistente falando',

            spotlightStep: 'Campo {current} / {total}',
            spotlightRequired: '*Obrigatório',
            spotlightPhaseAsking: 'Perguntando…',
            spotlightPhaseListening: 'Ouvindo…',
            spotlightPhaseConfirming: 'Confirmando…',
            spotlightPhaseEvaluating: 'Verificando…',
            spotlightPhaseConfirmed: '✓ Verificado',
            spotlightPromptListening: 'Ouvindo: fale sua resposta…',
            spotlightValLabel: 'Valor Capturado:',
            spotlightNoValYet: 'Nenhuma resposta ainda',

            btnPrevField: '⏮️ Anterior',
            btnReaskField: '🔄 Repetir',
            btnSkipField: '⏭️ Pular',

            transcriptLabel: '🎙️ Transcrição de Voz em Tempo Real (Streaming STT)',
            transcriptIdle: 'Clique em "Preencher com Voz" para começar…',
            transcriptListeningPrompt: 'Diga a resposta para {label}…',
            transcriptConfirmPrompt: 'Diga sim ou especifique uma correção…',

            scannedFieldsTitle: '📋 Campos Escaneados (<b id="scannedFieldsCount">{count}</b>)',
            accordionHint: 'Clique para navegar',

            tuningTitle: '⚙️ Configurações & Ajustes',
            settingWsUrl: 'URL do WebSocket',
            settingThreshold: 'Limiar de Voz Silero',
            settingSilence: 'Silêncio antes de finalizar',
            settingMaxTurn: 'Tempo limite por fala',
            settingPadding: 'Margem prévia (Padding)',
            settingLlmUrl: 'URL do Servidor Proxy LLM',
            settingDebounce: 'Debounce de Confirmação',

            noFieldsFound: 'Nenhum campo preenchível encontrado nesta página.',
            fieldsScannedSuccess: '{count} campos escaneados com sucesso!',
            fieldsScannedBadge: '{count} campos encontrados',
            fieldsZeroBadge: '0 campos encontrados',
            scanningBadge: 'Escaneando…',
            scanFailedBadge: 'Falha no escaneamento',
            invalidPageBadge: 'Página inválida',
            tabNotFoundBadge: 'Aba não encontrada',
            activeTabNotFoundToast: 'Aba ativa não encontrada',
            cannotScanInternalToast: 'Não é possível escanear páginas internas do navegador',
            unableToScanToast: 'Não foi possível escanear o formulário',
            firstFieldToast: 'Este é o primeiro campo',
            sessionStoppedToast: 'Sessão interrompida',
            sessionEndedToast: 'Sessão finalizada',
            connectionClosed: 'Conexão encerrada',
            transcriptListening: 'Ouvindo…',
            pleaseWaitToast: 'Aguarde, processando…',
            checkingConfirmation: 'Verificando confirmação…',
            wsConnectFailed: 'Não foi possível conectar ao WebSocket',
            micPermTabOpened: 'Aba de permissão aberta — clique em "Permitir"',
            micAccessDenied: 'Acesso ao microfone negado: ',
            asrError: 'Erro de ASR: ',
            servicesStartingToast: 'Iniciando serviços…',
            servicesStartedToast: 'Serviços iniciados',
            servicesStartFailedToast: 'Falha ao iniciar: ',
            servicesStoppedToast: 'Serviços parados',
            servicesStopFailedToast: 'Falha ao parar: ',
            modelsAllPresentToast: 'Todos os modelos disponíveis ✓',
            modelsMissingToast: 'Alguns modelos estão ausentes',
            checkFailedToast: 'Falha na verificação: ',
            companionStartingToast: 'Iniciando companion…',
            companionOnlineToast: 'Companion online ✓',
            companionFailedToast: 'Companion não iniciou? Execute register_protocol',
            companionStartingBtn: '⏳ Iniciando…',
            companionReadyBtn: '⚡ Iniciar Orquestrador Companion',
            ttsInterrupted: 'TTS interrompido',
            ttsError: 'Erro no TTS: ',

            launchPageTitle: 'Iniciando Orquestrador Companion - Assistente de Voz',
            launchTitle: 'Iniciando Orquestrador Companion...',
            launchDesc: 'Se o navegador solicitar para <b>"Abrir Companion Orchestrator"</b>, selecione <b>"Abrir"</b>.',
            launchStatusWaiting: '⏳ Aguardando conexão com o servidor companion…',
            launchManualBtn: '🚀 Clique aqui caso não abra automaticamente',
            launchHint: 'Se nada acontecer, execute <kbd>register_protocol.bat</kbd> (ou <kbd>register_protocol.sh</kbd>).',
            launchSuccessTitle: 'Companion iniciado com sucesso!',
            launchSuccessDesc: 'O servidor companion está online. Esta aba fechará…',
            launchSuccessStatus: '✓ Companion Online em http://127.0.0.1:8000',
            launchFailStatus: 'Não foi possível conectar. Execute start_companion.',

            // Restart Confirmation Modal Strings
            restartModalTitle: 'Reiniciar o servidor Companion?',
            restartModalDesc: 'Alterar o idioma para {name} requer reiniciar o servidor Companion com a nova configuração de idioma. Os processos atuais serão interrompidos e uma nova janela do prompt de comando será aberta.',
            btnRestartCancel: 'Cancelar',
            btnRestartConfirm: 'Reiniciar Servidor',
            restartingToast: 'Reiniciando o servidor Companion em {name}...'
        },

        dictation: {
            sessionFinished: 'Maravilha! Todos os campos desta página foram preenchidos.',
            askFieldRepeat: (label) => `Por favor, repita sua resposta para ${label}.`,
            askFieldExisting: (label, val) => `O próximo campo é ${label}. O valor atual é ${val}. Deseja alterar? Fale um novo valor ou diga sim para manter.`,
            askFieldSelect: (label, required) => `O próximo campo é ${label}. ${required ? 'Este campo é obrigatório.' : ''} Qual opção deseja selecionar?`,
            askFieldDefault: (label, required) => `O próximo campo é ${label}. ${required ? 'Este campo é obrigatório.' : ''} O que devo preencher aqui?`,

            confirmField: (label, val) => `Para ${label}: ${val}. Está correto? Diga sim ou me diga o que alterar.`,
            fieldRecorded: (label) => `Entendido, ${label} foi registrado.`,
            askCorrection: (label) => `Por favor, diga a correção. Qual valor deve ser inserido em ${label}?`,
            confirmCorrection: (corrected) => `Valor atualizado: ${corrected}. Está correto agora?`,
            clarifyValue: (label) => `Por favor, pronuncie claramente o valor completo para ${label}.`,
            fieldSkipped: (label) => `Certo, pulamos ${label || 'este campo'}.`,
            reaskPrompt: (label) => `Por favor, repita sua resposta para ${label}.`
        },

        prompts: {
            intentClassifierSystem:
                'Você é um assistente de classificação de intenções.\n' +
                'Perguntou-se ao usuário se o valor preenchido está correto.\n\n' +
                'Regras:\n' +
                '1. Se o usuário confirmar ("sim", "correto", "está certo", "isso", "pode ser", "prosseguir", "ok") → Responda APENAS "CONFIRM".\n' +
                '2. Se o usuário negar, indicar erro ou corrigir ("não", "errado", "mudar", "incorreto", "na verdade é...") → Responda APENAS "CORRECT".\n\n' +
                'Responda com exatamente UMA palavra: CONFIRM ou CORRECT.',

            intentClassifierUser: (reply) => `Resposta do usuário: "${reply}"\nDecisão:`,

            extractorSystem:
                `Você é um Assistente de Extração de Dados de Formulário.
Extraia APENAS o valor limpo e pretendido sem palavras de preenchimento ou conversa.`,

            extractorUser: (fieldLabel, cleanSpoken) => `Campo: ${fieldLabel}\nResposta falada: "${cleanSpoken}"\nValor Limpo:`,

            correctorSystem:
                `Você é um assistente especialista em correção de dados de formulário.
Aplique a instrução de correção ao valor anterior e retorne APENAS o novo valor final limpo.`,

            correctorUser: (fieldLabel, cleanOriginal, cleanInstruction) =>
                `Campo: ${fieldLabel}\nValor anterior: ${cleanOriginal}\nInstrução: "${cleanInstruction}"\nNovo Valor:`
        },

        heuristics: {
            negationWords: [
                'não', 'nao', 'errado', 'incorreto', 'muda', 'mudar', 'trocar', 'troca', 'erro', 'corrige', 'conserta'
            ],
            confirmWords: [
                'sim', 'correto', 'certo', 'está certo', 'isso', 'ok', 'pode ser', 'prosseguir', 'avançar', 'perfeito', 'beleza'
            ],
            skipPhrases: [
                'pular', 'passar', 'ignorar', 'deixar', 'próximo campo', 'proximo'
            ],
            pureRejectionWords: [
                'não', 'nao', 'errado', 'não é isso', 'ta errado'
            ]
        }
    };

    const ptPT = {
        ...pt,
        code: 'pt-PT',
        name: 'Português (Portugal)',
        speechLang: 'pt-PT'
    };

    if (typeof window !== 'undefined') {
        window.__LOCALES__ = window.__LOCALES__ || {};
        window.__LOCALES__['pt-BR'] = pt;
        window.__LOCALES__['pt-PT'] = ptPT;
        window.__LOCALES__['pt'] = pt;
    }
})();
