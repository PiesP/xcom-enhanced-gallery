/**
 * @fileoverview 설정 서비스 배럴 익스포트
 * @version 2.0.0 - Phase 192: Factory 제거, 직접 export로 전환
 * @updated Phase 192.4: TwitterTokenExtractor를 shared/services/token-extraction으로 이동
 * @updated Phase 2025-10-27: Storage 인터페이스를 features/settings/services/storage로 이동
 */

export { SettingsService } from './settings-service';

// Storage adapters (Phase 2025-10-27: 계층 구조 최적화)
export { type StorageAdapter } from './storage/storage-adapter.interface';
export { UserscriptStorageAdapter } from './storage/userscript-storage-adapter';

// TwitterTokenExtractor는 이제 shared/services/token-extraction에서 임포트
export type {
  TokenExtractionResult,
  TokenValidationResult,
} from '@shared/services/token-extraction';
