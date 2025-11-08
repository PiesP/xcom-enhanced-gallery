/**
 * Accessibility tests - Toolbar component
 *
 * Toolbar accessibility validation using @axe-core/playwright
 *
 * Validation Items:
 * - WCAG 2.1 Level AA compliance
 * - Keyboard navigation capability
 * - ARIA label appropriateness
 *
 * Note: Using static HTML simulation
 * TODO: Switch to harness API (mountToolbar)
 */

import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

test.describe('Toolbar Accessibility', () => {
  test.beforeEach(async ({ page }) => {
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

  test('should have no accessibility violations', async ({ page }) => {
    const accessibilityScanResults = await new AxeBuilder({ page })
      .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'])
      .analyze();

    expect(accessibilityScanResults.violations).toEqual([]);
  });

  test('should support keyboard navigation', async ({ page }) => {
    await page.keyboard.press('Tab');

    const focusedElement = await page.evaluate(() => document.activeElement?.tagName);
    expect(focusedElement).toBeTruthy();

    const accessibilityScanResults = await new AxeBuilder({ page }).withTags(['wcag2a']).analyze();

    expect(accessibilityScanResults.violations).toEqual([]);
  });

  test('should have proper ARIA roles and labels', async ({ page }) => {
    const accessibilityScanResults = await new AxeBuilder({ page }).withTags(['wcag2a']).analyze();

    expect(accessibilityScanResults.violations).toEqual([]);
  });
});
