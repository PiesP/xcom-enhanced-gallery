/**
 * @fileoverview DOM Utilities Barrel Export
 * @version 2.2.0 - Phase 195: Event management separation, Phase 403: Enhanced docs
 *
 * Central export point for safe DOM query and manipulation utilities.
 * Aggregates functions from:
 * - utils/dom-utils.ts - Safe query/manipulation
 * - dom-cache.ts - Query result caching
 * - selector-registry.ts - Selector fallback chains
 *
 * **What's Included**:
 * ✅ Safe querySelector/querySelectorAll (error-tolerant)
 * ✅ Element creation with configuration
 * ✅ Type guards (isElement, isHTMLElement, etc.)
 * ✅ Visibility checks (isElementVisible, isElementInViewport)
 * ✅ Query result caching (DOMCache)
 * ✅ Selector chains (SelectorRegistry)
 * ✅ Debugging utilities
 *
 * **What's NOT Included**:
 * ❌ Event listener registration (intentionally excluded from barrel)
 * → Use: DomEventManager (relative import) or BrowserService
 *
 * **Architecture**:
 * Features/Services (import)
 *   ↓
 * This barrel index.ts (re-exports)
 *   ↓
 * Specialized modules (utils, cache, registry)
 *   ↓
 * Native DOM API (querySelector, createElement, etc.)
 *
 * **Design Philosophy**:
 * - Tree-shakeable: Unused functions removed by bundler
 * - Error-tolerant: Functions return null instead of throwing
 * - Type-safe: Generic types for compile-time safety
 * - PC-only: No touch/pointer events
 *
 * @related [DOMCache](./dom-cache.ts), [SelectorRegistry](./selector-registry.ts), [DOM Utils](./utils/dom-utils.ts)
 */

// ============================================================================
// Type Exports (Shared Domain Models)
// ============================================================================

export type { DOMElementCreationOptions } from './utils/dom-utils';

// ============================================================================
// DOM Caching System
// ============================================================================
// Query result caching for performance optimization
// Includes: DOMCache class, global instance, cache functions, mutation tracking
export {
  DOMCache,
  globalDOMCache,
  cachedQuerySelector,
  cachedQuerySelectorAll,
  cachedStableQuery,
  invalidateCacheOnMutation,
} from './dom-cache';

// ============================================================================
// Selector Registry (Query Fallback Chains)
// ============================================================================
// Selector registry for media extraction with fallback chains
// Includes: SelectorRegistry class, factory function, public interface

export {
  SelectorRegistry,
  createSelectorRegistry,
  type ISelectorRegistry,
  type QueryContainer,
} from './selector-registry';

// ============================================================================
// DOM Utilities (Query & Manipulation)
// ============================================================================
// Safe query functions: querySelector, querySelectorAll, elementExists
// Safe element creation: createElement, removeElement
// Type guards: isElement, isHTMLElement, isElementVisible, isElementInViewport
// Diagnostics: getDebugInfo
export {
  createElement,
  elementExists,
  getDebugInfo,
  isElement,
  isElementInViewport,
  isElementVisible,
  isHTMLElement,
  querySelector,
  querySelectorAll,
  removeElement,
} from './utils/dom-utils';
