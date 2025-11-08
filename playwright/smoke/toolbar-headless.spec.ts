import { expect, test } from '@playwright/test';
import { ensureHarness } from './utils';

type ToolbarHeadlessSnapshot = {
  items: Array<{ type: string; group: string; disabled?: boolean; loading?: boolean }>;
  downloadButtonsLoading: boolean;
  fitModeBefore: string;
  fitModeAfter: string;
};

test.describe('ToolbarHeadless state', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('about:blank');
    await ensureHarness(page);
  });

  test('exposes normalized items and actions', async ({ page }) => {
    const result = (await page.evaluate(async () => {
      const harness = window.__XEG_HARNESS__;
      if (!harness) throw new Error('Harness not available');
      return harness.evaluateToolbarHeadless({
        currentIndex: 0,
        totalCount: 3,
        isDownloading: true,
      });
    })) as ToolbarHeadlessSnapshot;

    expect(result.items.some(item => item.type === 'previous')).toBeTruthy();
    expect(result.items.some(item => item.type === 'next')).toBeTruthy();
    expect(result.items.filter(item => item.group === 'fitModes').length).toBe(4);
    expect(result.downloadButtonsLoading).toBeTruthy();
    expect(result.fitModeBefore).toBe('original');
    expect(result.fitModeAfter).toBe('fitWidth');
  });
});
