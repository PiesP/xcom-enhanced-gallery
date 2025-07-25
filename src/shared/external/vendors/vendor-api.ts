/**
 * Core External Vendor Public API
 *
 * @version 8.0.0 - Clean Architecture 완전 적용
 * @description 외부 라이브러리 공개 API 함수들 - Core 레이어로 이동 완료
 */

import { logger } from '@shared/logging';
import {
  VendorManager,
  type FflateAPI,
  type PreactAPI,
  type PreactHooksAPI,
  type PreactSignalsAPI,
  type PreactCompatAPI,
  type MotionAPI,
  type NativeDownloadAPI,
} from './vendor-manager';

// ================================
// 공개 API
// ================================

const vendorManager = VendorManager.getInstance();

// 동기 접근을 위한 캐시된 API들
let cachedFflate: FflateAPI | null = null;
let cachedPreact: PreactAPI | null = null;
let cachedPreactHooks: PreactHooksAPI | null = null;
let cachedPreactSignals: PreactSignalsAPI | null = null;
let cachedPreactCompat: PreactCompatAPI | null = null;
let cachedMotion: MotionAPI | null = null;
let isInitialized = false;

/**
 * 모든 vendor 초기화 (앱 시작 시 한 번 호출)
 */
export async function initializeVendors(): Promise<void> {
  if (isInitialized) return;

  try {
    const [fflate, preact, hooks, signals, compat, motion] = await Promise.all([
      vendorManager.getFflate(),
      vendorManager.getPreact(),
      vendorManager.getPreactHooks(),
      vendorManager.getPreactSignals(),
      vendorManager.getPreactCompat(),
      Promise.resolve(vendorManager.getMotion()),
    ]);

    cachedFflate = fflate;
    cachedPreact = preact;
    cachedPreactHooks = hooks;
    cachedPreactSignals = signals;
    cachedPreactCompat = compat;
    cachedMotion = motion;
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
  if (!cachedFflate) {
    throw new Error('fflate가 초기화되지 않았습니다. initializeVendors()를 먼저 호출하세요.');
  }
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
    throw new Error(
      'Preact Compat이 초기화되지 않았습니다. initializeVendors()를 먼저 호출하세요.'
    );
  }
  return cachedPreactCompat;
}

/**
 * Motion One 접근 (동기)
 */
export function getMotion(): MotionAPI {
  if (!cachedMotion) {
    throw new Error('Motion이 초기화되지 않았습니다. initializeVendors()를 먼저 호출하세요.');
  }
  return cachedMotion;
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
  cachedFflate = null;
  cachedPreact = null;
  cachedPreactHooks = null;
  cachedPreactSignals = null;
  cachedMotion = null;
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
  const statuses = {
    fflate: { initialized: !!cachedFflate },
    preact: { initialized: !!cachedPreact },
    preactHooks: { initialized: !!cachedPreactHooks },
    preactSignals: { initialized: !!cachedPreactSignals },
    motion: { initialized: !!cachedMotion },
  };

  const initializedCount = Object.values(statuses).filter(status => status.initialized).length;
  const totalCount = Object.keys(statuses).length;
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
    fflate: !!cachedFflate,
    preact: !!cachedPreact,
    preactHooks: !!cachedPreactHooks,
    preactSignals: !!cachedPreactSignals,
    motion: !!cachedMotion,
  };
}

/**
 * 개별 vendor 초기화 확인
 */
export function isVendorInitialized(vendorName: string): boolean {
  switch (vendorName) {
    case 'fflate':
      return !!cachedFflate;
    case 'preact':
      return !!cachedPreact;
    case 'preactHooks':
      return !!cachedPreactHooks;
    case 'preactSignals':
      return !!cachedPreactSignals;
    case 'motion':
      return !!cachedMotion;
    default:
      return false;
  }
}

// 정리 핸들러 등록
if (typeof window !== 'undefined') {
  window.addEventListener('beforeunload', () => {
    cleanupVendors();
  });
}
