/**
 * Core External Vendor Public API
 *
 * @version 8.0.0 - Clean Architecture 완전 적용
 * @description 외부 라이브러리 공개 API 함수들 - Core 레이어로 이동 완료
 */

import { logger } from '@shared/logging';
import {
  VendorManager,
  type PreactAPI,
  type PreactHooksAPI,
  type PreactSignalsAPI,
  type PreactCompatAPI,
  type NativeDownloadAPI,
} from './vendor-manager';
import {
  createDeprecatedFflateApi,
  warnFflateDeprecated,
  FFLATE_REMOVAL_MESSAGE,
  type FflateAPI,
} from './fflate-deprecated';

// ================================
// 공개 API
// ================================

const vendorManager = VendorManager.getInstance();

const deprecatedFflateApi = createDeprecatedFflateApi();

// 동기 접근을 위한 캐시된 API들
let cachedFflate: FflateAPI = deprecatedFflateApi;
let cachedPreact: PreactAPI | null = null;
let cachedPreactHooks: PreactHooksAPI | null = null;
let cachedPreactSignals: PreactSignalsAPI | null = null;
let cachedPreactCompat: PreactCompatAPI | null = null;
let isInitialized = false;

/**
 * 모든 vendor 초기화 (앱 시작 시 한 번 호출)
 */
export async function initializeVendors(): Promise<void> {
  if (isInitialized) return;

  try {
    const [preact, hooks, signals, compat] = await Promise.all([
      vendorManager.getPreact(),
      vendorManager.getPreactHooks(),
      vendorManager.getPreactSignals(),
      vendorManager.getPreactCompat(),
    ]);

    cachedFflate = deprecatedFflateApi;
    cachedPreact = preact;
    cachedPreactHooks = hooks;
    cachedPreactSignals = signals;
    cachedPreactCompat = compat;
    isInitialized = true;

    logger.info('모든 vendor 라이브러리 초기화 완료');
  } catch (error) {
    logger.error('Vendor 초기화 실패:', error);
    throw error;
  }
}

/**
 * fflate 라이브러리 접근 (동기)
 */
export function getFflate(): FflateAPI {
  warnFflateDeprecated('StoreZipWriter handles ZIP creation.');
  logger.debug(`[Vendors] ${FFLATE_REMOVAL_MESSAGE}`);
  cachedFflate = deprecatedFflateApi;
  return cachedFflate;
}

/**
 * Preact 라이브러리 접근 (동기)
 */
export function getPreact(): PreactAPI {
  if (!cachedPreact) {
    throw new Error('Preact가 초기화되지 않았습니다. initializeVendors()를 먼저 호출하세요.');
  }
  return cachedPreact;
}

/**
 * Preact Hooks 접근 (동기)
 */
export function getPreactHooks(): PreactHooksAPI {
  if (!cachedPreactHooks) {
    throw new Error('Preact Hooks가 초기화되지 않았습니다. initializeVendors()를 먼저 호출하세요.');
  }
  return cachedPreactHooks;
}

/**
 * Preact Signals 접근 (동기)
 */
export function getPreactSignals(): PreactSignalsAPI {
  if (!cachedPreactSignals) {
    throw new Error(
      'Preact Signals가 초기화되지 않았습니다. initializeVendors()를 먼저 호출하세요.'
    );
  }
  return cachedPreactSignals;
}

/**
 * Preact Compat 접근 (동기)
 */
export function getPreactCompat(): PreactCompatAPI {
  if (!cachedPreactCompat) {
    // 환경과 상관없이 자동 초기화 시도
    logger.warn('Preact Compat이 초기화되지 않았습니다. 자동 초기화를 시도합니다.');

    // 개발 환경에서 모듈 캐시 복구 시도
    if (import.meta.env.DEV) {
      try {
        // 이미 로드된 모듈이 있는지 확인
        const moduleCache = (globalThis as Record<string, unknown>).__vite__moduleCache;
        if (moduleCache) {
          // Vite의 모듈 캐시에서 preact/compat을 찾아서 사용
          for (const [path, mod] of Object.entries(moduleCache)) {
            if (
              typeof path === 'string' &&
              path.includes('preact/compat') &&
              mod &&
              typeof mod === 'object'
            ) {
              const compatMod = mod as Record<string, unknown>;
              if (compatMod.memo && compatMod.forwardRef) {
                cachedPreactCompat = {
                  memo: compatMod.memo as PreactCompatAPI['memo'],
                  forwardRef: compatMod.forwardRef as PreactCompatAPI['forwardRef'],
                };
                logger.debug('Preact Compat 캐시에서 복구 성공');
                return cachedPreactCompat;
              }
            }
          }
        }
      } catch (error) {
        logger.debug('Preact Compat 캐시 복구 실패:', error);
      }
    }

    // 자동 초기화 시도
    try {
      // initializeVendors를 비동기로 호출하고 결과를 캐시
      initializeVendors().catch(error => {
        logger.error('자동 초기화 실패:', error);
      });

      // 임시 호환성을 위한 기본 구현 반환
      if (!cachedPreactCompat) {
        /* eslint-disable @typescript-eslint/no-explicit-any */
        const preactCompat = {
          memo: (Component: any, _compare?: any) => {
            const MemoComponent = (props: any) => {
              // memo가 초기화되지 않은 경우 원본 컴포넌트 반환
              return Component(props);
            };
            MemoComponent.displayName = Component.displayName || Component.name || 'Component';
            return MemoComponent;
          },
          forwardRef: (Component: any) => {
            const ForwardedComponent = (props: any) => Component(props);
            ForwardedComponent.displayName = Component.displayName || Component.name || 'Component';
            return ForwardedComponent;
          },
        };
        /* eslint-enable @typescript-eslint/no-explicit-any */

        logger.debug('임시 Preact Compat 구현 반환');
        return preactCompat as PreactCompatAPI;
      }
    } catch (error) {
      logger.error('자동 초기화 실패:', error);

      // 초기화 실패 시에도 기본 구현 제공
      /* eslint-disable @typescript-eslint/no-explicit-any */
      const fallbackPreactCompat = {
        memo: (Component: any, _compare?: any) => {
          const MemoComponent = (props: any) => {
            return Component(props);
          };
          MemoComponent.displayName = Component.displayName || Component.name || 'Component';
          return MemoComponent;
        },
        forwardRef: (Component: any) => {
          const ForwardedComponent = (props: any) => Component(props);
          ForwardedComponent.displayName = Component.displayName || Component.name || 'Component';
          return ForwardedComponent;
        },
      };
      /* eslint-enable @typescript-eslint/no-explicit-any */

      logger.debug('Fallback Preact Compat 구현 반환');
      return fallbackPreactCompat as PreactCompatAPI;
    }

    // 여전히 초기화되지 않은 경우 에러 대신 기본 구현 반환
    if (!cachedPreactCompat) {
      /* eslint-disable @typescript-eslint/no-explicit-any */
      const defaultPreactCompat = {
        memo: (Component: any, _compare?: any) => {
          const MemoComponent = (props: any) => {
            return Component(props);
          };
          MemoComponent.displayName = Component.displayName || Component.name || 'Component';
          return MemoComponent;
        },
        forwardRef: (Component: any) => {
          const ForwardedComponent = (props: any) => Component(props);
          ForwardedComponent.displayName = Component.displayName || Component.name || 'Component';
          return ForwardedComponent;
        },
      };
      /* eslint-enable @typescript-eslint/no-explicit-any */

      logger.debug('기본 Preact Compat 구현 반환');
      return defaultPreactCompat as PreactCompatAPI;
    }
  }
  return cachedPreactCompat;
}

/**
 * 네이티브 다운로드 접근
 */
export const getNativeDownload = (): NativeDownloadAPI => vendorManager.getNativeDownload();

/**
 * 모든 라이브러리 검증
 */
export const validateVendors = () => vendorManager.validateAll();

/**
 * 버전 정보 조회
 */
export const getVendorVersions = () => vendorManager.getVersionInfo();

/**
 * 메모리 정리
 */
export const cleanupVendors = (): void => {
  vendorManager.cleanup();
  cachedFflate = deprecatedFflateApi;
  cachedPreact = null;
  cachedPreactHooks = null;
  cachedPreactSignals = null;
  isInitialized = false;
};

/**
 * 초기화 상태 확인
 */
export function isVendorsInitialized(): boolean {
  return isInitialized;
}

/**
 * vendor 초기화 보고서 생성
 */
export function getVendorInitializationReport() {
  const statuses: Record<string, { initialized: boolean; removed?: boolean }> = {
    preact: { initialized: !!cachedPreact },
    preactHooks: { initialized: !!cachedPreactHooks },
    preactSignals: { initialized: !!cachedPreactSignals },
    fflate: { initialized: false, removed: true },
  };

  const trackedEntries = Object.entries(statuses).filter(([name]) => name !== 'fflate');
  const initializedCount = trackedEntries.filter(([, status]) => status.initialized).length;
  const totalCount = trackedEntries.length;
  const initializationRate = (initializedCount / totalCount) * 100;

  return {
    isInitialized,
    statuses,
    versions: getVendorVersions(),
    initializationRate,
    initializedCount,
    totalCount,
  };
}

/**
 * vendor 상태 확인
 */
export function getVendorStatuses() {
  return {
    fflate: false,
    preact: !!cachedPreact,
    preactHooks: !!cachedPreactHooks,
    preactSignals: !!cachedPreactSignals,
  };
}

/**
 * 개별 vendor 초기화 확인
 */
export function isVendorInitialized(vendorName: string): boolean {
  switch (vendorName) {
    case 'fflate':
      return false;
    case 'preact':
      return !!cachedPreact;
    case 'preactHooks':
      return !!cachedPreactHooks;
    case 'preactSignals':
      return !!cachedPreactSignals;
    default:
      return false;
  }
}

// 정리 핸들러 등록 (명시적 호출로 변경하여 import 시 부작용 제거)
export function registerVendorCleanupOnUnload(
  target: Window | undefined = typeof window !== 'undefined' ? window : undefined
): void {
  try {
    if (!target) return;
    const handler = () => {
      try {
        cleanupVendors();
      } catch {
        // ignore
      }
    };
    target.addEventListener('beforeunload', handler);
  } catch {
    // ignore
  }
}
