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
        'ten': '10', 'eleven': '11', 'twelve': '12', 'thirteen': '13', 'fourteen': '14',
        'fifteen': '15', 'sixteen': '16', 'seventeen': '17', 'eighteen': '18', 'nineteen': '19',
        'twenty': '20', 'thirty': '30', 'forty': '40', 'fifty': '50',
        'sixty': '60', 'seventy': '70', 'eighty': '80', 'ninety': '90',
        'hundred': '00', 'thousand': '000', 'double': '2x', 'triple': '3x',
        // Common ASR phonetic misrecognitions for numbers
        'ven': '1', 'van': '1', 'wan': '1', 'won': '1', 'to': '2', 'too': '2', 'for': '4', 'ate': '8',

        // Hindi
        'शून्य': '0', 'सिफर': '0', 'एक': '1', 'दो': '2', 'तीन': '3', 'चार': '4',
        'पांच': '5', 'पाँच': '5', 'छह': '6', 'छः': '6', 'सात': '7', 'आठ': '8', 'नौ': '9',
        'दस': '10', 'ग्यारह': '11', 'बारह': '12', 'तेरह': '13', 'चौदह': '14', 'पंद्रह': '15',
        'सोलह': '16', 'सत्रह': '17', 'अठारह': '18', 'उन्नीस': '19', 'बीस': '20',
        'इक्कीस': '21', 'बाईस': '22', 'तेईस': '23', 'चौबीस': '24', 'पच्चीस': '25',
        'छब्बीस': '26', 'सत्ताईस': '27', 'अट्ठाईस': '28', 'उनतीस': '29', 'तीस': '30',
        'इकतीस': '31', 'बत्तीस': '32', 'तैंतीस': '33', 'चौंतीस': '34', 'पैंतीस': '35',
        'छत्तीस': '36', 'सैंतीस': '37', 'अड़तीस': '38', 'उनतालीस': '39', 'चालीस': '40',
        'इकतालीस': '41', 'बयालीस': '42', 'तैंतालीस': '43', 'चौवालीस': '44', 'पैंतालीस': '45',
        'छियालीस': '46', 'सैंतालीस': '47', 'अड़तालीस': '48', 'उनचास': '49', 'पचास': '50',
        'इक्यावन': '51', 'बावन': '52', 'तिरेपन': '53', 'चौवन': '54', 'पचपन': '55',
        'छप्पन': '56', 'सत्तावन': '57', 'अट्ठावन': '58', 'उनसठ': '59', 'साठ': '60',
        'इकसठ': '61', 'बासठ': '62', 'तिरसठ': '63', 'चौंसठ': '64', 'पैंसठ': '65',
        'छियासठ': '66', 'सरसठ': '67', 'अड़सठ': '68', 'उनहत्तर': '69', 'सत्तर': '70',
        'इकहत्तर': '71', 'बहत्तर': '72', 'तिहत्तर': '73', 'चौहत्तर': '74', 'पचहत्तर': '75',
        'छिहत्तर': '76', 'सतहत्तर': '77', 'अठहत्तर': '78', 'उनासी': '79', 'अस्सी': '80',
        'इक्यासी': '81', 'बयासी': '82', 'तिरासी': '83', 'चौरासी': '84', 'पचासी': '85',
        'छियासी': '86', 'सत्तासी': '87', 'अठासी': '88', 'नवासी': '89', 'नब्बे': '90',
        'इक्यानवे': '91', 'बानवे': '92', 'तिरानवे': '93', 'चौरानवे': '94', 'पंचानवे': '95',
        'छियानवे': '96', 'सत्तानवे': '97', 'अट्ठानवे': '98', 'निन्यानवे': '99',
        'सौ': '00', 'हज़ार': '000', 'हजार': '000', 'लाख': '00000',
        'दोहरा': '2x', 'तिहरा': '3x',

        // Spanish
        'cero': '0', 'uno': '1', 'una': '1', 'dos': '2', 'tres': '3', 'cuatro': '4',
        'cinco': '5', 'seis': '6', 'siete': '7', 'ocho': '8', 'nueve': '9',
        'diez': '10', 'once': '11', 'doce': '12', 'trece': '13', 'catorce': '14',
        'quince': '15', 'dieciséis': '16', 'dieciseis': '16', 'diecisiete': '17',
        'dieciocho': '18', 'diecinueve': '19', 'veinte': '20',
        'veintiuno': '21', 'veintidós': '22', 'veintidos': '22', 'veintitrés': '23', 'veintitres': '23',
        'veinticuatro': '24', 'veinticinco': '25', 'veintiséis': '26', 'veintiseis': '26',
        'veintisiete': '27', 'veintiocho': '28', 'veintinueve': '29',
        'treinta': '30', 'cuarenta': '40', 'cincuenta': '50', 'sesenta': '60',
        'setenta': '70', 'ochenta': '80', 'noventa': '90', 'cien': '00', 'ciento': '00', 'mil': '000',
        'doble': '2x', 'triple': '3x',

        // French
        'zéro': '0', 'zero': '0', 'un': '1', 'une': '1', 'deux': '2', 'trois': '3',
        'quatre': '4', 'cinq': '5', 'six': '6', 'sept': '7', 'huit': '8', 'neuf': '9',
        'dix': '10', 'onze': '11', 'douze': '12', 'treize': '13', 'quatorze': '14',
        'quinze': '15', 'seize': '16', 'dix-sept': '17', 'dix-huit': '18', 'dix-neuf': '19',
        'vingt': '20', 'trente': '30', 'quarante': '40', 'cinquante': '50', 'soixante': '60',
        'soixante-dix': '70', 'quatre-vingt': '80', 'quatre-vingts': '80', 'quatre-vingt-dix': '90',
        'cent': '00', 'mille': '000', 'double': '2x', 'triple': '3x',

        // German
        'null': '0', 'eins': '1', 'ein': '1', 'eine': '1', 'zwei': '2', 'zwo': '2',
        'drei': '3', 'vier': '4', 'fünf': '5', 'fuenf': '5', 'sechs': '6', 'sieben': '7',
        'acht': '8', 'neun': '9', 'zehn': '10', 'elf': '11', 'zwölf': '12', 'zwoelf': '12',
        'dreizehn': '13', 'vierzehn': '14', 'fünfzehn': '15', 'fuenfzehn': '15',
        'sechzehn': '16', 'siebzehn': '17', 'achtzehn': '18', 'neunzehn': '19',
        'zwanzig': '20', 'dreißig': '30', 'dreissig': '30', 'vierzig': '40',
        'fünfzig': '50', 'fuenfzig': '50', 'sechzig': '60', 'siebzig': '70',
        'achtzig': '80', 'neunzig': '90', 'hundert': '00', 'tausend': '000',
        'doppelt': '2x', 'dreifach': '3x',

        // Italian
        'zero': '0', 'uno': '1', 'una': '1', 'due': '2', 'tre': '3', 'quattro': '4',
        'cinque': '5', 'sei': '6', 'sette': '7', 'otto': '8', 'nove': '9',
        'dieci': '10', 'undici': '11', 'dodici': '12', 'tredici': '13', 'quattordici': '14',
        'quindici': '15', 'sedici': '16', 'diciassette': '17', 'diciotto': '18', 'diciannove': '19',
        'venti': '20', 'trenta': '30', 'quaranta': '40', 'cinquanta': '50',
        'sessanta': '60', 'settanta': '70', 'ottanta': '80', 'novanta': '90',
        'cento': '00', 'mille': '000', 'doppio': '2x', 'triplo': '3x',

        // Portuguese
        'zero': '0', 'um': '1', 'uma': '1', 'dois': '2', 'duas': '2', 'três': '3', 'tres': '3',
        'quatro': '4', 'cinco': '5', 'seis': '6', 'meia': '6', 'sete': '7', 'oito': '8', 'nove': '9',
        'dez': '10', 'onze': '11', 'doze': '12', 'treze': '13', 'quatorze': '14', 'catorze': '14',
        'quinze': '15', 'dezesseis': '16', 'dezasseis': '16', 'dezessete': '17', 'dezassete': '17',
        'dezoito': '18', 'dezenove': '19', 'dezanove': '19',
        'vinte': '20', 'trinta': '30', 'quarenta': '40', 'cinquenta': '50',
        'sessenta': '60', 'setenta': '70', 'oitenta': '80', 'noventa': '90',
        'cem': '00', 'cento': '00', 'mil': '000', 'duplo': '2x', 'triplo': '3x',

        // Russian
        'ноль': '0', 'нуль': '0', 'один': '1', 'одна': '1', 'два': '2', 'две': '2',
        'три': '3', 'четыре': '4', 'пять': '5', 'шесть': '6', 'семь': '7', 'восемь': '8', 'девять': '9',
        'десять': '10', 'одиннадцать': '11', 'двенадцать': '12', 'тринадцать': '13',
        'четырнадцать': '14', 'пятнадцать': '15', 'шестнадцать': '16', 'семнадцать': '17',
        'восемнадцать': '18', 'девятнадцать': '19',
        'двадцать': '20', 'тридцать': '30', 'сорок': '40', 'пятьдесят': '50',
        'шестьдесят': '60', 'семьдесят': '70', 'восемьдесят': '80', 'девяносто': '90',
        'сто': '00', 'тысяча': '000', 'двойной': '2x', 'тройной': '3x',

        // Ukrainian
        'нуль': '0', 'один': '1', 'одна': '1', 'два': '2', 'дві': '2', 'три': '3',
        'чотири': '4', 'п\'ять': '5', 'пять': '5', 'шість': '6', 'сім': '7',
        'вісім': '8', 'дев\'ять': '9', 'девять': '9', 'десять': '10',
        'одинадцять': '11', 'дванадцять': '12', 'тринадцять': '13', 'чотирнадцять': '14',
        'п\'ятнадцять': '15', 'пятнадцять': '15', 'шістнадцять': '16', 'сімнадцять': '17',
        'вісімнадцять': '18', 'дев\'ятнадцять': '19', 'девятнадцять': '19',
        'двадцять': '20', 'тридцять': '30', 'сорок': '40', 'п\'ятдесят': '50', 'пятдесят': '50',
        'шістдесят': '60', 'сімдесят': '70', 'вісімдесят': '80', 'дев\'яносто': '90', 'девяносто': '90',
        'сто': '00', 'тисяча': '000', 'подвійний': '2x', 'потрійний': '3x',

        // Arabic
        'صفر': '0', 'واحد': '1', 'واحدة': '1', 'اثنان': '2', 'اثنين': '2', 'ثلاثة': '3', 'تلاتة': '3',
        'أربعة': '4', 'اربعة': '4', 'خمسة': '5', 'ستة': '6', 'سبعة': '7', 'ثمانية': '8', 'تمانية': '8', 'تسعة': '9',
        'عشرة': '10', 'عشر': '10', 'أحد عشر': '11', 'اثنا عشر': '12', 'ثلاثة عشر': '13',
        'أربعة عشر': '14', 'خمسة عشر': '15', 'ستة عشر': '16', 'سبعة عشر': '17',
        'ثمانية عشر': '18', 'تسعة عشر': '19',
        'عشرون': '20', 'عشرين': '20', 'ثلاثون': '30', 'ثلاثين': '30',
        'أربعون': '40', 'اربعون': '40', 'أربعين': '40', 'اربعين': '40',
        'خمسون': '50', 'خمسين': '50', 'ستون': '60', 'ستين': '60',
        'سبعون': '70', 'سبعين': '70', 'ثمانون': '80', 'ثمانين': '80',
        'تسعون': '90', 'تسعين': '90', 'مائة': '00', 'مئة': '00', 'الف': '000', 'ألف': '000',
        'مزدوج': '2x',

        // Japanese / Chinese
        'ゼロ': '0', '零': '0', '〇': '0', '一': '1', '二': '2', '三': '3', '四': '4',
        '五': '5', '六': '6', '七': '7', '八': '8', '九': '9', '十': '10',
        'イチ': '1', 'ニ': '2', 'サン': '3', 'ヨン': '4', 'シ': '4', 'ゴ': '5',
        'ロク': '6', 'ナナ': '7', 'シチ': '7', 'ハチ': '8', 'キュウ': '9', 'ク': '9', 'ジュウ': '10',
        '十一': '11', '十二': '12', '十三': '13', '十四': '14', '十五': '15',
        '二十': '20', '三十': '30', '四十': '40', '五十': '50',
        '六十': '60', '七十': '70', '八十': '80', '九十': '90', '百': '00', '千': '000',

        // Korean
        '영': '0', '공': '0', '일': '1', '이': '2', '삼': '3', '사': '4',
        '오': '5', '육': '6', '칠': '7', '팔': '8', '구': '9', '십': '10',
        '십일': '11', '십이': '12', '이십': '20', '삼십': '30', '사십': '40',
        '오십': '50', '육십': '60', '칠십': '70', '팔십': '80', '구십': '90',
        '백': '00', '천': '000',
        '하나': '1', '둘': '2', '셋': '3', '넷': '4', '다섯': '5', '여섯': '6',
        '일곱': '7', '여덟': '8', '아홉': '9', '열': '10',
        '스물': '20', '서른': '30', '마흔': '40', '쉰': '50',

        // Turkish
        'sıfır': '0', 'sifir': '0', 'bir': '1', 'iki': '2', 'üç': '3', 'uc': '3',
        'dört': '4', 'dort': '4', 'beş': '5', 'bes': '5', 'altı': '6', 'alti': '6',
        'yedi': '7', 'sekiz': '8', 'dokuz': '9',
        'on': '10', 'on bir': '11', 'on iki': '12', 'on üç': '13', 'on dört': '14',
        'on beş': '15', 'on altı': '16', 'on yedi': '17', 'on sekiz': '18', 'on dokuz': '19',
        'yirmi': '20', 'otuz': '30', 'kırk': '40', 'kirk': '40', 'elli': '50',
        'altmış': '60', 'altmis': '60', 'yetmiş': '70', 'yetmis': '70',
        'seksen': '80', 'doksan': '90', 'yüz': '00', 'yuz': '00', 'bin': '000',
        'çift': '2x', 'cift': '2x',

        // Vietnamese
        'không': '0', 'khong': '0', 'một': '1', 'mot': '1', 'mốt': '1',
        'hai': '2', 'ba': '3', 'bốn': '4', 'bon': '4', 'tư': '4',
        'năm': '5', 'nam': '5', 'lăm': '5', 'sáu': '6', 'sau': '6',
        'bảy': '7', 'bay': '7', 'tám': '8', 'tam': '8', 'chín': '9', 'chin': '9',
        'mười': '10', 'muoi': '10', 'mười một': '11', 'mười hai': '12',
        'hai mươi': '20', 'ba mươi': '30', 'bốn mươi': '40', 'năm mươi': '50',
        'sáu mươi': '60', 'bảy mươi': '70', 'tám mươi': '80', 'chín mươi': '90',
        'trăm': '00', 'nghìn': '000', 'ngàn': '000',

        // Dutch
        'nul': '0', 'één': '1', 'een': '1', 'twee': '2', 'drie': '3', 'vier': '4',
        'vijf': '5', 'zes': '6', 'zeven': '7', 'acht': '8', 'negen': '9',
        'tien': '10', 'elf': '11', 'twaalf': '12', 'dertien': '13', 'veertien': '14',
        'vijftien': '15', 'zestien': '16', 'zeventien': '17', 'achttien': '18', 'negentien': '19',
        'twintig': '20', 'dertig': '30', 'veertig': '40', 'vijftig': '50',
        'zestig': '60', 'zeventig': '70', 'tachtig': '80', 'negentig': '90',
        'honderd': '00', 'duizend': '000', 'dubbel': '2x', 'driedubbel': '3x'
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
            // Normalize hyphens and numeral characters (e.g. "forty-two" -> "forty two")
            let normalized = normalizeNumeralCharacters(text.toLowerCase()).replace(/[-_]/g, ' ');
            let words = normalized.split(/\s+/).filter(Boolean);
            let out = [];

            const TENS = {
                // English
                'twenty': 20, 'thirty': 30, 'forty': 40, 'fifty': 50,
                'sixty': 60, 'seventy': 70, 'eighty': 80, 'ninety': 90,
                // Spanish
                'veinte': 20, 'treinta': 30, 'cuarenta': 40, 'cincuenta': 50,
                'sesenta': 60, 'setenta': 70, 'ochenta': 80, 'noventa': 90,
                // French
                'vingt': 20, 'trente': 30, 'quarante': 40, 'cinquante': 50,
                'soixante': 60,
                // Italian
                'venti': 20, 'trenta': 30, 'quaranta': 40, 'cinquanta': 50,
                'sessanta': 60, 'settanta': 70, 'ottanta': 80, 'noventa': 90,
                // Portuguese
                'vinte': 20, 'trinta': 30, 'quarenta': 40, 'cinquenta': 50,
                'sessenta': 60, 'setenta': 70, 'oitenta': 80, 'noventa': 90,
                // German
                'zwanzig': 20, 'dreißig': 30, 'dreissig': 30, 'vierzig': 40,
                'fünfzig': 50, 'fuenfzig': 50, 'sechzig': 60, 'siebzig': 70,
                'achtzig': 80, 'neunzig': 90,
                // Russian
                'двадцать': 20, 'тридцать': 30, 'сорок': 40, 'пятьдесят': 50,
                'шестьдесят': 60, 'семьдесят': 70, 'восемьдесят': 80, 'девяносто': 90,
                // Ukrainian
                'двадцять': 20, 'тридцять': 30, 'сорок': 40, 'п\'ятдесят': 50, 'пятдесят': 50,
                'шістдесят': 60, 'сімдесят': 70, 'вісімдесят': 80, 'дев\'яносто': 90,
                // Turkish
                'yirmi': 20, 'otuz': 30, 'kırk': 40, 'kirk': 40, 'elli': 50,
                'altmış': 60, 'altmis': 60, 'yetmiş': 70, 'yetmis': 70,
                'seksen': 80, 'doksan': 90,
                // Dutch
                'twintig': 20, 'dertig': 30, 'veertig': 40, 'vijftig': 50,
                'zestig': 60, 'zeventig': 70, 'tachtig': 80, 'negentig': 90
            };

            for (let i = 0; i < words.length; i++) {
                const w = words[i];

                // German inverted compounds: "zweiundvierzig" -> 40 + 2 = 42
                const deCompound = w.match(/^(.+)und(zwanzig|dreißig|dreissig|vierzig|fünfzig|fuenfzig|sechzig|siebzig|achtzig|neunzig)$/);
                if (deCompound) {
                    const u = deCompound[1] === 'ein' ? 1 : parseInt(MULTILINGUAL_DIGITS[deCompound[1]], 10);
                    const t = TENS[deCompound[2]];
                    if (!isNaN(u) && t) {
                        out.push((t + u).toString());
                        continue;
                    }
                }

                // Dutch inverted compounds: "tweeënveertig" -> 40 + 2 = 42
                const nlClean = w.replace(/ë/g, 'e');
                const nlCompound = nlClean.match(/^(.+)en(twintig|dertig|veertig|vijftig|zestig|zeventig|tachtig|negentig)$/);
                if (nlCompound) {
                    const u = nlCompound[1] === 'een' ? 1 : parseInt(MULTILINGUAL_DIGITS[nlCompound[1]], 10);
                    const t = TENS[nlCompound[2]];
                    if (!isNaN(u) && t) {
                        out.push((t + u).toString());
                        continue;
                    }
                }

                // Italian fused compounds: "quarantadue", "venticinque" -> 40 + 2 = 42
                const itCompound = w.match(/^(vent|trent|quarant|cinquant|sessant|settant|ottant|novant)[ia]?(uno|due|tre|quattro|cinque|sei|sette|otto|nove)$/);
                if (itCompound) {
                    const itTens = { 'vent': 20, 'trent': 30, 'quarant': 40, 'cinquant': 50, 'sessant': 60, 'settant': 70, 'ottant': 80, 'novant': 90 };
                    const t = itTens[itCompound[1]];
                    const u = parseInt(MULTILINGUAL_DIGITS[itCompound[2]], 10);
                    if (t && !isNaN(u)) {
                        out.push((t + u).toString());
                        continue;
                    }
                }

                // Compound multilingual tens + optional conjunction + units (e.g. "forty two", "cuarenta y dos", "quarenta e dois")
                if (TENS[w] !== undefined && i + 1 < words.length) {
                    let nextIdx = i + 1;
                    const nextW = words[nextIdx];
                    // Skip multilingual conjunctions: "y", "e", "et", "en", "und"
                    if (['y', 'e', 'et', 'en', 'und'].includes(nextW) && i + 2 < words.length) {
                        nextIdx = i + 2;
                    }
                    const targetWord = words[nextIdx];
                    const nextVal = parseInt(MULTILINGUAL_DIGITS[targetWord], 10);
                    if (!isNaN(nextVal) && nextVal >= 1 && nextVal <= 9) {
                        out.push((TENS[w] + nextVal).toString());
                        i = nextIdx;
                        continue;
                    }
                }

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

            const abortCtrl = new AbortController();
            const timeoutTimer = setTimeout(() => abortCtrl.abort(), 3500);

            let resp;
            try {
                resp = await fetch(this.llmUrl, {
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
                    }),
                    signal: abortCtrl.signal
                });
            } finally {
                clearTimeout(timeoutTimer);
            }

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

            if (ctx.setFlowState) {
                ctx.setFlowState('form_awaiting_confirmation');
            }

            if (ctx.speak) {
                await ctx.speak(prompt);
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
