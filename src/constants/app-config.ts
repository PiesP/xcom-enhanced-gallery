/**
 * @fileoverview Application configuration single source of truth
 * @description Consolidates runtime metadata, feature flags, and bootstrap helpers.
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

// Bootstrap configuration constants
const DEFAULT_SERVICE_TIMEOUT_MS = 10000;
const DEFAULT_BOOTSTRAP_RETRY_ATTEMPTS = 3;
const DEFAULT_BOOTSTRAP_RETRY_DELAY_MS = 100;

declare global {
  var __XEG_IMPORT_META_ENV__: EnvSource | undefined;
}

const importMetaEnv = resolveImportMetaEnv();
const nodeEnv = resolveNodeEnv();

const buildVersion = typeof __VERSION__ !== 'undefined' ? __VERSION__ : undefined;

const rawVersion =
  resolveStringValue(
    buildVersion,
    importMetaEnv.VITE_VERSION,
    nodeEnv.VITE_VERSION,
    nodeEnv.npm_package_version
  ) ?? FALLBACK_VERSION;

const devFlag = parseBooleanFlag(importMetaEnv.DEV);
const nodeDevFlag = parseBooleanFlag(nodeEnv.DEV);

const mode = importMetaEnv.MODE ?? nodeEnv.NODE_ENV ?? 'production';
const isTest = mode === 'test';
const isDev = devFlag ?? nodeDevFlag ?? (!isTest && mode !== 'production');
const isProd = !isDev && !isTest;

const autoStartFlag = parseBooleanFlag(importMetaEnv.VITE_AUTO_START ?? nodeEnv.VITE_AUTO_START);
const debugToolsFlag = parseBooleanFlag(
  importMetaEnv.VITE_ENABLE_DEBUG_TOOLS ?? nodeEnv.VITE_ENABLE_DEBUG_TOOLS
);

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
    downloads: true,
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

export type ResolvedAppConfig = typeof resolvedAppConfig;

const APP_CONFIG: ResolvedAppConfig = resolvedAppConfig;

/**
 * Lightweight getter to emphasize read-only usage and simplify future memoization.
 */
function getAppConfig(): ResolvedAppConfig {
  return APP_CONFIG;
}

/**
 * Create bootstrap-facing app config (consumed by main.ts and dev namespace helpers).
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

function resolveNodeEnv(): NodeEnvSource {
  if (typeof process !== 'undefined' && process?.env) {
    return process.env;
  }

  return {};
}

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
