/* global localStorage */
import { test, expect } from '@playwright/test';

/**
 * @fileoverview LocalStorage Integration E2E Tests
 *
 * 목적: 브라우저 LocalStorage 통합 검증 (하네스 불필요)
 */

test.describe('LocalStorage Integration', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('https://x.com');
    await page.waitForLoadState('domcontentloaded');
  });

  test('should save and retrieve settings from LocalStorage', async ({ page }) => {
    // LocalStorage에 설정 저장
    await page.evaluate(() => {
      localStorage.setItem('xeg-test-setting', 'test-value');
    });

    // 저장된 값 확인
    const value = await page.evaluate(() => {
      return localStorage.getItem('xeg-test-setting');
    });

    expect(value).toBe('test-value');
  });

  test('should persist settings across page reloads', async ({ page }) => {
    // 설정 저장
    await page.evaluate(() => {
      localStorage.setItem('xeg-persistent-setting', 'persistent-value');
    });

    // 페이지 새로고침
    await page.reload();
    await page.waitForLoadState('domcontentloaded');

    // 설정 복원 확인
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

    // JSON 설정 저장
    await page.evaluate(settingsObj => {
      localStorage.setItem('xeg-json-settings', JSON.stringify(settingsObj));
    }, settings);

    // JSON 설정 복원
    const restoredSettings = await page.evaluate(() => {
      const stored = localStorage.getItem('xeg-json-settings');
      return stored ? JSON.parse(stored) : null;
    });

    expect(restoredSettings).toEqual(settings);
  });

  test('should clear settings when requested', async ({ page }) => {
    // 설정 저장
    await page.evaluate(() => {
      localStorage.setItem('xeg-clearable-setting', 'to-be-cleared');
    });

    // 설정 존재 확인
    let value = await page.evaluate(() => {
      return localStorage.getItem('xeg-clearable-setting');
    });
    expect(value).toBe('to-be-cleared');

    // 설정 삭제
    await page.evaluate(() => {
      localStorage.removeItem('xeg-clearable-setting');
    });

    // 삭제 확인
    value = await page.evaluate(() => {
      return localStorage.getItem('xeg-clearable-setting');
    });
    expect(value).toBeNull();
  });

  test('should handle multiple settings keys', async ({ page }) => {
    const keys = ['key1', 'key2', 'key3'];
    const values = ['value1', 'value2', 'value3'];

    // 여러 설정 저장
    await page.evaluate(
      ({ keys, values }) => {
        keys.forEach((key, index) => {
          localStorage.setItem(`xeg-${key}`, values[index] as string);
        });
      },
      { keys, values }
    );

    // 모든 설정 확인
    const retrievedValues = await page.evaluate(
      ({ keys }) => {
        return keys.map(key => localStorage.getItem(`xeg-${key}`));
      },
      { keys }
    );

    expect(retrievedValues).toEqual(values);
  });
});
