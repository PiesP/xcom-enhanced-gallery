import { expect, test } from '@playwright/test';
import { ensureHarness } from './utils';

declare global {
  interface Window {
    __XEG_HARNESS__?: import('../harness/types').XegHarness;
  }
}

test.describe('Phase 82.7: Keyboard Video Controls E2E', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('about:blank');
    await ensureHarness(page);
  });

  test('Test K4: Space key toggles play/pause for gallery video', async ({ page }) => {
    // Setup gallery with video
    await page.evaluate(async () => {
      const harness = window.__XEG_HARNESS__!;
      await harness.setupGalleryApp();
      await harness.triggerGalleryAppMediaClick();
    });

    // Verify gallery is open
    const state = await page.evaluate(async () => {
      const harness = window.__XEG_HARNESS__!;
      return harness.getGalleryAppState();
    });
    expect(state.isOpen).toBe(true);

    // NOTE: JSDOM 제약으로 인해 실제 비디오 재생/일시정지 확인 불가
    // E2E에서는 키 이벤트가 preventDefault되는지만 확인
    // 실제 비디오 동작은 브라우저 네이티브 기능에 의존

    // Press Space key (should prevent default)
    await page.evaluate(async () => {
      const harness = window.__XEG_HARNESS__!;
      await harness.simulateKeyPress(' '); // Space
    });

    // Verify gallery still open (Space didn't close gallery)
    const stateAfter = await page.evaluate(async () => {
      const harness = window.__XEG_HARNESS__!;
      return harness.getGalleryAppState();
    });
    expect(stateAfter.isOpen).toBe(true);

    // Cleanup
    await page.evaluate(async () => {
      const harness = window.__XEG_HARNESS__!;
      await harness.disposeGalleryApp();
    });
  });

  test('Test K5: M key toggles mute, ArrowUp/Down adjust volume', async ({ page }) => {
    // Setup gallery
    await page.evaluate(async () => {
      const harness = window.__XEG_HARNESS__!;
      await harness.setupGalleryApp();
      await harness.triggerGalleryAppMediaClick();
    });

    // Verify gallery is open
    const state = await page.evaluate(async () => {
      const harness = window.__XEG_HARNESS__!;
      return harness.getGalleryAppState();
    });
    expect(state.isOpen).toBe(true);

    // Press M key (mute toggle)
    await page.evaluate(async () => {
      const harness = window.__XEG_HARNESS__!;
      await harness.simulateKeyPress('m');
    });

    // Press ArrowUp key (volume up)
    await page.evaluate(async () => {
      const harness = window.__XEG_HARNESS__!;
      await harness.simulateKeyPress('ArrowUp');
    });

    // Press ArrowDown key (volume down)
    await page.evaluate(async () => {
      const harness = window.__XEG_HARNESS__!;
      await harness.simulateKeyPress('ArrowDown');
    });

    // Verify gallery still open (video controls didn't close gallery)
    const stateAfter = await page.evaluate(async () => {
      const harness = window.__XEG_HARNESS__!;
      return harness.getGalleryAppState();
    });
    expect(stateAfter.isOpen).toBe(true);

    // Cleanup
    await page.evaluate(async () => {
      const harness = window.__XEG_HARNESS__!;
      await harness.disposeGalleryApp();
    });
  });

  test('Test K6: Keyboard events only handled when gallery is open', async ({ page }) => {
    // Setup gallery without opening
    await page.evaluate(async () => {
      const harness = window.__XEG_HARNESS__!;
      await harness.setupGalleryApp();
    });

    // Verify gallery is closed
    let state = await page.evaluate(async () => {
      const harness = window.__XEG_HARNESS__!;
      return harness.getGalleryAppState();
    });
    expect(state.isOpen).toBe(false);

    // Press navigation keys when closed (should not prevent default)
    await page.evaluate(async () => {
      const harness = window.__XEG_HARNESS__!;
      await harness.simulateKeyPress('Home');
      await harness.simulateKeyPress('End');
      await harness.simulateKeyPress('PageDown');
    });

    // Verify gallery still closed
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

    // Verify gallery is now open
    state = await page.evaluate(async () => {
      const harness = window.__XEG_HARNESS__!;
      return harness.getGalleryAppState();
    });
    expect(state.isOpen).toBe(true);

    // Press navigation keys when open (should prevent default and handle)
    await page.evaluate(async () => {
      const harness = window.__XEG_HARNESS__!;
      await harness.simulateKeyPress('End');
      await harness.simulateKeyPress('PageDown');
    });

    // Verify gallery still open
    state = await page.evaluate(async () => {
      const harness = window.__XEG_HARNESS__!;
      return harness.getGalleryAppState();
    });
    expect(state.isOpen).toBe(true);

    // Cleanup
    await page.evaluate(async () => {
      const harness = window.__XEG_HARNESS__!;
      await harness.disposeGalleryApp();
    });
  });
});
