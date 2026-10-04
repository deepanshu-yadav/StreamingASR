/**
 * InformationHandler.js
 * 
 * Handles Value Extraction, Conversational Cleaning, Type Sanitization,
 * Confirmation Staging, and DOM Commit.
 * Fully Generalized for All 15 Languages.
 */

(function () {
    'use strict';

    // Multilingual word to number conversion tables covering all 15 supported languages
    const MULTILINGUAL_DIGITS = {
        // English
        'zero': '0', 'one': '1', 'two': '2', 'three': '3', 'four': '4',
        'five': '5', 'six': '6', 'seven': '7', 'eight': '8', 'nine': '9',
        'ten': '10', 'eleven': '11', 'twelve': '12', 'double': '2x', 'triple': '3x',

        // Hindi
        'शून्य': '0', 'सिफर': '0', 'एक': '1', 'दो': '2', 'तीन': '3', 'चार': '4',
        'पांच': '5', 'पाँच': '5', 'छह': '6', 'छः': '6', 'सात': '7', 'आठ': '8', 'नौ': '9',
        'दस': '10', 'ग्यारह': '11', 'बारह': '12', 'तेरह': '13', 'चौदह': '14', 'पंद्रह': '15',
        'सोलह': '16', 'सत्रह': '17', 'अठारह': '18', 'उन्नीस': '19', 'बीस': '20',
        'दोहरा': '2x', 'तिहरा': '3x',

        // Spanish
        'cero': '0', 'uno': '1', 'una': '1', 'dos': '2', 'tres': '3', 'cuatro': '4',
        'cinco': '5', 'seis': '6', 'siete': '7', 'ocho': '8', 'nueve': '9', 'diez': '10',
        'once': '11', 'doce': '12', 'doble': '2x', 'triple': '3x',

        // French
        'zéro': '0', 'un': '1', 'une': '1', 'deux': '2', 'trois': '3',
        'quatre': '4', 'cinq': '5', 'six': '6', 'sept': '7', 'huit': '8', 'neuf': '9',
        'dix': '10', 'onze': '11', 'douze': '12',

        // German
        'null': '0', 'eins': '1', 'ein': '1', 'eine': '1', 'zwei': '2', 'zwo': '2',
        'drei': '3', 'vier': '4', 'fünf': '5', 'fuenf': '5', 'sechs': '6', 'sieben': '7',
        'acht': '8', 'neun': '9', 'zehn': '10', 'doppelt': '2x', 'dreifach': '3x',

        // Italian
        'due': '2', 'tre': '3', 'quattro': '4', 'cinque': '5', 'sei': '6',
        'sette': '7', 'otto': '8', 'nove': '9', 'dieci': '10', 'doppio': '2x', 'triplo': '3x',

        // Portuguese
        'duas': '2', 'três': '3', 'tres': '3', 'quatro': '4', 'cinco': '5',
        'sete': '7', 'oito': '8', 'dez': '10', 'duplo': '2x',

        // Russian
        'ноль': '0', 'нуль': '0', 'один': '1', 'одна': '1', 'два': '2', 'две': '2',
        'три': '3', 'четыре': '4', 'пять': '5', 'шесть': '6', 'семь': '7', 'восемь': '8',
        'девять': '9', 'десять': '10', 'двойной': '2x', 'тройной': '3x',

        // Ukrainian
        'чотири': '4', 'п\'ять': '5', 'пять': '5', 'шість': '6', 'сім': '7',
        'вісім': '8', 'дев\'ять': '9', 'девять': '9',

        // Arabic
        'صفر': '0', 'واحد': '1', 'واحدة': '1', 'اثنان': '2', 'اثنين': '2', 'ثلاثة': '3',
        'أربعة': '4', 'اربعة': '4', 'خمسة': '5', 'ستة': '6', 'سبعة': '7', 'ثمانية': '8',
        'تسعة': '9', 'عشرة': '10', 'مزدوج': '2x',

        // Japanese / Chinese
        'ゼロ': '0', '零': '0', '一': '1', '二': '2', '三': '3', '四': '4',
        '五': '5', '六': '6', '七': '7', '八': '8', '九': '9', '十': '10',

        // Korean
        '영': '0', '공': '0', '일': '1', '이': '2', '삼': '3', '사': '4',
        '오': '5', '육': '6', '칠': '7', '팔': '8', '구': '9', '십': '10',
        '하나': '1', '둘': '2', '셋': '3', '넷': '4',

        // Turkish
        'sıfır': '0', 'sifir': '0', 'bir': '1', 'iki': '2', 'üç': '3', 'uc': '3',
        'dört': '4', 'dort': '4', 'beş': '5', 'bes': '5', 'altı': '6', 'alti': '6',
        'yedi': '7', 'sekiz': '8', 'dokuz': '9', 'on': '10', 'çift': '2x',

        // Vietnamese
        'không': '0', 'khong': '0', 'một': '1', 'mot': '1', 'hai': '2', 'ba': '3',
        'bốn': '4', 'bon': '4', 'năm': '5', 'nam': '5', 'sáu': '6', 'sau': '6',
        'bảy': '7', 'bay': '7', 'tám': '8', 'tam': '8', 'chín': '9', 'chin': '9', 'mười': '10',

        // Dutch
        'één': '1', 'twee': '2', 'drie': '3', 'vier': '4', 'vijf': '5',
        'zes': '6', 'zeven': '7', 'negen': '9', 'tien': '10', 'dubbel': '2x'
    };

    function normalizeNumeralCharacters(str) {
        if (!str) return '';
        // Devanagari numerals ०-९
        let s = str.replace(/[\u0966-\u096F]/g, d => (d.charCodeAt(0) - 0x0966).toString());
        // Eastern Arabic numerals ٠-٩
        s = s.replace(/[\u0660-\u0669]/g, d => (d.charCodeAt(0) - 0x0660).toString());
        return s;
    }

    class InformationHandler {
        constructor(options = {}) {
            this.fieldResolver = options.fieldResolver || (typeof window !== 'undefined' ? window.fieldResolver : null);
            this.llmUrl = options.llmUrl || 'http://127.0.0.1:8000/v1/chat/completions';
        }

        setLlmUrl(url) {
            if (url) this.llmUrl = url;
        }

        getDict() {
            return (typeof window !== 'undefined' && window.i18n) ? window.i18n.getDictation() : {};
        }

        /**
         * Clean conversational fillers across all languages
         */
        cleanConversationalPhrases(text) {
            if (!text) return '';
            let s = text.toString()
                .replace(/<[a-zA-Z]{2,}(?:-[a-zA-Z0-9]+)?\s*>?/g, '')
                .replace(/<[^>]+>/g, '')
                .replace(/[^\p{L}\p{M}\p{N}\s]/gu, ' ')
                .replace(/\s+/g, ' ')
                .trim();

            // Multilingual conversational filler prefixes
            s = s.replace(/^(?:please\s+|por\s+favor\s+|s'il\s+vous\s+plaît\s+|bitte\s+|कृपया\s+|пожалуйста\s+|من\s+فضلك\s+|lütfen\s+|làm\s+ơn\s+|제발\s+)?(?:(?:my|mi|mon|mein|мой|benim|của\s+tôi|제|meu|il\s+mio|mijn|मेरा|मेरी)\s+[\p{L}\p{M}]+?\s*(?:is|es|est|ist|это|dir|là|는|é|è|है)?|меня\s+зовут|it\s+is|the\s+value\s+is|write\s+down|enter|fill\s+in|type|es|el\s+valor\s+es|escribe|ingresa|c'est|la\s+valeur\s+est|mettez|écrivez|es\s+ist|der\s+wert\s+ist|trag\s+ein|यह\s+है|लिख\s+दो|लिखिए|भर\s+दो|डाल\s+दीजिए|это|значение|напиши|введи|yaz|gir|là|điền|nhập|입니다|입력해|é|o\s+valor\s+é|digite|è|scrivi|het\s+is|voer\s+in)\s+/iu, '');

            // Multilingual conversational filler suffixes
            s = s.replace(/\s+(?:है|लिख\s+दो|भर\s+दो|डाल\s+दो|होगा|por\s+favor|s'il\s+vous\s+plaît|bitte|please|desu|입니까|입니다|dır|dir)$/iu, '');

            return s.trim();
        }

        /**
         * Sanitize spoken numbers (words -> digits) across all 15 languages
         */
        sanitizeNumeric(text) {
            if (!text) return '';
            let normalized = normalizeNumeralCharacters(text.toLowerCase());
            let words = normalized.split(/\s+/);
            let out = [];

            for (let i = 0; i < words.length; i++) {
                const w = words[i];
                if (MULTILINGUAL_DIGITS[w] !== undefined) {
                    if (MULTILINGUAL_DIGITS[w] === '2x' && i + 1 < words.length) {
                        const nextDigit = MULTILINGUAL_DIGITS[words[i + 1]] || words[i + 1];
                        out.push(nextDigit, nextDigit);
                        i++;
                    } else if (MULTILINGUAL_DIGITS[w] === '3x' && i + 1 < words.length) {
                        const nextDigit = MULTILINGUAL_DIGITS[words[i + 1]] || words[i + 1];
                        out.push(nextDigit, nextDigit, nextDigit);
                        i++;
                    } else {
                        out.push(MULTILINGUAL_DIGITS[w]);
                    }
                } else {
                    out.push(w);
                }
            }

            const joined = out.join('');
            const digits = joined.replace(/\D/g, '');
            return digits || text;
        }

        /**
         * Sanitize spoken email address across all languages
         * (e.g. "rahul at gmail dot com", "rahul arroba gmail punto com", "rahul собака gmail точка com")
         */
        sanitizeEmail(text) {
            if (!text) return '';
            let s = text.toLowerCase();
            // Multilingual @ spoken representations
            s = s.replace(/\s+(?:at\s+the\s+rate|at|एट\s+द\s+रेट|एट|पर|arroba|arobase|arobe|ät|chiocciola|собака|собачка|равлик|песик|kuyruklu\s+a|et|a\s+còng|a\s+móc|アットマーク|アット|골뱅이|엣|علامة\s+آت|آت|apenstaartje)\s+/gu, '@');
            // Multilingual . spoken representations
            s = s.replace(/\s+(?:dot|point|period|डॉट|बिंदु|नुक्ता|punto|ponto|punkt|punt|точка|крапка|nokta|chấm|cham|ドット|テン|点|점|닷|نقطة)\s+/gu, '.');
            s = s.replace(/\s+/g, '');
            return s;
        }

        /**
         * Detect if field is numeric in any language
         */
        isNumericField(field) {
            if (!field) return false;
            const fieldType = (field.type || '').toLowerCase();
            if (fieldType === 'number' || fieldType === 'tel') return true;

            const inputMode = (field.inputMode || field.attributes?.inputmode || '').toLowerCase();
            if (inputMode === 'numeric' || inputMode === 'tel' || inputMode === 'decimal') return true;

            const label = (field.label || '').toLowerCase();
            const name = (field.name || '').toLowerCase();
            const id = (field.id || '').toLowerCase();
            const placeholder = (field.placeholder || '').toLowerCase();
            const combined = `${label} ${name} ${id} ${placeholder}`;

            // Check against FieldResolver synonyms if available
            const resolver = this.fieldResolver || (typeof window !== 'undefined' && window.fieldResolver);
            if (resolver && resolver.findMatchingSynonymConcept) {
                const concept = resolver.findMatchingSynonymConcept(label) || resolver.findMatchingSynonymConcept(name);
                if (['phone', 'pincode', 'age', 'number'].includes(concept)) {
                    return true;
                }
            }

            // Universal regex covering standard international patterns (Aadhaar, SSN, PIN, ZIP, Phone, Mobile, Age, Number)
            return /(?:phone|mobile|cell|tel|pincode|postal|zip|aadhaar|aadhar|ssn|age|number|digit|code|telefono|movil|celular|portable|handynummer|telefonnummer|postleitzahl|adresse\s+postale|código\s+postal|code\s+postal|edad|âge|alter|número|numéro|nummer|फ़ोन|फोन|मोबाइल|पिन|आधार|संख्या|नंबर|उम्र|телефон|мобильный|индекс|возраст|номер|هاتف|جوال|بريدي|عمر|رقم|電話|携帯|郵便番号|年齢|番号|전화|휴대폰|우편번호|나이|번호|điện\s+thoại|di\s+động|bưu\s+chính|tuổi|số)/iu.test(combined);
        }

        /**
         * Detect if field is email in any language
         */
        isEmailField(field) {
            if (!field) return false;
            const fieldType = (field.type || '').toLowerCase();
            if (fieldType === 'email') return true;

            const label = (field.label || '').toLowerCase();
            const name = (field.name || '').toLowerCase();
            const combined = `${label} ${name}`;

            const resolver = this.fieldResolver || (typeof window !== 'undefined' && window.fieldResolver);
            if (resolver && resolver.findMatchingSynonymConcept) {
                if (resolver.findMatchingSynonymConcept(label) === 'email') return true;
            }

            return /(?:email|courriel|correo|e-mail|mail|ईमेल|почта|البريد|メール|이메일|eposta|thư)/iu.test(combined);
        }

        /**
         * Process and extract clean field value according to field type and label
         * 
         * @param {string} rawText - User spoken text
         * @param {Object} field - Scanned field object
         * @returns {Promise<string>} Cleaned value
         */
        async processValue(rawText, field) {
            if (!rawText) return '';
            let cleaned = this.cleanConversationalPhrases(rawText);

            // 1. Numeric Fields (Phone, Postal/PIN, Aadhaar, Age, etc.)
            if (this.isNumericField(field)) {
                const numericClean = this.sanitizeNumeric(cleaned);
                if (numericClean && /^\d+$/.test(numericClean)) {
                    return numericClean;
                }
            }

            // 2. Email Fields
            if (this.isEmailField(field)) {
                const emailClean = this.sanitizeEmail(cleaned);
                if (emailClean && emailClean.includes('@')) {
                    return emailClean;
                }
            }

            // 3. Short clean values without conversational baggage
            if (cleaned.split(/\s+/).length <= 2 && !/[@\.]/.test(cleaned)) {
                return cleaned;
            }

            // 4. Multilingual LLM value extraction for natural spoken sentences
            try {
                return await this.extractWithLLM(field?.label || '', cleaned, this.isNumericField(field));
            } catch (err) {
                console.warn('[InformationHandler] LLM extraction error, using heuristic clean:', err);
                return cleaned;
            }
        }

        /**
         * Multilingual LLM Value Extractor
         */
        async extractWithLLM(fieldLabel, spokenText, isNumeric) {
            const prompts = (typeof window !== 'undefined' && window.i18n) ? window.i18n.getPrompts() : {};
            const system = prompts.extractorSystem || 'Extract ONLY the literal value for the form field from the user spoken input. Remove all conversational filler in any language. Output ONLY the extracted value without quotes, markdown, or explanation.';
            const user = prompts.extractorUser ? prompts.extractorUser(fieldLabel, spokenText) : `Field: ${fieldLabel}\nSpoken: "${spokenText}"\nClean Value:`;

            const resp = await fetch(this.llmUrl, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    messages: [
                        { role: 'system', content: system },
                        { role: 'user', content: user }
                    ],
                    temperature: 0.1,
                    max_tokens: 100,
                    stream: false
                })
            });

            if (!resp.ok) throw new Error(`LLM error ${resp.status}`);
            const data = await resp.json();
            let content = (data?.choices?.[0]?.message?.content || '').trim();
            content = content.replace(/^[^:\n]{1,30}[:：\-]\s*/u, '').trim();
            content = content.replace(/^["']|["']$/g, '').trim();
            content = content.replace(/^[\p{P}\s]+|[\p{P}\s]+$/gu, '').trim();

            if (isNumeric) {
                const digits = content.replace(/\D/g, '');
                if (digits) content = digits;
            }

            return content || spokenText;
        }

        /**
         * Stage a pending value and ask for user confirmation
         */
        async stageAndAskConfirmation(value, field, ctx) {
            console.log(`[InformationHandler] Staging value "${value}" for field "${field.label}"`);
            const dict = this.getDict();

            ctx.setPendingValue(value);

            // Update UI preview
            if (ctx.updateSpotlightPreview) {
                ctx.updateSpotlightPreview(value, 'confirming');
            }

            const prompt = dict.confirmField
                ? dict.confirmField(field.label, value)
                : `${field.label}: ${value}. Confirm?`;

            if (ctx.speak) {
                await ctx.speak(prompt);
            }

            if (ctx.setFlowState) {
                ctx.setFlowState('form_awaiting_confirmation');
            }
        }

        /**
         * Commit confirmed value to browser DOM and storage
         */
        async commitValue(fieldId, value, ctx) {
            console.log(`[InformationHandler] Committing field ${fieldId} -> "${value}"`);
            const { fieldValues, tabId } = ctx;

            // Record in state
            fieldValues[fieldId] = {
                value: value,
                confirmed: true,
                tentative: false,
                timestamp: Date.now()
            };

            // Write to DOM via content script
            if (tabId && typeof chrome !== 'undefined' && chrome.tabs) {
                chrome.tabs.sendMessage(tabId, {
                    type: 'VFF_SET_FIELD_VALUE',
                    fieldId: fieldId,
                    value: value
                }).catch(() => {});
            }

            if (ctx.renderScannedFieldsList) {
                ctx.renderScannedFieldsList();
            }
        }
    }

    if (typeof window !== 'undefined') {
        window.InformationHandler = InformationHandler;
    }
    if (typeof module !== 'undefined' && module.exports) {
        module.exports = InformationHandler;
    }
})();
