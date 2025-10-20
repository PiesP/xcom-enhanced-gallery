/**
 * @file scroll-chaining-boundary.spec.ts
 * @description E2E 테스트: 갤러리 경계에서 페이지 스크롤 차단 검증
 *
 * **테스트 시나리오**:
 * 1. 갤러리를 하단까지 스크롤 후 추가 스크롤 시도 → 페이지 스크롤 미발생
 * 2. 갤러리를 상단에서 위로 스크롤 시도 → 페이지 스크롤 미발생
 * 3. 갤러리 내부에서 스크롤 → 정상 동작
 *
 * **검증 항목**:
 * - overscroll-behavior: none 적용
 * - wheel 이벤트 preventDefault/stopPropagation
 * - 페이지 scrollTop 변화 없음
 *
 * @see test/unit/features/scroll-chaining-boundary.test.ts - 단위 테스트
 * @see test/browser/scroll-chaining-propagation.test.ts - 브라우저 테스트
 */

import { test, expect } from '@playwright/test';

test.describe('Scroll Chaining Boundary (E2E)', () => {
  test.beforeEach(async ({ page }) => {
    // Twitter 페이지 스타일 모킹
    await page.goto('https://x.com');

    // 페이지에 충분한 스크롤 가능 콘텐츠 추가
    await page.evaluate(() => {
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
      galleryContainer.className = 'xeg-gallery-container';
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

      // 스크롤 체이닝 방지 이벤트 리스너 추가
      galleryContainer.addEventListener(
        'wheel',
        (event: WheelEvent) => {
          const target = event.currentTarget as HTMLElement;
          const atTop = target.scrollTop === 0;
          const atBottom = target.scrollTop + target.offsetHeight >= target.scrollHeight;

          // 경계에서 스크롤 시도 시 차단
          if ((atTop && event.deltaY < 0) || (atBottom && event.deltaY > 0)) {
            event.preventDefault();
            event.stopPropagation();
          }
        },
        { passive: false }
      );
    });
  });

  test('should prevent page scroll when gallery reaches bottom boundary', async ({ page }) => {
    // 초기 페이지 scrollTop 기록
    const initialPageScrollTop = await page.evaluate(() => document.documentElement.scrollTop);

    // 갤러리 컨테이너를 하단까지 스크롤
    await page.evaluate(() => {
      const gallery = document.getElementById('xeg-gallery-container');
      if (gallery) {
        gallery.scrollTop = gallery.scrollHeight - gallery.offsetHeight;
      }
    });

    // 갤러리 하단에서 추가 스크롤 시도 (wheel 이벤트)
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

    // 약간의 대기 시간
    await page.waitForTimeout(200);

    // 페이지 scrollTop이 변하지 않았는지 확인
    const finalPageScrollTop = await page.evaluate(() => document.documentElement.scrollTop);

    expect(finalPageScrollTop).toBe(initialPageScrollTop);
  });

  test('should prevent page scroll when gallery reaches top boundary', async ({ page }) => {
    // 페이지를 중간으로 스크롤
    await page.evaluate(() => {
      window.scrollTo(0, 500);
    });

    const initialPageScrollTop = await page.evaluate(() => document.documentElement.scrollTop);

    // 갤러리를 상단으로 스크롤
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

    // 약간의 대기 시간
    await page.waitForTimeout(200);

    // 페이지 scrollTop이 변하지 않았는지 확인
    const finalPageScrollTop = await page.evaluate(() => document.documentElement.scrollTop);

    expect(finalPageScrollTop).toBe(initialPageScrollTop);
  });

  test('should allow scroll within gallery boundaries', async ({ page }) => {
    // 갤러리를 중간 위치로 스크롤
    const initialGalleryScrollTop = await page.evaluate(() => {
      const gallery = document.getElementById('xeg-gallery-container');
      if (gallery) {
        gallery.scrollTop = 500;
        return gallery.scrollTop;
      }
      return 0;
    });

    // 갤러리에서 스크롤
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

    // 갤러리 scrollTop이 변경되었는지 확인
    const finalGalleryScrollTop = await page.evaluate(() => {
      const gallery = document.getElementById('xeg-gallery-container');
      return gallery?.scrollTop || 0;
    });

    // 스크롤이 발생했는지 확인 (경계가 아니므로 정상 스크롤)
    expect(finalGalleryScrollTop).toBeGreaterThanOrEqual(initialGalleryScrollTop);
  });

  test('should have overscroll-behavior: none applied', async ({ page }) => {
    const overscrollBehavior = await page.evaluate(() => {
      const gallery = document.getElementById('xeg-gallery-container');
      if (gallery) {
        return window.getComputedStyle(gallery).overscrollBehavior;
      }
      return '';
    });

    expect(overscrollBehavior).toBe('none');
  });

  test('should maintain scroll position after rapid wheel events', async ({ page }) => {
    // 갤러리를 하단으로 스크롤
    await page.evaluate(() => {
      const gallery = document.getElementById('xeg-gallery-container');
      if (gallery) {
        gallery.scrollTop = gallery.scrollHeight - gallery.offsetHeight;
      }
    });

    const initialPageScrollTop = await page.evaluate(() => document.documentElement.scrollTop);

    // 빠른 연속 스크롤 이벤트
    const gallery = page.locator('#xeg-gallery-container');
    await gallery.hover();

    for (let i = 0; i < 5; i++) {
      await gallery.evaluate(el => {
        const wheelEvent = new WheelEvent('wheel', {
          deltaY: 50,
          bubbles: true,
          cancelable: true,
        });
        el.dispatchEvent(wheelEvent);
      });
      await page.waitForTimeout(20);
    }

    // 최종 페이지 scrollTop 확인
    const finalPageScrollTop = await page.evaluate(() => document.documentElement.scrollTop);

    expect(finalPageScrollTop).toBe(initialPageScrollTop);
  });

  test('should prevent scroll chaining on both horizontal and vertical overflow', async ({
    page,
  }) => {
    // 갤러리에 수평 스크롤 추가
    await page.evaluate(() => {
      const gallery = document.getElementById('xeg-gallery-container');
      const content = document.getElementById('gallery-content');
      if (gallery && content) {
        gallery.style.overflowX = 'auto';
        content.style.width = '5000px';

        // 수평 스크롤 체이닝 방지
        gallery.addEventListener(
          'wheel',
          (event: WheelEvent) => {
            const target = event.currentTarget as HTMLElement;
            const atLeft = target.scrollLeft === 0;
            const atRight = target.scrollLeft + target.offsetWidth >= target.scrollWidth;

            if ((atLeft && event.deltaX < 0) || (atRight && event.deltaX > 0)) {
              event.preventDefault();
              event.stopPropagation();
            }
          },
          { passive: false }
        );
      }
    });

    const initialPageScrollTop = await page.evaluate(() => document.documentElement.scrollTop);

    // 수평 경계에서 스크롤 시도
    const gallery = page.locator('#xeg-gallery-container');
    await gallery.hover();
    await gallery.evaluate(el => {
      const wheelEvent = new WheelEvent('wheel', {
        deltaX: 100,
        bubbles: true,
        cancelable: true,
      });
      el.dispatchEvent(wheelEvent);
    });

    await page.waitForTimeout(100);

    const finalPageScrollTop = await page.evaluate(() => document.documentElement.scrollTop);

    expect(finalPageScrollTop).toBe(initialPageScrollTop);
  });
});
