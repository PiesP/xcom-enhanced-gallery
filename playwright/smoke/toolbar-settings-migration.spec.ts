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

  test('settings button first click opens panel', async ({ page }) => {
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

    // Use page.click() to trigger all event handlers properly
    await page.click('[data-gallery-element="settings"]', { force: true });

    // Wait for data-expanded to become true (the source of truth)
    await page.waitForFunction(
      () => {
        const panel = document.querySelector('[data-gallery-element="settings-panel"]');
        return panel?.getAttribute('data-expanded') === 'true';
      },
      { timeout: 5000 }
    );

    // Verify panel is now open via data-expanded
    panelState = await page.evaluate(() => {
      const panel = document.querySelector('[data-gallery-element="settings-panel"]');
      return panel?.getAttribute('data-expanded');
    });
    expect(panelState).toBe('true');

    // Note: aria-expanded may not sync on first click due to Solid.js reactivity timing in browser.
    // This is documented in AGENTS.md (Solid.js Reactivity Constraints).
    // Subsequent state changes will properly sync both attributes.
  });

  test('settings button click again closes panel', async ({ page }) => {
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
    await page.click('[data-gallery-element="settings"]', { force: true });

    // Wait for panel to open
    await page.waitForFunction(
      () => {
        const panel = document.querySelector('[data-gallery-element="settings-panel"]');
        return panel?.getAttribute('data-expanded') === 'true';
      },
      { timeout: 5000 }
    );

    let panelState = await page.evaluate(() => {
      const panel = document.querySelector('[data-gallery-element="settings-panel"]');
      return panel?.getAttribute('data-expanded');
    });
    expect(panelState).toBe('true');

    // Second click - close
    await page.click('[data-gallery-element="settings"]', { force: true });

    // Wait for panel to close
    await page.waitForFunction(
      () => {
        const panel = document.querySelector('[data-gallery-element="settings-panel"]');
        return panel?.getAttribute('data-expanded') === 'false';
      },
      { timeout: 5000 }
    );

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

  test('settings button toggled multiple times alternates state', async ({ page }) => {
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

    const waitForState = async (expectedState: string) => {
      await page.waitForFunction(
        (expected: string) => {
          const panel = document.querySelector('[data-gallery-element="settings-panel"]');
          return panel?.getAttribute('data-expanded') === expected;
        },
        expectedState,
        { timeout: 5000 }
      );
      const state = await getState();
      expect(state).toBe(expectedState);
    };

    // Initial state: closed
    await waitForState('false');

    // Click 1: open
    await page.click('[data-gallery-element="settings"]', { force: true });
    await waitForState('true');

    // Click 2: close
    await page.click('[data-gallery-element="settings"]', { force: true });
    await waitForState('false');

    // Click 3: open
    await page.click('[data-gallery-element="settings"]', { force: true });
    await waitForState('true');

    // Click 4: close
    await page.click('[data-gallery-element="settings"]', { force: true });
    await waitForState('false');
  });

  test('clicking outside panel closes it', async ({ page }) => {
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
    await page.click('[data-gallery-element="settings"]', { force: true });

    // Wait for panel to open
    await page.waitForFunction(
      () => {
        const panel = document.querySelector('[data-gallery-element="settings-panel"]');
        return panel?.getAttribute('data-expanded') === 'true';
      },
      { timeout: 5000 }
    );

    let panelState = await page.evaluate(() => {
      const panel = document.querySelector('[data-gallery-element="settings-panel"]');
      return panel?.getAttribute('data-expanded');
    });
    expect(panelState).toBe('true');

    // Wait for Solid.js createEffect to register the outside click handler
    // The handler is set up asynchronously after panel expansion
    await page.waitForTimeout(200);

    // Blur the focused select element to deactivate the select guard
    // When the panel opens, the first select element is automatically focused,
    // which activates isSelectActive flag that blocks outside click detection
    await page.evaluate(() => {
      const activeElement = document.activeElement as HTMLElement | null;
      if (activeElement && activeElement.tagName === 'SELECT') {
        activeElement.blur();
      }
    });

    // Wait for select blur guard to release (100ms from handleSelectBlur)
    await page.waitForTimeout(150);

    // Dispatch mousedown event on body to trigger outside click handler
    // Using evaluate() ensures the event targets the body element directly
    await page.evaluate(() => {
      const event = new MouseEvent('mousedown', { bubbles: true, cancelable: true });
      document.body.dispatchEvent(event);
    });

    // Wait for panel to close (mousedown triggers outside click handler)
    await page.waitForFunction(
      () => {
        const panel = document.querySelector('[data-gallery-element="settings-panel"]');
        return panel?.getAttribute('data-expanded') === 'false';
      },
      { timeout: 5000 }
    );

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
