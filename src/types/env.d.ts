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

/** Node.js process global for Vitest (undefined in browser, env object in Node.js). */
declare const process:
  | {
      env?: {
        VITEST?: string;
        [key: string]: string | undefined;
      };
    }
  | undefined;
