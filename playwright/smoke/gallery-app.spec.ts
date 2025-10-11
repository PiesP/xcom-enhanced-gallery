import { expect, test } from '@playwright/test';
import { ensureHarness } from './utils';

type GalleryAppSetupResult = {
  initialized: boolean;
  eventHandlersRegistered: boolean;
};

type GalleryAppState = {
  isOpen: boolean;
  mediaCount: number;
};

test.describe('GalleryApp integration', () => {
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

  test('initializes services and handles open/close flow', async ({ page }) => {
    const setup = (await page.evaluate(async () => {
      const harness = window.__XEG_HARNESS__;
      if (!harness) throw new Error('Harness not available');
      return harness.setupGalleryApp();
    })) as GalleryAppSetupResult;

    expect(setup.initialized).toBeTruthy();
    expect(setup.eventHandlersRegistered).toBeTruthy();

    await page.evaluate(async () => {
      const harness = window.__XEG_HARNESS__;
      if (!harness) throw new Error('Harness not available');
      await harness.triggerGalleryAppMediaClick();
    });

    const stateAfterOpen = (await page.evaluate(async () => {
      const harness = window.__XEG_HARNESS__;
      if (!harness) throw new Error('Harness not available');
      return harness.getGalleryAppState();
    })) as GalleryAppState;

    expect(stateAfterOpen.isOpen).toBeTruthy();
    expect(stateAfterOpen.mediaCount).toBeGreaterThan(0);

    await page.evaluate(async () => {
      const harness = window.__XEG_HARNESS__;
      if (!harness) throw new Error('Harness not available');
      await harness.triggerGalleryAppClose();
    });

    const stateAfterClose = (await page.evaluate(async () => {
      const harness = window.__XEG_HARNESS__;
      if (!harness) throw new Error('Harness not available');
      return harness.getGalleryAppState();
    })) as GalleryAppState;

    expect(stateAfterClose.isOpen).toBeFalsy();
  });
});
