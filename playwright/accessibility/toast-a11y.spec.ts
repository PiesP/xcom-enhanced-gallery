/**
 * 접근성 테스트 - Toast 컴포넌트
 *
 * @axe-core/playwright를 사용한 토스트 접근성 검증
 *
 * 검증 항목:
 * - WCAG 2.1 Level AA 준수
 * - aria-live 영역 적절성
 * - 색상 대비
 * - 닫기 버튼 접근성
 *
 * 참고: 정적 HTML 시뮬레이션 사용
 * TODO: 하네스 API (showToast) 활용으로 전환
 */

import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

test.describe('Toast Accessibility', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('about:blank');
    await page.setContent(`
      <!DOCTYPE html>
      <html lang="ko">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Toast Accessibility Test</title>
      </head>
      <body>
        <main>
          <h1>Toast Accessibility Test</h1>
          <div role="region" aria-live="polite" aria-atomic="true">
            <div class="toast">
              <p>Success: Operation completed</p>
              <button aria-label="Close">✕</button>
            </div>
          </div>
        </main>
      </body>
      </html>
    `);
  });

  test('should have no accessibility violations', async ({ page }) => {
    const accessibilityScanResults = await new AxeBuilder({ page })
      .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'])
      .analyze();

    expect(accessibilityScanResults.violations).toEqual([]);
  });

  test('should have proper aria-live region', async ({ page }) => {
    const liveRegion = page.locator('[aria-live]');

    await expect(liveRegion).toBeVisible();
    await expect(liveRegion).toHaveAttribute('aria-live', 'polite');
    await expect(liveRegion).toHaveAttribute('aria-atomic', 'true');

    const accessibilityScanResults = await new AxeBuilder({ page })
      .include('[aria-live]')
      .withTags(['wcag2a'])
      .analyze();

    expect(accessibilityScanResults.violations).toEqual([]);
  });

  test('should have accessible close button', async ({ page }) => {
    const closeButton = page.locator('button[aria-label="Close"]');

    await expect(closeButton).toBeVisible();
    await expect(closeButton).toHaveAttribute('aria-label', 'Close');

    await closeButton.focus();
    await expect(closeButton).toBeFocused();
  });

  test('should have sufficient color contrast', async ({ page }) => {
    const accessibilityScanResults = await new AxeBuilder({ page })
      .withTags(['wcag2aa'])
      .include('.toast')
      .analyze();

    const colorContrastViolations = accessibilityScanResults.violations.filter(
      v => v.id === 'color-contrast'
    );

    expect(colorContrastViolations).toHaveLength(0);
  });
});
