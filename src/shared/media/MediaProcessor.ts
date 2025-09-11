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
export interface MediaProcessStageEvent {
  readonly stage: 'collect' | 'extract' | 'normalize' | 'dedupe' | 'validate' | 'complete';
  readonly count?: number; // 해당 단계 처리 후 아이템 수 (가능한 경우)
}

export interface MediaProcessOptions {
  readonly onStage?: (event: MediaProcessStageEvent) => void;
  /** 단계별 latency(ms) 측정을 활성화 (기본 false: 오버헤드 최소) */
  readonly telemetry?: boolean;
}

export class MediaProcessor {
  /**
   * HTML 요소에서 미디어 목록을 추출하고 정규화
   * 진행률 옵저버(onStage)를 옵션으로 받아 단계별 이벤트를 방출
   */
  process(
    root: HTMLElement,
    options?: MediaProcessStageEvent & MediaProcessOptions
  ): Result<MediaDescriptor[]> & {
    telemetry?: Array<{ stage: string; count: number; duration: number }>;
  } {
    const onStage = options?.onStage;
    const collectTelemetry = options?.telemetry === true;
    const telemetry: Array<{ stage: string; count: number; duration: number }> = collectTelemetry
      ? []
      : [];
    let lastTime = collectTelemetry ? performance.now() : 0;
    const record = (stage: MediaProcessStageEvent['stage'], count: number): void => {
      onStage?.({ stage, count });
      if (collectTelemetry) {
        const now = performance.now();
        telemetry.push({ stage, count, duration: Math.max(0, now - lastTime) });
        lastTime = now;
      }
    };
    try {
      logger.debug('MediaProcessor: 미디어 처리 시작');

      // 1단계: 미디어 요소 수집
      const elements = collectNodes(root);
      logger.debug(`MediaProcessor: ${elements.length}개 요소 수집`);
      record('collect', elements.length);

      // 2단계: 원시 데이터 추출
      const rawCandidates = elements
        .map(extractRawData)
        .filter((candidate): candidate is NonNullable<typeof candidate> => candidate !== null);
      logger.debug(`MediaProcessor: ${rawCandidates.length}개 후보 추출`);
      record('extract', rawCandidates.length);

      // 3단계: 정규화
      const normalized = normalize(rawCandidates);
      logger.debug(`MediaProcessor: ${normalized.length}개 정규화`);
      record('normalize', normalized.length);

      // 4단계: 중복 제거
      const unique = dedupe(normalized);
      logger.debug(`MediaProcessor: ${unique.length}개 유니크`);
      record('dedupe', unique.length);

      // 5단계: 최종 검증
      const result = validate(unique);
      record('validate', result.success ? result.data.length : 0);

      if (result.success) {
        logger.info(`✅ MediaProcessor: ${result.data.length}개 미디어 처리 완료`);
      } else {
        logger.error('❌ MediaProcessor: 검증 실패:', result.error);
      }

      onStage?.({ stage: 'complete', count: result.success ? result.data.length : 0 });
      return collectTelemetry ? { ...result, telemetry } : result;
    } catch (error) {
      logger.error('❌ MediaProcessor: 처리 중 오류:', error);
      const err: Result<MediaDescriptor[]> = {
        success: false,
        error: error instanceof Error ? error : new Error(String(error)),
      };
      onStage?.({ stage: 'complete', count: 0 });
      return collectTelemetry ? { ...err, telemetry } : err;
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
