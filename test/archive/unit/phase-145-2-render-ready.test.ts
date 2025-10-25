/**
 * @file Phase 145.2: MutationObserver 기반 렌더링 감지 테스트
 * @description render-ready.ts 유틸리티 검증
 *
 * Phase 145.2 특징:
 * - MutationObserver를 통한 정확한 DOM 변화 감시
 * - 폴링 제거로 CPU 사용 감소
 * - 30-100ms 성능 개선
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import {
  waitForItemsRendered,
  waitForMultipleItemsRendered,
  waitForMinimumItems,
} from '../../../../src/shared/utils/render-ready';

describe('Phase 145.2: render-ready 유틸리티', () => {
  let container: HTMLElement;
  let itemsContainer: HTMLElement;

  beforeEach(() => {
    // DOM 설정
    container = document.createElement('div');
    document.body.appendChild(container);

    itemsContainer = document.createElement('div');
    itemsContainer.setAttribute('data-xeg-role', 'items-list');
    container.appendChild(itemsContainer);
  });

  afterEach(() => {
    document.body.innerHTML = '';
    vi.clearAllMocks();
  });

  describe('waitForItemsRendered', () => {
    it('should resolve immediately if element already exists', async () => {
      // 아이템 미리 생성
      for (let i = 0; i < 3; i++) {
        const item = document.createElement('div');
        item.textContent = `Item ${i}`;
        itemsContainer.appendChild(item);
      }

      // Phase 145.2: 즉시 해결
      const startTime = Date.now();
      const result = await waitForItemsRendered(container, 1, 1000);
      const elapsedTime = Date.now() - startTime;

      expect(result).toBe(true);
      expect(elapsedTime).toBeLessThan(50); // 즉시 반환
    });

    it('should wait for element to be rendered', async () => {
      // Phase 145.2: MutationObserver 감지 테스트
      const resultPromise = waitForItemsRendered(container, 0, 1000);

      // 약간의 지연 후 요소 추가
      await new Promise(resolve => setTimeout(resolve, 50));

      const item = document.createElement('div');
      item.textContent = 'Item 0';
      itemsContainer.appendChild(item);

      const result = await resultPromise;
      expect(result).toBe(true);
    });

    it('should timeout if element is not rendered', async () => {
      // Phase 145.2: 타임아웃 처리
      const startTime = Date.now();
      const result = await waitForItemsRendered(container, 5, 100); // 100ms 타임아웃
      const elapsedTime = Date.now() - startTime;

      expect(result).toBe(false);
      expect(elapsedTime).toBeGreaterThanOrEqual(100);
      expect(elapsedTime).toBeLessThan(150); // 여유 있는 범위
    });

    it('should detect element when index becomes available', async () => {
      // 2개 아이템 생성
      for (let i = 0; i < 2; i++) {
        const item = document.createElement('div');
        item.textContent = `Item ${i}`;
        itemsContainer.appendChild(item);
      }

      // 3번째 아이템 대기
      const resultPromise = waitForItemsRendered(container, 2, 500);

      // 약간 지연 후 추가
      await new Promise(resolve => setTimeout(resolve, 50));
      const item = document.createElement('div');
      item.textContent = 'Item 2';
      itemsContainer.appendChild(item);

      const result = await resultPromise;
      expect(result).toBe(true);
    });
  });

  describe('waitForMultipleItemsRendered', () => {
    it('should wait for multiple items', async () => {
      // Phase 145.2: 배치 대기
      const resultPromise = waitForMultipleItemsRendered(container, [0, 1, 2], 500);

      // 모든 아이템 추가
      await new Promise(resolve => setTimeout(resolve, 50));
      for (let i = 0; i < 3; i++) {
        const item = document.createElement('div');
        item.textContent = `Item ${i}`;
        itemsContainer.appendChild(item);
      }

      const result = await resultPromise;
      expect(result).toBe(true);
    });

    it('should fail if any item is missing', async () => {
      // 처음 2개 아이템만 추가
      const resultPromise = waitForMultipleItemsRendered(
        container,
        [0, 1, 2], // 3개 필요
        100
      );

      await new Promise(resolve => setTimeout(resolve, 30));
      for (let i = 0; i < 2; i++) {
        const item = document.createElement('div');
        item.textContent = `Item ${i}`;
        itemsContainer.appendChild(item);
      }

      // 타임아웃 전에 3번째 아이템 추가 안 함
      const result = await resultPromise;
      expect(result).toBe(false); // 3번째 아이템 없어서 실패
    });
  });

  describe('waitForMinimumItems', () => {
    it('should resolve when minimum items count is reached', async () => {
      const resultPromise = waitForMinimumItems(container, 3, 500);

      // 순차적으로 아이템 추가
      for (let i = 0; i < 5; i++) {
        await new Promise(resolve => setTimeout(resolve, 30));
        const item = document.createElement('div');
        item.textContent = `Item ${i}`;
        itemsContainer.appendChild(item);
      }

      const result = await resultPromise;
      expect(result).toBe(true);
    });

    it('should resolve immediately if minimum already reached', async () => {
      // 미리 5개 아이템 생성
      for (let i = 0; i < 5; i++) {
        const item = document.createElement('div');
        item.textContent = `Item ${i}`;
        itemsContainer.appendChild(item);
      }

      // Phase 145.2: 즉시 해결
      const startTime = Date.now();
      const result = await waitForMinimumItems(container, 3);
      const elapsedTime = Date.now() - startTime;

      expect(result).toBe(true);
      expect(elapsedTime).toBeLessThan(50);
    });

    it('should timeout if items count is not reached', async () => {
      // 2개만 추가
      const resultPromise = waitForMinimumItems(container, 5, 100);

      for (let i = 0; i < 2; i++) {
        const item = document.createElement('div');
        item.textContent = `Item ${i}`;
        itemsContainer.appendChild(item);
      }

      const result = await resultPromise;
      expect(result).toBe(false);
    });
  });

  describe('Phase 145.2 성능 특성', () => {
    it('should have lower latency than polling', async () => {
      // MutationObserver는 변화 감지 후 즉시 실행
      // 폴링 (50ms 간격)보다 훨씬 빠름
      const startTime = Date.now();

      const resultPromise = waitForItemsRendered(container, 0, 200);

      // 즉시 아이템 추가 (0ms 지연)
      const item = document.createElement('div');
      item.textContent = 'Item 0';
      itemsContainer.appendChild(item);

      const result = await resultPromise;
      const elapsedTime = Date.now() - startTime;

      expect(result).toBe(true);
      // MutationObserver는 microsecond 단위로 반응
      // 테스트 환경에서도 10ms 이내
      expect(elapsedTime).toBeLessThan(20);
    });

    it('should not continuously poll when element exists', async () => {
      // MutationObserver는 일회성 감지
      // 폴링은 계속 반복됨
      const item = document.createElement('div');
      item.textContent = 'Item 0';
      itemsContainer.appendChild(item);

      const startTime = Date.now();
      const result = await waitForItemsRendered(container, 0, 1000);
      const elapsedTime = Date.now() - startTime;

      expect(result).toBe(true);
      // 즉시 반환 (폴링 대기 안 함)
      expect(elapsedTime).toBeLessThan(10);
    });
  });

  describe('Phase 145.2 통합 시나리오', () => {
    it('should work with dynamic rendering (slow network simulation)', async () => {
      // 네트워크 지연 시뮬레이션 (500ms)
      const renderPromise = (async () => {
        await new Promise(resolve => setTimeout(resolve, 200)); // 첫 배치
        for (let i = 0; i < 2; i++) {
          const item = document.createElement('div');
          item.textContent = `Item ${i}`;
          itemsContainer.appendChild(item);
        }

        await new Promise(resolve => setTimeout(resolve, 150)); // 두 번째 배치
        for (let i = 2; i < 5; i++) {
          const item = document.createElement('div');
          item.textContent = `Item ${i}`;
          itemsContainer.appendChild(item);
        }
      })();

      // Phase 145.1과 함께 사용: 재시도 + MutationObserver
      const scrollPromise = (async () => {
        // 1. 빠른 첫 시도
        const ready1 = await waitForItemsRendered(container, 0, 300);
        if (ready1) return true;

        // 2. 느린 두 번째 시도
        const ready2 = await waitForItemsRendered(container, 2, 300);
        return ready2;
      })();

      await renderPromise;
      const result = await scrollPromise;

      expect(result).toBe(true);
    });
  });
});
