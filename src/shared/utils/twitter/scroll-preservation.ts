/**
 * Phase 294: Twitter 네비게이션 스크롤 위치 보존 유틸리티
 * @fileoverview Twitter의 스크롤 복원 메커니즘과 호환되는 스크롤 위치 저장/복원
 * @description 갤러리 열기/닫기 시 Twitter 타임라인의 스크롤 위치를 보존하여
 *              네비게이션 시 원래 위치로 돌아갈 수 있도록 지원
 */

import { logger } from '../../logging';
import { findTwitterScrollContainer } from '../core-utils';
import { globalTimerManager } from '../timer-management';

// Phase 302: selector 하드닝 — data-testid 고정값 대신 공용 유틸의 폴백 로직 사용

/**
 * Twitter 스크롤 위치 보존 관리자
 *
 * @example
 * ```typescript
 * const preservation = new TwitterScrollPreservation();
 *
 * // 갤러리 열기 전
 * preservation.savePosition();
 *
 * // 갤러리 닫은 후
 * preservation.restore();
 * ```
 */
export class TwitterScrollPreservation {
  private savedPosition: number | null = null;
  private savedTimestamp: number = 0;
  private savedContainerRef: WeakRef<HTMLElement> | null = null;

  /**
   * 현재 Twitter 스크롤 위치 저장
   * @returns 저장 성공 여부
   */
  public savePosition(): boolean {
    try {
      const twitterScroll = findTwitterScrollContainer();

      if (!twitterScroll) {
        logger.debug('TwitterScrollPreservation: Twitter 스크롤 컨테이너 없음');
        return false;
      }

      this.savedPosition = twitterScroll.scrollTop;
      this.savedTimestamp = Date.now();
      this.savedContainerRef = new WeakRef(twitterScroll);

      logger.debug('TwitterScrollPreservation: 스크롤 위치 저장', {
        position: this.savedPosition,
        timestamp: this.savedTimestamp,
      });

      return true;
    } catch (error) {
      logger.error('TwitterScrollPreservation: 저장 실패', error);
      return false;
    }
  }

  /**
   * 저장된 스크롤 위치로 복원
   * Phase 300.1: Twitter 네이티브 복원과의 경합 방지 개선
   *
   * Twitter의 자체 복원 로직이 완료된 후 실행되도록 충분한 지연을 추가합니다.
   * - setTimeout(150ms): Twitter SPA 복원 로직 완료 대기
   * - requestAnimationFrame: 브라우저 렌더링 사이클 동기화
   *
   * @param threshold - 복원을 트리거하는 최소 위치 차이 (기본값: 100px)
   * @param delay - Twitter 복원 완료 대기 시간 (기본값: 150ms)
   * @returns 복원 실행 여부
   */
  public restore(threshold: number = 100, delay: number = 150): Promise<boolean> {
    return new Promise(resolve => {
      if (this.savedPosition === null) {
        logger.debug('TwitterScrollPreservation: 저장된 위치 없음');
        resolve(false);
        return;
      }

      // Phase 300.1: Twitter SPA 복원 로직 완료 대기
      // Twitter의 scrollRestoration은 페이지 로드 후 100-200ms 내에 실행됨
      globalTimerManager.setTimeout(() => {
        // 추가 프레임 대기로 Twitter 복원과의 경합 최소화
        requestAnimationFrame(() => {
          try {
            const twitterScroll = findTwitterScrollContainer();

            if (!twitterScroll) {
              logger.debug('TwitterScrollPreservation: Twitter 스크롤 컨테이너 없음 (복원 시)');
              this.clear();
              resolve(false);
              return;
            }

            const savedContainer = this.savedContainerRef?.deref() ?? null;
            if (!savedContainer || savedContainer !== twitterScroll) {
              logger.debug('TwitterScrollPreservation: 컨테이너가 변경되어 복원 스킵', {
                hasSaved: Boolean(savedContainer),
                savedDetached: savedContainer ? !savedContainer.isConnected : true,
              });
              this.clear();
              resolve(false);
              return;
            }

            const currentPosition = twitterScroll.scrollTop;
            const difference = Math.abs(currentPosition - this.savedPosition!);

            // 위치가 크게 달라졌을 때만 보정 (>= 기본값 100px)
            if (difference >= threshold) {
              twitterScroll.scrollTo({
                top: this.savedPosition!,
                behavior: 'auto', // 즉시 이동 (smooth는 UX 혼란 유발)
              });

              logger.debug('TwitterScrollPreservation: 스크롤 위치 복원', {
                from: currentPosition,
                to: this.savedPosition,
                difference,
                elapsed: Date.now() - this.savedTimestamp,
                delay,
              });

              this.clear();
              resolve(true);
            } else {
              logger.debug('TwitterScrollPreservation: 위치 차이 작아 복원 스킵', {
                current: currentPosition,
                saved: this.savedPosition,
                difference,
                threshold,
              });

              this.clear();
              resolve(false);
            }
          } catch (error) {
            logger.error('TwitterScrollPreservation: 복원 실패', error);
            this.clear();
            resolve(false);
          }
        });
      }, delay);
    });
  }

  /**
   * 저장된 위치 정보 초기화
   */
  public clear(): void {
    this.savedPosition = null;
    this.savedTimestamp = 0;
    this.savedContainerRef = null;
    logger.debug('TwitterScrollPreservation: 저장 정보 초기화');
  }

  /**
   * 현재 저장된 위치 반환
   * @returns 저장된 스크롤 위치 (없으면 null)
   */
  public getSavedPosition(): number | null {
    return this.savedPosition;
  }

  /**
   * 저장 여부 확인
   * @returns 저장된 위치가 있으면 true
   */
  public hasSavedPosition(): boolean {
    return this.savedPosition !== null;
  }
}

/**
 * 전역 싱글톤 인스턴스 (선택사항)
 * 여러 곳에서 동일한 인스턴스를 사용해야 할 경우
 */
let globalInstance: TwitterScrollPreservation | null = null;

/**
 * 전역 싱글톤 인스턴스 반환
 * @returns TwitterScrollPreservation 인스턴스
 */
export function getTwitterScrollPreservation(): TwitterScrollPreservation {
  if (!globalInstance) {
    globalInstance = new TwitterScrollPreservation();
  }
  return globalInstance;
}

/**
 * 전역 인스턴스 초기화
 */
export function resetTwitterScrollPreservation(): void {
  if (globalInstance) {
    globalInstance.clear();
  }
  globalInstance = null;
}
