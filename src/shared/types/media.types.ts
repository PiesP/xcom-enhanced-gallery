/**
 * @fileoverview Integrated media type definitions
 * @version 4.1.0 - Phase 327: MediaType SSOT establishment (constants.ts single source)
 *
 * All media-related types unified in one place:
 * - media.types.ts (core media types)
 * - core/media.types.ts (extraction and gallery related) ← Merge completed
 * - extraction.types.ts (extraction strategies and options) ← Planned merge
 */

// ================================
// Basic media types (re-exported from constants.ts - SSOT)
// ================================

// MediaType and MediaQuality are single sources in constants.ts
export type { MediaType, MediaQuality } from '@/constants';
// Import ErrorCode for integration (provide ExtractionErrorCode alias)
import type { ErrorCode } from './result.types';

/**
 * Brand type base structure
 */
type Brand<T, B> = T & { readonly __brand: B };

/**
 * Media ID brand type
 */
export type MediaId = Brand<string, 'MediaId'>;

/**
 * Basic media information
 */
export interface MediaInfo {
  id: string;
  url: string;
  originalUrl?: string | undefined;
  type: 'image' | 'video' | 'gif';
  filename?: string;
  fileSize?: number;
  width?: number;
  height?: number;
  thumbnailUrl?: string;
  alt?: string;
  tweetUsername?: string | undefined;
  tweetId?: string | undefined;
  tweetUrl?: string;
  tweetText?: string | undefined;
  tweetTextHTML?: string | undefined; // Phase 2: Sanitized HTML from DOM
  metadata?: Record<string, unknown>;
  // Phase 342: Quote tweet fields
  /** Media source location (quote tweet case) */
  sourceLocation?: 'original' | 'quoted' | undefined;
  /** Quoted tweet ID (quote tweet case) */
  quotedTweetId?: string | undefined;
  /** Quoted tweet author (quote tweet case) */
  quotedUsername?: string | undefined;
  /** Quoted tweet URL (quote tweet case) */
  quotedTweetUrl?: string | undefined;
}

/**
 * Media entity (with time information)
 */
export interface MediaEntity extends MediaInfo {
  readonly createdAt: Date;
  readonly updatedAt: Date;
}

/**
 * Media item (MediaInfo alias)
 */

/**
 * MediaInfoWithFilename - Media information with filename (for download)
 *
 * Version of MediaInfo with required fields
 */
export interface MediaInfoWithFilename extends MediaInfo {
  /** Media unique identifier (required) */
  id: string;
  /** Original page URL (required) */
  originalUrl: string;
  /** Filename to save (required) */
  filename: string;
}

// ================================
// Extraction-related types
// ================================

/**
 * Tweet information interface
 */
export interface TweetInfo {
  /** Tweet ID */
  tweetId: string;
  /** Username */
  username: string;
  /** Tweet URL */
  tweetUrl: string;
  /** Extraction method */
  extractionMethod: string;
  /** Extraction confidence (0-1) */
  confidence: number;
  /** Additional metadata */
  metadata?: Record<string, unknown>;
}

/**
 * Phase 342: Quote tweet information interface
 *
 * Represents the structure of a quote tweet (Quote Tweet):
 * - isQuoteTweet: Whether it is a quote tweet
 * - clickedLocation: Where it was clicked (quoted vs original)
 * - quotedTweetId: Original quoted tweet ID
 * - quotedUsername: Quoted tweet author
 * - sourceLocation: Media source from API response (quoted vs original)
 */
export interface QuoteTweetInfo {
  /** Whether it is a quote tweet */
  isQuoteTweet: boolean;
  /** Location where clicked */
  clickedLocation: 'quoted' | 'original' | 'unknown';
  /** Original tweet ID (quote tweet only) */
  quotedTweetId?: string | undefined;
  /** Original tweet author (quote tweet only) */
  quotedUsername?: string | undefined;
  /** Media source indicator */
  sourceLocation?: 'original' | 'quoted' | undefined;
}

/**
 * Media extraction options
 */
export interface MediaExtractionOptions {
  /** Include videos */
  includeVideos?: boolean;
  /** Timeout (milliseconds) */
  timeoutMs?: number;
  /** Use API fallback */
  useApiFallback?: boolean;
  /** Enable background loading */
  enableBackgroundLoading?: boolean;
  /** Enable validation */
  enableValidation?: boolean;
}

/**
 * Page type definition (merged from Core)
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
 * Extraction source type (merged from Core)
 */
export enum ExtractionSource {
  CURRENT_PAGE = 'current_page',
  BACKGROUND_LOAD = 'background_load',
  CACHE = 'cache',
  API = 'api',
}

/**
 * Tweet URL information (merged from Core)
 */
export interface TweetUrl {
  readonly url: string;
  readonly tweetId: string;
  readonly userId: string;
  readonly mediaIndex?: number | undefined;
  readonly isValid: boolean;
}

/**
 * Extraction options detailed (merged from Core)
 */
export interface ExtractionOptions {
  readonly enableBackgroundLoading: boolean;
  readonly enableCache: boolean;
  readonly timeout: number;
  readonly debugMode: boolean;
}

/**
 * Extraction metadata (merged from Core)
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
 * Extraction context (merged from Core)
 */
export interface ExtractionContext {
  readonly clickedElement?: HTMLElement;
  readonly currentUrl: string;
  readonly pageType: PageType;
  readonly options: ExtractionOptions;
  readonly timestamp: number;
}

/**
 * Extraction confidence score (merged from Core)
 */
export interface ExtractionConfidence {
  /** Overall confidence (0-1) */
  overall: number;
  /** URL matching confidence */
  urlMatching: number;
  /** DOM structure confidence */
  domStructure: number;
  /** Metadata confidence */
  metadata: number;
  /** API data confidence */
  apiData?: number;
}

/**
 * Media extraction result
 */
export interface MediaExtractionResult {
  mediaItems: MediaInfo[];
  success: boolean;
  errors?: ExtractionError[];
  clickedIndex?: number | undefined;
  tweetInfo?: TweetInfo | null | undefined;
  // Backward compatibility with core version
  source?: ExtractionSource;
  sourceType?: string;
  metadata?:
    | ExtractionMetadata
    | {
        extractionMethod?: string;
        extractionTime?: number;
        source?: string;
        extractionId?: string;
        extractedAt?: number;
        sourceType?: string;
        error?: string;
        [key: string]: unknown;
      };
}

// ExtractionErrorCode was removed in Phase 353
// Use ErrorCode directly: import { ErrorCode } from '@shared/types'

/**
 * Extraction error class
 */
export class ExtractionError extends Error {
  constructor(
    public readonly code: ErrorCode,
    message: string,
    public readonly originalError?: Error
  ) {
    super(message);
    this.name = 'ExtractionError';
  }
}

/**
 * Tweet information extraction strategy interface
 */
export interface TweetInfoExtractionStrategy {
  /** Strategy name */
  readonly name: string;
  /** Strategy priority (lower has higher priority) */
  readonly priority: number;

  /**
   * Extract tweet information
   */
  extract(element: HTMLElement): Promise<TweetInfo | null>;
}

/**
 * API extractor interface
 */
export interface APIExtractor {
  /**
   * Media extraction via API
   */
  extract(
    tweetInfo: TweetInfo,
    clickedElement: HTMLElement,
    options: MediaExtractionOptions,
    extractionId: string
  ): Promise<MediaExtractionResult>;
}

/**
 * Fallback extraction strategy interface
 */
export interface FallbackExtractionStrategy {
  /**
   * Execute fallback extraction
   */
  extract(
    tweetContainer: HTMLElement,
    clickedElement: HTMLElement,
    tweetInfo?: TweetInfo
  ): Promise<MediaExtractionResult>;
}

/**
 * Media extractor interface
 */
export interface MediaExtractor {
  /**
   * Extract media from clicked element
   */
  extractFromClickedElement(
    element: HTMLElement,
    options?: MediaExtractionOptions
  ): Promise<MediaExtractionResult>;

  /**
   * Extract all media from container
   */
  extractAllFromContainer(
    container: HTMLElement,
    options?: MediaExtractionOptions
  ): Promise<MediaExtractionResult>;
}

// ================================
// Download-related types
// ================================

/**
 * Download media item
 */
export interface DownloadMediaItem extends MediaInfo {
  downloadProgress?: number | undefined;
  downloadStatus?: 'pending' | 'downloading' | 'completed' | 'failed' | undefined;
}

/**
 * Interface representing URL and filename pairs
 */
export interface UrlWithFilename {
  /** URL of file to download */
  url: string;
  /** Filename */
  filename: string;
}

/**
 * Bulk download options
 */
export interface BulkDownloadOptions {
  /** Limit for parallel downloads */
  concurrency?: number;
  /** Download delay (ms) */
  delay?: number;
  /** Whether to compress into ZIP file */
  createZip?: boolean;
  /** ZIP filename (when createZip is true) */
  zipFilename?: string;
}

// ================================
// Gallery-related types
// ================================

/**
 * Gallery rendering options
 *
 * Options passed to GalleryRenderer in Features layer
 */
export interface GalleryRenderOptions {
  /** Start index */
  startIndex?: number | undefined;
  /** View mode */
  viewMode?: 'horizontal' | 'vertical' | undefined;
  /** Class name */
  className?: string | undefined;
  /** Tweet ID */
  tweetId?: string | undefined;
  /** Enable keyboard navigation */
  enableKeyboardNavigation?: boolean;
  /** Show download button */
  showDownloadButton?: boolean;
  /** Show filenames */
  showFilenames?: boolean;
  /** Auto play */
  autoPlay?: boolean;
}

/**
 * Gallery open event details (merged from Core)
 */
export interface GalleryOpenEventDetail {
  /** Media items list */
  media: MediaInfo[];
  /** Start index */
  startIndex: number;
}

/**
 * Gallery open custom event (merged from Core)
 */
export interface GalleryOpenEvent extends CustomEvent<GalleryOpenEventDetail> {
  type: 'xeg:gallery:open' | 'xeg:openGallery';
}

/**
 * Gallery close custom event (merged from Core)
 */
export interface GalleryCloseEvent extends CustomEvent<void> {
  type: 'xeg:gallery:close';
}

/**
 * Media collection interface (merged from Core)
 */
export interface MediaCollection {
  items: MediaInfo[];
  totalCount: number;
  currentIndex: number;
}

/**
 * Media page type (Core version - more detailed)
 *
 * Root version: 'photo' | 'video' | 'gif' | 'mixed' | 'photoDetail' | 'videoDetail'
 * Core version: 'mediaGrid' | 'photoDetail' | 'videoDetail' | 'mediaTimeline' | 'unknown'
 * → Integrated: union type allows all
 */
export type MediaPageType =
  | 'photo'
  | 'video'
  | 'gif'
  | 'mixed'
  | 'photoDetail'
  | 'videoDetail'
  | 'mediaGrid'
  | 'mediaTimeline'
  | 'timeline'
  | 'unknown';

/**
 * Media extraction strategy
 */
export type ExtractionStrategy =
  | 'api-first'
  | 'dom-only'
  | 'hybrid'
  | 'multi-strategy'
  | 'conservative';

// ================================
// Validation-related types
// ================================

/**
 * Validation issue (merged from Core)
 */
export interface ValidationIssue {
  /** Issue type */
  type: 'url' | 'metadata' | 'content' | 'structure';
  /** Severity */
  severity: 'low' | 'medium' | 'high' | 'critical';
  /** Issue description */
  message: string;
  /** Affected field */
  field?: string;
}

/**
 * Validation result (merged from Core)
 */
export interface ValidationResult {
  /** Validity */
  isValid: boolean;
  /** Overall score (0-1) */
  score: number;
  /** Found issues */
  issues: ValidationIssue[];
  /** Improvement suggestions */
  suggestions: string[];
}

/**
 * Media validation result (legacy version - simpler)
 */
export interface MediaValidationResult {
  isValid: boolean;
  errors: string[];
  warnings?: string[];
}

// ================================
// Metadata types
// ================================

/**
 * Media metadata
 */
export interface MediaMetadata {
  /** File size (bytes) */
  fileSize?: number;
  /** Image/video dimensions */
  dimensions?: {
    width: number;
    height: number;
  };
  /** Video length (seconds) */
  duration?: number;
  /** MIME type */
  mimeType?: string;
  /** Creation date */
  createdAt?: Date;
  /** Additional attributes */
  [key: string]: unknown;
}
