import type { Page } from '@playwright/test';

export async function ensureHarness(page: Page): Promise<void> {
  const harnessPath = process.env.XEG_E2E_HARNESS_PATH;
  if (!harnessPath) {
    throw new Error('XEG_E2E_HARNESS_PATH is not set. Ensure Playwright global setup ran.');
  }

  const isLoaded = await page.evaluate<boolean | null>(() => {
    return typeof window.__XEG_HARNESS__ !== 'undefined';
  });

  if (!isLoaded) {
    await page.addScriptTag({ path: harnessPath });
    await page.waitForFunction(() => typeof window.__XEG_HARNESS__ !== 'undefined');
  }
}
