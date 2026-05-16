/**
 * @fileoverview Application configuration and runtime metadata.
 * Provides environment detection, version resolution, and feature flags.
 */

import type { AppConfig } from '@shared/types/app-config.types';

type BooleanFlagValue = string | boolean | undefined;
type EnvSource = Partial<{
  DEV: BooleanFlagValue;
  MODE: string;
  VITE_AUTO_START: string;
  VITE_ENABLE_DEBUG_TOOLS: string;
}>;

const APP_NAME = 'X.com Enhanced Gallery';

/**
 * Overridable import.meta.env for test mocking.
 * Tests set this before module import to control environment state.
 */
declare global {
  var __XEG_IMPORT_META_ENV__: EnvSource | undefined;
}

function resolveEnv(): EnvSource {
  if (globalThis.__XEG_IMPORT_META_ENV__) return globalThis.__XEG_IMPORT_META_ENV__;
  return (import.meta as ImportMeta).env ?? {};
}

function parseBooleanFlag(value: BooleanFlagValue): boolean | undefined {
  if (typeof value === 'boolean') return value;
  if (typeof value !== 'string') return undefined;
  const normalized = value.trim().toLowerCase();
  if (!normalized) return undefined;
  if (['1', 'true', 'yes', 'on'].includes(normalized)) return true;
  if (['0', 'false', 'no', 'off'].includes(normalized)) return false;
  return undefined;
}

const env = resolveEnv();
const version = typeof __VERSION__ !== 'undefined' ? __VERSION__ : '0.0.0';
const devFlag = parseBooleanFlag(env.DEV);
const mode = env.MODE ?? 'production';
const isTest = mode === 'test';
const isDev = devFlag ?? (!isTest && mode !== 'production');
const isProd = !isDev && !isTest;

const resolvedAppConfig = Object.freeze({
  meta: {
    name: APP_NAME,
    version,
  },
  environment: {
    mode,
    isDev,
    isTest,
    isProduction: isProd,
  },
  runtime: {
    autoStart: parseBooleanFlag(env.VITE_AUTO_START) ?? true,
  },
  features: {
    gallery: true,
    download: true,
    settings: true,
    accessibility: true,
    debugTools: parseBooleanFlag(env.VITE_ENABLE_DEBUG_TOOLS) ?? isDev,
  },
  diagnostics: {
    enableLogger: true,
    enableVerboseLogs: isDev,
  },
} as const);

export function createAppConfig(): AppConfig {
  return {
    version: resolvedAppConfig.meta.version,
    isDevelopment: resolvedAppConfig.environment.isDev,
    debug: resolvedAppConfig.features.debugTools,
    autoStart: resolvedAppConfig.runtime.autoStart,
  } as const;
}
