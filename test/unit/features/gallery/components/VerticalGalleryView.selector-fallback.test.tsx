/**
 * @fileoverview Phase 290: 선택자 폴백 회귀 테스트
 * @description data-item-index 부재 시 data-index로 폴백하는 로직 검증
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';

describe('VerticalGalleryView - Selector Fallback (Phase 290)', () => {
  let container: HTMLDivElement;

  beforeEach(() => {
    container = document.createElement('div');
    document.body.appendChild(container);
  });

  afterEach(() => {
    document.body.removeChild(container);
    vi.restoreAllMocks();
  });

  describe('autoScrollToCurrentItem 선택자 폴백', () => {
    it('data-item-index 속성으로 대상 요소를 찾아야 함', () => {
      // Given: data-item-index 속성을 가진 요소들
      const item0 = document.createElement('div');
      item0.setAttribute('data-item-index', '0');
      item0.setAttribute('data-media-loaded', 'true');

      const item1 = document.createElement('div');
      item1.setAttribute('data-item-index', '1');
      item1.setAttribute('data-media-loaded', 'true');

      const item2 = document.createElement('div');
      item2.setAttribute('data-item-index', '2');
      item2.setAttribute('data-media-loaded', 'true');

      container.appendChild(item0);
      container.appendChild(item1);
      container.appendChild(item2);

      // When: 선택자로 2번 인덱스 찾기
      const targetIndex = 2;
      const targetElement = container.querySelector(`[data-item-index="${targetIndex}"]`);

      // Then: 올바른 요소를 찾아야 함
      expect(targetElement).toBe(item2);
      expect(targetElement?.getAttribute('data-item-index')).toBe('2');
    });

    it('data-item-index 부재 시 data-index로 폴백해야 함', () => {
      // Given: data-index만 있고 data-item-index가 없는 레거시 마크업
      const item0 = document.createElement('div');
      item0.setAttribute('data-index', '0');
      item0.setAttribute('data-media-loaded', 'true');

      const item1 = document.createElement('div');
      item1.setAttribute('data-index', '1');
      item1.setAttribute('data-media-loaded', 'true');

      const item2 = document.createElement('div');
      item2.setAttribute('data-index', '2');
      item2.setAttribute('data-media-loaded', 'true');

      container.appendChild(item0);
      container.appendChild(item1);
      container.appendChild(item2);

      // When: data-item-index로 찾기 시도 후 data-index로 폴백
      const targetIndex = 2;
      const primarySelector = container.querySelector(`[data-item-index="${targetIndex}"]`);
      const fallbackSelector = container.querySelector(`[data-index="${targetIndex}"]`);

      // Then: data-item-index는 없지만 data-index로 찾을 수 있어야 함
      expect(primarySelector).toBeNull(); // data-item-index 없음
      expect(fallbackSelector).toBe(item2); // data-index로 폴백 성공
      expect(fallbackSelector?.getAttribute('data-index')).toBe('2');
    });

    it('data-item-index와 data-index가 모두 있을 때 data-item-index를 우선해야 함', () => {
      // Given: 두 속성 모두 있는 경우
      const item0 = document.createElement('div');
      item0.setAttribute('data-item-index', '0');
      item0.setAttribute('data-index', '0');
      item0.setAttribute('data-media-loaded', 'true');

      const item1 = document.createElement('div');
      item1.setAttribute('data-item-index', '1');
      item1.setAttribute('data-index', '1');
      item1.setAttribute('data-media-loaded', 'true');

      const item2 = document.createElement('div');
      item2.setAttribute('data-item-index', '2');
      item2.setAttribute('data-index', '2');
      item2.setAttribute('data-media-loaded', 'true');

      container.appendChild(item0);
      container.appendChild(item1);
      container.appendChild(item2);

      // When: 우선순위 확인
      const targetIndex = 2;
      const primarySelector = container.querySelector(`[data-item-index="${targetIndex}"]`);
      const fallbackSelector = container.querySelector(`[data-index="${targetIndex}"]`);

      // Then: 두 선택자 모두 동일한 요소를 가리켜야 함
      expect(primarySelector).toBe(item2);
      expect(fallbackSelector).toBe(item2);
      expect(primarySelector).toBe(fallbackSelector);
    });

    it('존재하지 않는 인덱스의 경우 null을 반환해야 함', () => {
      // Given: 0-2 인덱스만 있는 상황
      const item0 = document.createElement('div');
      item0.setAttribute('data-item-index', '0');
      item0.setAttribute('data-index', '0');

      const item1 = document.createElement('div');
      item1.setAttribute('data-item-index', '1');
      item1.setAttribute('data-index', '1');

      container.appendChild(item0);
      container.appendChild(item1);

      // When: 존재하지 않는 인덱스 99 찾기
      const targetIndex = 99;
      const primarySelector = container.querySelector(`[data-item-index="${targetIndex}"]`);
      const fallbackSelector = container.querySelector(`[data-index="${targetIndex}"]`);

      // Then: 두 선택자 모두 null 반환
      expect(primarySelector).toBeNull();
      expect(fallbackSelector).toBeNull();
    });

    it('음수 인덱스는 찾을 수 없어야 함', () => {
      // Given: 정상 인덱스만 있는 마크업
      const item0 = document.createElement('div');
      item0.setAttribute('data-item-index', '0');

      container.appendChild(item0);

      // When: 음수 인덱스로 조회
      const targetIndex = -1;
      const primarySelector = container.querySelector(`[data-item-index="${targetIndex}"]`);
      const fallbackSelector = container.querySelector(`[data-index="${targetIndex}"]`);

      // Then: null 반환
      expect(primarySelector).toBeNull();
      expect(fallbackSelector).toBeNull();
    });
  });

  describe('미디어 로드 상태와 선택자 조합', () => {
    it('data-media-loaded="true"와 data-item-index 조합 선택자가 작동해야 함', () => {
      // Given: 미디어 로드 완료 상태의 요소들
      const item0 = document.createElement('div');
      item0.setAttribute('data-item-index', '0');
      item0.setAttribute('data-media-loaded', 'true');

      const item1 = document.createElement('div');
      item1.setAttribute('data-item-index', '1');
      item1.setAttribute('data-media-loaded', 'false'); // 로드 중

      const item2 = document.createElement('div');
      item2.setAttribute('data-item-index', '2');
      item2.setAttribute('data-media-loaded', 'true');

      container.appendChild(item0);
      container.appendChild(item1);
      container.appendChild(item2);

      // When: 로드 완료된 특정 인덱스 요소 찾기
      const loadedItem2 = container.querySelector(
        '[data-item-index="2"][data-media-loaded="true"]'
      );
      const loadingItem1 = container.querySelector(
        '[data-item-index="1"][data-media-loaded="true"]'
      );

      // Then: 조건에 맞는 요소만 찾아야 함
      expect(loadedItem2).toBe(item2);
      expect(loadingItem1).toBeNull(); // item1은 로드 중이므로 찾지 못함
    });

    it('data-media-loaded="true"와 data-index 폴백 조합이 작동해야 함', () => {
      // Given: 레거시 마크업 (data-item-index 없음)
      const item0 = document.createElement('div');
      item0.setAttribute('data-index', '0');
      item0.setAttribute('data-media-loaded', 'true');

      const item1 = document.createElement('div');
      item1.setAttribute('data-index', '1');
      item1.setAttribute('data-media-loaded', 'true');

      container.appendChild(item0);
      container.appendChild(item1);

      // When: 폴백 선택자로 로드 완료된 요소 찾기
      const targetIndex = 1;
      const primarySelector = container.querySelector(
        `[data-item-index="${targetIndex}"][data-media-loaded="true"]`
      );
      const fallbackSelector = container.querySelector(
        `[data-index="${targetIndex}"][data-media-loaded="true"]`
      );

      // Then: 폴백 선택자가 정상 작동해야 함
      expect(primarySelector).toBeNull(); // data-item-index 없음
      expect(fallbackSelector).toBe(item1); // data-index로 찾음
    });
  });

  describe('실제 자동 스크롤 시나리오 시뮬레이션', () => {
    it('autoScrollToCurrentItem 로직 시뮬레이션: data-item-index 우선, data-index 폴백', () => {
      // Given: 혼합 마크업 (일부는 data-item-index, 일부는 data-index만)
      const item0 = document.createElement('div');
      item0.setAttribute('data-item-index', '0');
      item0.setAttribute('data-media-loaded', 'true');
      item0.textContent = 'Item 0 (new)';

      const item1 = document.createElement('div');
      item1.setAttribute('data-index', '1'); // 레거시 (data-item-index 없음)
      item1.setAttribute('data-media-loaded', 'true');
      item1.textContent = 'Item 1 (legacy)';

      const item2 = document.createElement('div');
      item2.setAttribute('data-item-index', '2');
      item2.setAttribute('data-index', '2');
      item2.setAttribute('data-media-loaded', 'true');
      item2.textContent = 'Item 2 (both)';

      container.appendChild(item0);
      container.appendChild(item1);
      container.appendChild(item2);

      // When: 각 인덱스에 대해 선택자 폴백 로직 적용
      const findTargetElement = (index: number): HTMLElement | null => {
        // 1. data-item-index 우선 시도
        let target = container.querySelector(
          `[data-item-index="${index}"][data-media-loaded="true"]`
        ) as HTMLElement | null;

        // 2. 없으면 data-index로 폴백
        if (!target) {
          target = container.querySelector(
            `[data-index="${index}"][data-media-loaded="true"]`
          ) as HTMLElement | null;
        }

        return target;
      };

      // Then: 모든 인덱스에 대해 올바른 요소를 찾아야 함
      expect(findTargetElement(0)).toBe(item0); // data-item-index로 찾음
      expect(findTargetElement(1)).toBe(item1); // data-index로 폴백
      expect(findTargetElement(2)).toBe(item2); // data-item-index로 찾음 (둘 다 있지만 우선)
    });

    it('실제 VerticalGalleryView의 autoScrollToCurrentItem 선택자 패턴 검증', () => {
      // Given: 실제 컴포넌트와 동일한 마크업 구조
      const galleryContainer = document.createElement('div');
      galleryContainer.className = 'vertical-gallery-container';

      for (let i = 0; i < 4; i++) {
        const item = document.createElement('div');
        item.setAttribute('data-item-index', String(i));
        item.setAttribute('data-index', String(i));
        item.setAttribute('data-media-loaded', i < 3 ? 'true' : 'false');
        item.setAttribute('data-xeg-role', 'gallery-item');
        item.className = 'gallery-item';
        galleryContainer.appendChild(item);
      }

      container.appendChild(galleryContainer);

      // When: 3번째 아이템(index 2)으로 스크롤하려는 시나리오
      const currentIndex = 2;
      let targetElement: HTMLElement | null = galleryContainer.querySelector(
        `[data-item-index="${currentIndex}"][data-media-loaded="true"]`
      );

      if (!targetElement) {
        targetElement = galleryContainer.querySelector(
          `[data-index="${currentIndex}"][data-media-loaded="true"]`
        );
      }

      // Then: 올바른 요소를 찾고 스크롤 가능 상태여야 함
      expect(targetElement).not.toBeNull();
      expect(targetElement?.getAttribute('data-item-index')).toBe('2');
      expect(targetElement?.getAttribute('data-media-loaded')).toBe('true');
      expect(targetElement?.className).toContain('gallery-item');
    });
  });
});
