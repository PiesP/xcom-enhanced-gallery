/**
 * @fileoverview Toast Controller Service
 * @description 애플리케이션 전체의 토스트 알림을 관리하는 서비스
 */

import { logger } from '@core/logging/logger';
import type { BaseService } from './ServiceManager';

// Toast 관련 타입 정의
export interface ToastItem {
  id: string;
  type: 'success' | 'error' | 'warning' | 'info';
  title?: string;
  message: string;
  duration?: number;
  dismissible?: boolean;
}

// Toast 스토리지 (메모리 기반)
const toastStorage = new Map<string, ToastItem>();
let toastIdCounter = 0;

// Toast 관리 함수들
function addToast(item: Omit<ToastItem, 'id'>): string {
  const id = `toast-${++toastIdCounter}`;
  const toast: ToastItem = { ...item, id };
  toastStorage.set(id, toast);
  logger.debug('Toast 추가됨:', toast);
  return id;
}

function removeToast(id: string): boolean {
  const removed = toastStorage.delete(id);
  if (removed) {
    logger.debug('Toast 제거됨:', id);
  }
  return removed;
}

function clearAllToasts(): void {
  toastStorage.clear();
  logger.debug('모든 Toast 제거됨');
}

/**
 * Toast 알림 옵션
 */
export interface ToastOptions {
  title: string;
  message: string;
  type?: 'info' | 'success' | 'warning' | 'error';
  duration?: number;
  actionText?: string;
  onAction?: () => void;
}

/**
 * Toast Controller 서비스
 *
 * 애플리케이션 전체의 토스트 알림을 중앙에서 관리합니다.
 * 기존 showNotification 함수들을 대체하여 일관된 UX를 제공합니다.
 */
export class ToastController implements BaseService {
  private initialized = false;

  /**
   * 서비스 초기화
   */
  async initialize(): Promise<void> {
    this.initialized = true;
    logger.debug('ToastController 초기화 완료');
  }

  /**
   * 초기화 상태 확인
   */
  isInitialized(): boolean {
    return this.initialized;
  }

  /**
   * 서비스 정리
   */
  async cleanup(): Promise<void> {
    // 모든 토스트 제거
    clearAllToasts();
    this.initialized = false;
    logger.debug('ToastController 정리 완료');
  }

  /**
   * 초기화 상태 확인 (호환성)
   */
  isReady(): boolean {
    return this.initialized;
  }

  /**
   * 토스트 알림 표시
   *
   * @param options 토스트 옵션
   * @returns string 생성된 토스트 ID
   *
   * @example
   * ```typescript
   * // 기본 정보 토스트
   * toastController.show({
   *   title: '알림',
   *   message: '작업이 완료되었습니다.'
   * });
   *
   * // 에러 토스트
   * toastController.show({
   *   title: '오류',
   *   message: '파일을 로드할 수 없습니다.',
   *   type: 'error'
   * });
   *
   * // 액션이 있는 토스트
   * toastController.show({
   *   title: '업데이트 가능',
   *   message: '새 버전이 있습니다.',
   *   type: 'info',
   *   actionText: '업데이트',
   *   onAction: () => this.updateApp()
   * });
   * ```
   */
  show(options: ToastOptions): string {
    const toastItem: Omit<ToastItem, 'id'> = {
      type: options.type ?? 'info',
      title: options.title,
      message: options.message,
      ...(options.duration !== undefined && { duration: options.duration }),
      ...(options.actionText && { actionText: options.actionText }),
      ...(options.onAction && { onAction: options.onAction }),
    };

    const id = addToast(toastItem);

    logger.debug(`토스트 표시: ${options.title} - ${options.message}`);
    return id;
  }

  /**
   * 성공 토스트 표시
   */
  success(title: string, message: string, options?: Partial<ToastOptions>): string {
    return this.show({
      title,
      message,
      type: 'success',
      ...options,
    });
  }

  /**
   * 정보 토스트 표시
   */
  info(title: string, message: string, options?: Partial<ToastOptions>): string {
    return this.show({
      title,
      message,
      type: 'info',
      ...options,
    });
  }

  /**
   * 경고 토스트 표시
   */
  warning(title: string, message: string, options?: Partial<ToastOptions>): string {
    return this.show({
      title,
      message,
      type: 'warning',
      ...options,
    });
  }

  /**
   * 에러 토스트 표시
   */
  error(title: string, message: string, options?: Partial<ToastOptions>): string {
    return this.show({
      title,
      message,
      type: 'error',
      ...options,
    });
  }

  /**
   * 특정 토스트 제거
   */
  remove(id: string): void {
    removeToast(id);
  }

  /**
   * 모든 토스트 제거
   */
  clear(): void {
    clearAllToasts();
  }
}

/**
 * 편의를 위한 전역 인스턴스
 */
export const toastController = new ToastController();
