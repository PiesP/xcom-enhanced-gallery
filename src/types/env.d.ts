/// <reference types="vite/client" />

/**
 * Development mode flag injected by Vite build.
 * Set to `true` during development, `false` in production builds.
 */
declare const __DEV__: boolean;

/**
 * Feature flag for media extraction capabilities.
 * Set during build configuration; controls optional media extraction features.
 */
declare const __FEATURE_MEDIA_EXTRACTION__: boolean;

/**
 * Application version string from package.json.
 * Injected at build time for version reporting and logging.
 */
declare const __VERSION__: string;

/**
 * Build timestamp generated during the build process.
 * ISO 8601 format string for debugging and audit purposes.
 */
declare const __BUILD_TIME__: string;

/**
 * Vite-injected environment variables and metadata.
 * Contains standard Vite environment properties available at runtime.
 */
interface ImportMetaEnv {
  readonly PROD: boolean;
  readonly DEV: boolean;
  readonly MODE: string;
  readonly BASE_URL: string;
  readonly SSR: boolean;
}

/**
 * Extended ImportMeta interface with Vite's environment augmentation.
 * Provides access to build-time and runtime environment variables.
 * This augments the global ImportMeta type from Vite's type definitions.
 */
// eslint-disable-next-line @typescript-eslint/no-unused-vars
interface ImportMeta {
  readonly env: ImportMetaEnv;
}

/**
 * Node.js process global for Vitest compatibility.
 * Allows ambient type checking during test execution.
 * Type: undefined in browser; contains env object in Node.js (test) environment.
 */
declare const process:
  | {
      env?: {
        VITEST?: string;
        [key: string]: string | undefined;
      };
    }
  | undefined;
