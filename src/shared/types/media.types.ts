/**
 * @fileoverview 통합 미디어 타입 정의
 * @version 3.0.0 - Phase 3: 파일 통합
 *
 * 모든 미디어 관련 타입을 하나로 통합:
 * - media.types.ts (핵심 미디어 타입)
 * - media-entity.types.ts (엔티티 + 유틸리티)
 * - extraction.types.ts (추출 관련)
 */

// ================================
// 기본 미디어 타입들
// ================================

// Constants에서 re-export
import type { MediaType as BaseMediaType, MediaQuality as BaseMediaQuality } from '../../constants';

export type MediaType = BaseMediaType;
export type MediaQuality = BaseMediaQuality;

/**
 * 브랜드 타입 기본 구조
 */
type Brand<T, B> = T & { readonly __brand: B };

/**
 * 미디어 ID 브랜드 타입
 */
export type MediaId = Brand<string, 'MediaId'>;

/**
 * 기본 미디어 정보
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
 * 미디어 엔티티 (시간 정보 포함)
 */
export interface MediaEntity extends MediaInfo {
  readonly createdAt: Date;
  readonly updatedAt: Date;
}

/**
 * 미디어 아이템 (MediaInfo 별칭)
 */
export type MediaItem = MediaInfo;

// ================================
// 다운로드 관련 타입들
// ================================

/**
 * 다운로드 미디어 아이템
 */
export interface DownloadMediaItem extends MediaInfo {
  downloadProgress?: number | undefined;
  downloadStatus?: 'pending' | 'downloading' | 'completed' | 'failed' | undefined;
}

/**
 * URL과 파일명 쌍
 */
export interface UrlWithFilename {
  url: string;
  filename: string;
}

/**
 * 파일명이 포함된 미디어 정보 (다운로드용)
 */
export interface MediaInfoWithFilename extends MediaInfo {
  id: string;
  originalUrl: string;
  filename: string;
}

/**
 * FilenameService용 미디어 정보
 */
export interface MediaItemForFilename {
  id?: string | undefined;
  url: string;
  originalUrl?: string | undefined;
  type: MediaType;
  filename?: string | undefined;
  tweetUsername?: string | undefined;
  tweetId?: string | undefined;
}

export interface MediaInfoForFilename extends MediaItemForFilename {}

// ================================
// 갤러리 관련 타입들
// ================================

/**
 * 갤러리 열기 이벤트
 */
export interface GalleryOpenEventDetail {
  media: MediaItem[];
  startIndex: number;
}

export interface GalleryOpenEvent extends CustomEvent<GalleryOpenEventDetail> {
  type: 'xeg:gallery:open' | 'xeg:openGallery';
}

export interface GalleryCloseEvent extends CustomEvent<void> {
  type: 'xeg:gallery:close';
}

/**
 * 미디어 컬렉션
 */
export interface MediaCollection {
  items: MediaItem[];
  totalCount: number;
  currentIndex: number;
}

// ================================
// 추출 관련 타입들
// ================================

/**
 * 미디어 페이지 타입
 */
export type MediaPageType =
  | 'mediaGrid'
  | 'photoDetail'
  | 'videoDetail'
  | 'mediaTimeline'
  | 'unknown';

/**
 * 추출 전략
 */
export type ExtractionStrategy =
  | 'api-first'
  | 'dom-only'
  | 'hybrid'
  | 'multi-strategy'
  | 'conservative';

/**
 * 추출 신뢰도
 */
export interface ExtractionConfidence {
  overall: number;
  urlMatching: number;
  domStructure: number;
  metadata: number;
  apiData?: number;
}

/**
 * 미디어 매핑
 */
export interface MediaMapping {
  tweetId: string | undefined;
  mediaIndex?: number | undefined;
  confidence: ExtractionConfidence;
  method: string;
  metadata?: Record<string, unknown> | undefined;
}

/**
 * 검증 결과
 */
export interface ValidationResult {
  isValid: boolean;
  errors: ValidationIssue[];
  warnings: ValidationIssue[];
  confidence: number;
}

export interface ValidationIssue {
  code: string;
  message: string;
  severity: 'error' | 'warning';
  field?: string;
}

/**
 * 페이지 타입
 */
export enum PageType {
  TIMELINE = 'timeline',
  SINGLE_TWEET = 'single_tweet',
  MEDIA_TAB = 'media_tab',
  SINGLE_MEDIA = 'single_media',
  PROFILE = 'profile',
  UNKNOWN = 'unknown',
}

/**
 * 추출 소스
 */
export enum ExtractionSource {
  CURRENT_PAGE = 'current_page',
  BACKGROUND_LOAD = 'background_load',
  CACHE = 'cache',
  API = 'api',
}

/**
 * 트윗 URL 정보
 */
export interface TweetUrl {
  url: string;
  username: string;
  tweetId: string;
  isValid: boolean;
}

/**
 * 추출 옵션
 */
export interface ExtractionOptions {
  readonly enableBackgroundLoading: boolean;
  readonly enableCache: boolean;
  readonly maxRetries: number;
  readonly timeout: number;
  readonly fallbackStrategies: boolean;
  readonly debugMode: boolean;
}

export interface MediaExtractionOptions {
  includeVideos?: boolean;
  timeoutMs?: number;
  useApiFallback?: boolean;
  enableBackgroundLoading?: boolean;
  enableValidation?: boolean;
  maxRetries?: number;
}

/**
 * 추출 메타데이터
 */
export interface ExtractionMetadata {
  readonly extractionTime?: number;
  readonly extractedAt?: number;
  readonly strategiesUsed?: string[];
  readonly sourceCount?: number;
  readonly cacheHits?: number;
  readonly retryCount?: number;
  readonly sourceType?: string;
  readonly strategy?: string;
  readonly error?: string;
  readonly performance?: {
    readonly totalTime: number;
    readonly backgroundLoadTime?: number;
    readonly parseTime: number;
  };
  readonly [key: string]: unknown;
}

/**
 * 추출 결과
 */
export interface MediaExtractionResult {
  readonly success: boolean;
  readonly mediaItems: MediaInfo[];
  readonly clickedIndex: number;
  readonly source?: ExtractionSource;
  readonly sourceType?: string;
  readonly metadata: ExtractionMetadata;
  readonly error?: ExtractionError | string;
  readonly tweetInfo?: unknown;
}

/**
 * 추출 컨텍스트
 */
export interface ExtractionContext {
  readonly clickedElement?: HTMLElement;
  readonly currentUrl: string;
  readonly pageType: PageType;
  readonly options: ExtractionOptions;
  readonly timestamp: number;
}

/**
 * 추출 에러 코드
 */
export enum ExtractionErrorCode {
  NETWORK_ERROR = 'NETWORK_ERROR',
  ELEMENT_NOT_FOUND = 'ELEMENT_NOT_FOUND',
  PARSING_ERROR = 'PARSING_ERROR',
  PARSE_ERROR = 'PARSE_ERROR',
  TIMEOUT_ERROR = 'TIMEOUT_ERROR',
  NOT_FOUND_ERROR = 'NOT_FOUND_ERROR',
  NO_MEDIA_FOUND = 'NO_MEDIA_FOUND',
  INVALID_URL_ERROR = 'INVALID_URL_ERROR',
  INVALID_URL = 'INVALID_URL',
  UNKNOWN_ERROR = 'UNKNOWN_ERROR',
}

/**
 * 추출 에러
 */
export class ExtractionError extends Error {
  constructor(
    message: string,
    public readonly code: ExtractionErrorCode,
    public readonly context?: ExtractionContext,
    public override readonly cause?: Error
  ) {
    super(message);
    this.name = 'ExtractionError';
  }
}

// ================================
// 추출 인터페이스들
// ================================

/**
 * 트윗 정보
 */
export interface TweetInfo {
  tweetId: string;
  username: string;
  tweetUrl: string;
  extractionMethod: string;
  confidence: number;
  metadata?: Record<string, unknown>;
}

/**
 * 미디어 추출기 인터페이스
 */
export interface MediaExtractor {
  extractFromClickedElement(
    element: HTMLElement,
    options?: MediaExtractionOptions
  ): Promise<MediaExtractionResult>;

  extractAllFromContainer(
    container: HTMLElement,
    options?: MediaExtractionOptions
  ): Promise<MediaExtractionResult>;
}

/**
 * 트윗 정보 추출 전략
 */
export interface TweetInfoExtractionStrategy {
  extract(element: HTMLElement): TweetInfo | null;
}

/**
 * API 추출기
 */
export interface APIExtractor {
  extract(
    element: HTMLElement,
    options: MediaExtractionOptions,
    extractionId: string,
    tweetInfo?: TweetInfo
  ): Promise<MediaExtractionResult>;
}

/**
 * 백업 추출 전략
 */
export interface FallbackExtractionStrategy {
  extract(element: HTMLElement): Promise<MediaExtractionResult>;
}

/**
 * 트윗 API 미디어 엔트리
 */
export interface TweetMediaEntry {
  type: 'photo' | 'video';
  type_original: 'photo' | 'video' | 'animated_gif';
  download_url: string;
  preview_url: string;
  expanded_url?: string;
  media_id?: string;
  media_key?: string;
  index?: number;
  type_index?: number;
  screen_name?: string;
  tweet_id?: string;
  typeOriginal?: 'photo' | 'video' | 'animated_gif';
  typeIndex?: number;
  tweet_text?: string;
}

/**
 * Twitter API
 */
export interface TwitterAPI {
  getTweetMedia(tweetId: string): Promise<TweetMediaEntry[]>;
}

// ================================
// 유틸리티 함수들
// ================================

/**
 * URL 유효성 검사
 */
export function isValidUrl(url: string): boolean {
  try {
    new URL(url);
    return true;
  } catch {
    return false;
  }
}

/**
 * Twitter 이미지 URL을 원본 해상도로 변환
 */
export function toOriginalUrl(url: string): string {
  return url.replace(/(\?.*)?$/, '?name=orig');
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

  return 'image';
}

/**
 * 안전한 파일명 생성
 */
export function createSafeFilename(filename: string): string {
  return filename
    .replace(/[<>:"/\\|?*]/g, '_')
    .replace(/\s+/g, '_')
    .substring(0, 200);
}

/**
 * MediaEntity 생성 팩토리
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
    const filename = pathname.split('/').pop() || 'media';

    const extensions = {
      image: 'jpg',
      video: 'mp4',
      gif: 'gif',
    };

    const hasExtension = filename.includes('.');
    return hasExtension ? filename : `${filename}.${extensions[type]}`;
  } catch {
    const extensions = {
      image: 'jpg',
      video: 'mp4',
      gif: 'gif',
    };
    return `media_${Date.now()}.${extensions[type]}`;
  }
}
