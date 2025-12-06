/**
 * @fileoverview Simplified Vendor Layer with Tree-Shaking Optimized Imports
 * @version 4.0.0 - Named imports for optimal tree-shaking
 */

import {
  batch,
  children,
  createComponent,
  createContext,
  createEffect,
  createMemo,
  createResource,
  createRoot,
  createSignal,
  ErrorBoundary,
  For,
  Index,
  lazy,
  Match,
  mergeProps,
  on,
  onCleanup,
  onMount,
  Show,
  Suspense,
  Switch,
  splitProps,
  untrack,
  useContext,
} from 'solid-js';
import { createStore, produce } from 'solid-js/store';
import { render } from 'solid-js/web';

// Re-export types
export type { JSX } from 'solid-js';

import type { JSX } from 'solid-js';
export type JSXElement = JSX.Element;
export type VNode = JSX.Element;
export type ComponentChildren = JSX.Element;

export interface SolidAPI {
  render: typeof render;
  createSignal: typeof createSignal;
  createEffect: typeof createEffect;
  createMemo: typeof createMemo;
  createStore: typeof createStore;
  produce: typeof produce;
  createResource: typeof createResource;
  createContext: typeof createContext;
  useContext: typeof useContext;
  batch: typeof batch;
  untrack: typeof untrack;
  on: typeof on;
  onMount: typeof onMount;
  onCleanup: typeof onCleanup;
  Show: typeof Show;
  For: typeof For;
  Switch: typeof Switch;
  Match: typeof Match;
  Index: typeof Index;
  ErrorBoundary: typeof ErrorBoundary;
  Suspense: typeof Suspense;
  lazy: typeof lazy;
  children: typeof children;
  mergeProps: typeof mergeProps;
  splitProps: typeof splitProps;
  createRoot: typeof createRoot;
  createComponent: typeof createComponent;
}

// Construct the API objects once using named imports
const solidAPI: SolidAPI = {
  render,
  createSignal,
  createEffect,
  createMemo,
  createStore,
  produce,
  createResource,
  createContext,
  useContext,
  batch,
  untrack,
  on,
  onMount,
  onCleanup,
  Show,
  For,
  Switch,
  Match,
  Index,
  ErrorBoundary,
  Suspense,
  lazy,
  children,
  mergeProps,
  splitProps,
  createRoot,
  createComponent,
};

// Simple getters
export function getSolid(): SolidAPI {
  return solidAPI;
}

// Initialization stubs for compatibility
export async function initializeVendors(): Promise<void> {
  // No-op
}

export function cleanupVendors(): void {
  // No-op
}

export function registerVendorCleanupOnUnload(): void {
  // No-op: cleanup registration placeholder
}

// Other exports for compatibility
export function validateVendors() {
  return { success: true, loadedLibraries: [], errors: [] };
}
export function getVendorVersions() {
  return {};
}
export function getVendorInitializationReport() {
  return {};
}
export function getVendorStatuses() {
  return {};
}
export function isVendorInitialized() {
  return true;
}
export function isVendorsInitialized() {
  return true;
}
export function resetVendorManagerInstance() {
  cleanupVendors();
}
