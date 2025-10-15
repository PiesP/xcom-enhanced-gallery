/**
 * @fileoverview TDZ 안전한 Vendor API (Solid.js)
 * @description 정적 import 기반으로 TDZ 문제를 해결한 안전한 vendor 접근 API
 *
 * TDD Phase: GREEN - 안전한 초기화와 동기 접근 보장 (Solid.js 마이그레이션)
 */

import { logger } from '../../logging';
import {
  StaticVendorManager,
  type SolidAPI,
  type SolidStoreAPI,
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
    logger.info('🚀 안전한 Vendor 초기화 시작 (Solid.js)...');

    initializationPromise = staticVendorManager.initialize();
    await initializationPromise;

    logger.info('✅ 안전한 Vendor 초기화 완료 (Solid.js)');
  } catch (error) {
    logger.error('❌ 안전한 Vendor 초기화 실패:', error);
    throw error;
  } finally {
    isInitializing = false;
  }
}

/**
 * Solid.js 라이브러리 안전 접근 (동기)
 */
export function getSolidSafe(): SolidAPI {
  try {
    return staticVendorManager.getSolid();
  } catch (error) {
    logger.error('Solid.js 접근 실패:', error);
    throw new Error('Solid.js 라이브러리를 사용할 수 없습니다. 초기화가 필요합니다.');
  }
}

/**
 * Solid.js Store 안전 접근 (동기)
 */
export function getSolidStoreSafe(): SolidStoreAPI {
  try {
    return staticVendorManager.getSolidStore();
  } catch (error) {
    logger.error('Solid.js Store 접근 실패:', error);
    throw new Error('Solid.js Store 라이브러리를 사용할 수 없습니다. 초기화가 필요합니다.');
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

  const expectedVendors = ['solid', 'solid-store'] as const;
  const initializedCount = expectedVendors.filter(vendor =>
    status.availableAPIs.includes(vendor)
  ).length;
  const initializationRate = expectedVendors.length
    ? Math.round((initializedCount / expectedVendors.length) * 100)
    : 100;

  return {
    isInitialized: status.isInitialized,
    cacheSize: status.cacheSize,
    availableAPIs: status.availableAPIs,
    versions,
    initializationRate,
    totalCount: expectedVendors.length,
    initializedCount,
  };
}

/**
 * vendor 상태 확인
 */
export function getVendorStatusesSafe() {
  const status = staticVendorManager.getInitializationStatus();

  if (!status.isInitialized) {
    return {
      solid: false,
      solidStore: false,
    };
  }

  return {
    solid: status.availableAPIs.includes('solid'),
    solidStore: status.availableAPIs.includes('solid-store'),
  };
}

/**
 * 개별 vendor 초기화 확인
 */
export function isVendorInitializedSafe(vendorName: string): boolean {
  const statuses = getVendorStatusesSafe();

  switch (vendorName) {
    case 'solid':
      return statuses.solid;
    case 'solidStore':
      return statuses.solidStore;
    default:
      return false;
  }
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

// ================================
// Solid.js 함수들 직접 export (UI 컴포넌트/테스트 편의용)
// ================================

/**
 * Solid.js render 함수
 */
export const render = getSolidSafe().render;

/**
 * Solid.js createSignal
 */
export const createSignal = getSolidSafe().createSignal;

/**
 * Solid.js createEffect
 */
export const createEffect = getSolidSafe().createEffect;

/**
 * Solid.js createMemo
 */
export const createMemo = getSolidSafe().createMemo;

/**
 * Solid.js Show 컴포넌트
 */
export const Show = getSolidSafe().Show;

/**
 * Solid.js For 컴포넌트
 */
export const For = getSolidSafe().For;

/**
 * Solid.js batch 함수
 */
export const batch = getSolidSafe().batch;
