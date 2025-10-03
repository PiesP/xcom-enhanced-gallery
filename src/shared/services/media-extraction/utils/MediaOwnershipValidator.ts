/**
 * @fileoverview 미디어 소유권 검증 유틸리티
 * @description 미디어 요소가 올바른 트윗 컨테이너에 속하는지 검증
 * @version 1.0.0 - Epic MEDIA-EXTRACTION-FIX
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
 * 미디어 요소와 트윗 컨테이너 간의 소유권을 검증
 */
export class MediaOwnershipValidator {
  private static readonly MAX_DISTANCE = 20; // 최대 허용 거리
  private static readonly MIN_CONFIDENCE = 0.3; // 최소 신뢰도

  /**
   * 미디어 요소가 트윗 컨테이너에 올바르게 속하는지 검증
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

      // 2. 중간 article 검증
      const hasIntermediate = this.hasIntermediateArticle(mediaElement, tweetContainer);

      // 3. DOM 거리 계산
      const distance = this.calculateDistance(mediaElement, tweetContainer);

      // 4. 신뢰도 계산 (거리 기반)
      const confidence = this.calculateConfidence(distance, hasIntermediate);

      // 5. 유효성 판단
      const isValid = !hasIntermediate && confidence >= this.MIN_CONFIDENCE;

      const duration = Date.now() - startTime;
      if (duration > 5) {
        logger.warn('[MediaOwnershipValidator] 검증 시간 초과:', {
          duration,
          distance,
          target: '5ms',
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
   */
  private static calculateDistance(mediaElement: HTMLElement, tweetContainer: HTMLElement): number {
    let distance = 0;
    let current: HTMLElement | null = mediaElement.parentElement;

    while (current && current !== tweetContainer && distance < this.MAX_DISTANCE) {
      distance++;
      current = current.parentElement;
    }

    return current === tweetContainer ? distance : this.MAX_DISTANCE;
  }

  /**
   * 거리와 중간 article 여부를 기반으로 신뢰도 계산
   * @param distance DOM 거리 (0 ~ MAX_DISTANCE)
   * @param hasIntermediate 중간 article 존재 여부
   * @returns 신뢰도 (0.0 ~ 1.0)
   */
  private static calculateConfidence(distance: number, hasIntermediate: boolean): number {
    // 중간 article이 있으면 신뢰도 크게 하락
    if (hasIntermediate) {
      return 0.2;
    }

    // 거리가 가까울수록 높은 신뢰도
    // distance = 0 (직접 자식): confidence = 1.0
    // distance = 5: confidence = 0.75
    // distance = 10: confidence = 0.5
    // distance = 20: confidence = 0.0
    const normalizedDistance = Math.min(distance, this.MAX_DISTANCE);
    const confidence = 1.0 - normalizedDistance / this.MAX_DISTANCE;

    return Math.max(confidence, 0);
  }

  /**
   * 최적의 트윗 컨테이너 선택 (여러 후보 중)
   */
  static selectBestContainer(
    mediaElement: HTMLElement,
    candidates: HTMLElement[]
  ): { container: HTMLElement; validation: OwnershipValidationResult } | null {
    if (candidates.length === 0) return null;

    const firstCandidate = candidates[0];
    if (!firstCandidate) return null;

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
