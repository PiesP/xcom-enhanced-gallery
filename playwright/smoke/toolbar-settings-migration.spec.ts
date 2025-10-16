import { test, expect } from '@playwright/test';
import { ensureHarness } from './utils';
import type { XegHarness } from '../harness/types';

// Type augmentation for browser-side harness
declare global {
  interface Window {
    __XEG_HARNESS__?: XegHarness;
  }
}

/**
 * Phase 82.1: Toolbar Settings Toggle E2E Migration
 *
 * Converts 4 skipped JSDOM unit tests to Playwright E2E:
 * - toolbar-settings-toggle.test.tsx:59 (First click opens panel)
 * - toolbar-settings-toggle.test.tsx:73 (Second click closes panel)
 * - toolbar-settings-toggle.test.tsx:87 (Multiple toggles work)
 * - toolbar-settings-toggle.test.tsx:112 (Click outside closes panel)
 *
 * JSDOM Limitation: Solid.js component-scoped signals fail to track reactivity
 * Browser Reality: Actual browser provides correct DOM updates
 *
 * Expected Behavior: Settings panel state managed via data-expanded attribute
 */

test.describe('Phase 82.1: Toolbar Settings Toggle (E2E Migration)', () => {
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

  test('설정 버튼 첫 클릭 시 패널이 열린다', async ({ page }) => {
    // Mount Toolbar
    await page.evaluate(async () => {
      const harness = window.__XEG_HARNESS__;
      if (!harness) throw new Error('Harness not available');
      await harness.mountToolbar({
        currentIndex: 0,
        totalCount: 5,
        isDownloading: false,
      });
    });

    // Wait for settings button to be visible
    await page.waitForSelector('[data-gallery-element="settings"]', { timeout: 5000 });

    // Verify panel is closed initially
    let panelState = await page.evaluate(() => {
      const panel = document.querySelector('[data-gallery-element="settings-panel"]');
      return panel?.getAttribute('data-expanded');
    });
    expect(panelState).toBe('false');

    // Click settings button
    const settingsButton = await page.$('[data-gallery-element="settings"]');
    if (!settingsButton) throw new Error('Settings button not found');
    await settingsButton.click();

    // Wait for state update with multiple attempts
    let retries = 0;
    while (retries < 10) {
      panelState = await page.evaluate(() => {
        const panel = document.querySelector('[data-gallery-element="settings-panel"]');
        return panel?.getAttribute('data-expanded');
      });
      if (panelState === 'true') break;
      await page.waitForTimeout(50);
      retries++;
    }

    // Verify panel is now open
    expect(panelState).toBe('true');

    // Verify button aria-expanded attribute
    const ariaExpanded = await page.getAttribute(
      '[data-gallery-element="settings"]',
      'aria-expanded'
    );
    expect(ariaExpanded).toBe('true');
  });

  test('설정 버튼을 다시 클릭하면 패널이 닫힌다', async ({ page }) => {
    // Mount Toolbar
    await page.evaluate(async () => {
      const harness = window.__XEG_HARNESS__;
      if (!harness) throw new Error('Harness not available');
      await harness.mountToolbar({
        currentIndex: 0,
        totalCount: 5,
        isDownloading: false,
      });
    });

    // First click - open
    await page.click('[data-gallery-element="settings"]');
    await page.waitForTimeout(100);

    let panelState = await page.evaluate(() => {
      const panel = document.querySelector('[data-gallery-element="settings-panel"]');
      return panel?.getAttribute('data-expanded');
    });
    expect(panelState).toBe('true');

    // Second click - close
    await page.click('[data-gallery-element="settings"]');
    await page.waitForTimeout(100);

    // Verify panel is now closed
    panelState = await page.evaluate(() => {
      const panel = document.querySelector('[data-gallery-element="settings-panel"]');
      return panel?.getAttribute('data-expanded');
    });
    expect(panelState).toBe('false');

    // Verify button aria-expanded attribute
    const ariaExpanded = await page.getAttribute(
      '[data-gallery-element="settings"]',
      'aria-expanded'
    );
    expect(ariaExpanded).toBe('false');
  });

  test('설정 버튼을 여러 번 클릭해도 상태가 교대로 전환된다', async ({ page }) => {
    // Mount Toolbar
    await page.evaluate(async () => {
      const harness = window.__XEG_HARNESS__;
      if (!harness) throw new Error('Harness not available');
      await harness.mountToolbar({
        currentIndex: 0,
        totalCount: 5,
        isDownloading: false,
      });
    });

    const getState = async () => {
      return page.evaluate(() => {
        const panel = document.querySelector('[data-gallery-element="settings-panel"]');
        return panel?.getAttribute('data-expanded');
      });
    };

    const expectExpanded = async (expected: string) => {
      const state = await getState();
      expect(state).toBe(expected);
    };

    // Initial state: closed
    await expectExpanded('false');

    // Click 1: open
    await page.click('[data-gallery-element="settings"]');
    await page.waitForTimeout(100);
    await expectExpanded('true');

    // Click 2: close
    await page.click('[data-gallery-element="settings"]');
    await page.waitForTimeout(100);
    await expectExpanded('false');

    // Click 3: open
    await page.click('[data-gallery-element="settings"]');
    await page.waitForTimeout(100);
    await expectExpanded('true');

    // Click 4: close
    await page.click('[data-gallery-element="settings"]');
    await page.waitForTimeout(100);
    await expectExpanded('false');
  });

  test('패널 외부를 클릭하면 닫힌다', async ({ page }) => {
    // Mount Toolbar
    await page.evaluate(async () => {
      const harness = window.__XEG_HARNESS__;
      if (!harness) throw new Error('Harness not available');
      await harness.mountToolbar({
        currentIndex: 0,
        totalCount: 5,
        isDownloading: false,
      });
    });

    // Wait for settings button
    await page.waitForSelector('[data-gallery-element="settings"]', { timeout: 5000 });

    // Open panel
    await page.click('[data-gallery-element="settings"]');
    await page.waitForTimeout(200);

    let panelState = await page.evaluate(() => {
      const panel = document.querySelector('[data-gallery-element="settings-panel"]');
      return panel?.getAttribute('data-expanded');
    });
    expect(panelState).toBe('true');

    // Click in document body to simulate outside click
    // Use page.locator to interact with body element
    await page.click('body', { position: { x: 10, y: 10 } });
    await page.waitForTimeout(100);

    // Verify panel is closed
    panelState = await page.evaluate(() => {
      const panel = document.querySelector('[data-gallery-element="settings-panel"]');
      return panel?.getAttribute('data-expanded');
    });
    expect(panelState).toBe('false');

    // Verify button aria-expanded attribute
    const ariaExpanded = await page.getAttribute(
      '[data-gallery-element="settings"]',
      'aria-expanded'
    );
    expect(ariaExpanded).toBe('false');
  });
});
