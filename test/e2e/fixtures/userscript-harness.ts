// SPDX-License-Identifier: MIT
// Copyright (c) 2024-2026 PiesP

import type { Page } from '@playwright/test';
import { readFileSync } from 'node:fs';
import { DEV_USERSCRIPT_PATH } from './artifacts';

export async function injectDevUserscript(page: Page): Promise<void> {
  const bundle = readFileSync(DEV_USERSCRIPT_PATH, 'utf8');
  const result = await page.evaluate((code: string) => {
    try {
      const script = document.createElement('script');
      script.textContent = code;
      (document.head || document.documentElement).appendChild(script);
      return { success: true } as const;
    } catch (error: unknown) {
      return { success: false, error: (error as Error).message } as const;
    }
  }, bundle);

  if (!result.success) throw new Error(`Failed to inject userscript: ${result.error}`);
}

export async function waitForGalleryApp(page: Page): Promise<void> {
  await page.waitForFunction(
    () =>
      Boolean(
        (globalThis as typeof globalThis & {
          __XEG__?: { main?: { galleryApp?: unknown } };
        }).__XEG__?.main?.galleryApp
      ),
    undefined,
    { timeout: 15_000 }
  );
}
