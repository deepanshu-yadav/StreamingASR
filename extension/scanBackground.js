/**
 * background.js — Manifest V3 service worker.
 *
 * The content script's own MutationObserver (in form-field-scanner.js)
 * already handles AJAX/postback DOM changes. This file exists only for
 * the case a MutationObserver can't cover: a real full-page navigation,
 * which tears down the content script entirely and requires a fresh
 * injection.
 */

// Tabs where the user has an active voice-form session running.
const activeSessions = new Set();

chrome.runtime.onMessage.addListener((message) => {
  if (message.type === 'VFF_START_SESSION' && typeof message.tabId === 'number') {
    activeSessions.add(message.tabId);
  }
  if (message.type === 'VFF_STOP_SESSION' && typeof message.tabId === 'number') {
    activeSessions.delete(message.tabId);
  }
});

// Clean up if the tab is closed while a session is active.
chrome.tabs.onRemoved.addListener((tabId) => activeSessions.delete(tabId));

// Full navigation completed on a tab we're tracking -> re-inject the scanner.
chrome.tabs.onUpdated.addListener((tabId, changeInfo) => {
  if (changeInfo.status === 'complete' && activeSessions.has(tabId)) {
    chrome.scripting.executeScript({
      target: { tabId },
      files: ['form-field-scanner.js']
    }).catch((err) => {
      // Common cause: navigated to a chrome:// page or another tab where
      // script injection isn't allowed. Not fatal, just can't scan there.
      console.warn('VFF: re-injection skipped for tab', tabId, err.message);
    });
  }
});
