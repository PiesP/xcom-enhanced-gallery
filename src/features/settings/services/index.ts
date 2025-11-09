/**
 * @fileoverview Settings services barrel export
 * @version 2.0.0 - Phase 192: Factory removed, direct export transition
 * @updated Phase 192.4: TwitterTokenExtractor moved to shared/services/token-extraction
 * @updated Phase 2025-10-27: Storage adapter moved to shared/services/storage
 */

export { SettingsService } from './settings-service';

// TwitterTokenExtractor is now imported from shared/services/token-extraction
export type {
  TokenExtractionResult,
  TokenValidationResult,
} from '@shared/services/token-extraction/twitter-token-extractor';
