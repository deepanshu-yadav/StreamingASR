/**
 * launch.js
 * 
 * Top-level tab script that safely invokes the custom voice-companion:// protocol
 * and auto-closes once the companion server is detected online.
 * Fully localized using i18n manager and url param / chrome.storage.
 */

(async function () {
    const COMPANION_STATUS_URL = 'http://127.0.0.1:8000/api/status';
    const statusBox = document.getElementById('statusBox');
    const statusIcon = document.getElementById('statusIcon');
    const titleText = document.getElementById('titleText');
    const descText = document.getElementById('descText');
    const manualLink = document.getElementById('manualLaunchLink');

    // 0. Initialize language from URL query param (?lang=en) or chrome storage or default
    const urlParams = new URLSearchParams(window.location.search);
    const paramLang = urlParams.get('lang');

    if (window.i18n) {
        if (paramLang) {
            await window.i18n.setLanguage(paramLang.trim(), false);
        } else {
            await window.i18n.init();
        }
        const docTitle = window.i18n.t('launchPageTitle');
        if (docTitle) document.title = docTitle;
    }

    const t = (k, p) => (window.i18n ? window.i18n.t(k, p) : k);

    // 1. Immediately trigger the registered protocol handler
    setTimeout(() => {
        window.location.href = 'voice-companion://start';
    }, 250);

    // 2. Poll the companion status endpoint
    let pollInterval = null;
    let attempts = 0;

    async function checkStatus() {
        attempts++;
        try {
            const res = await fetch(COMPANION_STATUS_URL, { cache: 'no-store' });
            if (res.ok) {
                clearInterval(pollInterval);
                if (statusIcon) statusIcon.textContent = '✅';
                if (titleText) titleText.textContent = t('launchSuccessTitle');
                if (descText) descText.textContent = t('launchSuccessDesc');
                if (statusBox) {
                    statusBox.className = 'status-box success';
                    statusBox.textContent = t('launchSuccessStatus');
                }
                if (manualLink) manualLink.style.display = 'none';

                // Automatically close this helper tab after 1.5 seconds
                setTimeout(() => {
                    window.close();
                }, 1500);
            }
        } catch (_) {
            if (attempts > 30) {
                if (statusBox) {
                    statusBox.textContent = t('launchFailStatus');
                }
            }
        }
    }

    pollInterval = setInterval(checkStatus, 1000);
    // Initial quick check
    setTimeout(checkStatus, 800);
})();

