import { expect, test } from '@playwright/test';
import { ensureHarness } from './utils';

test.describe('ErrorBoundary E2E', () => {
  test('renders fallback when child throws', async ({ page }) => {
    await page.goto('about:blank');
    await ensureHarness(page);

    const result = await page.evaluate(async () => {
      const harness = window.__XEG_HARNESS__;
      if (!harness) {
        throw new Error('Harness not available');
      }

      const outcome = await harness.errorBoundaryScenario();
      return outcome;
    });

    console.log('ErrorBoundary test result:', result);
    expect(result.errorCaught).toBeTruthy();
    expect(result.fallbackRendered).toBeTruthy();
  });
});
