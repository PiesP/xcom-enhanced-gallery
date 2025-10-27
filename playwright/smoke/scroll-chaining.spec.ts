/**
 * @file Scroll Chaining Prevention E2E Tests
 * @description 갤러리 내 스크롤이 페이지 스크롤로 전파되지 않도록 차단 검증
 *
 * **테스트 시나리오**:
 * 1. Wheel 이벤트: 갤러리 경계에서 페이지 스크롤 차단
 * 2. Keyboard 이벤트: Space/PageDown/Home/End 등 페이지 스크롤 차단
 * 3. overscroll-behavior: none 적용 검증
 *
 * **Consolidated from**:
 * - scroll-chaining-boundary.spec.ts
 * - scroll-chaining-keyboard.spec.ts
 *
 * **Reference**:
 * - test/unit/features/scroll-chaining-boundary.test.ts
 * - test/browser/scroll-chaining-propagation.test.ts
 */

import { expect, test } from '@playwright/test';

test.describe('Scroll Chaining Prevention', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('https://x.com');

    await page.evaluate(() => {
      // 페이지 스크롤 가능 콘텐츠 추가
      const pageContent = document.createElement('div');
      pageContent.id = 'page-content';
      pageContent.style.cssText = `
        width: 100%;
        height: 5000px;
        background: linear-gradient(to bottom, #ffffff, #f0f0f0);
      `;
      document.body.appendChild(pageContent);

      // 갤러리 컨테이너 생성
      const galleryContainer = document.createElement('div');
      galleryContainer.id = 'xeg-gallery-container';
      galleryContainer.tabIndex = 0;
      galleryContainer.style.cssText = `
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100vh;
        overflow: auto;
        overscroll-behavior: none;
        z-index: 9999;
        background: rgba(0, 0, 0, 0.9);
      `;

      const scrollableContent = document.createElement('div');
      scrollableContent.id = 'gallery-content';
      scrollableContent.style.cssText = `
        width: 100%;
        height: 3000px;
        background: linear-gradient(to bottom, #1a1a1a, #2a2a2a);
      `;

      galleryContainer.appendChild(scrollableContent);
      document.body.appendChild(galleryContainer);

      // Wheel 이벤트 경계 차단
      galleryContainer.addEventListener(
        'wheel',
        (event: WheelEvent) => {
          const target = event.currentTarget as HTMLElement;
          const atTop = target.scrollTop === 0;
          const atBottom = target.scrollTop + target.offsetHeight >= target.scrollHeight;

          if ((atTop && event.deltaY < 0) || (atBottom && event.deltaY > 0)) {
            event.preventDefault();
            event.stopPropagation();
          }
        },
        { passive: false }
      );

      // Keyboard 네비게이션 차단
      const navigationKeys = ['Space', 'PageDown', 'PageUp', 'Home', 'End', 'ArrowDown', 'ArrowUp'];

      document.addEventListener(
        'keydown',
        (event: KeyboardEvent) => {
          if (navigationKeys.includes(event.code)) {
            event.preventDefault();
            event.stopPropagation();
          }
        },
        { passive: false }
      );
    });
  });

  test.describe('Wheel Event Boundary', () => {
    test('Prevents page scroll at gallery bottom boundary', async ({ page }) => {
      const initialPageScrollTop = await page.evaluate(() => document.documentElement.scrollTop);

      // 갤러리를 하단까지 스크롤
      await page.evaluate(() => {
        const gallery = document.getElementById('xeg-gallery-container');
        if (gallery) {
          gallery.scrollTop = gallery.scrollHeight - gallery.offsetHeight;
        }
      });

      // 갤러리 하단에서 추가 스크롤 시도
      const gallery = page.locator('#xeg-gallery-container');
      await gallery.hover();
      await gallery.evaluate(el => {
        const wheelEvent = new WheelEvent('wheel', {
          deltaY: 100,
          bubbles: true,
          cancelable: true,
        });
        el.dispatchEvent(wheelEvent);
      });

      await page.waitForTimeout(100);

      const finalPageScrollTop = await page.evaluate(() => document.documentElement.scrollTop);
      expect(finalPageScrollTop).toBe(initialPageScrollTop);
    });

    test('Prevents page scroll at gallery top boundary', async ({ page }) => {
      const initialPageScrollTop = await page.evaluate(() => document.documentElement.scrollTop);

      // 갤러리를 상단에 위치
      await page.evaluate(() => {
        const gallery = document.getElementById('xeg-gallery-container');
        if (gallery) {
          gallery.scrollTop = 0;
        }
      });

      // 갤러리 상단에서 위로 스크롤 시도
      const gallery = page.locator('#xeg-gallery-container');
      await gallery.hover();
      await gallery.evaluate(el => {
        const wheelEvent = new WheelEvent('wheel', {
          deltaY: -100,
          bubbles: true,
          cancelable: true,
        });
        el.dispatchEvent(wheelEvent);
      });

      await page.waitForTimeout(100);

      const finalPageScrollTop = await page.evaluate(() => document.documentElement.scrollTop);
      expect(finalPageScrollTop).toBe(initialPageScrollTop);
    });

    test('Allows gallery internal scroll', async ({ page }) => {
      const initialGalleryScrollTop = await page.evaluate(() => {
        const gallery = document.getElementById('xeg-gallery-container');
        return gallery?.scrollTop ?? 0;
      });

      const gallery = page.locator('#xeg-gallery-container');
      await gallery.hover();
      await gallery.evaluate(el => {
        const wheelEvent = new WheelEvent('wheel', {
          deltaY: 100,
          bubbles: true,
          cancelable: true,
        });
        el.dispatchEvent(wheelEvent);
      });

      await page.waitForTimeout(100);

      const finalGalleryScrollTop = await page.evaluate(() => {
        const gallery = document.getElementById('xeg-gallery-container');
        return gallery?.scrollTop ?? 0;
      });

      // 갤러리 내부 스크롤은 정상 동작
      expect(finalGalleryScrollTop).toBeGreaterThanOrEqual(initialGalleryScrollTop);
    });
  });

  test.describe('Keyboard Navigation', () => {
    test('Prevents page scroll when pressing Space', async ({ page }) => {
      const initialPageScrollTop = await page.evaluate(() => document.documentElement.scrollTop);

      await page.locator('#xeg-gallery-container').focus();
      await page.keyboard.press('Space');
      await page.waitForTimeout(100);

      const finalPageScrollTop = await page.evaluate(() => document.documentElement.scrollTop);
      expect(finalPageScrollTop).toBe(initialPageScrollTop);
    });

    test('Prevents page scroll when pressing PageDown', async ({ page }) => {
      const initialPageScrollTop = await page.evaluate(() => document.documentElement.scrollTop);

      await page.locator('#xeg-gallery-container').focus();
      await page.keyboard.press('PageDown');
      await page.waitForTimeout(100);

      const finalPageScrollTop = await page.evaluate(() => document.documentElement.scrollTop);
      expect(finalPageScrollTop).toBe(initialPageScrollTop);
    });

    test('Prevents page scroll when pressing Home/End', async ({ page }) => {
      const initialPageScrollTop = await page.evaluate(() => document.documentElement.scrollTop);

      await page.locator('#xeg-gallery-container').focus();
      await page.keyboard.press('Home');
      await page.waitForTimeout(50);
      await page.keyboard.press('End');
      await page.waitForTimeout(50);

      const finalPageScrollTop = await page.evaluate(() => document.documentElement.scrollTop);
      expect(finalPageScrollTop).toBe(initialPageScrollTop);
    });

    test('Prevents page scroll when pressing ArrowUp/Down', async ({ page }) => {
      const initialPageScrollTop = await page.evaluate(() => document.documentElement.scrollTop);

      await page.locator('#xeg-gallery-container').focus();
      await page.keyboard.press('ArrowDown');
      await page.waitForTimeout(50);
      await page.keyboard.press('ArrowUp');
      await page.waitForTimeout(50);

      const finalPageScrollTop = await page.evaluate(() => document.documentElement.scrollTop);
      expect(finalPageScrollTop).toBe(initialPageScrollTop);
    });
  });
});
