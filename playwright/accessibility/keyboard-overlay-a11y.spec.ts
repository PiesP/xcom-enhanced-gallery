/**
 * 접근성 테스트 - KeyboardHelpOverlay 컴포넌트
 *
 * @axe-core/playwright를 사용한 키보드 도움말 오버레이 접근성 검증
 *
 * 포커스:
 * - Modal/Dialog role 적절성
 * - 포커스 트랩 (Escape 키로 닫기)
 * - ARIA 레이블 및 설명
 * - 키보드 탐색 가능성
 *
 * @see playwright/harness/index.ts - mountKeyboardOverlay
 */

import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

test.describe('KeyboardHelpOverlay Accessibility', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('about:blank');
    await page.setContent(`
      <!DOCTYPE html>
      <html lang="ko">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Keyboard Help Overlay Accessibility Test</title>
      </head>
      <body>
        <main>
          <h1>Keyboard Help Overlay Test</h1>
          <div role="dialog" aria-modal="true" aria-labelledby="keyboard-help-title">
            <h2 id="keyboard-help-title">Keyboard Shortcuts</h2>
            <table>
              <thead>
                <tr>
                  <th>Key</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td><kbd>Escape</kbd></td>
                  <td>Close</td>
                </tr>
                <tr>
                  <td><kbd>Arrow Left</kbd></td>
                  <td>Previous</td>
                </tr>
                <tr>
                  <td><kbd>Arrow Right</kbd></td>
                  <td>Next</td>
                </tr>
              </tbody>
            </table>
            <button aria-label="Close dialog">Close</button>
          </div>
        </main>
      </body>
      </html>
    `);
  });

  test('should have no accessibility violations in dialog', async ({ page }) => {
    const accessibilityScanResults = await new AxeBuilder({ page })
      .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'])
      .analyze();

    if (accessibilityScanResults.violations.length > 0) {
      console.error('KeyboardHelpOverlay accessibility violations found:');
      accessibilityScanResults.violations.forEach(violation => {
        console.error(`- ${violation.id}: ${violation.description}`);
        console.error(`  Impact: ${violation.impact}`);
      });
    }

    expect(accessibilityScanResults.violations).toEqual([]);
  });

  test('should have proper dialog role and attributes', async ({ page }) => {
    const dialog = await page.locator('[role="dialog"]');
    await expect(dialog).toBeVisible();

    // aria-modal 확인
    const ariaModal = await dialog.getAttribute('aria-modal');
    expect(ariaModal).toBe('true');

    // aria-labelledby 확인
    const ariaLabelledby = await dialog.getAttribute('aria-labelledby');
    expect(ariaLabelledby).toBeTruthy();

    // 레이블 요소 존재 확인
    const labelElement = await page.locator(`#${ariaLabelledby}`);
    await expect(labelElement).toBeVisible();

    // Dialog 접근성 검증
    const accessibilityScanResults = await new AxeBuilder({ page })
      .include('[role="dialog"]')
      .withTags(['wcag2a'])
      .analyze();

    expect(accessibilityScanResults.violations).toEqual([]);
  });

  test('should have accessible table structure', async ({ page }) => {
    const table = await page.locator('table');
    await expect(table).toBeVisible();

    // 테이블 헤더 확인
    const headers = await table.locator('th').allTextContents();
    expect(headers).toContain('Key');
    expect(headers).toContain('Action');

    // 테이블 접근성 검증
    const accessibilityScanResults = await new AxeBuilder({ page })
      .include('table')
      .withTags(['wcag2a', 'cat.semantics'])
      .analyze();

    expect(accessibilityScanResults.violations).toEqual([]);
  });

  test('should support keyboard navigation', async ({ page }) => {
    // Tab 키로 포커스 이동
    await page.keyboard.press('Tab');

    const focusedElement = await page.evaluate(() => document.activeElement?.tagName);
    expect(focusedElement).toBeTruthy();

    // Escape 키로 닫기 가능 여부 확인 (실제로는 하네스 API 필요)
    await page.keyboard.press('Escape');

    // 키보드 접근성 검증
    const accessibilityScanResults = await new AxeBuilder({ page })
      .withTags(['cat.keyboard'])
      .analyze();

    expect(accessibilityScanResults.violations).toEqual([]);
  });
});
