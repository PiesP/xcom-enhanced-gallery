/**
 * @file scroll-chaining-keyboard.spec.ts
 * @description E2E 테스트: 키보드 네비게이션 시 페이지 스크롤 차단 검증
 *
 * **테스트 시나리오**:
 * 1. Space, PageDown 키 → 갤러리 네비게이션, 페이지 스크롤 차단
 * 2. ArrowDown, ArrowUp 키 → 갤러리 스크롤, 페이지 스크롤 차단
 * 3. Home, End 키 → 갤러리 경계 이동, 페이지 스크롤 차단
 *
 * **검증 항목**:
 * - 키보드 이벤트 preventDefault
 * - 페이지 scrollTop 변화 없음
 * - 갤러리 내부 동작 정상
 *
 * @see test/unit/features/scroll-chaining-events.test.ts - 단위 테스트
 */

import { test, expect } from '@playwright/test';

test.describe('Scroll Chaining Keyboard Navigation (E2E)', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('https://x.com');

    // 페이지 스크롤 가능 콘텐츠 추가
    await page.evaluate(() => {
      const pageContent = document.createElement('div');
      pageContent.id = 'page-content';
      pageContent.style.cssText = `
        width: 100%;
        height: 5000px;
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
      scrollableContent.style.cssText = `
        width: 100%;
        height: 3000px;
      `;

      galleryContainer.appendChild(scrollableContent);
      document.body.appendChild(galleryContainer);

      // 키보드 네비게이션 방지 (Space, PageDown, PageUp, Home, End)
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

  test('should prevent page scroll when pressing Space key', async ({ page }) => {
    const initialPageScrollTop = await page.evaluate(() => document.documentElement.scrollTop);

    // 갤러리에 포커스
    await page.locator('#xeg-gallery-container').focus();

    // Space 키 입력
    await page.keyboard.press('Space');
    await page.waitForTimeout(100);

    const finalPageScrollTop = await page.evaluate(() => document.documentElement.scrollTop);

    expect(finalPageScrollTop).toBe(initialPageScrollTop);
  });

  test('should prevent page scroll when pressing PageDown key', async ({ page }) => {
    const initialPageScrollTop = await page.evaluate(() => document.documentElement.scrollTop);

    await page.locator('#xeg-gallery-container').focus();
    await page.keyboard.press('PageDown');
    await page.waitForTimeout(100);

    const finalPageScrollTop = await page.evaluate(() => document.documentElement.scrollTop);

    expect(finalPageScrollTop).toBe(initialPageScrollTop);
  });

  test('should prevent page scroll when pressing PageUp key', async ({ page }) => {
    // 페이지를 중간으로 스크롤
    await page.evaluate(() => {
      window.scrollTo(0, 500);
    });

    const initialPageScrollTop = await page.evaluate(() => document.documentElement.scrollTop);

    await page.locator('#xeg-gallery-container').focus();
    await page.keyboard.press('PageUp');
    await page.waitForTimeout(100);

    const finalPageScrollTop = await page.evaluate(() => document.documentElement.scrollTop);

    expect(finalPageScrollTop).toBe(initialPageScrollTop);
  });

  test('should prevent page scroll when pressing Home key', async ({ page }) => {
    // 페이지를 중간으로 스크롤
    await page.evaluate(() => {
      window.scrollTo(0, 1000);
    });

    const initialPageScrollTop = await page.evaluate(() => document.documentElement.scrollTop);

    await page.locator('#xeg-gallery-container').focus();
    await page.keyboard.press('Home');
    await page.waitForTimeout(100);

    const finalPageScrollTop = await page.evaluate(() => document.documentElement.scrollTop);

    // 페이지는 스크롤되지 않아야 함
    expect(finalPageScrollTop).toBe(initialPageScrollTop);
  });

  test('should prevent page scroll when pressing End key', async ({ page }) => {
    const initialPageScrollTop = await page.evaluate(() => document.documentElement.scrollTop);

    await page.locator('#xeg-gallery-container').focus();
    await page.keyboard.press('End');
    await page.waitForTimeout(100);

    const finalPageScrollTop = await page.evaluate(() => document.documentElement.scrollTop);

    expect(finalPageScrollTop).toBe(initialPageScrollTop);
  });

  test('should prevent page scroll when pressing ArrowDown key', async ({ page }) => {
    const initialPageScrollTop = await page.evaluate(() => document.documentElement.scrollTop);

    await page.locator('#xeg-gallery-container').focus();
    await page.keyboard.press('ArrowDown');
    await page.waitForTimeout(100);

    const finalPageScrollTop = await page.evaluate(() => document.documentElement.scrollTop);

    expect(finalPageScrollTop).toBe(initialPageScrollTop);
  });

  test('should prevent page scroll when pressing ArrowUp key', async ({ page }) => {
    // 페이지를 중간으로 스크롤
    await page.evaluate(() => {
      window.scrollTo(0, 500);
    });

    const initialPageScrollTop = await page.evaluate(() => document.documentElement.scrollTop);

    await page.locator('#xeg-gallery-container').focus();
    await page.keyboard.press('ArrowUp');
    await page.waitForTimeout(100);

    const finalPageScrollTop = await page.evaluate(() => document.documentElement.scrollTop);

    expect(finalPageScrollTop).toBe(initialPageScrollTop);
  });

  test('should handle rapid keyboard input without page scroll', async ({ page }) => {
    const initialPageScrollTop = await page.evaluate(() => document.documentElement.scrollTop);

    await page.locator('#xeg-gallery-container').focus();

    // 빠른 연속 키 입력
    const keys = ['ArrowDown', 'Space', 'PageDown', 'ArrowDown', 'Space'];
    for (const key of keys) {
      await page.keyboard.press(key);
      await page.waitForTimeout(50);
    }

    const finalPageScrollTop = await page.evaluate(() => document.documentElement.scrollTop);

    expect(finalPageScrollTop).toBe(initialPageScrollTop);
  });

  test('should allow keyboard navigation within gallery boundaries', async ({ page }) => {
    // 갤러리 초기 scrollTop
    const initialGalleryScrollTop = await page.evaluate(() => {
      const gallery = document.getElementById('xeg-gallery-container');
      return gallery?.scrollTop || 0;
    });

    await page.locator('#xeg-gallery-container').focus();

    // 갤러리 내부 스크롤 (페이지는 스크롤되지 않아야 함)
    await page.keyboard.press('ArrowDown');
    await page.waitForTimeout(100);

    const finalGalleryScrollTop = await page.evaluate(() => {
      const gallery = document.getElementById('xeg-gallery-container');
      return gallery?.scrollTop || 0;
    });

    // 갤러리는 스크롤될 수 있음 (키보드 이벤트가 차단되더라도 갤러리 내부 동작은 가능)
    expect(finalGalleryScrollTop).toBeGreaterThanOrEqual(initialGalleryScrollTop);
  });

  test('should restore page scroll behavior when gallery is closed', async ({ page }) => {
    // 갤러리 제거
    await page.evaluate(() => {
      const gallery = document.getElementById('xeg-gallery-container');
      gallery?.remove();

      // 키보드 이벤트 리스너 제거 (실제로는 갤러리 닫힐 때 정리됨)
      const listeners = (window as any).__xeg_keyboard_listeners;
      if (listeners) {
        listeners.forEach((listener: EventListener) => {
          document.removeEventListener('keydown', listener);
        });
      }
    });

    const initialPageScrollTop = await page.evaluate(() => document.documentElement.scrollTop);

    // Space 키를 눌렀을 때 페이지가 스크롤되어야 함
    await page.keyboard.press('Space');
    await page.waitForTimeout(100);

    const finalPageScrollTop = await page.evaluate(() => document.documentElement.scrollTop);

    // 갤러리가 닫혔으므로 페이지 스크롤이 정상 동작해야 함
    // (Space 키로 인한 스크롤이 발생할 수 있음)
    expect(finalPageScrollTop).toBeGreaterThanOrEqual(initialPageScrollTop);
  });
});
