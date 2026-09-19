/**
 * vi.js - Vietnamese Localization Resource (vi-VN)
 */

(function () {
    const vi = {
        code: 'vi-VN',
        name: 'Tiếng Việt (Việt Nam)',
        speechLang: 'vi-VN',

        labels: {
            brandTitle: 'TRỢ LÝ ĐIỀN BIỂU MẪU BẰNG GIỌNG NÓI • NEMOTRON & GEMMA',
            appTitle: 'Signal — Trợ Lý Biểu Mẫu Bằng Giọng Nói',
            tagline: 'Tự động quét và điền biểu mẫu web bằng giọng nói của bạn',

            orchestratorTitle: 'Dịch Vụ Backend (Orchestrator)',
            companionOffline: 'Companion Ngoại Tuyến',
            companionConnected: 'Companion Trực Tuyến',
            btnStartServices: 'Khởi Động Dịch Vụ',
            btnStopServices: 'Dừng',
            btnCheckAssets: 'Kiểm Tra Tệp',
            btnLaunchCompanion: '⚡ Khởi Chạy Companion Orchestrator',
            orchestratorNotice: 'Nếu đây là lần đầu tiên, hãy đảm bảo bạn đã chạy <kbd>register_protocol.bat</kbd> (hoặc <kbd>register_protocol.sh</kbd>).',

            svsAsrName: 'Nemotron ASR',
            svsTtsName: 'Piper TTS',
            svsLlmName: 'Gemma 4 LLM',

            statusIdle: 'chờ',
            micPermLink: 'Quyền Micro',
            interruptBtn: '🔇 Tắt Tiếng TTS',

            btnScanPage: 'Quét Biểu Mẫu',
            btnStartFormFlow: 'Điền Bằng Giọng Nói',
            btnStopFormFlow: 'Kết Thúc Phiên',

            pageLabel: 'Trang:',
            fieldCountBadge: '{count} trường',
            allFieldsComplete: 'Đã hoàn thành tất cả các trường!',

            micMutedBadge: '🔇 micro đã tắt tiếng — trợ lý đang nói',

            spotlightStep: 'Trường {current} / {total}',
            spotlightRequired: '*Bắt buộc',
            spotlightPhaseAsking: 'Đang hỏi…',
            spotlightPhaseListening: 'Đang nghe…',
            spotlightPhaseConfirming: 'Xác nhận…',
            spotlightPhaseEvaluating: 'Đang kiểm tra…',
            spotlightPhaseConfirmed: '✓ Đã xác nhận',
            spotlightPromptListening: 'Đang nghe: vui lòng đọc câu trả lời…',
            spotlightValLabel: 'Giá Trị Ghi Nhận:',
            spotlightNoValYet: 'Chưa có câu trả lời',

            btnPrevField: '⏮️ Quay lại',
            btnReaskField: '🔄 Hỏi lại',
            btnSkipField: '⏭️ Bỏ qua',

            transcriptLabel: '🎙️ Bản Ghi Giọng Nói Trực Tiếp (Streaming STT)',
            transcriptIdle: 'Nhấp "Điền Bằng Giọng Nói" để bắt đầu…',
            transcriptListeningPrompt: 'Nói câu trả lời cho {label}…',
            transcriptConfirmPrompt: 'Nói có/đúng hoặc chỉ định chỉnh sửa…',

            scannedFieldsTitle: '📋 Các Trường Đã Quét (<b id="scannedFieldsCount">{count}</b>)',
            accordionHint: 'Nhấp để chuyển đến trường',

            tuningTitle: '⚙️ Cài Đặt & Tinh Chỉnh',
            settingWsUrl: 'WebSocket URL',
            settingThreshold: 'Ngưỡng Giọng Nói Silero',
            settingSilence: 'Thời gian im lặng hoàn tất',
            settingMaxTurn: 'Thời gian nói tối đa',
            settingPadding: 'Pre-roll Padding',
            settingLlmUrl: 'URL Máy Chủ Proxy LLM',
            settingDebounce: 'Độ Trễ Xác Nhận',

            noFieldsFound: 'Không tìm thấy trường nhập liệu nào trên trang này.',
            fieldsScannedSuccess: 'Đã quét thành công {count} trường!',
            fieldsScannedBadge: 'Tìm thấy {count} trường',
            fieldsZeroBadge: '0 trường tìm thấy',
            scanningBadge: 'Đang quét…',
            scanFailedBadge: 'Quét thất bại',
            invalidPageBadge: 'Trang không hợp lệ',
            tabNotFoundBadge: 'Không tìm thấy tab',
            activeTabNotFoundToast: 'Không tìm thấy tab hiện tại',
            cannotScanInternalToast: 'Không thể quét các trang nội bộ của trình duyệt',
            unableToScanToast: 'Không thể quét biểu mẫu',
            firstFieldToast: 'Đây là trường đầu tiên',
            sessionStoppedToast: 'Đã tạm dừng phiên điền biểu mẫu',
            sessionEndedToast: 'Phiên làm việc đã kết thúc',
            connectionClosed: 'Đã đóng kết nối',
            transcriptListening: 'Đang lắng nghe…',
            pleaseWaitToast: 'Vui lòng đợi, đang xử lý…',
            checkingConfirmation: 'Đang kiểm tra xác nhận…',
            wsConnectFailed: 'Không thể kết nối với WebSocket',
            micPermTabOpened: 'Đã mở tab cấp quyền — vui lòng nhấp "Cho phép"',
            micAccessDenied: 'Quyền truy cập micro bị từ chối: ',
            asrError: 'Lỗi ASR: ',
            servicesStartingToast: 'Đang khởi động dịch vụ…',
            servicesStartedToast: 'Các dịch vụ đã khởi động',
            servicesStartFailedToast: 'Khởi động thất bại: ',
            servicesStoppedToast: 'Đã dừng dịch vụ',
            servicesStopFailedToast: 'Dừng thất bại: ',
            modelsAllPresentToast: 'Tất cả các mô hình đã sẵn sàng ✓',
            modelsMissingToast: 'Thiếu một số tệp mô hình',
            checkFailedToast: 'Kiểm tra thất bại: ',
            companionStartingToast: 'Đang khởi động companion…',
            companionOnlineToast: 'Companion đã trực tuyến ✓',
            companionFailedToast: 'Companion chưa chạy? Hãy chạy register_protocol',
            companionStartingBtn: '⏳ Đang khởi động…',
            companionReadyBtn: '⚡ Khởi Chạy Companion Orchestrator',
            ttsInterrupted: 'Đã ngắt phát âm',
            ttsError: 'Lỗi TTS: ',

            launchPageTitle: 'Đang Khởi Chạy Companion Orchestrator - Trợ Lý Giọng Nói',
            launchTitle: 'Đang Khởi Chạy Companion Orchestrator...',
            launchDesc: 'Nếu trình duyệt hỏi <b>"Mở Companion Orchestrator"</b>, vui lòng chọn <b>"Mở"</b>.',
            launchStatusWaiting: '⏳ Đang chờ kết nối với máy chủ companion…',
            launchManualBtn: '🚀 Nhấp vào đây nếu không tự động mở',
            launchHint: 'Đảm bảo rằng bạn đã chạy tệp <kbd>register_protocol.bat</kbd> (hoặc <kbd>register_protocol.sh</kbd>).',
            launchSuccessTitle: 'Companion đã khởi chạy thành công!',
            launchSuccessDesc: 'Máy chủ companion đã trực tuyến. Tab này sẽ đóng…',
            launchSuccessStatus: '✓ Companion Trực Tuyến tại http://127.0.0.1:8000',
            launchFailStatus: 'Không thể kết nối. Vui lòng chạy start_companion.',

            // Restart Confirmation Modal Strings
            restartModalTitle: 'Khởi động lại Máy chủ Companion?',
            restartModalDesc: 'Thay đổi ngôn ngữ sang {name} yêu cầu khởi động lại Máy chủ Companion với cài đặt ngôn ngữ mới. Các tiến trình hiện tại sẽ dừng lại và một cửa sổ dòng lệnh mới sẽ mở ra.',
            btnRestartCancel: 'Hủy',
            btnRestartConfirm: 'Khởi động lại',
            restartingToast: 'Đang khởi động lại Máy chủ Companion bằng {name}...'
        },

        dictation: {
            sessionFinished: 'Tuyệt vời! Tất cả các trường trên trang này đã được hoàn thành.',
            askFieldRepeat: (label) => `Vui lòng đọc lại câu trả lời cho ${label}.`,
            askFieldExisting: (label, val) => `Trường tiếp theo là ${label}. Giá trị hiện tại là ${val}. Bạn có muốn thay đổi không? Nói giá trị mới hoặc nói có để giữ nguyên.`,
            askFieldSelect: (label, required) => `Trường tiếp theo là ${label}. ${required ? 'Trường này là bắt buộc.' : ''} Bạn muốn chọn phương án nào?`,
            askFieldDefault: (label, required) => `Trường tiếp theo là ${label}. ${required ? 'Trường này là bắt buộc.' : ''} Tôi nên điền gì vào đây?`,

            confirmField: (label, val) => `Cho trường ${label}: ${val}. Có đúng không? Nói có hoặc cho tôi biết cần sửa gì.`,
            fieldRecorded: (label) => `Đã hiểu, giá trị của ${label} đã được lưu.`,
            askCorrection: (label) => `Vui lòng cho biết nội dung chỉnh sửa. Cần điền gì vào ${label}?`,
            confirmCorrection: (corrected) => `Giá trị cập nhật: ${corrected}. Bây giờ đã đúng chưa?`,
            clarifyValue: (label) => `Vui lòng đọc rõ toàn bộ giá trị cho ${label}.`,
            fieldSkipped: (label) => `Được rồi, bỏ qua ${label || 'trường này'}.`,
            reaskPrompt: (label) => `Vui lòng đọc lại câu trả lời cho ${label}.`
        },

        prompts: {
            intentClassifierSystem:
                'Bạn là trợ lý phân loại ý định.\n' +
                'Người dùng được hỏi xem giá trị đã nhập cho trường có chính xác không.\n\n' +
                'Quy tắc:\n' +
                '1. Nếu người dùng xác nhận ("có", "đúng", "chuẩn", "chính xác", "được", "tiếp tục") → Chỉ xuất "CONFIRM".\n' +
                '2. Nếu từ chối hoặc sửa lại ("không", "sai", "sửa", "nhầm", "thực ra là...") → Chỉ xuất "CORRECT".\n\n' +
                'Chỉ trả lời đúng MỘT từ: CONFIRM hoặc CORRECT.',

            intentClassifierUser: (reply) => `Câu trả lời của người dùng: "${reply}"\nQuyết định:`,

            extractorSystem:
                `Bạn là Trợ lý Trích xuất Dữ liệu Biểu mẫu.
Chỉ trích xuất giá trị sạch mà người dùng muốn nhập, loại bỏ các từ đệm chào hỏi.`,

            extractorUser: (fieldLabel, cleanSpoken) => `Trường: ${fieldLabel}\nGiọng nói: "${cleanSpoken}"\nGiá Trị Sạch:`,

            correctorSystem:
                `Bạn là chuyên gia sửa giá trị biểu mẫu.
Áp dụng hướng dẫn chỉnh sửa vào giá trị trước và chỉ xuất giá trị sạch cuối cùng.`,

            correctorUser: (fieldLabel, cleanOriginal, cleanInstruction) =>
                `Trường: ${fieldLabel}\nGiá trị trước: ${cleanOriginal}\nHướng dẫn sửa: "${cleanInstruction}"\nGiá Trị Mới:`
        },

        heuristics: {
            negationWords: [
                'không', 'sai', 'sửa', 'nhầm', 'chỉnh', 'đổi', 'thay đổi', 'bậy', 'chưa đúng'
            ],
            confirmWords: [
                'có', 'đúng', 'chuẩn', 'chính xác', 'được', 'ok', 'tiếp tục', 'chuẩn rồi', 'xong'
            ],
            skipPhrases: [
                'bỏ qua', 'qua', 'tiếp', 'trường tiếp', 'kệ đi'
            ],
            pureRejectionWords: [
                'không', 'sai', 'nhầm rồi', 'chưa đúng'
            ]
        }
    };

    if (typeof window !== 'undefined') {
        window.__LOCALES__ = window.__LOCALES__ || {};
        window.__LOCALES__['vi-VN'] = vi;
        window.__LOCALES__['vi'] = vi;
    }
})();
