/**
 * uk.js - Ukrainian Localization Resource (uk-UA)
 */

(function () {
    const uk = {
        code: 'uk-UA',
        name: 'Українська (Україна)',
        speechLang: 'uk-UA',

        labels: {
            brandTitle: 'ГОЛОСОВИЙ АСИСТЕНТ ФОРМ • NEMOTRON & GEMMA',
            appTitle: 'Signal — Голосовий Помічник для Веб-Форм',
            tagline: 'Автоматично скануйте та заповнюйте веб-форми своїм голосом',

            orchestratorTitle: 'Сервіси Бекенду (Оркестратор)',
            companionOffline: 'Companion Не в мережі',
            companionConnected: 'Companion У мережі',
            btnStartServices: 'Запустити Сервіси',
            btnStopServices: 'Зупинити',
            btnCheckAssets: 'Перевірити Файли',
            btnLaunchCompanion: '⚡ Запустити Оркестратор Companion',
            orchestratorNotice: 'Якщо це перший запуск, переконайтеся, що виконано <kbd>register_protocol.bat</kbd> (або <kbd>register_protocol.sh</kbd>).',

            svsAsrName: 'Nemotron ASR',
            svsTtsName: 'Piper TTS',
            svsLlmName: 'Gemma 4 LLM',

            statusIdle: 'очікування',
            micPermLink: 'Доступ до Мікрофона',
            interruptBtn: '🔇 Заглушити TTS',

            btnScanPage: 'Сканувати Форму',
            btnStartFormFlow: 'Заповнити Голосом',
            btnStopFormFlow: 'Завершити Сесію',

            pageLabel: 'Сторінка:',
            fieldCountBadge: '{count} полів',
            allFieldsComplete: 'Усі поля заповнено!',

            micMutedBadge: '🔇 мікрофон вимкнено — асистент говорить',

            spotlightStep: 'Поле {current} / {total}',
            spotlightRequired: '*Обов\'язкове',
            spotlightPhaseAsking: 'Запитую…',
            spotlightPhaseListening: 'Слухаю…',
            spotlightPhaseConfirming: 'Підтвердження…',
            spotlightPhaseEvaluating: 'Перевірка…',
            spotlightPhaseConfirmed: '✓ Підтверджено',
            spotlightPromptListening: 'Слухаю: назвіть вашу відповідь…',
            spotlightValLabel: 'Розпізнане Значення:',
            spotlightNoValYet: 'Відповіді ще немає',

            btnPrevField: '⏮️ Назад',
            btnReaskField: '🔄 Повторити',
            btnSkipField: '⏭️ Пропустити',

            transcriptLabel: '🎙️ Жива Стенограма Голосу (Потоковий STT)',
            transcriptIdle: 'Натисніть "Заповнити Голосом", щоб розпочати…',
            transcriptListeningPrompt: 'Назвіть відповідь для поля {label}…',
            transcriptConfirmPrompt: 'Скажіть "так" або назвіть виправлення…',

            scannedFieldsTitle: '📋 Знайдені Поля (<b id="scannedFieldsCount">{count}</b>)',
            accordionHint: 'Натисніть для переходу',

            tuningTitle: '⚙️ Налаштування та Калібрування',
            settingWsUrl: 'WebSocket URL',
            settingThreshold: 'Поріг Голосу Silero',
            settingSilence: 'Тиша перед фіксацією',
            settingMaxTurn: 'Максимальний час висловлювання',
            settingPadding: 'Pre-roll Padding',
            settingLlmUrl: 'URL Проксі-Сервера LLM',
            settingDebounce: 'Затримка Підтвердження',

            noFieldsFound: 'На цій сторінці не знайдено полів для заповнення.',
            fieldsScannedSuccess: 'Успішно відскановано {count} полів!',
            fieldsScannedBadge: 'Знайдено {count} полів',
            fieldsZeroBadge: '0 полів знайдено',
            scanningBadge: 'Сканування…',
            scanFailedBadge: 'Помилка сканування',
            invalidPageBadge: 'Некоректна сторінка',
            tabNotFoundBadge: 'Вкладку не знайдено',
            activeTabNotFoundToast: 'Активну вкладку не знайдено',
            cannotScanInternalToast: 'Неможливо сканувати системні сторінки браузера',
            unableToScanToast: 'Не вдалося просканувати форму',
            firstFieldToast: 'Це перше поле',
            sessionStoppedToast: 'Заповнення форми зупинено',
            sessionEndedToast: 'Сесію завершено',
            connectionClosed: 'З\'єднання закрито',
            transcriptListening: 'Слухаю…',
            pleaseWaitToast: 'Зачекайте, будь ласка…',
            checkingConfirmation: 'Перевірка підтвердження…',
            wsConnectFailed: 'Не вдалося підключитися до WebSocket',
            micPermTabOpened: 'Відкрито вкладку дозволів — натисніть "Дозволити"',
            micAccessDenied: 'Доступ до мікрофона відхилено: ',
            asrError: 'Помилка ASR: ',
            servicesStartingToast: 'Запуск сервісів…',
            servicesStartedToast: 'Сервіси запущені',
            servicesStartFailedToast: 'Помилка запуску: ',
            servicesStoppedToast: 'Сервіси зупинено',
            servicesStopFailedToast: 'Помилка зупинки: ',
            modelsAllPresentToast: 'Усі моделі доступні ✓',
            modelsMissingToast: 'Деякі моделі відсутні',
            checkFailedToast: 'Помилка перевірки: ',
            companionStartingToast: 'Запуск companion…',
            companionOnlineToast: 'Companion у мережі ✓',
            companionFailedToast: 'Не запустився? Виконайте register_protocol',
            companionStartingBtn: '⏳ Запуск…',
            companionReadyBtn: '⚡ Запустити Оркестратор Companion',
            ttsInterrupted: 'TTS перервано',
            ttsError: 'Помилка TTS: ',

            launchPageTitle: 'Запуск Оркестратора Companion - Голосовий Помічник',
            launchTitle: 'Запуск Оркестратора Companion...',
            launchDesc: 'Якщо браузер запитає дозвіл на <b>"Відкрити Companion Orchestrator"</b>, оберіть <b>"Відкрити"</b>.',
            launchStatusWaiting: '⏳ Очікування з\'єднання із сервером companion…',
            launchManualBtn: '🚀 Натисніть тут, якщо вікно не відкрилося автоматично',
            launchHint: 'Переконайтеся, що файл <kbd>register_protocol.bat</kbd> (або <kbd>register_protocol.sh</kbd>) був виконаний.',
            launchSuccessTitle: 'Companion успішно запущено!',
            launchSuccessDesc: 'Сервер companion у мережі. Вкладка закриється автоматично…',
            launchSuccessStatus: '✓ Companion У мережі: http://127.0.0.1:8000',
            launchFailStatus: 'Не вдалося підключитися. Запустіть start_companion.',

            // Restart Confirmation Modal Strings
            restartModalTitle: 'Перезапустити сервер Companion?',
            restartModalDesc: 'Зміна мови на {name} потребує перезапуску сервера Companion з новими мовними параметрами. Поточні процеси будуть зупинені, і відкриється нове вікно командного рядка.',
            btnRestartCancel: 'Скасувати',
            btnRestartConfirm: 'Перезапустити сервер',
            restartingToast: 'Перезапуск сервера Companion мовою {name}...'
        },

        dictation: {
            sessionFinished: 'Чудово! Усі поля на цій сторінці успішно заповнені.',
            askFieldRepeat: (label) => `Будь ласка, повторіть вашу відповідь для поля ${label}.`,
            askFieldExisting: (label, val) => `Наступне поле — ${label}. Поточне значення: ${val}. Хочете змінити? Назвіть нове значення або скажіть так, щоб залишити.`,
            askFieldSelect: (label, required) => `Наступне поле — ${label}. ${required ? 'Це обов\'язкове поле.' : ''} Який варіант ви хочете обрати?`,
            askFieldDefault: (label, required) => `Наступне поле — ${label}. ${required ? 'Це обов\'язкове поле.' : ''} Що сюди записати?`,

            confirmField: (label, val) => `Для поля ${label}: ${val}. Усе вірно? Скажіть так або вкажіть, що змінити.`,
            fieldRecorded: (label) => `Зрозумів, значення для ${label} записано.`,
            askCorrection: (label) => `Будь ласка, назвіть виправлення. Що потрібно записати в ${label}?`,
            confirmCorrection: (corrected) => `Оновлене значення: ${corrected}. Тепер правильно?`,
            clarifyValue: (label) => `Будь ласка, чітко назвіть повне значення для ${label}.`,
            fieldSkipped: (label) => `Добре, пропускаємо ${label || 'це поле'}.`,
            reaskPrompt: (label) => `Будь ласка, повторіть вашу відповідь для ${label}.`
        },

        prompts: {
            intentClassifierSystem:
                'Ви — асистент класифікації намірів.\n' +
                'Користувача запитали, чи правильно розпізнано значення для поля форми.\n\n' +
                'Правила:\n' +
                '1. Якщо користувач підтверджує ("так", "вірно", "правильно", "добре", "далі", "все так") → Відповідайте ТІЛЬКИ "CONFIRM".\n' +
                '2. Якщо заперечує або виправляє ("ні", "неправильно", "помилка", "зміни", "насправді...") → Відповідайте ТІЛЬКИ "CORRECT".\n\n' +
                'Відповідайте рівно ОДНИМ словом: CONFIRM або CORRECT.',

            intentClassifierUser: (reply) => `Відповідь користувача: "${reply}"\nРішення:`,

            extractorSystem:
                `Ви — Асистент Вилучення Даних Форм.
Вилучіть ВИКЛЮЧНО чисте цільове значення без зайвих вступних слів.`,

            extractorUser: (fieldLabel, cleanSpoken) => `Поле: ${fieldLabel}\nСказано: "${cleanSpoken}"\nЧисте Значення:`,

            correctorSystem:
                `Ви — експерт із виправлення даних форм.
Застосуйте інструкцію виправлення до попереднього значення та поверніть ЛИШЕ фінальне чисте значення.`,

            correctorUser: (fieldLabel, cleanOriginal, cleanInstruction) =>
                `Поле: ${fieldLabel}\nПопереднє: ${cleanOriginal}\nІнструкція: "${cleanInstruction}"\nНове Значення:`
        },

        heuristics: {
            negationWords: [
                'ні', 'не', 'неправильно', 'невірно', 'помилка', 'зміни', 'виправ', 'поміняй', 'не те'
            ],
            confirmWords: [
                'так', 'вірно', 'правильно', 'добре', 'точно', 'далі', 'підтверджую', 'гаразд', 'ок', 'чудово'
            ],
            skipPhrases: [
                'пропустити', 'пропусти', 'наступне поле', 'проїхали', 'залиш'
            ],
            pureRejectionWords: [
                'ні', 'неправильно', 'не те', 'не так'
            ]
        }
    };

    if (typeof window !== 'undefined') {
        window.__LOCALES__ = window.__LOCALES__ || {};
        window.__LOCALES__['uk-UA'] = uk;
        window.__LOCALES__['uk'] = uk;
    }
})();
