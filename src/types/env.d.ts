// SPDX-License-Identifier: MIT
// Copyright (c) 2024-2026 PiesP

/// <reference types="vite/client" />

/** Development mode flag injected by Vite build. */
declare const __DEV__: boolean;

/** Feature flag for media extraction capabilities. */
declare const __FEATURE_MEDIA_EXTRACTION__: boolean;

/** Application version string from package.json. */
declare const __VERSION__: string;

/** Vite-injected environment variables and metadata. */
interface ImportMetaEnv {
  readonly PROD: boolean;
  readonly DEV: boolean;
  readonly MODE: string;
  readonly BASE_URL: string;
  readonly SSR: boolean;
}

/** Extended ImportMeta interface with Vite environment augmentation. */
interface ImportMeta {
  readonly env: ImportMetaEnv;
}
