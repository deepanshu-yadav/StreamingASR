/**
 * CorrectionHandler.js
 * 
 * Handles in-place delta modifications for the active field as well as
 * historical / cross-field corrections without disrupting the active field workflow.
 * Fully Generalized for All 15 Languages.
 */

(function () {
    'use strict';

    function normalizeSpokenEntities(str) {
        if (!str) return '';
        let s = str.toString()
            .replace(/<[a-zA-Z]{2,}(?:-[a-zA-Z0-9]+)?\s*>?/g, '')
            .replace(/<[^>]+>/g, '')
            .trim();

        // 1. English / French: "double e" -> "ee", "triple x" -> "xxx"
        s = s.replace(/\bdouble\s+([a-zA-Z0-9])\b/gi, (_, ch) => ch + ch);
        s = s.replace(/\btriple\s+([a-zA-Z0-9])\b/gi, (_, ch) => ch + ch + ch);

        // 2. Spanish: "doble e" -> "ee"
        s = s.replace(/\bdoble\s+([a-zA-Z0-9\u00C0-\u017F])\b/gi, (_, ch) => ch + ch);

        // 3. German: "doppel e" -> "ee"
        s = s.replace(/\bdoppel(?:t)?\s+([a-zA-Z0-9\u00C0-\u017F])\b/gi, (_, ch) => ch + ch);

        // 4. Italian: "doppia / doppio e" -> "ee"
        s = s.replace(/\bdoppi[oa]\s+([a-zA-Z0-9\u00C0-\u017F])\b/gi, (_, ch) => ch + ch);

        // 5. Portuguese: "duplo / duplos e" -> "ee"
        s = s.replace(/\bdupl[oa]s?\s+([a-zA-Z0-9\u00C0-\u017F])\b/gi, (_, ch) => ch + ch);

        // 6. Dutch: "dubbel / dubbele e" -> "ee"
        s = s.replace(/\bdubbel(?:e)?\s+([a-zA-Z0-9\u00C0-\u017F])\b/gi, (_, ch) => ch + ch);

        // 7. Russian: "две / двойная e" -> "ee"
        s = s.replace(/(?:две|двойная|дважды)\s+([a-zA-Z0-9а-яёА-ЯЁ])/gui, (_, ch) => ch + ch);

        // 8. Ukrainian: "дві / подвійна e" -> "ee"
        s = s.replace(/(?:дві|подвійна)\s+([a-zA-Z0-9а-яіїєґА-ЯІЇЄҐ])/gui, (_, ch) => ch + ch);

        // 9. Turkish: "çift e" -> "ee"
        s = s.replace(/(?:çift|cift)\s+([a-zA-Z0-9\u00C0-\u017F])/gui, (_, ch) => ch + ch);

        // 10. Vietnamese: "đôi e" -> "ee"
        s = s.replace(/(?:đôi|doi)\s+([a-zA-Z0-9\u00C0-\u1EF9])/gui, (_, ch) => ch + ch);

        // 11. Hindi: "डबल e" / "दो बार e" -> "ee"
        s = s.replace(/(?:^|[^\p{L}\p{N}])(?:डबल|दो\s+बार)\s+([a-zA-Z0-9\u0900-\u097F])/gu, (_, ch) => ch + ch);

        // 12. Japanese: "2つのe" / "二つのe" / "ダブルe" -> "ee"
        s = s.replace(/(?:2つの|二つの|ダブル)\s*([a-zA-Z0-9\u3040-\u30ff\u4e00-\u9faf])/g, (_, ch) => ch + ch);

        // 13. Korean: "더블 e" / "두 개의 e" -> "ee"
        s = s.replace(/(?:더블|두\s*개의?)\s*([a-zA-Z0-9\uAC00-\uD7A3])/gi, (_, ch) => ch + ch);

        // 14. Arabic: "مزدوج e" -> "ee"
        s = s.replace(/(?:^|[^\p{L}\p{N}])(?:مزدوج)\s*([a-zA-Z0-9\u0600-\u06FF])/gu, (_, ch) => ch + ch);

        return s;
    }

    function matchCase(originalSample, newText) {
        if (!originalSample || !newText) return newText;
        if (originalSample === originalSample.toLowerCase()) {
            if (newText.length === 1 && newText === newText.toUpperCase() && newText !== newText.toLowerCase()) {
                return newText.toLowerCase();
            }
            return newText;
        }
        if (originalSample === originalSample.toUpperCase()) {
            return newText.toUpperCase();
        }
        return newText;
    }

    const DEFAULT_CORRECTOR_SYSTEM = `You are a multilingual expert form field correction assistant.
Your job is to apply the user's spoken correction instruction in ANY language (English, Spanish, French, German, Hindi, Japanese, Russian, Arabic, Portuguese, Italian, Dutch, Turkish, Vietnamese, Korean, Ukrainian) to the Previous Value of a form field.
If there are multiple corrections in the instruction, apply ALL of them sequentially.

Capabilities & Guidelines:
1. Spelling & Letter Edits across languages:
   - Handle letter substitutions (e.g. "replace X with Y", "reemplaza X por Y", "remplacer X par Y", "ersetze X durch Y", "sostituisci X con Y", "troque X por Y", "X की जगह Y", "XをYに変更", "замени X на Y", "استبدل X بـ Y", "thay X bằng Y", "X yerine Y yap", "vervang X door Y", "X를 Y로 바꿔").
   - Handle letter duplications: "double / doble / doppel / deux / две / दो बार / çift <letter>" -> write that letter twice (e.g. "double e" -> "ee").
   - Adjust casing naturally to match the surrounding word (e.g. "Dipanchu" -> "Deepanshu").
2. Number & Digit Edits:
   - Digit positions, counts, append/prepend, and "last digit is Y" across all languages.
   - For numeric/phone/PIN fields, output ONLY digits.
3. Universal Multilingual Understanding:
   - Seamlessly understand natural spoken correction phrases in all 15 supported languages.

Examples:
Field: Name | Previous: Ron | Instruction: "replace o with oa" -> Roan
Field: Name | Previous: Dipanchu | Instruction: "for i replace with double e and c with s" -> Deepanshu
Field: Name | Previous: Carlos | Instruction: "cambiar o por a" -> Carlas
Field: Name | Previous: Jean | Instruction: "remplacer e par a" -> Jaan
Field: City | Previous: Berlan | Instruction: "ersetze a durch i" -> Berlin
Field: Name | Previous: Dipanchu | Instruction: "iをeeに、cをsに変更" -> Deepanshu
Field: Name | Previous: Dipanchu | Instruction: "замени i на ee и c на s" -> Deepanshu
Field: Phone | Previous: 9876543210 | Instruction: "dernière chiffre est 9" -> 9876543219
Field: PIN Code | Previous: 744441 | Instruction: "सात से पहले 1 आएगा और 4 सिर्फ 3 बार आएगा" -> 174441

Output ONLY the final clean value. No explanations or quotes.`;

    class CorrectionHandler {
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

        isNumericField(fieldLabel) {
            if (!fieldLabel) return false;
            const lbl = fieldLabel.toLowerCase();
            const resolver = this.fieldResolver || (typeof window !== 'undefined' ? window.fieldResolver : null);
            if (resolver && resolver.findMatchingSynonymConcept) {
                const c = resolver.findMatchingSynonymConcept(lbl);
                if (['phone', 'pincode', 'age', 'number'].includes(c)) return true;
            }
            return /(?:phone|mobile|cell|tel|pincode|postal|zip|aadhaar|aadhar|ssn|age|number|digit|code|telefono|movil|celular|portable|handynummer|telefonnummer|postleitzahl|adresse\s+postale|código\s+postal|code\s+postal|edad|âge|alter|número|numéro|nummer|फ़ोन|फोन|मोबाइल|पिन|आधार|संख्या|नंबर|उम्र|телефон|мобильный|индекс|возраст|номер|هاتف|جوال|بريدي|عمر|رقم|電話|携帯|郵便番号|年齢|番号|전화|휴대폰|우편번호|나이|번호|điện\s+thoại|di\s+động|bưu\s+chính|tuổi|số)/iu.test(lbl);
        }

        normalizeSpokenEntities(str) {
            return normalizeSpokenEntities(str);
        }

        isInstructionLike(text) {
            if (!text) return false;
            const lower = text.toLowerCase().trim();
            const keywords = [
                'replace', 'change', 'make', 'instead of', 'in place of', 'remove', 'add', 'fix', 'update', 'modify',
                'delete', 'put', 'set', 'double', 'triple', 'digit', 'letter', 'spelling', 'last digit', 'first digit',
                'बदलो', 'बदल', 'की जगह', 'के स्थान पर', 'हटाओ', 'हटा दो', 'सुधार', 'जोड़ो', 'जोड़ दो', 'अंक', 'संख्या', 'डबल',
                'cambiar', 'cambia', 'reemplazar', 'reemplaza', 'en vez de', 'quitar', 'corregir',
                'changer', 'remplacer', 'modifier', 'au lieu de', 'corriger', 'enlever',
                'ändern', 'ändere', 'ersetzen', 'ersetze', 'statt', 'entfernen',
                '変更', '変えて', '直して', 'の代わりに', '削除',
                'измени', 'исправь', 'поменяй', 'вместо', 'замени',
                'عدل', 'غير', 'بدل', 'تصحيح', 'بدلا من', 'احذف',
                'değiştir', 'düzelt', 'yerine', 'kaldır', 'vervang', 'wijzig', 'sostituisci', 'troque', 'trocar'
            ];
            return keywords.some(kw => lower.includes(kw));
        }

        /**
         * Fast deterministic local regex delta patch
         * Generalized across all 15 languages
         */
        applyLocalRegexPatch(currentValue, instruction) {
            if (!currentValue || !instruction) return null;
            let strVal = currentValue.toString();
            const inst = instruction.trim();

            // 1. Universal: Remove dot / punto / point / punkt / точка / डॉट
            if (/(?:remove\s+dot|quitar\s+punto|supprimer\s+point|punkt\s+entfernen|убрать\s+точку|видалити\s+крапку|noktayı\s+kaldır|bỏ\s+chấm|डॉट\s+हटा|डॉट\s+निकाल|احذف\s+النقطة|ドットを(?:削除|消して)|점을\s+지워)/iu.test(inst)) {
                if (strVal.includes('@')) {
                    const atIdx = strVal.indexOf('@');
                    const userPart = strVal.slice(0, atIdx);
                    const domainPart = strVal.slice(atIdx);
                    return userPart.replace(/\./g, '') + domainPart;
                }
                return strVal.replace(/\./g, '');
            }

            // 2. Universal: Remove spaces / espacios / espaces / leerzeichen / пробелы / स्पेस
            if (/(?:remove\s+spaces?|quitar\s+espacios?|supprimer\s+espaces?|leerzeichen\s+entfernen|убрать\s+пробелы|видалити\s+пробіли|boşlukları\s+kaldır|bỏ\s+khoảng\s+trắng|स्पेस\s+हटा|احذف\s+المسافات|スペースを(?:削除|消して)|공백을\s+지워)/iu.test(inst)) {
                return strVal.replace(/\s+/g, '');
            }

            // 3. Universal: Last digit is Y
            const lastDigitMatch = inst.match(/(?:last\s+digit|last\s+number|último\s+dígito|dernier\s+chiffre|letzte\s+ziffer|последняя\s+цифра|остання\s+цифра|son\s+basamak|chữ\s+số\s+cuối|마지막\s+숫자|最後の数字|الرقم\s+الأخير|आखिरी\s+अंक|अंतिम\s+अंक)\s*(?:is|should\s+be|es|est|ist|это|dir|là|होगा|करो|है)?\s*(\d)/iu);
            if (lastDigitMatch && /\d$/.test(strVal)) {
                return strVal.replace(/\d$/, lastDigitMatch[1]);
            }

            const norm = normalizeSpokenEntities(inst);
            const escapeRegex = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

            const articles = '(?:la|el|le|lo|il|l\'|l’|o|a|der|die|das|den|dem|het|de)';
            const replaceVerbs = '(?:replace|change|make|cambiar|cambia|reemplazar|reemplaza|changer|remplacer|mettre|ändern|ändere|ersetzen|ersetze|поменять|поменяй|заменить|замени|изменить|измени|змінити|заміни|замінити|sostituisci|mudar|trocar|troque|değiştir|degistir|thay|đổi|바꿔|変更|直して|استبدل|بدل|غير|बदलो|बदल|vervang|wijzig)';
            const withPreps = '(?:with|to|into|por|con|par|en|durch|mit|zu|на|в|con|para|ile|bằng|sang|로|에|に|بـ|ب|की\\s+जगह|के\\s+स्थान\\s+पर|से|door|naar)';

            // Split compound instructions connected by multilingual conjunctions ("and", "y", "et", "und", "и", "і", "ve", "và", "en", "और", "aur", "e", "و", "、", ";")
            const clauses = norm.split(/\s*(?:,\s*and\s+|\s+and\s+|,\s*aur\s+|\s+aur\s+|,\s*और\s+|\s+और\s+|,\s*y\s+|\s+y\s+|,\s*et\s+|\s+et\s+|,\s*und\s+|\s+und\s+|,\s*e\s+|\s+e\s+|,\s*и\s+|\s+и\s+|,\s*і\s+|\s+і\s+|,\s*ve\s+|\s+ve\s+|,\s*và\s+|\s+và\s+|,\s*en\s+|\s+en\s+|,\s*و\s+|\s+و\s+|、|;\s*)\s*/iu);

            let current = strVal;
            let modified = false;

            for (const clause of clauses) {
                let matchedClause = false;
                const cleanClause = clause.trim().replace(/[.,!?:;]+$/, '');
                const clauseArticles = '(?:the\\s+|la\\s+|el\\s+|le\\s+|das\\s+|un\\s+|une\\s+|a\\s+|an\\s+)?';

                // Sub-pattern A: Remove [the] <X> (at|in|from) the (end|back)
                const removeSuffixMatch = cleanClause.match(new RegExp('^(?:remove|delete|quitar|supprimer|entfernen|убрать|удалить|हटाओ|हटा\\s+दो)\\s+' + clauseArticles + '([^\\s]+)\\s+(?:at|in|from|del|al|à|am|в|से)?\\s*(?:the\\s+|la\\s+|le\\s+|das\\s+)?(?:end|back|final|fin|ende|конце|अंत|आखिरी|लास्ट)$', 'iu'));
                if (removeSuffixMatch) {
                    const target = removeSuffixMatch[1];
                    if (current.toLowerCase().endsWith(target.toLowerCase())) {
                        current = current.slice(0, current.length - target.length).trim();
                        matchedClause = true;
                        modified = true;
                    }
                }

                // Sub-pattern B: Remove [the] <X> (at|in|from) the (start|beginning|front)
                if (!matchedClause) {
                    const removePrefixMatch = cleanClause.match(new RegExp('^(?:remove|delete|quitar|supprimer|entfernen|убрать|удалить|हटाओ|हटा\\s+दो)\\s+' + clauseArticles + '([^\\s]+)\\s+(?:at|in|from|del|al|à|am|в|से)?\\s*(?:the\\s+|la\\s+|le\\s+|das\\s+)?(?:start|beginning|front|principio|début|anfang|начале|शुरुआत|पहले)$', 'iu'));
                    if (removePrefixMatch) {
                        const target = removePrefixMatch[1];
                        if (current.toLowerCase().startsWith(target.toLowerCase())) {
                            current = current.slice(target.length).trim();
                            matchedClause = true;
                            modified = true;
                        }
                    }
                }

                // Sub-pattern C: Remove last letter / character / digit
                if (!matchedClause) {
                    if (/^(?:remove|delete|quitar|supprimer|entfernen|убрать|हटाओ)\s+(?:the\s+)?last\s+(?:letter|character|char|alphabet|digit|अक्षर)$/iu.test(cleanClause)) {
                        current = current.slice(0, -1);
                        matchedClause = true;
                        modified = true;
                    }
                }

                // Sub-pattern D: Remove first letter / character / digit
                if (!matchedClause) {
                    if (/^(?:remove|delete|quitar|supprimer|entfernen|убрать|हटाओ)\s+(?:the\s+)?first\s+(?:letter|character|char|alphabet|digit|अक्षर)$/iu.test(cleanClause)) {
                        current = current.slice(1);
                        matchedClause = true;
                        modified = true;
                    }
                }

                // Sub-pattern E: Add <X> at the end / after it / append <X>
                if (!matchedClause) {
                    const addSuffixMatch = cleanClause.match(new RegExp('^(?:add|agrega|ajoute|füge|добавь|जोड़ो|जोड़\\s+दो)\\s+' + clauseArticles + '(.+?)\\s+(?:at\\s+the\\s+(?:end|back)|after\\s+(?:it|value)|al\\s+final|à\\s+la\\s+fin|am\\s+ende|в\\s+конце|बाद\\s+में|आखिरी\\s+में)$', 'iu'));
                    if (addSuffixMatch) {
                        current = current + ' ' + addSuffixMatch[1].trim();
                        matchedClause = true;
                        modified = true;
                    }
                }

                // Sub-pattern F: Add <X> before it / at the start / at the beginning / in front
                if (!matchedClause) {
                    const addPrefixMatch = cleanClause.match(new RegExp('^(?:add|prefix|agrega|ajoute|füge|добавь|जोड़ो|जोड़\\s+दो)\\s+' + clauseArticles + '(.+?)\\s+(?:before\\s+(?:it|value)|at\\s+the\\s+(?:start|beginning|front)|in\\s+front|al\\s+principio|au\\s+début|am\\s+anfang|в\\s+начале|पहले|आगे)$', 'iu'));
                    if (addPrefixMatch) {
                        current = addPrefixMatch[1].trim() + ' ' + current;
                        matchedClause = true;
                        modified = true;
                    }
                }

                // Sub-pattern G: Add <X> to it / Add <X>
                if (!matchedClause) {
                    const addToItMatch = cleanClause.match(new RegExp('^(?:add|agrega|ajoute|füge|добавь|जोड़ो|जोड़\\s+दो)\\s+' + clauseArticles + '(.+?)(?:\\s+(?:to\\s+it|to\\s+the\\s+value|में))?$', 'iu'));
                    if (addToItMatch) {
                        const val = addToItMatch[1].trim();
                        const isPrefixHonorific = /^(?:mr|mr\.|mrs|mrs\.|ms|ms\.|miss|mister|dr|dr\.|shri|smt|monsieur|madame|señor|señora|herr|frau|डॉक्टर|श्री|श्रीमती)$/i.test(val);
                        if (isPrefixHonorific) {
                            const cap = val.charAt(0).toUpperCase() + val.slice(1);
                            current = cap + ' ' + current;
                        } else {
                            current = current + ' ' + val;
                        }
                        matchedClause = true;
                        modified = true;
                    }
                }

                // Sub-pattern H: Direct remove substring: remove [the] <X>
                if (!matchedClause) {
                    const removeDirectMatch = cleanClause.match(new RegExp('^(?:remove|delete|quitar|supprimer|entfernen|убрать|удалить|हटाओ|हटा\\s+दो)\\s+' + clauseArticles + '([^\\s]+)$', 'iu'));
                    if (removeDirectMatch) {
                        const target = removeDirectMatch[1];
                        const regex = new RegExp(target.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'iu');
                        if (regex.test(current)) {
                            current = current.replace(regex, '').replace(/\\s+/g, ' ').trim();
                            matchedClause = true;
                            modified = true;
                        }
                    }
                }

                // Structure 1: for/in <old>[,] <replace_verb> (it)? <with_prep> <new>
                if (!matchedClause) {
                    const forPattern = new RegExp(`(?:^|[^\\p{L}\\p{M}\\p{N}])(?:for|in|en|dans|im|für|के\\s+लिए|per|para|için|trong|для)\\s+(?:${articles}\\s+)?([\\p{L}\\p{M}\\p{N}@\\.\\-_]+)[,\\s]+${replaceVerbs}\\s+(?:it\\s+|${articles}\\s+)?${withPreps}\\s+(?:${articles}\\s+)?([\\p{L}\\p{M}\\p{N}@\\.\\-_]+)`, 'iu');
                    const forMatch = clause.match(forPattern);
                    if (forMatch) {
                        const [, oldVal, newVal] = forMatch;
                        const esc = escapeRegex(oldVal);
                        const regex = new RegExp(esc, 'i');
                        const match = current.match(regex);
                        if (match) {
                            current = current.replace(regex, matchCase(match[0], newVal));
                            matchedClause = true;
                            modified = true;
                        }
                    }
                }

                // Structure 2: <replace_verb> (it)? (article)? <old> <with_prep> (article)? <new>
                if (!matchedClause) {
                    const replacePattern = new RegExp(`(?:^|[^\\p{L}\\p{M}\\p{N}])${replaceVerbs}\\s+(?:it\\s+|(?:${articles})\\s+)?([\\p{L}\\p{M}\\p{N}@\\.\\-_]+)\\s+${withPreps}\\s+(?:(?:${articles})\\s+)?([\\p{L}\\p{M}\\p{N}@\\.\\-_]+)`, 'iu');
                    const replaceMatch = clause.match(replacePattern);
                    if (replaceMatch) {
                        const [, oldVal, newVal] = replaceMatch;
                        const esc = escapeRegex(oldVal);
                        const regex = new RegExp(esc, 'i');
                        const match = current.match(regex);
                        if (match) {
                            current = current.replace(regex, matchCase(match[0], newVal));
                            matchedClause = true;
                            modified = true;
                        }
                    }
                }

                // Structure 3: Prepositional <new> (instead of | en vez de | au lieu de | statt) <old>
                if (!matchedClause) {
                    const prepInstead = '(?:instead\\s+of|in\\s+place\\s+of|en\\s+vez\\s+de|au\\s+lieu\\s+de|statt|anstatt|вместо|замість|invece\\s+di|em\\s+vez\\s+de|in\\s+plaats\\s+van)';
                    const prepMatch = clause.match(new RegExp(`([\\p{L}\\p{M}\\p{N}@\\.\\-_]+)\\s+${prepInstead}\\s+([\\p{L}\\p{M}\\p{N}@\\.\\-_]+)`, 'iu'));
                    if (prepMatch) {
                        const [, newVal, oldVal] = prepMatch;
                        const esc = escapeRegex(oldVal);
                        const regex = new RegExp(esc, 'i');
                        const match = current.match(regex);
                        if (match) {
                            current = current.replace(regex, matchCase(match[0], newVal));
                            matchedClause = true;
                            modified = true;
                        }
                    }
                }

                // Structure 4: Postpositional <old> (की जगह | के स्थान पर | yerine | thay vì | 대신에 | の代わりに | بدلا من | 을 | 를 | を | بـ | ب) <new>
                if (!matchedClause) {
                    const postPattern = new RegExp(`(?:(?:${articles})\\s+)?([\\p{L}\\p{M}\\p{N}@\\.\\-_]+)\\s*(?:की\\s+जगह|के\\s+स्थान\\s+पर|yerine|thay\\s+vì|대신에|의\\s+대신에|の代わりに|بدلا\\s+من|을|를|を|بـ|ب)\\s+(?:(?:${articles})\\s+)?([\\p{L}\\p{M}\\p{N}@\\.\\-_]+)(?:\\s*(?:${withPreps}|${replaceVerbs}|yap|करो|바꿔|に|変更))*`, 'iu');
                    const postMatch = clause.match(postPattern);
                    if (postMatch) {
                        const [, oldVal, newVal] = postMatch;
                        const esc = escapeRegex(oldVal);
                        const regex = new RegExp(esc, 'i');
                        const match = current.match(regex);
                        if (match) {
                            current = current.replace(regex, matchCase(match[0], newVal));
                            matchedClause = true;
                            modified = true;
                        }
                    }
                }

                // Structure 5: Elliptical clause: (article)? <old> <with_prep> (article)? <new>
                // e.g. "la c por s", "c with s", "c durch s", "c par s", "c na s", "c door s"
                if (!matchedClause) {
                    const ellipsisPat = new RegExp(`^(?:(?:${articles})\\s+)?([\\p{L}\\p{M}\\p{N}@\\.\\-_]+)\\s+${withPreps}\\s+(?:(?:${articles})\\s+)?([\\p{L}\\p{M}\\p{N}@\\.\\-_]+)$`, 'iu');
                    const elMatch = clause.match(ellipsisPat);
                    if (elMatch) {
                        const [, oldVal, newVal] = elMatch;
                        const esc = escapeRegex(oldVal);
                        const regex = new RegExp(esc, 'i');
                        const match = current.match(regex);
                        if (match) {
                            current = current.replace(regex, matchCase(match[0], newVal));
                            matchedClause = true;
                            modified = true;
                        }
                    }
                }
            }

            return modified ? current : null;
        }

        /**
         * Correct field using Multilingual LLM (Gemma 4 / LFM proxy)
         */
        async correctWithLLM(fieldLabel, currentValue, instruction, ctx = {}) {
            let cleanOriginal = (currentValue || '').toString().trim();
            if (!cleanOriginal && ctx.originalValue) {
                cleanOriginal = ctx.originalValue.toString().trim();
            }
            const cleanInstruction = (instruction || '').toString().trim();
            const normalizedInstruction = normalizeSpokenEntities(cleanInstruction);

            console.log(`[CorrectionHandler] Calling LLM for correction: field="${fieldLabel}" orig="${cleanOriginal}" instr="${cleanInstruction}"`);

            const isNumeric = this.isNumericField(fieldLabel);

            const prompts = (typeof window !== 'undefined' && window.i18n) ? window.i18n.getPrompts() : {};
            // Always ensure the rich system prompt with few-shot capabilities is used
            const system = (prompts.correctorSystem && prompts.correctorSystem.includes('Examples:'))
                ? prompts.correctorSystem
                : DEFAULT_CORRECTOR_SYSTEM;

            // Build user prompt, including previous correction history if present
            let userPrompt = '';
            if (ctx.correctionsHistory && ctx.correctionsHistory.length > 0) {
                const histLines = ctx.correctionsHistory.slice(-2).map(h => `Previous edit: "${h.instruction}" -> ${h.after}`).join('\n');
                userPrompt = `Field: ${fieldLabel}\nOriginal Value: ${ctx.originalValue || cleanOriginal}\n${histLines}\nCurrent Value: ${cleanOriginal}\nCorrection Instruction: "${normalizedInstruction}"\nCorrected Value:`;
            } else {
                userPrompt = `Field: ${fieldLabel}\nPrevious Value: ${cleanOriginal}\nCorrection Instruction: "${normalizedInstruction}"\nCorrected Value:`;
            }

            try {
                const resp = await fetch(this.llmUrl, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        messages: [
                            { role: 'system', content: system },
                            { role: 'user', content: userPrompt }
                        ],
                        temperature: 0.1,
                        max_tokens: 80,
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

                if (content && content.toLowerCase() !== cleanOriginal.toLowerCase()) {
                    return content;
                }
                return null;
            } catch (err) {
                console.warn('[CorrectionHandler] LLM correction error:', err);
                return null;
            }
        }

        /**
         * Apply correction to the currently active field
         */
        async applyCurrentFieldCorrection(instruction, ctx) {
            const { scannedFields, currentFieldIndex, pendingFieldValue } = ctx;
            const currentField = scannedFields[currentFieldIndex];
            const dict = this.getDict();

            const baseValue = pendingFieldValue
                || ctx.originalValue
                || (currentField && ctx.fieldValues?.[currentField.id]?.value)
                || currentField?.currentValue
                || '';

            console.log(`[CorrectionHandler] Applying correction to active field #${currentFieldIndex} ("${currentField?.label}"): baseValue="${baseValue}", instr="${instruction}"`);

            // 1. Try instant deterministic local patch (0ms)
            let corrected = this.applyLocalRegexPatch(baseValue, instruction);

            // 2. Fallback to LLM patch
            if (!corrected) {
                corrected = await this.correctWithLLM(currentField?.label || '', baseValue, instruction, ctx);
            }

            // 3. Fallback: If user spoke a whole new value directly (NOT a modification instruction)
            const isInstruction = this.isInstructionLike(instruction);
            if (!corrected && !isInstruction && ctx.informationHandler) {
                corrected = await ctx.informationHandler.processValue(instruction, currentField);
            }

            if (!corrected || corrected === baseValue) {
                console.warn('[CorrectionHandler] Could not compute new corrected value, asking user to clarify fresh value');
                if (ctx.setFlowState) ctx.setFlowState('form_awaiting_input');
                const askClarify = dict.clarifyValue
                    ? dict.clarifyValue(currentField?.label)
                    : `Please restate the value for ${currentField?.label}.`;
                if (ctx.speak) await ctx.speak(askClarify);
                return;
            }

            console.log(`[CorrectionHandler] Value corrected: "${baseValue}" -> "${corrected}"`);
            if (ctx.recordCorrection) {
                ctx.recordCorrection(baseValue, corrected, instruction);
            }
            ctx.setPendingValue(corrected);

            if (ctx.updateSpotlightPreview) {
                ctx.updateSpotlightPreview(corrected, 'confirming');
            }

            const prompt = dict.confirmCorrection
                ? dict.confirmCorrection(corrected)
                : `${corrected}. Is this correct?`;

            if (ctx.speak) await ctx.speak(prompt);
            if (ctx.setFlowState) ctx.setFlowState('form_awaiting_confirmation');
        }

        /**
         * Historical / Cross-Field Correction:
         * Mutates a previously filled field without breaking the current field workflow.
         */
        async applyHistoricalCorrection(targetIndex, instruction, ctx) {
            const { scannedFields, currentFieldIndex, fieldValues, tabId } = ctx;
            const targetField = scannedFields[targetIndex];
            const currentField = scannedFields[currentFieldIndex];
            const dict = this.getDict();

            if (!targetField) return;

            const existingVal = fieldValues[targetField.id]?.value || targetField.currentValue || '';
            console.log(`[CorrectionHandler] Historical correction for #${targetIndex} ("${targetField.label}"), prev="${existingVal}", instr="${instruction}"`);

            // Apply patch
            let corrected = this.applyLocalRegexPatch(existingVal, instruction);
            if (!corrected) {
                corrected = await this.correctWithLLM(targetField.label, existingVal, instruction, ctx);
            }
            const isInstruction = this.isInstructionLike(instruction);
            if (!corrected && !isInstruction && ctx.informationHandler) {
                corrected = await ctx.informationHandler.processValue(instruction, targetField);
            }

            if (!corrected) {
                const failNotice = `Could not update ${targetField.label}. Please repeat clearly.`;
                if (ctx.speak) await ctx.speak(failNotice);
                return;
            }

            // Update past field in state and DOM
            fieldValues[targetField.id] = {
                value: corrected,
                confirmed: true,
                tentative: false,
                timestamp: Date.now()
            };

            if (tabId && typeof chrome !== 'undefined' && chrome.tabs) {
                chrome.tabs.sendMessage(tabId, {
                    type: 'VFF_SET_FIELD_VALUE',
                    fieldId: targetField.id,
                    value: corrected
                }).catch(() => {});
            }

            if (ctx.renderScannedFieldsList) {
                ctx.renderScannedFieldsList();
            }

            // Inform user that past field was patched, and resume current field
            const announcement = dict.historicalFieldUpdated
                ? dict.historicalFieldUpdated(targetField.label, corrected, currentField?.label)
                : `${targetField.label} updated to ${corrected}. Continuing with ${currentField?.label}.`;

            if (ctx.speak) await ctx.speak(announcement);
        }
    }

    if (typeof window !== 'undefined') {
        window.CorrectionHandler = CorrectionHandler;
    }
    if (typeof module !== 'undefined' && module.exports) {
        module.exports = CorrectionHandler;
    }
})();
