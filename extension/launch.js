/**
 * launch.js
 * 
 * Top-level tab script that safely invokes the custom voice-companion:// protocol
 * and auto-closes once the companion server is detected online.
 */

(function () {
    const COMPANION_STATUS_URL = 'http://127.0.0.1:8000/api/status';
    const statusBox = document.getElementById('statusBox');
    const statusIcon = document.getElementById('statusIcon');
    const titleText = document.getElementById('titleText');
    const descText = document.getElementById('descText');
    const manualLink = document.getElementById('manualLaunchLink');

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
                statusIcon.textContent = '✅';
                titleText.textContent = 'कम्पैनियन सफलतापूर्वक चालू हो गया!';
                descText.textContent = 'कम्पैनियन सर्वर ऑनलाइन है। यह टैब स्वतः बंद हो रहा है…';
                statusBox.className = 'status-box success';
                statusBox.textContent = '✓ Companion Online at http://127.0.0.1:8000';
                if (manualLink) manualLink.style.display = 'none';

                // Automatically close this helper tab after 1.5 seconds
                setTimeout(() => {
                    window.close();
                }, 1500);
            }
        } catch (_) {
            if (attempts > 30) {
                statusBox.textContent = 'कम्पैनियन से कनेक्शन नहीं हो पाया। कृपया start_companion.bat चलाएं।';
            }
        }
    }

    pollInterval = setInterval(checkStatus, 1000);
    // Initial quick check
    setTimeout(checkStatus, 800);
})();
