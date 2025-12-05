/**
 * Copyright (c) 2024 X.com Enhanced Gallery Team
 * Licensed under the MIT License
 *
 * @fileoverview Filename Service Module Entry Point
 * @description Re-exports functional API and provides legacy class compatibility
 * @version 4.0.0 - Functional refactor
 */

// Primary exports - Pure functions (recommended)
export {
  generateMediaFilename,
  generateZipFilename,
  isValidMediaFilename,
  isValidZipFilename,
  // Types
  type FilenameOptions,
  type ZipFilenameOptions,
  // Utilities
  sanitizeFilename,
  getFileExtension,
  getIndexFromMediaId,
  normalizeIndex,
  resolveMediaMetadata,
} from './filename-utils';

// Legacy class compatibility layer
export { FilenameService, getFilenameService } from './filename-service.legacy';
