/**
 * ar.js - Arabic Localization Resource (ar-AR)
 */

(function () {
    const ar = {
        code: 'ar-AR',
        name: 'العربية (Arabic)',
        speechLang: 'ar-AR',

        labels: {
            brandTitle: 'المساعد الصوتي لتعبئة النماذج • NEMOTRON & GEMMA',
            appTitle: 'Signal — المساعد الصوتي للنماذج',
            tagline: 'مسح وتعبئة نماذج الويب تلقائياً باستخدام صوتك',

            orchestratorTitle: 'الخدمات الخلفية (Orchestrator)',
            companionOffline: 'المنسق غير متصل',
            companionConnected: 'المنسق متصل',
            btnStartServices: 'بدء الخدمات',
            btnStopServices: 'إيقاف',
            btnCheckAssets: 'فحص الملفات',
            btnLaunchCompanion: '⚡ تشغيل المنسق Companion',
            orchestratorNotice: 'إذا كانت هذه أول مرة، تأكد من تشغيل <kbd>register_protocol.bat</kbd> (أو <kbd>register_protocol.sh</kbd>).',

            svsAsrName: 'Nemotron ASR',
            svsTtsName: 'Piper TTS',
            svsLlmName: 'Gemma 4 LLM',

            statusIdle: 'خامل',
            micPermLink: 'إذن الميكروفون',
            interruptBtn: '🔇 كتم الصوت',

            btnScanPage: 'مسح النموذج',
            btnStartFormFlow: 'ملء بالصوت',
            btnStopFormFlow: 'إنهاء الجلسة',

            pageLabel: 'الصفحة:',
            fieldCountBadge: '{count} حقول',
            allFieldsComplete: 'تم ملء جميع الحقول!',

            micMutedBadge: '🔇 الميكروفون مكتوم — المساعد يتحدث',

            spotlightStep: 'الحقل {current} / {total}',
            spotlightRequired: '*مطلوب',
            spotlightPhaseAsking: 'جاري السؤال…',
            spotlightPhaseListening: 'جاري الاستماع…',
            spotlightPhaseConfirming: 'جاري التأكيد…',
            spotlightPhaseEvaluating: 'جاري التحقق…',
            spotlightPhaseConfirmed: '✓ تم التحقق',
            spotlightPromptListening: 'استماع: تفضل بذكر إجابتك…',
            spotlightValLabel: 'القيمة المسجلة:',
            spotlightNoValYet: 'لا توجد إجابة بعد',

            btnPrevField: '⏮️ السابق',
            btnReaskField: '🔄 إعادة السؤال',
            btnSkipField: '⏭️ تخطي',

            transcriptLabel: '🎙️ تحويل الكلام المباشر (STT المتدفق)',
            transcriptIdle: 'انقر على "ملء بالصوت" للبدء…',
            transcriptListeningPrompt: 'تحدث بالإجابة للحقل {label}…',
            transcriptConfirmPrompt: 'قل نعم أو حدد التصحيح…',

            scannedFieldsTitle: '📋 الحقول الممسوحة (<b id="scannedFieldsCount">{count}</b>)',
            accordionHint: 'انقر للانتقال للحقل',

            tuningTitle: '⚙️ الإعدادات والضبط',
            settingWsUrl: 'عنوان WebSocket',
            settingThreshold: 'عتبة الصوت Silero',
            settingSilence: 'مدة الصمت قبل الحفظ',
            settingMaxTurn: 'الحد الأقصى للكلام',
            settingPadding: 'هامش التسجيل (Padding)',
            settingLlmUrl: 'عنوان خادم LLM Proxy',
            settingDebounce: 'مهلة تأكيد الإدخال',

            noFieldsFound: 'لم يتم العثور على حقول قابلة للملء في هذه الصفحة.',
            fieldsScannedSuccess: 'تم مسح {count} حقول بنجاح!',
            fieldsScannedBadge: 'تم العثور على {count} حقول',
            fieldsZeroBadge: 'لم يتم العثور على حقول',
            scanningBadge: 'جاري المسح…',
            scanFailedBadge: 'فشل المسح',
            invalidPageBadge: 'صفحة غير صالحة',
            tabNotFoundBadge: 'علامة التبويب غير موجودة',
            activeTabNotFoundToast: 'علامة التبويب النشطة غير موجودة',
            cannotScanInternalToast: 'لا يمكن مسح صفحات المتصفح الداخلية',
            unableToScanToast: 'تعذر مسح النموذج',
            firstFieldToast: 'هذا هو الحقل الأول',
            sessionStoppedToast: 'تم إيقاف جلسة الملء',
            sessionEndedToast: 'انتهت الجلسة',
            connectionClosed: 'تم إغلاق الاتصال',
            transcriptListening: 'جاري الاستماع…',
            pleaseWaitToast: 'يرجى الانتظار، جاري المعالجة…',
            checkingConfirmation: 'جاري فحص التأكيد…',
            wsConnectFailed: 'تعذر الاتصال بـ WebSocket',
            micPermTabOpened: 'تم فتح نافذة الإذن — يرجى النقر على "سماح"',
            micAccessDenied: 'تم رفض إذن الميكروفون: ',
            asrError: 'خطأ ASR: ',
            servicesStartingToast: 'جاري بدء الخدمات…',
            servicesStartedToast: 'تم تشغيل الخدمات',
            servicesStartFailedToast: 'فشل البدء: ',
            servicesStoppedToast: 'تم إيقاف الخدمات',
            servicesStopFailedToast: 'فشل الإيقاف: ',
            modelsAllPresentToast: 'جميع النماذج متوفرة ✓',
            modelsMissingToast: 'بعض النماذج مفقودة',
            checkFailedToast: 'فشل الفحص: ',
            companionStartingToast: 'جاري تشغيل المنسق…',
            companionOnlineToast: 'المنسق متصل بالإنترنت ✓',
            companionFailedToast: 'لم يبدأ المنسق؟ قم بتشغيل register_protocol',
            companionStartingBtn: '⏳ جاري التشغيل…',
            companionReadyBtn: '⚡ تشغيل المنسق Companion',
            ttsInterrupted: 'تمت مقاطعة الصوت',
            ttsError: 'خطأ الصوت: ',

            launchPageTitle: 'تشغيل المنسق Companion - المساعد الصوتي',
            launchTitle: 'جاري تشغيل المنسق Companion...',
            launchDesc: 'إذا سأل المتصفح عن <b>"فتح Companion Orchestrator"</b>، يرجى اختيار <b>"فتح"</b>.',
            launchStatusWaiting: '⏳ في انتظار الاتصال بخادم المنسق…',
            launchManualBtn: '🚀 انقر هنا إذا لم يفتح تلقائياً',
            launchHint: 'تأكد من تشغيل ملف <kbd>register_protocol.bat</kbd> (أو <kbd>register_protocol.sh</kbd>).',
            launchSuccessTitle: 'تم تشغيل المنسق بنجاح!',
            launchSuccessDesc: 'خادم المنسق متصل. سيتم إغلاق هذه الصفحة…',
            launchSuccessStatus: '✓ المنسق متصل على http://127.0.0.1:8000',
            launchFailStatus: 'تعذر الاتصال بالمنسق. يرجى تشغيل start_companion.',

            // Restart Confirmation Modal Strings
            restartModalTitle: 'هل تريد إعادة تشغيل خادم المنسق؟',
            restartModalDesc: 'تغيير اللغة إلى {name} يتطلب إعادة تشغيل خادم المنسق بالإعدادات اللغوية الجديدة. سيتم إيقاف العمليات الحالية وفتح نافذة موجه أوامر جديدة.',
            btnRestartCancel: 'إلغاء',
            btnRestartConfirm: 'إعادة تشغيل الخادم',
            restartingToast: 'جارٍ إعادة تشغيل خادم المنسق باللغة {name}...'
        },

        dictation: {
            sessionFinished: 'رائع جداً! تم إكمال جميع الحقول في هذه الصفحة.',
            askFieldRepeat: (label) => `يرجى إعادة إجابتك للحقل ${label}.`,
            askFieldExisting: (label, val) => `الحقل التالي هو ${label}. القيمة الحالية هي ${val}. هل ترغب في تغييرها؟ اذكر قيمة جديدة أو قل نعم للإبقاء عليها.`,
            askFieldSelect: (label, required) => `الحقل التالي هو ${label}. ${required ? 'هذا الحقل مطلوب.' : ''} ما هو الخيار الذي ترغب باختياره؟`,
            askFieldDefault: (label, required) => `الحقل التالي هو ${label}. ${required ? 'هذا الحقل مطلوب.' : ''} ماذا تريد أن أكتب هنا؟`,

            confirmField: (label, val) => `بالنسبة لـ ${label}: ${val}. هل هذا صحيح؟ قل نعم أو أخبرني بما تريد تعديله.`,
            fieldRecorded: (label) => `تم الحفظ، تم تسجيل قيمة ${label}.`,
            askCorrection: (label) => `تفضل بذكر التصحيح. ما القيمة الصحيحة للحقل ${label}؟`,
            confirmCorrection: (corrected) => `القيمة المحدثة: ${corrected}. هل هي صحيحة الآن؟`,
            clarifyValue: (label) => `يرجى نطق القيمة الكاملة بوضوح للحقل ${label}.`,
            fieldSkipped: (label) => `حسناً، تم تخطي ${label || 'هذا الحقل'}.`,
            reaskPrompt: (label) => `يرجى إعادة إجابتك للحقل ${label}.`
        },

        prompts: {
            intentClassifierSystem:
                'أنت مساعد لتصنيف النوايا.\n' +
                'سُئل المستخدم عما إذا كانت القيمة المسجلة لحقل النموذج صحيحة.\n\n' +
                'القواعد:\n' +
                '1. إذا أكد المستخدم ("نعم", "صحيح", "تمام", "موافق", "مضبوط", "تابع") ← أجب فقط بكلمة "CONFIRM".\n' +
                '2. إذا نفى المستخدم أو ذكر تصحيحاً ("لا", "خطأ", "غير صحيح", "عدل", "غيره", "في الواقع...") ← أجب فقط بكلمة "CORRECT".\n\n' +
                'أجب بكلمة واحدة فقط: CONFIRM أو CORRECT.',

            intentClassifierUser: (reply) => `رد المستخدم: "${reply}"\nالقرار:`,

            extractorSystem:
                `أنت مساعد استخراج بيانات النماذج.
استخرج فقط القيمة النظيفة المقصودة دون العبارات الحوارية.`,

            extractorUser: (fieldLabel, cleanSpoken) => `الحقل: ${fieldLabel}\nالكلام المنطوق: "${cleanSpoken}"\nالقيمة النظيفة:`,

            correctorSystem:
                `أنت مساعد خبير في تصحيح بيانات الحقول.
طبق تعليمات التصحيح على القيمة السابقة وأخرج فقط القيمة النهائية النظيفة.`,

            correctorUser: (fieldLabel, cleanOriginal, cleanInstruction) =>
                `الحقل: ${fieldLabel}\nالقيمة السابقة: ${cleanOriginal}\nتعليمات التصحيح: "${cleanInstruction}"\nالقيمة الجديدة:`
        },

        heuristics: {
            negationWords: [
                'لا', 'كلا', 'غلط', 'خطأ', 'عدل', 'غير', 'بدل', 'تصحيح', 'ليس'
            ],
            confirmWords: [
                'نعم', 'ايوه', 'اي', 'أجل', 'صحيح', 'مضبوط', 'تمام', 'أكيد', 'موافق', 'تابع', 'حسنا'
            ],
            skipPhrases: [
                'تخطي', 'تجاوز', 'الحقل التالي', 'اتركه', 'تخطى'
            ],
            pureRejectionWords: [
                'لا', 'كلا', 'خطأ', 'غلط', 'مو كذا'
            ]
        }
    };

    if (typeof window !== 'undefined') {
        window.__LOCALES__ = window.__LOCALES__ || {};
        window.__LOCALES__['ar-AR'] = ar;
        window.__LOCALES__['ar'] = ar;
    }
})();
