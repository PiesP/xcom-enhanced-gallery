/**
 * @fileoverview 간소화된 애니메이션 서비스
 * @description 유저스크립트에 적합한 기본 CSS 애니메이션 기능
 * @version 3.1.0 - Phase A5: 생명주기 관리 표준화
 */

import { logger } from '@shared/logging';
import type { BaseService } from '../types/core/base-service.types';
import { globalTimerManager } from '@shared/utils/timer-management';

export interface AnimationConfig {
  duration?: number;
  easing?: string;
  delay?: number;
}

/**
 * 간소화된 애니메이션 서비스 (싱글톤)
 *
 * 주요 기능:
 * - 기본 CSS 트랜지션
 * - 간단한 페이드 인/아웃
 * - 유저스크립트 최적화
 *
 * Phase A5 개선: 명시적 initialize/destroy 메서드 추가, 생명주기 관리 표준화
 * Phase 2025-10-27 개선: BaseService 인터페이스 구현으로 표준화
 */
export class AnimationService implements BaseService {
  private static instance: AnimationService | null = null;
  private stylesInjected = false;
  private _isInitialized = false;

  private constructor() {
    // Styles injected lazily on first use
  }

  /**
   * 싱글톤 인스턴스 반환
   */
  public static getInstance(): AnimationService {
    if (!AnimationService.instance) {
      AnimationService.instance = new AnimationService();
    }
    return AnimationService.instance;
  }

  /**
   * 서비스 초기화 (BaseService 인터페이스)
   */
  public async initialize(): Promise<void> {
    if (this._isInitialized) {
      return;
    }
    logger.info('AnimationService initializing...');
    try {
      this.ensureStylesInjected();
      this._isInitialized = true;
      logger.info('AnimationService initialized');
    } catch (error) {
      logger.error('AnimationService initialization failed:', error);
      throw error;
    }
  }

  /**
   * 서비스 정리 (BaseService 인터페이스)
   */
  public destroy(): void {
    if (!this._isInitialized) {
      return;
    }
    logger.info('AnimationService destroying...');
    try {
      this.cleanup();
      this._isInitialized = false;
      logger.info('AnimationService destroyed');
    } catch (error) {
      logger.error('AnimationService destroy failed:', error);
    }
  }

  /**
   * 초기화 상태 확인 (BaseService 인터페이스)
   */
  public isInitialized(): boolean {
    return this._isInitialized;
  }

  /**
   * 기본 애니메이션 스타일 주입
   */
  private ensureStylesInjected(): void {
    if (this.stylesInjected || document.getElementById('xcom-animations')) {
      return;
    }

    const style = document.createElement('style');
    style.id = 'xcom-animations';
    style.textContent = `
      .xcom-fade-in {
        opacity: 0;
        transition: var(--xeg-transition-preset-fade);
  /* Explicit easing token to satisfy token policy */
  transition-timing-function: var(--xeg-ease-standard);
      }
      .xcom-fade-in.active {
        opacity: 1;
      }
      .xcom-fade-out {
        opacity: 1;
        transition: var(--xeg-transition-preset-fade);
  transition-timing-function: var(--xeg-ease-standard);
      }
      .xcom-fade-out.active {
        opacity: 0;
      }
      .xcom-slide-in {
        transform: translateY(20px);
        opacity: 0;
        /* Preset consolidates duplicated transform+opacity timing */
        transition: var(--xeg-transition-preset-slide);
  transition-timing-function: var(--xeg-ease-standard);
      }
      .xcom-slide-in.active {
        transform: translateY(0);
        opacity: 1;
      }

      /* Accessibility: Respect reduced motion preferences */
      @media (prefers-reduced-motion: reduce) {
        .xcom-fade-in,
        .xcom-fade-out,
        .xcom-slide-in {
          transition: none !important;
        }
      }
    `;

    document.head.appendChild(style);
    this.stylesInjected = true;
  }

  /**
   * 요소 페이드인 애니메이션
   */
  public async fadeIn(element: Element, config: AnimationConfig = {}): Promise<void> {
    this.ensureStylesInjected();

    const duration = config.duration || 300;

    element.classList.add('xcom-fade-in');

    if (config.delay) {
      await this.delay(config.delay);
    }

    element.classList.add('active');

    await this.delay(duration);
  }

  /**
   * 요소 페이드아웃 애니메이션
   */
  public async fadeOut(element: Element, config: AnimationConfig = {}): Promise<void> {
    this.ensureStylesInjected();

    const duration = config.duration || 300;

    element.classList.add('xcom-fade-out');

    if (config.delay) {
      await this.delay(config.delay);
    }

    element.classList.add('active');

    await this.delay(duration);
  }

  /**
   * 슬라이드 인 애니메이션
   */
  public async slideIn(element: Element, config: AnimationConfig = {}): Promise<void> {
    this.ensureStylesInjected();

    const duration = config.duration || 300;

    element.classList.add('xcom-slide-in');

    if (config.delay) {
      await this.delay(config.delay);
    }

    element.classList.add('active');

    await this.delay(duration);
  }

  /**
   * 갤러리 열기 애니메이션
   */
  public async openGallery(element: Element, config: AnimationConfig = {}): Promise<void> {
    await this.fadeIn(element, config);
  }

  /**
   * 갤러리 닫기 애니메이션
   */
  public async closeGallery(element: Element, config: AnimationConfig = {}): Promise<void> {
    await this.fadeOut(element, config);
  }

  /**
   * 기본 요소 애니메이션
   */
  public animateElement(element: Element, config: AnimationConfig = {}): void {
    this.fadeIn(element, config).catch(error => {
      logger.warn('Animation failed:', error);
    });
  }

  /**
   * 모든 애니메이션 정리
   */
  public cleanup(): void {
    const elements = document.querySelectorAll('.xcom-fade-in, .xcom-fade-out, .xcom-slide-in');
    elements.forEach(element => {
      element.classList.remove('xcom-fade-in', 'xcom-fade-out', 'xcom-slide-in', 'active');
    });
  }

  /**
   * 비동기 지연 유틸리티
   */
  private delay(ms: number): Promise<void> {
    return new Promise(resolve => {
      globalTimerManager.setTimeout(resolve, ms);
    });
  }
}

// 편의 함수들
// 편의 함수들
/**
 * 요소 애니메이션 편의 함수
 */
export function animateElement(element: Element, config?: AnimationConfig): void {
  const service = AnimationService.getInstance();
  service.animateElement(element, config);
}

/**
 * 페이드아웃 편의 함수
 */
export function fadeOut(element: Element, config?: AnimationConfig): Promise<void> {
  const service = AnimationService.getInstance();
  return service.fadeOut(element, config);
}

/**
 * 갤러리 열기 애니메이션 편의 함수
 */
export function openGalleryWithAnimation(
  element: Element,
  config?: AnimationConfig
): Promise<void> {
  const service = AnimationService.getInstance();
  return service.openGallery(element, config);
}

/**
 * 갤러리 닫기 애니메이션 편의 함수
 */
export function closeGalleryWithAnimation(
  element: Element,
  config?: AnimationConfig
): Promise<void> {
  const service = AnimationService.getInstance();
  return service.closeGallery(element, config);
}
