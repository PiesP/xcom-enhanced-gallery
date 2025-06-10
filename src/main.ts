/**
 * X.com Enhanced Gallery - Optimized 메인 진입점
 *
 * IntegratedServiceManager를 통한 최적화된 서비스 관리
 * - 지연 로딩 및 메모리 최적화
 * - Tree-shaking 최적화
 * - 의존성 관리 최적화
 */

// CSS 스타일 import
import '@assets/styles/globals.css';
import '@assets/styles/video-trigger.css';

import { IntegratedServiceManager, SERVICE_KEYS } from '@core/services';
import { logger } from '@infrastructure/logging/logger';

/**
 * 최적화된 갤러리 앱 래퍼 클래스
 * IntegratedServiceManager를 통한 효율적인 서비스 관리
 */
class XEGGalleryApp {
  private isRunning = false;
  private isInitialized = false;
  private integratedServiceManager: IntegratedServiceManager;

  constructor() {
    this.integratedServiceManager = IntegratedServiceManager.getInstance();
  }

  async start(): Promise<void> {
    if (this.isRunning) {
      return;
    }

    try {
      logger.info(`🚀 X.com Enhanced Gallery v${import.meta.env.VITE_VERSION ?? '1.0.0'} 시작`);

      // 성능 측정 시작
      const startTime = performance.now();

      // 1. 서비스 레지스트리 등록
      await this.initializeServiceRegistry();

      // 2. 핵심 서비스만 먼저 초기화 (필요한 것만)
      await this.initializeEssentialServices();

      // 3. 갤러리 앱 초기화
      await this.initializeGalleryApp();

      this.isRunning = true;

      const endTime = performance.now();
      logger.info(`✅ 갤러리 앱 초기화 완료 (${(endTime - startTime).toFixed(2)}ms)`);

      // 개발 모드에서만 진단 정보 출력
      if (import.meta.env.DEV) {
        const diagnostics = this.integratedServiceManager.getDiagnostics();
        logger.debug('[IntegratedServiceManager] Diagnostics:', {
          registeredServices: diagnostics.registeredServices.length,
          initializedServices: diagnostics.initializedServices.length,
          memoryUsage: diagnostics.memoryUsage,
        });
      }
    } catch (error) {
      logger.error('❌ 갤러리 앱 시작 실패:', error);
      await this.cleanup();
      throw error;
    }
  }

  /**
   * IntegratedServiceManager 초기화
   */
  private async initializeServiceRegistry(): Promise<void> {
    if (this.isInitialized) return;

    try {
      await this.integratedServiceManager.initialize();

      // 서비스 등록 상태 확인
      const registeredServices = this.integratedServiceManager.getRegisteredServices();
      logger.debug(
        `📋 IntegratedServiceManager 초기화 완료: ${registeredServices.length}개 서비스`
      );

      if (import.meta.env.DEV) {
        logger.debug('등록된 서비스:', registeredServices);
      }

      this.isInitialized = true;
    } catch (error) {
      logger.error('❌ IntegratedServiceManager 초기화 실패:', error);
      throw error;
    }
  }

  /**
   * 필수 서비스만 먼저 초기화
   */
  private async initializeEssentialServices(): Promise<void> {
    const essentialServices = [SERVICE_KEYS.AUTO_THEME, SERVICE_KEYS.PAGE_SCROLL_LOCK];

    try {
      // 배치로 의존성 순서를 고려하여 초기화
      await this.integratedServiceManager.initializeBatch(essentialServices);

      // 자동 테마 설정
      const autoTheme = await this.integratedServiceManager.getServiceAsync<{
        updateConfig: (config: {
          enabled: boolean;
          timeBasedTheme: boolean;
          contentBasedTheme: boolean;
          debug: boolean;
        }) => void;
      }>(SERVICE_KEYS.AUTO_THEME);
      autoTheme.updateConfig({
        enabled: true,
        timeBasedTheme: true,
        contentBasedTheme: true,
        debug: import.meta.env.DEV,
      });

      logger.info('🎨 필수 서비스 초기화 완료');
    } catch (error) {
      logger.error('❌ 필수 서비스 초기화 실패:', error);
      throw error;
    }
  }

  /**
   * 갤러리 앱 초기화
   */
  private async initializeGalleryApp(): Promise<void> {
    // 동적 import로 지연 로딩
    const { GalleryApp } = await import('@features/app/GalleryApp');
    const app = new GalleryApp();
    await app.initialize();

    // 앱 인스턴스를 전역에서 접근 가능하도록 (정리용)
    (globalThis as Record<string, unknown>).__XEG_APP__ = app;

    logger.info('✅ 갤러리 앱 컴포넌트 초기화 완료');
  }

  /**
   * 메모리 효율적인 정리
   */
  async cleanup(): Promise<void> {
    try {
      // 갤러리 앱 정리
      const app = (globalThis as Record<string, unknown>).__XEG_APP__;
      if (app && typeof app === 'object' && 'cleanup' in app && typeof app.cleanup === 'function') {
        app.cleanup();
        delete (globalThis as Record<string, unknown>).__XEG_APP__;
      }

      // IntegratedServiceManager 정리
      await this.integratedServiceManager.destroy();

      this.isRunning = false;
      this.isInitialized = false;

      logger.info('🧹 갤러리 앱 정리 완료');

      // 가비지 컬렉션 힌트
      if (typeof globalThis.gc === 'function') {
        globalThis.gc();
      }
    } catch (error) {
      logger.warn('정리 중 오류:', error);
    }
  }

  /**
   * 앱 상태 확인
   */
  isAppRunning(): boolean {
    return this.isRunning;
  }

  /**
   * 서비스 상태 확인 (디버깅용)
   */
  getServiceStatus(): string[] {
    return this.integratedServiceManager.getLoadedServices();
  }
}

// 전역 앱 인스턴스
const app = new XEGGalleryApp();

// 정리 이벤트 등록 (메모리 누수 방지)
window.addEventListener('beforeunload', () => {
  app.cleanup().catch(error => logger.error('정리 중 오류:', error));
});

// 페이지 언로드 시에도 정리
window.addEventListener('pagehide', () => {
  app.cleanup().catch(error => logger.error('페이지 숨김 중 정리 오류:', error));
});

// 최적화된 자동 시작
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => {
    app.start().catch((error: Error) => logger.error('갤러리 앱 자동 시작 실패:', error));
  });
} else {
  // 이미 DOM이 로드된 경우
  app.start().catch((error: Error) => logger.error('갤러리 앱 자동 시작 실패:', error));
}

// 전역 접근용 (디버깅 및 외부 확장)
if (import.meta.env.DEV) {
  (globalThis as Record<string, unknown>).__XEG_MAIN__ = app;

  // ServiceManager 진단 도구 import 및 활성화
  import('@core/services/ServiceDiagnostics').then(({ diagnoseServiceManager }) => {
    (globalThis as Record<string, unknown>).__XEG_DIAGNOSE__ = diagnoseServiceManager;
    logger.debug('🛠️ 진단 도구 활성화됨. 콘솔에서 __XEG_DIAGNOSE__() 실행 가능');
  });
}

export default app;
