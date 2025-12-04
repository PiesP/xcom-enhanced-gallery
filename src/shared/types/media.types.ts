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
export type { MediaQuality, MediaType } from '@constants';

// Import ErrorCode for integration (provide ExtractionErrorCode alias)
import type { AmbientVideoPauseRequest } from '@shared/utils/media/ambient-video-coordinator';
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
  readonly [key: string]: unknown;
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
  /** Class name */
  className?: string | undefined;
  /** Tweet ID */
  tweetId?: string | undefined;
  /** Show download button */
  showDownloadButton?: boolean;
  /** Show filenames */
  showFilenames?: boolean;
  /** Auto play */
  autoPlay?: boolean;
  /** Optional ambient video pause context */
  pauseContext?: AmbientVideoPauseRequest;
}

/**
 * Media extraction strategy
 */
export type ExtractionStrategy =
  | 'api-first'
  | 'dom-only'
  | 'hybrid'
  | 'multi-strategy'
  | 'conservative';
