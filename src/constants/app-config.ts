/**
 * @fileoverview Application configuration and runtime metadata.
 */

type BooleanFlagValue = string | boolean | undefined;

const APP_NAME = 'X.com Enhanced Gallery';

function parseBooleanFlag(value: BooleanFlagValue): boolean | undefined {
  if (typeof value === 'boolean') return value;
  if (typeof value !== 'string') return undefined;
  const normalized = value.trim().toLowerCase();
  if (!normalized) return undefined;
  if (['1', 'true', 'yes', 'on'].includes(normalized)) return true;
  if (['0', 'false', 'no', 'off'].includes(normalized)) return false;
  return undefined;
}

export interface AppConfig {
  readonly version: string;
  readonly isDevelopment: boolean;
  readonly debug: boolean;
  readonly autoStart: boolean;
}

const env = (import.meta as ImportMeta).env ?? {};
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
