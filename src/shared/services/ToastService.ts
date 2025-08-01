/**
 * @fileoverview Toast Service
 * @description 간단하고 직접적인 토스트 알림 서비스 - Phase 4 간소화
 */

import { logger } from '@shared/logging/logger';

// Toast 관련 타입 정의
export interface ToastItem {
  id: string;
  type: 'success' | 'error' | 'warning' | 'info';
  title?: string;
  message: string;
  duration?: number;
  dismissible?: boolean;
}

/**
 * Toast 알림 옵션
 */
export interface ToastOptions {
  title: string;
  message: string;
  type?: 'success' | 'error' | 'warning' | 'info';
  duration?: number;
  dismissible?: boolean;
}

/**
 * 간단한 토스트 서비스 - BaseService 상속 없음
 */
export class ToastService {
  private readonly toastStorage = new Map<string, ToastItem>();
  private toastIdCounter = 0;

  /**
   * 토스트 표시
   */
  show(options: ToastOptions): string {
    const id = `toast-${++this.toastIdCounter}`;
    const toast: ToastItem = {
      id,
      type: options.type || 'info',
      title: options.title,
      message: options.message,
      duration: options.duration || 3000,
      dismissible: options.dismissible !== false,
    };

    this.toastStorage.set(id, toast);
    logger.debug('Toast 표시:', toast);

    // 자동 제거 (duration이 설정된 경우)
    if (toast.duration && toast.duration > 0) {
      setTimeout(() => {
        this.dismiss(id);
      }, toast.duration);
    }

    return id;
  }

  /**
   * 성공 토스트 표시
   */
  success(title: string, message: string, duration = 3000): string {
    return this.show({ title, message, type: 'success', duration });
  }

  /**
   * 에러 토스트 표시
   */
  error(title: string, message: string, duration = 5000): string {
    return this.show({ title, message, type: 'error', duration });
  }

  /**
   * 경고 토스트 표시
   */
  warning(title: string, message: string, duration = 4000): string {
    return this.show({ title, message, type: 'warning', duration });
  }

  /**
   * 정보 토스트 표시
   */
  info(title: string, message: string, duration = 3000): string {
    return this.show({ title, message, type: 'info', duration });
  }

  /**
   * 토스트 제거
   */
  dismiss(id: string): boolean {
    const removed = this.toastStorage.delete(id);
    if (removed) {
      logger.debug('Toast 제거됨:', id);
    }
    return removed;
  }

  /**
   * 모든 토스트 제거
   */
  clear(): void {
    this.toastStorage.clear();
    logger.debug('모든 Toast 제거됨');
  }

  /**
   * 활성 토스트 목록 가져오기
   */
  getActiveToasts(): ToastItem[] {
    return Array.from(this.toastStorage.values());
  }

  /**
   * 특정 토스트 가져오기
   */
  getToast(id: string): ToastItem | undefined {
    return this.toastStorage.get(id);
  }
}

// 싱글톤 인스턴스 (복잡한 패턴 없이 직접 export)
export const toastService = new ToastService();
export default toastService;
