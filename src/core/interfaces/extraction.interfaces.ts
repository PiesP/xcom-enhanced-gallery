/**
 * @fileoverview 통합 미디어 추출 인터페이스
 * @description 모든 미디어 추출 전략과 서비스의 통합 인터페이스
 * @version 3.0.0 - Simplified Architecture
 */

// 필수 타입 임포트
import type { MediaExtractionResult } from '../types/media.types';

// Re-export MediaExtractionResult from media.types.ts to ensure consistency
export type { MediaExtractionResult } from '../types/media.types';

/**
 * 트윗 정보 인터페이스
 */
export interface TweetInfo {
  /** 트윗 ID */
  tweetId: string;
  /** 사용자명 */
  username: string;
  /** 트윗 URL */
  tweetUrl: string;
  /** 추출 방법 */
  extractionMethod: string;
  /** 추출 신뢰도 (0-1) */
  confidence: number;
  /** 추가 메타데이터 */
  metadata?: Record<string, unknown>;
}

/**
 * 미디어 추출 옵션
 */
export interface MediaExtractionOptions {
  /** 비디오 포함 여부 */
  includeVideos?: boolean;
  /** 타임아웃 (밀리초) */
  timeoutMs?: number;
  /** API 폴백 사용 */
  useApiFallback?: boolean;
  /** 백그라운드 로딩 활성화 */
  enableBackgroundLoading?: boolean;
  /** 유효성 검사 활성화 */
  enableValidation?: boolean;
  /** 최대 재시도 횟수 */
  maxRetries?: number;
}

/**
 * 미디어 추출기 인터페이스
 */
export interface MediaExtractor {
  /**
   * 클릭된 요소에서 미디어 추출
   */
  extractFromClickedElement(
    element: HTMLElement,
    options?: MediaExtractionOptions
  ): Promise<MediaExtractionResult>;

  /**
   * 컨테이너에서 모든 미디어 추출
   */
  extractAllFromContainer(
    container: HTMLElement,
    options?: MediaExtractionOptions
  ): Promise<MediaExtractionResult>;
}

/**
 * 트윗 정보 추출 전략 인터페이스
 */
export interface TweetInfoExtractionStrategy {
  /** 전략 이름 */
  readonly name: string;
  /** 전략 우선순위 (낮을수록 높은 우선순위) */
  readonly priority: number;

  /**
   * 트윗 정보 추출
   */
  extract(element: HTMLElement): Promise<TweetInfo | null>;
}

/**
 * API 추출기 인터페이스
 */
export interface APIExtractor {
  /**
   * API를 통한 미디어 추출
   */
  extract(
    tweetInfo: TweetInfo,
    clickedElement: HTMLElement,
    options: MediaExtractionOptions,
    extractionId: string
  ): Promise<MediaExtractionResult>;
}

/**
 * 백업 추출 전략 인터페이스
 */
export interface FallbackExtractionStrategy {
  /** 전략 이름 */
  readonly name: string;

  /**
   * 백업 추출 실행
   */
  extract(
    tweetContainer: HTMLElement,
    clickedElement: HTMLElement,
    tweetInfo?: TweetInfo
  ): Promise<MediaExtractionResult>;
}

/**
 * 트윗 API 미디어 엔트리 (기존 타입과 호환)
 */
export interface TweetMediaEntry {
  /** 미디어 타입 */
  type: 'photo' | 'video';
  /** 원본 미디어 타입 */
  type_original: 'photo' | 'video' | 'animated_gif';
  /** 다운로드 URL */
  download_url: string;
  /** 미리보기 URL */
  preview_url: string;
  /** 확장 URL */
  expanded_url?: string;
  /** 미디어 ID */
  media_id?: string;
  /** 미디어 키 */
  media_key?: string;
  /** 인덱스 */
  index?: number;
  /** 타입 인덱스 */
  type_index?: number;
  /** 스크린 이름 */
  screen_name?: string;
  /** 트윗 ID */
  tweet_id?: string;
}

/**
 * Twitter API 인터페이스
 */
export interface TwitterAPI {
  /**
   * 트윗 미디어 가져오기
   */
  getTweetMedias(tweetId: string, options?: { timeout?: number }): Promise<TweetMediaEntry[]>;
}