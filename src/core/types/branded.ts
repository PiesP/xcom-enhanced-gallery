/**
 * @fileoverview 브랜드 타입 정의
 * @version 1.0.0
 *
 * 타입 안전성 강화를 위한 브랜드 타입들
 * 런타임에는 string이지만 컴파일 타임에는 구별되는 타입
 */

/**
 * 브랜드 타입 기본 구조
 */
type Brand<T, B> = T & { readonly __brand: B };

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

/**
 * ThumbnailUrl 생성
 */
export function createThumbnailUrl(value: string): ThumbnailUrl {
  try {
    new URL(value);
    return value as ThumbnailUrl;
  } catch {
    throw new Error('Invalid thumbnail URL format');
  }
}

/**
 * OriginalUrl 생성
 */
export function createOriginalUrl(value: string): OriginalUrl {
  try {
    new URL(value);
    return value as OriginalUrl;
  } catch {
    throw new Error('Invalid original URL format');
  }
}

/**
 * Timestamp 생성
 */
export function createTimestamp(value: number = Date.now()): Timestamp {
  if (value < 0) {
    throw new Error('Timestamp must be non-negative');
  }
  return value as Timestamp;
}

/**
 * Duration 생성 (밀리초)
 */
export function createDuration(milliseconds: number): Duration {
  if (milliseconds < 0) {
    throw new Error('Duration must be non-negative');
  }
  return milliseconds as Duration;
}

/**
 * Bytes 생성
 */
export function createBytes(value: number): Bytes {
  if (value < 0) {
    throw new Error('Bytes must be non-negative');
  }
  return value as Bytes;
}

/**
 * Pixels 생성
 */
export function createPixels(value: number): Pixels {
  if (value < 0) {
    throw new Error('Pixels must be non-negative');
  }
  return value as Pixels;
}

/**
 * 브랜드 타입 유틸리티 함수들
 */

/**
 * 브랜드 타입에서 원시 값 추출
 */
export function extractValue<T>(branded: Brand<T, string>): T {
  return branded as T;
}

/**
 * 브랜드 타입 검증 (런타임에서는 의미 없지만 타입 가드 역할)
 */
export function isMediaId(value: string): value is MediaId {
  return typeof value === 'string' && value.length > 0;
}

export function isTweetId(value: string): value is TweetId {
  return /^\d{15,20}$/.test(value);
}

export function isValidUrl(value: string): boolean {
  try {
    new URL(value);
    return true;
  } catch {
    return false;
  }
}

/**
 * 타입 변환 유틸리티
 */
export const brandedTypes = {
  mediaId: createMediaId,
  userId: createUserId,
  tweetId: createTweetId,
  serviceKey: createServiceKey,
  elementId: createElementId,
  mediaUrl: createMediaUrl,
  thumbnailUrl: createThumbnailUrl,
  originalUrl: createOriginalUrl,
  timestamp: createTimestamp,
  duration: createDuration,
  bytes: createBytes,
  pixels: createPixels,
} as const;

/**
 * 타입 안전성 예시
 *
 * @example
 * ```typescript
 * // ✅ 올바른 사용법
 * const mediaId = createMediaId('abc123');
 * const tweetId = createTweetId('1234567890123456789');
 *
 * function getMedia(id: MediaId): MediaItem | null {
 *   // MediaId만 허용
 * }
 *
 * getMedia(mediaId); // ✅ OK
 * getMedia(tweetId); // ❌ Type Error - TweetId는 MediaId가 아님
 * getMedia('abc123'); // ❌ Type Error - string은 MediaId가 아님
 *
 * // ✅ 안전한 URL 처리
 * const imageUrl = createMediaUrl('https://example.com/image.jpg');
 * const thumbUrl = createThumbnailUrl('https://example.com/thumb.jpg');
 *
 * function displayImage(url: MediaUrl): void {
 *   // MediaUrl만 허용
 * }
 *
 * displayImage(imageUrl); // ✅ OK
 * displayImage(thumbUrl); // ❌ Type Error - ThumbnailUrl은 MediaUrl이 아님
 * ```
 */
