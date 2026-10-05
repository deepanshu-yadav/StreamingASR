/**
 * InputClassifier.js
 * 
 * Tri-way + Confirmation Intent Classifier (ACTION vs INFORMATION vs CORRECTION vs CONFIRMATION)
 * Implements a Two-Tier Architecture:
 * - Tier 1: Instant Deterministic Heuristics (~0ms latency, script-agnostic)
 * - Tier 2: Local LLM Fallback (Gemma 4 / LFM via llama-server / proxy)
 * Fully Generalized for All 15 Languages.
 */

(function () {
    'use strict';

    function escapeRegExp(s) {
        return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    }

    /**
     * Script-agnostic Unicode boundary phrase matching.
     * Matches if text contains any phrase from the given list, respecting Unicode boundaries.
     */
    function matchPhrase(text, phrases) {
        if (!text || !phrases || !phrases.length) return false;
        const lower = text.toLowerCase().trim();
        for (const p of phrases) {
            if (!p) continue;
            const lp = p.toLowerCase().trim();
            if (lower === lp) return true;
            // For CJK characters (scripts without space word delimiters)
            if (/[\u3040-\u30ff\u3400-\u4dbf\u4e00-\u9fff\uf900-\ufaff]/.test(lp)) {
                if (lower.includes(lp)) return true;
            } else {
                // Unicode boundary matching: not preceded or followed by a letter, mark, or digit
                const regex = new RegExp(`(?:^|[^\\p{L}\\p{M}\\p{N}])${escapeRegExp(lp)}(?=[^\\p{L}\\p{M}\\p{N}]|$)`, 'u');
                if (regex.test(lower)) return true;
            }
        }
        return false;
    }

    // Default multilingual heuristics covering major languages as instant fallback
    const DEFAULT_MULTILINGUAL_HEURISTICS = {
        pauseWords: [
            'pause', 'hold on', 'wait', 'sleep', 'stop', 'stop for a moment',
            'रुको', 'रुकिए', 'थोड़ा रुको', 'विराम', 'ठहरो',
            'pausa', 'pausar', 'espera', 'un momento', 'detén', 'para',
            'attends', 'attendez', 'un instant', 'arrêter',
            'warte', 'kurz warten', 'stopp', 'anhalten',
            '一時停止', '待って', 'ストップ', '止めて',
            'подожди', 'постой', 'стоп', 'остановить',
            'توقف', 'انتظر', 'تمهل', 'لحظة',
            'espere', 'espera', 'pare', 'parar',
            '멈춰', '기다려', '정지', '잠시만',
            'aspetta', 'attendi', 'fermati',
            'dur', 'bekle', 'durdur',
            'wacht', 'even wachten',
            'зачекай', 'постій',
            'dừng', 'tạm dừng', 'chờ chút', 'đợi đã'
        ],
        resumeWords: [
            'resume', 'wake up', 'start', 'continue',
            'सुनो', 'जागो', 'जारी रखो', 'शुरू करो',
            'reanudar', 'despierta', 'continuar', 'empieza',
            'reprendre', 'réveille-toi', 'continuer',
            'fortsetzen', 'aufwachen', 'weiter',
            'продолжить', 'проснись', 'возобновить',
            'продовжити', 'прокинься',
            'استئناف', 'استمر', 'استيقظ',
            '再開', '起きて', '続けて',
            '재개', '계속', '일어나',
            'retomar', 'acorde', 'continuar',
            'riprendi', 'svegliati', 'continua',
            'devam et', 'uyan', 'başla',
            'tiếp tục', 'dậy đi', 'bắt đầu',
            'hervatten', 'word wakker', 'ga door'
        ],
        submitWords: [
            'submit', 'submit form', 'finish form', 'send form', 'finish', 'done',
            'जमा करो', 'सबमिट करो', 'फॉर्म जमा करो', 'सबमिट', 'पूर्ण करो',
            'enviar', 'enviar formulario', 'terminar', 'finalizar', 'listo',
            'soumettre', 'envoyer', 'valider formulaire',
            'absenden', 'einreichen', 'abschicken', 'formular absenden', 'fertig',
            '送信', '提出', 'フォーム送信', '完了',
            'отправить', 'отправить форму', 'готово', 'завершить',
            'إرسال', 'تقديم', 'إرسال النموذج', 'تم',
            'submeter', 'pronto',
            '제출', '양식 제출', '전송',
            'invia', 'sottometti', 'invia modulo',
            'gönder', 'formu gönder', 'tamamla', 'bitti',
            'verzenden', 'insturen', 'formulier verzenden', 'afronden', 'klaar',
            'надіслати', 'відправити',
            'gửi', 'nộp', 'gửi mẫu', 'nộp đơn', 'hoàn tất'
        ],
        repeatWords: [
            'repeat', 'say again', 'reask', 'what was it', 'again', 'once more',
            'दोबारा बोलो', 'फिर से बोलो', 'क्या था', 'दोबारा पूछो', 'दोहराओ',
            'repetir', 'repite', 'otra vez', 'qué era', 'de nuevo',
            'répéter', 'répète', 'redis', "c'était quoi", 'encore une fois',
            'wiederholen', 'wiederhole', 'nochmal', 'sag noch mal', 'was war das',
            'もう一度', '繰り返して', 'なんて言った', 'もう一回',
            'повтори', 'повторите', 'скажи еще раз', 'что там было', 'еще раз',
            'أعد', 'كرر', 'ماذا قلت', 'مرة أخرى',
            'repita', 'fale de novo', 'mais uma vez',
            '다시 말해줘', '반복', '뭐라고 했어', '한 번 더',
            'ripeti', 'dimmi di nuovo', "cos'era",
            'tekrar et', 'tekrarla', 'bir daha söyle',
            'herhaal', 'zeg nog eens',
            'nhắc lại', 'lặp lại', 'nói lại'
        ],
        previousWords: [
            'previous', 'prev', 'go back', 'back', 'step back', 'previous field',
            'पिछला', 'पिछली', 'पीछे', 'पीछे चलो', 'पिछले पर जाओ',
            'anterior', 'atrás', 'volver', 'retroceder', 'campo anterior',
            'précédent', 'retour', 'en arrière', 'reculer', 'champ précédent',
            'zurück', 'vorherige', 'vorheriges', 'vorheriges feld', 'zurückgehen',
            '前へ', '戻る', '前の項目', '前のフィールド',
            'назад', 'предыдущее', 'назад поле', 'вернуться',
            'السابق', 'رجوع', 'الحقل السابق', 'عودة',
            'voltar', 'para trás',
            '이전', '뒤로', '뒤로가기',
            'precedente', 'indietro', 'torna indietro',
            'önceki', 'geri', 'geri git',
            'vorige', 'terug', 'ga terug', 'vorig veld',
            'trước', 'quay lại', 'trường trước', 'lùi lại'
        ],
        skipPhrases: [
            // Standard skip / pass triggers
            'skip', 'skip field', 'leave it', 'pass', 'next field', 'move on', 'ignore', 'skip it',
            'छोड़ दो', 'छोड़ो', 'छोड़िए', 'छोड़ना', 'स्किप', 'आगे बढ़ो', 'अगला फ़ील्ड',
            'omitir', 'saltar', 'pasar', 'dejarlo', 'siguiente campo', 'ignorar', 'pasa',
            'passer', 'laisser', 'suivant', 'champ suivant', 'saute',
            'überspringen', 'ueberspringen', 'nächstes feld', 'auslassen',
            'スキップ', '飛ばして', 'とばして', '次へ', 'パス', '次の項目',
            'пропустить', 'пропусти', 'следующее поле', 'дальше без него', 'оставь',
            'تخطي', 'تجاوز', 'الحقل التالي', 'اتركه', 'تخطى',
            'pular', 'próximo campo',
            '건너뛰기', '스킵', '패스', '다음 항목', '넘어가',
            'salta', 'prossimo campo',
            'atla', 'geç', 'gec', 'boş ver', 'bosver', 'sonraki alan', 'bırak',
            'overslaan', 'sla over', 'volgend veld', 'laat maar',
            'пропустити', 'наступне поле', 'проїхали', 'залиш',
            'bỏ qua', 'qua', 'trường tiếp', 'kệ đi',

            // Leave blank / empty triggers across languages
            'leave blank', 'leave it blank', 'blank', 'empty', 'leave empty', 'keep blank', 'keep empty',
            'खाली छोड़ दो', 'खाली छोड़ो', 'खाली छोड़िए', 'खाली रखो', 'खाली रहने दो', 'ब्लैंक छोड़ दो', 'ब्लैंक छोड़ो', 'खाली', 'ब्लैंक',
            'dejar en blanco', 'en blanco', 'dejar vacío', 'vacío', 'déjalo en blanco',
            'laisser vide', 'vide', 'laisser en blanc',
            'leer lassen', 'leer', 'frei lassen',
            '空白', '空欄', '空にして',
            'оставить пустым', 'пусто', 'оставь пустым',
            'اتركه فارغا', 'اترك فارغا', 'فارغ',
            'deixar em branco', 'em branco', 'deixar vazio',
            '비워둬', '공란으로', '빈칸으로', '빈칸',
            'lascia vuoto', 'vuoto', 'lascia in bianco',
            'boş bırak', 'bos birak', 'boş', 'bos',
            'leeg laten', 'leeg',
            'залишити пустим', 'пусто', 'порожньо',
            'để trống', 'trống', 'bỏ trống'
        ],
        confirmWords: [
            'yes', 'yeah', 'yep', 'correct', 'right', 'ok', 'okay', 'proceed', 'next', 'fine', 'perfect', 'sure', 'confirm', 'good', 'looks good', "that's right", 'that is right',
            'keep', 'keep it', 'keep value', 'keep the value', 'keep earlier value', 'keep the earlier value', 'keep existing', 'keep existing value', 'keep this', 'keep it as is', 'leave it', 'leave as is', 'as is', 'let it be', 'no change', "don't change", 'do not change', 'same', 'keep same',
            'हाँ', 'हां', 'हा', 'जी', 'haan', 'ha', 'बिल्कुल', 'ठीक', 'सही है', 'sahi hai', 'ठीक है', 'सही', 'sahi', 'आगे बढ़ो', 'रखो', 'वही रखो', 'यही रहने दो', 'वही रहने दो', 'पुराना वाला रखो', 'पुराना रखो', 'पुराना मान रखो', 'बदलना नहीं है', 'यही ठीक है', 'वही ठीक है', 'बदलो मत',
            'sí', 'si', 'correcto', 'exacto', 'bien', 'está bien', 'perfecto', 'adelante', 'proceder', 'claro', 'vale', 'de acuerdo', 'confirmo', 'así es', 'mantener', 'manténlo', 'dejarlo así', 'conservar', 'no cambiar',
            'oui', 'ouais', 'exact', 'correct', "d'accord", "c'est bon", 'valider', 'tout à fait', 'garder', 'conserver', 'laisser comme ça', 'ne pas changer',
            'ja', 'korrekt', 'richtig', 'stimmt', 'genau', 'weiter', 'in ordnung', 'passt', 'sicher', 'bestätigen', 'beibehalten', 'so lassen', 'nicht ändern',
            'はい', 'うん', 'そうです', '合ってる', 'オッケー', '大丈夫', 'オーケー', 'いいよ', '進めて', 'そのまま', '維持',
            'да', 'верно', 'правильно', 'хорошо', 'точно', 'дальше', 'подтверждаю', 'все так', 'ладно', 'оставить', 'не менять', 'пусть так',
            'نعم', 'ايوه', 'اي', 'أجل', 'صحيح', 'مضبوط', 'تمام', 'أكيد', 'موافق', 'تابع', 'حسنا', 'تأكيد', 'إبقاء', 'اتركه كما هو',
            'sim', 'certo', 'está certo', 'isso', 'pode ser', 'prosseguir', 'avançar', 'beleza', 'manter', 'deixar assim',
            '네', '응', '맞아', '맞아요', '그래', '좋아', '다음', '진행', '맞습니다', '그대로', '유지',
            'esatto', 'va bene', 'confermo', 'mantieni', 'lascia così',
            'evet', 'doğru', 'dogru', 'tamam', 'olur', 'devam', 'onay', 'aynen', 'peki', 'kalsın', 'aynı kalsın',
            'klopt', 'prima', 'akkoord', 'inderdaad', 'behouden', 'zo laten',
            'так', 'вірно', 'чудово', 'залишити', 'не змінювати',
            'có', 'đúng', 'chuẩn', 'chính xác', 'được', 'tiếp tục', 'chuẩn rồi', 'xong', 'giữ nguyên', 'để nguyên'
        ],
        negationWords: [
            'no', 'not', 'wrong', 'incorrect', 'change', 'replace', 'mistake', 'fix', 'not right', 'nope', 'nah', 'error', 'different', 'modify',
            'नहीं', 'नही', 'गलत', 'सुधार', 'बदल', 'ठीक नहीं', 'सही नहीं', 'गलती', 'sudhar', 'बदलो', 'ना', 'न',
            'mal', 'cambiar', 'cambia', 'corrige', 'corrección', 'falso', 'equivocado', 'modificar', 'no es', 'otra cosa',
            'non', 'pas', 'faux', 'erreur', 'changer', 'remplacer', 'modifier', 'mauvais', 'pas bon', 'rectifier',
            'nein', 'nicht', 'falsch', 'korrektur', 'ändern', 'ändere', 'fehler', 'unrichtig', 'ersetze', 'stimmt nicht',
            'いいえ', 'ちがう', '違う', 'まちがい', '間違い', '直して', '変更', '変えて', 'だめ', 'ダメ',
            'нет', 'не', 'неверно', 'неправильно', 'ошибка', 'измени', 'исправь', 'поменяй', 'не то',
            'لا', 'كلا', 'غلط', 'خطأ', 'عدل', 'غير', 'بدل', 'تصحيح', 'ليس', 'غير صحيح',
            'não', 'nao', 'errado', 'incorreto', 'muda', 'mudar', 'trocar', 'troca', 'conserta',
            '아니', '아니요', '틀렸어', '틀림', '수정', '바꿔', '변경', '아냐', '잘못',
            'sbagliato', 'errato', 'non va',
            'hayır', 'hayir', 'yanlış', 'yanlis', 'değiştir', 'degistir', 'düzelt', 'hata', 'yok', 'olmadı',
            'nee', 'niet', 'fout', 'verkeerd', 'wijzig', 'verander', 'foutje', 'onjuist', 'verbeter',
            'ні', 'невірно', 'помилка', 'зміни', 'виправ',
            'không', 'sai', 'sửa', 'nhầm', 'chỉnh', 'đổi', 'thay đổi', 'bậy', 'chưa đúng'
        ],
        pureRejectionWords: [
            'no', 'wrong', 'not this', 'incorrect', 'nah', 'nope', 'not right', "that's wrong", "that is wrong", "it's wrong", "it is wrong", "this is wrong",
            'नहीं', 'नही', 'ना', 'गलत', 'गलत है', 'यह गलत है', 'ये गलत है', 'सुधारो', 'बदलो',
            'mal', 'eso no', 'así no', 'está mal',
            'non', 'faux', 'pas ça', "c'est faux",
            'nein', 'falsch', 'stimmt nicht', 'nicht so', 'unrichtig',
            'いいえ', '違う', 'ちがう', 'だめ', '違います', '間違い',
            'нет', 'неверно', 'неправильно', 'это не так',
            'لا', 'كلا', 'خطأ', 'غلط', 'ليس هذا',
            'não', 'nao', 'errado', 'não é isso', 'está errado',
            '아니', '아니요', '틀렸어', '아냐', '잘못됐어',
            'sbagliato', 'errato', 'non questo', 'è sbagliato',
            'hayır', 'hayir', 'yanlış', 'yanlis', 'bu değil',
            'nee', 'fout', 'klopt niet',
            'ні', 'це не так',
            'không', 'sai', 'nhầm rồi', 'không phải'
        ],
        correctionWords: [
            'replace', 'change', 'make it', 'instead of', 'remove', 'add', 'fix', 'update', 'modify',
            'बदलो', 'बदल कर', 'की जगह', 'के स्थान पर', 'हटा दो', 'हटाओ', 'सुधार', 'जोड़ दो', 'ठीक करो',
            'cambiar', 'cambia', 'reemplazar', 'reemplaza', 'en vez de', 'quitar', 'corregir',
            'changer', 'remplacer', 'modifier', 'au lieu de', 'corriger', 'enlever',
            'ändern', 'ändere', 'ersetzen', 'ersetze', 'statt', 'korrigieren', 'entfernen',
            '変更', '変えて', '直して', 'の代わりに', '削除', '訂正',
            'измени', 'исправь', 'поменяй', 'вместо', 'замени',
            'عدل', 'غير', 'بدل', 'تصحيح', 'بدلا من', 'احذف', 'أصلح',
            'muda', 'mudar', 'trocar', 'troca', 'conserta',
            '바꿔', '변경', '수정', '대신에', '삭제',
            'sostituisci', 'invece di', 'rimuovi',
            'değiştir', 'degistir', 'düzelt', 'yerine', 'kaldır',
            'wijzig', 'wijzigen', 'verander', 'in plaats van',
            'зміни', 'виправ', 'поміняй', 'замість',
            'sửa', 'đổi', 'thay đổi', 'thay vì', 'chỉnh'
        ],
        navPrefixes: [
            'go to', 'jump to', 'skip to', 'move to', 'navigate to', 'switch to', 'take me to', 'open', 'focus on',
            'चलो', 'जाओ', 'खोलो',
            'ir a', 'salta a', 'pasa a', 've a', 'abrir', 'enfocar',
            'aller à', 'passer à', 'ouvrir', 'aller sur',
            'gehe zu', 'springe zu', 'öffne',
            'перейти к', 'перейти на', 'открой', 'перейди на',
            'перейти до', 'відкрий',
            'انتقل إلى', 'اذهب إلى', 'افتح',
            'ir para', 'pular para', 'abrir',
            'vai a', 'passa a', 'apri',
            'git', 'geç', 'aç',
            'đi đến', 'chuyển đến', 'mở',
            'ga naar', 'spring naar', 'open'
        ],
        navSuffixes: [
            'पर जाओ', 'पर चलो', 'में जाओ', 'पर जाएं', 'पर चलें', 'खोलो', 'दिखाओ',
            'へ移動', 'に行く', 'を開く', 'に飛ぶ', 'を開いて',
            '로 이동', '로 가', '열어',
            'alanına git', 'bölümüne git',
            'đi', 'đến'
        ]
    };

    class InputClassifier {
        constructor(options = {}) {
            this.fieldResolver = options.fieldResolver || (typeof window !== 'undefined' ? window.fieldResolver : null);
            this.llmUrl = options.llmUrl || 'http://127.0.0.1:8000/v1/chat/completions';
        }

        setLlmUrl(url) {
            if (url) this.llmUrl = url;
        }

        /**
         * Get aggregated multilingual heuristics merged with active locale heuristics
         */
        getHeuristics() {
            const activeHeuristics = (typeof window !== 'undefined' && window.i18n) ? window.i18n.getHeuristics() : {};
            const allLocaleHeuristics = (typeof window !== 'undefined' && window.i18n && window.i18n.getAllHeuristics) ? window.i18n.getAllHeuristics() : {};

            const merged = {};
            for (const key of Object.keys(DEFAULT_MULTILINGUAL_HEURISTICS)) {
                merged[key] = [
                    ...(activeHeuristics[key] || []),
                    ...(allLocaleHeuristics[key] || []),
                    ...(DEFAULT_MULTILINGUAL_HEURISTICS[key] || [])
                ];
                merged[key] = Array.from(new Set(merged[key]));
            }
            return merged;
        }

        /**
         * Strip HTML tags and normalize text with Unicode punctuation
         */
        cleanText(text) {
            if (!text) return '';
            return text.toString()
                .replace(/<[a-zA-Z]{2,}(?:-[a-zA-Z0-9]+)?\s*>?/g, '')
                .replace(/<[^>]+>/g, '')
                .replace(/[^\p{L}\p{M}\p{N}\s,:：@\.\-_]/gu, ' ')
                .replace(/\s+/g, ' ')
                .trim();
        }

        /**
         * Tier 1: Deterministic Heuristic Classifier (Script-Agnostic, Multilingual, 0ms)
         */
        classifyHeuristic(text, context = {}) {
            const clean = this.cleanText(text);
            if (!clean) return null;

            const lower = clean.toLowerCase();
            const { currentFieldIndex = 0, scannedFields = [], flowState = 'form_awaiting_input', pendingFieldValue = '' } = context;
            const currentField = scannedFields[currentFieldIndex] || null;
            const heuristics = this.getHeuristics();

            // 1. ACTION: Pause / Sleep triggers across languages
            if (matchPhrase(lower, heuristics.pauseWords)) {
                return {
                    type: 'ACTION',
                    confidence: 0.99,
                    action: { verb: 'PAUSE' },
                    payload: clean,
                    source: 'heuristic'
                };
            }

            // 2. ACTION: Submit Form triggers across languages
            if (matchPhrase(lower, heuristics.submitWords)) {
                return {
                    type: 'ACTION',
                    confidence: 0.95,
                    action: { verb: 'SUBMIT' },
                    payload: clean,
                    source: 'heuristic'
                };
            }

            // 3. ACTION: Repeat current field prompt across languages
            if (matchPhrase(lower, heuristics.repeatWords)) {
                return {
                    type: 'ACTION',
                    confidence: 0.95,
                    action: { verb: 'REPEAT' },
                    payload: clean,
                    source: 'heuristic'
                };
            }

            // 4. ACTION: Relative Navigation - Previous across languages
            if (matchPhrase(lower, heuristics.previousWords)) {
                return {
                    type: 'ACTION',
                    confidence: 0.95,
                    action: {
                        verb: 'PREVIOUS',
                        targetIndex: Math.max(0, currentFieldIndex - 1)
                    },
                    payload: clean,
                    source: 'heuristic'
                };
            }

            // 5. In confirmation states, check explicit Confirmation before generic skip phrases
            if (flowState === 'form_awaiting_confirmation' || flowState === 'confirming') {
                const hasExplicitNav = matchPhrase(lower, heuristics.navPrefixes) || matchPhrase(lower, heuristics.navSuffixes);

                if (!hasExplicitNav) {
                    const hasConfirm = matchPhrase(lower, heuristics.confirmWords);
                    const hasNegate = matchPhrase(lower, heuristics.negationWords);

                    if (hasConfirm && !hasNegate) {
                        return {
                            type: 'CONFIRMATION',
                            confidence: 0.98,
                            payload: clean,
                            source: 'heuristic'
                        };
                    }
                }
            }

            // 6. ACTION: Non-targeted Skip / Leave Blank triggers across languages
            if (matchPhrase(lower, heuristics.skipPhrases)) {
                return {
                    type: 'ACTION',
                    confidence: 0.99,
                    action: { verb: 'SKIP' },
                    payload: clean,
                    source: 'heuristic'
                };
            }

            // 7. Remaining feedback / delta in confirmation states (Negation, Pure Rejection, Corrections)
            if (flowState === 'form_awaiting_confirmation' || flowState === 'confirming') {
                const hasExplicitNav = matchPhrase(lower, heuristics.navPrefixes) || matchPhrase(lower, heuristics.navSuffixes);

                if (!hasExplicitNav) {

                    // Check for Rejection/Negation prefix followed by trailing content
                    // e.g. "No, for i replace it with double e and for C, replace it with S", "No, my name is Amit", "गलत है, 75", "Non, c'est Jean"
                    for (const neg of heuristics.negationWords) {
                        if (!neg || neg.length < 1) continue;
                        const prefixRegex = new RegExp(`^(?:${escapeRegExp(neg)})\\s*[,:：\\-]?\\s+(.+)$`, 'ui');
                        const m = clean.match(prefixRegex);
                        if (m && m[1] && m[1].trim().length > 0) {
                            const trailing = m[1].trim();
                            const trailingWords = trailing.split(/\s+/);
                            const isTrailingOnlyRejection = trailingWords.length <= 2 && heuristics.pureRejectionWords.some(p => p.toLowerCase() === trailing.toLowerCase());
                            if (!isTrailingOnlyRejection) {
                                return {
                                    type: 'CORRECTION',
                                    confidence: 0.96,
                                    isHistoricalCorrection: false,
                                    targetFieldId: currentField?.id,
                                    payload: trailing,
                                    source: 'heuristic'
                                };
                            }
                        }
                    }

                    // Pure Rejection: user explicitly rejects the candidate without giving a new value or instruction
                    // e.g. "No", "Wrong", "That's wrong", "गलत है", "Nope", "Nein"
                    const cleanWords = clean.trim().split(/\s+/);
                    const isPureRejection = (cleanWords.length <= 4) && (
                        heuristics.pureRejectionWords.some(p => {
                            const lp = p.toLowerCase().trim();
                            return lower === lp || lower.replace(/[.,!?:;]/g, '').trim() === lp;
                        }) || (cleanWords.length <= 2 && hasNegate)
                    );

                    if (isPureRejection) {
                        return {
                            type: 'CORRECTION',
                            confidence: 0.99,
                            payload: '',
                            source: 'heuristic'
                        };
                    }

                    // Any remaining feedback or delta instruction in confirmation state is a CORRECTION!
                    return {
                        type: 'CORRECTION',
                        confidence: 0.95,
                        isHistoricalCorrection: false,
                        targetFieldId: currentField?.id,
                        payload: clean,
                        source: 'heuristic'
                    };
                }
            }

            // 7. CORRECTION: Historical / Cross-Field Corrections across languages
            if (this.fieldResolver && scannedFields.length > 0) {
                let targetCandidate = null;
                let instructionPart = null;

                // 1. Preposition + Field Candidate + Action Verb + Instruction
                const crossPrefixMatch = clean.match(/^(?:in|en|dans|im|в|في|no|na|trong|u|w)\s+([\p{L}\p{M}\p{N}\s]+?)\s+(?:make|change|replace|set|fix|use|put|poner|pon|cambiar|cambia|mettre|mettez|changer|remplacer|mache|ändere|setze|измени|поменяй|замени|عدل|بدل|thay|sửa|mudar|trocar)\s+(.+)$/iu);
                if (crossPrefixMatch) {
                    targetCandidate = crossPrefixMatch[1].trim();
                    instructionPart = crossPrefixMatch[2].trim();
                }

                // 2. Postposition pattern: "<Field> (में|मे|で|に|에서|da|de|içinde) <instruction>"
                if (!targetCandidate) {
                    const postMatch = clean.match(/^([\p{L}\p{M}\p{N}\s]+?)\s*(?:में|मे|में\s+से|で|に|の項目(?:で|に)|에서|안에|da|de|deki|içinde)\s*(.+)$/iu);
                    if (postMatch) {
                        targetCandidate = postMatch[1].trim();
                        instructionPart = postMatch[2].trim();
                    }
                }

                // 3. Preposition + Field + Colon/Comma + Instruction: "in email: new@email.com"
                if (!targetCandidate) {
                    const colonMatch = clean.match(/^(?:in|en|dans|im|в|في|no|na|trong)\s+([\p{L}\p{M}\p{N}\s]+?)\s*[,:：]\s*(.+)$/iu);
                    if (colonMatch) {
                        targetCandidate = colonMatch[1].trim();
                        instructionPart = colonMatch[2].trim();
                    }
                }

                if (targetCandidate && instructionPart) {
                    const res = this.fieldResolver.resolveTarget(targetCandidate, scannedFields, currentFieldIndex);
                    if (res && res.found && res.confidence >= 0.75) {
                        return {
                            type: 'CORRECTION',
                            confidence: 0.92,
                            isHistoricalCorrection: res.index !== currentFieldIndex,
                            historicalTargetIndex: res.index,
                            targetFieldId: res.field.id,
                            targetFieldLabel: res.field.label,
                            payload: instructionPart,
                            source: 'heuristic'
                        };
                    }
                }
            }

            // 8. ACTION: Targeted Field Jump ("go to address", "ve a dirección", "champ 3", "7番目")
            if (this.fieldResolver && scannedFields.length > 0) {
                const targetMatch = this.fieldResolver.resolveTarget(clean, scannedFields, currentFieldIndex);
                if (targetMatch && targetMatch.found) {
                    const hasNavKeywords = matchPhrase(lower, heuristics.navPrefixes)
                        || matchPhrase(lower, heuristics.navSuffixes)
                        || targetMatch.matchType.startsWith('ordinal')
                        || targetMatch.matchType.startsWith('relative');

                    if (hasNavKeywords || (targetMatch.index !== currentFieldIndex && targetMatch.confidence >= 0.85)) {
                        const isValueCollision = (targetMatch.index === currentFieldIndex) && !hasNavKeywords;
                        if (!isValueCollision) {
                            return {
                                type: 'ACTION',
                                confidence: targetMatch.confidence,
                                action: {
                                    verb: 'JUMP',
                                    targetIndex: targetMatch.index,
                                    targetFieldId: targetMatch.field.id,
                                    targetFieldLabel: targetMatch.field.label
                                },
                                payload: clean,
                                source: 'heuristic'
                            };
                        }
                    }
                }
            }

            // 9. CORRECTION: Current Field Correction triggers in regular input state
            if (matchPhrase(lower, heuristics.correctionWords)) {
                return {
                    type: 'CORRECTION',
                    confidence: 0.88,
                    isHistoricalCorrection: false,
                    targetFieldId: currentField?.id,
                    payload: clean,
                    source: 'heuristic'
                };
            }

            // 10. INFORMATION: Standard field data input
            if (flowState === 'form_awaiting_input' || flowState === 'listening') {
                return {
                    type: 'INFORMATION',
                    confidence: 0.85,
                    payload: clean,
                    source: 'heuristic'
                };
            }

            return null;
        }

        /**
         * Tier 2: Multilingual LLM Fallback Classifier
         */
        async classifyLLM(text, context = {}) {
            const clean = this.cleanText(text);
            const { currentFieldIndex = 0, scannedFields = [], flowState = '' } = context;
            const currentField = scannedFields[currentFieldIndex] || null;

            const fieldsSummary = scannedFields.map((f, i) => `#${i + 1} "${f.label}" (${f.type})`).join(', ');

            const systemPrompt = `You are an Intent Classifier for a Multilingual Voice Form Assistant.
Analyze the user utterance against the active form context.
Available Fields on Page: [${fieldsSummary}]
Current Field: #${currentFieldIndex + 1} "${currentField?.label || 'None'}"
Current State: ${flowState}

Classify the user intent into exactly ONE category:
1. ACTION: User wants to navigate or control flow (e.g. jump to another field, skip, go back, repeat, submit, pause).
2. INFORMATION: User is providing the value/answer for a form field.
3. CORRECTION: User wants to fix/modify an existing or previous field.
4. CONFIRMATION: User is answering a verification question ("yes", "correct", etc.).

Respond with a strictly formatted JSON object:
{
  "type": "ACTION" | "INFORMATION" | "CORRECTION" | "CONFIRMATION",
  "confidence": 0.9,
  "verb": "JUMP" | "SKIP" | "PREVIOUS" | "REPEAT" | "SUBMIT" | "PAUSE" | null,
  "targetFieldIndex": <number 0-indexed if JUMP or CORRECTION, or null>,
  "cleanValueOrInstruction": "<extracted clean value or modification text>"
}`;

            const userPrompt = `Utterance: "${clean}"\nJSON Decision:`;

            try {
                const resp = await fetch(this.llmUrl, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        messages: [
                            { role: 'system', content: systemPrompt },
                            { role: 'user', content: userPrompt }
                        ],
                        temperature: 0.1,
                        max_tokens: 150,
                        stream: false
                    })
                });

                if (!resp.ok) throw new Error(`LLM status ${resp.status}`);
                const data = await resp.json();
                const rawContent = data?.choices?.[0]?.message?.content || '{}';
                
                const jsonStr = rawContent.replace(/```json\s*/i, '').replace(/```\s*$/, '').trim();
                const parsed = JSON.parse(jsonStr);

                const type = ['ACTION', 'INFORMATION', 'CORRECTION', 'CONFIRMATION'].includes(parsed.type)
                    ? parsed.type
                    : 'INFORMATION';

                const targetIdx = (typeof parsed.targetFieldIndex === 'number' && parsed.targetFieldIndex >= 0 && parsed.targetFieldIndex < scannedFields.length)
                    ? parsed.targetFieldIndex
                    : (type === 'ACTION' && parsed.verb === 'JUMP' ? currentFieldIndex : null);

                let instructionPayload = parsed.cleanValueOrInstruction || clean;
                if (type === 'CORRECTION') {
                    const heuristics = this.getHeuristics();
                    const isPure = matchPhrase(instructionPayload.trim(), heuristics.pureRejectionWords);
                    if (isPure) {
                        instructionPayload = '';
                    }
                }

                return {
                    type,
                    confidence: parsed.confidence || 0.8,
                    action: parsed.verb ? {
                        verb: parsed.verb,
                        targetIndex: targetIdx,
                        targetFieldId: targetIdx !== null ? scannedFields[targetIdx]?.id : null,
                        targetFieldLabel: targetIdx !== null ? scannedFields[targetIdx]?.label : null
                    } : undefined,
                    isHistoricalCorrection: type === 'CORRECTION' && targetIdx !== null && targetIdx !== currentFieldIndex,
                    historicalTargetIndex: targetIdx,
                    payload: instructionPayload,
                    source: 'llm'
                };
            } catch (err) {
                console.warn('[InputClassifier] LLM classification error, fallback to heuristic:', err);
                const lowerClean = clean.toLowerCase();
                const heuristics = this.getHeuristics();
                const isNeg = matchPhrase(lowerClean, heuristics.negationWords);
                const isPos = matchPhrase(lowerClean, heuristics.confirmWords);
                let fallbackType = 'INFORMATION';
                if (flowState === 'form_awaiting_confirmation') {
                    fallbackType = isNeg ? 'CORRECTION' : (isPos ? 'CONFIRMATION' : 'CORRECTION');
                }
                return {
                    type: fallbackType,
                    confidence: 0.5,
                    payload: isNeg ? '' : clean,
                    source: 'heuristic_fallback'
                };
            }
        }

        /**
         * Main Entry Point: Two-tier evaluation pipeline
         */
        async classify(text, context = {}) {
            // Tier 1: Instant Heuristics
            const heuristicResult = this.classifyHeuristic(text, context);
            if (heuristicResult && heuristicResult.confidence >= 0.80) {
                console.log(`[InputClassifier] Tier 1 Match (${heuristicResult.type}, conf: ${heuristicResult.confidence}):`, heuristicResult);
                return heuristicResult;
            }

            // Tier 2: LLM Fallback
            console.log('[InputClassifier] Triggering Tier 2 LLM fallback for utterance:', text);
            return await this.classifyLLM(text, context);
        }
    }

    if (typeof window !== 'undefined') {
        window.InputClassifier = InputClassifier;
    }
    if (typeof module !== 'undefined' && module.exports) {
        module.exports = InputClassifier;
    }
})();
