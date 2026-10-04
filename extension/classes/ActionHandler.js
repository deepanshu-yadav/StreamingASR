/**
 * ActionHandler.js
 * 
 * Manages Flow Control, Navigation, Jumps, Skips, Repeats, and Form Actions.
 * Decouples state machine transitions from the monolithic UI script.
 * Fully Generalized for All 15 Languages.
 */

(function () {
    'use strict';

    class ActionHandler {
        constructor() {}

        /**
         * Safely translates a string key using window.i18n
         */
        t(key, params = {}) {
            return window.i18n ? window.i18n.t(key, params) : key;
        }

        /**
         * Retrieves dictation voice templates from window.i18n
         */
        getDict() {
            return window.i18n ? window.i18n.getDictation() : {};
        }

        /**
         * Handle non-sequential Jump to a targeted field
         * 
         * @param {number} targetIndex - Target field index (0-based)
         * @param {Object} ctx - Controller context from sidepanel
         */
        async handleJump(targetIndex, ctx) {
            const { scannedFields, currentFieldIndex, fieldValues, pendingFieldValue, tabId } = ctx;

            if (targetIndex < 0 || targetIndex >= scannedFields.length) {
                console.warn(`[ActionHandler] Invalid target index ${targetIndex}`);
                return;
            }

            const currentField = scannedFields[currentFieldIndex];
            const targetField = scannedFields[targetIndex];
            const dict = this.getDict();

            console.log(`[ActionHandler] Jumping from #${currentFieldIndex} ("${currentField?.label}") to #${targetIndex} ("${targetField.label}")`);

            // Edge Case: Unconfirmed Abandonment
            let tentativeNotice = '';
            if (pendingFieldValue && currentField && (!fieldValues[currentField.id] || !fieldValues[currentField.id].confirmed)) {
                fieldValues[currentField.id] = {
                    value: pendingFieldValue,
                    confirmed: false,
                    tentative: true,
                    timestamp: Date.now()
                };

                // Update DOM on web page tentatively
                if (tabId && typeof chrome !== 'undefined' && chrome.tabs) {
                    chrome.tabs.sendMessage(tabId, {
                        type: 'VFF_SET_FIELD_VALUE',
                        fieldId: currentField.id,
                        value: pendingFieldValue
                    }).catch(() => {});
                }

                tentativeNotice = dict.tentativeSaved
                    ? dict.tentativeSaved(currentField.label, pendingFieldValue)
                    : `${currentField.label}: ${pendingFieldValue} saved. `;
            }

            // Focus and spotlight target field
            if (tabId && typeof chrome !== 'undefined' && chrome.tabs) {
                chrome.tabs.sendMessage(tabId, {
                    type: 'VFF_FOCUS_FIELD',
                    fieldId: targetField.id
                }).catch(() => {});
            }

            // Speak transition announcement
            const jumpAnnouncement = dict.jumpingToField
                ? dict.jumpingToField(targetField.label)
                : `Moving to ${targetField.label}.`;

            const fullPrompt = `${tentativeNotice}${jumpAnnouncement}`.trim();
            if (fullPrompt && ctx.speak) {
                await ctx.speak(fullPrompt);
            }

            // Transition active field index and re-ask
            if (ctx.askField) {
                await ctx.askField(targetIndex);
            }
        }

        /**
         * Handle Skip action: mark field skipped, clear value in DOM, and advance
         */
        async handleSkip(ctx) {
            const { scannedFields, currentFieldIndex, fieldValues } = ctx;
            const currentField = scannedFields[currentFieldIndex];
            const dict = this.getDict();

            console.log(`[ActionHandler] Skipping field #${currentFieldIndex} ("${currentField?.label}")`);

            if (currentField) {
                fieldValues[currentField.id] = {
                    ...(fieldValues[currentField.id] || {}),
                    skipped: true,
                    tentative: false,
                    value: '',
                    timestamp: Date.now()
                };
                if (ctx.tabId && typeof chrome !== 'undefined' && chrome.tabs) {
                    chrome.tabs.sendMessage(ctx.tabId, {
                        type: 'VFF_SET_FIELD_VALUE',
                        fieldId: currentField.id,
                        value: ''
                    }).catch(() => {});
                }
            }
            if (ctx.setPendingValue) {
                ctx.setPendingValue('');
            }

            const prompt = dict.fieldSkipped
                ? dict.fieldSkipped(currentField?.label)
                : `${currentField?.label || 'Field'} skipped.`;

            if (ctx.speak) {
                await ctx.speak(prompt);
            }

            // Advance to next unfulfilled field or finish
            let nextIndex = currentFieldIndex + 1;
            while (nextIndex < scannedFields.length && fieldValues[scannedFields[nextIndex].id]?.confirmed) {
                nextIndex++;
            }

            if (nextIndex < scannedFields.length) {
                if (ctx.askField) await ctx.askField(nextIndex);
            } else {
                // If reached end, check if any unconfirmed skipped field remains
                const remainingUnconfirmed = scannedFields.findIndex((f, idx) => idx !== currentFieldIndex && !fieldValues[f.id]?.confirmed);
                if (remainingUnconfirmed !== -1) {
                    if (ctx.askField) await ctx.askField(remainingUnconfirmed);
                } else if (ctx.finishFormFlow) {
                    await ctx.finishFormFlow();
                }
            }
        }

        /**
         * Handle Previous action: step back to predecessor field
         */
        async handlePrevious(ctx) {
            const { currentFieldIndex } = ctx;
            if (currentFieldIndex > 0) {
                if (ctx.askField) await ctx.askField(currentFieldIndex - 1);
            } else {
                if (ctx.showToast) ctx.showToast(this.t('firstFieldToast'));
                const dict = this.getDict();
                if (ctx.speak) {
                    await ctx.speak(dict.firstFieldSpoken || 'This is the first field.');
                }
            }
        }

        /**
         * Handle Repeat action: re-read active field question
         */
        async handleRepeat(ctx) {
            const { currentFieldIndex } = ctx;
            if (ctx.askField) {
                await ctx.askField(currentFieldIndex, true);
            }
        }

        /**
         * Handle Pause action: put session into sleep state
         */
        async handlePause(ctx) {
            console.log('[ActionHandler] Pausing voice session');
            const dict = this.getDict();
            const pauseMsg = dict.sessionPaused || 'Voice session paused. Say resume or your wake word to continue.';
            if (ctx.speak) {
                await ctx.speak(pauseMsg);
            }
            if (ctx.pauseSession) {
                ctx.pauseSession();
            }
        }

        /**
         * Handle Submit action: inspect missing required fields and confirm submission
         */
        async handleSubmit(ctx) {
            const { scannedFields, fieldValues } = ctx;
            const dict = this.getDict();

            // Check for missing required fields
            const missingRequired = scannedFields.filter(f => f.required && (!fieldValues[f.id] || !fieldValues[f.id].value));

            if (missingRequired.length > 0) {
                const missingLabels = missingRequired.map(f => f.label).join(', ');
                const warningMsg = dict.submitMissingWarning
                    ? dict.submitMissingWarning(missingLabels)
                    : `Required fields missing: ${missingLabels}. Please fill them first.`;

                if (ctx.speak) await ctx.speak(warningMsg);
                // Jump to first missing required field
                const firstMissingIdx = scannedFields.indexOf(missingRequired[0]);
                if (firstMissingIdx !== -1 && ctx.askField) {
                    await ctx.askField(firstMissingIdx);
                }
                return;
            }

            // All required filled
            const confirmMsg = dict.submitSuccess
                ? dict.submitSuccess()
                : 'All required fields completed. Ready to submit form.';

            if (ctx.speak) await ctx.speak(confirmMsg);
            if (ctx.finishFormFlow) await ctx.finishFormFlow();
        }
    }

    if (typeof window !== 'undefined') {
        window.ActionHandler = ActionHandler;
    }
    if (typeof module !== 'undefined' && module.exports) {
        module.exports = ActionHandler;
    }
})();
