/**
 * @fileoverview Vendor Library Utilities for X.com Enhanced Gallery
 *
 * This module provides access to external vendor libraries used throughout the application.
 * It follows a consistent pattern for accessing fflate, Motion One, Preact, and other libraries
 * while providing error handling and validation.
 *
 * @module vendors
 * @version 3.1.0
 */

// Type definitions
export interface FflateAPI {
  zip: (
    files: { [filename: string]: Uint8Array },
    callback: (error: Error | null, data: Uint8Array) => void
  ) => void;
  unzip: (
    data: Uint8Array,
    callback: (error: Error | null, files: { [filename: string]: Uint8Array }) => void
  ) => void;
  strToU8: (str: string) => Uint8Array;
  zipSync: (files: { [filename: string]: Uint8Array }, options?: { level?: number }) => Uint8Array;
}

export interface MotionAPI {
  animate: (
    target: Element | Element[],
    keyframes: Record<string, unknown>,
    options?: Record<string, unknown>
  ) => void;
  timeline: (timeline: Record<string, unknown>[]) => void;
  stagger: (duration: number) => (index: number) => number;
}

export interface PreactAPI {
  h: (
    type: string | Function,
    props?: Record<string, unknown> | null,
    ...children: unknown[]
  ) => unknown;
  render: (component: unknown, container: Element) => void;
  Fragment: string;
}

export interface PreactSignalsAPI {
  signal: <T>(value: T) => { value: T };
  computed: <T>(fn: () => T) => { readonly value: T };
  effect: (fn: () => void) => () => void;
  batch: <T>(fn: () => T) => T;
}

export interface VendorVersions {
  fflate: string;
  motion: string;
  preact: string;
  signals: string;
}

export interface InitializationResult {
  success: boolean;
  loadedLibraries: string[];
  errors: string[];
}

// Window interface extension
interface ExtendedWindow extends Window {
  fflate?: FflateAPI;
  Motion?: MotionAPI;
  Preact?: PreactAPI;
  PreactSignals?: PreactSignalsAPI;
}

/**
 * Get fflate library instance
 */
export function getFflate(): FflateAPI {
  const extWindow = (typeof window !== 'undefined' ? window : {}) as ExtendedWindow;

  if (!extWindow.fflate) {
    throw new Error('fflate library not loaded');
  }

  return extWindow.fflate;
}

/**
 * Get Motion One library instance
 */
export function getMotion(): MotionAPI {
  const extWindow = (typeof window !== 'undefined' ? window : {}) as ExtendedWindow;

  if (!extWindow.Motion) {
    throw new Error('Motion One library not loaded');
  }

  return extWindow.Motion;
}

/**
 * Get Preact library instance
 */
export function getPreact(): PreactAPI {
  const extWindow = (typeof window !== 'undefined' ? window : {}) as ExtendedWindow;

  if (!extWindow.Preact) {
    throw new Error('Preact library not loaded');
  }

  return extWindow.Preact;
}

/**
 * Get Preact Signals library instance
 */
export function getPreactSignals(): PreactSignalsAPI {
  const extWindow = (typeof window !== 'undefined' ? window : {}) as ExtendedWindow;

  if (!extWindow.PreactSignals) {
    throw new Error('Preact Signals library not loaded');
  }

  return extWindow.PreactSignals;
}

/**
 * Validate that all required vendor libraries are loaded
 */
export function validateVendors(): void {
  const extWindow = (typeof window !== 'undefined' ? window : {}) as ExtendedWindow;

  const missingLibraries: string[] = [];

  if (!extWindow.fflate) {
    missingLibraries.push('fflate');
  }

  if (!extWindow.Motion) {
    missingLibraries.push('Motion One');
  }

  if (!extWindow.Preact) {
    missingLibraries.push('Preact');
  }

  if (!extWindow.PreactSignals) {
    missingLibraries.push('Preact Signals');
  }

  if (missingLibraries.length > 0) {
    throw new Error(`Missing vendor libraries: ${missingLibraries.join(', ')}`);
  }
}

/**
 * Get vendor library versions
 */
export function getVendorVersions(): VendorVersions {
  const extWindow = (typeof window !== 'undefined' ? window : {}) as ExtendedWindow;

  const fflateVersion = (extWindow.fflate as unknown as Record<string, unknown>)?.version;
  const motionVersion = (extWindow.Motion as unknown as Record<string, unknown>)?.version;
  const preactVersion = (extWindow.Preact as unknown as Record<string, unknown>)?.version;
  const signalsVersion = (extWindow.PreactSignals as unknown as Record<string, unknown>)?.version;

  return {
    fflate: typeof fflateVersion === 'string' ? fflateVersion : 'unknown',
    motion: typeof motionVersion === 'string' ? motionVersion : 'unknown',
    preact: typeof preactVersion === 'string' ? preactVersion : 'unknown',
    signals: typeof signalsVersion === 'string' ? signalsVersion : 'unknown',
  };
}

/**
 * Initialize all vendor libraries
 */
export async function initializeVendors(): Promise<InitializationResult> {
  const extWindow = (typeof window !== 'undefined' ? window : {}) as ExtendedWindow;
  const loadedLibraries: string[] = [];
  const errors: string[] = [];

  // Check fflate
  if (extWindow.fflate) {
    loadedLibraries.push('fflate');
  } else {
    errors.push('fflate library not loaded');
  }

  // Check Motion One
  if (extWindow.Motion) {
    loadedLibraries.push('Motion');
  } else {
    errors.push('Motion One library not loaded');
  }

  // Check Preact
  if (extWindow.Preact) {
    loadedLibraries.push('Preact');
  } else {
    errors.push('Preact library not loaded');
  }

  // Check Preact Signals
  if (extWindow.PreactSignals) {
    loadedLibraries.push('PreactSignals');
  } else {
    errors.push('Preact Signals library not loaded');
  }

  return {
    success: errors.length === 0,
    loadedLibraries,
    errors,
  };
}
