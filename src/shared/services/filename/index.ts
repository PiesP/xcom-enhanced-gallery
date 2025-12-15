/**
 * Copyright (c) 2024 X.com Enhanced Gallery Team
 * Licensed under the MIT License
 *
 * @fileoverview Filename Service Module Entry Point
 * @description Pure functional filename utilities
 * @version 5.0.0 - Removed legacy class wrapper
 */

export {
  type FilenameOptions,
  generateMediaFilename,
  generateZipFilename,
  getFileExtension,
  getIndexFromMediaId,
  isValidMediaFilename,
  isValidZipFilename,
  normalizeIndex,
  resolveMediaMetadata,
  sanitizeFilename,
  type ZipFilenameOptions,
} from '@shared/core/filename/filename-utils';
