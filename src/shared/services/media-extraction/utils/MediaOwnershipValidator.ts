/**
 * @fileoverview 미디어 소유권 검증 유틸리티
 * @description 미디어 요소가 올바른 트윗 컨테이너에 속하는지 검증
 * @version 1.0.0 - Epic MEDIA-EXTRACTION-FIX
 *
 * 알고리즘:
 * 1. 미디어가 컨테이너에 포함되어 있는지 기본 검증
 * 2. 중간에 다른 article 요소가 있는지 탐색 (부모 트윗 방지)
 * 3. DOM 거리 계산 (미디어 → 컨테이너 경로의 노드 수)
 * 4. 거리 기반 신뢰도 계산 (가까울수록 높은 신뢰도)
 * 5. 최소 신뢰도 기준으로 유효성 판단
 */

import { logger } from '@shared/logging/logger';

/**
 * 소유권 검증 결과
 */
export interface OwnershipValidationResult {
  /** 소유권이 유효한지 여부 */
  isValid: boolean;
  /** 거리 기반 신뢰도 (0.0 ~ 1.0) */
  confidence: number;
  /** 미디어와 컨테이너 사이의 DOM 거리 */
  distance: number;
  /** 중간에 다른 article이 있는지 여부 */
  hasIntermediateArticle: boolean;
  /** 검증 실패 이유 (실패 시) */
  reason?: string;
}

/**
 * 미디어 소유권 검증기
 *
 * 버그 해결: closest() 메서드가 부모 트윗을 찾는 문제를 방지
 * 멘션된 트윗의 미디어가 부모 트윗으로 잘못 매핑되는 것을 차단
 *
 * @example
 * ```ts
 * const result = MediaOwnershipValidator.validate(imgElement, articleElement);
 * if (result.isValid && result.confidence > 0.7) {
 *   // 높은 신뢰도로 소유권 확인됨
 * }
 * ```
 */
export class MediaOwnershipValidator {
  /** 최대 허용 DOM 거리 (20 레벨 이상은 소유권 의심) */
  private static readonly MAX_DISTANCE = 20;

  /** 최소 신뢰도 기준 (0.3 미만은 유효하지 않음) */
  private static readonly MIN_CONFIDENCE = 0.3;

  /** 성능 경고 임계값 (밀리초) */
  private static readonly PERFORMANCE_THRESHOLD_MS = 5;

  /** 중간 article 페널티 신뢰도 */
  private static readonly INTERMEDIATE_PENALTY_CONFIDENCE = 0.2;

  /**
   * 미디어 요소가 트윗 컨테이너에 올바르게 속하는지 검증
   *
   * @param mediaElement 검증할 미디어 요소 (img, video 등)
   * @param tweetContainer 대상 트윗 컨테이너 (article 요소)
   * @returns 검증 결과 (유효성, 신뢰도, 거리, 중간 article 여부)
   */
  static validate(
    mediaElement: HTMLElement,
    tweetContainer: HTMLElement
  ): OwnershipValidationResult {
    const startTime = Date.now();

    try {
      // 1. 기본 검증: 미디어가 컨테이너 내부에 있는지
      if (!tweetContainer.contains(mediaElement)) {
        return {
          isValid: false,
          confidence: 0,
          distance: -1,
          hasIntermediateArticle: false,
          reason: '미디어 요소가 컨테이너 외부에 있음',
        };
      }

      // 2. 중간 article 검증 (Early exit: 발견 시 즉시 실패)
      const hasIntermediate = this.hasIntermediateArticle(mediaElement, tweetContainer);

      // 3. DOM 거리 계산
      const distance = this.calculateDistance(mediaElement, tweetContainer);

      // 4. 신뢰도 계산 (거리 기반)
      const confidence = this.calculateConfidence(distance, hasIntermediate);

      // 5. 유효성 판단
      const isValid = !hasIntermediate && confidence >= this.MIN_CONFIDENCE;

      // 성능 모니터링
      const duration = Date.now() - startTime;
      if (duration > this.PERFORMANCE_THRESHOLD_MS) {
        logger.warn('[MediaOwnershipValidator] 검증 시간 초과:', {
          duration,
          distance,
          target: `${this.PERFORMANCE_THRESHOLD_MS}ms`,
        });
      }

      return {
        isValid,
        confidence,
        distance,
        hasIntermediateArticle: hasIntermediate,
        ...(isValid
          ? {}
          : {
              reason: hasIntermediate
                ? '중간에 다른 트윗 컨테이너 존재'
                : '신뢰도가 최소 기준 미달',
            }),
      };
    } catch (error) {
      logger.error('[MediaOwnershipValidator] 검증 오류:', error);
      return {
        isValid: false,
        confidence: 0,
        distance: -1,
        hasIntermediateArticle: false,
        reason: '검증 중 오류 발생',
      };
    }
  }

  /**
   * 미디어와 컨테이너 사이에 중간 article이 있는지 검증
   *
   * Twitter DOM 구조에서 멘션된 트윗은 부모 트윗 내부에 중첩됩니다:
   * ```html
   * <article data-testid="tweet"> <!-- 부모 트윗 -->
   *   <article data-testid="tweet"> <!-- 멘션된 트윗 -->
   *     <img> <!-- 이 미디어는 부모가 아닌 자식 트윗 소유 -->
   *   </article>
   * </article>
   * ```
   *
   * @param mediaElement 미디어 요소
   * @param tweetContainer 검증할 컨테이너
   * @returns true if 중간에 다른 트윗 컨테이너가 존재
   */
  private static hasIntermediateArticle(
    mediaElement: HTMLElement,
    tweetContainer: HTMLElement
  ): boolean {
    let current: HTMLElement | null = mediaElement.parentElement;

    while (current && current !== tweetContainer) {
      // article 또는 data-testid="tweet" 확인
      if (
        current.tagName.toLowerCase() === 'article' ||
        current.getAttribute('data-testid') === 'tweet'
      ) {
        return true; // 중간에 다른 트윗 컨테이너 발견
      }
      current = current.parentElement;
    }

    return false;
  }

  /**
   * 미디어 요소와 컨테이너 사이의 DOM 거리 계산
   *
   * 거리 계산 예시:
   * - 직접 자식: distance = 0
   * - 1레벨 중첩: distance = 1
   * - 20레벨 이상: MAX_DISTANCE 반환 (의심스러운 관계)
   *
   * @param mediaElement 미디어 요소
   * @param tweetContainer 컨테이너 요소
   * @returns DOM 거리 (0 ~ MAX_DISTANCE)
   */
  private static calculateDistance(mediaElement: HTMLElement, tweetContainer: HTMLElement): number {
    let distance = 0;
    let current: HTMLElement | null = mediaElement.parentElement;

    while (current && current !== tweetContainer && distance < this.MAX_DISTANCE) {
      distance++;
      current = current.parentElement;
    }

    // 컨테이너에 도달하지 못하면 MAX_DISTANCE 반환
    return current === tweetContainer ? distance : this.MAX_DISTANCE;
  }

  /**
   * 거리와 중간 article 여부를 기반으로 신뢰도 계산
   *
   * 신뢰도 공식:
   * - 중간 article 있음: 0.2 (페널티)
   * - 중간 article 없음: 1.0 - (distance / MAX_DISTANCE)
   *
   * 신뢰도 예시:
   * - distance = 0 (직접 자식): confidence = 1.0
   * - distance = 5: confidence = 0.75
   * - distance = 10: confidence = 0.5
   * - distance = 20: confidence = 0.0
   *
   * @param distance DOM 거리 (0 ~ MAX_DISTANCE)
   * @param hasIntermediate 중간 article 존재 여부
   * @returns 신뢰도 (0.0 ~ 1.0)
   */
  private static calculateConfidence(distance: number, hasIntermediate: boolean): number {
    // 중간 article이 있으면 신뢰도 크게 하락 (페널티)
    if (hasIntermediate) {
      return this.INTERMEDIATE_PENALTY_CONFIDENCE;
    }

    // 거리가 가까울수록 높은 신뢰도 (선형 감소)
    const normalizedDistance = Math.min(distance, this.MAX_DISTANCE);
    const confidence = 1.0 - normalizedDistance / this.MAX_DISTANCE;

    return Math.max(confidence, 0);
  }

  /**
   * 최적의 트윗 컨테이너 선택 (여러 후보 중)
   *
   * 사용 사례: querySelectorAll()로 여러 article을 찾았을 때
   * 가장 높은 신뢰도를 가진 컨테이너를 선택
   *
   * @param mediaElement 미디어 요소
   * @param candidates 후보 컨테이너 배열
   * @returns 최적 컨테이너와 검증 결과, 또는 null (유효한 후보 없음)
   */
  static selectBestContainer(
    mediaElement: HTMLElement,
    candidates: HTMLElement[]
  ): { container: HTMLElement; validation: OwnershipValidationResult } | null {
    // Early exit: 후보 없음
    if (candidates.length === 0) return null;

    const firstCandidate = candidates[0];
    if (!firstCandidate) return null;

    // Fast path: 단일 후보
    if (candidates.length === 1) {
      return {
        container: firstCandidate,
        validation: this.validate(mediaElement, firstCandidate),
      };
    }

    // 모든 후보를 검증하고 최고 신뢰도 선택
    let bestResult: { container: HTMLElement; validation: OwnershipValidationResult } | null = null;

    for (const candidate of candidates) {
      const validation = this.validate(mediaElement, candidate);

      // 유효하고 더 높은 신뢰도인 경우 업데이트
      if (
        validation.isValid &&
        (!bestResult || validation.confidence > bestResult.validation.confidence)
      ) {
        bestResult = { container: candidate, validation };
      }
    }

    return bestResult;
  }
}
