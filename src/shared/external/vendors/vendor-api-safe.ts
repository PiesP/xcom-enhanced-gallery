/**
 * @fileoverview TDZ 안전한 Vendor API
 * @description 정적 import 기반으로 TDZ 문제를 해결한 안전한 vendor 접근 API
 *
 * Phase 6: Solid.js only - Preact 제거 완료
 */

import { logger } from '../../logging';
import {
  StaticVendorManager,
  type SolidAPI,
  type SolidWebAPI,
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
  if (staticVendorManager.getInitializationStatus().isInitialized) {
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

    initializationPromise = staticVendorManager.initialize();
    await initializationPromise;

    logger.info('✅ 안전한 Vendor 초기화 완료');
  } catch (error) {
    logger.error('❌ 안전한 Vendor 초기화 실패:', error);
    throw error;
  } finally {
    isInitializing = false;
  }
}

// Phase 6: Preact 함수들 모두 제거 완료

/**
 * Solid.js 안전 접근 (동기) - TDZ 방지
 * 초기화 여부와 관계없이 정적 import된 solid 객체 반환
 */
export function getSolidSafe(): SolidAPI {
  try {
    return staticVendorManager.getSolid();
  } catch (error) {
    // 초기화되지 않았어도 정적 import는 항상 가능
    logger.warn('Solid.js가 아직 초기화되지 않았지만 정적 import 사용:', error);
    return staticVendorManager.getSolid();
  }
}

/**
 * Solid.js Web 안전 접근 (동기) - TDZ 문제 완전 해결
 * 초기화 여부와 관계없이 정적 import된 solidWeb 객체 반환
 */
export function getSolidWebSafe(): SolidWebAPI {
  try {
    return staticVendorManager.getSolidWeb();
  } catch (error) {
    // 초기화되지 않았어도 정적 import는 항상 가능
    logger.warn('Solid.js Web이 아직 초기화되지 않았지만 정적 import 사용:', error);
    return staticVendorManager.getSolidWeb();
  }
}

/**
 * 네이티브 다운로드 안전 접근
 */
export const getNativeDownloadSafe = (): NativeDownloadAPI => {
  try {
    return staticVendorManager.getNativeDownload();
  } catch (error) {
    logger.error('Native Download 접근 실패:', error);
    throw new Error('네이티브 다운로드 기능을 사용할 수 없습니다.');
  }
};

/**
 * 모든 라이브러리 검증
 */
export const validateVendorsSafe = () => staticVendorManager.validateAll();

/**
 * 버전 정보 조회
 */
export const getVendorVersionsSafe = () => staticVendorManager.getVersionInfo();

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
  return staticVendorManager.getInitializationStatus().isInitialized;
}

/**
 * vendor 초기화 보고서 생성
 */
export function getVendorInitializationReportSafe() {
  const status = staticVendorManager.getInitializationStatus();
  const versions = getVendorVersionsSafe();

  return {
    isInitialized: status.isInitialized,
    cacheSize: status.cacheSize,
    availableAPIs: status.availableAPIs,
    versions,
    initializationRate: status.isInitialized ? 100 : 0,
    totalCount: 2, // solid-js, solid-js/web
    initializedCount: status.isInitialized ? 2 : 0,
  };
}

// 정리 핸들러 등록 (명시적 호출로 변경하여 import 시 부작용 제거)
export function registerVendorCleanupOnUnloadSafe(
  target: Window | undefined = typeof window !== 'undefined' ? window : undefined
): void {
  try {
    if (!target) return;
    const handler = () => {
      try {
        cleanupVendorsSafe();
      } catch {
        // ignore
      }
    };
    target.addEventListener('beforeunload', handler);
  } catch {
    // ignore
  }
}

// 인스턴스 리셋 (테스트용)
export const resetVendorManagerInstance = (): void => {
  StaticVendorManager.resetInstance();
  isInitializing = false;
  initializationPromise = null;
};

// Phase 6: Preact deprecated exports 제거 완료
// 이제 Solid.js만 지원합니다.
