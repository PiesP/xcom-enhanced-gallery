import { test, expect } from '@playwright/test';
import type { XegHarness } from '../harness/types';

declare global {
  interface Window {
    __XEG_HARNESS__?: XegHarness;
  }
}

test.describe('Phase 82.3: Keyboard Navigation E2E', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('https://x.com');
    // Load harness
    await page.waitForFunction(() => typeof window.__XEG_HARNESS__ !== 'undefined', {
      timeout: 5000,
    });
  });

  test('Test K1: ArrowLeft navigates to previous item', async ({ page }) => {
    // Setup gallery with 5 items
    await page.evaluate(async () => {
      const harness = window.__XEG_HARNESS__!;
      await harness.setupGalleryApp();
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

    // Verify data-focused attribute updated
    const focusedIndex = await page.evaluate(async () => {
      const harness = window.__XEG_HARNESS__!;
      return harness.getGlobalFocusedIndex();
    });
    expect(focusedIndex).toBe(1);

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

    // Verify data-focused attribute updated
    const focusedIndex = await page.evaluate(async () => {
      const harness = window.__XEG_HARNESS__!;
      return harness.getGlobalFocusedIndex();
    });
    expect(focusedIndex).toBe(1);

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

    // Verify data-focused = "0"
    const focusedIndex = await page.evaluate(async () => {
      const harness = window.__XEG_HARNESS__!;
      return harness.getGlobalFocusedIndex();
    });
    expect(focusedIndex).toBe(0);

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

    // Verify data-focused = lastIndex
    const focusedIndex = await page.evaluate(async () => {
      const harness = window.__XEG_HARNESS__!;
      return harness.getGlobalFocusedIndex();
    });
    expect(focusedIndex).toBe(lastIndex);

    // Cleanup
    await page.evaluate(async () => {
      const harness = window.__XEG_HARNESS__!;
      await harness.disposeGalleryApp();
    });
  });
});
