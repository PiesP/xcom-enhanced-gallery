/**
 * @fileoverview Shared SolidJS Hooks Module
 * @description Centralized hook exports with tree-shaking optimized named imports
 * @version 3.0.0
 *
 * This module re-exports SolidJS hooks using direct named imports for optimal tree-shaking.
 * All modules should import hooks from here instead of calling getSolid().
 *
 * Usage:
 * ```typescript
 * import { createSignal, createEffect, onCleanup } from '@shared/external/vendors/solid-hooks';
 * ```
 *
 * @see https://www.solidjs.com/docs/latest/api
 */

// Tree-shaking optimized: Named imports instead of namespace imports
import {
  batch as _batch,
  createEffect as _createEffect,
  createMemo as _createMemo,
  createRoot as _createRoot,
  createSignal as _createSignal,
  ErrorBoundary as _ErrorBoundary,
  For as _For,
  lazy as _lazy,
  Match as _Match,
  mergeProps as _mergeProps,
  on as _on,
  onCleanup as _onCleanup,
  onMount as _onMount,
  Show as _Show,
  splitProps as _splitProps,
  Suspense as _Suspense,
  Switch as _Switch,
  untrack as _untrack,
} from 'solid-js';
import { createStore as _createStore } from 'solid-js/store';
import { render as _render } from 'solid-js/web';

// ============================================================================
// Reactive Primitives
// ============================================================================

/** Creates a reactive signal with getter and setter */
export const createSignal = _createSignal;

/** Creates a side effect that runs when dependencies change */
export const createEffect = _createEffect;

/** Creates a read-only derived value */
export const createMemo = _createMemo;

/** Creates a root reactive context */
export const createRoot = _createRoot;

// ============================================================================
// Store Primitives
// ============================================================================

/** Creates a reactive store for complex state */
export const createStore = _createStore;

// ============================================================================
// Lifecycle Hooks
// ============================================================================

/** Runs callback when component mounts */
export const onMount = _onMount;

/** Runs callback when component unmounts or effect re-runs */
export const onCleanup = _onCleanup;

// ============================================================================
// Control Flow Utilities
// ============================================================================

/** Batches multiple updates into a single render */
export const batch = _batch;

/** Reads a value without tracking dependencies */
export const untrack = _untrack;

/** Creates a conditional dependency tracking function */
export const on = _on;

// ============================================================================
// Component Flow Components
// ============================================================================

/** Conditional rendering component */
export const Show = _Show;

/** List rendering component */
export const For = _For;

/** Switch-case rendering component */
export const Switch = _Switch;

/** Case for Switch component */
export const Match = _Match;

/** Error boundary component */
export const ErrorBoundary = _ErrorBoundary;

/** Suspense component for async loading */
export const Suspense = _Suspense;

/** Lazy loading for components */
export const lazy = _lazy;

// ============================================================================
// Props Utilities
// ============================================================================

/** Splits props into local and passed-through */
export const splitProps = _splitProps;

/** Merges props objects */
export const mergeProps = _mergeProps;

// ============================================================================
// Rendering
// ============================================================================

/** Renders a component to the DOM */
export const render = _render;
