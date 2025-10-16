import { test, expect } from '@playwright/test';
import { ensureHarness } from './utils';

const CONTAINER_SELECTOR = '#xeg-gallery-root';

test.describe('Phase 82.2: Focus Tracking E2E', () => {
  test.beforeEach(async ({ page }) => {
    // Load a blank page and ensure harness is injected (global setup provides path)
    await page.goto('about:blank');
    await ensureHarness(page);

    // Initialize and open the gallery so DOM nodes exist for focus tracking
    await page.evaluate(async () => {
      const harness = (window as any).__XEG_HARNESS__;
      if (!harness) throw new Error('Harness not available');
      await harness.setupGalleryApp();
      await harness.triggerGalleryAppMediaClick();
    });
  });

  test.afterEach(async ({ page }) => {
    // Cleanup harness-created artifacts
    await page.evaluate(async () => {
      const harness = (window as any).__XEG_HARNESS__;
      if (!harness) return;
      try {
        await harness.disposeFocusTracker();
      } catch (e) {
        /* ignore */
      }
      try {
        await harness.disposeGalleryApp();
      } catch (e) {
        /* ignore */
      }
    });
  });

  test('focus is applied only after UI stabilizes (debounce on scroll)', async ({ page }) => {
    // Wait for gallery to be open via harness state
    await page.waitForFunction(
      async () => {
        const harness = (window as any).__XEG_HARNESS__;
        if (!harness) return false;
        const state = await harness.getGalleryAppState();
        return !!state && state.isOpen === true;
      },
      { timeout: 5000 }
    );

    // Then wait for the actual DOM container to appear (longer timeout to avoid races)
    await page.waitForSelector(CONTAINER_SELECTOR, { timeout: 10000 });

    await page.evaluate(async selector => {
      const harness = (window as any).__XEG_HARNESS__;
      if (!harness) throw new Error('Harness not available');
      await harness.setupFocusTracker(selector);
    }, CONTAINER_SELECTOR);

    // Read initial focused index
    const initialFocused = await page.evaluate(() => {
      const harness = (window as any).__XEG_HARNESS__;
      return harness.getGlobalFocusedIndex();
    });

    // Simulate viewport scroll that makes item index 2 visible
    const scrollResult = await page.evaluate(async selector => {
      const harness = (window as any).__XEG_HARNESS__;
      return harness.simulateViewportScroll(selector, 100, [2]);
    }, CONTAINER_SELECTOR);

    const appliedIndex: number | null = scrollResult.appliedIndex;

    // Immediately after scroll, focus should NOT have moved to the applied index
    const immediateFocused = await page.evaluate(() => {
      const harness = (window as any).__XEG_HARNESS__;
      return harness.getGlobalFocusedIndex();
    });

    expect(immediateFocused).toBe(initialFocused);

    // Also ensure the harness did not observe a focus() call on the applied item during scroll
    const focusCountDuringScroll = (await page.evaluate(async index => {
      const harness = (window as any).__XEG_HARNESS__;
      if (!harness) throw new Error('Harness not available');
      return harness.getElementFocusCount(`[data-index="${index}"]`);
    }, appliedIndex)) as number;

    expect(focusCountDuringScroll).toBe(0);
  });
});
