/**
 * background.js
 * 
 * Service Worker for the Voice ASR & Form Assistant Chrome Extension.
 * Opens the Side Panel when the user clicks the extension toolbar icon.
 */

// Enables opening the side panel on toolbar icon click
chrome.sidePanel
    .setPanelBehavior({ openPanelOnActionClick: true })
    .catch((error) => console.error('[Background] Failed to set side panel behavior:', error));

chrome.runtime.onInstalled.addListener(() => {
    console.log('[Background] Voice Assistant Extension installed.');
});

// ---- Tab Session Tracking & Scanner Auto-Injection ----
// Tabs where the user has an active voice-form session running.
const activeSessions = new Set();

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (message.type === 'VFF_START_SESSION' && typeof message.tabId === 'number') {
        activeSessions.add(message.tabId);
        console.log('[Background] Active form session started for tab:', message.tabId);
        sendResponse({ success: true });
        return true;
    }
    if (message.type === 'VFF_STOP_SESSION' && typeof message.tabId === 'number') {
        activeSessions.delete(message.tabId);
        console.log('[Background] Active form session stopped for tab:', message.tabId);
        sendResponse({ success: true });
        return true;
    }
});

// Clean up if the tab is closed while a session is active.
chrome.tabs.onRemoved.addListener((tabId) => activeSessions.delete(tabId));

// Full navigation completed on a tab we're tracking -> re-inject the scanner.
chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
    if (changeInfo.status === 'complete' && activeSessions.has(tabId)) {
        chrome.scripting.executeScript({
            target: { tabId },
            files: ['form-field-scanner.js']
        }).then(() => {
            console.log('[Background] Re-injected form-field-scanner.js on tab', tabId);
        }).catch((err) => {
            // Common cause: navigated to a chrome:// page or another tab where
            // script injection isn't allowed. Not fatal, just can't scan there.
            console.warn('[Background] VFF: re-injection skipped for tab', tabId, err.message);
        });
    }
});
