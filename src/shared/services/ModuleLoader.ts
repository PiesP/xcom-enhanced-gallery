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
 * 갤러리 컴포넌트 동적 로딩
 * @deprecated features 레이어 컴포넌트는 features 레이어에서 직접 로딩하세요
 */
export async function loadGalleryComponent(componentName: string) {
  logger.warn('갤러리 컴포넌트 로딩이 deprecated되었습니다:', { componentName });
  throw new Error(`갤러리 컴포넌트는 features 레이어에서 직접 로딩하세요: ${componentName}`);
}

/**
 * 서비스 모듈 동적 로딩
 */
export async function loadServiceModule(serviceName: string) {
  const startTime = performance.now();

  try {
    switch (serviceName) {
      case 'WebPOptimizationService': {
        const module = await import('./WebPOptimizationService');
        const loadTime = performance.now() - startTime;
        logger.debug('WebPOptimizationService 로딩 완료:', { loadTime });
        return module.WebPOptimizationService;
      }

      case 'MediaPrefetchingService': {
        const module = await import('./MediaPrefetchingService');
        const loadTime = performance.now() - startTime;
        logger.debug('MediaPrefetchingService 로딩 완료:', { loadTime });
        return module.MediaPrefetchingService;
      }

      case 'LazyLoadingService': {
        const module = await import('./LazyLoadingService');
        const loadTime = performance.now() - startTime;
        logger.debug('LazyLoadingService 로딩 완료:', { loadTime });
        return module.lazyLoadingService;
      }

      case 'BulkDownloadService': {
        const module = await import('./BulkDownloadService');
        const loadTime = performance.now() - startTime;
        logger.debug('BulkDownloadService 로딩 완료:', { loadTime });
        return module.BulkDownloadService;
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
      case 'VirtualScrollManager': {
        const module = await import('@shared/utils/virtual-scroll');
        const loadTime = performance.now() - startTime;
        logger.debug('VirtualScrollManager 로딩 완료:', { loadTime });
        return module.VirtualScrollManager;
      }

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
      case 'useVirtualScroll': {
        const module = await import('@shared/hooks/useVirtualScroll');
        const loadTime = performance.now() - startTime;
        logger.debug('useVirtualScroll 로딩 완료:', { loadTime });
        return module.useVirtualScroll;
      }

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
          return { type, name, module: await loadGalleryComponent(name), success: true };
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
