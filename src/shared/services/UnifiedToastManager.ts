/**
 * @fileoverview 통합된 Toast 관리자
 * @description ToastController와 Toast 컴포넌트의 중복 상태 관리를 통합한 단일 관리자
 * @version 1.0.0 - TDD 기반 중복 제거 구현
 */

import { logger } from '@shared/logging/logger';
import { getPreactSignals } from '@shared/external/vendors';

// 통합된 Toast 타입 정의
export interface ToastItem {
  id: string;
  type: 'info' | 'success' | 'warning' | 'error';
  title: string;
  message: string;
  duration?: number;
  actionText?: string;
  onAction?: () => void;
}

export interface ToastOptions {
  title: string;
  message: string;
  type?: ToastItem['type'];
  duration?: number;
  actionText?: string;
  onAction?: () => void;
}

/**
 * 통합된 Toast 관리자 클래스
 *
 * 기존 ToastController.ts의 Map 기반 상태 관리와
 * Toast.tsx의 signals 기반 상태 관리를 통합하여
 * 단일 소스의 진실(Single Source of Truth)을 제공합니다.
 */
export class ToastManager {
  private static instance: ToastManager | null = null;
  private readonly toastsSignal: {
    value: ToastItem[];
    subscribe: (callback: (value: ToastItem[]) => void) => () => void;
  };
  private toastIdCounter = 0;
  private readonly subscribers = new Set<(toasts: ToastItem[]) => void>();

  private constructor() {
    // Preact signals를 사용한 반응형 상태 관리
    const { signal } = getPreactSignals();
    this.toastsSignal = signal<ToastItem[]>([]);

    // signals의 변화를 감지하여 구독자들에게 알림
    this.toastsSignal.subscribe(this.notifySubscribers.bind(this));

    logger.debug('[ToastManager] 초기화됨');
  }

  /**
   * 싱글톤 인스턴스 가져오기
   */
  public static getInstance(): ToastManager {
    if (!ToastManager.instance) {
      ToastManager.instance = new ToastManager();
    }
    return ToastManager.instance;
  }

  /**
   * Toast 표시 - 기본 메서드
   */
  public show(options: ToastOptions): string {
    const id = this.generateId();
    const toast: ToastItem = {
      id,
      type: options.type ?? 'info',
      title: options.title,
      message: options.message,
      ...(options.duration !== undefined && { duration: options.duration }),
      ...(options.actionText && { actionText: options.actionText }),
      ...(options.onAction && { onAction: options.onAction }),
    };

    // signals를 통한 상태 업데이트
    const currentToasts = this.toastsSignal.value || [];
    this.toastsSignal.value = [...currentToasts, toast];

    logger.debug(`[ToastManager] Toast 표시: ${options.title} - ${options.message}`);
    return id;
  }

  /**
   * 성공 Toast 표시
   */
  public success(title: string, message: string, options: Partial<ToastOptions> = {}): string {
    return this.show({
      title,
      message,
      type: 'success',
      ...options,
    });
  }

  /**
   * 정보 Toast 표시
   */
  public info(title: string, message: string, options: Partial<ToastOptions> = {}): string {
    return this.show({
      title,
      message,
      type: 'info',
      ...options,
    });
  }

  /**
   * 경고 Toast 표시
   */
  public warning(title: string, message: string, options: Partial<ToastOptions> = {}): string {
    return this.show({
      title,
      message,
      type: 'warning',
      ...options,
    });
  }

  /**
   * 에러 Toast 표시
   */
  public error(title: string, message: string, options: Partial<ToastOptions> = {}): string {
    return this.show({
      title,
      message,
      type: 'error',
      ...options,
    });
  }

  /**
   * 특정 Toast 제거
   */
  public remove(id: string): void {
    const currentToasts = this.toastsSignal.value || [];
    const filteredToasts = currentToasts.filter(toast => toast.id !== id);

    if (filteredToasts.length !== currentToasts.length) {
      this.toastsSignal.value = filteredToasts;
      logger.debug(`[ToastManager] Toast 제거: ${id}`);
    }
  }

  /**
   * 모든 Toast 제거
   */
  public clear(): void {
    this.toastsSignal.value = [];
    logger.debug('[ToastManager] 모든 Toast 제거');
  }

  /**
   * 현재 Toast 목록 가져오기
   */
  public getToasts(): ToastItem[] {
    return this.toastsSignal.value || [];
  }

  /**
   * Toast 상태 변화 구독
   */
  public subscribe(callback: (toasts: ToastItem[]) => void): () => void {
    this.subscribers.add(callback);

    // 현재 상태를 즉시 전달
    callback(this.getToasts());

    // 구독 해제 함수 반환
    return () => {
      this.subscribers.delete(callback);
    };
  }

  /**
   * Preact signals와의 통합을 위한 signal 접근자
   */
  public get signal() {
    return this.toastsSignal;
  }

  /**
   * 서비스 초기화
   */
  public async init(): Promise<void> {
    logger.debug('[ToastManager] 서비스 초기화');
  }

  /**
   * 정리
   */
  public cleanup(): void {
    this.clear();
    this.subscribers.clear();
    logger.debug('[ToastManager] 정리 완료');
  }

  /**
   * 고유 ID 생성
   */
  private generateId(): string {
    return `toast_${++this.toastIdCounter}_${Date.now()}`;
  }

  /**
   * 구독자들에게 상태 변화 알림
   */
  private notifySubscribers(toasts: ToastItem[]): void {
    this.subscribers.forEach(callback => {
      try {
        callback(toasts);
      } catch (error) {
        logger.warn('[ToastManager] 구독자 알림 실패:', error);
      }
    });
  }

  /**
   * 싱글톤 인스턴스 초기화 (테스트용)
   */
  public static resetInstance(): void {
    if (ToastManager.instance) {
      ToastManager.instance.cleanup();
      ToastManager.instance = null;
      logger.debug('[ToastManager] 싱글톤 초기화됨');
    }
  }
}

/**
 * 전역 인스턴스 (기존 toastController와의 호환성)
 */
export const toastManager = ToastManager.getInstance();

/**
 * 기존 코드와의 호환성을 위한 별칭
 * 점진적 마이그레이션을 위해 제공
 */
/**
 * 주요 exports (표준화된 이름)
 */
export const ToastService = toastManager;
export const toastService = toastManager;
export const toastController = toastManager;

/**
 * @deprecated 이전 이름들 (하위 호환성 유지)
 */
export const UnifiedToastManager = ToastManager;

/**
 * 편의 함수들 (기존 Toast.tsx의 함수들을 대체)
 */
export function addToast(toast: Omit<ToastItem, 'id'>): string {
  const options: ToastOptions = {
    title: toast.title,
    message: toast.message,
    type: toast.type,
    ...(toast.duration !== undefined && { duration: toast.duration }),
    ...(toast.actionText && { actionText: toast.actionText }),
    ...(toast.onAction && { onAction: toast.onAction }),
  };
  return toastManager.show(options);
}

export function removeToast(id: string): void {
  toastManager.remove(id);
}

export function clearAllToasts(): void {
  toastManager.clear();
}

/**
 * Preact 컴포넌트에서 사용할 수 있는 signals 기반 상태
 */
export const toasts = {
  get value(): ToastItem[] {
    return toastManager.getToasts();
  },
  set value(_: ToastItem[]) {
    // 직접 설정은 허용하지 않음 - 관리자를 통해서만 변경 가능
    logger.warn('[ToastManager] 직접 상태 설정은 허용되지 않습니다. 관리자 메서드를 사용하세요.');
  },
  subscribe(callback: (value: ToastItem[]) => void) {
    return toastManager.subscribe(callback);
  },
};

/**
 * 마이그레이션 가이드:
 *
 * 기존 ToastController.ts 사용 → ToastManager로 교체
 * - toastController.show() → toastManager.show() (또는 기존 toastController 별칭 사용)
 * - toastController.success() → toastManager.success()
 *
 * 기존 Toast.tsx의 addToast/removeToast → 통합된 함수 사용
 * - addToast() → addToast() (동일하지만 내부적으로 통합된 관리자 사용)
 * - removeToast() → removeToast() (동일하지만 내부적으로 통합된 관리자 사용)
 *
 * 기존 Toast 컴포넌트의 signals → 통합된 signals 사용
 * - toasts.value → toastManager.getToasts() 또는 toasts.value
 * - toasts.subscribe() → toastManager.subscribe() 또는 toasts.subscribe()
 */
