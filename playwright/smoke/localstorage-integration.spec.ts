/* global localStorage */
import { test, expect } from '@playwright/test';

/**
 * @fileoverview LocalStorage Integration E2E Tests
 *
 * Purpose: Validate browser LocalStorage integration (harness not required)
 */

test.describe('LocalStorage Integration', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('https://x.com');
    await page.waitForLoadState('domcontentloaded');
  });

  test('should save and retrieve settings from LocalStorage', async ({ page }) => {
    // Save settings to LocalStorage
    await page.evaluate(() => {
      localStorage.setItem('xeg-test-setting', 'test-value');
    });

    // Verify saved value
    const value = await page.evaluate(() => {
      return localStorage.getItem('xeg-test-setting');
    });

    expect(value).toBe('test-value');
  });

  test('should persist settings across page reloads', async ({ page }) => {
    // Save settings
    await page.evaluate(() => {
      localStorage.setItem('xeg-persistent-setting', 'persistent-value');
    });

    // Reload page
    await page.reload();
    await page.waitForLoadState('domcontentloaded');

    // Verify settings restored
    const restoredValue = await page.evaluate(() => {
      return localStorage.getItem('xeg-persistent-setting');
    });

    expect(restoredValue).toBe('persistent-value');
  });

  test('should handle JSON settings', async ({ page }) => {
    const settings = {
      layout: 'vertical',
      theme: 'dark',
      autoplay: true,
    };

    // Save JSON settings
    await page.evaluate(settingsObj => {
      localStorage.setItem('xeg-json-settings', JSON.stringify(settingsObj));
    }, settings);

    // Restore JSON settings
    const restoredSettings = await page.evaluate(() => {
      const stored = localStorage.getItem('xeg-json-settings');
      return stored ? JSON.parse(stored) : null;
    });

    expect(restoredSettings).toEqual(settings);
  });

  test('should clear settings when requested', async ({ page }) => {
    // Save settings
    await page.evaluate(() => {
      localStorage.setItem('xeg-clearable-setting', 'to-be-cleared');
    });

    // Verify settings exist
    let value = await page.evaluate(() => {
      return localStorage.getItem('xeg-clearable-setting');
    });
    expect(value).toBe('to-be-cleared');

    // Delete settings
    await page.evaluate(() => {
      localStorage.removeItem('xeg-clearable-setting');
    });

    // Verify deletion
    value = await page.evaluate(() => {
      return localStorage.getItem('xeg-clearable-setting');
    });
    expect(value).toBeNull();
  });

  test('should handle multiple settings keys', async ({ page }) => {
    const keys = ['key1', 'key2', 'key3'];
    const values = ['value1', 'value2', 'value3'];

    // Save multiple settings
    await page.evaluate(
      ({ keys, values }) => {
        keys.forEach((key, index) => {
          localStorage.setItem(`xeg-${key}`, values[index] as string);
        });
      },
      { keys, values }
    );

    // Verify all settings
    const retrievedValues = await page.evaluate(
      ({ keys }) => {
        return keys.map(key => localStorage.getItem(`xeg-${key}`));
      },
      { keys }
    );

    expect(retrievedValues).toEqual(values);
  });
});
