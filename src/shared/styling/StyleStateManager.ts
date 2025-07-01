/**
 * @fileoverview Style State Manager
 * @description Centralized style state management for clear separation of CSS and JavaScript responsibilities
 * @version 1.0.0
 */

import { DesignSystem } from '../design-system/DesignSystem';

/**
 * Style update options
 */
interface StyleUpdateOptions {
  /** Enable animation */
  animate?: boolean;
  /** Apply immediately (bypass batch processing) */
  immediate?: boolean;
  /** Callback function */
  onComplete?: () => void;
}

/**
 * Component state definition
 */
interface ComponentState {
  [key: string]: boolean | string | number;
}

/**
 * Component configuration type
 */
interface ComponentConfig {
  states?: Record<string, string>;
  variants?: Record<string, string>;
  sizes?: Record<string, string>;
  elements?: Record<string, string>;
  sections?: Record<string, string>;
}

/**
 * Batch update queue item
 */
interface BatchUpdateItem {
  element: HTMLElement;
  updates: Array<{
    type: 'class' | 'style' | 'attribute';
    key: string;
    value: string | boolean;
    options: StyleUpdateOptions;
  }>;
}

/**
 * Centralized style state management for clear separation between CSS and JavaScript responsibilities
 */
export class StyleStateManager {
  private static instance: StyleStateManager | null = null;

  /** 요소별 상태 추적 */
  private readonly stateMap = new Map<string, ComponentState>();

  /** 배치 업데이트 큐 */
  private batchQueue: BatchUpdateItem[] = [];

  /** 배치 업데이트 프레임 ID */
  private batchFrameId: number | null = null;

  /** 요소 ID 카운터 */
  private elementIdCounter = 0;

  private constructor() {
    this.setupEventListeners();
  }

  /**
   * 싱글톤 인스턴스 가져오기
   */
  static getInstance(): StyleStateManager {
    if (!StyleStateManager.instance) {
      StyleStateManager.instance = new StyleStateManager();
    }
    return StyleStateManager.instance;
  }

  /**
   * 싱글톤 인스턴스 재설정 (테스트용)
   */
  static resetInstance(): void {
    StyleStateManager.instance = null;
  }

  /**
   * 컴포넌트 상태 기반 클래스 관리
   */
  updateComponentState<T extends keyof typeof DesignSystem.components>(
    element: HTMLElement,
    component: T,
    state: Record<string, boolean>,
    options: StyleUpdateOptions = {}
  ): void {
    const elementId = this.getElementId(element);
    const componentConfig = DesignSystem.components[component];

    // 현재 상태 저장
    const currentState = this.stateMap.get(elementId) || {};
    const newState = { ...currentState, ...state };
    this.stateMap.set(elementId, newState);

    // 배치 업데이트 큐에 추가
    this.scheduleBatchUpdate(element, [
      {
        type: 'class',
        key: 'component-state',
        value: this.generateComponentClasses(componentConfig, state),
        options,
      },
    ]);
  }

  /**
   * CSS 변수 업데이트
   */
  updateCSSVariables(
    element: HTMLElement,
    variables: Record<string, string>,
    options: StyleUpdateOptions = {}
  ): void {
    const updates = Object.entries(variables).map(([key, value]) => ({
      type: 'style' as const,
      key,
      value,
      options,
    }));

    this.scheduleBatchUpdate(element, updates);
  }

  /**
   * 유틸리티 클래스 토글
   */
  toggleUtilityClasses(
    element: HTMLElement,
    classes: Record<string, boolean>,
    options: StyleUpdateOptions = {}
  ): void {
    const updates = Object.entries(classes).map(([className, shouldAdd]) => ({
      type: 'class' as const,
      key: className,
      value: shouldAdd,
      options,
    }));

    this.scheduleBatchUpdate(element, updates);
  }

  /**
   * 테마 변경
   */
  setTheme(theme: 'light' | 'dark' | 'auto'): void {
    DesignSystem.setTheme(theme);

    // 시스템 테마 자동 감지
    if (theme === 'auto') {
      this.applySystemTheme();
    }
  }

  /**
   * 반응형 상태 관리
   */
  updateResponsiveState(breakpoint: string): void {
    const breakpoints = ['mobile', 'tablet', 'desktop'];

    breakpoints.forEach(bp => {
      document.documentElement.classList.toggle(`xeg-breakpoint--${bp}`, bp === breakpoint);
    });
  }

  /**
   * 애니메이션 상태 관리
   */
  playAnimation(
    element: HTMLElement,
    animationName: string,
    options: StyleUpdateOptions = {}
  ): Promise<void> {
    return new Promise(resolve => {
      const animationClass = `xeg-animation--${animationName}`;

      // 애니메이션 클래스 추가
      element.classList.add(animationClass);

      // 애니메이션 종료 대기
      const handleAnimationEnd = () => {
        element.classList.remove(animationClass);
        element.removeEventListener('animationend', handleAnimationEnd);
        options.onComplete?.();
        resolve();
      };

      element.addEventListener('animationend', handleAnimationEnd);

      // 애니메이션이 없는 경우 즉시 완료
      setTimeout(() => {
        if (element.classList.contains(animationClass)) {
          handleAnimationEnd();
        }
      }, 1000); // 최대 1초 대기
    });
  }

  /**
   * 포커스 상태 관리
   */
  manageFocusState(element: HTMLElement, focused: boolean): void {
    this.toggleUtilityClasses(element, {
      [DesignSystem.utilities.focusRing]: focused,
    });
  }

  /**
   * 호버 상태 관리 (터치 디바이스 고려)
   */
  manageHoverState(element: HTMLElement, hovered: boolean): void {
    // 터치 디바이스에서는 호버 효과 비활성화
    if (this.isTouchDevice()) return;

    this.toggleUtilityClasses(element, {
      [DesignSystem.utilities.hoverLift]: hovered,
    });
  }

  /**
   * 요소 상태 가져오기
   */
  getElementState(element: HTMLElement): ComponentState {
    const elementId = this.getElementId(element);
    return this.stateMap.get(elementId) || {};
  }

  /**
   * 모든 상태 초기화
   */
  clearAllStates(): void {
    this.stateMap.clear();

    // 배치 업데이트 취소
    if (this.batchFrameId) {
      cancelAnimationFrame(this.batchFrameId);
      this.batchFrameId = null;
    }

    this.batchQueue = [];
  }

  /**
   * 정리 및 해제
   */
  cleanup(): void {
    this.clearAllStates();
    this.removeEventListeners();
  }

  // Private 메서드들

  /**
   * 요소 ID 생성 및 할당
   */
  private getElementId(element: HTMLElement): string {
    let elementId = element.getAttribute('data-xeg-id');

    if (!elementId) {
      elementId = `xeg-element-${++this.elementIdCounter}`;
      element.setAttribute('data-xeg-id', elementId);
    }

    return elementId;
  }

  /**
   * 컴포넌트 클래스 생성
   */
  private generateComponentClasses(
    componentConfig: ComponentConfig,
    state: Record<string, boolean>
  ): string {
    const classes: string[] = [];

    Object.entries(state).forEach(([stateName, isActive]) => {
      if (isActive && componentConfig.states?.[stateName]) {
        classes.push(componentConfig.states[stateName]);
      }
    });

    return classes.join(' ');
  }

  /**
   * Schedule batch update
   */
  private scheduleBatchUpdate(element: HTMLElement, updates: BatchUpdateItem['updates']): void {
    // Find existing update for the same element in queue
    const existingIndex = this.batchQueue.findIndex(item => item.element === element);

    if (existingIndex >= 0) {
      // Merge with existing update
      const existingItem = this.batchQueue[existingIndex];
      if (existingItem) {
        existingItem.updates.push(...updates);
      }
    } else {
      // Add new update
      this.batchQueue.push({ element, updates });
    }

    // Execute batch update on next frame
    if (!this.batchFrameId) {
      this.batchFrameId = requestAnimationFrame(() => {
        this.processBatchUpdates();
      });
    }
  }

  /**
   * 배치 업데이트 처리
   */
  private processBatchUpdates(): void {
    const queue = [...this.batchQueue];
    this.batchQueue = [];
    this.batchFrameId = null;

    queue.forEach(({ element, updates }) => {
      updates.forEach(({ type, key, value, options }) => {
        switch (type) {
          case 'class':
            if (typeof value === 'boolean') {
              element.classList.toggle(key, value);
            } else if (typeof value === 'string') {
              // 기존 컴포넌트 클래스 제거 후 새로운 클래스 추가
              if (key === 'component-state') {
                this.replaceComponentClasses(element, value);
              } else {
                element.classList.add(value);
              }
            }
            break;

          case 'style':
            if (key.startsWith('--')) {
              // CSS 변수
              element.style.setProperty(key, value.toString());
            } else {
              // 일반 스타일
              (element.style as unknown as Record<string, string>)[key] = value.toString();
            }
            break;

          case 'attribute':
            element.setAttribute(key, value.toString());
            break;
        }

        // 완료 콜백 실행
        options.onComplete?.();
      });
    });
  }

  /**
   * 컴포넌트 클래스 교체
   */
  private replaceComponentClasses(element: HTMLElement, newClasses: string): void {
    // 기존 컴포넌트 상태 클래스 제거
    const existingClasses = Array.from(element.classList).filter(
      cls => cls.includes('--') && cls.startsWith('xeg-')
    );

    existingClasses.forEach(cls => element.classList.remove(cls));

    // 새로운 클래스 추가
    if (newClasses) {
      newClasses.split(' ').forEach(cls => {
        if (cls.trim()) {
          element.classList.add(cls.trim());
        }
      });
    }
  }

  /**
   * 시스템 테마 적용
   */
  private applySystemTheme(): void {
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    const isDark = mediaQuery.matches;

    document.documentElement.setAttribute('data-theme', isDark ? 'dark' : 'light');
  }

  /**
   * 터치 디바이스 감지
   */
  private isTouchDevice(): boolean {
    return 'ontouchstart' in window || navigator.maxTouchPoints > 0;
  }

  /**
   * 이벤트 리스너 설정
   */
  private setupEventListeners(): void {
    // 시스템 테마 변경 감지
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    mediaQuery.addEventListener('change', () => {
      if (DesignSystem.getCurrentTheme() === 'auto') {
        this.applySystemTheme();
      }
    });

    // 브레이크포인트 변경 감지
    this.setupBreakpointListeners();
  }

  /**
   * 브레이크포인트 리스너 설정
   */
  private setupBreakpointListeners(): void {
    const breakpoints = {
      mobile: '(max-width: 767px)',
      tablet: '(min-width: 768px) and (max-width: 1023px)',
      desktop: '(min-width: 1024px)',
    };

    Object.entries(breakpoints).forEach(([name, query]) => {
      const mediaQuery = window.matchMedia(query);
      const handler = () => {
        if (mediaQuery.matches) {
          this.updateResponsiveState(name);
        }
      };

      mediaQuery.addEventListener('change', handler);
      handler(); // 초기 상태 설정
    });
  }

  /**
   * 이벤트 리스너 제거
   */
  private removeEventListeners(): void {
    // 실제 구현에서는 등록된 리스너들을 추적하고 제거해야 함
    // 여기서는 간단히 처리
  }
}

/**
 * 기본 인스턴스 export
 */
export const styleStateManager = StyleStateManager.getInstance();
