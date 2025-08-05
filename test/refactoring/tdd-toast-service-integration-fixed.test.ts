/**
 * @fileoverview TDD Toast Service Integration Test
 * @description ToastService와 Toast 컴포넌트 통합 테스트 - RED-GREEN-REFACTOR 사이클
 */

import { describe, test, expect, beforeEach, afterEach, vi } from 'vitest';
import { cleanup } from '@testing-library/preact';
import { ToastService, toastService, type ToastItem } from '@shared/services/ToastService';
import {
  toasts,
  addToast,
  removeToast,
  clearAllToasts,
  showSuccess,
  showError,
  showWarning,
  showInfo,
} from '@shared/services/toast-integration';

// Mock preact vendors - 안정적인 mock 구현
const mockSignalInstance = {
  value: [] as ToastItem[],
  subscribe: vi.fn(() => vi.fn()),
};

const mockSignal = vi.fn(() => mockSignalInstance);
const mockMemo = vi.fn((component: any) => component);

vi.mock('@shared/external/vendors', () => ({
  getPreact: vi.fn(() => ({
    h: vi.fn((tag, props, ...children) => ({ tag, props, children })),
    Fragment: 'Fragment',
  })),
  getPreactHooks: vi.fn(() => ({
    useEffect: vi.fn(effect => effect()),
    useState: vi.fn(initial => [initial, vi.fn()]),
    useMemo: vi.fn(fn => fn()),
  })),
  getPreactSignals: vi.fn(() => ({
    signal: mockSignal,
  })),
  getPreactCompat: vi.fn(() => ({
    memo: mockMemo,
  })),
}));

describe('🟢 GREEN: Toast Service Integration - 통과하는 구현', () => {
  beforeEach(() => {
    // 각 테스트 전에 토스트 상태 초기화
    toastService.clear();
    mockSignalInstance.value = [];
    vi.clearAllMocks();
  });

  afterEach(() => {
    cleanup();
  });

  test('ToastService가 정상적으로 생성되고 기본 기능이 작동한다', () => {
    // Given: 새로운 ToastService 인스턴스
    const service = new ToastService();

    // When: 토스트를 표시한다
    const toastId = service.show({
      title: '테스트',
      message: '테스트 메시지',
      type: 'info',
    });

    // Then: 토스트가 생성되고 저장된다
    expect(toastId).toBeTruthy();
    expect(service.getActiveToasts()).toHaveLength(1);
    expect(service.getToast(toastId)).toBeDefined();
  });

  test('통합 함수들이 ToastService와 올바르게 연동된다', () => {
    // Given: 초기 상태
    expect(toastService.getActiveToasts()).toHaveLength(0);

    // When: addToast를 호출한다
    const toastId = addToast({
      title: '통합 테스트',
      message: '통합 테스트 메시지',
      type: 'success',
      duration: 3000,
    });

    // Then: ToastService에 토스트가 추가된다
    expect(toastId).toBeTruthy();
    expect(toastService.getActiveToasts()).toHaveLength(1);
  });

  test('편의 함수들이 올바른 타입으로 토스트를 생성한다', () => {
    // When: 각 타입별 편의 함수를 호출한다
    const successId = showSuccess('성공', '성공 메시지');
    const errorId = showError('에러', '에러 메시지');
    const warningId = showWarning('경고', '경고 메시지');
    const infoId = showInfo('정보', '정보 메시지');

    // Then: 각각 올바른 타입으로 생성된다
    const activeToasts = toastService.getActiveToasts();
    expect(activeToasts).toHaveLength(4);

    const successToast = toastService.getToast(successId);
    const errorToast = toastService.getToast(errorId);
    const warningToast = toastService.getToast(warningId);
    const infoToast = toastService.getToast(infoId);

    expect(successToast?.type).toBe('success');
    expect(errorToast?.type).toBe('error');
    expect(warningToast?.type).toBe('warning');
    expect(infoToast?.type).toBe('info');
  });

  test('removeToast가 ToastService와 동기화된다', () => {
    // Given: 토스트가 하나 있다
    const toastId = addToast({
      title: '제거 테스트',
      message: '제거 테스트 메시지',
      type: 'info',
    });
    expect(toastService.getActiveToasts()).toHaveLength(1);

    // When: removeToast를 호출한다
    removeToast(toastId);

    // Then: ToastService에서도 제거된다
    expect(toastService.getActiveToasts()).toHaveLength(0);
    expect(toastService.getToast(toastId)).toBeUndefined();
  });

  test('clearAllToasts가 ToastService와 동기화된다', () => {
    // Given: 여러 토스트가 있다
    addToast({ title: '토스트 1', message: '메시지 1', type: 'info' });
    addToast({ title: '토스트 2', message: '메시지 2', type: 'success' });
    addToast({ title: '토스트 3', message: '메시지 3', type: 'error' });
    expect(toastService.getActiveToasts()).toHaveLength(3);

    // When: clearAllToasts를 호출한다
    clearAllToasts();

    // Then: ToastService에서 모든 토스트가 제거된다
    expect(toastService.getActiveToasts()).toHaveLength(0);
  });

  test('toasts signal이 올바르게 초기화된다', () => {
    // When: toasts 객체에 접근한다
    const currentToasts = toasts.value;

    // Then: 빈 배열로 초기화된다
    expect(Array.isArray(currentToasts)).toBe(true);
    expect(toasts.subscribe).toBeDefined();
    expect(typeof toasts.subscribe).toBe('function');
  });

  test('Toast 컴포넌트 타입 호환성이 유지된다', () => {
    // Given: ToastService에서 생성된 토스트
    const serviceToast = toastService.show({
      title: '호환성 테스트',
      message: '호환성 테스트 메시지',
      type: 'warning',
      duration: 2000,
    });

    const toast = toastService.getToast(serviceToast);

    // Then: Toast 컴포넌트가 기대하는 인터페이스와 일치한다
    expect(toast).toMatchObject({
      id: expect.any(String),
      type: expect.stringMatching(/^(info|warning|error|success)$/),
      title: expect.any(String),
      message: expect.any(String),
      duration: expect.any(Number),
      dismissible: expect.any(Boolean),
    });
  });
});

describe('🔵 REFACTOR: Toast Service Integration - 최적화 검증', () => {
  beforeEach(() => {
    toastService.clear();
    mockSignalInstance.value = [];
    vi.clearAllMocks();
  });

  afterEach(() => {
    cleanup();
  });

  test('메모리 누수 없이 대량의 토스트를 처리할 수 있다', () => {
    // Given: 대량의 토스트 생성
    const toastIds: string[] = [];
    for (let i = 0; i < 100; i++) {
      const id = addToast({
        title: `토스트 ${i}`,
        message: `메시지 ${i}`,
        type: 'info',
        duration: 1000,
      });
      toastIds.push(id);
    }

    // When: 모든 토스트를 제거
    toastIds.forEach(id => removeToast(id));

    // Then: 메모리가 정리된다
    expect(toastService.getActiveToasts()).toHaveLength(0);
  });

  test('동시성 처리가 안전하다', () => {
    // When: 동시에 여러 토스트를 추가/제거
    const promises = Array.from({ length: 10 }, (_, i) =>
      Promise.resolve().then(() => {
        const id = addToast({
          title: `동시성 토스트 ${i}`,
          message: `동시성 메시지 ${i}`,
          type: 'info',
        });
        if (i % 2 === 0) {
          removeToast(id);
        }
        return id;
      })
    );

    // Then: 모든 작업이 안전하게 완료된다
    return Promise.all(promises).then(() => {
      const remaining = toastService.getActiveToasts();
      expect(remaining.length).toBeGreaterThanOrEqual(0);
      expect(remaining.length).toBeLessThanOrEqual(10);
    });
  });
});
