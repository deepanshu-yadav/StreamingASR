/**
 * tr.js - Turkish Localization Resource (tr-TR)
 */

(function () {
    const tr = {
        code: 'tr-TR',
        name: 'Türkçe (Türkiye)',
        speechLang: 'tr-TR',

        labels: {
            brandTitle: 'SESLİ FORM ASİSTANI • NEMOTRON & GEMMA',
            appTitle: 'Signal — Sesli Form Asistanı',
            tagline: 'Web formlarını sesinizle otomatik olarak tarayın ve doldurun',

            orchestratorTitle: 'Arka Plan Servisleri (Orchestrator)',
            companionOffline: 'Companion Çevrimdışı',
            companionConnected: 'Companion Çevrimiçi',
            btnStartServices: 'Servisleri Başlat',
            btnStopServices: 'Durdur',
            btnCheckAssets: 'Dosyaları Kontrol Et',
            btnLaunchCompanion: '⚡ Companion Orchestrator\'ı Başlat',
            orchestratorNotice: 'İlk kez çalıştırıyorsanız <kbd>register_protocol.bat</kbd> (veya <kbd>register_protocol.sh</kbd>) dosyasının çalıştırıldığından emin olun.',

            svsAsrName: 'Nemotron ASR',
            svsTtsName: 'Piper TTS',
            svsLlmName: 'Gemma 4 LLM',

            statusIdle: 'boşta',
            micPermLink: 'Mikrofon İzni',
            interruptBtn: '🔇 TTS Sustur',

            btnScanPage: 'Formu Tara',
            btnStartFormFlow: 'Sesle Doldur',
            btnStopFormFlow: 'Oturumu Bitir',

            pageLabel: 'Sayfa:',
            fieldCountBadge: '{count} alan',
            allFieldsComplete: 'Tüm alanlar tamamlandı!',

            micMutedBadge: '🔇 mikrofon sessizde — asistan konuşuyor',

            spotlightStep: 'Alan {current} / {total}',
            spotlightRequired: '*Zorunlu',
            spotlightPhaseAsking: 'Soruluyor…',
            spotlightPhaseListening: 'Dinleniyor…',
            spotlightPhaseConfirming: 'Onaylanıyor…',
            spotlightPhaseEvaluating: 'Kontrol ediliyor…',
            spotlightPhaseConfirmed: '✓ Doğrulandı',
            spotlightPromptListening: 'Dinleniyor: lütfen cevabınızı söyleyin…',
            spotlightValLabel: 'Yakalanan Değer:',
            spotlightNoValYet: 'Henüz cevap yok',

            btnPrevField: '⏮️ Önceki',
            btnReaskField: '🔄 Tekrar Sor',
            btnSkipField: '⏭️ Atla',

            transcriptLabel: '🎙️ Canlı Ses Dökümü (Akış STT)',
            transcriptIdle: 'Başlamak için "Sesle Doldur"a tıklayın…',
            transcriptListeningPrompt: '{label} için cevabınızı söyleyin…',
            transcriptConfirmPrompt: 'Evet deyin veya düzeltmeyi belirtin…',

            scannedFieldsTitle: '📋 Taranan Alanlar (<b id="scannedFieldsCount">{count}</b>)',
            accordionHint: 'Amana gitmek için tıklayın',

            tuningTitle: '⚙️ Ayarlar & Yapılandırma',
            settingWsUrl: 'WebSocket URL',
            settingThreshold: 'Silero Konuşma Eşiği',
            settingSilence: 'Tamamlanma Öncesi Sessizlik',
            settingMaxTurn: 'Maksimum Konuşma Süresi',
            settingPadding: 'Ön Kayıt Boşluğu (Padding)',
            settingLlmUrl: 'LLM Proxy Sunucu URL',
            settingDebounce: 'Onay Gecikmesi',

            noFieldsFound: 'Bu sayfada doldurulabilir alan bulunamadı.',
            fieldsScannedSuccess: '{count} alan başarıyla tarandı!',
            fieldsScannedBadge: '{count} alan bulundu',
            fieldsZeroBadge: '0 alan bulundu',
            scanningBadge: 'Taranıyor…',
            scanFailedBadge: 'Tarama başarısız',
            invalidPageBadge: 'Geçersiz sayfa',
            tabNotFoundBadge: 'Sekme bulunamadı',
            activeTabNotFoundToast: 'Aktif sekme bulunamadı',
            cannotScanInternalToast: 'Tarayıcının dahili sayfaları taranamıyor',
            unableToScanToast: 'Form taranamadı',
            firstFieldToast: 'Bu ilk alan',
            sessionStoppedToast: 'Form doldurma durduruldu',
            sessionEndedToast: 'Oturum sonlandırıldı',
            connectionClosed: 'Bağlantı kapandı',
            transcriptListening: 'Dinleniyor…',
            pleaseWaitToast: 'Lütfen bekleyin, işleniyor…',
            checkingConfirmation: 'Onay kontrol ediliyor…',
            wsConnectFailed: 'WebSocket bağlantısı kurulamadı',
            micPermTabOpened: 'İzin sekmesi açıldı — lütfen "İzin Ver"e tıklayın',
            micAccessDenied: 'Mikrofon erişimi reddedildi: ',
            asrError: 'ASR hatası: ',
            servicesStartingToast: 'Servisler başlatılıyor…',
            servicesStartedToast: 'Servisler başlatıldı',
            servicesStartFailedToast: 'Başlatma başarısız: ',
            servicesStoppedToast: 'Servisler durduruldu',
            servicesStopFailedToast: 'Durdurma başarısız: ',
            modelsAllPresentToast: 'Tüm modeller mevcut ✓',
            modelsMissingToast: 'Bazı modeller eksik',
            checkFailedToast: 'Kontrol başarısız: ',
            companionStartingToast: 'Companion başlatılıyor…',
            companionOnlineToast: 'Companion çevrimiçi ✓',
            companionFailedToast: 'Companion başlamadı mı? register_protocol dosyasını çalıştırın',
            companionStartingBtn: '⏳ Başlatılıyor…',
            companionReadyBtn: '⚡ Companion Orchestrator\'ı Başlat',
            ttsInterrupted: 'TTS kesildi',
            ttsError: 'TTS hatası: ',

            launchPageTitle: 'Companion Orchestrator Başlatılıyor - Sesli Asistan',
            launchTitle: 'Companion Orchestrator Başlatılıyor...',
            launchDesc: 'Tarayıcı <b>"Companion Orchestrator açılsın mı?"</b> diye sorarsa lütfen <b>"Aç"</b>ı seçin.',
            launchStatusWaiting: '⏳ Companion sunucusu ile bağlantı bekleniyor…',
            launchManualBtn: '🚀 Otomatik açılmazsa buraya tıklayın',
            launchHint: 'Hiçbir şey olmazsa <kbd>register_protocol.bat</kbd> (veya <kbd>register_protocol.sh</kbd>) dosyasını çalıştırın.',
            launchSuccessTitle: 'Companion başarıyla başlatıldı!',
            launchSuccessDesc: 'Sunucu çevrimiçi. Bu sekme kapanacaktır…',
            launchSuccessStatus: '✓ Companion Çevrimiçi: http://127.0.0.1:8000',
            launchFailStatus: 'Companion\'a bağlanılamadı. Lütfen start_companion çalıştırın.',

            // Restart Confirmation Modal Strings
            restartModalTitle: 'Companion Sunucusu Yeniden Başlatılsın mı?',
            restartModalDesc: 'Dili {name} olarak değiştirmek, Companion Sunucusunun yeni dil ayarıyla yeniden başlatılmasını gerektirir. Mevcut işlemler durdurulacak ve yeni bir komut istemi penceresi açılacaktır.',
            btnRestartCancel: 'İptal',
            btnRestartConfirm: 'Sunucuyu Yeniden Başlat',
            restartingToast: 'Companion Sunucusu {name} dilinde yeniden başlatılıyor...'
        },

        dictation: {
            sessionFinished: 'Harika! Bu sayfadaki tüm alanlar tamamlandı.',
            askFieldRepeat: (label) => `Lütfen ${label} için cevabınızı tekrarlayın.`,
            askFieldExisting: (label, val) => `Sıradaki alan ${label}. Mevcut değer: ${val}. Değiştirmek ister misiniz? Yeni bir değer söyleyin ya da tutmak için evet deyin.`,
            askFieldSelect: (label, required) => `Sıradaki alan ${label}. ${required ? 'Bu alan zorunludur.' : ''} Hangi seçeneği seçmek istersiniz?`,
            askFieldDefault: (label, required) => `Sıradaki alan ${label}. ${required ? 'Bu alan zorunludur.' : ''} Buraya ne yazmamı istersiniz?`,

            confirmField: (label, val) => `${label} için: ${val}. Doğru mu? Evet deyin ya da neyi değiştirmemi istediğinizi söyleyin.`,
            fieldRecorded: (label) => `Anlaşıldı, ${label} kaydedildi.`,
            askCorrection: (label) => `Lütfen düzeltmeyi söyleyin. ${label} alanına ne yazılmalı?`,
            confirmCorrection: (corrected) => `Güncellenen değer: ${corrected}. Şimdi doğru mu?`,
            clarifyValue: (label) => `Lütfen ${label} için tam değeri net bir şekilde söyleyin.`,
            fieldSkipped: (label) => `Tamam, ${label || 'bu alanı'} atladık.`,
            reaskPrompt: (label) => `Lütfen ${label} için cevabınızı tekrarlayın.`
        },

        prompts: {
            intentClassifierSystem:
                'Sen bir niyet sınıflandırma asistanısın.\n' +
                'Kullanıcıya girilen form alanı değerinin doğru olup olmadığı soruldu.\n\n' +
                'Kurallar:\n' +
                '1. Kullanıcı onaylarsa ("evet", "doğru", "tamam", "uygun", "devam", "olur") → YALNIZCA "CONFIRM" çıktısı ver.\n' +
                '2. Kullanıcı reddeder veya düzeltme yaparsa ("hayır", "yanlış", "değiştir", "öyle değil", "aslında...") → YALNIZCA "CORRECT" çıktısı ver.\n\n' +
                'Yalnızca TEK bir kelimeyle yanıtla: CONFIRM veya CORRECT.',

            intentClassifierUser: (reply) => `Kullanıcı yanıtı: "${reply}"\nKarar:`,

            extractorSystem:
                `Form Alanı Veri Çıkarma Asistanısın.
Kullanıcının konuşmasından gereksiz konuşma kalıplarını temizle ve YALNIZCA temiz değeri döndür.`,

            extractorUser: (fieldLabel, cleanSpoken) => `Alan: ${fieldLabel}\nKonuşulan: "${cleanSpoken}"\nTemiz Değer:`,

            correctorSystem:
                `Form alanı düzeltme uzmanısın.
Düzeltme talimatını önceki değere uygula ve YALNIZCA nihai temiz değeri döndür.`,

            correctorUser: (fieldLabel, cleanOriginal, cleanInstruction) =>
                `Alan: ${fieldLabel}\nÖnceki Değer: ${cleanOriginal}\nTalimat: "${cleanInstruction}"\nYeni Değer:`
        },

        heuristics: {
            negationWords: [
                'hayır', 'hayir', 'yanlış', 'yanlis', 'değiştir', 'degistir', 'düzelt', 'hata', 'yok', 'olmadı'
            ],
            confirmWords: [
                'evet', 'doğru', 'dogru', 'tamam', 'olur', 'devam', 'onay', 'aynen', 'peki', 'iyi'
            ],
            skipPhrases: [
                'atla', 'geç', 'gec', 'boş ver', 'bosver', 'sonraki alan', 'bırak'
            ],
            pureRejectionWords: [
                'hayır', 'hayir', 'yanlış', 'olmaz', 'değil'
            ]
        }
    };

    if (typeof window !== 'undefined') {
        window.__LOCALES__ = window.__LOCALES__ || {};
        window.__LOCALES__['tr-TR'] = tr;
        window.__LOCALES__['tr'] = tr;
    }
})();
