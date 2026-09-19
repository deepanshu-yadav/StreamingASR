/**
 * ru.js - Russian Localization Resource (ru-RU)
 */

(function () {
    const ru = {
        code: 'ru-RU',
        name: 'Русский (Россия)',
        speechLang: 'ru-RU',

        labels: {
            brandTitle: 'ГОЛОСОВОЙ АССИСТЕНТ ФОРМ • NEMOTRON & GEMMA',
            appTitle: 'Signal — Голосовой Помощник для Веб-Форм',
            tagline: 'Автоматически сканируйте и заполняйте веб-формы своим голосом',

            orchestratorTitle: 'Сервисы Бэкенда (Оркестратор)',
            companionOffline: 'Companion Не в сети',
            companionConnected: 'Companion В сети',
            btnStartServices: 'Запустить Сервисы',
            btnStopServices: 'Остановить',
            btnCheckAssets: 'Проверить Файлы',
            btnLaunchCompanion: '⚡ Запустить Оркестратор Companion',
            orchestratorNotice: 'Если это первый запуск, убедитесь, что выполнен <kbd>register_protocol.bat</kbd> (или <kbd>register_protocol.sh</kbd>).',

            svsAsrName: 'Nemotron ASR',
            svsTtsName: 'Piper TTS',
            svsLlmName: 'Gemma 4 LLM',

            statusIdle: 'ожидание',
            micPermLink: 'Доступ к Микрофону',
            interruptBtn: '🔇 Заглушить TTS',

            btnScanPage: 'Сканировать Форму',
            btnStartFormFlow: 'Заполнить Голосом',
            btnStopFormFlow: 'Завершить Сессию',

            pageLabel: 'Страница:',
            fieldCountBadge: '{count} полей',
            allFieldsComplete: 'Все поля заполнены!',

            micMutedBadge: '🔇 микрофон приглушен — ассистент говорит',

            spotlightStep: 'Поле {current} / {total}',
            spotlightRequired: '*Обязательное',
            spotlightPhaseAsking: 'Вопрос…',
            spotlightPhaseListening: 'Слушаю…',
            spotlightPhaseConfirming: 'Подтверждение…',
            spotlightPhaseEvaluating: 'Проверка…',
            spotlightPhaseConfirmed: '✓ Подтверждено',
            spotlightPromptListening: 'Слушаю: назовите ваш ответ…',
            spotlightValLabel: 'Распознанное Значение:',
            spotlightNoValYet: 'Ответа пока нет',

            btnPrevField: '⏮️ Назад',
            btnReaskField: '🔄 Повторить',
            btnSkipField: '⏭️ Пропустить',

            transcriptLabel: '🎙️ Живая Стенограмма (Потоковый STT)',
            transcriptIdle: 'Нажмите "Заполнить Голосом" для начала…',
            transcriptListeningPrompt: 'Назовите ответ для {label}…',
            transcriptConfirmPrompt: 'Скажите "да" или уточните исправление…',

            scannedFieldsTitle: '📋 Найденные Поля (<b id="scannedFieldsCount">{count}</b>)',
            accordionHint: 'Нажмите для перехода',

            tuningTitle: '⚙️ Настройки и Калибровка',
            settingWsUrl: 'WebSocket URL',
            settingThreshold: 'Порог Голоса Silero',
            settingSilence: 'Тишина перед фиксацией',
            settingMaxTurn: 'Лимит времени реплики',
            settingPadding: 'Pre-roll Padding',
            settingLlmUrl: 'URL Прокси-Сервера LLM',
            settingDebounce: 'Задержка Подтверждения',

            noFieldsFound: 'На этой странице не найдено полей для ввода.',
            fieldsScannedSuccess: 'Успешно найдено {count} полей!',
            fieldsScannedBadge: 'Найдено {count} полей',
            fieldsZeroBadge: '0 полей найдено',
            scanningBadge: 'Сканирование…',
            scanFailedBadge: 'Ошибка сканирования',
            invalidPageBadge: 'Недопустимая страница',
            tabNotFoundBadge: 'Вкладка не найдена',
            activeTabNotFoundToast: 'Активная вкладка не найдена',
            cannotScanInternalToast: 'Нельзя сканировать системные страницы браузера',
            unableToScanToast: 'Не удалось просканировать форму',
            firstFieldToast: 'Это первое поле',
            sessionStoppedToast: 'Заполнение формы остановлено',
            sessionEndedToast: 'Сессия завершена',
            connectionClosed: 'Соединение закрыто',
            transcriptListening: 'Слушаю…',
            pleaseWaitToast: 'Пожалуйста, подождите…',
            checkingConfirmation: 'Проверка подтверждения…',
            wsConnectFailed: 'Не удалось подключиться к WebSocket',
            micPermTabOpened: 'Открыта вкладка разрешений — нажмите "Разрешить"',
            micAccessDenied: 'Доступ к микрофону запрещен: ',
            asrError: 'Ошибка ASR: ',
            servicesStartingToast: 'Запуск сервисов…',
            servicesStartedToast: 'Сервисы запущены',
            servicesStartFailedToast: 'Ошибка запуска: ',
            servicesStoppedToast: 'Сервисы остановлены',
            servicesStopFailedToast: 'Ошибка остановки: ',
            modelsAllPresentToast: 'Все модели доступны ✓',
            modelsMissingToast: 'Некоторые модели отсутствуют',
            checkFailedToast: 'Проверка не удалась: ',
            companionStartingToast: 'Запуск companion…',
            companionOnlineToast: 'Companion в сети ✓',
            companionFailedToast: 'Не запустился? Выполните register_protocol',
            companionStartingBtn: '⏳ Запуск…',
            companionReadyBtn: '⚡ Запустить Оркестратор Companion',
            ttsInterrupted: 'TTS прерван',
            ttsError: 'Ошибка TTS: ',

            launchPageTitle: 'Запуск Оркестратора Companion - Голосовой Помощник',
            launchTitle: 'Запуск Оркестратора Companion...',
            launchDesc: 'Если браузер запросит подтверждение <b>"Открыть Companion Orchestrator"</b>, выберите <b>"Открыть"</b>.',
            launchStatusWaiting: '⏳ Ожидание подключения к серверу companion…',
            launchManualBtn: '🚀 Нажмите здесь, если окно не открылось',
            launchHint: 'Убедитесь, что был выполнен <kbd>register_protocol.bat</kbd> (или <kbd>register_protocol.sh</kbd>).',
            launchSuccessTitle: 'Companion успешно запущен!',
            launchSuccessDesc: 'Сервер companion в сети. Вкладка закроется автоматически…',
            launchSuccessStatus: '✓ Companion В сети: http://127.0.0.1:8000',
            launchFailStatus: 'Не удалось подключиться. Запустите start_companion.',

            // Restart Confirmation Modal Strings
            restartModalTitle: 'Перезапустить сервер Companion?',
            restartModalDesc: 'Для смены языка на {name} требуется перезапустить сервер Companion с новыми языковыми параметрами. Текущие процессы будут остановлены, и откроется новое окно командной строки.',
            btnRestartCancel: 'Отмена',
            btnRestartConfirm: 'Перезапустить сервер',
            restartingToast: 'Перезапуск сервера Companion на {name}...'
        },

        dictation: {
            sessionFinished: 'Отлично! Все поля на этой странице успешно заполнены.',
            askFieldRepeat: (label) => `Пожалуйста, повторите ваш ответ для поля ${label}.`,
            askFieldExisting: (label, val) => `Следующее поле — ${label}. Текущее значение: ${val}. Хотите изменить? Назовите новое значение или скажите да, чтобы оставить.`,
            askFieldSelect: (label, required) => `Следующее поле — ${label}. ${required ? 'Оно обязательно для заполнения.' : ''} Какой вариант вы хотите выбрать?`,
            askFieldDefault: (label, required) => `Следующее поле — ${label}. ${required ? 'Оно обязательно для заполнения.' : ''} Что сюда вписать?`,

            confirmField: (label, val) => `Для поля ${label}: ${val}. Всё верно? Скажите да или назовите исправление.`,
            fieldRecorded: (label) => `Понял, значение для ${label} записано.`,
            askCorrection: (label) => `Пожалуйста, назовите исправление. Какое значение должно быть в ${label}?`,
            confirmCorrection: (corrected) => `Обновленное значение: ${corrected}. Теперь правильно?`,
            clarifyValue: (label) => `Пожалуйста, четко назовите полное значение для ${label}.`,
            fieldSkipped: (label) => `Хорошо, пропускаем ${label || 'это поле'}.`,
            reaskPrompt: (label) => `Пожалуйста, повторите ваш ответ для ${label}.`
        },

        prompts: {
            intentClassifierSystem:
                'Вы — ассистент классификации намерений.\n' +
                'Пользователя спросили, верно ли распознано значение для поля формы.\n\n' +
                'Правила:\n' +
                '1. Если пользователь подтверждает ("да", "верно", "правильно", "хорошо", "дальше", "так и есть") → Ответьте ТОЛЬКО "CONFIRM".\n' +
                '2. Если отрицает, указывает на ошибку или исправляет ("нет", "неверно", "ошибка", "измени", "на самом деле...") → Ответьте ТОЛЬКО "CORRECT".\n\n' +
                'Ответьте ровно ОДНИМ словом: CONFIRM или CORRECT.',

            intentClassifierUser: (reply) => `Ответ пользователя: "${reply}"\nРешение:`,

            extractorSystem:
                `Вы — Ассистент Извлечения Данных Форм.
Извлеките ИСКЛЮЧИТЕЛЬНО чистое целевое значение без разговорных вводных фраз.`,

            extractorUser: (fieldLabel, cleanSpoken) => `Поле: ${fieldLabel}\nСказано: "${cleanSpoken}"\nЧистое Значение:`,

            correctorSystem:
                `Вы — эксперт по исправлению значений полей форм.
Примените инструкцию по исправлению к предыдущему значению и верните ТОЛЬКО финальное чистое значение.`,

            correctorUser: (fieldLabel, cleanOriginal, cleanInstruction) =>
                `Поле: ${fieldLabel}\nПредыдущее: ${cleanOriginal}\nИнструкция: "${cleanInstruction}"\nНовое Значение:`
        },

        heuristics: {
            negationWords: [
                'нет', 'не', 'неверно', 'неправильно', 'ошибка', 'измени', 'исправь', 'поменяй', 'не то'
            ],
            confirmWords: [
                'да', 'верно', 'правильно', 'хорошо', 'точно', 'дальше', 'подтверждаю', 'все так', 'ок', 'ладно'
            ],
            skipPhrases: [
                'пропустить', 'пропусти', 'следующее поле', 'дальше без него', 'оставь'
            ],
            pureRejectionWords: [
                'нет', 'неверно', 'неправильно', 'не то'
            ]
        }
    };

    if (typeof window !== 'undefined') {
        window.__LOCALES__ = window.__LOCALES__ || {};
        window.__LOCALES__['ru-RU'] = ru;
        window.__LOCALES__['ru'] = ru;
    }
})();
