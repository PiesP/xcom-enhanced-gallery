// SPDX-License-Identifier: MIT
// Copyright (c) 2024-2026 PiesP

/**
 * MV3 Extension — Content Script Entry Point
 *
 * Runs at document_start to inject theme detection and boot the gallery app.
 * All heavy lifting is done by the shared application code imported from main.
 */

import { startApplication } from '../main';

// Theme injection at document_start to prevent FOUC
// S1: Apply theme directly from content script context instead of injecting
// an inline script. This avoids CSP script-src restrictions entirely.
function injectThemeScript(): void {
  const applyTheme = () => {
    try {
      let theme = localStorage.getItem('xeg-theme') || 'auto';
      if (!['light', 'dark', 'auto'].includes(theme)) theme = 'auto';
      if (theme === 'auto') {
        theme = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
      }
      document.documentElement.setAttribute('data-xeg-theme', theme);
    } catch {
      // localStorage or matchMedia may be unavailable
    }
  };

  if (document.documentElement) {
    applyTheme();
  } else {
    // document_start may fire before documentElement exists
    const observer = new MutationObserver(() => {
      if (document.documentElement) {
        observer.disconnect();
        applyTheme();
      }
    });
    observer.observe(document, { childList: true, subtree: true });
  }
}

injectThemeScript();

// Boot the application
startApplication().catch((error: unknown) => {
  console.error('[XEG MV3] Failed to start application:', error);
});
