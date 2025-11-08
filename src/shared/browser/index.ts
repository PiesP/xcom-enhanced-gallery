/**
 * @fileoverview Core Browser Utilities Barrel Export
 * @version 2.1.0 - Phase 381: Language standardization to English
 * @description Exports DOM/CSS management service and related utilities
 *
 * This module provides the main browser service for DOM manipulation and CSS injection.
 * General browser environment utilities are available via @shared/utils/browser.
 * @module @shared/browser
 */

// ============================================================================
// Primary exports: BrowserService for DOM/CSS management
// ============================================================================
export { BrowserService, browserAPI } from './browser-service';

// ============================================================================
// Backward compatibility re-exports
//
// Browser environment utilities have moved to @shared/utils/browser
// Example: import { isTwitterSite, safeWindow } from '@shared/utils/browser';
//
// These re-exports maintain compatibility for tests expecting utilities
// under the @shared/browser import path
// ============================================================================
export { getBrowserInfo, isExtensionEnvironment, isExtensionContext } from '@shared/utils/browser';
