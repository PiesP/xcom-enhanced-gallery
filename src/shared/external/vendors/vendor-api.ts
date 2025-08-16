/**
 * Core External Vendor Public API
 *
 * @version 9.0.0 - TDZ 문제 해결 및 단일 초기화 보장
 * @description 외부 라이브러리 공개 API 함수들 - 안전한 초기화 패턴 적용
 */

import { logger } from '@shared/logging';
// 순환 의존성 제거: 직접 타입 정의
// 정적 import로 TDZ/inlineDynamicImports 레이스를 방지
import { preactCompat as bundledCompat } from '../compat-bundled';
// hooks/signals는 provider를 통해 접근 (테스트 주입 가능)
import { getBundledHooks, getBundledSignals } from './vendor-providers';
import { fflateBundled } from '../fflate-bundled';
import type {
  FflateAPI,
  PreactAPI,
  PreactHooksAPI,
  PreactSignalsAPI,
  PreactCompatAPI,
  NativeDownloadAPI,
} from './types';

// Re-export types for compatibility
export type {
  FflateAPI,
  PreactAPI,
  PreactHooksAPI,
  PreactSignalsAPI,
  PreactCompatAPI,
  NativeDownloadAPI,
  VNode,
  Ref,
  ComponentChildren,
} from './types';

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
let diagnosticsLogged = false; // lazy diagnostic 1회만 출력

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
  // 동적 import 금지: userscript는 CDN @require를 통해 전역 주입을 사용합니다.
  logger.error('[CSP Safe] window.preact 가 필요합니다 (@require 누락)');
  throw new Error('Preact 전역이 없습니다. Userscript 헤더의 @require를 확인하세요.');
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
    const localHooks = getBundledHooks();
    if (localHooks && typeof localHooks.useState === 'function') {
      cache.hooks = localHooks;
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

  const globalSignals =
    (window as unknown as { preactSignals?: PreactSignalsAPI }).preactSignals ||
    (window as unknown as { signals?: PreactSignalsAPI }).signals;
  if (globalSignals) {
    cache.signals = globalSignals;
    return;
  }

  try {
    // 정적 번들 포함된 signals 사용
    const localSignals = getBundledSignals();
    if (localSignals && typeof localSignals.signal === 'function') {
      cache.signals = localSignals;
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
  if (!diagnosticsLogged) {
    diagnosticsLogged = true;
    logger.debug('[Vendor] hooks/signals accessed before initializeVendors - using fallback path');
  }
  // Fallback: allow safe access before initializeVendors by using bundled hooks
  try {
    const localHooks = getBundledHooks();
    if (localHooks && typeof localHooks.useState === 'function') {
      cache.hooks = localHooks;
      logger.warn('[Vendor] getPreactHooks: vendors not initialized; using bundled hooks fallback');
      return cache.hooks;
    }
  } catch {
    // ignore
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
  if (!diagnosticsLogged) {
    diagnosticsLogged = true;
    logger.debug('[Vendor] hooks/signals accessed before initializeVendors - using fallback path');
  }
  // Fallback: allow safe access before initializeVendors by using bundled signals
  try {
    const localSignals = getBundledSignals();
    if (localSignals && typeof localSignals.signal === 'function') {
      cache.signals = localSignals;
      logger.warn(
        '[Vendor] getPreactSignals: vendors not initialized; using bundled signals fallback'
      );
      return cache.signals;
    }
  } catch {
    // ignore
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
 * 네이티브 다운로드 API (싱글톤)
 */
let nativeDownloadInstance: NativeDownloadAPI | null = null;

export function getNativeDownload() {
  if (nativeDownloadInstance) return nativeDownloadInstance;

  nativeDownloadInstance = {
    downloadBlob: (blob: Blob, filename: string): void => {
      // 테스트/서버 환경 안전 가드: URL.createObjectURL 미구현 또는 document 미존재 시 no-op
      const hasCreateObjectURL =
        typeof URL !== 'undefined' && typeof URL.createObjectURL === 'function';
      const hasRevokeObjectURL =
        typeof URL !== 'undefined' && typeof URL.revokeObjectURL === 'function';
      const hasDocument = typeof document !== 'undefined' && !!document.body;

      if (!hasCreateObjectURL || !hasRevokeObjectURL || !hasDocument) {
        logger.debug(
          '[Vendor] downloadBlob: environment lacks DOM/ObjectURL, skipping actual download'
        );
        return;
      }

      const url = URL.createObjectURL(blob);
      try {
        const link = document.createElement('a');
        link.href = url;
        link.download = filename;
        link.style.display = 'none';
        document.body.appendChild(link);
        // 일부 테스트 환경에서 click이 구현되지 않았을 수 있으므로 방어적 호출
        try {
          link.click();
        } catch {
          link.dispatchEvent(new MouseEvent('click', { bubbles: true, cancelable: true }));
        }
        document.body.removeChild(link);
      } finally {
        URL.revokeObjectURL(url);
      }
    },

    createDownloadUrl: (blob: Blob): string => {
      const hasCreateObjectURL =
        typeof URL !== 'undefined' && typeof URL.createObjectURL === 'function';
      if (!hasCreateObjectURL) {
        logger.debug('[Vendor] createDownloadUrl: URL.createObjectURL unavailable');
        return '';
      }
      return URL.createObjectURL(blob);
    },

    revokeDownloadUrl: (url: string): void => {
      const hasRevokeObjectURL =
        typeof URL !== 'undefined' && typeof URL.revokeObjectURL === 'function';
      if (!hasRevokeObjectURL) return;
      URL.revokeObjectURL(url);
    },
  };

  return nativeDownloadInstance;
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
