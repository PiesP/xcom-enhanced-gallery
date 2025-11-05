/**
 * Copyright (c) 2024 X.com Enhanced Gallery Team
 * Licensed under the MIT License
 * @fileoverview 미디어 파일명 생성 서비스
 * @version 2.1.0 - File Naming Services
 */

import { logger } from '../../logging';
import { safeParseInt, undefinedToNull } from '../../utils/type-safety-helpers';
import type { MediaInfoForFilename, MediaItemForFilename } from '../../types/media.types';

/**
 * 파일명 생성 옵션
 */
export interface FilenameOptions {
  index?: string | number;
  extension?: string;
  fallbackPrefix?: string;
  fallbackUsername?: string;
  date?: Date;
}

/**
 * 날짜를 YYYYMMDD 형식(예: "20250101")으로 변환합니다.
 * @param date - 변환할 날짜 (기본값: 현재 시간)
 * @returns YYYYMMDD 형식의 문자열
 */
const formatDateAsYYYYMMDD = (date: Date = new Date()): string => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}${month}${day}`;
};

/**
 * ZIP 파일명 생성 옵션
 */
export interface ZipFilenameOptions {
  fallbackPrefix?: string;
}

// ===== 검증 패턴 상수 =====

/** 미디어 파일명 검증 패턴: {username}_{tweetId}_{YYYYMMDD}_{index}.{ext} */
const MEDIA_FILENAME_PATTERN = /^[a-zA-Z0-9_]+_\d{10,19}_\d{8}_\d+\.[a-zA-Z0-9]+$/;

/** ZIP 파일명 검증 패턴: {username}_{tweetId}_{YYYYMMDD}.zip */
const ZIP_FILENAME_PATTERN = /^[a-zA-Z0-9_]+_\d{10,19}_\d{8}\.zip$/;

/** 지원되는 파일 확장자 */
const SUPPORTED_EXTENSIONS = /^(jpg|jpeg|png|gif|webp|mp4|mov|avi)$/i;

/**
 * 파일명 생성 서비스
 *
 * 트위터 미디어에 대한 일관된 파일명 생성 및 검증을 담당합니다.
 * Windows 호환성, 유니코드 정규화, 보안 검증을 포함합니다.
 *
 * 파일명 형식:
 * - 미디어: `{username}_{tweetId}_{YYYYMMDD}_{index}.{extension}`
 * - ZIP: `{username}_{tweetId}_{YYYYMMDD}.zip`
 *
 * @example
 * ```typescript
 * const service = new FilenameService();
 * const filename = service.generateMediaFilename(mediaInfo, { index: 1 });
 * // 결과: "username_1234567890_20250101_1.jpg"
 * const zipFilename = service.generateZipFilename([mediaInfo]);
 * // 결과: "username_1234567890_20250101.zip"
 * ```
 */
export class FilenameService {
  /**
   * 미디어 파일명 생성
   *
   * 형식: `{username}_{tweetId}_{YYYYMMDD}_{index}.{extension}`
   *
   * @param media - 미디어 정보
   * @param options - 생성 옵션
   * @returns 생성된 파일명
   */
  generateMediaFilename(
    media: MediaItemForFilename | MediaInfoForFilename,
    options: FilenameOptions = {}
  ): string {
    try {
      // 기존 파일명이 유효하면 그대로 사용
      if (media.filename && this.isValidMediaFilename(media.filename)) {
        return this.sanitizeForWindows(media.filename);
      }

      const yyyymmdd = formatDateAsYYYYMMDD(options.date);
      const extension = options.extension ?? this.extractExtensionFromUrl(media.url);
      const index = this.extractIndexFromMediaId(media.id) ?? this.normalizeIndex(options.index);

      // 사용자명 결정 (우선순위: tweetUsername > 추출된 사용자명 > fallbackUsername)
      let username: string | null = null;

      if (media.tweetUsername && media.tweetUsername !== 'unknown') {
        username = media.tweetUsername;
      } else {
        const urlToCheck = ('originalUrl' in media ? media.originalUrl : null) || media.url;
        username = typeof urlToCheck === 'string' ? this.extractUsernameFromUrl(urlToCheck) : null;
      }

      username ||= options.fallbackUsername || null;

      // 사용자명과 트윗ID가 있으면 표준 형식으로 생성
      if (username && media.tweetId) {
        return this.sanitizeForWindows(
          `${username}_${media.tweetId}_${yyyymmdd}_${index}.${extension}`
        );
      }

      // 폴백: 타임스탬프 기반 파일명
      return this.sanitizeForWindows(this.generateFallbackFilename(media, options));
    } catch (error) {
      logger.warn('Failed to generate media filename:', error);
      return this.sanitizeForWindows(this.generateFallbackFilename(media, options));
    }
  }

  /**
   * ZIP 파일명 생성
   *
   * 형식: `{username}_{tweetId}_{YYYYMMDD}.zip` 또는 `{fallbackPrefix}_{timestamp}.zip`
   *
   * @param mediaItems - 미디어 아이템 배열
   * @param options - 생성 옵션
   * @returns 생성된 ZIP 파일명
   */
  generateZipFilename(
    mediaItems: readonly (MediaItemForFilename | MediaInfoForFilename)[],
    options: ZipFilenameOptions = {}
  ): string {
    try {
      const firstItem = mediaItems[0];
      if (firstItem?.tweetUsername && firstItem?.tweetId) {
        const yyyymmdd = formatDateAsYYYYMMDD();
        return this.sanitizeForWindows(
          `${firstItem.tweetUsername}_${firstItem.tweetId}_${yyyymmdd}.zip`
        );
      }

      const prefix = options.fallbackPrefix ?? 'xcom_gallery';
      const timestamp = Date.now();
      return this.sanitizeForWindows(`${prefix}_${timestamp}.zip`);
    } catch (error) {
      logger.warn('Failed to generate ZIP filename:', error);
      const timestamp = Date.now();
      return this.sanitizeForWindows(`download_${timestamp}.zip`);
    }
  }

  /**
   * 미디어 파일명 유효성 검증
   *
   * 형식: `{name}_{id}_{YYYYMMDD}_{index}.{ext}`
   * 예: piesp_1234567890_20250101_1.jpg
   *
   * @param filename - 검증할 파일명
   * @returns 유효 여부
   */
  isValidMediaFilename(filename: string): boolean {
    return MEDIA_FILENAME_PATTERN.test(filename);
  }

  /**
   * ZIP 파일명 유효성 검증
   *
   * 형식: `{name}_{id}_{YYYYMMDD}.zip`
   * 예: piesp_1234567890_20250101.zip
   *
   * @param filename - 검증할 파일명
   * @returns 유효 여부
   */
  isValidZipFilename(filename: string): boolean {
    return ZIP_FILENAME_PATTERN.test(filename);
  }

  // ===== Private Helpers =====

  private extractIndexFromMediaId(mediaId?: string): string | null {
    if (!mediaId) return null;

    try {
      const match = mediaId.match(/_media_(\d+)$/);
      if (match) {
        const zeroBasedIndex = safeParseInt(match[1], 10);
        return (zeroBasedIndex + 1).toString();
      }

      const previousMatch = mediaId.match(/_(\d+)$/);
      if (previousMatch) {
        return undefinedToNull(previousMatch[1]);
      }
    } catch (error) {
      logger.debug('Failed to extract index from media ID:', mediaId, error);
    }

    return null;
  }

  private extractExtensionFromUrl(url: string): string {
    try {
      let URLConstructor: typeof URL | undefined;

      if (typeof globalThis !== 'undefined' && typeof globalThis.URL === 'function') {
        URLConstructor = globalThis.URL;
      } else if (typeof window !== 'undefined' && typeof window.URL === 'function') {
        URLConstructor = window.URL;
      }

      if (!URLConstructor) {
        const lastSlashIndex = url.lastIndexOf('/');
        const pathname = lastSlashIndex >= 0 ? url.substring(lastSlashIndex) : url;
        const lastDot = pathname.lastIndexOf('.');
        if (lastDot > 0) {
          const extension = pathname.substring(lastDot + 1);
          if (SUPPORTED_EXTENSIONS.test(extension)) {
            return extension.toLowerCase();
          }
        }
        return 'jpg';
      }

      const urlObj = new URLConstructor(url);
      const pathname = urlObj.pathname;
      const lastDot = pathname.lastIndexOf('.');
      if (lastDot > 0) {
        const extension = pathname.substring(lastDot + 1);
        if (SUPPORTED_EXTENSIONS.test(extension)) {
          return extension.toLowerCase();
        }
      }
    } catch {
      logger.debug('Failed to extract extension from URL:', url);
    }
    return 'jpg';
  }

  private normalizeIndex(index?: string | number): string {
    if (index === undefined || index === null) return '1';

    const numIndex = typeof index === 'string' ? safeParseInt(index, 10) : index;

    if (isNaN(numIndex)) return '1';
    if (numIndex >= 1) return numIndex.toString();

    return Math.max(numIndex + 1, 1).toString();
  }

  private generateFallbackFilename(
    media: MediaItemForFilename | MediaInfoForFilename,
    options: FilenameOptions = {}
  ): string {
    const prefix = options.fallbackPrefix ?? 'media';
    const extension = options.extension ?? this.extractExtensionFromUrl(media.url);
    const timestamp = Date.now();
    const index = this.normalizeIndex(options.index);
    return `${prefix}_${timestamp}_${index}.${extension}`;
  }

  /**
   * Windows 파일시스템 호환 정규화
   * - 유니코드 정규화 (NFKC)
   * - 제어 문자 및 BiDi 마커 제거
   * - 금지 문자 치환
   * - 예약어 방지
   */
  private sanitizeForWindows(name: string): string {
    try {
      if (!name) return 'media';
      let base = String(name);

      // 유니코드 정규화
      if (typeof base.normalize === 'function') {
        try {
          base = base.normalize('NFKC');
        } catch {
          // ignore
        }
      }

      // 제어 문자 및 BiDi 마커 제거
      base = Array.from(base)
        .filter(ch => {
          const cp = ch.codePointAt(0) ?? 0;
          if (cp <= 0x001f) return false;
          if (cp >= 0x007f && cp <= 0x009f) return false;
          if (cp >= 0x200b && cp <= 0x200f) return false;
          if (cp >= 0x202a && cp <= 0x202e) return false;
          if (cp === 0x2060) return false;
          if (cp >= 0x2066 && cp <= 0x2069) return false;
          return true;
        })
        .join('');

      // 파일명과 확장자 분리
      const lastDot = base.lastIndexOf('.');
      const hasExt = lastDot > 0 && lastDot < base.length - 1;
      const pure = hasExt ? base.slice(0, lastDot) : base;
      const ext = hasExt ? base.slice(lastDot) : '';

      // 금지 문자 치환
      let safe = pure.replace(/[<>:"/\\|?*]/g, '_');

      // 선행/후행 공백/마침표 제거
      safe = safe.replace(/[\s.]+$/g, '');
      safe = safe.replace(/^[\s.]+/g, '');

      // 예약어 방지
      const reserved = new Set([
        'con',
        'prn',
        'aux',
        'nul',
        'com1',
        'com2',
        'com3',
        'com4',
        'com5',
        'com6',
        'com7',
        'com8',
        'com9',
        'lpt1',
        'lpt2',
        'lpt3',
        'lpt4',
        'lpt5',
        'lpt6',
        'lpt7',
        'lpt8',
        'lpt9',
      ]);
      if (reserved.has(safe.toLowerCase())) {
        safe = `_${safe}`;
      }

      if (!safe) safe = 'media';

      // 길이 제한 (255자)
      const result = (safe + ext).slice(0, 255);
      return result;
    } catch {
      return name || 'media';
    }
  }

  private extractUsernameFromUrl(url: string): string | null {
    try {
      const match = url.match(/(?:twitter\.com|x\.com)\/([^/?#]+)/);
      if (match?.[1]) {
        const username = match[1];

        // 예약된 경로 제외
        const reserved = [
          'i',
          'home',
          'explore',
          'notifications',
          'messages',
          'bookmarks',
          'lists',
          'profile',
          'more',
          'compose',
          'search',
          'settings',
          'help',
          'display',
          'moments',
          'topics',
          'login',
          'logout',
          'signup',
          'account',
          'privacy',
          'tos',
        ];

        if (reserved.includes(username.toLowerCase())) return null;

        // 유효한 사용자명 패턴
        if (/^[a-zA-Z0-9_]{1,15}$/.test(username)) {
          return username;
        }
      }
      return null;
    } catch {
      return null;
    }
  }
}

// ===== Public Convenience Functions =====

/**
 * 미디어 파일명 생성 편의 함수
 *
 * 형식: `{username}_{tweetId}_{YYYYMMDD}_{index}.{extension}`
 *
 * @param media - 미디어 정보
 * @param options - 생성 옵션
 * @returns 생성된 파일명
 *
 * @example
 * ```typescript
 * const filename = generateMediaFilename(mediaInfo, { index: 2 });
 * // "username_1234567890_20250101_2.jpg"
 * ```
 */
export function generateMediaFilename(
  media: MediaItemForFilename | MediaInfoForFilename,
  options?: FilenameOptions
): string {
  const service = new FilenameService();
  return service.generateMediaFilename(media, options);
}

/**
 * ZIP 파일명 생성 편의 함수
 *
 * @param mediaItems - 미디어 아이템 배열
 * @param options - 생성 옵션
 * @returns 생성된 ZIP 파일명
 */
export function generateZipFilename(
  mediaItems: readonly (MediaItemForFilename | MediaInfoForFilename)[],
  options?: ZipFilenameOptions
): string {
  const service = new FilenameService();
  return service.generateZipFilename(mediaItems, options);
}

/**
 * 미디어 파일명 유효성 검증
 *
 * @param filename - 검증할 파일명
 * @returns 유효 여부
 */
export function isValidMediaFilename(filename: string): boolean {
  const service = new FilenameService();
  return service.isValidMediaFilename(filename);
}

/**
 * ZIP 파일명 유효성 검증
 *
 * @param filename - 검증할 파일명
 * @returns 유효 여부
 */
export function isValidZipFilename(filename: string): boolean {
  const service = new FilenameService();
  return service.isValidZipFilename(filename);
}
