/**
 * ja.js - Japanese Localization Resource (ja-JP)
 */

(function () {
    const ja = {
        code: 'ja-JP',
        name: '日本語 (日本)',
        speechLang: 'ja-JP',

        labels: {
            brandTitle: '音声フォーム入力アシスタント • NEMOTRON & GEMMA',
            appTitle: 'Signal — 音声フォーム入力アシスタント',
            tagline: '声を使ってWebフォームを自動スキャン＆入力します',

            orchestratorTitle: 'バックエンドサービス (Orchestrator)',
            companionOffline: 'Companion オフライン',
            companionConnected: 'Companion オンライン',
            btnStartServices: 'サービス起動',
            btnStopServices: '停止',
            btnCheckAssets: 'ファイル確認',
            btnLaunchCompanion: '⚡ Companion Orchestrator 起動',
            orchestratorNotice: '初回の場合は <kbd>register_protocol.bat</kbd> (または <kbd>register_protocol.sh</kbd>) を実行してください。',

            svsAsrName: 'Nemotron ASR',
            svsTtsName: 'Piper TTS',
            svsLlmName: 'Gemma 4 LLM',

            statusIdle: '待機中',
            micPermLink: 'マイク権限',
            interruptBtn: '🔇 音声をミュート',

            btnScanPage: 'フォームスキャン',
            btnStartFormFlow: '音声で入力開始',
            btnStopFormFlow: 'セッション終了',

            pageLabel: 'ページ:',
            fieldCountBadge: '{count} 項目',
            allFieldsComplete: 'すべての項目の入力が完了しました！',

            micMutedBadge: '🔇 マイク消音中 — アシスタント発話中',

            spotlightStep: '項目 {current} / {total}',
            spotlightRequired: '*必須',
            spotlightPhaseAsking: '質問中…',
            spotlightPhaseListening: '聞き取り中…',
            spotlightPhaseConfirming: '確認中…',
            spotlightPhaseEvaluating: '検証中…',
            spotlightPhaseConfirmed: '✓ 確認済み',
            spotlightPromptListening: '聞き取り中: お答えをお話しください…',
            spotlightValLabel: '認識された値:',
            spotlightNoValYet: 'まだ入力がありません',

            btnPrevField: '⏮️ 前へ',
            btnReaskField: '🔄 もう一度聞く',
            btnSkipField: '⏭️ スキップ',

            transcriptLabel: '🎙️ リアルタイム音声文字起こし (Streaming STT)',
            transcriptIdle: '「音声で入力開始」をクリックしてスタート…',
            transcriptListeningPrompt: '{label} の内容をお話しください…',
            transcriptConfirmPrompt: '「はい」とお答えいただくか、修正内容をお話しください…',

            scannedFieldsTitle: '📋 検出された入力項目 (<b id="scannedFieldsCount">{count}</b>)',
            accordionHint: 'クリックして項目へジャンプ',

            tuningTitle: '⚙️ 設定とチューニング',
            settingWsUrl: 'WebSocket URL',
            settingThreshold: 'Silero 音声検出閾値',
            settingSilence: '発話確定までの無音時間',
            settingMaxTurn: '最大発話制限時間',
            settingPadding: 'プリロールパディング',
            settingLlmUrl: 'LLM プロキシサーバー URL',
            settingDebounce: '確認デバウンス時間',

            noFieldsFound: 'このページに入力可能なフォーム項目が見つかりませんでした。',
            fieldsScannedSuccess: '{count} 個の入力項目を検出しました！',
            fieldsScannedBadge: '{count} 項目検出',
            fieldsZeroBadge: '項目なし',
            scanningBadge: 'スキャン中…',
            scanFailedBadge: 'スキャン失敗',
            invalidPageBadge: '無効なページ',
            tabNotFoundBadge: 'タブが見つかりません',
            activeTabNotFoundToast: 'アクティブなタブが見つかりません',
            cannotScanInternalToast: 'ブラウザの内部ページはスキャンできません',
            unableToScanToast: 'フォームをスキャンできませんでした',
            firstFieldToast: '最初の項目です',
            sessionStoppedToast: 'フォーム入力を一時停止しました',
            sessionEndedToast: 'セッションが終了しました',
            connectionClosed: '接続が切断されました',
            transcriptListening: '聞き取り中…',
            pleaseWaitToast: '処理中です。少々お待ちください…',
            checkingConfirmation: '確認内容を検証中…',
            wsConnectFailed: 'WebSocket に接続できませんでした',
            micPermTabOpened: 'マイク権限タブを開きました — 「許可」をクリックしてください',
            micAccessDenied: 'マイクへのアクセスが拒否されました: ',
            asrError: 'ASR エラー: ',
            servicesStartingToast: 'サービスを起動しています…',
            servicesStartedToast: 'サービスが起動しました',
            servicesStartFailedToast: '起動に失敗しました: ',
            servicesStoppedToast: 'サービスを停止しました',
            servicesStopFailedToast: '停止に失敗しました: ',
            modelsAllPresentToast: 'すべてのモデルが利用可能です ✓',
            modelsMissingToast: '一部のモデルファイルが見つかりません',
            checkFailedToast: '確認に失敗しました: ',
            companionStartingToast: 'Companion を起動しています…',
            companionOnlineToast: 'Companion がオンラインになりました ✓',
            companionFailedToast: 'Companion が起動しませんでしたか？ register_protocol を実行してください',
            companionStartingBtn: '⏳ 起動中…',
            companionReadyBtn: '⚡ Companion Orchestrator 起動',
            ttsInterrupted: '音声再生を中断しました',
            ttsError: '音声再生エラー: ',

            launchPageTitle: 'Companion Orchestrator 起動中 - 音声アシスタント',
            launchTitle: 'Companion Orchestrator を起動しています...',
            launchDesc: 'ブラウザに <b>「Companion Orchestrator を開きますか？」</b> と表示されたら、<b>「開く」</b> を選択してください。',
            launchStatusWaiting: '⏳ Companion サーバーとの接続を待機中…',
            launchManualBtn: '🚀 自動的に開かない場合はここをクリック',
            launchHint: '反応がない場合は <kbd>register_protocol.bat</kbd> (または <kbd>register_protocol.sh</kbd>) を実行してください。',
            launchSuccessTitle: 'Companion が正常に起動しました！',
            launchSuccessDesc: 'サーバーがオンラインになりました。このタブは自動的に閉じます…',
            launchSuccessStatus: '✓ Companion オンライン: http://127.0.0.1:8000',
            launchFailStatus: '接続できませんでした。start_companion を実行してください。',

            // Restart Confirmation Modal Strings
            restartModalTitle: 'Companion サーバーを再起動しますか？',
            restartModalDesc: '言語を {name} に変更するには、新しい言語設定で Companion サーバーを再起動する必要があります。実行中のプロセスは停止され、新しいコマンドプロンプト画面が起動します。',
            btnRestartCancel: 'キャンセル',
            btnRestartConfirm: 'サーバーを再起動',
            restartingToast: 'Companion サーバーを {name} で再起動しています...'
        },

        dictation: {
            sessionFinished: '素晴らしいです！このページのすべての項目の入力が完了しました。',
            askFieldRepeat: (label) => `${label} の回答をもう一度お話しください。`,
            askFieldExisting: (label, val) => `次の項目は ${label} です。現在の値は ${val} です。変更しますか？新しい値をお話しいただくか、「はい」と言ってそのまま進んでください。`,
            askFieldSelect: (label, required) => `次の項目は ${label} です。${required ? 'これは必須項目です。' : ''} どの選択肢を選びますか？`,
            askFieldDefault: (label, required) => `次の項目は ${label} です。${required ? 'これは必須項目です。' : ''} ここには何を入力しますか？`,

            confirmField: (label, val) => `${label} は ${val} でよろしいですか？ よろしければ「はい」、変更する場合は修正内容をお話しください。`,
            fieldRecorded: (label) => `承知しました。${label} を記録しました。`,
            askCorrection: (label) => `修正内容をお教えください。${label} には何を入力しますか？`,
            confirmCorrection: (corrected) => `更新した値: ${corrected} です。これでよろしいですか？`,
            clarifyValue: (label) => `${label} の値をもう一度はっきりとお話しください。`,
            fieldSkipped: (label) => `かしこまりました。${label || 'この項目'} をスキップします。`,
            reaskPrompt: (label) => `${label} の回答をもう一度お話しください。`
        },

        prompts: {
            intentClassifierSystem:
                'あなたはユーザーの意図を分類するアシスタントです。\n' +
                'フォームに入力された値が正しいかどうか、ユーザーに確認しました。\n\n' +
                'ルール:\n' +
                '1. 肯定・承認している場合（例: 「はい」「合ってる」「大丈夫」「OK」「次へ」「進めて」など） → 必ず "CONFIRM" とだけ出力してください。\n' +
                '2. 否定・訂正している場合（例: 「いいえ」「違う」「変えて」「間違い」「実は…」など） → 必ず "CORRECT" とだけ出力してください。\n\n' +
                '出力は CONFIRM または CORRECT の1単語のみにしてください。',

            intentClassifierUser: (reply) => `ユーザーの返答: "${reply}"\n判定:`,

            extractorSystem:
                `あなたはフォーム項目データ抽出アシスタントです。
ユーザーが話した内容から相槌や前置き（「私の名前は」「入力して」など）を取り除き、項目に入力すべきクリーンな値のみを抽出してください。`,

            extractorUser: (fieldLabel, cleanSpoken) => `項目名: ${fieldLabel}\n発話内容: "${cleanSpoken}"\n抽出値:`,

            correctorSystem:
                `あなたはフォーム修正アシスタントです。
前回の値にユーザーの修正指示を反映し、最終的なクリーンな入力値のみを出力してください。`,

            correctorUser: (fieldLabel, cleanOriginal, cleanInstruction) =>
                `項目: ${fieldLabel}\n前回の値: ${cleanOriginal}\n修正指示: "${cleanInstruction}"\n新値:`
        },

        heuristics: {
            negationWords: [
                'いいえ', 'ちがう', '違う', 'まちがい', '間違い', '直して', '変更', '変えて', 'だめ', 'ダメ'
            ],
            confirmWords: [
                'はい', 'うん', 'そうです', '合ってる', 'オッケー', 'ok', '大丈夫', 'オーケー', 'いいよ', '次へ', '進めて'
            ],
            skipPhrases: [
                'スキップ', '飛ばして', 'とばして', '次へ', 'パス', '次の項目'
            ],
            pureRejectionWords: [
                'いいえ', '違う', 'ちがう', 'だめ'
            ]
        }
    };

    if (typeof window !== 'undefined') {
        window.__LOCALES__ = window.__LOCALES__ || {};
        window.__LOCALES__['ja-JP'] = ja;
        window.__LOCALES__['ja'] = ja;
    }
})();
