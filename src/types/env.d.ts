/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_VERSION: string;
  readonly DEV: boolean;
  readonly PROD: boolean;
  readonly MODE: string;
  readonly SSR: boolean;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
