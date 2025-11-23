/** Build-time globals injected via `vite.config.ts` (`define`). */
declare const __DEV__: boolean;
declare const __IS_DEV__: boolean;
declare const __VERSION__: string;
declare const __FEATURE_MEDIA_EXTRACTION__: boolean;

/** Dev/test-only debug surface for tracing gallery lifecycles. */
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
