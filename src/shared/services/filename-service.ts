/**
 * Copyright (c) 2024 X.com Enhanced Gallery Team
 * Licensed under the MIT License
 *
 * @fileoverview Filename Service - Re-export from new modular location
 * @deprecated Import from '@shared/services/filename' instead
 * @version 4.0.0 - Redirects to functional module
 */

// Re-export everything from the new modular location
// This file maintains backward compatibility for existing imports
export {
  // Primary functional API
  generateMediaFilename,
  generateZipFilename,
  isValidMediaFilename,
  isValidZipFilename,
  // Types
  type FilenameOptions,
  type ZipFilenameOptions,
  // Legacy class (deprecated)
  FilenameService,
  getFilenameService,
} from '@shared/services/filename';
