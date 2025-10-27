/**
 * @file Keyboard Performance Tests
 * @description 키보드 네비게이션 성능 및 메모리 안정성 검증
 *
 * **테스트 범위**:
 * - 키보드 입력 렌더링 성능 (< 50ms)
 * - 장시간 키보드 네비게이션 메모리 안정성 (< 10MB 증가)
 *
 * **Extracted from**: keyboard-interaction.spec.ts (Phase 82.3)
 */

import { expect, test } from '@playwright/test';
import { ensureHarness } from './utils';

declare global {
  interface Window {
    __XEG_HARNESS__?: import('../harness/types').XegHarness;
  }
}

test.describe('Keyboard Performance', () => {
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

  test('Keyboard input rendering performance < 50ms', async ({ page }) => {
    await page.evaluate(async () => {
      const harness = window.__XEG_HARNESS__!;
      await harness.setupGalleryApp();
    });

    const measurements: number[] = [];
    for (let i = 0; i < 5; i++) {
      const metrics = await page.evaluate(async () => {
        const harness = window.__XEG_HARNESS__!;
        return harness.measureKeyboardPerformance(async () => {
          await harness.simulateKeyPress('ArrowRight');
        });
      });
      measurements.push(metrics.duration);
    }

    const average = measurements.reduce((a, b) => a + b, 0) / measurements.length;
    expect(average).toBeLessThan(50);
  });

  test('Memory stable after 1000 keyboard navigations', async ({ page }) => {
    await page.evaluate(async () => {
      const harness = window.__XEG_HARNESS__!;
      await harness.setupGalleryApp();
    });

    const initialMemory = await page.evaluate(async () => {
      const harness = window.__XEG_HARNESS__!;
      return harness.getMemoryUsage();
    });

    // Simulate 1000 ArrowLeft/Right key presses
    await page.evaluate(async () => {
      const harness = window.__XEG_HARNESS__!;
      for (let i = 0; i < 1000; i++) {
        if (i % 2 === 0) {
          await harness.simulateKeyPress('ArrowRight');
        } else {
          await harness.simulateKeyPress('ArrowLeft');
        }
      }
    });

    const finalMemory = await page.evaluate(async () => {
      const harness = window.__XEG_HARNESS__!;
      return harness.getMemoryUsage();
    });

    const memoryIncrease =
      (finalMemory.usedJSHeapSize - initialMemory.usedJSHeapSize) / (1024 * 1024); // MB

    expect(memoryIncrease).toBeLessThan(10);
  });
});
