/**
 * @fileoverview Core Browser Utilities Barrel Export
 */

export { BrowserManager, browserUtils } from './BrowserManager';

// Core Browser utilities (moved from Infrastructure)
export * from './utils/browser-utils';
export { BrowserUtils, browserUtils as browserUtilsInstance } from './BrowserUtils';
