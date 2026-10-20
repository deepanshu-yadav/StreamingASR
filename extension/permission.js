/**
 * permission.js
 * 
 * Separate JS file required by Chrome Manifest V3 CSP (no inline scripts allowed).
 * Requests microphone permission in a normal browser tab.
 * Fully localized according to selected language.
 */

document.addEventListener('DOMContentLoaded', async () => {
    const btn = document.getElementById('btnGrant');
    const success = document.getElementById('statusSuccess');
    const errDiv = document.getElementById('statusError');
    const siteSettingsLink = document.getElementById('siteSettingsLink');

    // 0. Initialize language from URL query param (?lang=xx) or chrome storage or default
    const urlParams = new URLSearchParams(window.location.search);
    const paramLang = urlParams.get('lang');

    if (window.i18n) {
        if (paramLang) {
            await window.i18n.setLanguage(paramLang.trim(), false);
        } else {
            await window.i18n.init();
        }
        const docTitle = window.i18n.t('permPageTitle');
        if (docTitle) document.title = docTitle;
    }

    const t = (k, p) => (window.i18n ? window.i18n.t(k, p) : k);

    if (siteSettingsLink) {
        siteSettingsLink.addEventListener('click', (e) => {
            e.preventDefault();
            const extId = chrome.runtime.id;
            chrome.tabs.create({ url: `chrome://settings/content/siteDetails?site=chrome-extension%3A%2F%2F${extId}` });
        });
    }

    async function requestMic() {
        if (btn) btn.disabled = true;
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
            stream.getTracks().forEach(t => t.stop());

            if (btn) btn.style.display = 'none';
            if (success) success.style.display = 'block';
            if (errDiv) errDiv.style.display = 'none';

            // Auto close after 2.5 seconds
            setTimeout(() => {
                window.close();
            }, 2500);
        } catch (err) {
            console.error('[Permission Error]:', err);
            if (btn) btn.disabled = false;
            if (errDiv) {
                errDiv.style.display = 'block';
                errDiv.innerHTML = t('permErrorAlt', { error: err.message }) || `Error: ${err.message}`;
            }
        }
    }

    if (btn) {
        btn.addEventListener('click', requestMic);
    }

    // Auto-request on load
    requestMic();
});
