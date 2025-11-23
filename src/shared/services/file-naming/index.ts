/**
 * @fileoverview File Naming Services Barrel Export
 *
 * Centralized export point for file naming utilities:
 * - FilenameService class for service instantiation
 * - Public convenience functions for one-off usage
 * - Type definitions for filename generation options
 *
 * **Architecture**:
 * - Phase 310: Basic filename generation for media downloads
 * - Phase 375: Quote tweet support (sourceLocation handling)
 * - Phase 432.3: TweetId utilization improvements and URL validation
 *
 * **Import Patterns**:
 *
 * ```typescript
 * // Service instantiation (recommended for multiple operations)
 * import { FilenameService } from '@shared/services/file-naming';
 * const service = new FilenameService();
 * const filename = service.generateMediaFilename(media);
 *
 * // Convenience functions (one-off usage)
 * import { generateMediaFilename, isValidMediaFilename } from '@shared/services/file-naming';
 * const filename = generateMediaFilename(media);
 * const isValid = isValidMediaFilename('user_123_20250105_1.jpg');
 *
 * // Type definitions
 * import type { FilenameOptions, ZipFilenameOptions } from '@shared/services/file-naming';
 * ```
 *
 * **Usage Guidelines**:
 * - Use FilenameService for multiple filename operations in a module
 * - Use convenience functions for simple, one-off operations
 * - Import types for options parameters in function signatures
 *
 * @see {@link FilenameService} for detailed API documentation
 * @see {@link FilenameOptions} for generation options
 * @see Phase 375 for quote tweet handling details
 * @see Phase 432.3 for TweetId utilization improvements
 */

export {
  FilenameService,
  generateMediaFilename,
  generateZipFilename,
  isValidMediaFilename,
  isValidZipFilename,
  type FilenameOptions,
  type ZipFilenameOptions,
} from "./filename-service";
