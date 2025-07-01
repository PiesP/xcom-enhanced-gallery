/**
 * Global styles initialization module
 *
 * Centralized management of all global CSS files
 */

// Unified design system (tokens + global styles)
import '@assets/styles/globals-unified.css';

// Auto theme system
import '@assets/styles/auto-theme.css';

// Gallery global styles
import '@features/gallery/styles/gallery-global.css';

// Component-specific global styles
import '@assets/styles/video-trigger.css';

/**
 * Global styles related additional initialization logic
 */
export function initializeGlobalStyles(): void {
  // Dark mode detection
  if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
    document.documentElement.setAttribute('data-theme', 'dark');
  }

  // System theme change detection
  window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', e => {
    document.documentElement.setAttribute('data-theme', e.matches ? 'dark' : 'light');
  });
}

// 자동 초기화
initializeGlobalStyles();
