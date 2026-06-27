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
function injectThemeScript(): void {
  const script = document.createElement('script');
  script.textContent = `
    (function() {
      try {
        let theme = localStorage.getItem('xeg-theme') || 'auto';
        if (theme === 'auto') {
          theme = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
        }
        document.documentElement.setAttribute('data-xeg-theme', theme);
      } catch (e) {}
    })();
  `;
  if (document.documentElement) {
    document.documentElement.appendChild(script);
  } else {
    document.addEventListener('readystatechange', () => {
      if (document.documentElement) {
        document.documentElement.appendChild(script);
      }
    });
  }
}

injectThemeScript();

// Boot the application
startApplication().catch((error: unknown) => {
  console.error('[XEG MV3] Failed to start application:', error);
});
