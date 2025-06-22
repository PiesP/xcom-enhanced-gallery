/**
 * @fileoverview Simplified Theme Manager
 * @version 2.0.0
 *
 * 단순화된 테마 관리자 - 투명 기조의 기본 테마만 관리
 */

import { logger } from '@infrastructure/logging/logger';
import { AutoThemeService, type SimpleTheme } from './AutoThemeService';

/**
 * 단순화된 테마 컨텍스트
 */
export interface SimpleThemeContext {
  /** 갤러리 모드 여부 */
  isGalleryMode: boolean;
  /** 사용자 선호 테마 */
  userPreference?: SimpleTheme;
}

/**
 * 단순화된 테마 관리자
 *
 * 복잡한 테마 변경 기능을 제거하고 기본적인 시스템 테마 감지만 유지
 * 투명 기조의 일관된 디자인을 제공
 */
export class ThemeManager {
  private static instance: ThemeManager | null = null;
  private readonly autoThemeService: AutoThemeService;

  private constructor() {
    this.autoThemeService = AutoThemeService.getInstance();
    logger.info('Simplified ThemeManager initialized');
  }

  public static getInstance(): ThemeManager {
    ThemeManager.instance ??= new ThemeManager();
    return ThemeManager.instance;
  }

  /**
   * 현재 테마 반환
   */
  public getCurrentTheme(): SimpleTheme {
    return this.autoThemeService.getCurrentTheme();
  }

  /**
   * 다크 모드 여부 확인
   */
  public isDarkMode(): boolean {
    return this.autoThemeService.isDarkMode();
  }

  /**
   * 갤러리 모드 진입
   * (투명 기조에서는 별도 테마 변경 없음)
   */
  public enterGalleryMode(): void {
    logger.debug('Gallery mode entered - using transparent theme');
  }

  /**
   * 갤러리 모드 종료
   */
  public exitGalleryMode(): void {
    logger.debug('Gallery mode exited');
  }

  /**
   * 테마 매니저 초기화
   */
  public initialize(): void {
    logger.info('ThemeManager initialized with transparent theme system');
  }

  /**
   * 서비스 종료
   */
  public destroy(): void {
    this.autoThemeService.destroy();
    ThemeManager.instance = null;
    logger.info('ThemeManager destroyed');
  }
}

/**
 * 전역 테마 매니저 인스턴스
 */
export const themeManager = ThemeManager.getInstance();
