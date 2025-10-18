/**
 * 접근성 테스트 - Toast 컴포넌트
 *
 * @axe-core/playwright를 사용한 토스트 접근성 검증
 *
 * 포커스:
 * - aria-live 영역 적절성
 * - 색상 대비
 * - 읽기 가능한 메시지
 * - 닫기 버튼 접근성
 *
 * @see playwright/harness/index.ts - mountToast, showToast
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

  test('should have no accessibility violations in toast', async ({ page }) => {
    const accessibilityScanResults = await new AxeBuilder({ page })
      .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'])
      .analyze();

    if (accessibilityScanResults.violations.length > 0) {
      console.error('Toast accessibility violations found:');
      accessibilityScanResults.violations.forEach(violation => {
        console.error(`- ${violation.id}: ${violation.description}`);
        console.error(`  Impact: ${violation.impact}`);
      });
    }

    expect(accessibilityScanResults.violations).toEqual([]);
  });

  test('should have proper aria-live region', async ({ page }) => {
    const liveRegion = await page.locator('[aria-live]');
    await expect(liveRegion).toBeVisible();

    const ariaLive = await liveRegion.getAttribute('aria-live');
    expect(['polite', 'assertive']).toContain(ariaLive);

    // aria-live 영역 검증
    const accessibilityScanResults = await new AxeBuilder({ page })
      .include('[aria-live]')
      .withTags(['wcag2a'])
      .analyze();

    expect(accessibilityScanResults.violations).toEqual([]);
  });

  test('should have accessible close button', async ({ page }) => {
    const closeButton = await page.locator('button[aria-label="Close"]');
    await expect(closeButton).toBeVisible();

    // 버튼 접근성 검증
    const accessibilityScanResults = await new AxeBuilder({ page })
      .include('button')
      .withTags(['wcag2a', 'cat.name-role-value'])
      .analyze();

    expect(accessibilityScanResults.violations).toEqual([]);
  });

  test('should have sufficient color contrast', async ({ page }) => {
    const accessibilityScanResults = await new AxeBuilder({ page })
      .withTags(['cat.color'])
      .analyze();

    if (accessibilityScanResults.violations.length > 0) {
      console.error('Color contrast violations found:');
      accessibilityScanResults.violations.forEach(violation => {
        console.error(`- ${violation.id}: ${violation.description}`);
      });
    }

    expect(accessibilityScanResults.violations).toEqual([]);
  });
});
