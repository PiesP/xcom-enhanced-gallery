/**
 * @fileoverview Core Extraction Interfaces - 기존 Features에서 이동
 * @description 모든 미디어 추출 전략과 서비스의 통합 인터페이스
 * @version 3.1.0 - Core 레이어로 통합
 */

export type {
  TweetInfo,
  MediaExtractionOptions,
  MediaExtractor,
  TweetInfoExtractionStrategy,
  APIExtractor,
  FallbackExtractionStrategy,
} from '../types/extraction.types';

// Re-export MediaExtractionResult from media.types
export type { MediaExtractionResult } from '../types/media.types';

// 추가 타입들 (기존 Features에만 있던 것들)
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
