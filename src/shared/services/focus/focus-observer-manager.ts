/**
 * Focus Observer Manager
 *
 * IntersectionObserver 기반 포커스 감지 및 재계산 담당
 * - Observer 생성/정리
 * - 엔트리 처리 및 캐시 동기화
 * - 가시 아이템 재계산 (점수 기반 후보 선정)
 */

import { logger } from '../../logging';
import type { ItemCache } from '../../state/focus';
import { isItemVisibleEnough, calculateCenterDistance } from '../../state/focus';

interface CandidateScore {
  index: number;
  centerDistance: number;
  intersectionRatio: number;
  time: number;
}

/**
 * 포커스 후보 점수 계산
 * 더 낮은 점수 = 뷰포트 중심에 더 가까움
 */
function calculateCandidateScore(
  entry: IntersectionObserverEntry,
  minimumVisibleRatio: number,
  index: number,
  time: number
): CandidateScore | null {
  if (!isItemVisibleEnough(entry, minimumVisibleRatio)) {
    return null;
  }

  const centerDistance = calculateCenterDistance(entry);
  const intersectionRatio = entry.intersectionRatio;

  return {
    index,
    centerDistance,
    intersectionRatio,
    time,
  };
}

// 향후 확장용: 최적 포커스 후보 선정 알고리즘
// (현재 useGalleryFocusTracker에서 별도로 구현됨)
// 필요시 이 로직을 여기로 이동 가능
//
// function selectBestCandidate(candidates: CandidateScore[]): number | null {
//   if (candidates.length === 0) {
//     return null;
//   }
//   return candidates.reduce((best, current) => {
//     if (current.intersectionRatio > best.intersectionRatio) {
//       return current;
//     }
//     if (current.intersectionRatio === best.intersectionRatio) {
//       if (current.centerDistance < best.centerDistance) {
//         return current;
//       }
//     }
//     return best;
//   }).index;
// }

/**
 * Focus Observer Manager
 *
 * IntersectionObserver 라이프사이클 및 엔트리 처리 관리
 */
export class FocusObserverManager {
  private observer: IntersectionObserver | null = null;
  private lastUpdateTime: number = 0;

  /**
   * 옵저버 설정
   * @param container 관찰 대상 컨테이너
   * @param itemCache 아이템 캐시
   * @param onEntries 엔트리 처리 콜백
   * @param threshold 교차 임계값
   * @param rootMargin 관찰 범위
   */
  setupObserver(
    container: HTMLElement,
    itemCache: ItemCache,
    onEntries: (candidates: CandidateScore[]) => void,
    threshold: number | number[] = [0.25, 0.5, 0.75],
    rootMargin: string = '0px'
  ): void {
    this.cleanupObserver();

    this.observer = new IntersectionObserver(
      entries => {
        this.handleEntries(entries, itemCache, onEntries);
      },
      {
        root: null,
        rootMargin,
        threshold,
      }
    );

    // 컨테이너 내 모든 아이템 관찰 시작
    const items = container.querySelectorAll('[data-index]');
    items.forEach(item => {
      if (item instanceof HTMLElement) {
        this.observer?.observe(item);
      }
    });

    logger.debug('FocusObserverManager: observer setup', {
      itemCount: items.length,
      threshold,
      rootMargin,
    });
  }

  /**
   * 엔트리 처리 및 재계산
   */
  private handleEntries(
    entries: IntersectionObserverEntry[],
    itemCache: ItemCache,
    onEntries: (candidates: CandidateScore[]) => void
  ): void {
    const now = Date.now();
    const candidates: CandidateScore[] = [];

    entries.forEach(entry => {
      const element = entry.target as HTMLElement;
      const indexStr = element.getAttribute('data-index');
      const index = indexStr ? parseInt(indexStr, 10) : -1;

      if (index < 0) {
        return;
      }

      // 캐시 동기화
      itemCache.setEntry(element, entry);

      // 후보 점수 계산
      const score = calculateCandidateScore(entry, 0.05, index, now);
      if (score) {
        candidates.push(score);
      }
    });

    this.lastUpdateTime = now;
    onEntries(candidates);
  }

  /**
   * 새 아이템 관찰 시작
   */
  observeItem(element: HTMLElement): void {
    this.observer?.observe(element);
  }

  /**
   * 아이템 관찰 중지
   */
  unobserveItem(element: HTMLElement): void {
    this.observer?.unobserve(element);
  }

  /**
   * 옵저버 정리
   */
  cleanupObserver(): void {
    if (this.observer) {
      this.observer.disconnect();
      this.observer = null;
    }
  }

  /**
   * 최후 업데이트 시간
   */
  getLastUpdateTime(): number {
    return this.lastUpdateTime;
  }

  /**
   * 디버그 정보
   */
  getDebugInfo(): {
    isActive: boolean;
    lastUpdateTime: number;
  } {
    return {
      isActive: this.observer !== null,
      lastUpdateTime: this.lastUpdateTime,
    };
  }
}

/**
 * Focus Observer Manager 팩토리
 */
export function createFocusObserverManager(): FocusObserverManager {
  return new FocusObserverManager();
}
