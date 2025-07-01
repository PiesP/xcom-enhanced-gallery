/**
 * @fileoverview Infrastructure 레이어 전용 타입 정의
 * @description Clean Architecture 원칙에 따라 외부 의존성을 제거한 타입들
 */

/**
 * 미디어 타입
 */
export type MediaType = 'image' | 'video';

/**
 * 미디어 정보 인터페이스 (Infrastructure 레이어용)
 */
export interface MediaInfo {
  id?: string | undefined;
  url: string;
  filename?: string | undefined;
  size?: number | undefined;
  type?: string | undefined;
  tweetId?: string | undefined;
  tweetUsername?: string | undefined;
}

/**
 * 미디어 아이템 인터페이스 (Infrastructure 레이어용)
 */
export interface MediaItem {
  id: string;
  url: string;
  type: 'image' | 'video';
  filename?: string | undefined;
  size?: number | undefined;
  metadata?: Record<string, unknown> | undefined;
  tweetId?: string | undefined;
  tweetUsername?: string | undefined;
}
