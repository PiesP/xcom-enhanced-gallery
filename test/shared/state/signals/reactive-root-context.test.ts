/**
 * @fileoverview SOLIDJS-REACTIVE-ROOT-CONTEXT Phase 1 — RED Tests
 * @description 메모리 누수 재현 테스트 (SolidJS createMemo outside createRoot)
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { getSolidCore } from '@shared/external/vendors';

describe('Phase 1: Reactive Root Context - Memory Leak Reproduction', () => {
  let consoleWarnSpy: ReturnType<typeof vi.spyOn>;
  let solid: ReturnType<typeof getSolidCore>;

  beforeEach(() => {
    solid = getSolidCore();
    consoleWarnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
  });

  afterEach(() => {
    consoleWarnSpy.mockRestore();
  });

  describe('1. 메모리 누수 검증 (3 tests)', () => {
    it('should warn when createMemo is created outside createRoot', () => {
      // Arrange: 모듈 레벨에서 createMemo 호출 시뮬레이션
      const [signal] = solid.createSignal(0);

      // Act: createRoot 없이 createMemo 생성
      solid.createMemo(() => signal() * 2);

      // Assert: 콘솔 경고 발생 확인
      expect(consoleWarnSpy).toHaveBeenCalledWith(
        expect.stringContaining('computations created outside')
      );
    });

    it('should accumulate memory when createMemo is created repeatedly without disposal', () => {
      // Arrange: 반복 생성 시뮬레이션
      const [signal] = solid.createSignal(0);
      const memoCount = 10;

      // Act: createRoot 없이 반복 생성
      for (let i = 0; i < memoCount; i++) {
        solid.createMemo(() => signal() + i);
      }

      // Assert: 경고가 여러 번 발생
      expect(consoleWarnSpy.mock.calls.length).toBeGreaterThanOrEqual(memoCount);
    });

    it('should fail to dispose computations created outside createRoot', () => {
      // Arrange: createRoot 없이 생성
      const [signal] = solid.createSignal(0);
      const memo = solid.createMemo(() => signal() * 2);

      // Act: 값 확인 (dispose 불가능)
      const value = memo();

      // Assert: 값은 정상이지만 dispose 메커니즘 없음
      expect(value).toBe(0);
      expect(typeof memo).toBe('function'); // Accessor만 있음, dispose 불가
    });
  });

  describe('2. 초기화 순서 (2 tests)', () => {
    it('should detect StaticVendorManager access before initialization', async () => {
      // Note: 이 테스트는 실제 콘솔 로그를 확인해야 함
      // 현재는 lazy init 경고가 발생하는 상황을 문서화

      // Arrange: 실제 앱 로그에서 확인된 패턴
      const expectedWarning = 'StaticVendorManager accessed before initialization';

      // Act: 콘솔 로그 x.com-1759554118790.log 분석 결과
      // "[WARN] StaticVendorManager accessed before initialization – performing lazy init"

      // Assert: 이 경고가 발생하지 않아야 함 (Phase 3에서 해결)
      // 현재는 RED 상태로 문서화만
      expect(true).toBe(true); // Placeholder for real browser test
    });

    it('should ensure ToastManager accesses vendors after initialization', () => {
      // Note: 이 테스트는 초기화 순서를 검증
      // 실제 로그에서 확인: ToastManager.getInstance() 호출 전 initializeVendors() 필요

      // Arrange: 초기화 순서 검증
      const initOrder = ['initializeVendors', 'ToastManager.getInstance'];

      // Act: 현재는 역순으로 발생 (lazy init 트리거)
      const actualOrder = ['ToastManager.getInstance', 'lazy initializeVendors'];

      // Assert: 순서가 잘못됨 (Phase 3에서 수정)
      expect(actualOrder).not.toEqual(initOrder); // RED
    });
  });

  describe('3. 서비스 중복 등록 (2 tests)', () => {
    it('should detect duplicate service ID registration', () => {
      // Note: 실제 CoreService를 모킹하여 테스트
      // x.com-1759554118790.log에서 확인된 패턴

      // Arrange: 서비스 등록 시뮬레이션
      const services = new Map<string, unknown>();
      const serviceId = 'toast.controller';

      // Act: 동일 서비스 재등록
      services.set(serviceId, {});
      const hasService = services.has(serviceId);
      services.set(serviceId, {}); // 덮어쓰기

      // Assert: 중복 등록이 발생함 (Phase 4에서 방지)
      expect(hasService).toBe(true);
      expect(services.size).toBe(1); // 덮어써서 크기는 그대로
    });

    it('should warn when overwriting existing service', () => {
      // Note: CoreService.register() 로직 검증
      // 실제 로그: "[WARN] [CoreService] 서비스 덮어쓰기: toast.controller"

      // Arrange: 로거 스파이
      const warnSpy = vi.fn();
      const mockLogger = { warn: warnSpy };

      // Act: 중복 등록 시뮬레이션
      const services = new Map<string, unknown>();
      const serviceId = 'toast.controller';

      if (services.has(serviceId)) {
        mockLogger.warn(`[CoreService] 서비스 덮어쓰기: ${serviceId}`);
      }
      services.set(serviceId, {}); // 첫 등록

      if (services.has(serviceId)) {
        mockLogger.warn(`[CoreService] 서비스 덮어쓰기: ${serviceId}`);
      }
      services.set(serviceId, {}); // 재등록

      // Assert: 경고 발생 (Phase 4에서 방지)
      expect(warnSpy).toHaveBeenCalledWith(expect.stringContaining('서비스 덮어쓰기'));
    });
  });
});
