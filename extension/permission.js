/**
 * permission.js
 * 
 * Separate JS file required by Chrome Manifest V3 CSP (no inline scripts allowed).
 * Requests microphone permission in a normal browser tab.
 */

document.addEventListener('DOMContentLoaded', () => {
    const btn = document.getElementById('btnGrant');
    const success = document.getElementById('statusSuccess');
    const errDiv = document.getElementById('statusError');
    const siteSettingsLink = document.getElementById('siteSettingsLink');

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
                errDiv.innerHTML = `त्रुटि: ${err.message}<br><br><b>वैकल्पिक तरीका:</b> एड्रेस बार में बाएँ ओर स्थित <b>Settings / Lock (🔒)</b> आइकन पर क्लिक करके <b>Microphone</b> को <b>Allow</b> करें।`;
            }
        }
    }

    if (btn) {
        btn.addEventListener('click', requestMic);
    }

    // Auto-request on load
    requestMic();
});
