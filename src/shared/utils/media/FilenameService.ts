/**
 * Copyright (c) 2024 X.com Enhanced Gallery Team
 * Licensed under the MIT License
 * @fileoverview 미디어 파일명 생성 서비스
 */

import type { MediaInfo, MediaItem } from '@core/types/media.types';
import { logger } from '@infrastructure/logging/logger';

/**
 * 파일명 생성 옵션
 */
export interface FilenameOptions {
  index?: string | number;
  extension?: string;
  fallbackPrefix?: string;
}

/**
 * ZIP 파일명 생성 옵션
 */
export interface ZipFilenameOptions {
  fallbackPrefix?: string;
}

/**
 * 미디어 파일명 생성 서비스
 *
 * 트위터 미디어에 대한 일관된 파일명 생성 및 검증을 담당합니다.
 *
 * @example
 * ```typescript
 * const service = MediaFilenameService.getInstance();
 * const filename = service.generateMediaFilename(mediaItem, { index: 1 });
 * // 결과: "username_1234567890_1.jpg"
 * ```
 */
export class MediaFilenameService {
  private static instance: MediaFilenameService;

  /**
   * 싱글톤 인스턴스 획득
   *
   * @returns MediaFilenameService 인스턴스
   */
  public static getInstance(): MediaFilenameService {
    MediaFilenameService.instance ??= new MediaFilenameService();
    return MediaFilenameService.instance;
  }

  private constructor() {}

  /**
   * 미디어 파일명을 생성합니다
   *
   * 트윗 정보(사용자명, 트윗 ID)를 기반으로 일관된 형식의 파일명을 생성합니다.
   * 형식: {유저ID}_{트윗ID}_{인덱스}.{확장자}
   *
   * @param media - 미디어 아이템 또는 미디어 정보 객체
   * @param options - 파일명 생성 옵션
   * @returns 생성된 파일명 문자열
   *
   * @example
   * ```typescript
   * const service = MediaFilenameService.getInstance();
   * const filename = service.generateMediaFilename(media, { index: 1, extension: 'jpg' });
   * // 결과: "username_123456789_1.jpg"
   * ```
   */
  generateMediaFilename(media: MediaItem | MediaInfo, options: FilenameOptions = {}): string {
    try {
      // 기존 파일명이 유효하면 그대로 사용
      if (media.filename && this.isValidMediaFilename(media.filename)) {
        return media.filename;
      }

      if (media.tweetUsername && media.tweetId) {
        const extension = options.extension ?? this.extractExtensionFromUrl(media.url);

        // ID에서 인덱스 추출 (fallback으로 options.index 사용)
        const index = this.extractIndexFromMediaId(media.id) ?? this.normalizeIndex(options.index);

        // 요구사항: {유저ID}_{트윗ID}_{인덱스}.{확장자} 형식
        return `${media.tweetUsername}_${media.tweetId}_${index}.${extension}`;
      }

      return this.generateFallbackFilename(media, options);
    } catch (error) {
      logger.warn('Failed to generate media filename:', error);
      return this.generateFallbackFilename(media, options);
    }
  }

  /**
   * ZIP 파일명을 생성합니다
   *
   * 트윗 작성자와 트윗 ID를 기반으로 ZIP 파일명을 생성합니다.
   * 형식: {authorHandle}_{tweetId}.zip
   *
   * @param mediaItems - 미디어 아이템들의 읽기 전용 배열
   * @param options - ZIP 파일명 생성 옵션
   * @returns 생성된 ZIP 파일명 문자열
   *
   * @example
   * ```typescript
   * const service = MediaFilenameService.getInstance();
   * const zipName = service.generateZipFilename(mediaItems);
   * // 결과: "username_123456789.zip"
   * ```
   */
  generateZipFilename(
    mediaItems: readonly (MediaItem | MediaInfo)[],
    options: ZipFilenameOptions = {}
  ): string {
    try {
      const firstItem = mediaItems[0];
      if (firstItem?.tweetUsername && firstItem?.tweetId) {
        // 요구사항: {authorHandle}_{tweetId}.zip 형식
        return `${firstItem.tweetUsername}_${firstItem.tweetId}.zip`;
      }

      const prefix = options.fallbackPrefix ?? 'xcom_gallery';
      const timestamp = Date.now();
      return `${prefix}_${timestamp}.zip`;
    } catch (error) {
      logger.warn('Failed to generate ZIP filename:', error);
      const timestamp = Date.now();
      return `download_${timestamp}.zip`;
    }
  }

  /**
   * 파일명이 유효한 미디어 파일명 형식인지 검증합니다
   *
   * 새로운 형식: {유저ID}_{트윗ID}_{인덱스}.{확장자}에 맞는지 확인합니다.
   *
   * @param filename - 검증할 파일명 문자열
   * @returns 유효한 형식인지 여부
   *
   * @example
   * ```typescript
   * const service = MediaFilenameService.getInstance();
   * const isValid = service.isValidMediaFilename("username_123456789_1.jpg");
   * // 결과: true
   * ```
   */
  isValidMediaFilename(filename: string): boolean {
    // 새로운 형식: {유저ID}_{트윗ID}_{인덱스}.{확장자}
    const pattern = /^[^_\s]+_\d+_\d+\.\w+$/;
    return pattern.test(filename);
  }

  isValidZipFilename(filename: string): boolean {
    const pattern = /^[^_]+_\d+\.zip$/;
    return pattern.test(filename);
  }

  /**
   * 미디어 ID에서 인덱스 추출
   * 형식: {tweetId}_media_{0-based-index} -> 1-based index 반환
   */
  private extractIndexFromMediaId(mediaId?: string): string | null {
    if (!mediaId) {
      return null;
    }

    try {
      // {tweetId}_media_{index} 형식에서 마지막 인덱스 추출
      const match = mediaId.match(/_media_(\d+)$/);
      if (match) {
        const zeroBasedIndex = parseInt(match[1], 10);
        // 0-based를 1-based로 변환
        return (zeroBasedIndex + 1).toString();
      }

      // 레거시 형식 지원: {tweetId}_{index} 또는 {tweetId}_video_{index}
      const legacyMatch = mediaId.match(/_(\d+)$/);
      if (legacyMatch) {
        return legacyMatch[1];
      }
    } catch (error) {
      logger.debug('Failed to extract index from media ID:', mediaId, error);
    }

    return null;
  }

  private extractExtensionFromUrl(url: string): string {
    try {
      const urlObj = new URL(url);
      const pathname = urlObj.pathname;
      const lastDot = pathname.lastIndexOf('.');
      if (lastDot > 0) {
        const extension = pathname.substring(lastDot + 1);
        if (/^(jpg|jpeg|png|gif|webp|mp4|mov|avi)$/i.test(extension)) {
          return extension.toLowerCase();
        }
      }
    } catch {
      logger.debug('Failed to extract extension from URL:', url);
    }
    return 'jpg';
  }

  private extractIndexFromUrl(url: string): string {
    try {
      const urlObj = new URL(url);
      const pathname = urlObj.pathname;
      const matches = pathname.match(/(\d+)(?=\.\w+$)/);
      return matches?.[1] ?? '1';
    } catch {
      logger.debug('Failed to extract index from URL:', url);
      return '1';
    }
  }

  /**
   * 인덱스를 1-based 숫자로 정규화
   * @param index - 정규화할 인덱스 (string | number | undefined)
   * @returns 1-based 인덱스 문자열 (최소값: "1")
   */
  private normalizeIndex(index?: string | number): string {
    if (index === undefined || index === null) {
      return '1';
    }

    const numIndex = typeof index === 'string' ? parseInt(index, 10) : index;

    // 유효하지 않은 숫자인 경우 기본값 반환
    if (isNaN(numIndex)) {
      return '1';
    }

    // 이미 1-based이거나 그보다 큰 경우 그대로 사용
    if (numIndex >= 1) {
      return numIndex.toString();
    }

    // 0-based를 1-based로 변환 (0 -> 1, -1 -> 1)
    return Math.max(numIndex + 1, 1).toString();
  }

  private generateFallbackFilename(
    media: MediaItem | MediaInfo,
    options: FilenameOptions = {}
  ): string {
    const prefix = options.fallbackPrefix ?? 'media';
    const extension = options.extension ?? this.extractExtensionFromUrl(media.url);
    const timestamp = Date.now();
    const index = this.normalizeIndex(options.index);
    return `${prefix}_${timestamp}_${index}.${extension}`;
  }
}

// 편의 함수들
/**
 * 미디어 파일명 생성 편의 함수
 *
 * @param media - 미디어 정보 객체
 * @param options - 파일명 생성 옵션
 * @returns 생성된 파일명
 *
 * @example
 * ```typescript
 * const filename = generateMediaFilename(mediaItem, { index: 2, extension: 'png' });
 * // 결과: "username_1234567890_2.png"
 * ```
 */
export function generateMediaFilename(
  media: MediaItem | MediaInfo,
  options?: FilenameOptions
): string {
  return MediaFilenameService.getInstance().generateMediaFilename(media, options);
}

/**
 * ZIP 파일명 생성 편의 함수
 *
 * @param mediaItems - 미디어 아이템 배열
 * @param options - ZIP 파일명 생성 옵션
 * @returns 생성된 ZIP 파일명
 *
 * @example
 * ```typescript
 * const zipName = generateZipFilename(mediaItems);
 * // 결과: "username_1234567890.zip"
 * ```
 */
export function generateZipFilename(
  mediaItems: readonly (MediaItem | MediaInfo)[],
  options?: ZipFilenameOptions
): string {
  return MediaFilenameService.getInstance().generateZipFilename(mediaItems, options);
}

/**
 * 미디어 파일명 유효성 검증 편의 함수
 *
 * @param filename - 검증할 파일명
 * @returns 유효성 검증 결과
 *
 * @example
 * ```typescript
 * const isValid = isValidMediaFilename("username_1234567890_1.jpg");
 * // 결과: true
 * ```
 */
export function isValidMediaFilename(filename: string): boolean {
  return MediaFilenameService.getInstance().isValidMediaFilename(filename);
}

/**
 * ZIP 파일명 유효성 검증 편의 함수
 *
 * @param filename - 검증할 ZIP 파일명
 * @returns 유효성 검증 결과
 *
 * @example
 * ```typescript
 * const isValid = isValidZipFilename("username_1234567890.zip");
 * // 결과: true
 * ```
 */
export function isValidZipFilename(filename: string): boolean {
  return MediaFilenameService.getInstance().isValidZipFilename(filename);
}
