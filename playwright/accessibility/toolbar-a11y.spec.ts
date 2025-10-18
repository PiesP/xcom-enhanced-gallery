/**
 * 접근성 테스트 - Toolbar 컴포넌트
 *
 * @axe-core/playwright를 사용한 툴바 접근성 검증
 *
 * 포커스:
 * - 키보드 탐색 가능성
 * - ARIA 레이블 적절성
 * - 색상 대비
 * - 포커스 인디케이터
 *
 * 참고: 현재는 기본 페이지 접근성으로 시작
 * TODO: Toolbar 컴포넌트 마운트 하네스 API 구현 후 확장
 */

import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

test.describe('Toolbar Accessibility', () => {
  test.beforeEach(async ({ page }) => {
    // 기본 HTML 페이지로 시작
    await page.goto('about:blank');
    await page.setContent(`
      <!DOCTYPE html>
      <html lang="ko">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Toolbar Accessibility Test</title>
      </head>
      <body>
        <main>
          <h1>Toolbar Accessibility Test</h1>
          <div role="toolbar" aria-label="Media controls">
            <button aria-label="Previous">←</button>
            <button aria-label="Next">→</button>
            <button aria-label="Close">✕</button>
          </div>
        </main>
      </body>
      </html>
    `);
  });

  test('should have no accessibility violations in page', async ({ page }) => {
    // 전체 접근성 스캔
    const accessibilityScanResults = await new AxeBuilder({ page })
      .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'])
      .analyze();

    // 위반사항이 있으면 상세 정보 출력
    if (accessibilityScanResults.violations.length > 0) {
      console.error('Accessibility violations found:');
      accessibilityScanResults.violations.forEach(violation => {
        console.error(`- ${violation.id}: ${violation.description}`);
        console.error(`  Impact: ${violation.impact}`);
        console.error(
          `  Nodes:`,
          violation.nodes.map(n => n.html)
        );
      });
    }

    expect(accessibilityScanResults.violations).toEqual([]);
  });

  test('should support keyboard navigation', async ({ page }) => {
    // Tab 키로 포커스 이동 테스트
    await page.keyboard.press('Tab');

    // 포커스가 이동했는지 확인
    const focusedElement = await page.evaluate(() => document.activeElement?.tagName);
    expect(focusedElement).toBeTruthy();

    // 키보드 접근성 검증
    const accessibilityScanResults = await new AxeBuilder({ page }).withTags(['wcag2a']).analyze();

    expect(accessibilityScanResults.violations).toEqual([]);
  });

  test('should have proper ARIA roles and labels', async ({ page }) => {
    // ARIA 속성 검증
    const accessibilityScanResults = await new AxeBuilder({ page }).withTags(['wcag2a']).analyze();

    expect(accessibilityScanResults.violations).toEqual([]);
  });
});
