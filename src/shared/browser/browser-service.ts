/**
 * @fileoverview Browser Service - Infrastructure layer for DOM and CSS management
 * @version 2.3.0 - Phase 414: AnimationService reference removed
 * @module shared/browser
 *
 * Core service for DOM manipulation, CSS injection, file download, and browser state management.
 * Phase 194 deduplication of browser-utils.ts and browser-service.ts completed.
 *
 * @responsibility
 * - CSS injection/removal (with safety validation)
 * - File download (base implementation, userscript recommended)
 * - Page visibility and DOM readiness checks
 * - Diagnostic information retrieval
 * - Resource cleanup
 *
 * @note Phase 414: AnimationService removed (optional feature)
 * - BrowserService: Basic DOM and CSS management (primary)
 *
 * @example
 * ```typescript
 * import { browserAPI } from '@shared/browser';
 *
 * // Inject CSS
 * browserAPI.injectCSS('my-styles', '.button { color: blue; }');
 *
 * // Check state
 * if (browserAPI.isDOMReady()) {
 *   console.log('DOM is ready');
 * }
 *
 * // Cleanup
 * browserAPI.cleanup();
 * ```
 */

import { logger } from '@shared/logging';

/**
 * Browser Service - Infrastructure service for DOM manipulation, CSS management, browser state checks
 */
export class BrowserService {
  private readonly injectedStyles = new Set<string>();

  constructor() {
    logger.debug('[BrowserService] Initialized');
  }

  /**
   * Inject CSS into document
   * @param id - Style element ID (for deduplication)
   * @param css - CSS text to inject
   * @throws Logs warning if empty CSS provided
   * @note Phase 223: Empty CSS validation added
   */
  public injectCSS(id: string, css: string): void {
    // Phase 223: Empty CSS validation (browser-utils logic integrated)
    if (!css?.trim().length) {
      logger.warn('[BrowserService] Empty CSS provided', { id });
      return;
    }

    // Remove existing style
    this.removeCSS(id);

    const style = document.createElement('style');
    style.id = id;
    style.type = 'text/css';
    style.textContent = css;

    // Phase 223: document.head fallback added (browser-utils stability)
    const target = document.head || document.documentElement;
    target.appendChild(style);

    this.injectedStyles.add(id);
    logger.debug(`[BrowserService] CSS injected: ${id}`);
  }

  /**
   * Remove CSS from document
   * @param id - Style element ID to remove
   * @note Phase 223: STYLE tag type validation added
   */
  public removeCSS(id: string): void {
    const element = document.getElementById(id);
    // Phase 223: STYLE tag validation (browser-utils stability)
    if (element?.tagName === 'STYLE') {
      element.remove();
      this.injectedStyles.delete(id);
      logger.debug(`[BrowserService] CSS removed: ${id}`);
    }
  }

  /**
   * Check if page is visible
   * @returns true if page is visible
   */
  public isPageVisible(): boolean {
    return document.visibilityState === 'visible';
  }

  /**
   * Check DOM readiness state
   * @returns true if DOM is complete or interactive
   * @note Phase 223: 'interactive' state also supported (browser-utils compatibility)
   */
  public isDOMReady(): boolean {
    return document.readyState === 'complete' || document.readyState === 'interactive';
  }

  /**
   * Get diagnostic information
   * @note Phase 223: injectedStyles array added (browser-utils compatibility)
   * @returns Object with injected styles count, visibility, and DOM state
   */
  public getDiagnostics(): {
    injectedStylesCount: number;
    injectedStyles: string[];
    pageVisible: boolean;
    domReady: boolean;
  } {
    return {
      injectedStylesCount: this.injectedStyles.size,
      injectedStyles: Array.from(this.injectedStyles),
      pageVisible: this.isPageVisible(),
      domReady: this.isDOMReady(),
    };
  }

  /**
   * Cleanup all managed resources
   * @note Phase 223: All injected styles explicitly removed (browser-utils compatibility)
   */
  public cleanup(): void {
    // Phase 223: All injected styles explicitly removed
    for (const id of this.injectedStyles) {
      this.removeCSS(id);
    }
    this.injectedStyles.clear();
    logger.debug('[BrowserService] Cleanup complete');
  }
}

// ============================================================================
// Convenience exports - Direct instance usage
// Phase 381: Optimized for direct API access
// Phase 223: Animation-related functions removed (AnimationService responsibility)
// ============================================================================

const defaultBrowserService = new BrowserService();

/**
 * Browser API - Convenience functions for direct service access
 * @description Provides a simplified interface to BrowserService methods
 * @example
 * ```typescript
 * import { browserAPI } from '@shared/browser';
 * browserAPI.injectCSS('my-id', '.my-class { color: red; }');
 * const diagnostics = browserAPI.getDiagnostics();
 * ```
 */
export const browserAPI = {
  injectCSS: (id: string, css: string) => defaultBrowserService.injectCSS(id, css),
  removeCSS: (id: string) => defaultBrowserService.removeCSS(id),
  isPageVisible: () => defaultBrowserService.isPageVisible(),
  isDOMReady: () => defaultBrowserService.isDOMReady(),
  getDiagnostics: () => defaultBrowserService.getDiagnostics(),
  cleanup: () => defaultBrowserService.cleanup(),
};
