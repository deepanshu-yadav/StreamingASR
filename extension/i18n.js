/**
 * i18n.js - Localization Manager for Voice Form Assistant
 * 
 * Manages active language state, DOM re-rendering with data-i18n attributes,
 * and exposes active prompts, dictation templates, and heuristics.
 */

(function () {
    class I18nManager {
        constructor() {
            this.locales = window.__LOCALES__ || {};
            this.currentLanguage = 'hi-IN'; // Default language
            this.listeners = [];
        }

        /**
         * Initialize language from storage or default
         */
        async init() {
            try {
                if (typeof chrome !== 'undefined' && chrome.storage && chrome.storage.local) {
                    const data = await chrome.storage.local.get('app_language');
                    if (data && data.app_language) {
                        let l = data.app_language;
                        if (l === 'hi' && this.locales['hi-IN']) l = 'hi-IN';
                        if (l === 'en' && this.locales['en-US']) l = 'en-US';
                        if (this.locales[l]) {
                            this.currentLanguage = l;
                        }
                    }
                }
            } catch (e) {
                console.warn('[i18n] Storage read failed, fallback to default:', e);
            }

            this.applyLanguageToDOM();
            return this.currentLanguage;
        }

        getLocale() {
            return this.locales[this.currentLanguage] || this.locales['hi-IN'] || this.locales['hi'] || this.locales['en-US'] || this.locales['en'];
        }

        getLanguage() {
            return this.currentLanguage;
        }

        /**
         * Change active language, persist, and update UI
         */
        async setLanguage(langCode, notifyListeners = true) {
            if (!this.locales[langCode]) {
                const alias = Object.keys(this.locales).find(k => k === langCode || k.startsWith(langCode + '-') || langCode.startsWith(k + '-'));
                if (alias) {
                    langCode = alias;
                } else {
                    console.error(`[i18n] Unknown language: "${langCode}"`);
                    return false;
                }
            }

            this.currentLanguage = langCode;

            try {
                if (typeof chrome !== 'undefined' && chrome.storage && chrome.storage.local) {
                    await chrome.storage.local.set({ app_language: langCode });
                }
            } catch (e) {
                console.warn('[i18n] Failed to persist language:', e);
            }

            this.applyLanguageToDOM();

            if (notifyListeners) {
                for (const fn of this.listeners) {
                    try { fn(langCode, this.getLocale()); } catch (err) { console.error(err); }
                }
            }
            return true;
        }

        onLanguageChange(fn) {
            if (typeof fn === 'function') {
                this.listeners.push(fn);
            }
        }

        /**
         * Translate a label key with optional template parameters {param}
         */
        t(key, params = {}) {
            const locale = this.getLocale();
            let text = locale?.labels?.[key] || key;
            for (const [k, v] of Object.entries(params)) {
                text = text.replace(new RegExp(`\\{${k}\\}`, 'g'), v);
            }
            return text;
        }

        getDictation() {
            return this.getLocale()?.dictation || {};
        }

        getPrompts() {
            return this.getLocale()?.prompts || {};
        }

        getHeuristics() {
            return this.getLocale()?.heuristics || {};
        }

        /**
         * Scans DOM elements with [data-i18n] and updates their contents
         */
        applyLanguageToDOM() {
            const locale = this.getLocale();
            if (!locale) return;

            document.documentElement.lang = locale.speechLang || this.currentLanguage;

            const elements = document.querySelectorAll('[data-i18n]');
            elements.forEach(el => {
                const key = el.getAttribute('data-i18n');
                const val = locale.labels?.[key];
                if (val !== undefined) {
                    if (el.hasAttribute('data-i18n-attr')) {
                        const attrName = el.getAttribute('data-i18n-attr');
                        el.setAttribute(attrName, val);
                    } else if (val.includes('<') && val.includes('>')) {
                        el.innerHTML = val;
                    } else {
                        el.textContent = val;
                    }
                }
            });

            // Update titles or placeholders specifically if specified
            document.querySelectorAll('[data-i18n-title]').forEach(el => {
                const key = el.getAttribute('data-i18n-title');
                const val = locale.labels?.[key];
                if (val !== undefined) el.setAttribute('title', val);
            });

            document.querySelectorAll('[data-i18n-placeholder]').forEach(el => {
                const key = el.getAttribute('data-i18n-placeholder');
                const val = locale.labels?.[key];
                if (val !== undefined) el.setAttribute('placeholder', val);
            });
        }
    }

    window.i18n = new I18nManager();
})();
