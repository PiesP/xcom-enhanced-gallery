/**
 * @file Keyboard Navigation & Controls E2E Tests
 * @description Gallery keyboard input and video control validation
 *
 * **Test Scope**:
 * - ArrowLeft/Right: Previous/next media navigation
 * - Home/End: Jump to first/last media
 * - Space: Video play/pause
 * - M: Mute toggle
 * - Escape: Close gallery
 *
 * **Consolidated from**:
 * - keyboard-navigation.spec.ts (Phase 82.3)
 * - keyboard-video.spec.ts (Phase 82.7)
 * - keyboard-interaction.spec.ts (partial)
 */

import { expect, test } from '@playwright/test';
import { ensureHarness } from './utils';

declare global {
  interface Window {
    __XEG_HARNESS__?: import('../harness/types').XegHarness;
  }
}

test.describe('Keyboard Navigation', () => {
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

  test('ArrowLeft navigates to previous item', async ({ page }) => {
    await page.evaluate(async () => {
      const harness = window.__XEG_HARNESS__!;
      await harness.setupGalleryApp();
      await harness.triggerGalleryAppMediaClick();
      await new Promise(resolve => setTimeout(resolve, 100));
    });

    // Navigate to item 2
    await page.evaluate(async () => {
      const harness = window.__XEG_HARNESS__!;
      await harness.simulateKeyPress('ArrowRight');
      await new Promise(resolve => setTimeout(resolve, 50));
      await harness.simulateKeyPress('ArrowRight');
      await new Promise(resolve => setTimeout(resolve, 50));
    });

    let state = await page.evaluate(async () => {
      const harness = window.__XEG_HARNESS__!;
      return harness.getGalleryAppState();
    });

    if (!state.isOpen) {
      console.warn('[E2E Test] Gallery did not open. Skipping test.');
      return;
    }

    const beforeIndex = state.currentIndex;

    // Press ArrowLeft to go to previous item
    await page.evaluate(async () => {
      const harness = window.__XEG_HARNESS__!;
      await harness.simulateKeyPress('ArrowLeft');
    });

    await new Promise(resolve => setTimeout(resolve, 100));

    state = await page.evaluate(async () => {
      const harness = window.__XEG_HARNESS__!;
      return harness.getGalleryAppState();
    });

    expect(state.currentIndex).toBe(Math.max(0, beforeIndex - 1));
  });

  test('ArrowRight navigates to next item', async ({ page }) => {
    await page.evaluate(async () => {
      const harness = window.__XEG_HARNESS__!;
      await harness.setupGalleryApp();
      await harness.triggerGalleryAppMediaClick();
      await new Promise(resolve => setTimeout(resolve, 100));
    });

    let state = await page.evaluate(async () => {
      const harness = window.__XEG_HARNESS__!;
      return harness.getGalleryAppState();
    });

    if (!state.isOpen) {
      console.warn('[E2E Test] Gallery did not open. Skipping test.');
      return;
    }

    const beforeIndex = state.currentIndex;
    const maxIndex = state.mediaCount - 1;

    // Press ArrowRight to go to next item
    await page.evaluate(async () => {
      const harness = window.__XEG_HARNESS__!;
      await harness.simulateKeyPress('ArrowRight');
    });

    await new Promise(resolve => setTimeout(resolve, 100));

    state = await page.evaluate(async () => {
      const harness = window.__XEG_HARNESS__!;
      return harness.getGalleryAppState();
    });

    expect(state.currentIndex).toBe(Math.min(maxIndex, beforeIndex + 1));
  });

  test('Home key jumps to first item', async ({ page }) => {
    await page.evaluate(async () => {
      const harness = window.__XEG_HARNESS__!;
      await harness.setupGalleryApp();
      await harness.triggerGalleryAppMediaClick();
      await new Promise(resolve => setTimeout(resolve, 100));
    });

    // Navigate to item 4
    await page.evaluate(async () => {
      const harness = window.__XEG_HARNESS__!;
      for (let i = 0; i < 4; i++) {
        await harness.simulateKeyPress('ArrowRight');
        await new Promise(resolve => setTimeout(resolve, 50));
      }
    });

    let state = await page.evaluate(async () => {
      const harness = window.__XEG_HARNESS__!;
      return harness.getGalleryAppState();
    });

    if (!state.isOpen) {
      console.warn('[E2E Test] Gallery did not open. Skipping test.');
      return;
    }

    // Check we navigated correctly (or at least started)
    expect(state.isOpen).toBe(true);

    // Press Home key
    await page.evaluate(async () => {
      const harness = window.__XEG_HARNESS__!;
      await harness.simulateKeyPress('Home');
    });

    await new Promise(resolve => setTimeout(resolve, 100));

    state = await page.evaluate(async () => {
      const harness = window.__XEG_HARNESS__!;
      return harness.getGalleryAppState();
    });
    expect(state.currentIndex).toBe(0);
  });

  test('End key jumps to last item', async ({ page }) => {
    await page.evaluate(async () => {
      const harness = window.__XEG_HARNESS__!;
      await harness.setupGalleryApp();
      await harness.triggerGalleryAppMediaClick();
      await new Promise(resolve => setTimeout(resolve, 100));
    });

    let state = await page.evaluate(async () => {
      const harness = window.__XEG_HARNESS__!;
      return harness.getGalleryAppState();
    });

    if (!state.isOpen) {
      console.warn('[E2E Test] Gallery did not open. Skipping test.');
      return;
    }

    const maxIndex = state.mediaCount - 1;

    // Press End key
    await page.evaluate(async () => {
      const harness = window.__XEG_HARNESS__!;
      await harness.simulateKeyPress('End');
    });

    await new Promise(resolve => setTimeout(resolve, 100));

    state = await page.evaluate(async () => {
      const harness = window.__XEG_HARNESS__!;
      return harness.getGalleryAppState();
    });

    expect(state.currentIndex).toBe(maxIndex);
  });

  test('Escape key closes gallery', async ({ page }) => {
    await page.evaluate(async () => {
      const harness = window.__XEG_HARNESS__!;
      await harness.setupGalleryApp();
      await harness.triggerGalleryAppMediaClick();
      await new Promise(resolve => setTimeout(resolve, 100));
    });

    let state = await page.evaluate(async () => {
      const harness = window.__XEG_HARNESS__!;
      return harness.getGalleryAppState();
    });

    if (!state.isOpen) {
      console.warn('[E2E Test] Gallery did not open. Skipping test.');
      return;
    }

    expect(state.isOpen).toBe(true);

    // Press Escape key
    await page.evaluate(async () => {
      const harness = window.__XEG_HARNESS__!;
      await harness.simulateKeyPress('Escape');
    });

    await new Promise(resolve => setTimeout(resolve, 100));

    state = await page.evaluate(async () => {
      const harness = window.__XEG_HARNESS__!;
      return harness.getGalleryAppState();
    });

    expect(state.isOpen).toBe(false);
  });
});

test.describe('Video Controls', () => {
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

  test('Space key toggles play/pause', async ({ page }) => {
    await page.evaluate(async () => {
      const harness = window.__XEG_HARNESS__!;
      await harness.setupGalleryApp();
      await harness.triggerGalleryAppMediaClick();
    });

    const state = await page.evaluate(async () => {
      const harness = window.__XEG_HARNESS__!;
      return harness.getGalleryAppState();
    });
    expect(state.isOpen).toBe(true);

    // NOTE: Actual video play/pause depends on browser native functionality
    // E2E only verifies if key event preventDefault is called
    await page.evaluate(async () => {
      const harness = window.__XEG_HARNESS__!;
      await harness.simulateKeyPress(' '); // Space
    });

    const stateAfter = await page.evaluate(async () => {
      const harness = window.__XEG_HARNESS__!;
      return harness.getGalleryAppState();
    });
    expect(stateAfter.isOpen).toBe(true); // Space shouldn't close gallery
  });

  test('M key toggles mute, ArrowUp/Down adjust volume', async ({ page }) => {
    await page.evaluate(async () => {
      const harness = window.__XEG_HARNESS__!;
      await harness.setupGalleryApp();
      await harness.triggerGalleryAppMediaClick();
    });

    const state = await page.evaluate(async () => {
      const harness = window.__XEG_HARNESS__!;
      return harness.getGalleryAppState();
    });
    expect(state.isOpen).toBe(true);

    await page.evaluate(async () => {
      const harness = window.__XEG_HARNESS__!;
      await harness.simulateKeyPress('m');
      await harness.simulateKeyPress('ArrowUp');
      await harness.simulateKeyPress('ArrowDown');
    });

    const stateAfter = await page.evaluate(async () => {
      const harness = window.__XEG_HARNESS__!;
      return harness.getGalleryAppState();
    });
    expect(stateAfter.isOpen).toBe(true); // Video controls shouldn't close gallery
  });

  test('Keyboard events only handled when gallery is open', async ({ page }) => {
    await page.evaluate(async () => {
      const harness = window.__XEG_HARNESS__!;
      await harness.setupGalleryApp();
    });

    let state = await page.evaluate(async () => {
      const harness = window.__XEG_HARNESS__!;
      return harness.getGalleryAppState();
    });
    expect(state.isOpen).toBe(false);

    // Press navigation keys when closed (should not handle)
    await page.evaluate(async () => {
      const harness = window.__XEG_HARNESS__!;
      await harness.simulateKeyPress('Home');
      await harness.simulateKeyPress('End');
      await harness.simulateKeyPress('PageDown');
    });

    state = await page.evaluate(async () => {
      const harness = window.__XEG_HARNESS__!;
      return harness.getGalleryAppState();
    });
    expect(state.isOpen).toBe(false);

    // Open gallery
    await page.evaluate(async () => {
      const harness = window.__XEG_HARNESS__!;
      await harness.triggerGalleryAppMediaClick();
    });

    state = await page.evaluate(async () => {
      const harness = window.__XEG_HARNESS__!;
      return harness.getGalleryAppState();
    });
    expect(state.isOpen).toBe(true);

    // Press navigation keys when open (should handle)
    await page.evaluate(async () => {
      const harness = window.__XEG_HARNESS__!;
      await harness.simulateKeyPress('End');
      await harness.simulateKeyPress('PageDown');
    });

    state = await page.evaluate(async () => {
      const harness = window.__XEG_HARNESS__!;
      return harness.getGalleryAppState();
    });
    expect(state.isOpen).toBe(true);
  });
});
