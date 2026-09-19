/**
 * form-field-scanner.js
 *
 * Scope (deliberately narrow): finds only plain TEXT fields on the page —
 * <input type="text|search|email|tel|url"> (or no type attribute, which
 * defaults to text) and <textarea>.
 *
 * Explicitly excluded, on purpose, for now:
 *   - date / datetime-local / month / week / time inputs
 *   - password inputs
 *   - anything that looks like a captcha
 *   - number, checkbox, radio, file, hidden, submit, button, color, range
 *   - disabled or readOnly fields (readOnly also catches most JS-driven
 *     datepicker trigger inputs, which are usually readOnly text inputs)
 *   - invisible fields
 *
 * This script only PARSES and REPORTS. It does not write any values back
 * into the page — that's the action engine, built separately later. It does
 * keep a live element registry so that engine can find elements again by id
 * without re-querying the DOM from scratch.
 *
 * Load this as a Manifest V3 content script (or inject it on demand with
 * chrome.scripting.executeScript before you need a scan).
 */
(function () {
  'use strict';

  // ---- Configuration ------------------------------------------------------

  const TEXT_INPUT_TYPES = new Set(['text', 'search', 'email', 'tel', 'url', 'number']);

  const EXCLUDED_INPUT_TYPES = new Set([
    'date', 'datetime-local', 'month', 'week', 'time',
    'file', 'hidden', 'checkbox', 'radio', 'submit', 'button',
    'image', 'reset', 'color', 'range'
  ]);

  const CAPTCHA_HINTS = /captcha|security\s*code|verification\s*code/i;

  const MASKED_ID_HINTS = /(aadhaar|aadhar|uid|identity|id\b|card|srch|account|number|no\b|phone|mobile)/i;
  const STRICT_PASSWORD_HINTS = /(password|passphrase|secret|pwd|login|pin\b|passwd)/i;

  const DATA_ATTR = 'data-vff-id';

  // ---- Registry -------------------------------------------------------------
  // id -> live DOM element. Lives only in this content script's memory.
  // Element references are never sent over chrome.runtime messages — they
  // aren't serializable, and the action engine will run in this same
  // content-script context, so it can call getFieldElement(id) directly.
  const fieldRegistry = new Map();
  let nextId = 0;

  // ---- Visibility -----------------------------------------------------------

  function isVisible(el) {
    if (!el.isConnected) return false;
    const style = window.getComputedStyle(el);
    if (style.display === 'none' || style.visibility === 'hidden' || style.opacity === '0') {
      return false;
    }
    const rect = el.getBoundingClientRect();
    if (rect.width === 0 && rect.height === 0 && el.offsetParent === null) return false;
    return true;
  }

  function isCaptchaLike(el) {
    const haystack = [
      el.id, el.name, el.className,
      el.getAttribute('aria-label') || '',
      el.placeholder || ''
    ].join(' ');
    if (CAPTCHA_HINTS.test(haystack)) return true;

    // A generically-named input sitting right next to a captcha <img> is
    // still a captcha field even if its own id/name gives nothing away.
    const container = el.closest('tr, div, td, fieldset');
    const nearbyImg = container ? container.querySelector('img') : null;
    if (nearbyImg) {
      const imgHint = (nearbyImg.getAttribute('src') || '') + ' ' + (nearbyImg.getAttribute('alt') || '');
      if (CAPTCHA_HINTS.test(imgHint)) return true;
    }
    return false;
  }

  // ---- Label resolution -------------------------------------------------
  // Simplified accessible-name algorithm: strongest signal first, then
  // gradually weaker fallbacks for old table-layout government forms.

  function cleanLabel(str) {
    if (!str) return '';
    return str
      .replace(/[\*\:\_]+/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();
  }

  function resolveLabel(el) {
    const labelledBy = el.getAttribute('aria-labelledby');
    if (labelledBy) {
      const text = labelledBy.split(/\s+/)
        .map((id) => document.getElementById(id)?.textContent?.trim())
        .filter(Boolean)
        .join(' ');
      if (text) return { text: cleanLabel(text), source: 'aria-labelledby' };
    }

    const ariaLabel = el.getAttribute('aria-label');
    if (ariaLabel && ariaLabel.trim()) {
      return { text: cleanLabel(ariaLabel), source: 'aria-label' };
    }

    if (el.id) {
      const forLabel = document.querySelector(`label[for="${CSS.escape(el.id)}"]`);
      if (forLabel && forLabel.textContent.trim()) {
        return { text: cleanLabel(forLabel.textContent), source: 'label[for]' };
      }
    }

    const wrappingLabel = el.closest('label');
    if (wrappingLabel) {
      const clone = wrappingLabel.cloneNode(true);
      clone.querySelectorAll('input, select, textarea').forEach((n) => n.remove());
      const text = clone.textContent.trim();
      if (text) return { text: cleanLabel(text), source: 'wrapping label' };
    }

    // Container-level label (e.g. Bootstrap/ASP.NET <div class="form-group"><label>Name</label><input ... /></div>)
    const container = el.closest('.form-group, .form-row, .field, .input-group, fieldset, tr, td');
    if (container) {
      const lbl = container.querySelector('label');
      if (lbl && lbl !== el && cleanLabel(lbl.textContent)) {
        return { text: cleanLabel(lbl.textContent), source: 'container label' };
      }
    }

    if (el.placeholder && el.placeholder.trim()) {
      return { text: cleanLabel(el.placeholder), source: 'placeholder' };
    }

    // Old ASP.NET-style table layout: label lives in the previous <td>/<th>.
    const cell = el.closest('td, th');
    if (cell) {
      let sibling = cell.previousElementSibling;
      while (sibling) {
        const text = cleanLabel(sibling.textContent);
        if (text) return { text, source: 'table cell' };
        sibling = sibling.previousElementSibling;
      }
    }

    // Generic div-based layout: nearest preceding text node / element.
    let node = el.previousSibling;
    while (node) {
      const text = cleanLabel(node.textContent);
      if (text) return { text, source: 'preceding text' };
      node = node.previousSibling;
    }
    if (el.parentElement && el.parentElement.previousElementSibling) {
      const text = cleanLabel(el.parentElement.previousElementSibling.textContent);
      if (text) return { text, source: 'preceding element' };
    }

    // Last resort: humanize the name/id attribute.
    const raw = el.name || el.id || '';
    const humanized = raw
      .replace(/^ctl\d+_/i, '')          // strip ASP.NET auto-generated prefixes
      .replace(/^ContentPlaceHolder\d+_/i, '')
      .replace(/^txt/i, '')              // strip ASP.NET txt prefix (e.g. txtMobileNo -> MobileNo)
      .replace(/[_\-]+/g, ' ')
      .replace(/([a-z])([A-Z])/g, '$1 $2')
      .trim();
    return { text: cleanLabel(humanized) || '(unlabeled field)', source: 'fallback:name' };
  }

  // ---- Masked Identifier Detection ---------------------------------------
  // Indian government and financial forms frequently mask Aadhaar, account, or
  // identity numbers using type="password" with a toggle eye button (#show_password).
  // We identify these so they are treated as fillable inputs, while keeping genuine
  // login/auth secret passwords excluded.
  function isMaskedIdentifierInput(el) {
    const attrHints = [
      el.id || '',
      el.name || '',
      el.placeholder || '',
      el.getAttribute('aria-label') || '',
      el.getAttribute('title') || ''
    ].join(' ');

    const labelData = resolveLabel(el);
    const combined = (attrHints + ' ' + (labelData.text || '')).trim();

    // If it has strict login password keywords without Aadhaar/ID keywords, exclude it
    if (STRICT_PASSWORD_HINTS.test(combined) && !/(aadhaar|aadhar|uid)/i.test(combined)) {
      return false;
    }

    if (MASKED_ID_HINTS.test(combined)) {
      return true;
    }

    // Nearby eye toggle icon or show_password button (e.g. PM Kisan #show_password)
    const container = el.closest('.form-group, .form-row, .field, td, tr, div');
    if (container && container.querySelector('#show_password, .show_password, [id*="eye" i], [class*="eye" i], [class*="fa-eye" i]')) {
      return true;
    }

    return false;
  }

  // ---- Classification -----------------------------------------------------

  function classify(el) {
    const tag = el.tagName.toLowerCase();
    if (tag === 'textarea') return 'text';
    if (tag === 'select') {
      const hint = (el.id + ' ' + el.name + ' ' + (el.className || '')).toLowerCase();
      if (/(language|lang\b|google_translate)/i.test(hint)) return null;
      if (el.options && el.options.length <= 1 && !el.options[0]?.text?.trim()) return null;
      return 'select';
    }
    if (tag === 'input') {
      const type = (el.getAttribute('type') || 'text').toLowerCase();
      if (type === 'password') {
        return isMaskedIdentifierInput(el) ? 'text' : null;
      }
      if (EXCLUDED_INPUT_TYPES.has(type)) return null;
      if (TEXT_INPUT_TYPES.has(type)) return type;
    }
    return null;
  }

  // ---- CSS selector (debugging / fallback lookup, not the primary key) ----

  function buildSelector(el) {
    if (el.id) return `#${CSS.escape(el.id)}`;
    if (el.name) return `${el.tagName.toLowerCase()}[name="${CSS.escape(el.name)}"]`;
    const parts = [];
    let node = el;
    while (node && node.nodeType === 1 && parts.length < 5) {
      let part = node.tagName.toLowerCase();
      if (node.id) { parts.unshift(`#${CSS.escape(node.id)}`); break; }
      const parent = node.parentElement;
      if (parent) {
        const siblings = Array.from(parent.children).filter((c) => c.tagName === node.tagName);
        if (siblings.length > 1) part += `:nth-of-type(${siblings.indexOf(node) + 1})`;
      }
      parts.unshift(part);
      node = parent;
    }
    return parts.join(' > ');
  }

  // ---- Main scan ------------------------------------------------------------

  function scanForm() {
    fieldRegistry.clear();
    nextId = 0;

    const candidates = document.querySelectorAll('input, textarea, select');
    const fields = [];

    candidates.forEach((el) => {
      if (el.disabled || el.readOnly) return;
      const kind = classify(el);
      if (!kind) return;
      if (!isVisible(el)) return;
      if (isCaptchaLike(el)) return;

      const id = `vff-${nextId++}`;
      el.setAttribute(DATA_ATTR, id);
      fieldRegistry.set(id, el);

      const { text: label, source: labelSource } = resolveLabel(el);

      let currentVal = el.value || '';
      if (el.tagName.toLowerCase() === 'select') {
        const selectedOpt = el.options && el.selectedIndex >= 0 ? el.options[el.selectedIndex] : null;
        const optText = selectedOpt ? selectedOpt.text.trim() : '';
        if (/^--|^select/i.test(optText)) {
          currentVal = '';
        } else {
          currentVal = optText;
        }
      }

      fields.push({
        id,                             // stable key for the action engine
        label,                          // what STT/TTS reads to the user
        labelSource,                    // how confident we are in the label
        type: kind,                     // 'text' | 'email' | 'tel' | 'url' | 'search' | 'number' | 'select'
        tagName: el.tagName.toLowerCase(),
        selector: buildSelector(el),    // fallback/debug only, not the primary key
        currentValue: currentVal,
        required: el.required || el.getAttribute('aria-required') === 'true',
        maxLength: el.maxLength > 0 ? el.maxLength : null,
        pattern: el.getAttribute('pattern') || null
      });
    });

    return {
      url: location.href,
      scannedAt: new Date().toISOString(),
      fields
    };
  }

  // ---- Lookup & Action Helpers --------------------------------------------
  function getFieldElement(id) {
    return fieldRegistry.get(id) || document.querySelector(`[${DATA_ATTR}="${id}"]`);
  }

  let currentlyHighlightedEl = null;

  function clearFocus() {
    if (currentlyHighlightedEl) {
      currentlyHighlightedEl.classList.remove('vff-active-highlight-field');
      currentlyHighlightedEl = null;
    }
  }

  function focusField(id) {
    clearFocus();
    const el = getFieldElement(id);
    if (!el) return false;

    currentlyHighlightedEl = el;
    el.classList.add('vff-active-highlight-field');
    try {
      el.scrollIntoView({ behavior: 'smooth', block: 'center', inline: 'nearest' });
      el.focus({ preventScroll: true });
    } catch (err) {
      console.warn('VFF focus error:', err);
    }
    return true;
  }

  function setFieldValue(id, value) {
    const el = getFieldElement(id);
    if (!el) return false;

    if (el.tagName.toLowerCase() === 'select') {
      const vLower = (value || '').toString().toLowerCase().trim();
      let matched = false;
      for (let i = 0; i < el.options.length; i++) {
        const opt = el.options[i];
        if (opt.value.toLowerCase() === vLower || opt.text.toLowerCase().includes(vLower)) {
          el.selectedIndex = i;
          matched = true;
          break;
        }
      }
      if (!matched) el.value = value;
    } else {
      el.value = value;
    }

    el.dispatchEvent(new Event('input', { bubbles: true }));
    el.dispatchEvent(new Event('change', { bubbles: true }));
    return true;
  }

  // ---- Wiring into the extension -------------------------------------------
  // Side panel calls chrome.tabs.sendMessage(tabId, { type: '...' })
  if (typeof chrome !== 'undefined' && chrome.runtime && chrome.runtime.onMessage) {
    chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
      if (!message || !message.type) return;

      if (message.type === 'VFF_SCAN_FORM') {
        sendResponse(scanForm());
        return true;
      }

      if (message.type === 'VFF_FOCUS_FIELD') {
        const ok = focusField(message.fieldId);
        sendResponse({ success: ok, fieldId: message.fieldId });
        return true;
      }

      if (message.type === 'VFF_CLEAR_FOCUS') {
        clearFocus();
        sendResponse({ success: true });
        return true;
      }

      if (message.type === 'VFF_SET_FIELD_VALUE') {
        const ok = setFieldValue(message.fieldId, message.value);
        sendResponse({ success: ok, fieldId: message.fieldId, value: message.value });
        return true;
      }

      if (message.type === 'VFF_SET_LANGUAGE') {
        window.dispatchEvent(new CustomEvent('vff_language_changed', { detail: { language: message.language } }));
        sendResponse({ success: true, language: message.language });
        return true;
      }
    });
  }

  // Manual testing from the page's own DevTools console:
  //   __vffScanForm()
  window.__vffScanForm = scanForm;
  window.__vffGetFieldElement = getFieldElement;
  window.__vffFocusField = focusField;
  window.__vffClearFocus = clearFocus;
  window.__vffSetFieldValue = setFieldValue;

  // ---- Continuous monitoring ------------------------------------------
  // Chrome has no single built-in "watch this page for form changes" API.
  // Continuous monitoring is two layers working together:
  //   1. MutationObserver (a web-platform API, running right here in the
  //      content script) — catches AJAX/UpdatePanel-style partial postbacks
  //      that redraw part of the DOM without a full page reload.
  //   2. chrome.tabs.onUpdated, in the background service worker — catches
  //      full page reloads/navigations. A full reload destroys this whole
  //      content script (and its MutationObserver) along with the old DOM,
  //      so it has to be re-injected from outside. See background.js.

  let debounceTimer = null;
  function scheduleRescan() {
    clearTimeout(debounceTimer);
    debounceTimer = setTimeout(() => {
      const result = scanForm();
      if (typeof chrome !== 'undefined' && chrome.runtime && chrome.runtime.sendMessage) {
        chrome.runtime.sendMessage({ type: 'VFF_FIELDS_UPDATED', ...result });
      }
    }, 400); // batch a burst of DOM writes (e.g. a postback re-render) into one rescan
  }

  const observer = new MutationObserver((mutations) => {
    // Ignore the attribute writes we ourselves make when stamping data-vff-id,
    // so we don't trigger an infinite scan -> mutate -> scan loop.
    const relevant = mutations.some(
      (m) => !(m.type === 'attributes' && m.attributeName === DATA_ATTR)
    );
    if (relevant) scheduleRescan();
  });

  observer.observe(document.body, {
    childList: true,
    subtree: true,
    attributes: true,
    attributeFilter: ['type', 'disabled', 'readonly', 'style', 'class', 'value']
  });

  // Initial scan as soon as this script is injected.
  scheduleRescan();
})();
