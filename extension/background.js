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
