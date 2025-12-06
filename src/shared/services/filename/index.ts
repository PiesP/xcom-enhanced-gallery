/**
 * Copyright (c) 2024 X.com Enhanced Gallery Team
 * Licensed under the MIT License
 *
 * @fileoverview Filename Service Module Entry Point
 * @description Re-exports functional API and provides legacy class compatibility
 * @version 4.0.0 - Functional refactor
 */

// Legacy class compatibility layer
export { FilenameService, getFilenameService } from './filename-service.legacy';
// Primary exports - Pure functions (recommended)
export {
  // Types
  type FilenameOptions,
  generateMediaFilename,
  generateZipFilename,
  getFileExtension,
  getIndexFromMediaId,
  isValidMediaFilename,
  isValidZipFilename,
  normalizeIndex,
  resolveMediaMetadata,
  // Utilities
  sanitizeFilename,
  type ZipFilenameOptions,
} from './filename-utils';
