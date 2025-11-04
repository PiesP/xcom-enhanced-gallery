/**
 * @fileoverview SPA Router Observer
 * @description Detects SPA routing changes (pushState, replaceState, popstate, hashchange)
 *              and triggers callbacks for event listener re-initialization
 * @module shared/utils/spa-router-observer
 */

import { logger } from '../../shared/logging';
import { globalTimerManager } from './timer-management';

/**
 * Router change callback function type
 */
export type RouterChangeCallback = (oldUrl: string, newUrl: string) => void;

/**
 * SPA Router Observer state
 */
interface RouterObserverState {
  initialized: boolean;
  callbacks: Set<RouterChangeCallback>;
  lastUrl: string;
  debounceTimerId: number | null;
}

const state: RouterObserverState = {
  initialized: false,
  callbacks: new Set(),
  lastUrl: '',
  debounceTimerId: null,
};

/**
 * Notify all callbacks about URL change
 */
function notifyRouteChange(oldUrl: string, newUrl: string): void {
  if (oldUrl === newUrl) return;

  logger.debug('[SPARouter] Route changed:', { oldUrl, newUrl });

  // Debounce to avoid multiple rapid calls
  if (state.debounceTimerId !== null) {
    globalTimerManager.clearTimeout(state.debounceTimerId);
  }

  state.debounceTimerId = globalTimerManager.setTimeout(() => {
    state.callbacks.forEach(callback => {
      try {
        callback(oldUrl, newUrl);
      } catch (error) {
        logger.error('[SPARouter] Callback error:', error);
      }
    });
    state.debounceTimerId = null;
  }, 300);
}

/**
 * Intercept History API methods (pushState, replaceState)
 */
function interceptHistoryAPI(): void {
  const originalPushState = window.history.pushState;
  const originalReplaceState = window.history.replaceState;

  window.history.pushState = function (...args) {
    const oldUrl = state.lastUrl;
    const result = originalPushState.apply(this, args);
    const newUrl = window.location.href;
    state.lastUrl = newUrl;
    notifyRouteChange(oldUrl, newUrl);
    return result;
  };

  window.history.replaceState = function (...args) {
    const oldUrl = state.lastUrl;
    const result = originalReplaceState.apply(this, args);
    const newUrl = window.location.href;
    state.lastUrl = newUrl;
    notifyRouteChange(oldUrl, newUrl);
    return result;
  };

  logger.debug('[SPARouter] History API intercepted');
}

/**
 * Setup popstate event listener
 */
function setupPopStateListener(): void {
  window.addEventListener('popstate', () => {
    const oldUrl = state.lastUrl;
    const newUrl = window.location.href;
    state.lastUrl = newUrl;
    notifyRouteChange(oldUrl, newUrl);
  });

  logger.debug('[SPARouter] popstate listener registered');
}

/**
 * Setup hashchange event listener (optional, for hash-based routing)
 */
function setupHashChangeListener(): void {
  window.addEventListener('hashchange', () => {
    const oldUrl = state.lastUrl;
    const newUrl = window.location.href;
    state.lastUrl = newUrl;
    notifyRouteChange(oldUrl, newUrl);
  });

  logger.debug('[SPARouter] hashchange listener registered');
}

/**
 * Initialize SPA Router Observer
 */
export function initializeSPARouterObserver(): void {
  if (state.initialized) {
    logger.warn('[SPARouter] Already initialized');
    return;
  }

  state.lastUrl = window.location.href;
  interceptHistoryAPI();
  setupPopStateListener();
  setupHashChangeListener();
  state.initialized = true;

  logger.info('[SPARouter] ✅ SPA Router Observer initialized');
}

/**
 * Register a callback to be called on route change
 */
export function onRouteChange(callback: RouterChangeCallback): () => void {
  state.callbacks.add(callback);
  logger.debug('[SPARouter] Callback registered, total:', state.callbacks.size);

  // Return unregister function
  return () => {
    state.callbacks.delete(callback);
    logger.debug('[SPARouter] Callback unregistered, total:', state.callbacks.size);
  };
}

/**
 * Cleanup SPA Router Observer
 */
export function cleanupSPARouterObserver(): void {
  if (state.debounceTimerId !== null) {
    globalTimerManager.clearTimeout(state.debounceTimerId);
    state.debounceTimerId = null;
  }

  state.callbacks.clear();
  state.initialized = false;

  // Note: We cannot restore original history methods as they may be used by other scripts
  logger.info('[SPARouter] ✅ Cleaned up');
}

/**
 * Get current observer state (for debugging)
 */
export function getSPARouterState() {
  return {
    initialized: state.initialized,
    callbackCount: state.callbacks.size,
    lastUrl: state.lastUrl,
  };
}
