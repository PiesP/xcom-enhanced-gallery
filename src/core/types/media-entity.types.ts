/**
 * @fileoverview 단순화된 미디어 타입들
 * @version 3.0.0 - Phase 3: 복잡한 도메인 객체 제거
 *
 * 유저스크립트에 적합한 단순한 구조로 변경
 */

// ================================
// 단순한 타입 정의들
// ================================

/**
 * 기본 미디어 정보 (단순화된 버전)
 */
export interface MediaInfo {
  id: string;
  url: string;
  originalUrl?: string;
  type: 'image' | 'video' | 'gif';
  filename: string;
  fileSize?: number;
  width?: number;
  height?: number;
  thumbnailUrl?: string;
  alt?: string;
  tweetUsername?: string | undefined;
  tweetId?: string | undefined;
  tweetUrl?: string;
  metadata?: Record<string, unknown>;
}

/**
 * 단순한 미디어 엔티티 (클래스 대신 인터페이스 사용)
 */
export interface MediaEntity extends MediaInfo {
  readonly createdAt: Date;
  readonly updatedAt: Date;
}

// ================================
// 유틸리티 함수들 (단순화)
// ================================

/**
 * URL 유효성 검사
 */
export function isValidUrl(url: string): boolean {
  try {
    const parsed = new URL(url);
    return parsed.protocol === 'http:' || parsed.protocol === 'https:';
  } catch {
    return false;
  }
}

/**
 * Twitter 이미지 URL을 원본 해상도로 변환
 */
export function toOriginalUrl(url: string): string {
  if (url.includes('pbs.twimg.com')) {
    return url.replace(/(\.(jpg|jpeg|png|webp)).*$/, '$1:orig');
  }
  return url;
}

/**
 * 파일 확장자에서 미디어 타입 추론
 */
export function getMediaTypeFromExtension(extension: string): 'image' | 'video' | 'gif' {
  const ext = extension.toLowerCase().replace('.', '');

  const imageExts = ['jpg', 'jpeg', 'png', 'webp', 'bmp'];
  const videoExts = ['mp4', 'webm', 'mov', 'avi'];
  const gifExts = ['gif'];

  if (imageExts.includes(ext)) return 'image';
  if (videoExts.includes(ext)) return 'video';
  if (gifExts.includes(ext)) return 'gif';

  return 'image'; // 기본값
}

/**
 * 안전한 파일명 생성
 */
export function createSafeFilename(filename: string): string {
  return filename
    .replace(/[<>:"/\\|?*]/g, '_')
    .replace(/\s+/g, '_')
    .replace(/_+/g, '_')
    .replace(/^_|_$/g, '')
    .substring(0, 200); // 최대 길이 제한
}

/**
 * MediaEntity 생성 (팩토리 함수)
 */
export function createMediaEntity(config: {
  id?: string;
  url: string;
  type?: string;
  filename?: string;
  width?: number;
  height?: number;
  originalUrl?: string;
  thumbnailUrl?: string;
  fileSize?: number;
  alt?: string;
  tweetId?: string;
  tweetUsername?: string;
  tweetUrl?: string;
  metadata?: Record<string, unknown>;
}): MediaEntity {
  const now = new Date();
  const type = (config.type as 'image' | 'video' | 'gif') ?? 'image';

  return {
    id: config.id ?? generateId(),
    url: config.url ?? '',
    type,
    filename: config.filename ?? generateFilename(config.url ?? '', type),
    createdAt: now,
    updatedAt: now,

    // 선택적 필드들
    ...(config.originalUrl && { originalUrl: config.originalUrl }),
    ...(config.thumbnailUrl && { thumbnailUrl: config.thumbnailUrl }),
    ...(config.fileSize && { fileSize: config.fileSize }),
    ...(config.width && { width: config.width }),
    ...(config.height && { height: config.height }),
    ...(config.alt && { alt: config.alt }),
    ...(config.tweetId && { tweetId: config.tweetId }),
    ...(config.tweetUsername && { tweetUsername: config.tweetUsername }),
    ...(config.tweetUrl && { tweetUrl: config.tweetUrl }),
    ...(config.metadata && { metadata: config.metadata }),
  };
}

/**
 * MediaEntity를 MediaInfo로 변환
 */
export function toMediaInfo(entity: MediaEntity): MediaInfo {
  const { createdAt, updatedAt, ...mediaInfo } = entity;
  return mediaInfo;
}

// ================================
// 내부 헬퍼 함수들
// ================================

/**
 * 고유 ID 생성
 */
function generateId(): string {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    return crypto.randomUUID();
  }
  return `media_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

/**
 * URL에서 파일명 생성
 */
function generateFilename(url: string, type: 'image' | 'video' | 'gif'): string {
  try {
    const urlObj = new URL(url);
    const pathname = urlObj.pathname;
    const lastSegment = pathname.split('/').pop() || 'media';

    // 확장자가 없으면 타입에 따라 추가
    if (!lastSegment.includes('.')) {
      const ext = type === 'image' ? 'jpg' : type === 'video' ? 'mp4' : 'gif';
      return `${lastSegment}.${ext}`;
    }

    return createSafeFilename(lastSegment);
  } catch {
    // URL 파싱 실패 시 기본 파일명
    const ext = type === 'image' ? 'jpg' : type === 'video' ? 'mp4' : 'gif';
    return `media_${Date.now()}.${ext}`;
  }
}
