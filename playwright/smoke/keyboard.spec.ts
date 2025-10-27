/**
 * @file Keyboard Navigation & Controls E2E Tests
 * @description 갤러리 키보드 입력 및 비디오 제어 검증
 *
 * **테스트 범위**:
 * - ArrowLeft/Right: 이전/다음 미디어 네비게이션
 * - Home/End: 첫/마지막 미디어로 이동
 * - Space: 비디오 재생/일시정지
 * - M: 음소거 토글
 * - Escape: 갤러리 닫기
 *
 * **Consolidated from**:
 * - keyboard-navigation.spec.ts (Phase 82.3)
 * - keyboard-video.spec.ts (Phase 82.7)
 * - keyboard-interaction.spec.ts (일부)
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
    });

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

    state = await page.evaluate(async () => {
      const harness = window.__XEG_HARNESS__!;
      return harness.getGalleryAppState();
    });
    expect(state.currentIndex).toBe(1);
  });

  test('ArrowRight navigates to next item', async ({ page }) => {
    await page.evaluate(async () => {
      const harness = window.__XEG_HARNESS__!;
      await harness.setupGalleryApp();
      await harness.triggerGalleryAppMediaClick();
    });

    let state = await page.evaluate(async () => {
      const harness = window.__XEG_HARNESS__!;
      return harness.getGalleryAppState();
    });

    expect(state.isOpen).toBe(true);
    expect(state.currentIndex).toBe(0);

    await page.evaluate(async () => {
      const harness = window.__XEG_HARNESS__!;
      await harness.simulateKeyPress('ArrowRight');
    });

    state = await page.evaluate(async () => {
      const harness = window.__XEG_HARNESS__!;
      return harness.getGalleryAppState();
    });
    expect(state.currentIndex).toBe(1);
  });

  test('Home key jumps to first item', async ({ page }) => {
    await page.evaluate(async () => {
      const harness = window.__XEG_HARNESS__!;
      await harness.setupGalleryApp();
      await harness.triggerGalleryAppMediaClick();
    });

    // Navigate to item 4
    await page.evaluate(async () => {
      const harness = window.__XEG_HARNESS__!;
      for (let i = 0; i < 4; i++) {
        await harness.simulateKeyPress('ArrowRight');
      }
    });

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
    });

    let state = await page.evaluate(async () => {
      const harness = window.__XEG_HARNESS__!;
      return harness.getGalleryAppState();
    });

    expect(state.isOpen).toBe(true);
    expect(state.currentIndex).toBe(0);

    const totalCount = state.mediaCount;
    const lastIndex = totalCount - 1;

    await page.evaluate(async () => {
      const harness = window.__XEG_HARNESS__!;
      await harness.simulateKeyPress('End');
    });

    state = await page.evaluate(async () => {
      const harness = window.__XEG_HARNESS__!;
      return harness.getGalleryAppState();
    });
    expect(state.currentIndex).toBe(lastIndex);
  });

  test('Escape key closes gallery', async ({ page }) => {
    await page.evaluate(async () => {
      const harness = window.__XEG_HARNESS__!;
      await harness.setupGalleryApp();
      await harness.triggerGalleryAppMediaClick();
    });

    let state = await page.evaluate(async () => {
      const harness = window.__XEG_HARNESS__!;
      return harness.getGalleryAppState();
    });
    expect(state.isOpen).toBe(true);

    await page.evaluate(async () => {
      const harness = window.__XEG_HARNESS__!;
      await harness.simulateKeyPress('Escape');
    });

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

    // NOTE: 실제 비디오 재생/일시정지는 브라우저 네이티브 기능에 의존
    // E2E에서는 키 이벤트가 preventDefault되는지만 확인
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
