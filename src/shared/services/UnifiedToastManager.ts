/**
 * @fileoverview 통합된 Toast 관리자
 * @description ToastController와 Toast 컴포넌트의 중복 상태 관리를 통합한 단일 관리자
 * @version 1.0.0 - TDD 기반 중복 제거 구현
 */

import { logger } from '../logging/logger';
import { getPreactSignals } from '../external/vendors';
import { ensurePoliteLiveRegion, ensureAssertiveLiveRegion } from '../utils/accessibility/index';

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
  /**
   * Routing override:
   * - 'live-only': announce to live region only (no toast list)
   * - 'toast-only': show toast only (no live region)
   * - 'both': announce to live region and show toast
   * If omitted, a default policy is applied (info/success → live-only, warning/error → toast-only).
   */
  route?: 'live-only' | 'toast-only' | 'both';
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
    subscribe?: (callback: (value: ToastItem[]) => void) => () => void;
  };
  private toastIdCounter = 0;
  private readonly subscribers = new Set<(toasts: ToastItem[]) => void>();

  private constructor() {
    // Preact signals를 사용한 반응형 상태 관리
    // 테스트에서 vendors가 부분 모킹되어 getPreactSignals().signal이 없을 수 있으므로
    // 안전한 폴백 신호를 제공한다.
    const createLocalSignal = <T>(initial: T) => {
      let _value = initial;
      const subscribers = new Set<(v: T) => void>();
      return {
        get value() {
          return _value;
        },
        set value(v: T) {
          _value = v;
          // 구독자들에게 변경 알림
          subscribers.forEach(cb => {
            try {
              cb(_value);
            } catch {
              // 구독자 에러는 무시
            }
          });
        },
        subscribe(callback: (v: T) => void) {
          subscribers.add(callback);
          return () => subscribers.delete(callback);
        },
      };
    };

    let toastsSignalImpl: typeof this.toastsSignal | null = null;
    try {
      const vendorsSignals = getPreactSignals() as unknown as {
        signal?: <U>(v: U) => { value: U; subscribe: (cb: (v: U) => void) => () => void };
      };
      const createSignal = vendorsSignals?.signal as
        | (<U>(v: U) => { value: U; subscribe: (cb: (v: U) => void) => () => void })
        | undefined;
      if (typeof createSignal === 'function') {
        toastsSignalImpl = createSignal<ToastItem[]>([]);
      }
    } catch {
      // ignore and use fallback
    }

    // 폴백: 로컬 신호 구현 사용
    if (!toastsSignalImpl) {
      logger.warn('[ToastManager] Preact Signals 미가용: 로컬 신호 폴백을 사용합니다.');
      toastsSignalImpl = createLocalSignal<ToastItem[]>([]);
    }

    this.toastsSignal = toastsSignalImpl;

    // signals의 변화를 감지하여 구독자들에게 알림 (구독 API가 없는 모킹을 대비해 가드)
    if (typeof this.toastsSignal.subscribe === 'function') {
      this.toastsSignal.subscribe(this.notifySubscribers.bind(this));
    } else {
      logger.debug('[ToastManager] signals.subscribe 미가용: 수동 알림 모드로 동작합니다.');
    }

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

    // Routing policy with override
    // Default routing: info/success → live-only, warning/error → toast-only
    const defaultRoute: 'live-only' | 'toast-only' =
      toast.type === 'warning' || toast.type === 'error' ? 'toast-only' : 'live-only';
    const route = options.route ?? defaultRoute;

    if (route === 'live-only' || route === 'both') {
      this.announceToLiveRegion(toast);
      logger.debug(
        `[ToastManager] LiveRegion announce(${toast.type}): ${options.title} - ${options.message}`
      );
    }

    if (route === 'toast-only' || route === 'both') {
      const currentToasts = this.toastsSignal.value || [];
      this.toastsSignal.value = [...currentToasts, toast];

      logger.debug(`[ToastManager] Toast shown: ${options.title} - ${options.message}`);
      // 구독 API가 없는 환경에서도 UI가 갱신되도록 수동 알림
      this.notifySubscribers(this.toastsSignal.value || []);
    }

    // return id regardless of routing path
    // 레거시 토스트 목록에도 동기화 (UI가 Toast.tsx의 toasts를 구독하므로)
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
      this.notifySubscribers(this.toastsSignal.value || []);
    }
  }

  /**
   * 모든 Toast 제거
   */
  public clear(): void {
    this.toastsSignal.value = [];
    logger.debug('[ToastManager] 모든 Toast 제거');
    this.notifySubscribers(this.toastsSignal.value || []);
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
   * 접근성: 라이브 리전에 메시지를 공지한다. info/success는 polite, error는 assertive를 사용할 수 있다.
   */
  private announceToLiveRegion(toast: ToastItem): void {
    try {
      const region =
        toast.type === 'error' ? ensureAssertiveLiveRegion() : ensurePoliteLiveRegion();
      // 텍스트 노드로 메시지를 갱신하여 스크린리더가 읽을 수 있게 한다
      const text = document.createElement('div');
      text.textContent = `${toast.title}: ${toast.message}`;
      // region을 깨끗이 만들고 새 노드를 추가
      while (region.firstChild) region.removeChild(region.firstChild);
      region.appendChild(text);
    } catch {
      // 테스트/SSR 환경에서 document가 없을 수 있음 – 조용히 무시
    }
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
