/**
 * @file Render-Ready 감지 유틸리티
 * @description DOM 요소가 실제로 렌더링될 때까지 대기하는 메커니즘
 *
 * Phase 145.2: MutationObserver 기반 정확한 렌더링 감지
 * - 목표: 폴링 제거, 성능 개선 (30-100ms)
 * - 용도: 비동기 렌더링 환경에서 특정 요소의 DOM 준비 대기
 */

import { logger } from '@shared/logging';
import { globalTimerManager } from './timer-management';

/**
 * 갤러리 아이템이 실제로 렌더링될 때까지 대기
 *
 * @param container 갤러리 컨테이너 요소
 * @param targetIndex 대기할 아이템 인덱스
 * @param timeout 최대 대기 시간 (밀리초)
 * @returns 렌더링 완료 여부
 *
 * @example
 * const isReady = await waitForItemsRendered(galleryContainer, 3, 1000);
 * if (isReady) {
 *   await scrollToItem(3);
 * }
 */
export async function waitForItemsRendered(
  container: HTMLElement,
  targetIndex: number,
  timeout: number = 1000
): Promise<boolean> {
  return new Promise(resolve => {
    /**
     * 목표 요소가 DOM에 존재하는지 확인
     * 아이템 리스트 컨테이너와 특정 인덱스의 아이템 검증
     */
    const checkElement = (): boolean => {
      const itemsContainer = container.querySelector(
        '[data-xeg-role="items-list"], [data-xeg-role="items-container"]'
      ) as HTMLElement | null;

      if (!itemsContainer) {
        return false;
      }

      const targetElement = itemsContainer.children[targetIndex];
      return targetElement !== undefined;
    };

    // Phase 145.2: 즉시 체크 (이미 렌더링되었을 경우)
    if (checkElement()) {
      logger.debug('아이템이 이미 렌더링됨 (Phase 145.2)', { targetIndex });
      resolve(true);
      return;
    }

    // Phase 145.2: MutationObserver로 DOM 변화 감시
    let isResolved = false;
    const observer = new MutationObserver(() => {
      if (!isResolved && checkElement()) {
        logger.debug('아이템 렌더링 감지 (Phase 145.2)', { targetIndex });
        isResolved = true;
        observer.disconnect();
        globalTimerManager.clearTimeout(timeoutId);
        resolve(true);
      }
    });

    /**
     * MutationObserver 설정
     * - childList: 자식 요소 추가/제거 감시
     * - subtree: 모든 하위 요소 감시
     * - attributes: 속성 변경은 감시하지 않음 (성능)
     * - characterData: 텍스트 변경은 감시하지 않음 (성능)
     */
    observer.observe(container, {
      childList: true,
      subtree: true,
      attributes: false,
      characterData: false,
    });

    // Phase 145.2: 타임아웃 안전장치
    const timeoutId = globalTimerManager.setTimeout(() => {
      if (!isResolved) {
        logger.warn('아이템 렌더링 타임아웃 (Phase 145.2)', {
          targetIndex,
          timeout,
        });
        isResolved = true;
        observer.disconnect();
        resolve(false); // 실패 반환
      }
    }, timeout);
  });
}

/**
 * 여러 아이템이 렌더링될 때까지 대기 (배치)
 *
 * @param container 갤러리 컨테이너
 * @param targetIndices 대기할 아이템 인덱스 배열
 * @param timeout 최대 대기 시간
 * @returns 모든 아이템 렌더링 완료 여부
 *
 * @example
 * const allReady = await waitForMultipleItemsRendered(container, [0, 1, 2]);
 */
export async function waitForMultipleItemsRendered(
  container: HTMLElement,
  targetIndices: number[],
  timeout: number = 1000
): Promise<boolean> {
  const promises = targetIndices.map(idx => waitForItemsRendered(container, idx, timeout));
  const results = await Promise.all(promises);
  return results.every(result => result);
}

/**
 * 컨테이너에 최소 개수의 자식이 생길 때까지 대기
 * (특정 인덱스가 아닌 전체 개수 기반)
 *
 * @param container 감시할 컨테이너
 * @param minCount 최소 자식 개수
 * @param timeout 최대 대기 시간
 * @returns 최소 개수 도달 여부
 *
 * @example
 * const has5Items = await waitForMinimumItems(container, 5);
 */
export async function waitForMinimumItems(
  container: HTMLElement,
  minCount: number,
  timeout: number = 1000
): Promise<boolean> {
  return new Promise(resolve => {
    const itemsContainer = container.querySelector(
      '[data-xeg-role="items-list"], [data-xeg-role="items-container"]'
    ) as HTMLElement | null;

    if (!itemsContainer) {
      logger.warn('아이템 컨테이너를 찾을 수 없음 (Phase 145.2)');
      resolve(false);
      return;
    }

    // 즉시 체크
    if (itemsContainer.children.length >= minCount) {
      logger.debug('최소 아이템 개수 충족 (Phase 145.2)', {
        current: itemsContainer.children.length,
        required: minCount,
      });
      resolve(true);
      return;
    }

    // MutationObserver로 감시
    let isResolved = false;
    const observer = new MutationObserver(() => {
      if (!isResolved && itemsContainer.children.length >= minCount) {
        logger.debug('최소 아이템 개수 도달 (Phase 145.2)', {
          count: itemsContainer.children.length,
        });
        isResolved = true;
        observer.disconnect();
        globalTimerManager.clearTimeout(timeoutId);
        resolve(true);
      }
    });

    observer.observe(itemsContainer, {
      childList: true,
      subtree: false, // 직접 자식만 감시
      attributes: false,
      characterData: false,
    });

    // 타임아웃
    const timeoutId = globalTimerManager.setTimeout(() => {
      if (!isResolved) {
        logger.warn('최소 아이템 개수 대기 타임아웃 (Phase 145.2)', {
          required: minCount,
          timeout,
        });
        isResolved = true;
        observer.disconnect();
        resolve(false);
      }
    }, timeout);
  });
}
