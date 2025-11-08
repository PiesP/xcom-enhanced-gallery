/**
 * @file Render-Ready Detection Utility
 * @description Mechanism to wait until DOM elements are actually rendered
 *
 * Phase 145.2: MutationObserver-based accurate render detection
 * - Goal: Remove polling, improve performance (30-100ms)
 * - Use: Wait for specific element DOM readiness in async rendering environments
 */

import { logger } from '@shared/logging';
import { globalTimerManager } from './timer-management';

/**
 * Wait until gallery items are actually rendered
 *
 * @param container Gallery container element
 * @param targetIndex Index of item to wait for
 * @param timeout Maximum wait time (milliseconds)
 * @returns Whether rendering is complete
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
     * Check if target element exists in DOM
     * Validate items list container and specific indexed item
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

    // Phase 145.2: Immediate check (if already rendered)
    if (checkElement()) {
      logger.debug('Items already rendered (Phase 145.2)', { targetIndex });
      resolve(true);
      return;
    }

    // Phase 145.2: Monitor DOM changes with MutationObserver
    let isResolved = false;
    const observer = new MutationObserver(() => {
      if (!isResolved && checkElement()) {
        logger.debug('Item render detected (Phase 145.2)', { targetIndex });
        isResolved = true;
        observer.disconnect();
        globalTimerManager.clearTimeout(timeoutId);
        resolve(true);
      }
    });

    /**
     * MutationObserver configuration
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

    // Phase 145.2: Timeout safety mechanism
    const timeoutId = globalTimerManager.setTimeout(() => {
      if (!isResolved) {
        logger.warn('item rendering timeout (Phase 145.2)', {
          targetIndex,
          timeout,
        });
        isResolved = true;
        observer.disconnect();
        resolve(false); // return failure
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
      logger.warn('item container not found (Phase 145.2)');
      resolve(false);
      return;
    }

    // Immediate check
    if (itemsContainer.children.length >= minCount) {
      logger.debug('minimum items count satisfied (Phase 145.2)', {
        current: itemsContainer.children.length,
        required: minCount,
      });
      resolve(true);
      return;
    }

    // Watch with MutationObserver
    let isResolved = false;
    const observer = new MutationObserver(() => {
      if (!isResolved && itemsContainer.children.length >= minCount) {
        logger.debug('minimum items count reached (Phase 145.2)', {
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
      subtree: false, // watch direct children only
      attributes: false,
      characterData: false,
    });

    // Timeout
    const timeoutId = globalTimerManager.setTimeout(() => {
      if (!isResolved) {
        logger.warn('minimum items count timeout (Phase 145.2)', {
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
