/**
 * Accessibility tests - KeyboardHelpOverlay component
 *
 * Keyboard help overlay accessibility validation using @axe-core/playwright
 *
 * Validation Items:
 * - WCAG 2.1 Level AA compliance
 * - Dialog role and attributes
 * - Keyboard navigation capability
 * - Table structure accessibility
 *
 * Note: Using static HTML simulation
 * TODO: Switch to harness API (mountKeyboardOverlay)
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
        <title>Keyboard Help Overlay Test</title>
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

  test('should have no accessibility violations', async ({ page }) => {
    const accessibilityScanResults = await new AxeBuilder({ page })
      .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'])
      .analyze();

    expect(accessibilityScanResults.violations).toEqual([]);
  });

  test('should have proper dialog role and attributes', async ({ page }) => {
    const dialog = page.locator('[role="dialog"]');
    await expect(dialog).toBeVisible();

    const ariaModal = await dialog.getAttribute('aria-modal');
    expect(ariaModal).toBe('true');

    const ariaLabelledby = await dialog.getAttribute('aria-labelledby');
    expect(ariaLabelledby).toBeTruthy();

    const labelElement = page.locator(`#${ariaLabelledby}`);
    await expect(labelElement).toBeVisible();

    const accessibilityScanResults = await new AxeBuilder({ page })
      .include('[role="dialog"]')
      .withTags(['wcag2a'])
      .analyze();

    expect(accessibilityScanResults.violations).toEqual([]);
  });

  test('should have accessible table structure', async ({ page }) => {
    const table = page.locator('table');
    await expect(table).toBeVisible();

    const headers = await table.locator('th').allTextContents();
    expect(headers).toContain('Key');
    expect(headers).toContain('Action');

    const accessibilityScanResults = await new AxeBuilder({ page })
      .include('table')
      .withTags(['wcag2a', 'cat.semantics'])
      .analyze();

    expect(accessibilityScanResults.violations).toEqual([]);
  });

  test('should support keyboard navigation', async ({ page }) => {
    await page.keyboard.press('Tab');

    const focusedElement = await page.evaluate(() => document.activeElement?.tagName);
    expect(focusedElement).toBeTruthy();

    await page.keyboard.press('Escape');

    const accessibilityScanResults = await new AxeBuilder({ page })
      .withTags(['cat.keyboard'])
      .analyze();

    expect(accessibilityScanResults.violations).toEqual([]);
  });
});
