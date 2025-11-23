/**
 * @fileoverview Simplified Vendor Layer
 * @version 3.0.0 - Direct imports wrapper
 */

import { logger } from "@shared/logging";
import { globalTimerManager } from "@shared/utils/timer-management";
import * as Solid from "solid-js";
import * as SolidStore from "solid-js/store";
import * as SolidWeb from "solid-js/web";

// Re-export types
export type { JSX } from "solid-js";
export type JSXElement = Solid.JSX.Element;
export type VNode = Solid.JSX.Element;
export type ComponentChildren = Solid.JSX.Element;

export interface SolidAPI {
  render: typeof SolidWeb.render;
  createSignal: typeof Solid.createSignal;
  createEffect: typeof Solid.createEffect;
  createMemo: typeof Solid.createMemo;
  createStore: typeof SolidStore.createStore;
  produce: typeof SolidStore.produce;
  createResource: typeof Solid.createResource;
  createContext: typeof Solid.createContext;
  useContext: typeof Solid.useContext;
  batch: typeof Solid.batch;
  untrack: typeof Solid.untrack;
  on: typeof Solid.on;
  onMount: typeof Solid.onMount;
  onCleanup: typeof Solid.onCleanup;
  Show: typeof Solid.Show;
  For: typeof Solid.For;
  Switch: typeof Solid.Switch;
  Match: typeof Solid.Match;
  Index: typeof Solid.Index;
  ErrorBoundary: typeof Solid.ErrorBoundary;
  Suspense: typeof Solid.Suspense;
  lazy: typeof Solid.lazy;
  children: typeof Solid.children;
  mergeProps: typeof Solid.mergeProps;
  splitProps: typeof Solid.splitProps;
  createRoot: typeof Solid.createRoot;
  createComponent: typeof Solid.createComponent;
}

export interface SolidStoreAPI {
  createStore: typeof SolidStore.createStore;
  produce: typeof SolidStore.produce;
}

export interface NativeDownloadAPI {
  downloadBlob: (blob: Blob, filename: string) => void;
  createDownloadUrl: (blob: Blob) => string;
  revokeDownloadUrl: (url: string) => void;
}

// Construct the API objects once
const solidAPI: SolidAPI = {
  render: SolidWeb.render,
  createSignal: Solid.createSignal,
  createEffect: Solid.createEffect,
  createMemo: Solid.createMemo,
  createStore: SolidStore.createStore,
  produce: SolidStore.produce,
  createResource: Solid.createResource,
  createContext: Solid.createContext,
  useContext: Solid.useContext,
  batch: Solid.batch,
  untrack: Solid.untrack,
  on: Solid.on,
  onMount: Solid.onMount,
  onCleanup: Solid.onCleanup,
  Show: Solid.Show,
  For: Solid.For,
  Switch: Solid.Switch,
  Match: Solid.Match,
  Index: Solid.Index,
  ErrorBoundary: Solid.ErrorBoundary,
  Suspense: Solid.Suspense,
  lazy: Solid.lazy,
  children: Solid.children,
  mergeProps: Solid.mergeProps,
  splitProps: Solid.splitProps,
  createRoot: Solid.createRoot,
  createComponent: Solid.createComponent,
};

const solidStoreAPI: SolidStoreAPI = {
  createStore: SolidStore.createStore,
  produce: SolidStore.produce,
};

// Simple getters
export function getSolid(): SolidAPI {
  return solidAPI;
}

export function getSolidStore(): SolidStoreAPI {
  return solidStoreAPI;
}

// Native Download Implementation
const createdUrls = new Set<string>();
const urlTimers = new Map<string, number>();
const URL_CLEANUP_TIMEOUT = 60000;

export function getNativeDownload(): NativeDownloadAPI {
  return {
    downloadBlob: (_blob: Blob, _filename: string): void => {
      logger.warn("Native download fallback removed. Use DownloadService.");
    },
    createDownloadUrl: (blob: Blob): string => {
      const url = URL.createObjectURL(blob);
      createdUrls.add(url);
      const timerId = globalTimerManager.setTimeout(() => {
        if (createdUrls.has(url)) {
          try {
            URL.revokeObjectURL(url);
            createdUrls.delete(url);
            urlTimers.delete(url);
          } catch (error) {
            logger.warn("Automatic URL cleanup failed:", error);
          }
        }
      }, URL_CLEANUP_TIMEOUT);
      urlTimers.set(url, timerId);
      return url;
    },
    revokeDownloadUrl: (url: string): void => {
      try {
        const timerId = urlTimers.get(url);
        if (timerId) {
          globalTimerManager.clearTimeout(timerId);
          urlTimers.delete(url);
        }
        URL.revokeObjectURL(url);
        createdUrls.delete(url);
      } catch (error) {
        logger.warn("URL revocation failed:", error);
      }
    },
  };
}

// Initialization stubs for compatibility
export async function initializeVendors(): Promise<void> {
  // No-op
}

export function cleanupVendors(): void {
  urlTimers.forEach((timerId) => globalTimerManager.clearTimeout(timerId));
  urlTimers.clear();
  createdUrls.forEach((url) => {
    try {
      URL.revokeObjectURL(url);
    } catch {
      void 0;
    }
  });
  createdUrls.clear();
}

export function registerVendorCleanupOnUnload(): void {
  void 0;
} // Other exports for compatibility
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
