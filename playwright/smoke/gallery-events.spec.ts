import { expect, test } from '@playwright/test';
import { ensureHarness } from './utils';

type GalleryEventsResult = {
  registeredEvents: string[];
  forbiddenEvents: string[];
  escapeWhenClosed: number;
  escapeWhenOpen: number;
  enterDelegated: number;
};

test.describe('Gallery event policy', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('about:blank');
    await ensureHarness(page);
  });

  test.afterEach(async ({ page }) => {
    await page.evaluate(async () => {
      const harness = window.__XEG_HARNESS__;
      if (!harness) return;
      try {
        await harness.disposeGalleryApp();
      } catch {
        /* ignore */
      }
    });
  });

  test('restricts to PC events and handles keyboard routing', async ({ page }) => {
    const result = (await page.evaluate(async () => {
      const harness = window.__XEG_HARNESS__;
      if (!harness) throw new Error('Harness not available');
      return harness.evaluateGalleryEvents();
    })) as GalleryEventsResult;

    expect(result.registeredEvents).toEqual(expect.arrayContaining(['click', 'keydown']));
    expect(result.forbiddenEvents.length).toBe(0);
    expect(result.escapeWhenClosed).toBe(0);
    expect(result.escapeWhenOpen).toBe(1);
    expect(result.enterDelegated).toBeGreaterThanOrEqual(1);
  });
});
