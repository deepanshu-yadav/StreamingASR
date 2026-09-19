/**
 * ko.js - Korean Localization Resource (ko-KR)
 */

(function () {
    const ko = {
        code: 'ko-KR',
        name: '한국어 (대한민국)',
        speechLang: 'ko-KR',

        labels: {
            brandTitle: '음성 양식 입력 도우미 • NEMOTRON & GEMMA',
            appTitle: 'Signal — 음성 양식 도우미',
            tagline: '음성을 사용하여 웹 양식을 자동으로 스캔하고 작성하세요',

            orchestratorTitle: '백엔드 서비스 (Orchestrator)',
            companionOffline: 'Companion 오프라인',
            companionConnected: 'Companion 온라인',
            btnStartServices: '서비스 시작',
            btnStopServices: '중지',
            btnCheckAssets: '파일 확인',
            btnLaunchCompanion: '⚡ Companion Orchestrator 실행',
            orchestratorNotice: '처음이시라면 <kbd>register_protocol.bat</kbd> (또는 <kbd>register_protocol.sh</kbd>) 파일을 실행했는지 확인하세요.',

            svsAsrName: 'Nemotron ASR',
            svsTtsName: 'Piper TTS',
            svsLlmName: 'Gemma 4 LLM',

            statusIdle: '대기 중',
            micPermLink: '마이크 권한',
            interruptBtn: '🔇 음성 음소거',

            btnScanPage: '양식 스캔',
            btnStartFormFlow: '음성으로 작성',
            btnStopFormFlow: '세션 종료',

            pageLabel: '페이지:',
            fieldCountBadge: '{count}개 항목',
            allFieldsComplete: '모든 항목이 입력되었습니다!',

            micMutedBadge: '🔇 마이크 음소거됨 — 도우미 발화 중',

            spotlightStep: '항목 {current} / {total}',
            spotlightRequired: '*필수',
            spotlightPhaseAsking: '질문 중…',
            spotlightPhaseListening: '듣는 중…',
            spotlightPhaseConfirming: '확인 중…',
            spotlightPhaseEvaluating: '검토 중…',
            spotlightPhaseConfirmed: '✓ 확인됨',
            spotlightPromptListening: '듣는 중: 답변을 말씀해 주세요…',
            spotlightValLabel: '인식된 값:',
            spotlightNoValYet: '아직 답변 없음',

            btnPrevField: '⏮️ 이전',
            btnReaskField: '🔄 다시 묻기',
            btnSkipField: '⏭️ 건너뛰기',

            transcriptLabel: '🎙️ 실시간 음성 전사 (Streaming STT)',
            transcriptIdle: '시작하려면 "음성으로 작성"을 클릭하세요…',
            transcriptListeningPrompt: '{label} 항목의 내용을 말씀하세요…',
            transcriptConfirmPrompt: '네라고 하거나 수정사항을 말씀하세요…',

            scannedFieldsTitle: '📋 스캔된 입력 항목 (<b id="scannedFieldsCount">{count}</b>)',
            accordionHint: '클릭하여 이동',

            tuningTitle: '⚙️ 설정 및 미세 조정',
            settingWsUrl: 'WebSocket URL',
            settingThreshold: 'Silero 음성 감지 임계값',
            settingSilence: '발화 확정 무음 시간',
            settingMaxTurn: '최대 발화 제한 시간',
            settingPadding: '프리롤 패딩 (Padding)',
            settingLlmUrl: 'LLM 프록시 서버 URL',
            settingDebounce: '확인 디바운스 시간',

            noFieldsFound: '이 페이지에서 입력 가능한 항목을 찾을 수 없습니다.',
            fieldsScannedSuccess: '{count}개 항목을 성공적으로 스캔했습니다!',
            fieldsScannedBadge: '{count}개 항목 발견',
            fieldsZeroBadge: '항목 없음',
            scanningBadge: '스캔 중…',
            scanFailedBadge: '스캔 실패',
            invalidPageBadge: '유효하지 않은 페이지',
            tabNotFoundBadge: '탭을 찾을 수 없음',
            activeTabNotFoundToast: '활성 탭을 찾을 수 없습니다',
            cannotScanInternalToast: '브라우저 내부 페이지는 스캔할 수 없습니다',
            unableToScanToast: '양식을 스캔할 수 없습니다',
            firstFieldToast: '첫 번째 항목입니다',
            sessionStoppedToast: '양식 작성이 중단되었습니다',
            sessionEndedToast: '세션이 종료되었습니다',
            connectionClosed: '연결이 닫혔습니다',
            transcriptListening: '듣는 중…',
            pleaseWaitToast: '잠시만 기다려 주세요…',
            checkingConfirmation: '확인 검토 중…',
            wsConnectFailed: 'WebSocket에 연결할 수 없습니다',
            micPermTabOpened: '권한 탭이 열렸습니다 — "허용"을 클릭하세요',
            micAccessDenied: '마이크 접근이 거부되었습니다: ',
            asrError: 'ASR 오류: ',
            servicesStartingToast: '서비스 시작 중…',
            servicesStartedToast: '서비스가 시작되었습니다',
            servicesStartFailedToast: '시작 실패: ',
            servicesStoppedToast: '서비스 중지됨',
            servicesStopFailedToast: '중지 실패: ',
            modelsAllPresentToast: '모든 모델을 사용할 수 있습니다 ✓',
            modelsMissingToast: '일부 모델 파일이 누락되었습니다',
            checkFailedToast: '확인 실패: ',
            companionStartingToast: 'Companion 시작 중…',
            companionOnlineToast: 'Companion 온라인 ✓',
            companionFailedToast: '시작되지 않았나요? register_protocol을 실행하세요',
            companionStartingBtn: '⏳ 시작 중…',
            companionReadyBtn: '⚡ Companion Orchestrator 실행',
            ttsInterrupted: '음성 출력이 중단되었습니다',
            ttsError: 'TTS 오류: ',

            launchPageTitle: 'Companion Orchestrator 실행 중 - 음성 도우미',
            launchTitle: 'Companion Orchestrator를 실행하고 있습니다...',
            launchDesc: '브라우저에 <b>"Companion Orchestrator을(를) 여시겠습니까?"</b>라는 메시지가 나타나면 <b>"열기"</b>를 선택하세요.',
            launchStatusWaiting: '⏳ 서버와의 연결을 대기하는 중…',
            launchManualBtn: '🚀 자동으로 열리지 않으면 여기를 클릭하세요',
            launchHint: '반응이 없다면 <kbd>register_protocol.bat</kbd> (또는 <kbd>register_protocol.sh</kbd>) 파일을 실행하세요.',
            launchSuccessTitle: 'Companion이 성공적으로 실행되었습니다!',
            launchSuccessDesc: '서버가 온라인 상태입니다. 이 탭은 자동으로 닫힙니다…',
            launchSuccessStatus: '✓ Companion 온라인: http://127.0.0.1:8000',
            launchFailStatus: '연결할 수 없습니다. start_companion을 실행하세요.',

            // Restart Confirmation Modal Strings
            restartModalTitle: 'Companion 서버를 다시 시작하시겠습니까?',
            restartModalDesc: '언어를 {name}(으)로 변경하려면 새 언어 설정으로 Companion 서버를 다시 시작해야 합니다. 기존 프로세스가 중지되고 새 명령 프롬프트 창이 열립니다.',
            btnRestartCancel: '취소',
            btnRestartConfirm: '서버 다시 시작',
            restartingToast: '{name} 언어로 Companion 서버를 다시 시작하는 중...'
        },

        dictation: {
            sessionFinished: '멋집니다! 이 페이지의 모든 항목 입력이 완료되었습니다.',
            askFieldRepeat: (label) => `${label} 항목의 답변을 다시 말씀해 주세요.`,
            askFieldExisting: (label, val) => `다음 항목은 ${label}입니다. 현재 값은 ${val}입니다. 변경하시겠습니까? 새 값을 말씀하시거나 그대로 유지하려면 네라고 하세요.`,
            askFieldSelect: (label, required) => `다음 항목은 ${label}입니다. ${required ? '이 항목은 필수입니다.' : ''} 어떤 옵션을 선택하시겠습니까?`,
            askFieldDefault: (label, required) => `다음 항목은 ${label}입니다. ${required ? '이 항목은 필수입니다.' : ''} 여기에 무엇을 입력할까요?`,

            confirmField: (label, val) => `${label} 항목: ${val} 맞습니까? 맞으면 네라고 하시고, 아니면 변경할 내용을 말씀하세요.`,
            fieldRecorded: (label) => `네, ${label} 항목이 저장되었습니다.`,
            askCorrection: (label) => `수정할 내용을 말씀해 주세요. ${label} 항목에 무엇을 입력할까요?`,
            confirmCorrection: (corrected) => `수정된 값: ${corrected}입니다. 이제 맞으신가요?`,
            clarifyValue: (label) => `${label} 항목의 전체 값을 명확하게 말씀해 주세요.`,
            fieldSkipped: (label) => `알겠습니다. ${label || '이 항목'}을(를) 건너뜁니다.`,
            reaskPrompt: (label) => `${label} 항목의 답변을 다시 말씀해 주세요.`
        },

        prompts: {
            intentClassifierSystem:
                '당신은 사용자 의도 분류 도우미입니다.\n' +
                '양식 항목에 입력된 값이 맞는지 사용자에게 확인했습니다.\n\n' +
                '규칙:\n' +
                '1. 사용자가 긍정/확인하는 경우 ("네", "맞아", "응", "좋아", "진행해", "다음", "맞습니다") → 오직 "CONFIRM"만 출력하십시오.\n' +
                '2. 사용자가 부정/수정하는 경우 ("아니", "틀렸어", "바꿔줘", "수정", "사실은...") → 오직 "CORRECT"만 출력하십시오.\n\n' +
                '오직 단 한 단어만 출력하십시오: CONFIRM 또는 CORRECT.',

            intentClassifierUser: (reply) => `사용자 응답: "${reply}"\n판단:`,

            extractorSystem:
                `당신은 양식 데이터 추출 도우미입니다.
사용자 발화에서 인사말이나 군더더기 표현을 제외하고 실제 입력할 깔끔한 값만 추출하세요.`,

            extractorUser: (fieldLabel, cleanSpoken) => `항목: ${fieldLabel}\n음성 답변: "${cleanSpoken}"\n추출값:`,

            correctorSystem:
                `당신은 양식 수정 전문가입니다.
사용자의 수정 지시를 이전 값에 반영하여 최종 입력값만 출력하세요.`,

            correctorUser: (fieldLabel, cleanOriginal, cleanInstruction) =>
                `항목: ${fieldLabel}\n이전 값: ${cleanOriginal}\n수정 지시: "${cleanInstruction}"\n새 값:`
        },

        heuristics: {
            negationWords: [
                '아니', '아니요', '틀렸어', '틀림', '수정', '바꿔', '변경', '아냐', '잘못'
            ],
            confirmWords: [
                '네', '응', '맞아', '맞아요', '그래', '좋아', '다음', '진행', '오케이', 'ok', '맞습니다'
            ],
            skipPhrases: [
                '건너뛰기', '스킵', '패스', '다음 항목', '넘어가'
            ],
            pureRejectionWords: [
                '아니', '아니요', '틀렸어', '아냐'
            ]
        }
    };

    if (typeof window !== 'undefined') {
        window.__LOCALES__ = window.__LOCALES__ || {};
        window.__LOCALES__['ko-KR'] = ko;
        window.__LOCALES__['ko'] = ko;
    }
})();
