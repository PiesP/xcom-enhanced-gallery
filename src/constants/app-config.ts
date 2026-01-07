/**
 * @fileoverview Application Configuration and Runtime Metadata
 *
 * ## Purpose
 * Serves as the single source of truth for application-wide configuration, consolidating
 * runtime metadata, environment detection, feature flags, and bootstrap parameters. Provides
 * compile-time and runtime configuration resolution with cross-environment compatibility.
 *
 * ## Key Responsibilities
 * - **Environment Detection**: Resolve runtime environment (development, production, test)
 * - **Version Management**: Extract and normalize version from multiple sources
 * - **Feature Flags**: Control feature availability based on environment
 * - **Bootstrap Configuration**: Provide service initialization parameters (timeouts, retries)
 * - **Metadata Exposure**: Supply app name, version, and runtime settings
 *
 * ## Configuration Resolution
 * Configuration values are resolved from multiple sources with priority:
 * 1. **Build-time globals**: `__VERSION__` injected by Vite
 * 2. **import.meta.env**: Vite environment variables at build/runtime
 * 3. **process.env**: Node.js environment variables (fallback for tooling)
 * 4. **Fallback constants**: Default values when no source available
 *
 * ## Environment Detection Strategy
 * - **Development**: `isDev = true` when `DEV=true` or `MODE=development`
 * - **Production**: `isProduction = true` when neither dev nor test
 * - **Test**: `isTest = true` when `MODE=test`
 * - Cross-platform: Works in browsers (Vite) and Node.js (tooling/tests)
 *
 * ## Feature Flag System
 * - **gallery**: Gallery view rendering (always enabled)
 * - **download**: Media download functionality (always enabled)
 * - **settings**: User settings panel (always enabled)
 * - **accessibility**: A11y features (always enabled)
 * - **debugTools**: Dev tools and debug panel (enabled in dev mode only)
 *
 * ## Bootstrap Parameters
 * - **serviceTimeoutMs**: Maximum time for service initialization (10 seconds)
 * - **retryAttempts**: Number of bootstrap retry attempts on failure (3 attempts)
 * - **retryDelayMs**: Delay between retry attempts (100ms)
 *
 * ## Usage Pattern
 * Configuration is frozen and read-only. Access via {@link createAppConfig} for bootstrap
 * context or import `APP_CONFIG` directly for internal use.
 *
 * @module constants/app-config
 */

import type { AppConfig as BootstrapAppConfig } from '@shared/types/app.types';

/**
 * Union type for boolean flag values from environment sources.
 * Supports string representations ('true', '1', 'yes', 'on', etc.) and native booleans.
 */
type BooleanFlagValue = string | boolean | undefined;

/**
 * Shape of Vite's import.meta.env object with application-relevant fields.
 * All fields optional to support partial availability across environments.
 *
 * @property DEV - Vite development mode flag (boolean or string)
 * @property MODE - Build mode: 'development', 'production', or 'test'
 * @property VITE_VERSION - Application version from package.json or env override
 * @property VITE_AUTO_START - Auto-start flag for bootstrap initialization
 * @property VITE_ENABLE_DEBUG_TOOLS - Debug tools feature flag
 */
type EnvSource = Partial<{
  DEV: BooleanFlagValue;
  MODE: string;
  VITE_VERSION: string;
  VITE_AUTO_START: string;
  VITE_ENABLE_DEBUG_TOOLS: string;
}>;

/**
 * Shape of Node.js process.env with application-relevant fields.
 * Generic string-to-string mapping to support tooling and test environments.
 */
type NodeEnvSource = Partial<Record<string, string | undefined>>;

/**
 * Fallback version used when no version source is available.
 * Indicates missing version metadata in build configuration.
 */
const FALLBACK_VERSION = '0.0.0';

/**
 * Human-readable application name displayed in UI and logs.
 */
const APP_NAME = 'X.com Enhanced Gallery';

/**
 * Maximum number of media items allowed in gallery view.
 * Prevents performance degradation from excessive DOM elements.
 */
const MAX_GALLERY_ITEMS = 100;

/**
 * Default animation duration using CSS custom property token.
 * References `--xeg-duration-normal` from design system.
 */
const DEFAULT_ANIMATION_DURATION = 'var(--xeg-duration-normal)';

/**
 * Default timeout for service initialization in milliseconds.
 * Services exceeding this duration are considered failed.
 */
const DEFAULT_SERVICE_TIMEOUT_MS = 10000;

/**
 * Default number of retry attempts for failed bootstrap stages.
 * Critical services retry up to this count before failing permanently.
 */
const DEFAULT_BOOTSTRAP_RETRY_ATTEMPTS = 3;

/**
 * Default delay between bootstrap retry attempts in milliseconds.
 * Provides brief cooldown before retrying failed initialization.
 */
const DEFAULT_BOOTSTRAP_RETRY_DELAY_MS = 100;

/**
 * Global declaration for injected import.meta.env object.
 * Used by test environments to mock Vite's environment without runtime Vite.
 *
 * @internal
 */
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
 *
 * Lightweight getter that emphasizes read-only usage and provides a single access point
 * for the configuration. Future implementations may add memoization or caching logic.
 *
 * ## Implementation Details
 * Currently returns the frozen APP_CONFIG object directly. The getter pattern provides
 * flexibility for future enhancements without changing the public API.
 *
 * @returns Immutable application configuration object
 *
 * @internal
 * @remarks
 * This function is internal to the module. External consumers should use
 * {@link createAppConfig} for bootstrap-specific configuration.
 */
function getAppConfig(): ResolvedAppConfig {
  return APP_CONFIG;
}

/**
 * Create bootstrap-facing application configuration.
 *
 * Transforms the full application configuration into a minimal bootstrap configuration
 * object consumed by main.ts and dev namespace helpers. Provides only the fields required
 * for bootstrap initialization, avoiding unnecessary exposure of internal configuration.
 *
 * ## Configuration Fields
 * - **version**: Application version string for display and logging
 * - **isDevelopment**: Development environment flag for conditional behavior
 * - **debug**: Debug tools availability flag (enabled in dev mode)
 * - **autoStart**: Auto-start flag controlling bootstrap initialization
 *
 * ## Usage Context
 * - **main.ts**: Bootstrap entry point reads configuration for initialization
 * - **dev-namespace.ts**: Dev tools read configuration for debug panel
 * - **Type contract**: Returns {@link BootstrapAppConfig} from shared types
 *
 * @returns Bootstrap configuration object (frozen, read-only)
 *
 * @example
 * ```typescript
 * // Bootstrap entry point usage
 * import { createAppConfig } from '@constants/app-config';
 *
 * const config = createAppConfig();
 * console.log(`Starting ${config.version} in ${config.isDevelopment ? 'dev' : 'prod'} mode`);
 *
 * if (config.autoStart) {
 *   await bootstrap();
 * }
 * ```
 *
 * @example
 * ```typescript
 * // Dev namespace usage
 * const config = createAppConfig();
 * if (config.debug) {
 *   window.__xeg_dev__ = { config };
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
 * Resolve import.meta.env object from Vite or test mock.
 *
 * Attempts to access Vite's import.meta.env object with graceful fallback for non-Vite
 * environments. Supports test mocking via global.__XEG_IMPORT_META_ENV__ injection.
 *
 * ## Resolution Strategy
 * 1. **Test Mock**: Check global.__XEG_IMPORT_META_ENV__ for test environment injection
 * 2. **Vite Environment**: Access import.meta.env if available (Vite builds)
 * 3. **Fallback**: Return empty object if neither source available (Node.js tooling)
 *
 * @returns Environment source object or empty object on failure
 *
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
 * Resolve process.env object from Node.js environment.
 *
 * Attempts to access Node.js process.env with graceful fallback for browser environments.
 * Provides environment variable access for tooling and test contexts.
 *
 * ## Implementation Details
 * - **Node.js**: Returns process.env if available (Node.js/tooling contexts)
 * - **Browser**: Returns empty object (process is undefined in browsers)
 * - **Safety**: Uses optional chaining to avoid ReferenceError
 *
 * @returns Node environment source object or empty object
 *
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
 *
 * Converts various string representations of booleans to native boolean values.
 * Supports common conventions: '1'/'0', 'true'/'false', 'yes'/'no', 'on'/'off'.
 *
 * ## Parsing Rules
 * - **Boolean input**: Returned as-is
 * - **Truthy strings**: '1', 'true', 'yes', 'on' (case-insensitive) → true
 * - **Falsy strings**: '0', 'false', 'no', 'off' (case-insensitive) → false
 * - **Empty/whitespace**: undefined
 * - **Other strings**: undefined
 * - **Undefined/null**: undefined
 *
 * @param value - Flag value from environment variable or config
 * @returns Parsed boolean value, or undefined if not recognizable
 *
 * @internal
 *
 * @example
 * ```typescript
 * parseBooleanFlag(true)        // → true
 * parseBooleanFlag('1')         // → true
 * parseBooleanFlag('TRUE')      // → true
 * parseBooleanFlag('yes')       // → true
 * parseBooleanFlag('0')         // → false
 * parseBooleanFlag('false')     // → false
 * parseBooleanFlag('')          // → undefined
 * parseBooleanFlag('invalid')   // → undefined
 * ```
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
 * Resolve first non-empty string from multiple values.
 *
 * Iterates through provided values and returns the first non-empty, trimmed string.
 * Used for version resolution with priority-based fallback logic.
 *
 * ## Resolution Logic
 * - Iterate through values in order
 * - For each string value, trim whitespace
 * - Return first string with length > 0
 * - Return undefined if all values empty or non-string
 *
 * ## Use Cases
 * - Version resolution: buildVersion → VITE_VERSION → npm_package_version → fallback
 * - Priority-based configuration: first available wins
 * - Environment variable consolidation
 *
 * @param values - Array of string or undefined values to check
 * @returns First non-empty trimmed string, or undefined if none found
 *
 * @internal
 *
 * @example
 * ```typescript
 * resolveStringValue('1.0.0', undefined, '2.0.0')  // → '1.0.0'
 * resolveStringValue(undefined, '   ', '2.0.0')    // → '2.0.0'
 * resolveStringValue('', undefined, undefined)     // → undefined
 * ```
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
