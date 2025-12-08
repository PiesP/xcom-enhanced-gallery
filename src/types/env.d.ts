/// <reference types="vite/client" />

declare const __DEV__: boolean;
declare const __FEATURE_MEDIA_EXTRACTION__: boolean;
declare const __VERSION__: string;
declare const __BUILD_TIME__: string;

// Vite-specific import.meta.env augmentation for Deno compatibility
interface ImportMetaEnv {
  readonly PROD: boolean;
  readonly DEV: boolean;
  readonly MODE: string;
  readonly BASE_URL: string;
  readonly SSR: boolean;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}

// Node.js process for Vitest compatibility check
declare const process:
  | {
      env?: {
        VITEST?: string;
        [key: string]: string | undefined;
      };
    }
  | undefined;
