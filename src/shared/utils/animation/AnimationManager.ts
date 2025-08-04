/**
 * @fileoverview AnimationManager - 애니메이션 및 트랜지션 관리
 * @description 부드러운 사용자 경험을 위한 애니메이션 시스템
 */

/**
 * 애니메이션 타입
 */
export type AnimationType =
  | 'fadeIn'
  | 'fadeOut'
  | 'slideIn'
  | 'slideOut'
  | 'scale'
  | 'rotate'
  | 'bounce'
  | 'custom';

/**
 * 이징 함수 타입
 */
export type EasingFunction =
  | 'linear'
  | 'ease'
  | 'ease-in'
  | 'ease-out'
  | 'ease-in-out'
  | 'cubic-bezier';

/**
 * 애니메이션 방향
 */
export type AnimationDirection = 'left' | 'right' | 'up' | 'down' | 'center';

/**
 * 애니메이션 옵션
 */
export interface AnimationOptions {
  duration: number;
  delay?: number;
  easing?: EasingFunction;
  direction?: AnimationDirection;
  iterations?: number;
  fillMode?: 'none' | 'forwards' | 'backwards' | 'both';
  onStart?: () => void;
  onComplete?: () => void;
  onCancel?: () => void;
}

/**
 * 커스텀 애니메이션 키프레임
 */
export interface CustomKeyframe {
  offset: number;
  transform?: string;
  opacity?: number;
  [property: string]: string | number | undefined;
}

/**
 * 트랜지션 설정
 */
export interface TransitionConfig {
  property: string;
  duration: number;
  easing?: EasingFunction;
  delay?: number;
}

/**
 * 스프링 애니메이션 설정
 */
export interface SpringConfig {
  tension: number;
  friction: number;
  mass?: number;
  velocity?: number;
}

/**
 * 애니메이션 관리자
 */
export class AnimationManager {
  private readonly activeAnimations: Map<string, Animation> = new Map();
  private animationCounter: number = 0;
  private readonly prefersReducedMotion: boolean;

  constructor() {
    this.prefersReducedMotion =
      typeof window !== 'undefined'
        ? window.matchMedia('(prefers-reduced-motion: reduce)').matches
        : false;
  }

  /**
   * 요소 애니메이션 실행
   */
  animate(
    element: HTMLElement,
    type: AnimationType,
    options: AnimationOptions,
    customKeyframes?: CustomKeyframe[]
  ): string {
    if (this.prefersReducedMotion) {
      // 접근성을 위해 애니메이션 스킵
      options.onComplete?.();
      return '';
    }

    const animationId = `anim_${++this.animationCounter}`;
    let keyframes: Keyframe[];

    // 애니메이션 타입별 키프레임 생성
    switch (type) {
      case 'fadeIn':
        keyframes = this.createFadeInKeyframes();
        break;
      case 'fadeOut':
        keyframes = this.createFadeOutKeyframes();
        break;
      case 'slideIn':
        keyframes = this.createSlideInKeyframes(options.direction || 'left');
        break;
      case 'slideOut':
        keyframes = this.createSlideOutKeyframes(options.direction || 'left');
        break;
      case 'scale':
        keyframes = this.createScaleKeyframes();
        break;
      case 'rotate':
        keyframes = this.createRotateKeyframes();
        break;
      case 'bounce':
        keyframes = this.createBounceKeyframes();
        break;
      case 'custom':
        keyframes = customKeyframes || [];
        break;
      default:
        keyframes = this.createFadeInKeyframes();
    }

    // 애니메이션 옵션 구성
    const animationOptions: KeyframeAnimationOptions = {
      duration: options.duration,
      delay: options.delay || 0,
      easing: this.getEasingString(options.easing || 'ease'),
      iterations: options.iterations || 1,
      fill: options.fillMode || 'both',
    };

    // 애니메이션 시작
    const animation = element.animate(keyframes, animationOptions);

    // 이벤트 핸들러 등록
    animation.addEventListener('finish', () => {
      this.activeAnimations.delete(animationId);
      options.onComplete?.();
    });

    animation.addEventListener('cancel', () => {
      this.activeAnimations.delete(animationId);
      options.onCancel?.();
    });

    // 시작 콜백 실행
    options.onStart?.();

    // 활성 애니메이션 추가
    this.activeAnimations.set(animationId, animation);

    return animationId;
  }

  /**
   * 페이드 인 키프레임 생성
   */
  private createFadeInKeyframes(): Keyframe[] {
    return [
      { opacity: 0, offset: 0 },
      { opacity: 1, offset: 1 },
    ];
  }

  /**
   * 페이드 아웃 키프레임 생성
   */
  private createFadeOutKeyframes(): Keyframe[] {
    return [
      { opacity: 1, offset: 0 },
      { opacity: 0, offset: 1 },
    ];
  }

  /**
   * 슬라이드 인 키프레임 생성
   */
  private createSlideInKeyframes(direction: AnimationDirection): Keyframe[] {
    const transforms = {
      left: 'translateX(-100%)',
      right: 'translateX(100%)',
      up: 'translateY(-100%)',
      down: 'translateY(100%)',
      center: 'scale(0.8)',
    };

    return [
      { transform: transforms[direction], opacity: 0, offset: 0 },
      { transform: 'translateX(0) translateY(0) scale(1)', opacity: 1, offset: 1 },
    ];
  }

  /**
   * 슬라이드 아웃 키프레임 생성
   */
  private createSlideOutKeyframes(direction: AnimationDirection): Keyframe[] {
    const transforms = {
      left: 'translateX(-100%)',
      right: 'translateX(100%)',
      up: 'translateY(-100%)',
      down: 'translateY(100%)',
      center: 'scale(0.8)',
    };

    return [
      { transform: 'translateX(0) translateY(0) scale(1)', opacity: 1, offset: 0 },
      { transform: transforms[direction], opacity: 0, offset: 1 },
    ];
  }

  /**
   * 스케일 키프레임 생성
   */
  private createScaleKeyframes(): Keyframe[] {
    return [
      { transform: 'scale(0)', opacity: 0, offset: 0 },
      { transform: 'scale(1.1)', opacity: 0.8, offset: 0.7 },
      { transform: 'scale(1)', opacity: 1, offset: 1 },
    ];
  }

  /**
   * 회전 키프레임 생성
   */
  private createRotateKeyframes(): Keyframe[] {
    return [
      { transform: 'rotate(0deg) scale(0)', offset: 0 },
      { transform: 'rotate(180deg) scale(1.1)', offset: 0.7 },
      { transform: 'rotate(360deg) scale(1)', offset: 1 },
    ];
  }

  /**
   * 바운스 키프레임 생성
   */
  private createBounceKeyframes(): Keyframe[] {
    return [
      { transform: 'translateY(-100%)', offset: 0 },
      { transform: 'translateY(0)', offset: 0.25 },
      { transform: 'translateY(-50%)', offset: 0.5 },
      { transform: 'translateY(0)', offset: 0.75 },
      { transform: 'translateY(-25%)', offset: 0.875 },
      { transform: 'translateY(0)', offset: 1 },
    ];
  }

  /**
   * 이징 문자열 반환
   */
  private getEasingString(easing: EasingFunction): string {
    switch (easing) {
      case 'linear':
        return 'linear';
      case 'ease':
        return 'ease';
      case 'ease-in':
        return 'ease-in';
      case 'ease-out':
        return 'ease-out';
      case 'ease-in-out':
        return 'ease-in-out';
      case 'cubic-bezier':
        return 'cubic-bezier(0.25, 0.46, 0.45, 0.94)';
      default:
        return 'ease';
    }
  }

  /**
   * 트랜지션 적용
   */
  applyTransition(element: HTMLElement, transitions: TransitionConfig[]): void {
    if (this.prefersReducedMotion) return;

    const transitionStrings = transitions.map(config => {
      const easing = this.getEasingString(config.easing || 'ease');
      const delay = config.delay || 0;
      return `${config.property} ${config.duration}ms ${easing} ${delay}ms`;
    });

    element.style.transition = transitionStrings.join(', ');
  }

  /**
   * 스프링 애니메이션 (CSS 기반)
   */
  springAnimate(
    element: HTMLElement,
    to: Partial<CSSStyleDeclaration>,
    config: SpringConfig
  ): string {
    if (this.prefersReducedMotion) return '';

    const animationId = `spring_${++this.animationCounter}`;

    // 스프링 설정을 CSS 트랜지션으로 변환
    const { tension, friction, mass = 1 } = config;
    const duration = Math.sqrt(mass / tension) * friction * 1000;
    const dampingRatio = friction / (2 * Math.sqrt(mass * tension));

    let easing: string;
    if (dampingRatio < 1) {
      // 언더댐핑 (바운스 효과)
      easing = 'cubic-bezier(0.175, 0.885, 0.32, 1.275)';
    } else if (dampingRatio === 1) {
      // 크리티컬 댐핑
      easing = 'cubic-bezier(0.25, 0.46, 0.45, 0.94)';
    } else {
      // 오버댐핑
      easing = 'cubic-bezier(0.23, 1, 0.32, 1)';
    }

    // 트랜지션 적용
    const properties = Object.keys(to);
    const transitionString = properties.map(prop => `${prop} ${duration}ms ${easing}`).join(', ');

    element.style.transition = transitionString;

    // 스타일 적용
    Object.assign(element.style, to);

    // 완료 후 트랜지션 제거
    setTimeout(() => {
      element.style.transition = '';
      this.activeAnimations.delete(animationId);
    }, duration);

    return animationId;
  }

  /**
   * 스태거 애니메이션 (순차적 애니메이션)
   */
  staggerAnimate(
    elements: HTMLElement[],
    type: AnimationType,
    baseOptions: AnimationOptions,
    staggerDelay: number = 100
  ): string[] {
    const animationIds: string[] = [];

    elements.forEach((element, index) => {
      const options = {
        ...baseOptions,
        delay: (baseOptions.delay || 0) + index * staggerDelay,
      };

      const id = this.animate(element, type, options);
      animationIds.push(id);
    });

    return animationIds;
  }

  /**
   * 시퀀스 애니메이션 (연속적 애니메이션)
   */
  sequenceAnimate(
    animations: Array<{
      element: HTMLElement;
      type: AnimationType;
      options: AnimationOptions;
    }>
  ): Promise<void> {
    return new Promise(resolve => {
      let currentIndex = 0;

      const runNext = () => {
        if (currentIndex >= animations.length) {
          resolve();
          return;
        }

        const animation = animations[currentIndex];
        if (!animation) {
          resolve();
          return;
        }

        const { element, type, options } = animation;
        const originalOnComplete = options.onComplete;

        options.onComplete = () => {
          originalOnComplete?.();
          currentIndex++;
          runNext();
        };

        this.animate(element, type, options);
      };

      runNext();
    });
  }

  /**
   * 애니메이션 일시정지
   */
  pauseAnimation(animationId: string): void {
    const animation = this.activeAnimations.get(animationId);
    if (animation) {
      animation.pause();
    }
  }

  /**
   * 애니메이션 재개
   */
  resumeAnimation(animationId: string): void {
    const animation = this.activeAnimations.get(animationId);
    if (animation) {
      animation.play();
    }
  }

  /**
   * 애니메이션 취소
   */
  cancelAnimation(animationId: string): void {
    const animation = this.activeAnimations.get(animationId);
    if (animation) {
      animation.cancel();
      this.activeAnimations.delete(animationId);
    }
  }

  /**
   * 모든 애니메이션 취소
   */
  cancelAllAnimations(): void {
    this.activeAnimations.forEach(animation => {
      animation.cancel();
    });
    this.activeAnimations.clear();
  }

  /**
   * 활성 애니메이션 개수 반환
   */
  getActiveAnimationCount(): number {
    return this.activeAnimations.size;
  }

  /**
   * 정리 메서드
   */
  cleanup(): void {
    this.cancelAllAnimations();
  }
}

/**
 * 전역 애니메이션 관리자
 */
let globalAnimationManager: AnimationManager | null = null;

/**
 * 애니메이션 관리자 반환
 */
export function getAnimationManager(): AnimationManager {
  if (!globalAnimationManager) {
    globalAnimationManager = new AnimationManager();
  }
  return globalAnimationManager;
}

/**
 * 기본 애니메이션 옵션
 */
export const DEFAULT_ANIMATION_OPTIONS: AnimationOptions = {
  duration: 300,
  delay: 0,
  easing: 'ease-out',
  iterations: 1,
  fillMode: 'both',
};

/**
 * 일반적인 스프링 설정들
 */
export const SPRING_PRESETS = {
  gentle: { tension: 120, friction: 14 },
  wobbly: { tension: 180, friction: 12 },
  stiff: { tension: 210, friction: 20 },
  slow: { tension: 280, friction: 60 },
  molasses: { tension: 280, friction: 120 },
} as const;

/**
 * 유틸리티 함수: 요소 페이드 인
 */
export function fadeIn(element: HTMLElement, duration: number = 300): string {
  return getAnimationManager().animate(element, 'fadeIn', {
    duration,
    easing: 'ease-out',
  });
}

/**
 * 유틸리티 함수: 요소 페이드 아웃
 */
export function fadeOut(element: HTMLElement, duration: number = 300): string {
  return getAnimationManager().animate(element, 'fadeOut', {
    duration,
    easing: 'ease-in',
  });
}

/**
 * 유틸리티 함수: 요소 슬라이드 인
 */
export function slideIn(
  element: HTMLElement,
  direction: AnimationDirection = 'left',
  duration: number = 400
): string {
  return getAnimationManager().animate(element, 'slideIn', {
    duration,
    direction,
    easing: 'ease-out',
  });
}

/**
 * 유틸리티 함수: 스케일 애니메이션
 */
export function scaleIn(element: HTMLElement, duration: number = 200): string {
  return getAnimationManager().animate(element, 'scale', {
    duration,
    easing: 'cubic-bezier',
  });
}
