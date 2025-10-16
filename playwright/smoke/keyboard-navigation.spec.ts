import { expect, test } from '@playwright/test';
import { ensureHarness } from './utils';

declare global {
  interface Window {
    __XEG_HARNESS__?: import('../harness/types').XegHarness;
  }
}

test.describe('Phase 82.3: Keyboard Navigation E2E', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('about:blank');
    await ensureHarness(page);
  });

  test('Test K1: ArrowLeft navigates to previous item', async ({ page }) => {
    // Setup gallery with 5 items
    await page.evaluate(async () => {
      const harness = window.__XEG_HARNESS__!;
      await harness.setupGalleryApp();
      await harness.triggerGalleryAppMediaClick();
    });

    // Get initial state (should be at index 0)
    let state = await page.evaluate(async () => {
      const harness = window.__XEG_HARNESS__!;
      return harness.getGalleryAppState();
    });

    expect(state.isOpen).toBe(true);
    expect(state.currentIndex).toBe(0);

    // Navigate to item 2 using ArrowRight twice
    await page.evaluate(async () => {
      const harness = window.__XEG_HARNESS__!;
      await harness.simulateKeyPress('ArrowRight');
      await harness.simulateKeyPress('ArrowRight');
    });

    // Verify we're at index 2
    state = await page.evaluate(async () => {
      const harness = window.__XEG_HARNESS__!;
      return harness.getGalleryAppState();
    });
    expect(state.currentIndex).toBe(2);

    // Press ArrowLeft key
    await page.evaluate(async () => {
      const harness = window.__XEG_HARNESS__!;
      await harness.simulateKeyPress('ArrowLeft');
    });

    // Verify currentIndex decreased to 1
    state = await page.evaluate(async () => {
      const harness = window.__XEG_HARNESS__!;
      return harness.getGalleryAppState();
    });
    expect(state.currentIndex).toBe(1);

    // Cleanup
    await page.evaluate(async () => {
      const harness = window.__XEG_HARNESS__!;
      await harness.disposeGalleryApp();
    });
  });

  test('Test K2: ArrowRight navigates to next item', async ({ page }) => {
    // Setup gallery
    await page.evaluate(async () => {
      const harness = window.__XEG_HARNESS__!;
      await harness.setupGalleryApp();
      await harness.triggerGalleryAppMediaClick();
    });

    // Get initial state (should be at index 0)
    let state = await page.evaluate(async () => {
      const harness = window.__XEG_HARNESS__!;
      return harness.getGalleryAppState();
    });

    expect(state.isOpen).toBe(true);
    expect(state.currentIndex).toBe(0);

    // Press ArrowRight key
    await page.evaluate(async () => {
      const harness = window.__XEG_HARNESS__!;
      await harness.simulateKeyPress('ArrowRight');
    });

    // Verify currentIndex increased to 1
    state = await page.evaluate(async () => {
      const harness = window.__XEG_HARNESS__!;
      return harness.getGalleryAppState();
    });
    expect(state.currentIndex).toBe(1);

    // Cleanup
    await page.evaluate(async () => {
      const harness = window.__XEG_HARNESS__!;
      await harness.disposeGalleryApp();
    });
  });

  test('Test K3: Home key jumps to first item', async ({ page }) => {
    // Setup gallery
    await page.evaluate(async () => {
      const harness = window.__XEG_HARNESS__!;
      await harness.setupGalleryApp();
      await harness.triggerGalleryAppMediaClick();
    });

    // Navigate to item 4 using ArrowRight 4 times
    await page.evaluate(async () => {
      const harness = window.__XEG_HARNESS__!;
      for (let i = 0; i < 4; i++) {
        await harness.simulateKeyPress('ArrowRight');
      }
    });

    // Verify we're at index 4
    let state = await page.evaluate(async () => {
      const harness = window.__XEG_HARNESS__!;
      return harness.getGalleryAppState();
    });
    expect(state.currentIndex).toBe(4);

    // Press Home key
    await page.evaluate(async () => {
      const harness = window.__XEG_HARNESS__!;
      await harness.simulateKeyPress('Home');
    });

    // Verify currentIndex = 0
    state = await page.evaluate(async () => {
      const harness = window.__XEG_HARNESS__!;
      return harness.getGalleryAppState();
    });
    expect(state.currentIndex).toBe(0);

    // Cleanup
    await page.evaluate(async () => {
      const harness = window.__XEG_HARNESS__!;
      await harness.disposeGalleryApp();
    });
  });

  test('Test K3b: End key jumps to last item', async ({ page }) => {
    // Setup gallery
    await page.evaluate(async () => {
      const harness = window.__XEG_HARNESS__!;
      await harness.setupGalleryApp();
      await harness.triggerGalleryAppMediaClick();
    });

    // Get initial state (should be at index 0)
    let state = await page.evaluate(async () => {
      const harness = window.__XEG_HARNESS__!;
      return harness.getGalleryAppState();
    });

    expect(state.isOpen).toBe(true);
    expect(state.currentIndex).toBe(0);

    const totalCount = state.mediaCount;
    const lastIndex = totalCount - 1;

    // Press End key
    await page.evaluate(async () => {
      const harness = window.__XEG_HARNESS__!;
      await harness.simulateKeyPress('End');
    });

    // Verify currentIndex = totalCount - 1
    state = await page.evaluate(async () => {
      const harness = window.__XEG_HARNESS__!;
      return harness.getGalleryAppState();
    });
    expect(state.currentIndex).toBe(lastIndex);

    // Cleanup
    await page.evaluate(async () => {
      const harness = window.__XEG_HARNESS__!;
      await harness.disposeGalleryApp();
    });
  });
});
