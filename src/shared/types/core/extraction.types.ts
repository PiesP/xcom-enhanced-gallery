/**
 * @fileoverview 통합 미디어 추출 타입 정의
 * @description 모든 미디어 추출 전략과 서비스의 통합 타입
 * @version 2.0.0 - Core 타입으로 이동
 */

// 필수 타입 임포트
import type { MediaExtractionResult } from './media.types';
import type { MediaExtractionOptions } from '@shared/types/media.types';

// Re-export for external usage
export type { MediaExtractionOptions };

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
  /** 원본 타입 (개선된 호환성) */
  typeOriginal?: 'photo' | 'video' | 'animated_gif';
  /** 타입별 인덱스 (개선된 호환성) */
  typeIndex?: number;
  /** 트윗 텍스트 */
  tweet_text?: string;
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

/**
 * 추출 오류 코드
 */
export enum ExtractionErrorCode {
  TWEET_NOT_FOUND = 'TWEET_NOT_FOUND',
  MEDIA_NOT_FOUND = 'MEDIA_NOT_FOUND',
  TIMEOUT = 'TIMEOUT',
  NETWORK_ERROR = 'NETWORK_ERROR',
  INVALID_ELEMENT = 'INVALID_ELEMENT',
  UNKNOWN_ERROR = 'UNKNOWN_ERROR',
}

/**
 * 추출 오류 클래스
 */
export class ExtractionError extends Error {
  constructor(
    public code: ExtractionErrorCode,
    message: string,
    public details?: Record<string, unknown>
  ) {
    super(message);
    this.name = 'ExtractionError';
  }
}
