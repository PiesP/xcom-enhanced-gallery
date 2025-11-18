import { test } from '@playwright/test';

test.describe.skip('Render-after-load behavior removed', () => {
  test('placeholder', () => {
    // Intentionally empty: legacy spec removed in favor of immediate bootstrap.
  });
});
