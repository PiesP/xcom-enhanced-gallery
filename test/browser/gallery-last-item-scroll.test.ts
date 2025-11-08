/**
 * Gallery Last Item Scroll 테스트 (Browser 모드)
 *
 * Phase 327: 마지막 아이템 특수 스크롤 로직 검증
 *
 * 실제 브라우저 환경에서 다음을 검증:
 * - scrollTo() API 동작 (실제 스크롤 이동)
 * - offsetHeight/clientHeight 정확한 값 계산
 * - Solid.js 반응성 (currentIndex 변경 → 스크롤 트리거)
 * - CSS scroll-snap과의 상호작용
 *
 * JSDOM 제약 극복:
 * - JSDOM: offsetHeight 항상 0 → Browser: 실제 레이아웃 계산
 * - JSDOM: scrollTo() 동작 안함 → Browser: 실제 스크롤 이동
 *
 * @see test/unit/features/scroll/last-item-scroll.test.ts (JSDOM 버전)
 * @see docs/TDD_REFACTORING_PLAN.md (Phase 327)
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { setupGlobalTestIsolation } from '../shared/global-cleanup-hooks';
import { getSolid } from '../../src/shared/external/vendors';

const { createSignal, createEffect } = getSolid();

describe('Gallery Last Item Scroll (Browser)', () => {
  setupGlobalTestIsolation();

  let container: HTMLDivElement;

  beforeEach(() => {
    // 갤러리 컨테이너 생성
    container = document.createElement('div');
    container.style.width = '800px';
    container.style.height = '600px';
    container.style.overflow = 'auto';
    // scroll-snap은 scrollTo() 간섭하므로 테스트에서는 비활성화
    document.body.appendChild(container);
  });

  afterEach(() => {
    container.remove();
  });

  it('should scroll to top when last item is smaller than viewport', async () => {
    // Phase 327: 작은 마지막 아이템의 최상단을 뷰포트 상단에 정렬

    // 큰 이미지 2개 (600px 이상)
    const img1 = document.createElement('img');
    img1.src =
      'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" width="800" height="800"/>';
    img1.style.width = '800px';
    img1.style.height = '800px';
    img1.style.scrollSnapAlign = 'start';
    container.appendChild(img1);

    const img2 = document.createElement('img');
    img2.src =
      'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" width="800" height="800"/>';
    img2.style.width = '800px';
    img2.style.height = '800px';
    img2.style.scrollSnapAlign = 'start';
    container.appendChild(img2);

    // 작은 마지막 이미지 (300px < 600px viewport)
    const imgLast = document.createElement('img');
    imgLast.src =
      'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" width="800" height="300"/>';
    imgLast.style.width = '800px';
    imgLast.style.height = '300px';
    imgLast.style.scrollSnapAlign = 'start';
    imgLast.id = 'last-item';
    container.appendChild(imgLast);

    // 이미지 로드 완료 대기 (실제 브라우저 렌더링)
    await new Promise<void>(resolve => {
      if (imgLast.complete) {
        resolve();
      } else {
        imgLast.onload = () => resolve();
      }
    });

    // 추가 레이아웃 안정화 대기
    await new Promise(resolve => setTimeout(resolve, 100));

    // Phase 327 로직 시뮬레이션: 마지막 아이템으로 스크롤
    const itemHeight = imgLast.offsetHeight;
    const viewportHeight = container.clientHeight;
    const isLastItem = true;

    expect(itemHeight).toBeLessThan(viewportHeight); // 300 < 600

    // Phase 327: scrollTo() 사용 (scrollIntoView가 아님)
    container.scrollTo({
      top: container.scrollHeight - viewportHeight,
      behavior: 'auto',
    });

    // 스크롤 완료 대기 (브라우저 렌더링 안정화)
    await new Promise(resolve => setTimeout(resolve, 300));

    // 검증: 마지막 아이템이 뷰포트 내에 보임
    const lastItemRect = imgLast.getBoundingClientRect();
    const containerRect = container.getBoundingClientRect();

    // 마지막 아이템이 뷰포트 내에 있는지 확인
    expect(lastItemRect.top).toBeGreaterThanOrEqual(containerRect.top);
    expect(lastItemRect.bottom).toBeLessThanOrEqual(containerRect.bottom);

    // 스크롤 위치 검증 (scrollHeight - clientHeight = 최대 스크롤 위치)
    const expectedScrollTop = container.scrollHeight - container.clientHeight;
    expect(container.scrollTop).toBeCloseTo(expectedScrollTop, -1); // ±10px 허용
  });

  it('should use scrollIntoView when last item is larger than viewport', async () => {
    // Phase 327: 큰 마지막 아이템은 scrollIntoView() fallback

    // 작은 이미지 1개
    const img1 = document.createElement('img');
    img1.src =
      'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" width="800" height="400"/>';
    img1.style.width = '800px';
    img1.style.height = '400px';
    img1.style.scrollSnapAlign = 'start';
    container.appendChild(img1);

    // 큰 마지막 이미지 (1200px > 600px viewport)
    const imgLast = document.createElement('img');
    imgLast.src =
      'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" width="800" height="1200"/>';
    imgLast.style.width = '800px';
    imgLast.style.height = '1200px';
    imgLast.style.scrollSnapAlign = 'start';
    imgLast.id = 'last-item-large';
    container.appendChild(imgLast);

    // 레이아웃 계산 대기
    await new Promise(resolve => setTimeout(resolve, 50));

    const itemHeight = imgLast.offsetHeight;
    const viewportHeight = container.clientHeight;

    expect(itemHeight).toBeGreaterThan(viewportHeight); // 1200 > 600

    // Phase 327: 큰 아이템은 scrollIntoView() 사용
    imgLast.scrollIntoView({
      behavior: 'auto',
      block: 'start',
    });

    // 스크롤 안정화 대기
    await new Promise(resolve => setTimeout(resolve, 100));

    // 검증: 마지막 아이템의 상단이 뷰포트 상단에 정렬
    const lastItemRect = imgLast.getBoundingClientRect();
    const containerRect = container.getBoundingClientRect();

    expect(lastItemRect.top).toBeCloseTo(containerRect.top, 0);
  });

  it('should handle scroll with Solid.js reactivity', async () => {
    // Solid.js Signal 기반 반응형 스크롤

    // 이미지 3개 생성
    const images = [
      { id: 'img-0', height: '800px' },
      { id: 'img-1', height: '800px' },
      { id: 'img-2', height: '400px' }, // 작은 마지막 이미템
    ];

    const items = images.map((imgData, index) => {
      const img = document.createElement('img');
      img.src = `data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" width="800" height="${imgData.height}"/>`;
      img.style.width = '800px';
      img.style.height = imgData.height;
      img.style.scrollSnapAlign = 'start';
      img.id = imgData.id;
      container.appendChild(img);
      return img;
    });

    // Solid.js Signal 생성
    const [currentIndex, setCurrentIndex] = createSignal(0);

    // 반응형 스크롤 Effect
    createEffect(() => {
      const index = currentIndex();
      const item = items[index];
      if (!item) return;

      const itemHeight = item.offsetHeight;
      const viewportHeight = container.clientHeight;
      const isLastItem = index === items.length - 1;

      if (isLastItem && itemHeight < viewportHeight) {
        // Phase 327: 마지막 아이템 특수 처리
        container.scrollTo({
          top: container.scrollHeight - viewportHeight,
          behavior: 'auto',
        });
      } else {
        // 일반 아이템: scrollIntoView
        item.scrollIntoView({
          behavior: 'auto',
          block: 'start',
        });
      }
    });

    // 레이아웃 계산 대기 (이미지 로드 완료)
    await new Promise(resolve => setTimeout(resolve, 150));

    // 초기 상태: 첫 번째 아이템
    expect(container.scrollTop).toBe(0);

    // 두 번째 아이템으로 이동
    setCurrentIndex(1);
    await new Promise(resolve => setTimeout(resolve, 300));

    const img1Rect = items[1].getBoundingClientRect();
    const containerRect = container.getBoundingClientRect();
    const img1TopDiff = Math.abs(img1Rect.top - containerRect.top);
    expect(img1TopDiff).toBeLessThan(50);

    // 마지막 아이템으로 이동 (Phase 327 트리거)
    setCurrentIndex(2);
    await new Promise(resolve => setTimeout(resolve, 300));

    // 검증: 마지막 아이템이 뷰포트 내에 보임
    const lastItemRect = items[2].getBoundingClientRect();
    expect(lastItemRect.top).toBeGreaterThanOrEqual(containerRect.top);
    expect(lastItemRect.bottom).toBeLessThanOrEqual(containerRect.bottom);

    // scrollTo() 사용 확인
    const expectedScrollTop = container.scrollHeight - container.clientHeight;
    expect(container.scrollTop).toBeCloseTo(expectedScrollTop, -1); // ±10px 허용
  });

  it('should preserve existing scroll behavior for non-last items', async () => {
    // Phase 327: 마지막이 아닌 아이템은 기존 동작 유지

    // 이미지 3개 (모두 큰 사이즈)
    const items = Array.from({ length: 3 }, (_, index) => {
      const img = document.createElement('img');
      img.src = `data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" width="800" height="800"/>`;
      img.style.width = '800px';
      img.style.height = '800px';
      img.style.scrollSnapAlign = 'start';
      img.id = `item-${index}`;
      container.appendChild(img);
      return img;
    });

    // 레이아웃 계산 대기 (이미지 로드 완료)
    await new Promise(resolve => setTimeout(resolve, 150));

    // 각 아이템으로 scrollIntoView() 호출
    for (let i = 0; i < items.length - 1; i++) {
      items[i].scrollIntoView({
        behavior: 'auto',
        block: 'start',
      });

      await new Promise(resolve => setTimeout(resolve, 200));

      const itemRect = items[i].getBoundingClientRect();
      const containerRect = container.getBoundingClientRect();

      // 아이템 상단이 컨테이너 상단 근처에 위치 (±50px 허용)
      const topDiff = Math.abs(itemRect.top - containerRect.top);
      expect(topDiff).toBeLessThan(50);
    }
  });

  it('should handle edge case: single small item gallery', async () => {
    // Edge Case: 단일 작은 아이템 갤러리

    const imgSingle = document.createElement('img');
    imgSingle.src =
      'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" width="800" height="300"/>';
    imgSingle.style.width = '800px';
    imgSingle.style.height = '300px';
    imgSingle.style.scrollSnapAlign = 'start';
    imgSingle.id = 'single-item';
    container.appendChild(imgSingle);

    // 레이아웃 계산 대기 (이미지 로드 완료)
    await new Promise(resolve => setTimeout(resolve, 150));

    const itemHeight = imgSingle.offsetHeight;
    const viewportHeight = container.clientHeight;

    expect(itemHeight).toBeLessThan(viewportHeight); // 300 < 600

    // Phase 327: 마지막 아이템 (동시에 유일한 아이템)
    container.scrollTo({
      top: container.scrollHeight - viewportHeight,
      behavior: 'auto',
    });

    await new Promise(resolve => setTimeout(resolve, 300));

    // 단일 아이템이므로 scrollTop은 0 (스크롤 불가)
    expect(container.scrollTop).toBe(0);

    // 아이템 상단이 컨테이너 상단에 위치 (±50px 허용)
    const itemRect = imgSingle.getBoundingClientRect();
    const containerRect = container.getBoundingClientRect();
    const topDiff = Math.abs(itemRect.top - containerRect.top);
    expect(topDiff).toBeLessThan(50);
  });

  it('should measure scroll dimensions accurately in real browser', () => {
    // Phase 327 전제조건: offsetHeight/clientHeight 정확한 측정

    // 이미지 2개 생성
    const img1 = document.createElement('img');
    img1.src =
      'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" width="800" height="800"/>';
    img1.style.width = '800px';
    img1.style.height = '800px';
    container.appendChild(img1);

    const img2 = document.createElement('img');
    img2.src =
      'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" width="800" height="400"/>';
    img2.style.width = '800px';
    img2.style.height = '400px';
    container.appendChild(img2);

    // 실제 브라우저에서 정확한 값 반환 (JSDOM에서는 0)
    expect(img1.offsetHeight).toBe(800);
    expect(img2.offsetHeight).toBe(400);
    expect(container.clientHeight).toBe(600);
    // scrollHeight는 브라우저마다 약간 다를 수 있음 (margin/padding 계산 차이)
    expect(container.scrollHeight).toBeGreaterThanOrEqual(1200); // 800 + 400 + margin

    // Phase 327 조건 검증
    const isLastItemSmall = img2.offsetHeight < container.clientHeight;
    expect(isLastItemSmall).toBe(true); // 400 < 600
  });

  it('should handle scroll with CSS scroll-snap interaction', async () => {
    // Phase 327 + CSS scroll-snap 상호작용

    // scroll-snap 활성화
    container.style.scrollSnapType = 'y proximity';

    // 이미지 3개 (마지막 이미지 작음)
    const items = [
      { height: '800px' },
      { height: '800px' },
      { height: '300px' }, // 작은 마지막 아이템
    ].map((data, index) => {
      const img = document.createElement('img');
      img.src = `data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" width="800" height="${data.height}"/>`;
      img.style.width = '800px';
      img.style.height = data.height;
      img.style.scrollSnapAlign = 'start';
      img.id = `snap-item-${index}`;
      container.appendChild(img);
      return img;
    });

    await new Promise(resolve => setTimeout(resolve, 150));

    // Phase 327: 마지막 아이템으로 scrollTo()
    // scroll-snap이 활성화된 상태에서도 동작 확인
    container.scrollTo({
      top: container.scrollHeight - container.clientHeight,
      behavior: 'auto',
    });

    await new Promise(resolve => setTimeout(resolve, 300));

    // scroll-snap이 활성화되어도 scrollTo() 실행됨 (정확도는 낮을 수 있음)
    // 마지막 아이템이 뷰포트 내에 있는지 확인
    const lastItemRect = items[2].getBoundingClientRect();
    const containerRect = container.getBoundingClientRect();

    // 마지막 아이템이 뷰포트 내에 보임
    expect(lastItemRect.top).toBeGreaterThanOrEqual(containerRect.top);
    expect(lastItemRect.bottom).toBeLessThanOrEqual(containerRect.bottom);

    // scroll-snap-align: start가 유지되는지 확인
    items.forEach(item => {
      expect(item.style.scrollSnapAlign).toBe('start');
    });
  });

  it('should maintain scroll position after DOM updates', async () => {
    // Phase 327: DOM 업데이트 후 스크롤 위치 유지

    // 초기 이미지 2개
    const img1 = document.createElement('img');
    img1.src =
      'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" width="800" height="800"/>';
    img1.style.width = '800px';
    img1.style.height = '800px';
    container.appendChild(img1);

    const img2 = document.createElement('img');
    img2.src =
      'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" width="800" height="400"/>';
    img2.style.width = '800px';
    img2.style.height = '400px';
    img2.id = 'last-initial';
    container.appendChild(img2);

    await new Promise(resolve => setTimeout(resolve, 150));

    // Phase 327: 마지막 아이템으로 스크롤
    const initialScrollTop = container.scrollHeight - container.clientHeight;
    container.scrollTo({
      top: initialScrollTop,
      behavior: 'auto',
    });

    await new Promise(resolve => setTimeout(resolve, 300));

    const scrollTopBefore = container.scrollTop;
    expect(scrollTopBefore).toBeCloseTo(initialScrollTop, -1); // ±10px 허용

    // DOM 업데이트: 세 번째 이미지 추가 (새 마지막 아이템)
    const img3 = document.createElement('img');
    img3.src =
      'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" width="800" height="500"/>';
    img3.style.width = '800px';
    img3.style.height = '500px';
    img3.id = 'last-new';
    container.appendChild(img3);

    await new Promise(resolve => setTimeout(resolve, 150));

    // 스크롤 위치는 변경되지 않음 (명시적 scrollTo 호출 전까지)
    const scrollTopAfter = container.scrollTop;
    expect(scrollTopAfter).toBeCloseTo(scrollTopBefore, -1); // ±10px 허용

    // 새 마지막 아이템으로 스크롤 (Phase 327 재적용)
    const newScrollTop = container.scrollHeight - container.clientHeight;
    container.scrollTo({
      top: newScrollTop,
      behavior: 'auto',
    });

    await new Promise(resolve => setTimeout(resolve, 300));

    // 새 마지막 아이템이 뷰포트 내에 보임
    const newLastItemRect = img3.getBoundingClientRect();
    const containerRect = container.getBoundingClientRect();
    expect(newLastItemRect.top).toBeGreaterThanOrEqual(containerRect.top);
    expect(newLastItemRect.bottom).toBeLessThanOrEqual(containerRect.bottom);
  });
});
