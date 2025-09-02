/**
 * Gallery 테스트 하네스
 * Phase 11 GREEN: GalleryApp 및 EventManager 를 실제 초기화하여
 * 이벤트 시스템 상태를 관찰/검증하는 테스트 유틸.
 */
import { CoreService } from '@/shared/services/ServiceManager';
import { registerCoreServices } from '@/shared/services/service-initialization';
import { SERVICE_KEYS } from '@/constants';
import { GalleryRenderer } from '@/features/gallery/GalleryRenderer';
import { GalleryApp } from '@/features/gallery/GalleryApp';
import { EventManager } from '@/shared/services/EventManager';

/**
 * @typedef {Object} GalleryTestHarness
 * @property {GalleryApp} app
 * @property {EventManager} eventManager
 */

/**
 * 테스트 격리를 위해 CoreService 싱글톤을 재설정하고
 * 필요한 서비스들을 등록한 뒤 GalleryApp 을 초기화한다.
 */
export async function createGalleryTestHarness() {
  // CoreService 싱글톤 초기화 (테스트 격리)
  CoreService.resetInstance();
  const serviceManager = CoreService.getInstance();

  // Core 서비스 등록
  await registerCoreServices();

  // GalleryRenderer 서비스 등록 (main.ts 동작을 테스트 환경에서 재현)
  serviceManager.register(SERVICE_KEYS.GALLERY_RENDERER, new GalleryRenderer());

  // EventManager 싱글톤 확보 (initialize 는 GalleryApp.initialize 내부에서 수행)
  const eventManager = EventManager.getInstance(true);

  // GalleryApp 생성 및 초기화
  const app = new GalleryApp();
  await app.initialize();

  return { app, eventManager };
}
