/**
 * GM_* API mocks for xcom-enhanced-gallery testing.
 * This file is designed to be copied into test HTML pages.
 * Copied from test/e2e/fixtures/gm-mock.ts logic with additions.
 */

(function installXEGGmMocks() {
  const storage = new Map();

  window.GM_setValue = async (key, value) => {
    storage.set(key, JSON.parse(JSON.stringify(value)));
  };

  window.GM_getValue = (key, defaultValue) => {
    return storage.has(key) ? storage.get(key) : defaultValue;
  };

  window.GM_deleteValue = (key) => {
    storage.delete(key);
  };

  window.GM_listValues = () => {
    return Array.from(storage.keys());
  };

  window.GM_download = (options) => {
    console.log('[GM] download:', options.name || options.url);
    if (options.onload) setTimeout(options.onload, 0);
    if (options.onerror) {};
    if (options.ontimeout) {};
  };

  window.GM_notification = (text, title, image, onclick) => {
    console.log('[GM] notification:', title, text);
  };

  window.GM_xmlhttpRequest = (details) => {
    console.log('[GM] xhr:', details.method || 'GET', details.url);
    return { abort: () => {} };
  };

  GM_cookie = (details, callback) => {
    console.log('[GM] cookie:', details.action, details.name);
    if (callback) callback({ name: details.name, value: 'mock' }, null);
  };

  console.log('[XEG GM mocks] Installed. GM_setValue/GM_getValue backed by Map.');
})();
