// SPDX-License-Identifier: MIT
// Copyright (c) 2024-2026 PiesP

/**
 * @fileoverview E2E tests for keyboard navigation in X.com Enhanced Gallery.
 *
 * Tests verify:
 * 1. ArrowRight navigates to next item
 * 2. ArrowLeft navigates to previous item (via ArrowRight then ArrowLeft)
 * 3. ArrowDown navigates to next item
 * 4. ArrowUp navigates to previous item (via ArrowDown then ArrowUp)
 * 5. Escape closes the gallery
 * 6. ArrowLeft at first item is a no-op
 * 7. ArrowRight at last item is a no-op
 * 8. Escape does not close gallery when editing form fields
 *
 * Environment: Playwright + Chromium (headless)
 * Test page: Mock HTML served under https://x.com via page.route()
 */

import { test, expect, type Page, type Route } from '@playwright/test';
import { existsSync } from 'node:fs';
import { DEV_USERSCRIPT_PATH, MOCK_GALLERY_HTML } from '../fixtures/artifacts';
import { installGMMock } from '../fixtures/gm-mock';
import { injectDevUserscript, waitForGalleryApp } from '../fixtures/userscript-harness';

interface DeferredActiveImage {
  readonly requested: Promise<void>;
  readonly fulfill: () => Promise<void>;
}

interface GalleryDimensions {
  readonly width: number;
  readonly height: number;
}

async function deferGalleryImages(page: Page): Promise<DeferredActiveImage> {
  let activeImageRoute: Route | null = null;
  let resolveRequest = (): void => {};
  const requested = new Promise<void>((resolvePromise) => {
    resolveRequest = resolvePromise;
  });

  await page.route('https://pbs.twimg.com/**', async (route) => {
    if (!activeImageRoute && route.request().url().includes('/E1.jpg')) {
      activeImageRoute = route;
      resolveRequest();
      return;
    }

    await route.abort();
  });

  return {
    requested,
    fulfill: async (): Promise<void> => {
      await requested;
      const route = activeImageRoute;
      if (!route) throw new Error('Active gallery image request was not intercepted');
      await route.fulfill({
        status: 200,
        contentType: 'image/svg+xml',
        body: '<svg xmlns="http://www.w3.org/2000/svg" width="800" height="600" />',
      });
    },
  };
}

async function setupGalleryPage(page: Page): Promise<void> {
  await page.route('**/*.x.com/**', async (route) => {
    const url = route.request().url();
    if (url.includes('.css') || url.includes('.js') || url.includes('.jpg') || url.includes('.png') || url.includes('.svg') || url.includes('.webp') || url.includes('.gif')) {
      await route.abort();
    } else {
      await route.fulfill({ status: 200, contentType: 'text/html', body: MOCK_GALLERY_HTML });
    }
  });
  await page.route('https://x.com/', async (route) => {
    await route.fulfill({ status: 200, contentType: 'text/html', body: MOCK_GALLERY_HTML });
  });
  await page.route('https://x.com', async (route) => {
    await route.fulfill({ status: 200, contentType: 'text/html', body: MOCK_GALLERY_HTML });
  });

  await page.goto('https://x.com', { waitUntil: 'domcontentloaded', timeout: 15_000 });

  await installGMMock(page);
  await injectDevUserscript(page);
  await waitForGalleryApp(page);
}

async function openGallery(
  page: Page,
  itemCount = 3,
  dimensions: GalleryDimensions = { width: 800, height: 600 }
): Promise<void> {
  await openGalleryWithDimensions(
    page,
    Array.from({ length: itemCount }, () => dimensions)
  );
}

async function openGalleryWithDimensions(
  page: Page,
  dimensionsByItem: readonly GalleryDimensions[]
): Promise<void> {
  await page.evaluate((dimensionsByItem) => {
    const g = globalThis as any;
    const items = dimensionsByItem.map((dimensions, index) => {
      const number = index + 1;
      const url = `https://pbs.twimg.com/media/E${number}.jpg?format=jpg&name=large`;
      return {
        id: `img_${number}`,
        url,
        type: 'image',
        filename: `E${number}.jpg`,
        tweetUsername: 'u',
        tweetId: '1',
        tweetUrl: 'https://x.com/u/1',
        originalUrl: url,
        thumbnailUrl: `https://pbs.twimg.com/media/E${number}.jpg?format=jpg&name=thumb`,
        alt: String.fromCharCode(65 + index),
        width: dimensions.width,
        height: dimensions.height,
        metadata: {},
      };
    });
    g.__XEG__.main.galleryApp.openGallery(items, 0);
  }, dimensionsByItem);
  await page.waitForSelector('[data-xeg-gallery-container]', { timeout: 10_000 });
}

async function getIndex(page: Page): Promise<number> {
  const v = await page.locator('[role="progressbar"]').getAttribute('aria-valuenow');
  return v ? parseInt(v, 10) - 1 : -1;
}

function getPreviousButton(page: Page) {
  return page.getByRole('button', { name: 'Previous' });
}

function getNextButton(page: Page) {
  return page.getByRole('button', { name: 'Next' });
}

const RESPONSIVE_VIEWPORT_WIDTHS = [320, 375, 414, 768, 1024, 1280] as const;

test.describe('X.com Enhanced Gallery Keyboard Navigation', () => {
  test.beforeAll(() => {
    if (!existsSync(DEV_USERSCRIPT_PATH)) {
      throw new Error(`Build dev bundle first: ${DEV_USERSCRIPT_PATH}`);
    }
  });

  test('ArrowRight navigates to next item', async ({ page }) => {
    await setupGalleryPage(page);
    await openGallery(page);
    expect(await getIndex(page)).toBe(0);
    await page.keyboard.press('ArrowRight');
    await expect.poll(() => getIndex(page)).toBe(1);
    await page.keyboard.press('ArrowRight');
    await expect.poll(() => getIndex(page)).toBe(2);
  });

  test('ArrowLeft navigates to previous item', async ({ page }) => {
    await setupGalleryPage(page);
    await openGallery(page);
    expect(await getIndex(page)).toBe(0);
    // Go forward first, then back
    await page.keyboard.press('ArrowRight');
    await expect.poll(() => getIndex(page)).toBe(1);
    await page.keyboard.press('ArrowLeft');
    await expect.poll(() => getIndex(page)).toBe(0);
  });

  test('ArrowDown navigates to next item', async ({ page }) => {
    await setupGalleryPage(page);
    await openGallery(page);
    expect(await getIndex(page)).toBe(0);
    await page.keyboard.press('ArrowDown');
    await expect.poll(() => getIndex(page)).toBe(1);
  });

  test('ArrowUp navigates to previous item', async ({ page }) => {
    await setupGalleryPage(page);
    await openGallery(page);
    // Go forward first, then up
    await page.keyboard.press('ArrowDown');
    await expect.poll(() => getIndex(page)).toBe(1);
    await page.keyboard.press('ArrowUp');
    await expect.poll(() => getIndex(page)).toBe(0);
  });

  test('Escape closes the gallery', async ({ page }) => {
    await setupGalleryPage(page);
    await openGallery(page);
    await expect(page.locator('[data-xeg-gallery-container]')).toBeVisible();
    await page.keyboard.press('Escape');
    await page.waitForSelector('[data-xeg-gallery-container]', { state: 'detached', timeout: 10_000 });
    expect(await page.evaluate(() => !document.querySelector('[data-xeg-gallery-container]'))).toBe(true);
  });

  test('ArrowLeft at first item is a no-op', async ({ page }) => {
    await setupGalleryPage(page);
    await openGallery(page);
    expect(await getIndex(page)).toBe(0);
    await page.keyboard.press('ArrowLeft');
    await expect(page.locator('[role="progressbar"]')).toHaveAttribute('aria-valuenow', '1');
  });

  test('ArrowRight at last item is a no-op', async ({ page }) => {
    await setupGalleryPage(page);
    await openGallery(page);
    await page.keyboard.press('ArrowRight');
    await page.keyboard.press('ArrowRight');
    await expect.poll(() => getIndex(page)).toBe(2);
    await page.keyboard.press('ArrowRight');
    await expect(page.locator('[role="progressbar"]')).toHaveAttribute('aria-valuenow', '3');
  });

  test('toolbar previous/next buttons navigate and expose correct boundary state', async ({ page }) => {
    await setupGalleryPage(page);
    await openGallery(page);

    const previousButton = getPreviousButton(page);
    const nextButton = getNextButton(page);

    await expect(previousButton).toBeDisabled();
    await expect(nextButton).toBeEnabled();
    expect(await getIndex(page)).toBe(0);

    await nextButton.click();
    await expect.poll(() => getIndex(page)).toBe(1);
    await expect(previousButton).toBeEnabled();
    await expect(nextButton).toBeEnabled();

    await nextButton.click();
    await expect.poll(() => getIndex(page)).toBe(2);
    await expect(previousButton).toBeEnabled();
    await expect(nextButton).toBeDisabled();

    await previousButton.click();
    await expect.poll(() => getIndex(page)).toBe(1);
  });

  test('toolbar controls remain fully operable across supported viewport widths', async ({
    page,
  }) => {
    await setupGalleryPage(page);
    await openGallery(page);

    const toolbar = page.locator('[data-gallery-element="toolbar"]');

    for (const width of RESPONSIVE_VIEWPORT_WIDTHS) {
      await test.step(`${width}px viewport`, async () => {
        await page.setViewportSize({ width, height: 800 });

        const clippedControls = await toolbar.evaluate((element) => {
          const toolbarRect = element.getBoundingClientRect();
          const controls = [
            ...element.querySelectorAll<HTMLButtonElement>('button'),
            element.querySelector<HTMLElement>('[role="progressbar"]'),
          ].filter((control): control is HTMLElement => control !== null);

          return controls.flatMap((control) => {
            const rect = control.getBoundingClientRect();
            const isContained =
              rect.left >= toolbarRect.left &&
              rect.right <= toolbarRect.right &&
              rect.top >= toolbarRect.top &&
              rect.bottom <= toolbarRect.bottom &&
              rect.left >= 0 &&
              rect.right <= window.innerWidth &&
              rect.top >= 0 &&
              rect.bottom <= window.innerHeight;

            if (isContained) return [];

            return [
              control.getAttribute('aria-label') ?? control.textContent?.trim() ?? control.tagName,
            ];
          });
        });

        expect(clippedControls).toEqual([]);

        const splitGroups = await toolbar.getByRole('group').evaluateAll((groups) =>
          groups.flatMap((group) => {
            const buttons = [...group.querySelectorAll('button')];
            const rowTops = new Set(
              buttons.map((button) => Math.round(button.getBoundingClientRect().top))
            );
            if (rowTops.size <= 1) return [];
            return [group.querySelector('legend')?.textContent?.trim() ?? 'unnamed group'];
          })
        );
        expect(splitGroups).toEqual([]);
      });
    }
  });

  test('viewport resize preserves the selected mixed-aspect item in view', async ({ page }) => {
    const dimensions = [
      { width: 480, height: 720 },
      { width: 1200, height: 360 },
      { width: 640, height: 480 },
    ] as const;
    await page.route('https://pbs.twimg.com/**', async (route) => {
      const match = /\/E(\d+)\.jpg/.exec(route.request().url());
      const index = Number(match?.[1] ?? 1) - 1;
      const size = dimensions[index] ?? dimensions[0];
      await route.fulfill({
        status: 200,
        contentType: 'image/svg+xml',
        body: `<svg xmlns="http://www.w3.org/2000/svg" width="${size.width}" height="${size.height}" />`,
      });
    });
    await setupGalleryPage(page);
    await openGalleryWithDimensions(page, dimensions);

    await page.keyboard.press('ArrowRight');
    await expect.poll(() => getIndex(page)).toBe(1);

    const toolbar = page.locator('[data-gallery-element="toolbar"]');
    const selectedItem = page.locator('[data-gallery-element="item"][data-index="1"]');
    const selectedTopOffset = () =>
      selectedItem.evaluate((item) => {
        const items = item.closest('[data-gallery-element="items"]');
        if (!items) throw new Error('Missing gallery items container');
        return Math.abs(
          Math.round(item.getBoundingClientRect().top - items.getBoundingClientRect().top)
        );
      });
    await expect.poll(selectedTopOffset).toBe(0);

    await page.setViewportSize({ width: 401, height: 592 });
    await page.waitForFunction(() => {
      const gallery = document.querySelector<HTMLElement>('[data-gallery-element="items"]')
        ?.parentElement;
      return gallery?.style.getPropertyValue('--xeg-viewport-w') === '401px';
    });
    await page.evaluate(
      () =>
        new Promise<void>((resolve) => requestAnimationFrame(() => requestAnimationFrame(resolve)))
    );

    await expect(page.locator('[role="progressbar"]')).toHaveAttribute('aria-valuenow', '2');
    await expect(toolbar).toHaveAttribute('data-current-index', '1');
    await expect(toolbar).toHaveAttribute('data-focused-index', '1');
    await expect.poll(selectedTopOffset).toBe(0);
  });

  test('selected fit state survives hover, focus, disabled, and forced colors', async ({ page }) => {
    await setupGalleryPage(page);
    await openGallery(page);

    await page
      .locator('[data-gallery-element="toolbar"] button[aria-label="Fit Window"]')
      .click();
    const selected = page.locator(
      '[data-gallery-element="toolbar"] [aria-label="Fit Window"][aria-pressed="true"]'
    );
    await expect(selected).toBeEnabled();

    const selectedStyle = async () =>
      selected.evaluate(async (element) => {
        await Promise.allSettled(element.getAnimations().map((animation) => animation.finished));
        const style = getComputedStyle(element);
        return {
          backgroundColor: style.backgroundColor,
          color: style.color,
          borderStyle: style.borderStyle,
          borderWidth: style.borderWidth,
          boxShadow: style.boxShadow,
          focusVisible: element.matches(':focus-visible'),
          outlineStyle: style.outlineStyle,
          outlineWidth: style.outlineWidth,
        };
      });

    const forcedColorReference = async () =>
      page.evaluate(() => {
        const reference = document.createElement('span');
        reference.style.forcedColorAdjust = 'none';
        reference.style.color = 'HighlightText';
        reference.style.backgroundColor = 'Highlight';
        document.body.append(reference);
        const style = getComputedStyle(reference);
        const colors = {
          backgroundColor: style.backgroundColor,
          color: style.color,
        };
        reference.remove();
        return colors;
      });

    const resting = await selectedStyle();
    expect(resting.backgroundColor).not.toBe('rgba(0, 0, 0, 0)');
    expect(resting.boxShadow).not.toBe('none');

    await selected.hover();
    const hovered = await selectedStyle();
    expect(hovered.backgroundColor).toBe(resting.backgroundColor);
    expect(hovered.boxShadow).toBe(resting.boxShadow);

    await page.keyboard.press('Tab');
    await selected.focus();
    const focused = await selectedStyle();
    expect(focused.backgroundColor).toBe(resting.backgroundColor);
    expect(focused.boxShadow).toBe(resting.boxShadow);
    expect(focused.focusVisible).toBe(true);
    expect(focused.outlineStyle).not.toBe('none');
    expect(Number.parseFloat(focused.outlineWidth)).toBeGreaterThanOrEqual(2);

    await page.emulateMedia({ forcedColors: 'active' });
    await selected.evaluate((element) => element.blur());
    await selected.hover();
    const systemHighlight = await forcedColorReference();
    const forcedHovered = await selectedStyle();
    expect(forcedHovered.backgroundColor).toBe(systemHighlight.backgroundColor);
    expect(forcedHovered.color).toBe(systemHighlight.color);

    await page.keyboard.press('Tab');
    await selected.focus();
    const forced = await selectedStyle();
    expect(forced.backgroundColor).toBe(systemHighlight.backgroundColor);
    expect(forced.color).toBe(systemHighlight.color);
    expect(forced.focusVisible).toBe(true);
    expect(forced.borderStyle).toBe('solid');
    expect(Number.parseFloat(forced.borderWidth)).toBeGreaterThanOrEqual(2);
    expect(forced.outlineStyle).not.toBe('none');
    expect(Number.parseFloat(forced.outlineWidth)).toBeGreaterThanOrEqual(2);

    await page.emulateMedia({ forcedColors: 'none' });
    await page
      .locator('[data-gallery-element="toolbar"]')
      .evaluate((element) => element.setAttribute('disabled', ''));
    await expect(selected).toBeDisabled();
    const disabled = await selectedStyle();
    expect(disabled.backgroundColor).toBe(resting.backgroundColor);
    expect(disabled.boxShadow).toBe(resting.boxShadow);
  });

  test('settings panel stays reachable in a short narrow viewport', async ({ page }) => {
    await page.setViewportSize({ width: 320, height: 240 });
    await setupGalleryPage(page);
    await openGallery(page);

    await page.locator('#settings-button').click();
    const panel = page.locator('[data-gallery-element="settings-panel"]');
    await expect(panel).toBeVisible();

    const layout = await panel.evaluate((element) => {
      const rect = element.getBoundingClientRect();
      return {
        bottom: rect.bottom,
        viewportHeight: window.innerHeight,
        overflowY: getComputedStyle(element).overflowY,
      };
    });

    expect(layout.bottom).toBeLessThanOrEqual(layout.viewportHeight);
    expect(layout.overflowY).toBe('auto');

    await panel.evaluate((element) => {
      element.scrollTop = element.scrollHeight;
    });
    await expect(panel.locator('select').last()).toBeInViewport();
  });

  test('toolbar boundaries follow the item currently focused by scrolling', async ({ page }) => {
    await setupGalleryPage(page);
    await openGallery(page);

    const itemsContainer = page.locator('[data-gallery-element="items"]');
    await itemsContainer.hover();
    await page.mouse.wheel(0, 1600);

    const toolbar = page.locator('[data-gallery-element="toolbar"]');
    await expect(toolbar).toHaveAttribute('data-focused-index', '2');
    await expect(getPreviousButton(page)).toBeEnabled();
    await expect(getNextButton(page)).toBeDisabled();

    await getPreviousButton(page).click();
    await expect.poll(() => getIndex(page)).toBe(1);
  });

  test('delayed media load does not override the user scroll position', async ({ page }) => {
    const activeImage = await deferGalleryImages(page);
    await setupGalleryPage(page);
    await openGallery(page);
    await activeImage.requested;

    const itemsContainer = page.locator('[data-gallery-element="items"]');
    await itemsContainer.hover();
    await page.mouse.wheel(0, 500);
    await expect.poll(() => itemsContainer.evaluate((element) => element.scrollTop)).toBe(500);

    // Let the gallery's scroll-idle timer expire before the active media loads.
    await page.waitForTimeout(350);
    const settledScrollTop = await itemsContainer.evaluate((element) => element.scrollTop);
    const toolbar = page.locator('[data-gallery-element="toolbar"]');
    const settledFocusedIndex = await toolbar.getAttribute('data-focused-index');

    await activeImage.fulfill();
    await expect(page.locator('[data-gallery-element="item"][data-index="0"]')).toHaveAttribute(
      'data-media-loaded',
      'true'
    );
    await page.waitForTimeout(300);

    expect(await itemsContainer.evaluate((element) => element.scrollTop)).toBe(settledScrollTop);
    await expect(toolbar).toHaveAttribute('data-focused-index', settledFocusedIndex ?? '');
  });

  test('continuous downward scrolling preserves item geometry near the final image', async ({
    page,
  }) => {
    await page.route('https://pbs.twimg.com/**', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'image/svg+xml',
        body: '<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="800" />',
      });
    });
    await setupGalleryPage(page);
    await openGallery(page, 6, { width: 1200, height: 800 });

    const itemsContainer = page.locator('[data-gallery-element="items"]');
    await itemsContainer.hover();

    let previousScrollTop = await itemsContainer.evaluate((element) => element.scrollTop);
    for (let step = 0; step < 35; step += 1) {
      await page.mouse.wheel(0, 120);
      await page.waitForTimeout(100);
      const currentScrollTop = await itemsContainer.evaluate((element) => element.scrollTop);
      expect(
        currentScrollTop,
        `downward wheel scrolling moved backward at step ${step + 1}`
      ).toBeGreaterThanOrEqual(previousScrollTop);
      previousScrollTop = currentScrollTop;
    }

    const itemGeometry = await page
      .locator('[data-gallery-element="item"]')
      .evaluateAll((items) =>
        items.map((item) => {
          const intrinsicSize = getComputedStyle(item)
            .getPropertyValue('--xeg-cis-override')
            .trim();
          return {
            height: item.getBoundingClientRect().height,
            intrinsicSizeSupported: CSS.supports('contain-intrinsic-size', intrinsicSize),
          };
        })
      );
    expect(Math.min(...itemGeometry.map(({ height }) => height))).toBeGreaterThan(100);
    expect(itemGeometry.every(({ intrinsicSizeSupported }) => intrinsicSizeSupported)).toBe(true);
  });

  test('Escape does not close gallery when editing form fields', async ({ page }) => {
    await setupGalleryPage(page);
    await openGallery(page);
    await page.evaluate(() => {
      const ta = document.createElement('textarea');
      ta.id = 'test-textarea';
      document.querySelector('[data-xeg-gallery-container]')?.appendChild(ta);
    });
    await page.locator('#test-textarea').focus();
    expect(await page.evaluate(() => document.activeElement === document.getElementById('test-textarea'))).toBe(true);
    await page.keyboard.press('Escape');
    await expect(page.locator('[data-xeg-gallery-container]')).toBeVisible();
  });
});
