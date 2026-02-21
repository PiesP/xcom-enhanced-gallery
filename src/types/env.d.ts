/// <reference types="vite/client" />

/** Development mode flag injected by Vite build. */
declare const __DEV__: boolean;

/** Feature flag for media extraction capabilities. */
declare const __FEATURE_MEDIA_EXTRACTION__: boolean;

/** Application version string from package.json. */
declare const __VERSION__: string;

/** Build timestamp in ISO 8601 format. */
declare const __BUILD_TIME__: string;

/** Vite-injected environment variables and metadata. */
interface ImportMetaEnv {
  readonly PROD: boolean;
  readonly DEV: boolean;
  readonly MODE: string;
  readonly BASE_URL: string;
  readonly SSR: boolean;
}

/** Extended ImportMeta interface with Vite environment augmentation. */
// eslint-disable-next-line @typescript-eslint/no-unused-vars
interface ImportMeta {
  readonly env: ImportMetaEnv;
}

/**
 * Minimal process global typing for browser+test/tooling builds.
 *
 * - Keeps source code portable without importing Node types in browser bundles
 * - Exposes `env` and `cwd()` used by test/tooling code paths
 */
declare const process: {
  env: {
    VITEST?: string;
    [key: string]: string | undefined;
  };
  cwd: () => string;
  argv: string[];
  exit: (code?: number) => never;
  stderr?: {
    write: (chunk: string | Uint8Array, encoding?: string, cb?: (err?: Error) => void) => boolean;
  };
};
