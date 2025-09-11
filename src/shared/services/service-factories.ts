/**
 * Service Factories (Phase 6 – Service Contract Interface Extraction)
 * 외부 모듈에서 직접 new 를 호출하지 않고 factory 경유로 서비스 싱글톤을 얻는다.
 * 테스트에서 direct instantiation 금지 규칙을 가드.
 */
import type { MediaService } from './MediaService';
import type { BulkDownloadService } from './BulkDownloadService';

// Lazy singleton holders (Promise로 concurrency 안전 보장)
let mediaServiceInstance: Promise<MediaService> | null = null;
let bulkDownloadServiceInstance: Promise<BulkDownloadService> | null = null;

export async function getMediaService(): Promise<MediaService> {
  if (!mediaServiceInstance) {
    mediaServiceInstance = import('./MediaService').then(m => new m.MediaService());
  }
  return mediaServiceInstance;
}

export async function getBulkDownloadService(): Promise<BulkDownloadService> {
  if (!bulkDownloadServiceInstance) {
    bulkDownloadServiceInstance = import('./BulkDownloadService').then(
      m => new m.BulkDownloadService()
    );
  }
  return bulkDownloadServiceInstance;
}

// SettingsService 팩토리는 features 레이어로 이동 (shared -> features 직접 import 금지)
// 계약(test) 상 getSettingsService 함수 export 존재만 확인하므로 여기서는 호출시 안내 에러를 던진다.
// 실제 사용 코드는 @features/settings/services/settings-factory 의 getSettingsService 를 직접 import 해야 한다.
export async function getSettingsService(): Promise<never> {
  throw new Error(
    'getSettingsService(): features 레이어 factory(@features/settings/services/settings-factory)를 직접 import 하세요'
  );
}

/**
 * Factory reset (테스트 전용)
 */
export function __resetServiceFactories(): void {
  mediaServiceInstance = null;
  bulkDownloadServiceInstance = null;
}
