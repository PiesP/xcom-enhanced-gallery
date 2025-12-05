/**
 * Copyright (c) 2024 X.com Enhanced Gallery Team
 * Licensed under the MIT License
 *
 * @fileoverview Legacy FilenameService class for backward compatibility
 * @deprecated Use functional API from './filename-utils' instead
 * @version 4.0.0
 */

import type { MediaInfo } from '@shared/types/media.types';

import {
  generateMediaFilename,
  generateZipFilename,
  isValidMediaFilename,
  isValidZipFilename,
  type FilenameOptions,
  type ZipFilenameOptions,
} from './filename-utils';

/**
 * @deprecated Use functional API instead:
 * - `generateMediaFilename(media, options)`
 * - `generateZipFilename(mediaItems, options)`
 * - `isValidMediaFilename(filename)`
 * - `isValidZipFilename(filename)`
 *
 * @example
 * ```typescript
 * // Before (deprecated):
 * const service = FilenameService.getInstance();
 * service.generateMediaFilename(media);
 *
 * // After (recommended):
 * import { generateMediaFilename } from '@shared/services/filename';
 * generateMediaFilename(media);
 * ```
 */
export class FilenameService {
  private static instance: FilenameService;

  public static getInstance(): FilenameService {
    if (!FilenameService.instance) {
      FilenameService.instance = new FilenameService();
    }
    return FilenameService.instance;
  }

  /**
   * @deprecated Use `generateMediaFilename()` function instead
   */
  generateMediaFilename(media: MediaInfo, options: FilenameOptions = {}): string {
    return generateMediaFilename(media, options);
  }

  /**
   * @deprecated Use `generateZipFilename()` function instead
   */
  generateZipFilename(mediaItems: readonly MediaInfo[], options: ZipFilenameOptions = {}): string {
    return generateZipFilename(mediaItems, options);
  }

  /**
   * @deprecated Use `isValidMediaFilename()` function instead
   */
  isValidMediaFilename(filename: string): boolean {
    return isValidMediaFilename(filename);
  }

  /**
   * @deprecated Use `isValidZipFilename()` function instead
   */
  isValidZipFilename(filename: string): boolean {
    return isValidZipFilename(filename);
  }
}

/**
 * Get FilenameService singleton instance
 * @deprecated Use functional API instead
 */
export function getFilenameService(): FilenameService {
  return FilenameService.getInstance();
}
