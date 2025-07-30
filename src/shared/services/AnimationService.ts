/**
 * @fileoverview 간소화된 애니메이션 서비스
 * @description 유저스크립트에 적합한 기본 CSS 애니메이션 기능
 * @version 3.0.0 - Phase B: 간소화
 */

import { logger } from '@shared/logging';

export interface AnimationConfig {
  duration?: number;
  easing?: string;
  delay?: number;
}

/**
 * 간소화된 애니메이션 서비스
 *
 * 주요 기능:
 * - 기본 CSS 트랜지션
 * - 간단한 페이드 인/아웃
 * - 유저스크립트 최적화
 */
export class AnimationService {
  private static instance: AnimationService | null = null;
  private stylesInjected = false;

  private constructor() {
    this.ensureStylesInjected();
  }

  public static getInstance(): AnimationService {
    AnimationService.instance ??= new AnimationService();
    return AnimationService.instance;
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
        transition: opacity 0.3s ease-in-out;
      }
      .xcom-fade-in.active {
        opacity: 1;
      }
      .xcom-fade-out {
        opacity: 1;
        transition: opacity 0.3s ease-in-out;
      }
      .xcom-fade-out.active {
        opacity: 0;
      }
      .xcom-slide-in {
        transform: translateY(20px);
        opacity: 0;
        transition: all 0.3s ease-out;
      }
      .xcom-slide-in.active {
        transform: translateY(0);
        opacity: 1;
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
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}
