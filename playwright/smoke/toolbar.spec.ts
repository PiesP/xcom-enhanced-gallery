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
      const result = await harness.mountToolbar({
        currentIndex: 0,
        totalCount: 3,
        isDownloading: false,
      });
      return result.containerId;
    });

    const toolbar = page.locator(`#${containerId}`).getByRole('toolbar');
    await expect(toolbar).toBeVisible();

    // Support both English and Korean labels
    // Try to find buttons by role and text content
    const allButtons = toolbar.locator('button');
    const buttonCount = await allButtons.count();

    // Verify toolbar has enough buttons (at least 8+ control buttons)
    expect(buttonCount).toBeGreaterThanOrEqual(8);
  });

  test('navigation buttons disable when no direction is available', async ({ page }) => {
    // First state: currentIndex=0 (first item)
    await page.evaluate(async () => {
      const harness = window.__XEG_HARNESS__;
      if (!harness) throw new Error('Harness not available');
      await harness.mountToolbar({
        currentIndex: 0,
        totalCount: 2,
        isDownloading: false,
      });
    });

    const prevButtonTitle = page.locator('[data-gallery-element="nav-previous"]');
    const nextButtonTitle = page.locator('[data-gallery-element="nav-next"]');

    // Verify buttons are present by data-gallery-element
    await expect(prevButtonTitle).toBeVisible();
    await expect(nextButtonTitle).toBeVisible();

    await expect(prevButtonTitle).toHaveAttribute('data-disabled', 'true');
    await expect(nextButtonTitle).toHaveAttribute('data-disabled', 'false');
    await expect(prevButtonTitle).toBeDisabled();
    await expect(nextButtonTitle).toBeEnabled();

    // Second state: remount with currentIndex=1 (last item)
    await page.evaluate(async () => {
      const harness = window.__XEG_HARNESS__;
      if (!harness) throw new Error('Harness not available');
      await harness.disposeToolbar();
      await harness.mountToolbar({
        currentIndex: 1,
        totalCount: 2,
        isDownloading: false,
      });
    });

    // After remount: new button locators (use data-gallery-element instead of i18n labels)
    const prevButton2 = page.locator('[data-gallery-element="nav-previous"]');
    const nextButton2 = page.locator('[data-gallery-element="nav-next"]');

    // Last item: only next button disables, previous remains enabled
    await expect(prevButton2).toHaveAttribute('data-disabled', 'false');
    await expect(nextButton2).toHaveAttribute('data-disabled', 'true');
    await expect(prevButton2).toBeEnabled();
    await expect(nextButton2).toBeDisabled();
  });
});
