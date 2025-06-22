/**
 * @fileoverview 브랜드 타입 정의 - Shared Layer
 * @version 1.0.0
 *
 * 타입 안전성 강화를 위한 브랜드 타입들
 * 런타임에는 string이지만 컴파일 타임에는 구별되는 타입
 */

/**
 * 브랜드 타입 기본 구조
 */
export type Brand<T, B> = T & { readonly __brand: B };

/**
 * ID 타입들 - 서로 다른 종류의 ID가 섞이지 않도록 보장
 */
export type MediaId = Brand<string, 'MediaId'>;
export type UserId = Brand<string, 'UserId'>;
export type TweetId = Brand<string, 'TweetId'>;
export type ServiceKey = Brand<string, 'ServiceKey'>;
export type ElementId = Brand<string, 'ElementId'>;

/**
 * URL 타입들 - 용도별로 구분
 */
export type MediaUrl = Brand<string, 'MediaUrl'>;
export type ThumbnailUrl = Brand<string, 'ThumbnailUrl'>;
export type OriginalUrl = Brand<string, 'OriginalUrl'>;

/**
 * 시간 관련 타입들
 */
export type Timestamp = Brand<number, 'Timestamp'>;
export type Duration = Brand<number, 'Duration'>;

/**
 * 크기 관련 타입들
 */
export type Bytes = Brand<number, 'Bytes'>;
export type Pixels = Brand<number, 'Pixels'>;

/**
 * 팩토리 함수들 - 안전한 브랜드 타입 생성
 */

/**
 * MediaId 생성
 */
export function createMediaId(value: string): MediaId {
  if (!value || value.length === 0) {
    throw new Error('Valid media ID required');
  }
  return value as MediaId;
}

/**
 * UserId 생성
 */
export function createUserId(value: string): UserId {
  if (!value || value.length === 0) {
    throw new Error('Valid user ID required');
  }
  return value as UserId;
}

/**
 * TweetId 생성 - Twitter ID 형식 검증
 */
export function createTweetId(value: string): TweetId {
  if (!/^\d{15,20}$/.test(value)) {
    throw new Error('Invalid tweet ID format: must be 15-20 digits');
  }
  return value as TweetId;
}

/**
 * ServiceKey 생성
 */
export function createServiceKey(value: string): ServiceKey {
  if (!value || value.length === 0) {
    throw new Error('Valid service key required');
  }
  return value as ServiceKey;
}

/**
 * ElementId 생성
 */
export function createElementId(value: string): ElementId {
  if (!value || value.length === 0) {
    throw new Error('Valid element ID required');
  }
  return value as ElementId;
}

/**
 * MediaUrl 생성 - URL 형식 검증
 */
export function createMediaUrl(value: string): MediaUrl {
  try {
    new URL(value);
    return value as MediaUrl;
  } catch {
    throw new Error('Invalid URL format');
  }
}
