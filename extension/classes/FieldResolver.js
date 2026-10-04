/**
 * FieldResolver.js
 * 
 * Semantic, Synonym, and Ordinal DOM Field Matching Engine.
 * Resolves spoken natural language targets (e.g. "सातवाँ फ़ील्ड", "go to mobile number",
 * "स्थायी पता", "next field", "skip to email") to concrete scanned form fields.
 */

(function () {
    'use strict';

    // Multilingual Ordinal Lookups (0-indexed) across major languages
    const ORDINAL_MAP = {
        // English
        'first': 0, '1st': 0,
        'second': 1, '2nd': 1,
        'third': 2, '3rd': 2,
        'fourth': 3, '4th': 3,
        'fifth': 4, '5th': 4,
        'sixth': 5, '6th': 5,
        'seventh': 6, '7th': 6,
        'eighth': 7, '8th': 7,
        'ninth': 8, '9th': 8,
        'tenth': 9, '10th': 9,
        'eleventh': 10, '11th': 10,
        'twelfth': 11, '12th': 11,
        'thirteenth': 12, '13th': 12,
        'fourteenth': 13, '14th': 13,
        'fifteenth': 14, '15th': 14,
        'sixteenth': 15, '16th': 15,
        'seventeenth': 16, '17th': 16,
        'eighteenth': 17, '18th': 17,
        'nineteenth': 18, '19th': 18,
        'twentieth': 19, '20th': 19,

        // Hindi
        'पहला': 0, 'पहली': 0, 'प्रथम': 0,
        'दूसरा': 1, 'दूसरी': 1, 'द्वितीय': 1,
        'तीसरा': 2, 'तीसरी': 2, 'तृतीय': 2,
        'चौथा': 3, 'चौथी': 3, 'चतुर्थ': 3,
        'पांचवां': 4, 'पांचवीं': 4, 'पाँचवाँ': 4, 'पाँचवीं': 4, 'पंचम': 4,
        'छठा': 5, 'छठी': 5, 'षष्ठ': 5,
        'सातवां': 6, 'सातवीं': 6, 'सातवाँ': 6, 'सातवीं': 6, 'सप्तम': 6,
        'आठवां': 7, 'आठवीं': 7, 'आठवाँ': 7, 'आठवीं': 7, 'अष्टम': 7,
        'नवां': 8, 'नवी': 8, 'नवीं': 8, 'नवाँ': 8, 'नवम': 8,
        'दसवां': 9, 'दसवीं': 9, 'दसवाँ': 9, 'दसवीं': 9, 'दशम': 9,
        'ग्यारहवां': 10, 'ग्यारहवीं': 10,
        'बारहवां': 11, 'बारहवीं': 11,
        'तेरहवां': 12, 'तेरहवीं': 12,
        'चौदहवां': 13, 'चौदहवीं': 13,
        'पंद्रहवां': 14, 'पंद्रहवीं': 14,

        // Spanish
        'primero': 0, 'primera': 0, 'primer': 0, '1º': 0, '1ª': 0,
        'segundo': 1, 'segunda': 1, '2º': 1, '2ª': 1,
        'tercero': 2, 'tercera': 2, 'tercer': 2, '3º': 2, '3ª': 2,
        'cuarto': 3, 'cuarta': 3, '4º': 3, '4ª': 3,
        'quinto': 4, 'quinta': 4, '5º': 4, '5ª': 4,
        'sexto': 5, 'sexta': 5,
        'séptimo': 6, 'séptima': 6, 'septimo': 6, 'septima': 6,
        'octavo': 7, 'octava': 7,
        'noveno': 8, 'novena': 8,
        'décimo': 9, 'décima': 9, 'decimo': 9, 'decima': 9,

        // French
        'premier': 0, 'première': 0, 'premiere': 0, '1er': 0, '1ère': 0,
        'deuxième': 1, 'deuxieme': 1, '2ème': 1, 'second': 1, 'seconde': 1,
        'troisième': 2, 'troisieme': 2, '3ème': 2,
        'quatrième': 3, 'quatrieme': 3, '4ème': 3,
        'cinquième': 4, 'cinquieme': 4, '5ème': 4,
        'sixième': 5, 'sixieme': 5,
        'septième': 6, 'septieme': 6,
        'huitième': 7, 'huitieme': 7,
        'neuvième': 8, 'neuvieme': 8,
        'dixième': 9, 'dixieme': 9,

        // German
        'erste': 0, 'erster': 0, 'erstes': 0, '1te': 0,
        'zweite': 1, 'zweiter': 1, 'zweites': 1, '2te': 1,
        'dritte': 2, 'dritter': 2, 'drittes': 2, '3te': 2,
        'vierte': 3, 'vierter': 3, 'viertes': 3,
        'fünfte': 4, 'fünfter': 4, 'fünftes': 4,
        'sechste': 5, 'sechster': 5,
        'siebte': 6, 'siebter': 6,
        'achte': 7, 'achter': 7,
        'neunte': 8, 'neunter': 8,
        'zehnte': 9, 'zehnter': 9,

        // Japanese
        '最初': 0, '一番目': 0, '1番目': 0, '1番': 0,
        '二番目': 1, '2番目': 1, '2番': 1,
        '三番目': 2, '3番目': 2, '3番': 2,
        '四番目': 3, '4番目': 3, '4番': 3,
        '五番目': 4, '5番目': 4, '5番': 4,
        '六番目': 5, '6番目': 5,
        '七番目': 6, '7番目': 6,
        '八番目': 7, '8番目': 7,
        '九番目': 8, '9番目': 8,
        '十番目': 9, '10番目': 9,

        // Russian
        'первый': 0, 'первая': 0, 'первое': 0,
        'второй': 1, 'вторая': 1, 'второе': 1,
        'третий': 2, 'третья': 2, 'третье': 2,
        'четвертый': 3, 'четвертая': 3,
        'пятый': 4, 'пятая': 4,
        'шестой': 5, 'шестая': 5,
        'седьмой': 6, 'седьмая': 6,
        'восьмой': 7, 'восьмая': 7,
        'девятый': 8, 'девятая': 8,
        'десятый': 9, 'десятая': 9,

        // Arabic
        'الأول': 0, 'الأولى': 0, 'الاول': 0, 'الاولى': 0,
        'الثاني': 1, 'الثانية': 1,
        'الثالث': 2, 'الثالثة': 2,
        'الرابع': 3, 'الرابعة': 3,
        'الخامس': 4, 'الخامسة': 4,
        'السادس': 5, 'السادسة': 5,
        'السابع': 6, 'السابعة': 6,
        'الثامن': 7, 'الثامنة': 7,
        'التاسع': 8, 'التاسعة': 8,
        'العاشر': 9, 'العاشرة': 9,

        // Portuguese & Italian
        'primo': 0, 'prima': 0, 'primeiro': 0, 'primeira': 0, '1º': 0, '1ª': 0,
        'secondo': 1, 'seconda': 1, 'segundo': 1, 'segunda': 1, '2º': 1, '2ª': 1,
        'terzo': 2, 'terza': 2, 'terceiro': 2, 'terceira': 2, '3º': 2, '3ª': 2,
        'quarto': 3, 'quarta': 3, '4º': 3, '4ª': 3,
        'quinto': 4, 'quinta': 4, '5º': 4, '5ª': 4,
        'sesto': 5, 'sesta': 5, 'sexto': 5, 'sexta': 5,
        'settimo': 6, 'settima': 6, 'sétimo': 6, 'sétima': 6,
        'ottavo': 7, 'ottava': 7, 'oitavo': 7, 'oitava': 7,
        'nono': 8, 'nona': 8,
        'decimo': 9, 'decima': 9, 'décimo': 9, 'décima': 9,

        // Dutch
        'eerste': 0, 'tweede': 1, 'derde': 2, 'vierde': 3, 'vijfde': 4,
        'zesde': 5, 'zevende': 6, 'achtste': 7, 'negende': 8, 'tiende': 9,

        // Turkish
        'birinci': 0, 'ikinci': 1, 'üçüncü': 2, 'dördüncü': 3, 'beşinci': 4,
        'altıncı': 5, 'yedinci': 6, 'sekizinci': 7, 'dokuzuncu': 8, 'onuncu': 9,

        // Vietnamese
        'thứ nhất': 0, 'thứ một': 0, 'thứ hai': 1, 'thứ ba': 2, 'thứ tư': 3,
        'thứ bốn': 3, 'thứ năm': 4, 'thứ sáu': 5, 'thứ bảy': 6, 'thứ tám': 7,
        'thứ chín': 8, 'thứ mười': 9,

        // Korean
        '첫번째': 0, '첫째': 0, '두번째': 1, '둘째': 1, '세번째': 2, '셋째': 2,
        '네번째': 3, '넷째': 3, '다섯번째': 4, '여섯번째': 5, '일곱번째': 6,
        '여덟번째': 7, '아홉번째': 8, '열번째': 9,

        // Ukrainian
        'перший': 0, 'перша': 0, 'перше': 0,
        'другий': 1, 'друга': 1, 'друге': 1,
        'третій': 2, 'третя': 2, 'третє': 2,
        'четвертий': 3, 'четверта': 3,
        'п\'ятий': 4, 'п\'ята': 4,
        'шостий': 5, 'шоста': 5,
        'сьомий': 6, 'сьома': 6,
        'восьмий': 7, 'восьма': 7,
        'дев\'ятий': 8, 'дев\'ята': 8,
        'десятий': 9, 'десята': 9
    };

    // Semantic Synonym Categories across multiple languages
    const FIELD_SYNONYMS = {
        address: [
            // English
            'address', 'residence', 'permanent address', 'current address', 'residential address',
            'street', 'street address', 'house', 'locality', 'location', 'dwelling',
            // Hindi
            'पता', 'घर का पता', 'स्थायी पता', 'वर्तमान पता', 'निवास', 'निवास का पता', 'स्थान', 'गली',
            // Spanish
            'dirección', 'direccion', 'domicilio', 'residencia', 'calle', 'ubicación',
            // French
            'adresse', 'domicile', 'résidence', 'rue', 'lieu',
            // German
            'adresse', 'anschrift', 'wohnort', 'straße', 'strasse', 'wohnadresse',
            // Japanese
            '住所', '所在地', '現住所', '番地',
            // Russian
            'адрес', 'место жительства', 'прописка', 'улица',
            // Arabic
            'عنوان', 'محل الإقامة', 'الشارع', 'السكن',
            // Portuguese & Italian
            'endereço', 'endereco', 'indirizzo', 'residenza', 'via'
        ],
        name: [
            'name', 'full name', 'applicant name', 'candidate name', 'customer name', 'user name',
            'नाम', 'पूरा नाम', 'आवेदक का नाम', 'उम्मीदवार का नाम', 'व्यक्ति का नाम',
            'nombre', 'nombre completo', 'nom', 'nom complet', 'name', 'vollständiger name',
            '名前', '氏名', 'お名前', 'フルネーム', 'имя', 'полное имя', 'фио', 'اسم', 'الاسم الكامل',
            'nome', 'nome completo', 'nome e cognome'
        ],
        firstName: [
            'first name', 'given name', 'forename', 'पहला नाम', 'प्रथम नाम',
            'primer nombre', 'prénom', 'prenom', 'vorname', '名', 'имя', 'الاسم الأول', 'primeiro nome', 'nome'
        ],
        lastName: [
            'last name', 'surname', 'family name', 'उपनाम', 'अंतिम नाम', 'सरनेम',
            'apellido', 'apellidos', 'nom de famille', 'nachname', 'familienname', '姓', '苗字', 'фамилия', 'اللقب', 'اسم العائلة', 'sobrenome', 'cognome'
        ],
        email: [
            'email', 'e-mail', 'email address', 'e-mail address', 'mail id', 'mail',
            'ईमेल', 'ई-मेल', 'ईमेल पता', 'मेल आईडी', 'मेल',
            'correo', 'correo electrónico', 'correo electronico', 'courriel', 'adresse e-mail', 'e-mail-adresse',
            'メール', 'メールアドレス', 'электронная почта', 'эл почта', 'البريد الإلكتروني', 'correio eletrônico', 'indirizzo email'
        ],
        phone: [
            'phone', 'mobile', 'mobile number', 'phone number', 'contact', 'contact number', 'cell', 'cellphone', 'telephone', 'tel',
            'फ़ोन', 'फोन', 'मोबाइल', 'मोबाइल नंबर', 'फ़ोन नंबर', 'फोन नंबर', 'संपर्क', 'संपर्क नंबर', 'दूरभाष',
            'teléfono', 'telefono', 'móvil', 'movil', 'celular', 'número de teléfono',
            'téléphone', 'telephone', 'portable', 'numéro de téléphone', 'handynummer', 'telefonnummer',
            '電話', '電話番号', '携帯', '携帯電話', 'телефон', 'номер телефона', 'мобильный', 'هاتف', 'رقم الهاتف', 'جوال',
            'telefone', 'celular', 'cellulare', 'numero di telefono'
        ],
        aadhaar: [
            'aadhaar', 'aadhar', 'uid', 'aadhaar number', 'aadhar card', 'uidai',
            'आधार', 'आधार कार्ड', 'आधार संख्या', 'आधार नंबर', 'यूआईडी'
        ],
        pan: [
            'pan', 'pan card', 'pan number', 'पैन', 'पैन कार्ड', 'पैन नंबर', 'पैन संख्या'
        ],
        pincode: [
            'pincode', 'pin code', 'zip', 'zipcode', 'zip code', 'postal code', 'post code',
            'पिन', 'पिन कोड', 'पिनकोड', 'ज़िप कोड', 'जिप कोड', 'डाक कोड', 'डाक घर कोड',
            'código postal', 'codigo postal', 'code postal', 'postleitzahl', 'plz', '郵便番号', 'почтовый индекс', 'индекс', 'الرمز البريدي', 'cep', 'codice postale'
        ],
        city: [
            'city', 'town', 'district', 'municipality', 'शहर', 'ज़िला', 'जिला', 'नगर', 'कस्बा',
            'ciudad', 'municipio', 'ville', 'commune', 'stadt', 'ort', '市', '市区町村', 'город', 'مدينة', 'cidade', 'città'
        ],
        state: [
            'state', 'province', 'region', 'राज्य', 'प्रांत', 'प्रदेश',
            'estado', 'provincia', 'région', 'region', 'bundesland', '都道府県', 'область', 'регион', 'ولاية', 'محافظة', 'regione'
        ],
        country: [
            'country', 'nation', 'nationality', 'देश', 'राष्ट्र', 'राष्ट्रीयता',
            'país', 'pais', 'nacionalidad', 'pays', 'nationalité', 'land', 'staat', '国', '国籍', 'страна', 'гражданство', 'بلد', 'دولة', 'nazione'
        ],
        gender: [
            'gender', 'sex', 'लिंग',
            'género', 'genero', 'sexo', 'genre', 'sexe', 'geschlecht', '性別', 'пол', 'الجنس', 'gênero', 'genere'
        ],
        dob: [
            'dob', 'date of birth', 'birth date', 'birthday',
            'जन्म तिथि', 'जन्म तारीख', 'जन्मदिन', 'तारीख-ए-पैदाइश',
            'fecha de nacimiento', 'cumpleaños', 'date de naissance', 'anniversaire', 'geburtsdatum',
            '生年月日', '誕生日', 'дата рождения', 'день рождения', 'تاريخ الميلاد', 'data de nascimento', 'data di nascita'
        ],
        age: [
            'age', 'years', 'उम्र', 'आयु', 'वर्ष', 'edad', 'âge', 'alter', '年齢', 'возраст', 'العمر', 'idade', 'età'
        ],
        fatherName: [
            'father', 'father name', "father's name", 'पिता', 'पिता का नाम', 'पिताजी का नाम', 'वालिद का नाम',
            'nombre del padre', 'nom du père', 'name des vaters', '父の名前', 'имя отца', 'اسم الأب', 'nome do pai'
        ],
        motherName: [
            'mother', 'mother name', "mother's name", 'माता', 'माता का नाम', 'माताजी का नाम', 'वालिदा का नाम',
            'nombre de la madre', 'nom de la mère', 'name der mutter', '母の名前', 'имя матери', 'اسم الأم', 'nome da mãe'
        ],
        occupation: [
            'occupation', 'profession', 'job', 'work', 'व्यवसाय', 'पेशा', 'काम', 'रोज़गार', 'रोजगार',
            'ocupación', 'ocupacion', 'profesión', 'profesion', 'trabajo', 'métier', 'profession', 'travail', 'beruf', 'tätigkeit',
            '職業', 'お仕事', 'профессия', 'работа', 'المهنة', 'الوظيفة', 'profissão', 'occupazione', 'lavoro'
        ]
    };

    // Navigation and Jump trigger keywords across languages
    const NAV_VERBS = [
        'go to', 'jump to', 'skip to', 'move to', 'switch to', 'navigate to', 'take me to', 'open', 'focus on', 'fill', 'edit',
        'ir a', 'salta a', 'pasa a', 've a', 'abrir',
        'aller à', 'passer à', 'ouvrir',
        'gehe zu', 'springe zu', 'öffne',
        'перейти к', 'перейти на', 'открой',
        'انتقل إلى', 'افتح', 'اذهب إلى',
        'ir para', 'vai a', 'passa a', 'apri',
        'へ移動', 'に行く', 'を開く', 'に飛ぶ',
        'पर जाओ', 'पर चलो', 'में जाओ', 'चलो', 'खोलो', 'दिखाओ', 'जाएं', 'चलें', 'पहुंचो'
    ];

    class FieldResolver {
        constructor() {
            this.synonyms = FIELD_SYNONYMS;
            this.ordinalMap = ORDINAL_MAP;
        }

        /**
         * Clean and normalize a string for comparison.
         */
        normalize(str) {
            if (!str) return '';
            return str
                .toLowerCase()
                .replace(/[\*:\-_\/\(\)\[\]"'`]/g, ' ')
                .replace(/[।.,!?]+/g, ' ')
                .replace(/\s+/g, ' ')
                .trim();
        }

        /**
         * Compute token overlap / Jaccard similarity (0.0 to 1.0)
         */
        tokenSimilarity(strA, strB) {
            const tokensA = new Set(this.normalize(strA).split(/\s+/).filter(Boolean));
            const tokensB = new Set(this.normalize(strB).split(/\s+/).filter(Boolean));
            if (tokensA.size === 0 || tokensB.size === 0) return 0;

            let intersection = 0;
            tokensA.forEach(t => {
                if (tokensB.has(t)) intersection++;
            });

            const union = new Set([...tokensA, ...tokensB]).size;
            return intersection / union;
        }

        /**
         * Check if utterance matches an ordinal or direct index:
         * e.g., "seventh field", "field 3", "सातवां फ़ील्ड", "number 5"
         */
        parseOrdinalOrIndex(phrase, totalFields) {
            if (!phrase) return null;
            const norm = this.normalize(phrase);

            // 1. Direct digit match across languages:
            // "field 3", "campo 3", "champ 3", "feld 3", "#3", "3rd", "3番目", "3번째", etc.
            const fieldNouns = '(?:field|number|no|nr|input|box|campo|número|champ|numéro|feld|veld|nummer|pole|alan|öğe|bölüm|trường|حقل|رقم|поле|номер|फ़ील्ड|फील्ड|नंबर|संख्या|क्रमांक|필드|칸|항목|項目)';
            const numMatch = norm.match(new RegExp(`(?:${fieldNouns}|#)\\s*#?\\s*(\\d{1,3})`, 'i'))
                || norm.match(new RegExp(`(\\d{1,3})\\s*#?\\s*${fieldNouns}`, 'i'))
                || norm.match(/^#?\s*(\d{1,3})\s*(?:th|st|nd|rd|वा|वाँ|वां|वीं|番目|番|번째|e|er|ème|te|ste|º|ª)?\s*(?:field|campo|champ|feld|veld|alan|pole|फ़ील्ड|फील्ड|номер)?$/i);
            
            if (numMatch && (numMatch[1] || numMatch[2])) {
                const rawNum = numMatch[1] || numMatch[2];
                const idx = parseInt(rawNum, 10) - 1; // 1-indexed to 0-indexed
                if (idx >= 0 && idx < totalFields) {
                    return { index: idx, matchType: 'ordinal_digit', confidence: 0.98 };
                }
            }

            // 2. Word ordinals from ORDINAL_MAP:
            for (const [word, idx] of Object.entries(this.ordinalMap)) {
                if (idx < 0 || idx >= totalFields) continue;
                // Require either explicit ordinal context ("first field", "primer campo", "सातवां फ़ील्ड", "첫번째 필드") or isolated command
                const hasOrdinalNoun = new RegExp(`(?:^|\\s)${word}\\s*(?:${fieldNouns}|one)`, 'i').test(norm);
                const isIsolatedOrdinal = new RegExp(`^(?:(?:please\\s+|por\\s+favor\\s+|कृपया\\s+)?(?:go\\s+to|jump\\s+to|switch\\s+to|open|ir\\s+a|aller\\s+à|gehe\\s+zu|चलो|जाओ)\\s+)?${word}(?:\\s+(?:please|por\\s+favor))?$`, 'i').test(norm);

                if (hasOrdinalNoun || isIsolatedOrdinal) {
                    return { index: idx, matchType: 'ordinal_word', confidence: 0.95 };
                }
            }

            return null;
        }

        /**
         * Parse relative directives: "next", "previous", "first", "last" across languages
         */
        parseRelative(phrase, currentIdx, totalFields) {
            if (!phrase) return null;
            const norm = this.normalize(phrase);

            // Next
            if (/(?:^|[^\p{L}\p{M}\p{N}])(?:next|अगला|अगली|आगे|siguiente|suivant|weiter|nächste|nächstes|следующий|дальше|التالي|próximo|prossimo|volgende|sonraki|tiếp|次へ|次|다음)(?=[^\p{L}\p{M}\p{N}]|$)/u.test(norm)) {
                const nextIdx = currentIdx + 1;
                if (nextIdx < totalFields) {
                    return { index: nextIdx, matchType: 'relative_next', confidence: 0.95 };
                }
            }

            // Previous
            if (/(?:^|[^\p{L}\p{M}\p{N}])(?:previous|prev|back|पिछला|पिछली|पीछे|anterior|atrás|précédent|retour|zurück|vorherige|vorheriges|предыдущий|назад|السابق|precedente|indietro|vorige|önceki|geri|trước|前へ|前|이전|뒤로)(?=[^\p{L}\p{M}\p{N}]|$)/u.test(norm)) {
                const prevIdx = currentIdx - 1;
                if (prevIdx >= 0) {
                    return { index: prevIdx, matchType: 'relative_previous', confidence: 0.95 };
                }
            }

            // First
            if (/(?:^|[^\p{L}\p{M}\p{N}])(?:first|beginning|start|पहला|शुरुआत|primero|inicio|premier|début|erste|anfang|первый|начало|الأول|بداية|primeiro|primo|eerste|ilk|đầu tiên|最初|처음)(?=[^\p{L}\p{M}\p{N}]|$)/u.test(norm)) {
                return { index: 0, matchType: 'relative_first', confidence: 0.9 };
            }

            // Last field
            if (/(?:^|[^\p{L}\p{M}\p{N}])(?:last|end|final|आखिरी|अंतिम|अंत|último|final|dernier|fin|letzte|ende|последний|конец|الأخير|ultimo|laatste|einde|son|cuối cùng|最後|ラスト|마지막)(?=[^\p{L}\p{M}\p{N}]|$)/u.test(norm) &&
                !/(?:last\s+(?:digit|character|char|letter|number|name|word)|आखिरी\s+अंक|अंतिम\s+अंक|último\s+(?:dígito|número)|dernier\s+chiffre|letzte\s+ziffer)/i.test(norm)) {
                return { index: totalFields - 1, matchType: 'relative_last', confidence: 0.9 };
            }

            return null;
        }

        /**
         * Strip navigation verbs from spoken phrase to extract pure field query:
         * "go to address" -> "address"
         * "ve a dirección" -> "dirección"
         * "मोबाइल नंबर पर जाओ" -> "मोबाइल नंबर"
         */
        extractFieldQuery(phrase) {
            if (!phrase) return '';
            let q = this.normalize(phrase);

            // Strip navigation prefixes across languages
            q = q.replace(/^(?:please\s+|por\s+favor\s+|s'il\s+vous\s+plaît\s+|bitte\s+|कृपया\s+)?(?:go\s+to|jump\s+to|skip\s+to|move\s+to|navigate\s+to|switch\s+to|open|focus\s+on|ir\s+a|salta\s+a|pasa\s+a|ve\s+a|abrir|aller\s+à|passer\s+à|ouvrir|gehe\s+zu|springe\s+zu|öffne|перейти\s+к|перейти\s+на|открой|انتقل\s+إلى|افتح|اذهب\s+إلى|ir\s+para|vai\s+a|passa\s+a|apri|चलो\s+)?/i, '');

            // Strip navigation suffixes across languages
            q = q.replace(/(?:पर\s+जाओ|पर\s+चलो|में\s+जाओ|पर\s+जाएं|पर\s+चलें|खोलो|दिखाओ|へ移動|に行く|を開く|に飛ぶ)$/i, '');

            // Strip field nouns
            q = q.replace(/\s*(?:field|input|box|campo|champ|feld|pole|alan|फ़ील्ड|फील्ड|बॉक्स|フィールド|حقل|trường)$/i, '');

            return q.trim();
        }

        /**
         * Match field query against predefined synonym groups
         */
        findMatchingSynonymConcept(query) {
            const normQ = this.normalize(query);
            if (!normQ) return null;

            // 1. Exact match on an alias
            for (const [concept, aliases] of Object.entries(this.synonyms)) {
                for (const alias of aliases) {
                    if (normQ === this.normalize(alias)) {
                        return concept;
                    }
                }
            }

            // 2. Query contains alias or alias contains full-word query (longer alias matches first)
            let bestConcept = null;
            let longestMatch = 0;
            for (const [concept, aliases] of Object.entries(this.synonyms)) {
                for (const alias of aliases) {
                    const normAlias = this.normalize(alias);
                    if (!normAlias) continue;
                    const queryContainsAlias = normQ.includes(normAlias);
                    const aliasContainsQuery = normQ.length >= 4 && (
                        normAlias === normQ ||
                        normAlias.startsWith(normQ + ' ') ||
                        normAlias.endsWith(' ' + normQ) ||
                        normAlias.includes(' ' + normQ + ' ')
                    );
                    if (queryContainsAlias || aliasContainsQuery) {
                        if (normAlias.length > longestMatch) {
                            longestMatch = normAlias.length;
                            bestConcept = concept;
                        }
                    }
                }
            }
            return bestConcept;
        }

        /**
         * Disambiguate fields for concepts (e.g. Email Address vs Permanent Address)
         */
        isConceptEligible(field, queryConcept, query) {
            const fLabel = this.normalize(field.label || '');
            const normQ = this.normalize(query);

            // Avoid 'Email Address' matching 'address' unless user explicitly said email
            if (queryConcept === 'address') {
                const isEmailField = field.type === 'email' || (this.synonyms.email && this.synonyms.email.some(e => fLabel.includes(this.normalize(e))));
                const queryMentionsEmail = this.synonyms.email && this.synonyms.email.some(e => normQ.includes(this.normalize(e)));
                if (isEmailField && !queryMentionsEmail) {
                    return false;
                }
            }

            // Avoid 'Father's Name' / 'Mother's Name' matching generic 'name' unless user said father/mother
            if (queryConcept === 'name') {
                const parentPatterns = {
                    father: /(?:father|पिता|padre|père|vater|отец|батько|أب|pai|baba|cha|bố|부|父)/iu,
                    mother: /(?:mother|माता|madre|mère|mutter|мать|мати|أم|mãe|anne|mẹ|모|母)/iu
                };

                if (parentPatterns.father.test(fLabel) && !parentPatterns.father.test(normQ)) {
                    return false;
                }
                if (parentPatterns.mother.test(fLabel) && !parentPatterns.mother.test(normQ)) {
                    return false;
                }
            }

            return true;
        }

        /**
         * Core resolution method:
         * Given a spoken phrase and the list of scanned fields, resolve the target field index.
         * 
         * @param {string} phrase - Raw or cleaned user utterance
         * @param {Array<Object>} scannedFields - Array of field objects from form-field-scanner
         * @param {number} currentIdx - Current active field index
         * @returns {Object|null} { found: boolean, index: number, field: Object, matchType: string, confidence: number }
         */
        resolveTarget(phrase, scannedFields, currentIdx = 0) {
            if (!phrase || !Array.isArray(scannedFields) || scannedFields.length === 0) {
                return null;
            }

            const total = scannedFields.length;
            const normPhrase = this.normalize(phrase);

            // Layer 1: Ordinal or Direct Index ("field 4", "सातवाँ फ़ील्ड", "campo 3", "3番目")
            const ordMatch = this.parseOrdinalOrIndex(normPhrase, total);
            if (ordMatch) {
                return {
                    found: true,
                    index: ordMatch.index,
                    field: scannedFields[ordMatch.index],
                    matchType: ordMatch.matchType,
                    confidence: ordMatch.confidence
                };
            }

            // Layer 2: Relative directives ("next", "previous", "siguiente", "suivant", "weiter", "次へ", "last field")
            const relMatch = this.parseRelative(normPhrase, currentIdx, total);
            if (relMatch) {
                return {
                    found: true,
                    index: relMatch.index,
                    field: scannedFields[relMatch.index],
                    matchType: relMatch.matchType,
                    confidence: relMatch.confidence
                };
            }

            // Layer 3: Semantic & Label matching on extracted query (Named fields take precedence)
            const query = this.extractFieldQuery(normPhrase);
            const queryConcept = query ? this.findMatchingSynonymConcept(query) : null;

            if (query) {
                // 3a. Exact or Substring Match on Label (with eligibility filter)
                for (let i = 0; i < total; i++) {
                    const f = scannedFields[i];
                    if (queryConcept && !this.isConceptEligible(f, queryConcept, query)) continue;

                    const fLabel = this.normalize(f.label || '');
                    if (fLabel && (fLabel === query || fLabel.includes(query) || query.includes(fLabel))) {
                        return {
                            found: true,
                            index: i,
                            field: f,
                            matchType: 'exact_label',
                            confidence: 0.92
                        };
                    }
                }

                // 3b. Exact or Substring Match on placeholder / name / id / aria-label
                for (let i = 0; i < total; i++) {
                    const f = scannedFields[i];
                    if (queryConcept && !this.isConceptEligible(f, queryConcept, query)) continue;

                    const hints = [
                        f.name || '',
                        f.id || '',
                        f.selector || ''
                    ].map(h => this.normalize(h)).filter(Boolean);

                    for (const hint of hints) {
                        if (hint && (hint === query || hint.includes(query))) {
                            return {
                                found: true,
                                index: i,
                                field: f,
                                matchType: 'field_attribute',
                                confidence: 0.85
                            };
                        }
                    }
                }

                // 3c. Synonym Dictionary Match
                if (queryConcept && this.synonyms[queryConcept]) {
                    const aliases = this.synonyms[queryConcept];
                    for (let i = 0; i < total; i++) {
                        const f = scannedFields[i];
                        if (!this.isConceptEligible(f, queryConcept, query)) continue;

                        const fText = this.normalize(`${f.label || ''} ${f.name || ''} ${f.id || ''}`);
                        for (const alias of aliases) {
                            const normAlias = this.normalize(alias);
                            if (fText.includes(normAlias)) {
                                return {
                                    found: true,
                                    index: i,
                                    field: f,
                                    matchType: 'synonym_concept',
                                    concept: queryConcept,
                                    confidence: 0.88
                                };
                            }
                        }
                    }
                }
            }

            // 3d. Token Overlap / Jaccard Similarity Match
            let bestScore = 0;
            let bestIdx = -1;
            for (let i = 0; i < total; i++) {
                const f = scannedFields[i];
                const sim = Math.max(
                    this.tokenSimilarity(query, f.label || ''),
                    this.tokenSimilarity(query, f.name || ''),
                    this.tokenSimilarity(query, f.id || '')
                );
                if (sim > bestScore) {
                    bestScore = sim;
                    bestIdx = i;
                }
            }

            if (bestScore >= 0.5 && bestIdx !== -1) {
                return {
                    found: true,
                    index: bestIdx,
                    field: scannedFields[bestIdx],
                    matchType: 'fuzzy_similarity',
                    confidence: Math.min(0.85, bestScore)
                };
            }

            return null;
        }

        /**
         * Disambiguate value vs target navigation:
         * e.g., on "Address" field, "Address is 221B Baker Street" vs "Go to address"
         */
        isLikelyNavigationVsValue(phrase, activeField) {
            if (!phrase) return false;
            const norm = this.normalize(phrase);

            // Multilingual navigation prefixes and suffixes
            const startsWithNav = /^(?:go\s+to|jump\s+to|skip\s+to|move\s+to|switch\s+to|ir\s+a|salta\s+a|aller\s+à|gehe\s+zu|перейти\s+к|انتقل\s+إلى|vai\s+a|चलो|जाओ|ga\s+naar|đi\s+đến)/iu.test(norm);
            const endsWithNav = /(?:पर\s+जाओ|पर\s+चलो|खोलो|へ移動|に行く|로\s+이동)$/iu.test(norm);
            if (startsWithNav || endsWithNav) return true;

            // If active field is numeric and user said single digit, it's value, not jump
            if (activeField && /(?:phone|mobile|tel|pincode|postal|zip|aadhaar|ssn|age|number|digit|code|telefono|movil|celular|portable|número|numéro|nummer|फ़ोन|फोन|मोबाइल|पिन|आधार|संख्या|नंबर|उम्र|телефон|номер|رقم|電話|番号|전화|번호)/iu.test(activeField.label || '')) {
                if (/^\d{1,3}$/.test(norm)) return false;
            }

            return false;
        }
    }

    // Expose class globally for extension
    if (typeof window !== 'undefined') {
        window.FieldResolver = FieldResolver;
    }
    if (typeof module !== 'undefined' && module.exports) {
        module.exports = FieldResolver;
    }
})();
