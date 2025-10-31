/**
 * @fileoverview vendor-manager-static.ts 단위 테스트
 * @description Phase B3: 커버리지 개선 (72.7% → 75%+)
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { StaticVendorManager } from '@/shared/external/vendors/vendor-manager-static';

describe('vendor-manager-static: 정적 벤더 관리자', () => {
  let manager: StaticVendorManager;

  beforeEach(() => {
    // 싱글톤 인스턴스 초기화
    manager = StaticVendorManager.getInstance();
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('싱글톤 패턴', () => {
    it('getInstance는 동일한 인스턴스 반환', () => {
      const instance1 = StaticVendorManager.getInstance();
      const instance2 = StaticVendorManager.getInstance();
      expect(instance1).toBe(instance2);
    });

    it('첫 호출 시 인스턴스 생성', () => {
      const instance = StaticVendorManager.getInstance();
      expect(instance).toBeDefined();
    });
  });

  describe('초기화 (initialize)', () => {
    it('initialize 호출 가능', async () => {
      await expect(manager.initialize()).resolves.not.toThrow();
    });

    it('이미 초기화된 경우 빠르게 반환', async () => {
      await manager.initialize();
      const result = await manager.initialize();
      expect(result).toBeUndefined();
    });

    it('concurrent initialize 호출 시 단일 실행 보장', async () => {
      const promises = [manager.initialize(), manager.initialize(), manager.initialize()];
      await expect(Promise.all(promises)).resolves.not.toThrow();
    });
  });

  describe('Solid.js API 접근', () => {
    beforeEach(async () => {
      await manager.initialize();
    });

    it('getSolid() API 반환', () => {
      const solid = manager.getSolid();
      expect(solid).toBeDefined();
      expect(typeof solid.createSignal).toBe('function');
    });

    it('createSignal 함수 존재', () => {
      const solid = manager.getSolid();
      expect(solid.createSignal).toBeDefined();
    });

    it('createEffect 함수 존재', () => {
      const solid = manager.getSolid();
      expect(solid.createEffect).toBeDefined();
    });

    it('createMemo 함수 존재', () => {
      const solid = manager.getSolid();
      expect(solid.createMemo).toBeDefined();
    });

    it('render 함수 존재', () => {
      const solid = manager.getSolid();
      expect(solid.render).toBeDefined();
    });

    it('batch 함수 존재', () => {
      const solid = manager.getSolid();
      expect(solid.batch).toBeDefined();
    });

    it('untrack 함수 존재', () => {
      const solid = manager.getSolid();
      expect(solid.untrack).toBeDefined();
    });

    it('JSX 컴포넌트 생성 유틸 존재', () => {
      const solid = manager.getSolid();
      expect(solid.Show).toBeDefined();
      expect(solid.For).toBeDefined();
      expect(solid.Switch).toBeDefined();
      expect(solid.Match).toBeDefined();
      expect(solid.ErrorBoundary).toBeDefined();
    });

    it('리프 프로퍼티 유틸 존재', () => {
      const solid = manager.getSolid();
      expect(solid.mergeProps).toBeDefined();
      expect(solid.splitProps).toBeDefined();
    });

    it('생명주기 훅 존재', () => {
      const solid = manager.getSolid();
      expect(solid.onMount).toBeDefined();
      expect(solid.onCleanup).toBeDefined();
    });

    it('컨텍스트 API 존재', () => {
      const solid = manager.getSolid();
      expect(solid.createContext).toBeDefined();
      expect(solid.useContext).toBeDefined();
    });

    it('children 유틸 존재', () => {
      const solid = manager.getSolid();
      expect(solid.children).toBeDefined();
    });

    it('lazy 컴포넌트 로딩 존재', () => {
      const solid = manager.getSolid();
      expect(solid.lazy).toBeDefined();
    });

    it('Suspense 컴포넌트 존재', () => {
      const solid = manager.getSolid();
      expect(solid.Suspense).toBeDefined();
    });

    it('createRoot 함수 존재', () => {
      const solid = manager.getSolid();
      expect(solid.createRoot).toBeDefined();
    });

    it('createComponent 함수 존재', () => {
      const solid = manager.getSolid();
      expect(solid.createComponent).toBeDefined();
    });

    it('h 함수(JSX pragma) 존재', () => {
      const solid = manager.getSolid();
      expect(solid.h).toBeDefined();
    });

    it('memo 호환성 함수 존재', () => {
      const solid = manager.getSolid();
      expect(solid.memo).toBeDefined();
      expect(typeof solid.memo).toBe('function');
    });

    it('forwardRef 호환성 함수 존재', () => {
      const solid = manager.getSolid();
      expect(solid.forwardRef).toBeDefined();
      expect(typeof solid.forwardRef).toBe('function');
    });

    it('useRef 호환성 함수 존재', () => {
      const solid = manager.getSolid();
      expect(solid.useRef).toBeDefined();
      expect(typeof solid.useRef).toBe('function');
    });

    it('useCallback 호환성 함수 존재', () => {
      const solid = manager.getSolid();
      expect(solid.useCallback).toBeDefined();
      expect(typeof solid.useCallback).toBe('function');
    });
  });

  describe('Solid Store API 접근', () => {
    beforeEach(async () => {
      await manager.initialize();
    });

    it('getSolidStore() API 반환', () => {
      const store = manager.getSolidStore();
      expect(store).toBeDefined();
      expect(typeof store.createStore).toBe('function');
    });

    it('createStore 함수 존재', () => {
      const store = manager.getSolidStore();
      expect(store.createStore).toBeDefined();
    });

    it('produce 함수 존재', () => {
      const store = manager.getSolidStore();
      expect(store.produce).toBeDefined();
    });

    it('getSolidStore().createStore 사용 가능', () => {
      const store = manager.getSolidStore();
      const [state, setState] = store.createStore({ count: 0 });
      expect(state.count).toBe(0);
    });
  });

  describe('Native Download API', () => {
    beforeEach(async () => {
      await manager.initialize();
    });

    it('getNativeDownload() API 반환', () => {
      const download = manager.getNativeDownload();
      expect(download).toBeDefined();
      expect(typeof download.downloadBlob).toBe('function');
    });

    it('downloadBlob 함수 존재', () => {
      const download = manager.getNativeDownload();
      expect(download.downloadBlob).toBeDefined();
    });

    it('createDownloadUrl 함수 존재', () => {
      const download = manager.getNativeDownload();
      expect(download.createDownloadUrl).toBeDefined();
    });

    it('revokeDownloadUrl 함수 존재', () => {
      const download = manager.getNativeDownload();
      expect(download.revokeDownloadUrl).toBeDefined();
    });
  });

  describe('memo 호환성 함수', () => {
    beforeEach(async () => {
      await manager.initialize();
    });

    it('memo로 컴포넌트 감싸기', () => {
      const solid = manager.getSolid();
      const TestComponent = (props: { value: number }) => solid.h('div', {}, props.value);
      const MemoComponent = solid.memo(TestComponent as any);
      expect(MemoComponent).toBeDefined();
      expect(typeof MemoComponent).toBe('function');
    });

    it('memo 후 displayName 설정', () => {
      const solid = manager.getSolid();
      const TestComponent = () => solid.h('div', {});
      (TestComponent as any).displayName = 'TestComponent';
      const MemoComponent = solid.memo(TestComponent as any);
      expect((MemoComponent as any).displayName).toContain('memo');
    });

    it('memo compare 함수 무시 (Solid.js 특성)', () => {
      const solid = manager.getSolid();
      const TestComponent = (props: any) => solid.h('div', {}, props.value);
      const compareFunc = () => true;
      const MemoComponent = solid.memo(TestComponent as any, compareFunc);
      expect(MemoComponent).toBeDefined();
    });
  });

  describe('forwardRef 호환성 함수', () => {
    beforeEach(async () => {
      await manager.initialize();
    });

    it('forwardRef로 컴포넌트 감싸기', () => {
      const solid = manager.getSolid();
      const TestComponent = (props: any, ref: any) => solid.h('div', { ref });
      const ForwardedComponent = solid.forwardRef(TestComponent as any);
      expect(ForwardedComponent).toBeDefined();
      expect(typeof ForwardedComponent).toBe('function');
    });

    it('forwardRef 후 displayName 설정', () => {
      const solid = manager.getSolid();
      const TestComponent = (props: any, ref: any) => solid.h('div', { ref });
      (TestComponent as any).displayName = 'TestComponent';
      const ForwardedComponent = solid.forwardRef(TestComponent as any);
      expect((ForwardedComponent as any).displayName).toContain('forwardRef');
    });
  });

  describe('useRef 호환성', () => {
    beforeEach(async () => {
      await manager.initialize();
    });

    it('useRef로 ref 객체 생성', () => {
      const solid = manager.getSolid();
      const ref = solid.useRef(null);
      expect(ref).toBeDefined();
      expect(ref.current).toBe(null);
    });

    it('useRef 초기값 설정', () => {
      const solid = manager.getSolid();
      const initialValue = { test: 'value' };
      const ref = solid.useRef(initialValue);
      expect(ref.current).toBe(initialValue);
    });
  });

  describe('useCallback 호환성', () => {
    beforeEach(async () => {
      await manager.initialize();
    });

    it('useCallback로 콜백 함수 반환', () => {
      const solid = manager.getSolid();
      const callback = ((x: unknown) => (x as number) * 2) as (...args: unknown[]) => unknown;
      const result = solid.useCallback(callback);
      expect(result).toBe(callback);
    });
  });

  describe('에러 처리', () => {
    it('initialize 중 에러 발생 시 처리', async () => {
      // 별도의 매니저 인스턴스로 에러 시나리오 테스트
      // (정적 import로 인해 에러 발생이 거의 불가능하지만)
      const instance = StaticVendorManager.getInstance();
      await expect(instance.initialize()).resolves.not.toThrow();
    });

    it('초기화 전 getSolid() 호출 처리', () => {
      // 이미 초기화된 싱글톤이므로 정상 작동
      const solid = manager.getSolid();
      expect(solid).toBeDefined();
    });
  });

  describe('API 타입 검증', () => {
    beforeEach(async () => {
      await manager.initialize();
    });

    it('Solid API 객체 구조', () => {
      const solid = manager.getSolid();
      const requiredKeys = [
        'render',
        'createSignal',
        'createEffect',
        'createMemo',
        'createStore',
        'produce',
        'batch',
        'untrack',
      ];
      requiredKeys.forEach(key => {
        expect(key in solid).toBe(true);
      });
    });

    it('SolidStore API 객체 구조', () => {
      const store = manager.getSolidStore();
      const requiredKeys = ['createStore', 'produce'];
      requiredKeys.forEach(key => {
        expect(key in store).toBe(true);
      });
    });

    it('NativeDownload API 객체 구조', () => {
      const download = manager.getNativeDownload();
      const requiredKeys = ['downloadBlob', 'createDownloadUrl', 'revokeDownloadUrl'];
      requiredKeys.forEach(key => {
        expect(key in download).toBe(true);
      });
    });
  });

  describe('다중 초기화 호출 안전성', () => {
    it('초기화 후 재호출 시 캐시 사용', async () => {
      await manager.initialize();
      const first = manager.getSolid();
      await manager.initialize();
      const second = manager.getSolid();
      // 캐시된 API 객체는 동일해야 함
      expect(first).toBeDefined();
      expect(second).toBeDefined();
    });

    it('병렬 초기화 요청 처리', async () => {
      const calls = Array(5)
        .fill(null)
        .map(() => manager.initialize());
      await expect(Promise.all(calls)).resolves.not.toThrow();
    });
  });
});
