// SPDX-License-Identifier: MIT
// Copyright (c) 2024-2026 PiesP

/**
 * @fileoverview Integrated media type definitions
 */

/**
 * Error codes for machine-readable error identification.
 *
 * Using const object instead of enum for tree-shaking optimization.
 */
export const ErrorCode = {
  NONE: 'NONE',
  CANCELLED: 'CANCELLED',
  EMPTY_INPUT: 'EMPTY_INPUT',
  ALL_FAILED: 'ALL_FAILED',
  NO_MEDIA_FOUND: 'NO_MEDIA_FOUND',
} as const;

/** Type for ErrorCode values */
export type ErrorCode = (typeof ErrorCode)[keyof typeof ErrorCode];

/** Basic media information */
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
  /** Sanitized HTML from DOM */
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

/** Tweet information interface */
export interface TweetInfo {
  readonly tweetId: string;
  readonly username: string;
  readonly tweetUrl: string;
  readonly extractionMethod: string;
  readonly confidence: number;
  readonly metadata?: Record<string, unknown> | undefined;
}

/** Media extraction options */
export interface MediaExtractionOptions {
  readonly includeVideos?: boolean | undefined;
  readonly timeoutMs?: number | undefined;
  readonly useApiFallback?: boolean | undefined;
  readonly enableBackgroundLoading?: boolean | undefined;
  readonly enableValidation?: boolean | undefined;
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
  readonly metadata?: Record<string, unknown> | undefined;
}

/** Extraction error class */
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
 * Creates a standardized failure result for media extraction.
 * Used by extractors when extraction fails at any stage.
 */
export function createFailureResult(
  error: string,
  sourceType: string,
  strategy: string
): MediaExtractionResult {
  return {
    success: false,
    mediaItems: [],
    clickedIndex: 0,
    metadata: {
      extractedAt: performance.now(),
      sourceType,
      strategy,
      error,
    },
    tweetInfo: null,
  };
}

/** Media extractor strategy interface */
export interface MediaExtractorStrategy {
  extract(
    tweetInfo: TweetInfo,
    clickedElement: HTMLElement,
    options: MediaExtractionOptions,
    extractionId: string
  ): Promise<MediaExtractionResult>;
}

/** Media extractor interface */
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

// ================================
// Gallery-related types
// ================================

/** Gallery rendering options */
export interface GalleryRenderOptions {
  readonly startIndex?: number | undefined;
}
