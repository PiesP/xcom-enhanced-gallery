/**
 * Build-time global variables — defined in vite.config.ts
 * Injected by Vite's define plugin, used directly as global variables
 * instead of import.meta.env for tree-shaking optimization.
 */

/** Development mode flag (true: npm run build:dev, false: npm run build:prod) */
declare const __DEV__: boolean;

/** Alias flag for development mode (used for tree-shaken debug helpers) */
declare const __IS_DEV__: boolean;

/** Project version (read from package.json) */
declare const __VERSION__: string;

/**
 * Phase 326.5: Feature Flags
 * Disable optional features at build time to reduce bundle size
 */

/** Media Extraction feature flag (default: true, ~50 KB savings when disabled) */
declare const __FEATURE_MEDIA_EXTRACTION__: boolean;

/**
 * __XEG_DEBUG__ is a runtime debug object used only in development and tests.
 * Declared here to avoid casting to `any` across codebase and to improve types.
 */
interface XEGDebug {
  inits?: number;
  cleanups?: number;
  lastInitBy?: string | null;
  lastCleanupBy?: string | null;
  [key: string]: unknown;
}

declare global {
  var __XEG_DEBUG__: XEGDebug | undefined;
}
