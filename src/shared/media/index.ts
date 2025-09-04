/**
 * @fileoverview Core Media Services Barrel Export
 */

export {
  FilenameService,
  generateMediaFilename,
  generateZipFilename,
  isValidMediaFilename,
  isValidZipFilename,
  type FilenameOptions,
  type ZipFilenameOptions,
} from './FilenameService';

// New MediaProcessor exports
export { MediaProcessor, processMedia } from './MediaProcessor';
export { collectNodes, extractRawData, normalize, dedupe, validate } from './pipeline';
export type { MediaDescriptor, MediaType, MediaVariant, RawMediaCandidate, Result } from './types';
