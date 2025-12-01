/**
 * @fileoverview Shared SolidJS Hooks Module
 * @description Phase 601: Centralized hook exports to prevent bundle duplication
 * @version 1.0.0
 *
 * This module re-exports SolidJS hooks from the cached solidAPI singleton.
 * All modules should import hooks from here instead of calling getSolid().
 *
 * Benefits:
 * - Single reference for each hook across the bundle
 * - Improved tree-shaking (Vite/Rollup can deduplicate)
 * - Cleaner imports in consumer modules
 *
 * Usage:
 * ```typescript
 * // Before (deprecated pattern)
 * const { createSignal, createEffect, onCleanup } = getSolid();
 *
 * // After (recommended pattern)
 * import { createSignal, createEffect, onCleanup } from '@shared/external/vendors/solid-hooks';
 * ```
 */

import * as Solid from 'solid-js';
import * as SolidStore from 'solid-js/store';
import * as SolidWeb from 'solid-js/web';

// ============================================================================
// Reactive Primitives
// ============================================================================

/**
 * Creates a reactive signal with getter and setter.
 * @see https://www.solidjs.com/docs/latest/api#createsignal
 */
export const createSignal = Solid.createSignal;

/**
 * Creates a side effect that runs when dependencies change.
 * @see https://www.solidjs.com/docs/latest/api#createeffect
 */
export const createEffect = Solid.createEffect;

/**
 * Creates a read-only derived value.
 * @see https://www.solidjs.com/docs/latest/api#creatememo
 */
export const createMemo = Solid.createMemo;

/**
 * Creates a resource for async data fetching.
 * @see https://www.solidjs.com/docs/latest/api#createresource
 */
export const createResource = Solid.createResource;

/**
 * Creates a root reactive context.
 * @see https://www.solidjs.com/docs/latest/api#createroot
 */
export const createRoot = Solid.createRoot;

/**
 * Creates a component programmatically.
 */
export const createComponent = Solid.createComponent;

// ============================================================================
// Store Primitives
// ============================================================================

/**
 * Creates a reactive store for complex state.
 * @see https://www.solidjs.com/docs/latest/api#createstore
 */
export const createStore = SolidStore.createStore;

/**
 * Produces immutable updates to store state.
 * @see https://www.solidjs.com/docs/latest/api#produce
 */
export const produce = SolidStore.produce;

// ============================================================================
// Lifecycle Hooks
// ============================================================================

/**
 * Runs callback when component mounts.
 * @see https://www.solidjs.com/docs/latest/api#onmount
 */
export const onMount = Solid.onMount;

/**
 * Runs callback when component unmounts or effect re-runs.
 * @see https://www.solidjs.com/docs/latest/api#oncleanup
 */
export const onCleanup = Solid.onCleanup;

// ============================================================================
// Context API
// ============================================================================

/**
 * Creates a context for dependency injection.
 * @see https://www.solidjs.com/docs/latest/api#createcontext
 */
export const createContext = Solid.createContext;

/**
 * Consumes a context value.
 * @see https://www.solidjs.com/docs/latest/api#usecontext
 */
export const useContext = Solid.useContext;

// ============================================================================
// Control Flow Utilities
// ============================================================================

/**
 * Batches multiple updates into a single render.
 * @see https://www.solidjs.com/docs/latest/api#batch
 */
export const batch = Solid.batch;

/**
 * Reads a value without tracking dependencies.
 * @see https://www.solidjs.com/docs/latest/api#untrack
 */
export const untrack = Solid.untrack;

/**
 * Creates a conditional dependency tracking function.
 * @see https://www.solidjs.com/docs/latest/api#on
 */
export const on = Solid.on;

// ============================================================================
// Component Flow Components
// ============================================================================

/**
 * Conditional rendering component.
 * @see https://www.solidjs.com/docs/latest/api#show
 */
export const Show = Solid.Show;

/**
 * List rendering component.
 * @see https://www.solidjs.com/docs/latest/api#for
 */
export const For = Solid.For;

/**
 * Switch-case rendering component.
 * @see https://www.solidjs.com/docs/latest/api#switch-match
 */
export const Switch = Solid.Switch;

/**
 * Case for Switch component.
 * @see https://www.solidjs.com/docs/latest/api#switch-match
 */
export const Match = Solid.Match;

/**
 * Index-based list rendering.
 * @see https://www.solidjs.com/docs/latest/api#index
 */
export const Index = Solid.Index;

/**
 * Error boundary component.
 * @see https://www.solidjs.com/docs/latest/api#errorboundary
 */
export const ErrorBoundary = Solid.ErrorBoundary;

/**
 * Suspense component for async loading.
 * @see https://www.solidjs.com/docs/latest/api#suspense
 */
export const Suspense = Solid.Suspense;

/**
 * Lazy loading for components.
 * @see https://www.solidjs.com/docs/latest/api#lazy
 */
export const lazy = Solid.lazy;

// ============================================================================
// Props Utilities
// ============================================================================

/**
 * Resolves children to array.
 * @see https://www.solidjs.com/docs/latest/api#children
 */
export const children = Solid.children;

/**
 * Merges props objects.
 * @see https://www.solidjs.com/docs/latest/api#mergeprops
 */
export const mergeProps = Solid.mergeProps;

/**
 * Splits props into local and passed-through.
 * @see https://www.solidjs.com/docs/latest/api#splitprops
 */
export const splitProps = Solid.splitProps;

// ============================================================================
// Rendering
// ============================================================================

/**
 * Renders a component to the DOM.
 * @see https://www.solidjs.com/docs/latest/api#render
 */
export const render = SolidWeb.render;
