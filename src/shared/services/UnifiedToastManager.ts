/**
 * @fileoverview 통합된 Toast 관리자
 * @description ToastController와 Toast 컴포넌트의 중복 상태 관리를 통합한 단일 관리자
 * @version 2.0.0 - SolidJS 네이티브 패턴 마이그레이션
 */

import type { Accessor, Setter } from 'solid-js';
import { getSolidCore } from '@shared/external/vendors';
import { logger } from '@shared/logging/logger';
import {
  ensurePoliteLiveRegion,
  ensureAssertiveLiveRegion,
  announcePolite,
  announceAssertive,
} from '@shared/utils/accessibility/index';

// 통합된 Toast 타입 정의
export interface ToastItem {
  id: string;
  type: 'info' | 'success' | 'warning' | 'error';
  title: string;
  message: string;
  duration?: number;
  actionText?: string;
  onAction?: () => void;
  /** Optional metadata for diagnostics (e.g., correlationId) */
  meta?: Record<string, unknown>;
}

export interface ToastOptions {
  title: string;
  message: string;
  type?: ToastItem['type'];
  duration?: number;
  actionText?: string;
  onAction?: () => void;
  /** Optional metadata for diagnostics (e.g., correlationId) */
  meta?: Record<string, unknown>;
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
 *
 * SolidJS 네이티브 패턴 사용: createSignal() 기반
 */
export class ToastManager {
  private static instance: ToastManager | null = null;
  private readonly toastsAccessor: Accessor<ToastItem[]>;
  private readonly setToasts: Setter<ToastItem[]>;
  private toastIdCounter = 0;

  private constructor() {
    const { createSignal } = getSolidCore();
    const [toasts, setToasts] = createSignal<ToastItem[]>([]);
    this.toastsAccessor = toasts;
    this.setToasts = setToasts;
    logger.debug('[ToastManager] 초기화됨 (네이티브 패턴)');
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
      ...(options.meta && { meta: options.meta }),
    };

    // Routing policy with override
    // Default routing:
    // - info/success → live-only (screen reader만 공지, 토스트 억제)
    // - warning → toast-only (시각적 피드백만)
    // - error → both (시각적 + assertive 라이브 리전 공지)
    const defaultRoute: 'live-only' | 'toast-only' | 'both' =
      toast.type === 'error' ? 'both' : toast.type === 'warning' ? 'toast-only' : 'live-only';
    const route = options.route ?? defaultRoute;

    if (route === 'live-only' || route === 'both') {
      this.announceToLiveRegion(toast);
      logger.debug(
        `[ToastManager] LiveRegion announce(${toast.type}): ${options.title} - ${options.message}`
      );
    }

    if (route === 'toast-only' || route === 'both') {
      this.setToasts(currentToasts => [...currentToasts, toast]);

      logger.debug(`[ToastManager] Toast shown: ${options.title} - ${options.message}`);
    }

    // return id regardless of routing path
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
    this.setToasts(currentToasts => {
      const filteredToasts = currentToasts.filter(toast => toast.id !== id);
      if (filteredToasts.length !== currentToasts.length) {
        logger.debug(`[ToastManager] Toast 제거: ${id}`);
      }
      return filteredToasts;
    });
  }

  /**
   * 모든 Toast 제거
   */
  public clear(): void {
    this.setToasts([]);
    logger.debug('[ToastManager] 모든 Toast 제거');
  }

  /**
   * 현재 Toast 목록 가져오기 (Accessor 함수 반환)
   */
  public getToasts: Accessor<ToastItem[]> = () => {
    return this.toastsAccessor();
  };

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
    logger.debug('[ToastManager] 정리 완료');
  }

  /**
   * 고유 ID 생성
   */
  private generateId(): string {
    return `toast_${++this.toastIdCounter}_${Date.now()}`;
  }

  /**
   * 접근성: 라이브 리전에 메시지를 공지한다. info/success는 polite, error는 assertive를 사용할 수 있다.
   */
  private announceToLiveRegion(toast: ToastItem): void {
    // 라이브 리전 매니저의 큐/중복 억제/blank toggle 메커니즘을 활용한다.
    // error는 assertive 채널, 나머지는 polite 채널로 공지.
    const message = `${toast.title}: ${toast.message}`;
    try {
      if (toast.type === 'error') {
        // 보장 차원에서 영역 생성만 사전 수행(테스트 환경 안정화)
        ensureAssertiveLiveRegion();
        announceAssertive(message);
      } else {
        ensurePoliteLiveRegion();
        announcePolite(message);
      }
    } catch {
      // 테스트/SSR 환경 등 비DOM 환경에서는 조용히 무시
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
 * 마이그레이션 가이드 (v2.0.0 - 네이티브 패턴):
 *
 * 기존 호환 레이어 → SolidJS 네이티브
 * - toastManager.getToasts() → toastManager.getToasts() (이미 Accessor 함수)
 * - toasts.value → toastManager.getToasts()() (함수 호출)
 * - toasts.subscribe() → createEffect(() => { toastManager.getToasts(); })
 *
 * 기존 ToastController.ts 사용 → ToastManager로 교체
 * - toastController.show() → toastManager.show() (또는 기존 toastController 별칭 사용)
 * - toastController.success() → toastManager.success()
 *
 * 기존 Toast.tsx의 addToast/removeToast → 통합된 함수 사용
 * - addToast() → addToast() (동일하지만 내부적으로 통합된 관리자 사용)
 * - removeToast() → removeToast() (동일하지만 내부적으로 통합된 관리자 사용)
 */
