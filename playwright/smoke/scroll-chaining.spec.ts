/**
 * @file Scroll chaining smoke tests
 * @description Verifies gallery scroll containment and upstream scroll guards in a real browser.
 */

import { expect, test } from '@playwright/test';

const GALLERY_SELECTOR = '#xeg-test-gallery';
const ITEMS_SELECTOR = '#xeg-test-items';
const SCROLL_STATE_KEY = '__XEG_SCROLL_TEST__';
const HANDLERS_KEY = '__XEG_SCROLL_HANDLERS__';

test.describe('Scroll Chaining Prevention', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('about:blank');

    await page.evaluate(
      ({ gallerySelector, itemsSelector, stateKey, handlersKey }) => {
        document.body.innerHTML = '';

        const filler = document.createElement('div');
        filler.id = 'xeg-scroll-filler';
        filler.style.height = '6000px';
        filler.style.width = '100%';
        document.body.appendChild(filler);

        const gallery = document.createElement('div');
        gallery.id = gallerySelector.slice(1);
        gallery.setAttribute('data-gallery-container', 'true');
        gallery.setAttribute('data-xeg-role', 'gallery');
        gallery.style.position = 'fixed';
        gallery.style.inset = '5%';
        gallery.style.display = 'flex';
        gallery.style.flexDirection = 'column';
        gallery.style.background = 'rgba(15, 23, 42, 0.92)';
        gallery.style.borderRadius = '1rem';
        gallery.style.overflow = 'hidden';
        gallery.style.overscrollBehavior = 'none';
        gallery.style.boxSizing = 'border-box';

        const items = document.createElement('div');
        items.id = itemsSelector.slice(1);
        items.setAttribute('data-xeg-role', 'items-container');
        items.style.flex = '1';
        items.style.height = '100%';
        items.style.maxHeight = '100%';
        items.style.overflowY = 'auto';
        items.style.overscrollBehavior = 'contain';
        items.style.padding = '1.5rem';
        items.style.boxSizing = 'border-box';

        const content = document.createElement('div');
        content.style.height = '3600px';
        content.style.background =
          'linear-gradient(180deg, rgba(255,255,255,0.12), rgba(255,255,255,0.04))';

        items.appendChild(content);
        gallery.appendChild(items);
        document.body.appendChild(gallery);

        window.scrollTo(0, 520);

        const scrollState = {
          isScrolling: false,
          timeoutId: undefined as number | undefined,
          lastPrevented: null as null | { deltaY: number; target: string | null },
        };

        const clearExistingTimeout = () => {
          if (typeof scrollState.timeoutId === 'number') {
            window.clearTimeout(scrollState.timeoutId);
            scrollState.timeoutId = undefined;
          }
        };

        const scheduleIdleReset = () => {
          clearExistingTimeout();
          scrollState.timeoutId = window.setTimeout(() => {
            scrollState.isScrolling = false;
            scrollState.lastPrevented = null;
            scrollState.timeoutId = undefined;
          }, 250);
        };

        const isGalleryInternalEvent = (event: Event): boolean => {
          const target = event.target as Element | null;
          if (!target) {
            return false;
          }
          return Boolean(
            target.closest('[data-gallery-container]') ||
              target.closest('[data-xeg-role="items-container"]')
          );
        };

        const extractWheelDelta = (event: Event): number => {
          if (event instanceof WheelEvent && typeof event.deltaY === 'number') {
            return event.deltaY;
          }
          const maybe = (event as { deltaY?: number }).deltaY;
          return typeof maybe === 'number' ? maybe : 0;
        };

        const handleGalleryWheel = (event: Event) => {
          if (!isGalleryInternalEvent(event)) {
            return;
          }
          scrollState.isScrolling = true;
          scheduleIdleReset();
        };

        const preventTwitterScroll = (event: Event) => {
          if (!scrollState.isScrolling) {
            return;
          }
          if (isGalleryInternalEvent(event)) {
            return;
          }

          const deltaY = extractWheelDelta(event);
          const target = event.target as Element | null;

          event.preventDefault();
          event.stopPropagation();

          scrollState.lastPrevented = {
            deltaY,
            target: target?.id || target?.tagName || null,
          };

          scheduleIdleReset();
        };

        document.addEventListener('wheel', handleGalleryWheel, { capture: true, passive: true });
        document.body.addEventListener('wheel', preventTwitterScroll, {
          capture: true,
          passive: false,
        });

        (window as unknown as Record<string, unknown>)[stateKey] = scrollState;
        (window as unknown as Record<string, unknown>)[handlersKey] = {
          handleGalleryWheel,
          preventTwitterScroll,
        };
      },
      {
        gallerySelector: GALLERY_SELECTOR,
        itemsSelector: ITEMS_SELECTOR,
        stateKey: SCROLL_STATE_KEY,
        handlersKey: HANDLERS_KEY,
      }
    );
  });

  test.afterEach(async ({ page }) => {
    await page.evaluate(
      ({ stateKey, handlersKey }) => {
        const handlerRecord = (window as unknown as Record<string, unknown>)[handlersKey] as
          | { handleGalleryWheel: EventListener; preventTwitterScroll: EventListener }
          | undefined;

        if (handlerRecord) {
          document.removeEventListener('wheel', handlerRecord.handleGalleryWheel, true);
          document.body.removeEventListener('wheel', handlerRecord.preventTwitterScroll, true);
        }

        delete (window as unknown as Record<string, unknown>)[handlersKey];
        delete (window as unknown as Record<string, unknown>)[stateKey];

        document.body.innerHTML = '';
        window.scrollTo(0, 0);
      },
      { stateKey: SCROLL_STATE_KEY, handlersKey: HANDLERS_KEY }
    );
  });

  test('applies overscroll containment to gallery surfaces', async ({ page }) => {
    const containerOverscroll = await page
      .locator(GALLERY_SELECTOR)
      .evaluate(node => window.getComputedStyle(node as HTMLElement).overscrollBehavior);

    const itemsOverscroll = await page
      .locator(ITEMS_SELECTOR)
      .evaluate(node => window.getComputedStyle(node as HTMLElement).overscrollBehavior);

    expect(containerOverscroll.split(/\s+/)).toContain('none');
    expect(itemsOverscroll.split(/\s+/)).toContain('contain');
  });

  test('allows gallery internal scrolling without preventing defaults', async ({ page }) => {
    const items = page.locator(ITEMS_SELECTOR);

    const initialScrollTop = await items.evaluate(node => (node as HTMLElement).scrollTop);
    const initialWindowScroll = await page.evaluate(() => window.scrollY);
    await items.hover();
    await page.mouse.wheel(0, 320);
    await page.waitForTimeout(50); // allow scroll momentum to settle before measuring

    const finalScrollTop = await items.evaluate(node => (node as HTMLElement).scrollTop);
    const finalWindowScroll = await page.evaluate(() => window.scrollY);
    expect(finalScrollTop).toBeGreaterThan(initialScrollTop);
    expect(finalWindowScroll).toBe(initialWindowScroll);

    const internalEventResult = await page.evaluate(selector => {
      const element = document.querySelector(selector) as HTMLElement | null;
      if (!element) {
        return null;
      }
      const event = new WheelEvent('wheel', { deltaY: 160, bubbles: true, cancelable: true });
      const dispatchResult = element.dispatchEvent(event);
      return { dispatchResult, defaultPrevented: event.defaultPrevented };
    }, ITEMS_SELECTOR);

    expect(internalEventResult).not.toBeNull();
    expect(internalEventResult?.dispatchResult).toBe(true);
    expect(internalEventResult?.defaultPrevented).toBe(false);
  });

  test('blocks page scroll propagation after gallery wheel interaction', async ({ page }) => {
    const items = page.locator(ITEMS_SELECTOR);
    await items.hover();
    await page.mouse.wheel(0, 360);

    const result = await page.evaluate(stateKey => {
      window.scrollTo(0, 560);
      const before = window.scrollY;
      const event = new WheelEvent('wheel', { deltaY: 240, bubbles: true, cancelable: true });
      const dispatchResult = document.body.dispatchEvent(event);
      const after = window.scrollY;
      const scrollState = (window as unknown as Record<string, unknown>)[stateKey] as
        | {
            lastPrevented: { deltaY: number; target: string | null } | null;
          }
        | undefined;

      return {
        before,
        after,
        dispatchResult,
        defaultPrevented: event.defaultPrevented,
        lastPreventedTarget: scrollState?.lastPrevented?.target ?? null,
        lastPreventedDelta: scrollState?.lastPrevented?.deltaY ?? null,
      };
    }, SCROLL_STATE_KEY);

    expect(result.before).toBeGreaterThan(0);
    expect(result.dispatchResult).toBe(false);
    expect(result.defaultPrevented).toBe(true);
    expect(result.after).toBe(result.before);
    expect(result.lastPreventedTarget).toBe('BODY');
    expect(result.lastPreventedDelta).toBe(240);
  });
});
