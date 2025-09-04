/**
 * @fileoverview MediaProcessor 메인 클래스
 * @description HTML → MediaDescriptor[] 변환을 위한 통합 처리기
 */

import type { MediaDescriptor, Result } from './types';
import { collectNodes, extractRawData, normalize, dedupe, validate } from './pipeline';
import { logger } from '@shared/logging';

/**
 * MediaProcessor 클래스
 */
export class MediaProcessor {
  /**
   * HTML 요소에서 미디어 목록을 추출하고 정규화
   */
  process(root: HTMLElement): Result<MediaDescriptor[]> {
    try {
      logger.debug('MediaProcessor: 미디어 처리 시작');

      // 1단계: 미디어 요소 수집
      const elements = collectNodes(root);
      logger.debug(`MediaProcessor: ${elements.length}개 요소 수집`);

      // 2단계: 원시 데이터 추출
      const rawCandidates = elements
        .map(extractRawData)
        .filter((candidate): candidate is NonNullable<typeof candidate> => candidate !== null);
      logger.debug(`MediaProcessor: ${rawCandidates.length}개 후보 추출`);

      // 3단계: 정규화
      const normalized = normalize(rawCandidates);
      logger.debug(`MediaProcessor: ${normalized.length}개 정규화`);

      // 4단계: 중복 제거
      const unique = dedupe(normalized);
      logger.debug(`MediaProcessor: ${unique.length}개 유니크`);

      // 5단계: 최종 검증
      const result = validate(unique);

      if (result.success) {
        logger.info(`✅ MediaProcessor: ${result.data.length}개 미디어 처리 완료`);
      } else {
        logger.error('❌ MediaProcessor: 검증 실패:', result.error);
      }

      return result;
    } catch (error) {
      logger.error('❌ MediaProcessor: 처리 중 오류:', error);
      return {
        success: false,
        error: error instanceof Error ? error : new Error(String(error)),
      };
    }
  }
}

/**
 * 편의 함수: 직접 처리
 */
export function processMedia(root: HTMLElement): Result<MediaDescriptor[]> {
  // null 체크
  if (!root) {
    return {
      success: false,
      error: new Error('processMedia: root element가 null입니다'),
    };
  }

  const processor = new MediaProcessor();
  return processor.process(root);
}

// 기본 export
export default MediaProcessor;
