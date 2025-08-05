/**
 * @fileoverview 동적 모듈 로더 서비스 - 간소화      case 'LazyLoadingService': {
        const module = await import('./LazyLoadingService');
        const loadTime = Date.now() - start;
        logger.debug('LazyLoadingService 로딩 완료:', { loadTime });
        return module.LazyLoadingService;
      } @description 코드 스플리팅과 지연 로딩을 위한 유틸리티 함수들
 * @version 1.0.0 - Phase 3: 동적 임포트 확장
 */

import { logger } from '@shared/logging';

/**
 * 서비스 모듈 동적 로딩
 */
export async function loadServiceModule(serviceName: string) {
  const startTime = performance.now();

  try {
    switch (serviceName) {
      case 'MediaPrefetchingService':
      case 'BulkDownloadService': {
        // 이제 MediaService로 통합됨
        const module = await import('./MediaService');
        const loadTime = performance.now() - startTime;
        logger.debug(`${serviceName} -> MediaService로 통합 완료:`, { loadTime });
        return module.MediaService;
      }

      case 'LazyLoadingService': {
        const module = await import('./LazyLoadingService');
        const loadTime = performance.now() - startTime;
        logger.debug('LazyLoadingService 로딩 완료:', { loadTime });
        return module.lazyLoadingService;
      }

      default:
        throw new Error(`알 수 없는 서비스: ${serviceName}`);
    }
  } catch (error) {
    logger.warn('서비스 모듈 로딩 실패:', error, { serviceName });
    throw error;
  }
}

/**
 * 유틸리티 모듈 동적 로딩
 */
export async function loadUtilityModule(utilityName: string) {
  const startTime = performance.now();

  try {
    switch (utilityName) {
      case 'AccessibilityUtils': {
        const module = await import('@shared/utils/accessibility');
        const loadTime = performance.now() - startTime;
        logger.debug('AccessibilityUtils 로딩 완료:', { loadTime });
        return module;
      }

      default:
        throw new Error(`알 수 없는 유틸리티: ${utilityName}`);
    }
  } catch (error) {
    logger.warn('유틸리티 모듈 로딩 실패:', error, { utilityName });
    throw error;
  }
}

/**
 * 훅 모듈 동적 로딩
 * 아키텍처 규칙에 따라 shared 레이어 훅만 로딩 가능
 */
export async function loadHookModule(hookName: string) {
  const startTime = performance.now();

  try {
    switch (hookName) {
      case 'useAccessibility': {
        const module = await import('@shared/hooks/useAccessibility');
        const loadTime = performance.now() - startTime;
        logger.debug('useAccessibility 모듈 로딩 완료:', { loadTime });
        return module; // 전체 모듈 반환 (여러 함수 포함)
      }

      case 'useDOMReady': {
        const module = await import('@shared/hooks/useDOMReady');
        const loadTime = performance.now() - startTime;
        logger.debug('useDOMReady 로딩 완료:', { loadTime });
        return module.useDOMReady;
      }

      case 'useScrollDirection': {
        const module = await import('@shared/hooks/useScrollDirection');
        const loadTime = performance.now() - startTime;
        logger.debug('useScrollDirection 로딩 완료:', { loadTime });
        return module.useScrollDirection;
      }

      default:
        throw new Error(
          `알 수 없는 훅: ${hookName}. features 레이어 훅은 해당 레이어에서 직접 로딩하세요.`
        );
    }
  } catch (error) {
    logger.warn('훅 모듈 로딩 실패:', error, { hookName });
    throw error;
  }
}

/**
 * 설정 모듈 동적 로딩
 */
export async function loadSettingsModule(moduleName: string) {
  try {
    switch (moduleName) {
      default:
        throw new Error(`알 수 없는 설정 모듈: ${moduleName}`);
    }
  } catch (error) {
    logger.warn('설정 모듈 로딩 실패:', error, { moduleName });
    throw error;
  }
}

/**
 * 여러 모듈 병렬 로딩 유틸리티
 */
export async function loadModulesParallel(
  modules: Array<{
    type: 'component' | 'service' | 'utility' | 'hook' | 'settings';
    name: string;
  }>
) {
  const loadPromises = modules.map(async ({ type, name }) => {
    try {
      switch (type) {
        case 'component':
          logger.warn(`갤러리 컴포넌트는 features 레이어에서 직접 로딩하세요: ${name}`);
          return { type, name, module: null, success: false, error: 'deprecated' };
        case 'service':
          return { type, name, module: await loadServiceModule(name), success: true };
        case 'utility':
          return { type, name, module: await loadUtilityModule(name), success: true };
        case 'hook':
          return { type, name, module: await loadHookModule(name), success: true };
        case 'settings':
          return { type, name, module: await loadSettingsModule(name), success: true };
        default:
          throw new Error(`알 수 없는 모듈 타입: ${type}`);
      }
    } catch (error) {
      logger.warn('모듈 로딩 실패:', error, { type, name });
      return { type, name, module: null, success: false, error };
    }
  });

  return Promise.all(loadPromises);
}
