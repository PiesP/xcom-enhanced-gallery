/**
 * Filename utilities (service-facing facade).
 *
 * Prefer importing from this module when you are working in service layers.
 */

export {
  generateMediaFilename,
  generateZipFilename,
  getFileExtension,
  getIndexFromMediaId,
  isValidMediaFilename,
  isValidZipFilename,
  normalizeIndex,
  resolveMediaMetadata,
} from '@shared/core/filename/filename-utils';
