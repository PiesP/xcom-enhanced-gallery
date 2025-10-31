import { expect, test } from '@playwright/test';
import { ensureHarness } from './utils';

test.describe('Render after window load (Phase 289)', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('about:blank');
    await ensureHarness(page);
  });

  test('waits for window load event before initializing gallery', async ({ page }) => {
    const result = await page.evaluate(async () => {
      const harness = (window as any).__XEG_HARNESS__ as any;
      if (!harness) throw new Error('Harness not available');

      // Simulate document not complete yet
      Object.defineProperty(document, 'readyState', { value: 'loading', configurable: true });

      const p = harness.waitForWindowLoad({ timeoutMs: 500, forceEventPath: true });
      // Fire window load shortly after
      setTimeout(() => window.dispatchEvent(new Event('load')), 50);
      return await p;
    });

    expect(result).toBe(true);
  });

  test('falls back after timeout and continues (returns false)', async ({ page }) => {
    const result = await page.evaluate(async () => {
      const harness = (window as any).__XEG_HARNESS__ as any;
      if (!harness) throw new Error('Harness not available');
      Object.defineProperty(document, 'readyState', { value: 'loading', configurable: true });
      return await harness.waitForWindowLoad({ timeoutMs: 50, forceEventPath: true });
    });

    expect(result).toBe(false);
  });
});
