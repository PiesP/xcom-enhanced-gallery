/**
 * Item Positioning Service
 *
 * 갤러리 아이템으로의 스크롤 위치 계산 및 실행
 * - 타겟 요소 선택
 * - scrollIntoView 옵션 결정
 * - 오프셋 적용
 * - 에러 처리 및 재시도 로직
 */

import { logger } from '../../logging';
import { globalTimerManager } from '../../../shared/utils/timer-management';

export interface ScrollOptions {
  behavior: ScrollBehavior;
  block: ScrollLogicalPosition;
  alignToCenter: boolean;
  offset: number;
}

/**
 * Item Positioning Service
 * 스크롤 위치 계산과 실행을 담당
 */
export class ItemPositioningService {
  private retryCount = 0;
  private readonly maxRetries = 3;
  private pollingAttempts = 0;
  private readonly maxPollingAttempts = 20;

  /**
   * 특정 인덱스의 아이템으로 스크롤
   */
  async scrollToItem(
    container: HTMLElement | null,
    itemIndex: number,
    totalItems: number,
    options: ScrollOptions
  ): Promise<void> {
    // 입력 검증
    if (!container || itemIndex < 0 || itemIndex >= totalItems) {
      logger.debug('ItemPositioningService: 스크롤 조건 불충족', {
        hasContainer: !!container,
        itemIndex,
        totalItems,
      });
      return;
    }

    try {
      const targetElement = this.findTargetElement(container, itemIndex, totalItems);

      if (!targetElement) {
        logger.warn('ItemPositioningService: 타겟 요소를 찾을 수 없음', {
          itemIndex,
          totalItems,
        });
        return;
      }

      // 스크롤 실행
      this.executeScroll(container, targetElement, options);

      // smooth 동작의 경우 완료 대기
      if (options.behavior === 'smooth') {
        await new Promise<void>(resolve => {
          globalTimerManager.setTimeout(resolve, 300);
        });
      }

      this.retryCount = 0;

      logger.debug('ItemPositioningService: 스크롤 완료', {
        itemIndex,
        behavior: options.behavior,
        block: options.alignToCenter ? 'center' : options.block,
        offset: options.offset,
      });
    } catch (error) {
      logger.error('ItemPositioningService: 스크롤 실패', { itemIndex, error });

      // 재시도 로직 (exponential backoff)
      if (this.retryCount < this.maxRetries) {
        this.retryCount += 1;
        const delayMs = 50 * this.retryCount;

        logger.debug('ItemPositioningService: 재시도 스케줄', {
          itemIndex,
          retryCount: this.retryCount,
          delayMs,
        });

        await new Promise<void>(resolve => {
          globalTimerManager.setTimeout(() => {
            void this.scrollToItem(container, itemIndex, totalItems, options).then(resolve);
          }, delayMs);
        });
        return;
      }

      // 폴링 폴백: 느린 네트워크에서 요소 렌더링 대기
      await this.pollForElementAndScroll(container, itemIndex, totalItems, options);
    }
  }

  /**
   * 타겟 요소 찾기
   */
  private findTargetElement(
    container: HTMLElement,
    itemIndex: number,
    totalItems: number
  ): HTMLElement | null {
    // 아이템 컨테이너 선택자: data-xeg-role 속성
    const itemsRoot = container.querySelector(
      '[data-xeg-role="items-list"], [data-xeg-role="items-container"]'
    ) as HTMLElement | null;

    if (!itemsRoot) {
      logger.warn('ItemPositioningService: 아이템 컨테이너를 찾을 수 없음');
      return null;
    }

    const targetElement = itemsRoot.children[itemIndex] as HTMLElement | undefined;

    if (!targetElement) {
      logger.warn('ItemPositioningService: 타겟 인덱스의 요소 없음', {
        itemIndex,
        totalItems,
        containerChildCount: itemsRoot.children.length,
      });
      return null;
    }

    return targetElement;
  }

  /**
   * 실제 스크롤 실행
   */
  private executeScroll(
    container: HTMLElement,
    targetElement: HTMLElement,
    options: ScrollOptions
  ): void {
    const { behavior, block, alignToCenter, offset } = options;

    // scrollIntoView 실행
    targetElement.scrollIntoView({
      behavior,
      block: alignToCenter ? 'center' : block,
      inline: 'nearest',
    });

    // 오프셋 적용
    if (offset !== 0) {
      container.scrollTo({
        top: container.scrollTop - offset,
        behavior,
      });
    }
  }

  /**
   * 폴링으로 요소를 찾을 때까지 대기 후 스크롤
   */
  private async pollForElementAndScroll(
    container: HTMLElement | null,
    itemIndex: number,
    totalItems: number,
    options: ScrollOptions
  ): Promise<void> {
    logger.warn('ItemPositioningService: 폴링 폴백 시작', { itemIndex });

    return new Promise<void>(resolve => {
      const poll = () => {
        this.pollingAttempts += 1;

        // 타임아웃 초과
        if (this.pollingAttempts >= this.maxPollingAttempts) {
          logger.warn('ItemPositioningService: 폴링 타임아웃', {
            itemIndex,
            pollingAttempts: this.pollingAttempts,
          });
          this.pollingAttempts = 0;
          resolve();
          return;
        }

        // 컨테이너 확인
        if (!container) {
          globalTimerManager.setTimeout(poll, 50);
          return;
        }

        // 타겟 요소 찾기
        const targetElement = this.findTargetElement(container, itemIndex, totalItems);

        if (targetElement) {
          logger.debug('ItemPositioningService: 폴링으로 요소 발견', {
            itemIndex,
            pollingAttempts: this.pollingAttempts,
          });

          try {
            this.executeScroll(container, targetElement, options);
            this.pollingAttempts = 0;
            resolve();
          } catch (err) {
            logger.error('ItemPositioningService: 폴링 후 스크롤 실패', { itemIndex, error: err });
            this.pollingAttempts = 0;
            resolve();
          }
          return;
        }

        // 요소 아직 없음, 계속 폴링
        globalTimerManager.setTimeout(poll, 50);
      };

      poll();
    });
  }

  /**
   * 서비스 초기화
   */
  reset(): void {
    this.retryCount = 0;
    this.pollingAttempts = 0;
  }
}

/**
 * ItemPositioningService 팩토리
 */
export function createItemPositioningService(): ItemPositioningService {
  return new ItemPositioningService();
}
