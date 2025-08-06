/**
 * @fileoverview Toast Service Integration
 * @description ToastService와 Toast 컴포넌트 간의 통합 레이어
 */

import { toastService, type ToastItem, type ToastOptions } from './toast-service';

// 전역 토스트 상태 관리
let _toastsSignal: {
  value: ToastItem[];
  subscribe: (callback: (value: ToastItem[]) => void) => () => void;
} | null = null;

/**
 * 토스트 signal 초기화 및 반환
 */
function getToastsSignal() {
  if (!_toastsSignal) {
    try {
      const { getPreactSignals } = require('@shared/external/vendors');
      const { signal } = getPreactSignals();
      _toastsSignal = signal([]);
    } catch {
      // 테스트 환경이나 signal이 없는 경우 fallback
      _toastsSignal = {
        value: [],
        subscribe: () => () => {},
      };
    }
  }
  return _toastsSignal;
}

/**
 * 통합된 토스트 상태 객체
 */
export const toasts = {
  get value(): ToastItem[] {
    const signal = getToastsSignal();
    return signal ? signal.value : [];
  },
  set value(newValue: ToastItem[]) {
    const signal = getToastsSignal();
    if (signal) {
      signal.value = newValue;
    }
  },
  subscribe(callback: (value: ToastItem[]) => void) {
    const signal = getToastsSignal();
    return signal ? signal.subscribe(callback) : () => {};
  },
};

/**
 * ToastService와 signal 동기화
 */
function syncToastsWithService(): void {
  const serviceToasts = toastService.getActiveToasts();
  toasts.value = serviceToasts;
}

/**
 * ToastService를 통해 토스트 추가
 */
export function addToast(toast: Omit<ToastItem, 'id'>): string {
  // title이 없으면 기본값 사용
  const title = toast.title || '알림';

  const options: ToastOptions = {
    title,
    message: toast.message,
    type: toast.type,
    ...(toast.duration !== undefined && { duration: toast.duration }),
    dismissible: true,
  };

  const id = toastService.show(options);
  syncToastsWithService();
  return id;
}

/**
 * ToastService를 통해 토스트 제거
 */
export function removeToast(id: string): void {
  toastService.dismiss(id);
  syncToastsWithService();
}

/**
 * 모든 토스트 제거
 */
export function clearAllToasts(): void {
  toastService.clear();
  syncToastsWithService();
}

/**
 * 성공 토스트 표시
 */
export function showSuccess(title: string, message: string, duration?: number): string {
  const id = toastService.success(title, message, duration);
  syncToastsWithService();
  return id;
}

/**
 * 에러 토스트 표시
 */
export function showError(title: string, message: string, duration?: number): string {
  const id = toastService.error(title, message, duration);
  syncToastsWithService();
  return id;
}

/**
 * 경고 토스트 표시
 */
export function showWarning(title: string, message: string, duration?: number): string {
  const id = toastService.warning(title, message, duration);
  syncToastsWithService();
  return id;
}

/**
 * 정보 토스트 표시
 */
export function showInfo(title: string, message: string, duration?: number): string {
  const id = toastService.info(title, message, duration);
  syncToastsWithService();
  return id;
}

// 지연 초기화 (lazy initialization)으로 순환 참조 문제 해결
setTimeout(() => {
  try {
    syncToastsWithService();
  } catch {
    // 초기화 실패 시 무시 (테스트 환경 등)
  }
}, 0);
