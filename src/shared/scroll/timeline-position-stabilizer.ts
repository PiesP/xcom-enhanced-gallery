/**
 * @fileoverview Timeline Position Stabilizer - 실제 구현
 * 타임라인 위치 복원 후 드리프트 현상 해결을 위한 안정화 모듈
 */

import { logger } from '@shared/logging';
import { safeWindow, isBrowserEnvironment } from '@shared/browser';
import { rafChain } from '@shared/scroll/timing-utils';
import { TIME_CONSTANTS } from '@/constants';

const LOG = { stabilizer: '[scroll/stabilizer]' };

export interface TimelineStabilizer {
  waitForLayoutStability(timeoutMs?: number): Promise<boolean>;
  detectPositionDrift(anchorElement: Element, expectedOffset: number): number;
  applyDriftCorrection(driftOffset: number): Promise<boolean>;
  isImageLoadingComplete(): boolean;
  // 고급 안정화 (추가 예정) - TDD 진행 중 임시 타입
  waitForLayoutStabilityAdvanced?(options: {
    maxWaitMs?: number;
    intervalMs?: number;
    requiredStableFrames?: number;
    collectDiagnostics?: boolean;
  }): Promise<{
    success: boolean;
    diagnostics: { framesObserved: number; stableSequences: number };
  }>;
}

/**
 * 타임라인 위치 안정화 구현체
 */
class TimelineStabilizerImpl implements TimelineStabilizer {
  /**
   * 레이아웃 안정성을 위한 대기
   * 이미지 로딩 완료 및 DOM 요소 위치 안정화를 확인
   */
  async waitForLayoutStability(timeoutMs = 200): Promise<boolean> {
    const advanced = await this.waitForLayoutStabilityAdvanced({
      maxWaitMs: timeoutMs,
      intervalMs: 50,
      requiredStableFrames: 1,
    });
    if (advanced.success) {
      logger.info(`${LOG.stabilizer} 레이아웃 안정화 완료 (delegated)`);
    }
    return advanced.success;
  }

  /**
   * 앵커 요소의 위치 드리프트 감지
   * @param anchorElement 기준 앵커 요소
   * @param expectedOffset 예상 오프셋 위치
   * @returns 드리프트 오프셋 (양수: 아래로 이동, 음수: 위로 이동)
   */
  detectPositionDrift(anchorElement: Element, expectedOffset: number): number {
    try {
      const rect = anchorElement.getBoundingClientRect();
      const actualOffset = rect.top;
      const drift = actualOffset - expectedOffset;

      logger.debug(`${LOG.stabilizer} 드리프트 감지:`, {
        expected: expectedOffset,
        actual: actualOffset,
        drift,
      });

      return drift;
    } catch (error) {
      logger.warn(`${LOG.stabilizer} 드리프트 감지 실패:`, error);
      return 0;
    }
  }

  /**
   * 드리프트 보정을 위한 스크롤 조정
   * @param driftOffset 보정할 드리프트 오프셋
   * @returns 보정 성공 여부
   */
  async applyDriftCorrection(driftOffset: number): Promise<boolean> {
    if (!isBrowserEnvironment()) return false;
    if (Math.abs(driftOffset) < 1) return true; // 1px 미만은 무시

    try {
      const win = safeWindow();
      if (!win) return false;

      const currentScrollY = win.scrollY || win.pageYOffset || 0;
      // 테스트 기대치: 양수 drift(아래로 내려감) → 위로(scrollY - drift), 음수 drift(위로 올라감) → 아래로(scrollY - drift)
      const correctedScrollY = Math.max(0, currentScrollY - driftOffset);

      logger.info(`${LOG.stabilizer} 드리프트 보정 적용:`, {
        drift: driftOffset,
        currentY: currentScrollY,
        correctedY: correctedScrollY,
      });

      // RAF를 사용하여 부드러운 보정
      return new Promise(resolve => {
        rafChain(1, () => {
          try {
            win.scrollTo({
              top: correctedScrollY,
              behavior: 'auto',
            });
            resolve(true);
          } catch (error) {
            logger.warn(`${LOG.stabilizer} 스크롤 보정 실패:`, error);
            resolve(false);
          }
        });
      });
    } catch (error) {
      logger.warn(`${LOG.stabilizer} 드리프트 보정 실패:`, error);
      return false;
    }
  }

  /**
   * 이미지 로딩 완료 상태 확인
   * @returns 모든 이미지가 로드되었는지 여부
   */
  isImageLoadingComplete(): boolean {
    try {
      const images = document.querySelectorAll('img');

      for (const img of images) {
        // src가 있는 이미지만 체크
        if (img.src && !img.complete) {
          return false;
        }
      }

      return true;
    } catch (error) {
      logger.warn(`${LOG.stabilizer} 이미지 로딩 체크 실패:`, error);
      return true; // 오류 시 안전하게 true 반환
    }
  }

  // RED 단계: 아직 실제 구현 전 - 고정된 실패 결과 반환
  async waitForLayoutStabilityAdvanced(
    options: {
      maxWaitMs?: number;
      intervalMs?: number;
      requiredStableFrames?: number;
      collectDiagnostics?: boolean;
    } = {}
  ): Promise<{
    success: boolean;
    diagnostics: { framesObserved: number; stableSequences: number };
  }> {
    if (!isBrowserEnvironment()) {
      return { success: false, diagnostics: { framesObserved: 0, stableSequences: 0 } };
    }

    const { maxWaitMs = 200, intervalMs = 16, requiredStableFrames = 2 } = options;

    const start = Date.now();
    let lastTops: number[] | null = null;
    let stableRun = 0;
    let framesObserved = 0;
    let stableSequences = 0;

    return new Promise(resolve => {
      const sample = () => {
        try {
          framesObserved++;

          // 이미지 로딩 상태 체크
          if (!this.isImageLoadingComplete()) {
            // 이미지가 로딩 중이면 대기 계속
            if (Date.now() - start > maxWaitMs) {
              resolve({
                success: false,
                diagnostics: { framesObserved, stableSequences },
              });
              return;
            }

            // 다음 프레임에서 다시 체크
            const schedule = () => setTimeout(sample, intervalMs);
            try {
              requestAnimationFrame(() => schedule());
            } catch {
              schedule();
            }
            return;
          }

          const tweets = document.querySelectorAll('article[data-testid="tweet"]');
          if (tweets.length === 0) {
            // 트윗 없고 이미지 로딩 완료이면 즉시 성공 (안정)
            resolve({
              success: true,
              diagnostics: { framesObserved, stableSequences },
            });
            return;
          }
          const tops = Array.from(tweets).map(el => {
            try {
              return (el as HTMLElement).getBoundingClientRect().top;
            } catch {
              return Number.NaN;
            }
          });

          let allStable = true;
          if (lastTops && lastTops.length === tops.length) {
            for (let i = 0; i < tops.length; i++) {
              const prev = lastTops[i];
              const curr = tops[i];
              if (prev !== undefined && curr !== undefined && Math.abs(curr - prev) > 1) {
                allStable = false;
                break;
              }
            }
          } else if (lastTops) {
            allStable = false; // 요소 수 변동
          }
          if (!lastTops) {
            allStable = false; // 첫 프레임은 비교 불가
          }

          if (allStable) {
            stableRun++;
            if (stableRun === 1) stableSequences++; // 새로운 안정 구간 시작
          } else {
            stableRun = 0;
          }

          lastTops = tops;

          if (stableRun >= requiredStableFrames) {
            resolve({
              success: true,
              diagnostics: { framesObserved, stableSequences },
            });
            return;
          }

          if (Date.now() - start > maxWaitMs) {
            resolve({
              success: false,
              diagnostics: { framesObserved, stableSequences },
            });
            return;
          }

          // interval / rAF 하이브리드: rAF 우선, 실패 시 setTimeout
          const schedule = () => setTimeout(sample, intervalMs);
          try {
            requestAnimationFrame(() => schedule());
          } catch {
            schedule();
          }
        } catch (e) {
          logger.warn(`${LOG.stabilizer} advanced stability check error`, e);
          resolve({ success: false, diagnostics: { framesObserved, stableSequences } });
        }
      };
      sample();
    });
  }
}

/**
 * 타임라인 위치 안정화기 싱글톤 인스턴스
 */
export const timelineStabilizer: TimelineStabilizer = new TimelineStabilizerImpl();

/**
 * 갤러리 종료 시 타임라인 위치 안정화 수행
 * 기존 스크롤 복원 후 드리프트 보정을 위한 통합 함수
 */
export async function stabilizeTimelinePosition(
  anchorElement?: Element,
  expectedOffset?: number,
  options: {
    stabilityTimeoutMs?: number;
    maxCorrectionAttempts?: number;
  } = {}
): Promise<boolean> {
  const { stabilityTimeoutMs = 200, maxCorrectionAttempts = 2 } = options;

  try {
    logger.info(`${LOG.stabilizer} 타임라인 위치 안정화 시작`);

    // 1단계: 레이아웃 안정화 대기
    const isStable = await timelineStabilizer.waitForLayoutStability(stabilityTimeoutMs);
    if (!isStable) {
      logger.warn(`${LOG.stabilizer} 레이아웃 안정화 실패 - 기본 복원만 수행`);
      return false;
    }

    // 2단계: 드리프트 감지 및 보정 (앵커 요소가 있는 경우)
    if (anchorElement && typeof expectedOffset === 'number') {
      let correctionSuccess = false;

      for (let attempt = 1; attempt <= maxCorrectionAttempts; attempt++) {
        const drift = timelineStabilizer.detectPositionDrift(anchorElement, expectedOffset);

        if (Math.abs(drift) < 1) {
          logger.info(`${LOG.stabilizer} 드리프트 없음 - 보정 완료`);
          correctionSuccess = true;
          break;
        }

        logger.info(
          `${LOG.stabilizer} 보정 시도 ${attempt}/${maxCorrectionAttempts}: 드리프트 ${drift}px`
        );

        const corrected = await timelineStabilizer.applyDriftCorrection(drift);
        if (corrected) {
          // 보정 후 잠시 대기하여 안정화
          await new Promise(resolve => setTimeout(resolve, TIME_CONSTANTS.MILLISECONDS_50));
          correctionSuccess = true;

          // 마지막 시도가 아닌 경우 재검증
          if (attempt < maxCorrectionAttempts) {
            const finalDrift = timelineStabilizer.detectPositionDrift(
              anchorElement,
              expectedOffset
            );
            if (Math.abs(finalDrift) < 1) break;
          }
        } else {
          logger.warn(`${LOG.stabilizer} 보정 실패 - 시도 ${attempt}`);
        }
      }

      return correctionSuccess;
    }

    logger.info(`${LOG.stabilizer} 앵커 정보 없음 - 안정화만 수행`);
    return true;
  } catch (error) {
    logger.error(`${LOG.stabilizer} 타임라인 위치 안정화 오류:`, error);
    return false;
  }
}

export const __test_only = {
  TimelineStabilizerImpl,
};
