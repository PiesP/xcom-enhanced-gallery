/**
 * @fileoverview Shared SolidJS Hooks Module
 * @description Centralized hook exports with tree-shaking optimized named imports
 * @version 2.0.0
 *
 * This module re-exports SolidJS hooks using direct named imports for optimal tree-shaking.
 * All modules should import hooks from here instead of calling getSolid().
 *
 * Benefits:
 * - Optimal tree-shaking: Only imported functions are bundled
 * - Single reference for each hook across the bundle
 * - Cleaner imports in consumer modules
 *
 * Usage:
 * ```typescript
 * // Recommended pattern - direct named imports
 * import { createSignal, createEffect, onCleanup } from '@shared/external/vendors/solid-hooks';
 * ```
 */

// Tree-shaking optimized: Named imports instead of namespace imports
import {
  createSignal as _createSignal,
  createEffect as _createEffect,
  createMemo as _createMemo,
  createResource as _createResource,
  createRoot as _createRoot,
  createComponent as _createComponent,
  createContext as _createContext,
  useContext as _useContext,
  batch as _batch,
  untrack as _untrack,
  on as _on,
  onMount as _onMount,
  onCleanup as _onCleanup,
  Show as _Show,
  For as _For,
  Switch as _Switch,
  Match as _Match,
  Index as _Index,
  ErrorBoundary as _ErrorBoundary,
  Suspense as _Suspense,
  lazy as _lazy,
  children as _children,
  mergeProps as _mergeProps,
  splitProps as _splitProps,
} from 'solid-js';
import { createStore as _createStore, produce as _produce } from 'solid-js/store';
import { render as _render } from 'solid-js/web';

// ============================================================================
// Reactive Primitives
// ============================================================================

/**
 * Creates a reactive signal with getter and setter.
 * @see https://www.solidjs.com/docs/latest/api#createsignal
 */
export const createSignal = _createSignal;

/**
 * Creates a side effect that runs when dependencies change.
 * @see https://www.solidjs.com/docs/latest/api#createeffect
 */
export const createEffect = _createEffect;

/**
 * Creates a read-only derived value.
 * @see https://www.solidjs.com/docs/latest/api#creatememo
 */
export const createMemo = _createMemo;

/**
 * Creates a resource for async data fetching.
 * @see https://www.solidjs.com/docs/latest/api#createresource
 */
export const createResource = _createResource;

/**
 * Creates a root reactive context.
 * @see https://www.solidjs.com/docs/latest/api#createroot
 */
export const createRoot = _createRoot;

/**
 * Creates a component programmatically.
 */
export const createComponent = _createComponent;

// ============================================================================
// Store Primitives
// ============================================================================

/**
 * Creates a reactive store for complex state.
 * @see https://www.solidjs.com/docs/latest/api#createstore
 */
export const createStore = _createStore;

/**
 * Produces immutable updates to store state.
 * @see https://www.solidjs.com/docs/latest/api#produce
 */
export const produce = _produce;

// ============================================================================
// Lifecycle Hooks
// ============================================================================

/**
 * Runs callback when component mounts.
 * @see https://www.solidjs.com/docs/latest/api#onmount
 */
export const onMount = _onMount;

/**
 * Runs callback when component unmounts or effect re-runs.
 * @see https://www.solidjs.com/docs/latest/api#oncleanup
 */
export const onCleanup = _onCleanup;

// ============================================================================
// Context API
// ============================================================================

/**
 * Creates a context for dependency injection.
 * @see https://www.solidjs.com/docs/latest/api#createcontext
 */
export const createContext = _createContext;

/**
 * Consumes a context value.
 * @see https://www.solidjs.com/docs/latest/api#usecontext
 */
export const useContext = _useContext;

// ============================================================================
// Control Flow Utilities
// ============================================================================

/**
 * Batches multiple updates into a single render.
 * @see https://www.solidjs.com/docs/latest/api#batch
 */
export const batch = _batch;

/**
 * Reads a value without tracking dependencies.
 * @see https://www.solidjs.com/docs/latest/api#untrack
 */
export const untrack = _untrack;

/**
 * Creates a conditional dependency tracking function.
 * @see https://www.solidjs.com/docs/latest/api#on
 */
export const on = _on;

// ============================================================================
// Component Flow Components
// ============================================================================

/**
 * Conditional rendering component.
 * @see https://www.solidjs.com/docs/latest/api#show
 */
export const Show = _Show;

/**
 * List rendering component.
 * @see https://www.solidjs.com/docs/latest/api#for
 */
export const For = _For;

/**
 * Switch-case rendering component.
 * @see https://www.solidjs.com/docs/latest/api#switch-match
 */
export const Switch = _Switch;

/**
 * Case for Switch component.
 * @see https://www.solidjs.com/docs/latest/api#switch-match
 */
export const Match = _Match;

/**
 * Index-based list rendering.
 * @see https://www.solidjs.com/docs/latest/api#index
 */
export const Index = _Index;

/**
 * Error boundary component.
 * @see https://www.solidjs.com/docs/latest/api#errorboundary
 */
export const ErrorBoundary = _ErrorBoundary;

/**
 * Suspense component for async loading.
 * @see https://www.solidjs.com/docs/latest/api#suspense
 */
export const Suspense = _Suspense;

/**
 * Lazy loading for components.
 * @see https://www.solidjs.com/docs/latest/api#lazy
 */
export const lazy = _lazy;

// ============================================================================
// Props Utilities
// ============================================================================

/**
 * Resolves children to array.
 * @see https://www.solidjs.com/docs/latest/api#children
 */
export const children = _children;

/**
 * Merges props objects.
 * @see https://www.solidjs.com/docs/latest/api#mergeprops
 */
export const mergeProps = _mergeProps;

/**
 * Splits props into local and passed-through.
 * @see https://www.solidjs.com/docs/latest/api#splitprops
 */
export const splitProps = _splitProps;

// ============================================================================
// Rendering
// ============================================================================

/**
 * Renders a component to the DOM.
 * @see https://www.solidjs.com/docs/latest/api#render
 */
export const render = _render;
