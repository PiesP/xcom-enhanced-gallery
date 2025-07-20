/**
 * Filename Service Backward Compatibility Re-export
 *
 * @deprecated Import from @core/media/FilenameService instead.
 *
 * This file maintains backward compatibility for existing imports.
 * All media filename generation functionality has been moved to the Core layer.
 *
 * Migration Guide - Phase 2A Step 8:
 * - Infrastructure media components → Core media system
 * - Filename service operations moved to Core layer
 * - Maintains backward compatibility through re-export
 */

export {
  FilenameService,
  generateMediaFilename,
  generateZipFilename,
  isValidMediaFilename,
  isValidZipFilename,
  type FilenameOptions,
  type ZipFilenameOptions,
} from '@core/media/FilenameService';
