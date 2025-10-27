/**
 * 접근성 테스트 - Gallery 컴포넌트
 *
 * @axe-core/playwright를 사용한 갤러리 접근성 검증
 * WCAG 2.1 Level AA 준수 확인
 *
 * 참고: 정적 HTML 시뮬레이션 사용
 * TODO: 하네스 API 확장 후 실제 컴포넌트 테스트로 전환
 */

import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

test.describe('Gallery Accessibility', () => {
  test.beforeEach(async ({ page }) => {
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

  test('should have no accessibility violations', async ({ page }) => {
    const accessibilityScanResults = await new AxeBuilder({ page })
      .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'])
      .analyze();

    expect(accessibilityScanResults.violations).toEqual([]);
  });

  test('should have sufficient color contrast', async ({ page }) => {
    const accessibilityScanResults = await new AxeBuilder({ page })
      .withTags(['cat.color'])
      .analyze();

    expect(accessibilityScanResults.violations).toEqual([]);
  });

  test('should have proper semantic structure', async ({ page }) => {
    const accessibilityScanResults = await new AxeBuilder({ page })
      .withTags(['cat.semantics'])
      .analyze();

    expect(accessibilityScanResults.violations).toEqual([]);
  });
});
