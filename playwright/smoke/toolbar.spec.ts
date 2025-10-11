import { expect, test } from '@playwright/test';
import { ensureHarness } from './utils';

test.describe('Toolbar accessibility', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('about:blank');
    await ensureHarness(page);
  });

  test.afterEach(async ({ page }) => {
    await page.evaluate(async () => {
      const harness = window.__XEG_HARNESS__;
      if (!harness) return;
      try {
        await harness.disposeToolbar();
      } catch {
        /* ignore */
      }
    });
  });

  test('renders toolbar with accessible labels', async ({ page }) => {
    const containerId = await page.evaluate(async () => {
      const harness = window.__XEG_HARNESS__;
      if (!harness) throw new Error('Harness not available');
      const result = await harness.mountToolbar({ currentIndex: 0, totalCount: 3 });
      return result.containerId;
    });

    const toolbar = page.locator(`#${containerId}`).getByRole('toolbar');
    await expect(toolbar).toBeVisible();

    await expect(page.getByLabel('이전 미디어')).toBeVisible();
    await expect(page.getByLabel('다음 미디어')).toBeVisible();
    await expect(page.getByLabel('원본 크기')).toBeVisible();
    await expect(page.getByLabel('가로에 맞춤')).toBeVisible();
    await expect(page.getByLabel('세로에 맞춤')).toBeVisible();
    await expect(page.getByLabel('창에 맞춤')).toBeVisible();
    await expect(page.getByLabel('현재 파일 다운로드')).toBeVisible();
    await expect(page.getByLabel('전체 3개 파일 ZIP 다운로드')).toBeVisible();
    await expect(page.getByLabel('설정 열기')).toBeVisible();
    await expect(page.getByLabel('갤러리 닫기')).toBeVisible();
  });

  test('updates disabled state at boundaries', async ({ page }) => {
    // 첫 번째 상태: currentIndex=0
    await page.evaluate(async () => {
      const harness = window.__XEG_HARNESS__;
      if (!harness) throw new Error('Harness not available');
      await harness.mountToolbar({ currentIndex: 0, totalCount: 2 });
    });

    const prevButton = page.getByLabel('이전 미디어');
    const nextButton = page.getByLabel('다음 미디어');

    await expect(prevButton).toHaveAttribute('data-disabled', 'true');
    await expect(nextButton).not.toHaveAttribute('data-disabled', 'true');

    // 두 번째 상태: currentIndex=1로 재마운트
    await page.evaluate(async () => {
      const harness = window.__XEG_HARNESS__;
      if (!harness) throw new Error('Harness not available');
      await harness.disposeToolbar();
      await harness.mountToolbar({ currentIndex: 1, totalCount: 2 });
    });

    // 재마운트 후 새로운 버튼 locator
    const nextButton2 = page.getByLabel('다음 미디어');
    await expect(nextButton2).toHaveAttribute('data-disabled', 'true');
  });
});
