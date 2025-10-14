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

  test('circular navigation keeps buttons enabled', async ({ page }) => {
    // Phase 66: 순환 네비게이션 - totalCount > 1이면 항상 활성화
    // 첫 번째 상태: currentIndex=0, totalCount=2
    await page.evaluate(async () => {
      const harness = window.__XEG_HARNESS__;
      if (!harness) throw new Error('Harness not available');
      await harness.mountToolbar({ currentIndex: 0, totalCount: 2 });
    });

    const prevButton = page.getByLabel('이전 미디어');
    const nextButton = page.getByLabel('다음 미디어');

    // 순환 네비게이션이므로 첫 번째 항목에서도 이전 버튼이 활성화되어야 함
    await expect(prevButton).toHaveAttribute('data-disabled', 'false');
    await expect(nextButton).toHaveAttribute('data-disabled', 'false');

    // 두 번째 상태: currentIndex=1로 재마운트 (마지막 항목)
    await page.evaluate(async () => {
      const harness = window.__XEG_HARNESS__;
      if (!harness) throw new Error('Harness not available');
      await harness.disposeToolbar();
      await harness.mountToolbar({ currentIndex: 1, totalCount: 2 });
    });

    // 재마운트 후 새로운 버튼 locator
    const prevButton2 = page.getByLabel('이전 미디어');
    const nextButton2 = page.getByLabel('다음 미디어');

    // 마지막 항목에서도 다음 버튼이 활성화되어야 함 (순환)
    await expect(prevButton2).toHaveAttribute('data-disabled', 'false');
    await expect(nextButton2).toHaveAttribute('data-disabled', 'false');
  });
});
