/**
 * CorrectionHandler.js
 * 
 * Handles in-place delta modifications for the active field as well as
 * historical / cross-field corrections without disrupting the active field workflow.
 * Fully Generalized for All 15 Languages.
 */

(function () {
    'use strict';

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

        /**
         * Fast deterministic local regex delta patch
         * Generalized across all 15 languages
         */
        applyLocalRegexPatch(currentValue, instruction) {
            if (!currentValue || !instruction) return null;
            const strVal = currentValue.toString();
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

            // 3. Universal: Replace X with Y across languages:
            const escapeRegex = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

            // Structure A: <replace_verb> <old> <with_prep> <new>
            const replaceVerbs = '(?:replace|change|make|cambiar|cambia|reemplazar|reemplaza|changer|remplacer|ändern|ändere|ersetzen|ersetze|поменять|поменяй|заменить|замени|изменить|измени|змінити|sostituisci|mudar|trocar|değiştir|degistir|thay|đổi|바꿔|変更|直して|استبدل|بدل|غير|बदलो|बदल)';
            const withPreps = '(?:with|to|into|por|con|par|en|durch|mit|zu|на|в|con|para|ile|bằng|sang|로|に|ب|की\\s+जगह|के\\s+स्थान\\s+पर|से)';
            const replaceMatch = inst.match(new RegExp(`(?:^|[^\\p{L}\\p{M}\\p{N}])${replaceVerbs}\\s+([\\p{L}\\p{M}\\p{N}@\\.\\-_]+)\\s+${withPreps}\\s+([\\p{L}\\p{M}\\p{N}@\\.\\-_]+)`, 'iu'));
            if (replaceMatch) {
                const [, oldVal, newVal] = replaceMatch;
                if (strVal.toLowerCase().includes(oldVal.toLowerCase())) {
                    return strVal.replace(new RegExp(escapeRegex(oldVal), 'i'), newVal);
                }
            }

            // Structure B1: Prepositional <new> (instead of | en vez de | au lieu de | statt | вместо | ecc.) <old>
            const prepInstead = '(?:instead\\s+of|in\\s+place\\s+of|en\\s+vez\\s+de|au\\s+lieu\\s+de|statt|anstatt|вместо|замість|invece\\s+di|em\\s+vez\\s+de)';
            const prepMatch = inst.match(new RegExp(`([\\p{L}\\p{M}\\p{N}@\\.\\-_]+)\\s+${prepInstead}\\s+([\\p{L}\\p{M}\\p{N}@\\.\\-_]+)`, 'iu'));
            if (prepMatch) {
                const [, newVal, oldVal] = prepMatch;
                if (strVal.toLowerCase().includes(oldVal.toLowerCase())) {
                    return strVal.replace(new RegExp(escapeRegex(oldVal), 'i'), newVal);
                }
            }

            // Structure B2: Postpositional <old> (की जगह | के स्थान पर | yerine | thay vì | 대신에 | の代わりに | بدلا من) <new>
            const postInstead = '(?:की\\s+जगह|के\\s+स्थान\\s+पर|नहीं|yerine|thay\\s+vì|대신에|의\\s+대신에|の代わりに|بدلا\\s+من)';
            const postMatch = inst.match(new RegExp(`([\\p{L}\\p{M}\\p{N}@\\.\\-_]+)\\s+${postInstead}\\s+([\\p{L}\\p{M}\\p{N}@\\.\\-_]+)`, 'iu'));
            if (postMatch) {
                const [, oldVal, newVal] = postMatch;
                if (strVal.toLowerCase().includes(oldVal.toLowerCase())) {
                    return strVal.replace(new RegExp(escapeRegex(oldVal), 'i'), newVal);
                }
            }

            // 4. Universal: Last digit is Y
            const lastDigitMatch = inst.match(/(?:last\s+digit|last\s+number|último\s+dígito|dernier\s+chiffre|letzte\s+ziffer|последняя\s+цифра|остання\s+цифра|son\s+basamak|chữ\s+số\s+cuối|마지막\s+숫자|最後の数字|الرقم\s+الأخير|आखिरी\s+अंक|अंतिम\s+अंक)\s*(?:is|should\s+be|es|est|ist|это|dir|là|होगा|करो|है)?\s*(\d)/iu);
            if (lastDigitMatch && /\d$/.test(strVal)) {
                return strVal.replace(/\d$/, lastDigitMatch[1]);
            }

            return null;
        }

        /**
         * Correct field using Multilingual LLM (Gemma 4 / LFM proxy)
         */
        async correctWithLLM(fieldLabel, currentValue, instruction) {
            const cleanOriginal = (currentValue || '').toString().trim();
            const cleanInstruction = (instruction || '').toString().trim();

            console.log(`[CorrectionHandler] Calling LLM for correction: field="${fieldLabel}" orig="${cleanOriginal}" instr="${cleanInstruction}"`);

            const isNumeric = this.isNumericField(fieldLabel);

            const prompts = (typeof window !== 'undefined' && window.i18n) ? window.i18n.getPrompts() : {};
            const system = prompts.correctorSystem || 'You are an expert form field correction assistant. You are given a form field label, its previous value, and a user spoken correction instruction in any language. Apply the instruction to modify the previous value. Output ONLY the resulting corrected value without quotation marks, labels, or explanatory text.';
            const user = prompts.correctorUser ? prompts.correctorUser(fieldLabel, cleanOriginal, cleanInstruction) : `Field: ${fieldLabel}\nPrevious Value: ${cleanOriginal}\nCorrection Instruction: "${cleanInstruction}"\nCorrected Value:`;

            try {
                const resp = await fetch(this.llmUrl, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        messages: [
                            { role: 'system', content: system },
                            { role: 'user', content: user }
                        ],
                        temperature: 0.1,
                        max_tokens: 120,
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

                if (content && content !== cleanOriginal) {
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

            console.log(`[CorrectionHandler] Applying correction to active field #${currentFieldIndex} ("${currentField?.label}"): "${instruction}"`);

            // 1. Try instant deterministic local patch
            let corrected = this.applyLocalRegexPatch(pendingFieldValue, instruction);

            // 2. Fallback to LLM patch
            if (!corrected) {
                corrected = await this.correctWithLLM(currentField?.label || '', pendingFieldValue, instruction);
            }

            // 3. Fallback: If user spoke a whole new value or correction failed to parse
            if (!corrected && ctx.informationHandler) {
                corrected = await ctx.informationHandler.processValue(instruction, currentField);
            }

            if (!corrected || corrected === pendingFieldValue) {
                console.warn('[CorrectionHandler] Could not compute new corrected value, asking user to clarify fresh value');
                if (ctx.setFlowState) ctx.setFlowState('form_awaiting_input');
                const askClarify = dict.clarifyValue
                    ? dict.clarifyValue(currentField?.label)
                    : `Please restate the value for ${currentField?.label}.`;
                if (ctx.speak) await ctx.speak(askClarify);
                return;
            }

            console.log(`[CorrectionHandler] Value corrected: "${pendingFieldValue}" -> "${corrected}"`);
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
                corrected = await this.correctWithLLM(targetField.label, existingVal, instruction);
            }
            if (!corrected && ctx.informationHandler) {
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
