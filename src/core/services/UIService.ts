/**
 * @fileoverview UI Service - 통합 UI 서비스
 * @description 테마, 토스트 등 모든 UI 관련 기능을 통합한 서비스
 * @version 1.0.0 - Phase 2: Service Consolidation
 */

import { logger } from '@core/logging/logger';
import type { BaseService } from '@core/types/core-types';

// 기존 서비스들 import
import { ThemeService, themeService } from './ThemeService';
import { ToastController, toastController } from './ToastController';
import type { Theme } from './ThemeService';
import type { ToastOptions } from './ToastController';

/**
 * 통합 UI 서비스
 *
 * 기존 분산된 UI 서비스들을 하나로 통합:
 * - ThemeService (시스템 테마 감지)
 * - ToastController (알림 관리)
 */
export class UIService implements BaseService {
  private static instance: UIService | null = null;
  private _isInitialized = false;

  // 통합된 서비스 컴포넌트들
  private readonly themeService: ThemeService;
  private readonly toastController: ToastController;

  private constructor() {
    this.themeService = ThemeService.getInstance();
    this.toastController = toastController;
  }

  public static getInstance(): UIService {
    UIService.instance ??= new UIService();
    return UIService.instance;
  }

  public async initialize(): Promise<void> {
    if (this._isInitialized) return;

    logger.info('UIService initializing...');
    await this.toastController.initialize();
    this._isInitialized = true;
    logger.info('UIService initialized');
  }

  public destroy(): void {
    if (!this._isInitialized) return;

    logger.info('UIService destroying...');
    this.themeService.destroy();
    // ToastController는 cleanup 메서드 사용
    this.toastController.cleanup();
    this._isInitialized = false;
    logger.info('UIService destroyed');
  }

  public isInitialized(): boolean {
    return this._isInitialized;
  }

  // ====================================
  // Theme API
  // ====================================

  /**
   * 현재 테마 반환
   */
  getCurrentTheme(): Theme {
    return this.themeService.getCurrentTheme();
  }

  /**
   * 다크 모드 여부 확인
   */
  isDarkMode(): boolean {
    return this.themeService.isDarkMode();
  }

  // ====================================
  // Toast API
  // ====================================

  /**
   * 성공 토스트 표시
   */
  showSuccess(options: ToastOptions): void {
    this.toastController.success(options.title, options.message);
  }

  /**
   * 에러 토스트 표시
   */
  showError(options: ToastOptions): void {
    this.toastController.error(options.title, options.message);
  }

  /**
   * 경고 토스트 표시
   */
  showWarning(options: ToastOptions): void {
    this.toastController.warning(options.title, options.message);
  }

  /**
   * 정보 토스트 표시
   */
  showInfo(options: ToastOptions): void {
    this.toastController.info(options.title, options.message);
  }

  /**
   * 모든 토스트 제거
   */
  clearAllToasts(): void {
    // ToastController에는 clearAll 메서드가 없으므로 show로 구현하거나 추가 구현 필요
    // 일단 cleanup으로 대체
    this.toastController.cleanup();
  }

  // ====================================
  // 편의 메서드들
  // ====================================

  /**
   * 다운로드 완료 알림
   */
  notifyDownloadComplete(filename: string): void {
    this.showSuccess({
      title: 'Download Complete',
      message: `Successfully downloaded: ${filename}`,
    });
  }

  /**
   * 다운로드 실패 알림
   */
  notifyDownloadFailed(error: string): void {
    this.showError({
      title: 'Download Failed',
      message: error,
    });
  }

  /**
   * 갤러리 열기 알림
   */
  notifyGalleryOpened(mediaCount: number): void {
    this.showInfo({
      title: 'Gallery Opened',
      message: `${mediaCount} media item${mediaCount > 1 ? 's' : ''} loaded`,
    });
  }

  /**
   * 추출 실패 알림
   */
  notifyExtractionFailed(error: string): void {
    this.showError({
      title: 'Media Extraction Failed',
      message: error,
    });
  }

  /**
   * 테마에 따른 UI 상태 정보
   */
  getUIState() {
    return {
      theme: this.getCurrentTheme(),
      isDarkMode: this.isDarkMode(),
      isInitialized: this.isInitialized(),
    };
  }
}

/**
 * 전역 UI 서비스 인스턴스
 */
export const uiService = UIService.getInstance();

// ====================================
// 호환성을 위한 재export
// ====================================

/**
 * 기존 테마 서비스 (호환성)
 */
export { themeService };

/**
 * 기존 토스트 컨트롤러 (호환성)
 */
export { toastController };

/**
 * 테마 타입
 */
export type { Theme };

/**
 * 토스트 옵션 타입
 */
export type { ToastOptions };
