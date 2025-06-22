/**
 * X.com Enhanced Gallery - 통합된 메인 진입점
 *
 * 새로운 UnifiedApplication을 사용하는 단순화된 진입점
 * Clean Architecture App Layer를 통한 애플리케이션 부트스트래핑
 *
 * @version 3.0.0 - Unified Architecture
 */

import { measurePerformance } from '@shared/utils/performance';
import { initializeCSSVariables } from '@shared/utils/styles';
import { UnifiedApplication } from './app/UnifiedApplication';
import { logger } from './infrastructure/logging/logger';
import type { AppConfig } from './shared/types/app';

// 전역 스타일은 별도 모듈로 분리
import './styles/globals';

/**
 * 애플리케이션 설정 팩토리
 */
function createAppConfig(): AppConfig {
  return {
    version: import.meta.env.VITE_VERSION ?? '3.0.0',
    isDevelopment: import.meta.env.DEV,
    debug: import.meta.env.DEV,
    autoStart: true,
    performanceMonitoring: import.meta.env.DEV,
  };
}

/**
 * 개발 환경 전용 디버깅 도구 초기화
 */
async function initializeDevTools(): Promise<void> {
  if (!import.meta.env.DEV) return;

  try {
    // 갤러리 디버깅 유틸리티 로드
    const { galleryDebugUtils } = await import('@shared/utils/debug/gallery-debug');
    (globalThis as Record<string, unknown>).__XEG_DEBUG__ = galleryDebugUtils;

    // 진단 도구 로드
    const { diagnoseServiceManager } = await import('@core/services/ServiceDiagnostics');
    (globalThis as Record<string, unknown>).__XEG_DIAGNOSE__ = diagnoseServiceManager;

    logger.info('🛠️ 개발 도구 활성화됨:', {
      commands: [
        '__XEG_DEBUG__ (갤러리 디버깅)',
        '__XEG_DIAGNOSE__() (서비스 진단)',
        '__XEG_UNIFIED_APP__ (애플리케이션)',
        '__XEG_APP__ (갤러리 앱)',
      ],
    });
  } catch (error) {
    logger.warn('디버깅 도구 로드 실패:', error);
  }
}

/**
 * 애플리케이션 시작
 * 새로운 UnifiedApplication을 사용
 */
async function startApplication(): Promise<void> {
  try {
    // CSS 변수 시스템 초기화 (가장 먼저)
    initializeCSSVariables();

    // 시작 성능 측정
    const startMetric = await measurePerformance('app-startup', async () => {
      // 설정 생성
      const config = createAppConfig();

      logger.info(`🚀 X.com Enhanced Gallery v${config.version} 시작...`);

      // 통합된 애플리케이션 생성 및 시작
      const app = UnifiedApplication.create(config);
      await app.start();

      // 개발 도구 초기화 (비동기, 블로킹하지 않음)
      if (config.isDevelopment) {
        void initializeDevTools();
      }
    });

    logger.info('✅ 애플리케이션 초기화 완료', {
      startupTime: `${startMetric.duration.toFixed(2)}ms`,
    });

    // 전역 접근을 위한 추가 등록
    (globalThis as Record<string, unknown>).__XEG_START_TIME__ = Date.now();
  } catch (error) {
    logger.error('❌ 애플리케이션 시작 실패:', error);

    // 개발 환경에서만 상세 오류 정보 표시
    if (import.meta.env.DEV) {
      console.error('애플리케이션 초기화 상세 오류:', error);

      // 에러 알림 표시
      showErrorNotification('애플리케이션 시작에 실패했습니다. 페이지를 새로고침해 주세요.');
    }

    throw error;
  }
}

/**
 * 에러 알림 표시 (개발환경용)
 */
function showErrorNotification(message: string): void {
  const notification = document.createElement('div');
  notification.style.cssText = `
    position: fixed;
    top: 20px;
    right: 20px;
    background: #ff4444;
    color: white;
    padding: 12px 16px;
    border-radius: 8px;
    font-size: 14px;
    font-weight: 500;
    z-index: 1000000;
    box-shadow: 0 4px 12px rgba(0,0,0,0.3);
    max-width: 300px;
  `;
  notification.textContent = message;

  document.body.appendChild(notification);

  // 10초 후 자동 제거
  setTimeout(() => {
    if (notification.parentNode) {
      notification.parentNode.removeChild(notification);
    }
  }, 10000);
}

/**
 * DOM 준비 상태에 따른 시작
 */
function initializeWhenReady(): void {
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
      startApplication().catch((error: Error) => {
        logger.error('갤러리 앱 자동 시작 실패:', error);
      });
    });
  } else {
    // 이미 DOM이 로드된 경우 즉시 시작
    startApplication().catch((error: Error) => {
      logger.error('갤러리 앱 자동 시작 실패:', error);
    });
  }
}

// 자동 시작 설정이 활성화된 경우에만 시작
const config = createAppConfig();
if (config.autoStart) {
  initializeWhenReady();
}

// 모듈 기본 export (외부에서 수동 시작 가능)
export default {
  start: startApplication,
  config,
  UnifiedApplication, // 직접 접근 가능
};

// 개발 환경에서 전역 접근 허용
if (import.meta.env.DEV) {
  (globalThis as Record<string, unknown>).__XEG_MAIN__ = {
    start: startApplication,
    config,
    UnifiedApplication,
  };
}
