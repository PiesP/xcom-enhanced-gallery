/**
 * @fileoverview Safe access utilities for browser global objects
 * @version 1.0.0 - Phase 194: Path optimization (browser/utils → utils/browser)
 *
 * Provides type-safe access to browser global objects like Window, Location, Navigator, etc.
 * Works safely in server-side rendering or test environments.
 */

import { logger } from '@shared/logging';
import { globalTimerManager } from '../timer-management';

type ExtensionRuntimeWindow = Window & {
  chrome?: { runtime?: { id?: string } };
  browser?: { runtime?: { id?: string } };
};

// Shared runtime detector keeps extension environment helpers in sync.
function detectExtensionRuntime(): boolean {
  const win = safeWindow() as ExtensionRuntimeWindow | null;
  if (!win) return false;

  const chromeRuntimeId = win.chrome?.runtime?.id;
  const firefoxRuntimeId = win.browser?.runtime?.id;
  return Boolean(chromeRuntimeId || firefoxRuntimeId);
}

/**
 * Check if in extension environment
 */
export function isExtensionEnvironment(): boolean {
  try {
    return detectExtensionRuntime();
  } catch {
    return false;
  }
}

/**
 * Check if browser environment is available
 */
export function isBrowserEnvironment(): boolean {
  return typeof window !== 'undefined' && typeof document !== 'undefined';
}

/**
 * Safe Window access
 */
export function safeWindow(): Window | null {
  if (!isBrowserEnvironment()) {
    logger.debug('Window object not available (likely server-side or test environment)');
    return null;
  }
  return window;
}

/**
 * Safe Location access
 */
export function safeLocation(): Location | null {
  try {
    const win = safeWindow();
    if (!win) return null;

    // Check if location object exists
    if (!win.location) return null;

    // Also allow partially defined location object
    return win.location;
  } catch (error) {
    logger.debug('safeLocation: Location access failed:', error);
    return null;
  }
}

/**
 * Safe Navigator access
 */
export function safeNavigator(): Navigator | null {
  const win = safeWindow();
  if (!win?.navigator) return null;
  return win.navigator;
}

/**
 * Check if current page is Twitter/X.com
 */
export function isTwitterSite(): boolean {
  try {
    const location = safeLocation();
    if (!location) return false;

    const hostname = location.hostname.toLowerCase();

    // Exact domain matching (including subdomains)
    return (
      hostname === 'x.com' ||
      hostname === 'twitter.com' ||
      hostname.endsWith('.x.com') ||
      hostname.endsWith('.twitter.com')
    );
  } catch (error) {
    logger.debug('isTwitterSite: Domain check failed:', error);
    return false;
  }
}

/**
 * Get current URL info safely
 */
export function getCurrentUrlInfo(): {
  href: string;
  pathname: string;
  hostname: string;
  search: string;
} {
  const location = safeLocation();
  if (!location) {
    return {
      href: '',
      pathname: '',
      hostname: '',
      search: '',
    };
  }

  return {
    href: location.href || '',
    pathname: location.pathname || '',
    hostname: location.hostname || '',
    search: location.search || '',
  };
}

/**
 * Set scroll position
 */
export function setScrollPosition(x: number, y: number): void {
  const win = safeWindow();
  if (win && typeof win.scrollTo === 'function') {
    win.scrollTo(x, y);
  }
}

/**
 * Safe timer creation (integrated with memory management)
 */
export function safeSetTimeout(callback: () => void, delay: number): number | null {
  // Test/SSR safety guard
  const win = safeWindow();
  if (!win) return null;
  return globalTimerManager.setTimeout(callback, delay);
}

/**
 * Safe timer clearing
 */
export function safeClearTimeout(timerId: number | null): void {
  if (timerId === null) return;
  const win = safeWindow();
  if (!win) return;
  globalTimerManager.clearTimeout(timerId);
}

/**
 * Get viewport size
 */
export function getViewportSize(): { width: number; height: number } {
  const win = safeWindow();
  if (!win) return { width: 0, height: 0 };

  return {
    width: win.innerWidth || 0,
    height: win.innerHeight || 0,
  };
}

/**
 * Get device pixel ratio
 */
export function getDevicePixelRatio(): number {
  const win = safeWindow();
  return win?.devicePixelRatio ?? 1;
}

/**
 * Media query matching
 */
export function matchesMediaQuery(query: string): boolean {
  const win = safeWindow();
  if (!win?.matchMedia) return false;

  try {
    return win.matchMedia(query).matches;
  } catch (error) {
    logger.warn(`Failed to match media query "${query}":`, error);
    return false;
  }
}

/**
 * Detect dark mode
 */
export function isDarkMode(): boolean {
  return matchesMediaQuery('(prefers-color-scheme: dark)');
}

/**
 * Detect reduced motion
 */
export function prefersReducedMotion(): boolean {
  return matchesMediaQuery('(prefers-reduced-motion: reduce)');
}

/**
 * Detect browser info
 */
export function getBrowserInfo(): {
  name: string;
  version: string;
  isChrome: boolean;
  isFirefox: boolean;
  isSafari: boolean;
  isEdge: boolean;
} {
  const navigator = safeNavigator();

  if (!navigator) {
    return {
      name: 'Unknown',
      version: 'Unknown',
      isChrome: false,
      isFirefox: false,
      isSafari: false,
      isEdge: false,
    };
  }

  const userAgent = navigator.userAgent;
  const vendor = navigator.vendor || '';

  // Chrome detection
  if (userAgent.includes('Chrome') && vendor.includes('Google')) {
    const versionMatch = userAgent.match(/Chrome\/(\d+\.\d+\.\d+\.\d+)/);
    return {
      name: 'Chrome',
      version: versionMatch?.[1] ?? 'Unknown',
      isChrome: true,
      isFirefox: false,
      isSafari: false,
      isEdge: false,
    };
  }

  // Firefox detection
  if (userAgent.includes('Firefox')) {
    const versionMatch = userAgent.match(/Firefox\/(\d+\.\d+)/);
    return {
      name: 'Firefox',
      version: versionMatch?.[1] ?? 'Unknown',
      isChrome: false,
      isFirefox: true,
      isSafari: false,
      isEdge: false,
    };
  }

  // Safari detection
  if (userAgent.includes('Safari') && vendor.includes('Apple') && !userAgent.includes('Chrome')) {
    const versionMatch = userAgent.match(/Version\/(\d+\.\d+)/);
    return {
      name: 'Safari',
      version: versionMatch?.[1] ?? 'Unknown',
      isChrome: false,
      isFirefox: false,
      isSafari: true,
      isEdge: false,
    };
  }

  // Edge detection
  if (userAgent.includes('Edg')) {
    const versionMatch = userAgent.match(/Edg\/(\d+\.\d+\.\d+\.\d+)/);
    return {
      name: 'Edge',
      version: versionMatch?.[1] ?? 'Unknown',
      isChrome: false,
      isFirefox: false,
      isSafari: false,
      isEdge: true,
    };
  }

  return {
    name: 'Unknown',
    version: 'Unknown',
    isChrome: false,
    isFirefox: false,
    isSafari: false,
    isEdge: false,
  };
}

/**
 * Detect browser extension context
 */
export function isExtensionContext(): boolean {
  try {
    return detectExtensionRuntime();
  } catch (error) {
    logger.debug('isExtensionContext: Extension detection failed:', error);
    return false;
  }
}
