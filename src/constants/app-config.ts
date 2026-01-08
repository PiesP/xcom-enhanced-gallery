/**
 * @fileoverview Application configuration and runtime metadata.
 *
 * Provides environment detection, version resolution, and feature flags.
 * Configuration is resolved from build-time globals, import.meta.env, and process.env.
 *
 * @module constants/app-config
 */

import type { AppConfig as BootstrapAppConfig } from '@shared/types/app.types';

type BooleanFlagValue = string | boolean | undefined;
type EnvSource = Partial<{
  DEV: BooleanFlagValue;
  MODE: string;
  VITE_VERSION: string;
  VITE_AUTO_START: string;
  VITE_ENABLE_DEBUG_TOOLS: string;
}>;
type NodeEnvSource = Partial<Record<string, string | undefined>>;

const FALLBACK_VERSION = '0.0.0';
const APP_NAME = 'X.com Enhanced Gallery';
const MAX_GALLERY_ITEMS = 100;
const DEFAULT_ANIMATION_DURATION = 'var(--xeg-duration-normal)';
const DEFAULT_SERVICE_TIMEOUT_MS = 10000;
const DEFAULT_BOOTSTRAP_RETRY_ATTEMPTS = 3;
const DEFAULT_BOOTSTRAP_RETRY_DELAY_MS = 100;

declare global {
  var __XEG_IMPORT_META_ENV__: EnvSource | undefined;
}

/**
 * Resolved import.meta.env object from Vite or test mock.
 */
const importMetaEnv = resolveImportMetaEnv();

/**
 * Resolved process.env object from Node.js (fallback for tooling).
 */
const nodeEnv = resolveNodeEnv();

/**
 * Build-time version injected by Vite's define plugin.
 * Undefined if build didn't inject __VERSION__ global.
 */
const buildVersion = typeof __VERSION__ !== 'undefined' ? __VERSION__ : undefined;

/**
 * Resolved application version from multiple sources with priority order.
 * Priority: buildVersion → VITE_VERSION → npm_package_version → FALLBACK_VERSION
 */
const rawVersion =
  resolveStringValue(
    buildVersion,
    importMetaEnv.VITE_VERSION,
    nodeEnv.VITE_VERSION,
    nodeEnv.npm_package_version
  ) ?? FALLBACK_VERSION;

/**
 * Development flag from import.meta.env (Vite boolean flag).
 */
const devFlag = parseBooleanFlag(importMetaEnv.DEV);

/**
 * Development flag from process.env (Node.js string flag).
 */
const nodeDevFlag = parseBooleanFlag(nodeEnv.DEV);

/**
 * Resolved runtime mode: 'development', 'production', or 'test'.
 * Priority: import.meta.env.MODE → NODE_ENV → 'production'
 */
const mode = importMetaEnv.MODE ?? nodeEnv.NODE_ENV ?? 'production';

/**
 * Test environment flag (true when MODE === 'test').
 */
const isTest = mode === 'test';

/**
 * Development environment flag (true when DEV flag set or MODE === 'development').
 */
const isDev = devFlag ?? nodeDevFlag ?? (!isTest && mode !== 'production');

/**
 * Production environment flag (true when not dev and not test).
 */
const isProd = !isDev && !isTest;

/**
 * Auto-start flag from environment variables (controls bootstrap initialization).
 * Defaults to true if not explicitly disabled.
 */
const autoStartFlag = parseBooleanFlag(importMetaEnv.VITE_AUTO_START ?? nodeEnv.VITE_AUTO_START);

/**
 * Debug tools feature flag from environment variables.
 * Defaults to development mode value if not explicitly set.
 */
const debugToolsFlag = parseBooleanFlag(
  importMetaEnv.VITE_ENABLE_DEBUG_TOOLS ?? nodeEnv.VITE_ENABLE_DEBUG_TOOLS
);

/**
 * Frozen application configuration object with all resolved values.
 * Immutable at runtime to prevent accidental modifications.
 *
 * @property meta - Application metadata (name, version)
 * @property environment - Runtime environment flags (mode, isDev, isTest, isProduction)
 * @property runtime - Runtime behavior settings (autoStart)
 * @property limits - Application limits (maxGalleryItems)
 * @property ui - UI configuration (animationDuration)
 * @property features - Feature flags (gallery, download, settings, accessibility, debugTools)
 * @property diagnostics - Logging configuration (enableLogger, enableVerboseLogs)
 * @property bootstrap - Bootstrap initialization parameters (timeouts, retries)
 */
const resolvedAppConfig = Object.freeze({
  meta: {
    name: APP_NAME,
    version: rawVersion,
  },
  environment: {
    mode,
    isDev,
    isTest,
    isProduction: isProd,
  },
  runtime: {
    autoStart: autoStartFlag ?? true,
  },
  limits: {
    maxGalleryItems: MAX_GALLERY_ITEMS,
  },
  ui: {
    animationDuration: DEFAULT_ANIMATION_DURATION,
  },
  features: {
    gallery: true,
    download: true,
    settings: true,
    accessibility: true,
    debugTools: debugToolsFlag ?? isDev,
  },
  diagnostics: {
    enableLogger: true,
    enableVerboseLogs: isDev,
  },
  bootstrap: {
    serviceTimeoutMs: DEFAULT_SERVICE_TIMEOUT_MS,
    retryAttempts: DEFAULT_BOOTSTRAP_RETRY_ATTEMPTS,
    retryDelayMs: DEFAULT_BOOTSTRAP_RETRY_DELAY_MS,
  },
} as const);

/**
 * Type alias for the resolved application configuration.
 * Preserves literal types from the frozen configuration object.
 */
type ResolvedAppConfig = typeof resolvedAppConfig;

/**
 * Application configuration singleton.
 * Immutable reference to the resolved configuration object.
 *
 * @internal
 * @remarks
 * Direct access is internal. External consumers should use {@link createAppConfig}
 * for bootstrap context or {@link getAppConfig} for general access.
 */
const APP_CONFIG: ResolvedAppConfig = resolvedAppConfig;

/**
 * Get the application configuration object.
 * @internal Resolve first non-empty string from multiple values with priority fallback.
 */
function getAppConfig(): ResolvedAppConfig {
  return APP_CONFIG;
}

/**
 * Create bootstrap-facing application configuration.
 *
 * Transforms full configuration into minimal bootstrap object with version,
 * environment flags, and auto-start setting.
 *
 * @returns Bootstrap configuration object (frozen, read-only)
 *
 * @example
 * ```typescript
 * const config = createAppConfig();
 * if (config.autoStart) {
 *   await bootstrap();
 * }
 * ```
 */
export function createAppConfig(): BootstrapAppConfig {
  const config = getAppConfig();

  return {
    version: config.meta.version,
    isDevelopment: config.environment.isDev,
    debug: config.features.debugTools,
    autoStart: config.runtime.autoStart,
  } as const;
}

/**
 * Resolve import.meta.env from Vite or test mock.
 * Supports test mocking via globalThis.__XEG_IMPORT_META_ENV__.
 * @internal
 */
function resolveImportMetaEnv(): EnvSource {
  if (typeof globalThis !== 'undefined' && globalThis.__XEG_IMPORT_META_ENV__) {
    return globalThis.__XEG_IMPORT_META_ENV__;
  }

  try {
    return (import.meta as ImportMeta).env ?? {};
  } catch {
    return {};
  }
}

/**
 * Resolve process.env from Node.js environment.
 * Returns empty object in browser environments.
 * @internal
 */
function resolveNodeEnv(): NodeEnvSource {
  if (typeof process !== 'undefined' && process?.env) {
    return process.env;
  }

  return {};
}

/**
 * Parse boolean flag from string or boolean value.
 * Supports: '1'/'true'/'yes'/'on' → true, '0'/'false'/'no'/'off' → false
 * @internal
 */
function parseBooleanFlag(value: BooleanFlagValue): boolean | undefined {
  if (typeof value === 'boolean') {
    return value;
  }

  if (typeof value === 'string') {
    const normalized = value.trim().toLowerCase();

    if (!normalized) {
      return undefined;
    }

    if (['1', 'true', 'yes', 'on'].includes(normalized)) {
      return true;
    }

    if (['0', 'false', 'no', 'off'].includes(normalized)) {
      return false;
    }
  }

  return undefined;
}

/**
 * Resolve first non-empty string from multiple values with priority fallback.
 * @internal
 */
function resolveStringValue(...values: Array<string | undefined>): string | undefined {
  for (const value of values) {
    if (typeof value === 'string') {
      const normalized = value.trim();

      if (normalized.length > 0) {
        return normalized;
      }
    }
  }

  return undefined;
}
