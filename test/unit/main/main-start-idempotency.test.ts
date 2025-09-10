/**
 * @fileoverview main.ts 시작/정리(idempotent) 및 PC 전용 글로벌 핸들러 검증
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';

// 테스트 전역 스파이 보관용 (any로 선언해 파서 문제 회피)
let addEventSpy;
let removeEventSpy;

// 모듈 캐시를 리셋하고 필요한 모듈을 모킹한 뒤 main을 동적 임포트
async function importMainWithMocks() {
  // 모듈/모킹 초기화
  vi.resetModules();

  // vendor 모듈 모킹 (테스트용 최소 구현)
  vi.doMock('@/shared/external/vendors', () => {
    const calls = { initialize: 0 };
    return {
      getFflate: vi.fn(() => ({})),
      getPreact: vi.fn(() => ({
        h: vi.fn((type, props, ...children) => ({
          type,
          props,
          children,
        })),
        render: vi.fn(),
      })),
      getPreactHooks: vi.fn(() => ({})),
      getPreactSignals: vi.fn(() => ({})),
      getPreactCompat: vi.fn(() => ({})),
      getNativeDownload: vi.fn(() => ({})),
      initializeVendors: vi.fn(async () => {
        calls.initialize += 1;
      }),
      cleanupVendors: vi.fn(async () => {}),
      // 테스트에서 호출 수를 확인하기 위한 헬퍼(직접 접근하지 않음):
      __calls: calls,
    };
  });

  // Core Services 등록 모킹: 실제 export 유지 + registerCoreServices만 덮어쓰기
  vi.mock('@/shared/services/core-services', async importOriginal => {
    const actual: any = await importOriginal();
    const { CoreService } = await import('@/shared/services/ServiceManager');
    const core = CoreService.getInstance();
    const dummy = { initialize: vi.fn(async () => {}), cleanup: vi.fn(async () => {}) } as const;
    return {
      ...actual,
      registerCoreServices: vi.fn(async () => {
        // constants의 SERVICE_KEYS와 일치하는 키로 등록
        core.register('video.control', { ...dummy, name: 'video.control' });
        core.register('media.extraction', { ...dummy, name: 'media.extraction' });
        core.register('toast.controller', { ...dummy, name: 'toast.controller' });
      }),
      ServiceDiagnostics: { diagnoseServiceManager: vi.fn(async () => {}) },
    };
  });

  // Features 레이어 서비스 최소 모킹
  vi.doMock('@/features/settings/services/SettingsService', () => ({
    SettingsService: class {
      initialize = vi.fn(async () => {});
      cleanup = vi.fn(async () => {});
    },
  }));
  vi.doMock('@/features/settings/services/TwitterTokenExtractor', () => ({
    TwitterTokenExtractor: class {
      initialize = vi.fn(async () => {});
      cleanup = vi.fn(async () => {});
    },
  }));

  // 갤러리 렌더러/앱 모킹(initialize/cleanup만)
  vi.doMock('@/features/gallery/GalleryRenderer', () => ({
    GalleryRenderer: class {
      initialize = vi.fn(async () => {});
      cleanup = vi.fn(async () => {});
    },
  }));
  vi.doMock('@/features/gallery/GalleryApp', () => ({
    GalleryApp: class {
      initialize = vi.fn(async () => {});
      cleanup = vi.fn(async () => {});
    },
  }));

  // DOMContentLoaded 자동 시작을 막기 위해 readyState를 'loading'으로 오버라이드
  try {
    Object.defineProperty(document, 'readyState', { value: 'loading', configurable: true });
  } catch {
    // jsdom에서 실패해도 무시 (즉시 시작될 수 있으므로 스파이로 검증)
  }

  // 글로벌 핸들러 감시
  addEventSpy = vi.spyOn(window, 'addEventListener');
  removeEventSpy = vi.spyOn(window, 'removeEventListener');

  // 크리티컬 서비스 사전 등록(초기화 실패로 인한 조기 종료 방지)
  const { CoreService } = await import('@/shared/services/ServiceManager');
  const core = CoreService.getInstance();
  const dummy = { initialize: vi.fn(async () => {}), cleanup: vi.fn(async () => {}) } as const;
  core.register('video.control', { ...dummy, name: 'video.control' });
  core.register('media.extraction', { ...dummy, name: 'media.extraction' });
  core.register('toast.controller', { ...dummy, name: 'toast.controller' });

  // 모듈 임포트 (default export에 start/cleanup 노출)
  const mainModule = await import('@/main');
  return mainModule.default as { start: () => Promise<void>; cleanup: () => Promise<void> };
}

describe('main start/cleanup idempotency', () => {
  beforeEach(() => {
    // 각 테스트 격리
    vi.clearAllMocks();
  });

  afterEach(() => {
    // 스파이 정리
    addEventSpy?.mockRestore();
    removeEventSpy?.mockRestore();
  });

  it('start 재호출 시 추가 등록이 없어야 함 (idempotent)', async () => {
    const main = await importMainWithMocks();

    const vendors = (await import('@/shared/external/vendors')) as unknown as any;

    // 외부 노이즈 제거 후 1차 시작
    addEventSpy.mockClear();
    removeEventSpy.mockClear();
    await main.start();

    const callsAfterFirst = addEventSpy.mock.calls.slice();
    const beforeUnloadAfterFirst = callsAfterFirst.filter(c => c[0] === 'beforeunload').length;
    const pagehideAfterFirst = callsAfterFirst.filter(c => c[0] === 'pagehide').length;

    // 2차 시작(이미 시작됨) - 추가 등록이 없어야 함
    await main.start();

    // initializeVendors는 1회만
    expect((vendors as any).initializeVendors).toHaveBeenCalledTimes(1);
    expect((vendors as any).__calls.initialize).toBe(1);

    // 2차 호출 이후 추가 등록 없음(델타 0)
    const callsAfterSecond = addEventSpy.mock.calls.slice();
    const beforeUnloadAfterSecond = callsAfterSecond.filter(c => c[0] === 'beforeunload').length;
    const pagehideAfterSecond = callsAfterSecond.filter(c => c[0] === 'pagehide').length;

    expect(beforeUnloadAfterSecond - beforeUnloadAfterFirst).toBe(0);
    expect(pagehideAfterSecond - pagehideAfterFirst).toBe(0);
  });

  it('cleanup은 글로벌 핸들러를 제거하고 재시작 시 중복 등록이 없어야 함', async () => {
    const main = await importMainWithMocks();

    // 첫 시작: 노이즈 제거 후 등록 수 스냅샷
    addEventSpy.mockClear();
    removeEventSpy.mockClear();
    await main.start();

    const addCallsFirst = addEventSpy.mock.calls.slice();
    const beforeFirst = addCallsFirst.filter(c => c[0] === 'beforeunload').length;
    const pagehideFirst = addCallsFirst.filter(c => c[0] === 'pagehide').length;

    await main.cleanup();

    const removeCalls = removeEventSpy.mock.calls.slice();
    expect(removeCalls.filter(c => c[0] === 'beforeunload').length).toBeGreaterThanOrEqual(1);
    expect(removeCalls.filter(c => c[0] === 'pagehide').length).toBeGreaterThanOrEqual(1);

    // 재시작: 다시 카운터 초기화 후 델타 1 검증
    addEventSpy.mockClear();
    removeEventSpy.mockClear();
    await main.start();
    const addCallsSecond = addEventSpy.mock.calls.slice();
    const beforeSecond = addCallsSecond.filter(c => c[0] === 'beforeunload').length;
    const pagehideSecond = addCallsSecond.filter(c => c[0] === 'pagehide').length;
    expect(beforeSecond).toBeGreaterThanOrEqual(1);
    expect(pagehideSecond).toBeGreaterThanOrEqual(1);
  });
});
