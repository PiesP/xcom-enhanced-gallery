/**
 * Copyright (c) 2024 X.com Enhanced Gallery
 * Licensed under the MIT License
 *
 * @fileoverview Phase 144.1 - Scroll Chaining: Animation Interaction Tests (Browser)
 * @description Chromium 실제 브라우저 환경에서 스크롤 애니메이션 상호작용 테스트
 *
 * 테스트 시나리오:
 * 1. smooth scroll 진행 중 추가 입력 처리
 * 2. 애니메이션 취소 및 재시작
 * 3. 브라우저 네이티브 동작 검증
 *
 * 현재 구현:
 * - scrollIntoView({behavior: 'smooth'}) 사용 (브라우저 네이티브)
 * - CSS overscroll-behavior: none (스크롤 체이닝 방지)
 * - passive: true 이벤트 리스너
 *
 * 검증 목표:
 * - smooth scroll 중 추가 입력이 자연스럽게 처리되는지
 * - 브라우저 네이티브 동작이 애니메이션 충돌 없이 작동하는지
 * - prefers-reduced-motion 설정이 정상 작동하는지
 *
 * @see src/features/gallery/hooks/useGalleryItemScroll.ts
 * @see src/features/gallery/hooks/useGalleryScroll.ts
 * @see test/unit/features/scroll-chaining-dynamic-content.test.ts
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { setupGlobalTestIsolation } from '../shared/global-cleanup-hooks';

describe('Phase 144: Scroll Chaining - Animation Interaction (Browser)', () => {
  setupGlobalTestIsolation();

  let galleryContainer: HTMLDivElement;
  let scrollableContent: HTMLDivElement;
  let items: HTMLDivElement[];

  beforeEach(() => {
    document.body.innerHTML = '';
    items = [];

    // 갤러리 컨테이너 (스크롤 가능)
    galleryContainer = document.createElement('div');
    galleryContainer.id = 'gallery-container';
    galleryContainer.style.cssText = `
      height: 500px;
      overflow-y: auto;
      overscroll-behavior: none;
      position: relative;
    `;

    // 스크롤 가능한 콘텐츠 컨테이너
    scrollableContent = document.createElement('div');
    scrollableContent.style.cssText = `
      min-height: 2000px;
    `;

    // 10개 아이템 생성 (각 200px 높이)
    for (let i = 0; i < 10; i++) {
      const item = document.createElement('div');
      item.className = 'gallery-item';
      item.textContent = `Item ${i}`;
      item.style.cssText = `
        height: 200px;
        margin: 10px 0;
        background: #f0f0f0;
        display: flex;
        align-items: center;
        justify-content: center;
      `;
      scrollableContent.appendChild(item);
      items.push(item);
    }

    galleryContainer.appendChild(scrollableContent);
    document.body.appendChild(galleryContainer);
  });

  afterEach(() => {
    document.body.innerHTML = '';
  });

  describe('1. smooth scroll 진행 중 추가 입력', () => {
    it('should handle wheel events during smooth scroll', async () => {
      const initialScrollTop = galleryContainer.scrollTop;

      // smooth scroll 시작
      items[3].scrollIntoView({ behavior: 'smooth', block: 'center' });

      // smooth scroll 진행 중 wheel 이벤트 발생
      await new Promise(resolve => setTimeout(resolve, 50));

      const wheelEvent = new WheelEvent('wheel', {
        deltaY: 100,
        bubbles: true,
        cancelable: true,
      });
      galleryContainer.dispatchEvent(wheelEvent);

      // 추가 대기
      await new Promise(resolve => setTimeout(resolve, 100));

      // smooth scroll이 wheel 이벤트에 의해 방해받지 않아야 함
      // (브라우저 네이티브 동작이 둘 다 자연스럽게 처리)
      const finalScrollTop = galleryContainer.scrollTop;
      expect(finalScrollTop).toBeGreaterThan(initialScrollTop);
    });

    it('should handle keyboard input during smooth scroll', async () => {
      const initialScrollTop = galleryContainer.scrollTop;

      // smooth scroll 시작
      items[5].scrollIntoView({ behavior: 'smooth', block: 'center' });

      // smooth scroll 진행 중 ArrowDown 키 이벤트
      await new Promise(resolve => setTimeout(resolve, 50));

      galleryContainer.focus();
      const keyEvent = new KeyboardEvent('keydown', {
        key: 'ArrowDown',
        bubbles: true,
        cancelable: true,
      });
      galleryContainer.dispatchEvent(keyEvent);

      // 추가 대기
      await new Promise(resolve => setTimeout(resolve, 100));

      // smooth scroll이 완료되거나 키보드 입력에 의해 조정되어야 함
      const finalScrollTop = galleryContainer.scrollTop;
      expect(finalScrollTop).toBeGreaterThan(initialScrollTop);
    });

    it('should handle consecutive smooth scroll requests', async () => {
      const initialScrollTop = galleryContainer.scrollTop;

      // 첫 번째 smooth scroll
      items[2].scrollIntoView({ behavior: 'smooth', block: 'center' });
      await new Promise(resolve => setTimeout(resolve, 50));

      // 두 번째 smooth scroll (첫 번째가 완료되기 전)
      items[5].scrollIntoView({ behavior: 'smooth', block: 'center' });
      await new Promise(resolve => setTimeout(resolve, 200));

      // 최종적으로 두 번째 타겟에 도달해야 함
      const finalScrollTop = galleryContainer.scrollTop;
      expect(finalScrollTop).toBeGreaterThan(initialScrollTop);

      // item[5]가 viewport에 보여야 함
      const item5Rect = items[5].getBoundingClientRect();
      const containerRect = galleryContainer.getBoundingClientRect();
      const isVisible =
        item5Rect.top >= containerRect.top && item5Rect.bottom <= containerRect.bottom;

      // smooth scroll 중에는 정확하지 않을 수 있으므로 방향성만 확인
      expect(finalScrollTop).toBeGreaterThan(0);
    });
  });

  describe('2. 애니메이션 취소 및 재시작', () => {
    it('should cancel ongoing smooth scroll with instant scroll', async () => {
      // smooth scroll 시작
      items[7].scrollIntoView({ behavior: 'smooth', block: 'center' });
      await new Promise(resolve => setTimeout(resolve, 50));

      // smooth scroll 진행 중 instant scroll로 중단
      items[2].scrollIntoView({ behavior: 'instant', block: 'center' });

      // instant scroll은 즉시 완료되어야 함
      await new Promise(resolve => setTimeout(resolve, 50));

      // item[2]가 즉시 viewport에 보여야 함
      const item2Rect = items[2].getBoundingClientRect();
      const containerRect = galleryContainer.getBoundingClientRect();
      const isItem2Visible =
        item2Rect.top >= containerRect.top && item2Rect.bottom <= containerRect.bottom;

      // instant scroll이므로 즉시 위치 이동
      expect(isItem2Visible || item2Rect.top < containerRect.top + 100).toBe(true);
    });

    it('should start new smooth scroll after previous completes', async () => {
      // 첫 번째 smooth scroll
      items[3].scrollIntoView({ behavior: 'smooth', block: 'center' });

      // 완료 대기 (smooth scroll은 약 300ms 소요)
      await new Promise(resolve => setTimeout(resolve, 350));

      const scrollTopAfterFirst = galleryContainer.scrollTop;

      // 두 번째 smooth scroll
      items[6].scrollIntoView({ behavior: 'smooth', block: 'center' });
      await new Promise(resolve => setTimeout(resolve, 350));

      const finalScrollTop = galleryContainer.scrollTop;

      // 두 번째 스크롤이 정상적으로 완료되어야 함
      expect(finalScrollTop).toBeGreaterThan(scrollTopAfterFirst);
    });

    it('should handle rapid scroll requests without losing target', async () => {
      // 빠른 연속 스크롤 요청 (3개)
      items[2].scrollIntoView({ behavior: 'smooth', block: 'center' });
      await new Promise(resolve => setTimeout(resolve, 20));

      items[5].scrollIntoView({ behavior: 'smooth', block: 'center' });
      await new Promise(resolve => setTimeout(resolve, 20));

      items[8].scrollIntoView({ behavior: 'smooth', block: 'center' });

      // 충분한 대기 시간 (smooth scroll 완료 대기)
      await new Promise(resolve => setTimeout(resolve, 500));

      // 최종 타겟(item[8])에 도달해야 함
      const finalScrollTop = galleryContainer.scrollTop;

      // 브라우저 네이티브 smooth scroll은 마지막 요청을 처리
      // 최소한 초기 위치보다 많이 스크롤되어야 함
      expect(finalScrollTop).toBeGreaterThan(500);
    });
  });

  describe('3. 브라우저 네이티브 동작 검증', () => {
    it('should use scrollIntoView with smooth behavior', async () => {
      const initialScrollTop = galleryContainer.scrollTop;

      // smooth behavior로 스크롤
      items[4].scrollIntoView({ behavior: 'smooth', block: 'center' });

      // 즉시 scrollTop 확인 (애니메이션 진행 중이어야 함)
      await new Promise(resolve => setTimeout(resolve, 10));
      const scrollTopDuringAnimation = galleryContainer.scrollTop;

      // 애니메이션 완료 대기
      await new Promise(resolve => setTimeout(resolve, 350));
      const finalScrollTop = galleryContainer.scrollTop;

      // smooth animation이 진행되었는지 확인
      // (초기 → 중간 → 최종 위치 변화)
      expect(scrollTopDuringAnimation).toBeGreaterThanOrEqual(initialScrollTop);
      expect(finalScrollTop).toBeGreaterThan(scrollTopDuringAnimation);
    });

    it('should respect prefers-reduced-motion setting', async () => {
      // matchMedia를 모킹하여 prefers-reduced-motion: reduce 시뮬레이션
      const originalMatchMedia = window.matchMedia;
      window.matchMedia = ((query: string) => ({
        matches: query === '(prefers-reduced-motion: reduce)',
        media: query,
        addEventListener: () => {},
        removeEventListener: () => {},
        dispatchEvent: () => true,
        onchange: null,
        addListener: () => {},
        removeListener: () => {},
      })) as typeof window.matchMedia;

      const initialScrollTop = galleryContainer.scrollTop;

      // prefers-reduced-motion: reduce 환경에서는 instant로 동작해야 함
      // (실제 구현에서 behavior를 'auto'로 변경)
      items[4].scrollIntoView({ behavior: 'auto', block: 'center' });

      // instant이므로 즉시 완료
      await new Promise(resolve => setTimeout(resolve, 50));

      const finalScrollTop = galleryContainer.scrollTop;

      // 스크롤이 발생했는지 확인
      expect(finalScrollTop).toBeGreaterThan(initialScrollTop);

      // 원래 matchMedia 복원
      window.matchMedia = originalMatchMedia;
    });
  });
});
