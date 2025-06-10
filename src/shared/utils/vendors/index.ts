/**
 * @fileoverview Optimized vendor library access for X.com Enhanced Gallery
 *
 * Simplified vendor utilities focused on essential functionality:
 * - fflate for ZIP compression
 * - Native browser download capabilities
 * - Preact components and hooks
 * - Vendor access helpers for consistent usage patterns
 *
 * @module vendors
 * @version 3.1.0 (restructured with core/helpers separation)
 */

// Core vendor functions
export {
  getFflate,
  getNativeDownload,
  getPreact,
  getPreactHooks,
  getPreactSignals,
  type FflateAPI,
  type NativeDownloadAPI,
  type PreactAPI,
  type PreactHooksAPI,
  type PreactSignalsAPI,
  type VNode,
  type ComponentType,
  type ComponentChildren,
  type Signal,
  type ComputedSignal,
  type RefObject,
  type Context,
  type DependencyList,
  type Dispatch,
  type EffectCallback,
  type Reducer,
  type StateUpdater,
  type ReadonlySignal,
} from './core';

// Vendor utility helpers
export { createVendorContext, withVendorErrorHandling, preloadVendors } from './helpers';
