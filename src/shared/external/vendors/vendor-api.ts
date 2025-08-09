/**
 * Core External Vendor Public API
 *
 * @version 9.0.0 - TDZ 문제 해결 및 단일 초기화 보장
 * @description 외부 라이브러리 공개 API 함수들 - 안전한 초기화 패턴 적용
 */

import { logger } from '@shared/logging';
import {
  type FflateAPI,
  type PreactAPI,
  type PreactHooksAPI,
  type PreactSignalsAPI,
  type PreactCompatAPI,
} from './vendor-service';
// 정적 import로 TDZ/inlineDynamicImports 레이스를 방지
import { preactCompat as bundledCompat } from '../compat-bundled';
import { preactHooks as bundledHooks } from '../hooks-bundled';
import { preactSignals as bundledSignals } from '../signals-bundled';
import { fflateBundled } from '../fflate-bundled';

// ================================
// 안전한 벤더 로더 시스템
// ================================

interface VendorCache {
  preact?: PreactAPI;
  compat?: PreactCompatAPI;
  hooks?: PreactHooksAPI;
  signals?: PreactSignalsAPI;
  fflate?: FflateAPI;
}

const cache: VendorCache = {};
let initPromise: Promise<void> | null = null;
let initialized = false;

// CSP 안전성을 위해 외부 스크립트 로딩 제거

/**
 * Preact 안전한 로드 - CSP 호환
 */
async function ensurePreact(): Promise<void> {
  if (cache.preact) return;

  const globalPreact = (window as unknown as { preact?: PreactAPI }).preact;
  if (globalPreact) {
    cache.preact = globalPreact;
    return;
  }

  try {
    const importedPreact = await import('preact');
    cache.preact = importedPreact.default ?? importedPreact;
    return;
  } catch (error) {
    logger.error('[CSP Safe] Preact must be bundled, external loading disabled:', error);
    throw new Error('Preact 로드를 실패했습니다 - 번들에 포함되어야 합니다');
  }
}

/**
 * Preact Compat 안전한 로드 - CSP 호환
 */
async function ensureCompat(): Promise<void> {
  if (cache.compat) return;

  const globalCompat = (window as unknown as { preactCompat?: PreactCompatAPI }).preactCompat;
  if (globalCompat) {
    cache.compat = globalCompat;
    return;
  }

  try {
    // 정적 번들 포함된 compat을 사용 (동적 import 제거)
    if (bundledCompat && typeof bundledCompat.memo === 'function') {
      cache.compat = bundledCompat as unknown as PreactCompatAPI;
      return;
    }
    throw new Error('Bundled compat 모듈이 유효하지 않습니다');
  } catch (error) {
    logger.error('[CSP Safe] Preact Compat must be bundled, external loading disabled:', error);
    throw new Error('Preact Compat 로드를 실패했습니다 - 번들에 포함되어야 합니다');
  }
}

/**
 * Preact Hooks 안전한 로드 - CSP 호환
 */
async function ensureHooks(): Promise<void> {
  if (cache.hooks) return;

  const globalHooks = (window as unknown as { preactHooks?: PreactHooksAPI }).preactHooks;
  if (globalHooks) {
    cache.hooks = globalHooks;
    return;
  }

  try {
    // 정적 번들 포함된 hooks 사용
    if (bundledHooks && typeof bundledHooks.useState === 'function') {
      cache.hooks = bundledHooks;
      return;
    }
    throw new Error('Bundled hooks 모듈이 유효하지 않습니다');
  } catch (error) {
    logger.error('[CSP Safe] Preact Hooks must be bundled, external loading disabled:', error);
    throw new Error('Preact Hooks 로드를 실패했습니다 - 번들에 포함되어야 합니다');
  }
}

/**
 * Preact Signals 안전한 로드 - CSP 호환
 */
async function ensureSignals(): Promise<void> {
  if (cache.signals) return;

  const globalSignals = (window as unknown as { preactSignals?: PreactSignalsAPI }).preactSignals;
  if (globalSignals) {
    cache.signals = globalSignals;
    return;
  }

  try {
    // 정적 번들 포함된 signals 사용
    if (bundledSignals && typeof bundledSignals.signal === 'function') {
      cache.signals = bundledSignals;
      return;
    }
    throw new Error('Bundled signals 모듈이 유효하지 않습니다');
  } catch (error) {
    logger.error('[CSP Safe] Preact Signals must be bundled, external loading disabled:', error);
    throw new Error('Preact Signals 로드를 실패했습니다 - 번들에 포함되어야 합니다');
  }
}

/**
 * fflate 안전한 로드 - CSP 호환
 */
async function ensureFflate(): Promise<void> {
  if (cache.fflate) return;

  const globalFflate = (window as unknown as { fflate?: FflateAPI }).fflate;
  if (globalFflate) {
    cache.fflate = globalFflate;
    return;
  }

  try {
    // 정적 번들 포함된 fflate 사용 (동적 import 제거)
    if (fflateBundled && typeof fflateBundled.zip === 'function') {
      cache.fflate = fflateBundled as unknown as FflateAPI;
      return;
    }
    throw new Error('Bundled fflate 모듈이 유효하지 않습니다');
  } catch (error) {
    logger.error('[CSP Safe] fflate must be bundled, external loading disabled:', error);
    throw new Error('fflate 로드를 실패했습니다 - 번들에 포함되어야 합니다');
  }
}

/**
 * 모든 vendor 초기화 (앱 시작 시 한 번 호출)
 * 단일 실행을 보장하고 TDZ 문제를 방지
 */
export async function initializeVendors(): Promise<void> {
  if (initialized) return;

  if (initPromise) {
    await initPromise;
    return;
  }

  initPromise = (async () => {
    try {
      // 순서 중요: preact → compat → hooks → signals → fflate
      await ensurePreact();
      await ensureCompat();
      await ensureHooks();
      await ensureSignals();
      await ensureFflate();

      initialized = true;
      logger.info('모든 vendor 라이브러리 초기화 완료');
    } catch (error) {
      logger.error('Vendor 초기화 실패:', error);
      throw error;
    }
  })().finally(() => {
    initPromise = null;
  });

  await initPromise;
}

/**
 * 초기화 상태 확인
 */
export function isVendorsInitialized(): boolean {
  return initialized;
}

/**
 * Preact 라이브러리 접근 (동기)
 */
export function getPreact(): PreactAPI {
  if (!cache.preact) {
    throw new Error('Preact가 초기화되지 않았습니다. initializeVendors()를 먼저 호출하세요.');
  }
  return cache.preact;
}

/**
 * Preact Hooks 접근 (동기)
 */
export function getPreactHooks(): PreactHooksAPI {
  if (cache.hooks) {
    return cache.hooks;
  }
  // Fallback: allow safe access before initializeVendors by using bundled hooks
  try {
    if (bundledHooks && typeof bundledHooks.useState === 'function') {
      cache.hooks = bundledHooks;
      logger.warn('[Vendor] getPreactHooks: vendors not initialized; using bundled hooks fallback');
      return cache.hooks;
    }
  } catch {
    // ignore and throw below
  }
  throw new Error('Preact Hooks가 초기화되지 않았습니다. initializeVendors()를 먼저 호출하세요.');
}

/**
 * Preact Signals 접근 (동기)
 */
export function getPreactSignals(): PreactSignalsAPI {
  if (cache.signals) {
    return cache.signals;
  }
  // Fallback: allow safe access before initializeVendors by using bundled signals
  try {
    if (bundledSignals && typeof bundledSignals.signal === 'function') {
      cache.signals = bundledSignals;
      logger.warn(
        '[Vendor] getPreactSignals: vendors not initialized; using bundled signals fallback'
      );
      return cache.signals;
    }
  } catch {
    // ignore and throw below
  }
  throw new Error('Preact Signals가 초기화되지 않았습니다. initializeVendors()를 먼저 호출하세요.');
}

/**
 * Preact Compat 접근 (동기)
 */
export function getPreactCompat(): PreactCompatAPI {
  if (!cache.compat) {
    throw new Error(
      'Preact Compat이 초기화되지 않았습니다. initializeVendors()를 먼저 호출하세요.'
    );
  }
  return cache.compat;
}

/**
 * fflate 라이브러리 접근 (동기)
 */
export function getFflate(): FflateAPI {
  if (!cache.fflate) {
    throw new Error('fflate가 초기화되지 않았습니다. initializeVendors()를 먼저 호출하세요.');
  }
  return cache.fflate;
}

/**
 * 네이티브 다운로드 API
 */
export function getNativeDownload() {
  return {
    downloadBlob: (blob: Blob, filename: string): void => {
      const url = URL.createObjectURL(blob);
      try {
        const link = document.createElement('a');
        link.href = url;
        link.download = filename;
        link.style.display = 'none';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
      } finally {
        URL.revokeObjectURL(url);
      }
    },

    createDownloadUrl: (blob: Blob): string => {
      return URL.createObjectURL(blob);
    },

    revokeDownloadUrl: (url: string): void => {
      URL.revokeObjectURL(url);
    },
  };
}

/**
 * 테스트용 캐시 리셋
 */
export function resetVendorCache(): void {
  Object.keys(cache).forEach(key => {
    delete (cache as Record<string, unknown>)[key];
  });
  initialized = false;
  initPromise = null;
  // CSP 안전성을 위해 외부 스크립트 관련 상태 제거
  logger.debug('Vendor 캐시가 리셋되었습니다');
}
