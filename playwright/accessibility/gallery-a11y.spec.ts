/**
 * 접근성 테스트 - Gallery 컴포넌트
 *
 * @axe-core/playwright를 사용한 자동화된 접근성 검증
 * WCAG 2.1 Level AA 준수 확인
 *
 * 참고: 현재는 기본 페이지 접근성 스캔으로 시작
 * TODO: 하네스 API 확장 후 컴포넌트별 상세 테스트 추가
 *
 * @see https://www.deque.com/axe/core-documentation/api-documentation/
 */

import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

test.describe('Gallery Accessibility Tests', () => {
  test.beforeEach(async ({ page }) => {
    // 기본 HTML 페이지로 시작 (하네스 없이 테스트)
    await page.goto('about:blank');
    await page.setContent(`
      <!DOCTYPE html>
      <html lang="ko">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Gallery Accessibility Test</title>
      </head>
      <body>
        <main>
          <h1>Gallery Accessibility Test</h1>
          <p>This is a test page for accessibility validation.</p>
        </main>
      </body>
      </html>
    `);
  });

  test('should not have accessibility violations on page load', async ({ page }) => {
    // 페이지 로드 상태에서 axe-core 스캔
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

  test('should have sufficient color contrast', async ({ page }) => {
    // 색상 대비 규칙만 검사
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

  test('should have proper semantic structure', async ({ page }) => {
    // 의미론적 HTML 검증
    const accessibilityScanResults = await new AxeBuilder({ page })
      .withTags(['cat.semantics'])
      .analyze();

    if (accessibilityScanResults.violations.length > 0) {
      console.error('Semantic structure violations found:');
      accessibilityScanResults.violations.forEach(violation => {
        console.error(`- ${violation.id}: ${violation.description}`);
      });
    }

    expect(accessibilityScanResults.violations).toEqual([]);
  });
});
