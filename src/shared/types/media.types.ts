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
  readonly id: string;
  readonly url: string;
  readonly originalUrl?: string | undefined;
  readonly type: 'image' | 'video' | 'gif';
  readonly filename?: string | undefined;
  readonly fileSize?: number | undefined;
  readonly width?: number | undefined;
  readonly height?: number | undefined;
  readonly thumbnailUrl?: string | undefined;
  readonly alt?: string | undefined;
  readonly tweetUsername?: string | undefined;
  readonly tweetId?: string | undefined;
  readonly tweetUrl?: string | undefined;
  readonly tweetText?: string | undefined;
  /** Phase 2: Sanitized HTML from DOM */
  readonly tweetTextHTML?: string | undefined;
  readonly metadata?: Record<string, unknown> | undefined;
  /** Media source location (quote tweet case) */
  readonly sourceLocation?: 'original' | 'quoted' | undefined;
  /** Quoted tweet ID (quote tweet case) */
  readonly quotedTweetId?: string | undefined;
  /** Quoted tweet author (quote tweet case) */
  readonly quotedUsername?: string | undefined;
  /** Quoted tweet URL (quote tweet case) */
  readonly quotedTweetUrl?: string | undefined;
}

/**
 * Media entity (with time information)
 */
export interface MediaEntity extends MediaInfo {
  readonly createdAt: Date;
  readonly updatedAt: Date;
}

/**
 * MediaInfoWithFilename - Media information with filename (for download)
 *
 * Version of MediaInfo with required fields
 */
export interface MediaInfoWithFilename extends MediaInfo {
  /** Media unique identifier (required) */
  readonly id: string;
  /** Original page URL (required) */
  readonly originalUrl: string;
  /** Filename to save (required) */
  readonly filename: string;
}

// ================================
// Extraction-related types
// ================================

/**
 * Tweet information interface
 */
export interface TweetInfo {
  /** Tweet ID */
  readonly tweetId: string;
  /** Username */
  readonly username: string;
  /** Tweet URL */
  readonly tweetUrl: string;
  /** Extraction method */
  readonly extractionMethod: string;
  /** Extraction confidence (0-1) */
  readonly confidence: number;
  /** Additional metadata */
  readonly metadata?: Record<string, unknown> | undefined;
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
  readonly isQuoteTweet: boolean;
  /** Location where clicked */
  readonly clickedLocation: 'quoted' | 'original' | 'unknown';
  /** Original tweet ID (quote tweet only) */
  readonly quotedTweetId?: string | undefined;
  /** Original tweet author (quote tweet only) */
  readonly quotedUsername?: string | undefined;
  /** Media source indicator */
  readonly sourceLocation?: 'original' | 'quoted' | undefined;
}

/**
 * Media extraction options
 */
export interface MediaExtractionOptions {
  /** Include videos */
  readonly includeVideos?: boolean | undefined;
  /** Timeout (milliseconds) */
  readonly timeoutMs?: number | undefined;
  /** Use API fallback */
  readonly useApiFallback?: boolean | undefined;
  /** Enable background loading */
  readonly enableBackgroundLoading?: boolean | undefined;
  /** Enable validation */
  readonly enableValidation?: boolean | undefined;
}

/**
 * Page type definition (merged from Core)
 * Using const object for tree-shaking optimization.
 */
export const PageType = {
  TIMELINE: 'timeline',
  SINGLE_TWEET: 'single_tweet',
  MEDIA_TAB: 'media_tab',
  SINGLE_MEDIA: 'single_media',
  PROFILE: 'profile',
  UNKNOWN: 'unknown',
} as const;

/** Type for PageType values */
export type PageType = (typeof PageType)[keyof typeof PageType];

/**
 * Extraction source type (merged from Core)
 * Using const object for tree-shaking optimization.
 */
export const ExtractionSource = {
  CURRENT_PAGE: 'current_page',
  BACKGROUND_LOAD: 'background_load',
  CACHE: 'cache',
  API: 'api',
} as const;

/** Type for ExtractionSource values */
export type ExtractionSource = (typeof ExtractionSource)[keyof typeof ExtractionSource];

/**
 * Extraction metadata (merged from Core)
 */
interface ExtractionMetadata {
  readonly extractionTime?: number | undefined;
  readonly extractedAt?: number | undefined;
  readonly strategiesUsed?: readonly string[] | undefined;
  readonly sourceCount?: number | undefined;
  readonly cacheHits?: number | undefined;
  readonly retryCount?: number | undefined;
  readonly sourceType?: string | undefined;
  readonly strategy?: string | undefined;
  readonly error?: string | undefined;
  readonly [key: string]: unknown;
}

/**
 * Media extraction result
 */
export interface MediaExtractionResult {
  readonly mediaItems: MediaInfo[];
  readonly success: boolean;
  readonly errors?: readonly ExtractionError[] | undefined;
  readonly clickedIndex?: number | undefined;
  readonly tweetInfo?: TweetInfo | null | undefined;
  /** Backward compatibility with core version */
  readonly source?: ExtractionSource | undefined;
  readonly sourceType?: string | undefined;
  readonly metadata?:
    | ExtractionMetadata
    | {
        readonly extractionMethod?: string | undefined;
        readonly extractionTime?: number | undefined;
        readonly source?: string | undefined;
        readonly extractionId?: string | undefined;
        readonly extractedAt?: number | undefined;
        readonly sourceType?: string | undefined;
        readonly error?: string | undefined;
        readonly [key: string]: unknown;
      }
    | undefined;
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
  readonly startIndex?: number | undefined;
  /** Class name */
  readonly className?: string | undefined;
  /** Tweet ID */
  readonly tweetId?: string | undefined;
  /** Show download button */
  readonly showDownloadButton?: boolean | undefined;
  /** Show filenames */
  readonly showFilenames?: boolean | undefined;
  /** Auto play */
  readonly autoPlay?: boolean | undefined;
  /** Optional ambient video pause context */
  readonly pauseContext?: AmbientVideoPauseRequest | undefined;
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
