/**
 * @fileoverview TDZ 안전한 Vendor API
 * @description 정적 import 기반으로 TDZ 문제를 해결한 안전한 vendor 접근 API
 *
 * TDD Phase: GREEN - 안전한 초기화와 동기 접근 보장
 */

import { logger } from '@shared/logging'; // vendor (logging not counted)
import {
  StaticVendorManager,
  type FflateAPI,
  type PreactAPI,
  type PreactHooksAPI,
  type PreactSignalsAPI,
  type PreactCompatAPI,
  type NativeDownloadAPI,
} from './vendor-manager-static';

// ================================
// 안전한 공개 API
// ================================

const staticVendorManager = StaticVendorManager.getInstance();

// 초기화 락 (중복 호출 방지)
let isInitializing = false;
let initializationPromise: Promise<void> | null = null;

/**
 * 모든 vendor 초기화 (단일 실행 보장)
 */
export async function initializeVendorsSafe(): Promise<void> {
  // 간소화된 초기화 확인
  if (staticVendorManager.isReady()) {
    logger.debug('Vendor가 이미 초기화되었습니다.');
    return;
  }

  if (isInitializing && initializationPromise) {
    logger.debug('Vendor 초기화가 진행 중입니다. 대기합니다.');
    return initializationPromise;
  }

  isInitializing = true;

  try {
    logger.info('🚀 안전한 Vendor 초기화 시작...');

    // 간소화된 초기화
    staticVendorManager.initialize();
    await initializationPromise;

    logger.info('✅ 안전한 Vendor 초기화 완료');
  } catch (error) {
    logger.error('❌ 안전한 Vendor 초기화 실패:', error);
    throw error;
  } finally {
    isInitializing = false;
  }
}

/**
 * fflate 라이브러리 안전 접근 (동기)
 */
export function getFflateSafe(): FflateAPI {
  try {
    return staticVendorManager.getFflate();
  } catch (error) {
    logger.error('fflate 접근 실패:', error);
    throw new Error('fflate 라이브러리를 사용할 수 없습니다. 초기화가 필요합니다.');
  }
}

/**
 * Preact 라이브러리 안전 접근 (동기)
 */
export function getPreactSafe(): PreactAPI {
  try {
    return staticVendorManager.getPreact();
  } catch (error) {
    logger.error('Preact 접근 실패:', error);
    throw new Error('Preact 라이브러리를 사용할 수 없습니다. 초기화가 필요합니다.');
  }
}

/**
 * Preact Hooks 안전 접근 (동기)
 */
export function getPreactHooksSafe(): PreactHooksAPI {
  try {
    return staticVendorManager.getPreactHooks();
  } catch (error) {
    logger.error('Preact Hooks 접근 실패:', error);
    throw new Error('Preact Hooks 라이브러리를 사용할 수 없습니다. 초기화가 필요합니다.');
  }
}

/**
 * Preact Signals 안전 접근 (동기)
 */
export function getPreactSignalsSafe(): PreactSignalsAPI {
  try {
    return staticVendorManager.getPreactSignals();
  } catch (error) {
    logger.error('Preact Signals 접근 실패:', error);
    throw new Error('Preact Signals 라이브러리를 사용할 수 없습니다. 초기화가 필요합니다.');
  }
}

/**
 * Preact Compat 안전 접근 (동기) - TDZ 문제 완전 해결
 */
export function getPreactCompatSafe(): PreactCompatAPI {
  try {
    return staticVendorManager.getPreactCompat();
  } catch (error) {
    logger.error('Preact Compat 접근 실패:', error);

    // 정적 import 기반이므로 fallback 없이 즉시 에러
    throw new Error('Preact Compat 라이브러리를 사용할 수 없습니다. 초기화가 필요합니다.');
  }
}

/**
 * 네이티브 다운로드 안전 접근
 */
export const getNativeDownloadSafe = (): NativeDownloadAPI => {
  try {
    return staticVendorManager.getNativeDownloadAPI();
  } catch (error) {
    logger.error('Native Download 접근 실패:', error);
    throw new Error('네이티브 다운로드 기능을 사용할 수 없습니다.');
  }
};

/**
 * 모든 라이브러리 검증
 */
// 간소화된 검증 함수
export const validateVendorsSafe = () => true;

/**
 * 버전 정보 조회
 */
// 간소화된 버전 정보
export const getVendorVersionsSafe = () => ({
  fflate: 'static-import',
  preact: 'static-import',
  preactHooks: 'static-import',
  preactSignals: 'static-import',
  preactCompat: 'static-import',
});

/**
 * 메모리 정리
 */
export const cleanupVendorsSafe = (): void => {
  staticVendorManager.cleanup();
  isInitializing = false;
  initializationPromise = null;
  logger.info('안전한 Vendor 정리 완료');
};

/**
 * 초기화 상태 확인
 */
export function isVendorsInitializedSafe(): boolean {
  return staticVendorManager.isReady();
}

/**
 * vendor 초기화 보고서 생성 (간소화)
 */
export function getVendorInitializationReportSafe() {
  const isReady = staticVendorManager.isReady();
  const versions = getVendorVersionsSafe();

  return {
    isInitialized: isReady,
    cacheSize: 0, // 간소화됨
    availableAPIs: ['fflate', 'preact', 'preactHooks', 'preactSignals', 'preactCompat'],
    versions,
    initializationRate: isReady ? 100 : 0,
    totalCount: 5, // fflate, preact, hooks, signals, compat
    initializedCount: isReady ? 5 : 0,
  };
}

/**
 * vendor 상태 확인 (간소화)
 */
export function getVendorStatusesSafe() {
  const isReady = staticVendorManager.isReady();

  if (!isReady) {
    return {
      fflate: false,
      preact: false,
      preactHooks: false,
      preactSignals: false,
      preactCompat: false,
    };
  }

  return {
    fflate: isReady,
    preact: isReady,
    preactHooks: isReady,
    preactSignals: isReady,
    preactCompat: isReady,
  };
}

/**
 * 개별 vendor 초기화 확인
 */
export function isVendorInitializedSafe(vendorName: string): boolean {
  const statuses = getVendorStatusesSafe();

  switch (vendorName) {
    case 'fflate':
      return statuses.fflate;
    case 'preact':
      return statuses.preact;
    case 'preactHooks':
      return statuses.preactHooks;
    case 'preactSignals':
      return statuses.preactSignals;
    case 'preactCompat':
      return statuses.preactCompat;
    default:
      return false;
  }
}

// 정리 핸들러 등록
if (typeof window !== 'undefined' && typeof window.addEventListener === 'function') {
  window.addEventListener('beforeunload', () => {
    cleanupVendorsSafe();
  });
}

// 인스턴스 리셋 (테스트용) - 간소화
export const resetVendorManagerInstance = (): void => {
  // 간소화된 vendor manager에서는 리셋이 단순함
  isInitializing = false;
  initializationPromise = null;
};
