/**
 * Core Layer - Theme Service
 *
 * 시스템 테마 감지 및 적용 서비스 - Simplified Version
 *
 * 기능:
 * - 자동 시스템 테마 감지 (auto mode)
 * - 사용자 수동 테마 선택 (light/dark)
 * - 네이티브 스타일 기본 적용
 * - 실시간 테마 변경 감지
 * - 테마 상태 영속화 (localStorage)
 * - 컴포넌트별 테마 적용
 * - 관찰자 패턴을 통한 상태 변경 알림
 * - 성능 최적화된 DOM 조작
 *
 * @author XCom Enhanced Gallery Team
 * @version 2.0.0 - Simplified Theme System
 * @since 2024
 */

import { logger } from '@shared/logging';

/**
 * 지원되는 테마 타입 (단순화됨)
 *
 * @typedef {string} Theme
 * @property {'auto'} auto - 시스템 테마 자동 감지
 * @property {'light'} light - 라이트 테마 (수동 선택)
 * @property {'dark'} dark - 다크 테마 (수동 선택)
 */
export type Theme = 'auto' | 'light' | 'dark';

/**
 * 테마 변경 관찰자 콜백 함수 타입
 *
 * @callback ThemeObserver
 * @param {Theme} theme - 현재 적용된 테마
 * @returns {void}
 */
export type ThemeObserver = (theme: Theme) => void;

/**
 * 통합 테마 서비스 - Simplified Version
 *
 * 단순화된 테마 관리 시스템으로 다음 기능을 제공:
 * - 3가지 테마만 지원 (auto, light, dark)
 * - 네이티브 스타일 기본 적용
 * - 배치 DOM 업데이트를 통한 성능 최적화
 * - 강화된 에러 핸들링 및 복구 메커니즘
 * - TypeScript 완전 타입 안전성
 *
 * @class ThemeService
 * @example
 * ```typescript
 * // 기본 사용법
 * themeService.setTheme('dark');
 *
 * // 관찰자 등록
 * themeService.addObserver((theme) => {
 *   console.log(`Theme changed to ${theme}`);
 * });
 * ```
 */
export class ThemeService {
  // =====================================
  // Private Properties - 상태 관리
  // =====================================

  /** 시스템 다크 모드 감지용 MediaQueryList */
  private mediaQueryList: MediaQueryList | null = null;

  /** 현재 적용된 실제 테마 (auto의 경우 해석된 결과) */
  private currentTheme: Theme = 'light';

  /** 사용자가 선택한 테마 (auto 포함) */
  private userSelectedTheme: Theme = 'auto';

  /** 테마 변경 관찰자들 */
  private readonly observers: Set<ThemeObserver> = new Set();

  /** 성능 최적화: 이전 테마 상태 캐싱 */
  private previousThemeState: { theme: Theme } | null = null;

  /** 배치 처리용 타이머 ID */
  private batchUpdateTimer: number | null = null;

  /** 접근성: 모션 감소 선호도 감지 */
  private reducedMotionQuery: MediaQueryList | null = null;

  /** 테마 전환 애니메이션 지속시간 (ms) */
  private transitionDuration = 200;

  // 변경 감지 핸들러를 인스턴스 필드로 유지하여 removeEventListener에서 동일 참조 사용
  private readonly onSystemThemeChange = () => this.applyTheme();

  // =====================================
  // Constructor - 초기화
  // =====================================

  /**
   * ThemeService 생성자
   *
   * 초기화 과정:
   * 1. 브라우저 환경 감지
   * 2. 시스템 테마 감지 설정
   * 3. 저장된 사용자 설정 복원
   * 4. 초기 테마 적용
   *
   * @constructor
   */
  constructor() {
    try {
      if (typeof window !== 'undefined' && typeof window.matchMedia === 'function') {
        this.mediaQueryList = window.matchMedia('(prefers-color-scheme: dark)');
        this.reducedMotionQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
        this.initializeThemeDetection();
        this.loadSavedTheme();
      } else {
        logger.warn('브라우저 환경이 아니거나 matchMedia를 지원하지 않음 - 기본값 사용');
        // 테스트 환경이나 지원되지 않는 환경에서 기본 테마 적용
        this.ensureFallbackTheme();
      }
    } catch (error) {
      logger.error('ThemeService 초기화 실패:', error);
      // 환경이 지원되지 않으면 기본값으로 동작
      this.ensureFallbackTheme();
    }
  }

  // =====================================
  // Private Methods - 내부 로직
  // =====================================

  /**
   * 저장된 테마 불러오기
   */
  private loadSavedTheme(): void {
    try {
      if (typeof localStorage !== 'undefined') {
        const savedTheme = localStorage.getItem('xeg-theme');

        // Legacy native 테마를 auto로 마이그레이션
        if (savedTheme === 'native') {
          this.userSelectedTheme = 'auto';
          localStorage.setItem('xeg-theme', 'auto');
        } else if (savedTheme && ['auto', 'light', 'dark'].includes(savedTheme)) {
          this.userSelectedTheme = savedTheme as Theme;
        }

        // 기존 theme-style 설정 제거
        localStorage.removeItem('xeg-theme-style');
      }
    } catch (error) {
      logger.error('테마 불러오기 실패:', error);
    }
  }

  /**
   * 테스트 환경이나 지원되지 않는 환경에서 기본 테마 적용
   */
  private ensureFallbackTheme(): void {
    try {
      this.currentTheme = 'light'; // 기본값으로 라이트 테마 사용
      this.userSelectedTheme = 'auto';

      // DOM에 기본 테마 적용 (가능한 경우)
      if (typeof document !== 'undefined' && document.documentElement) {
        document.documentElement.setAttribute('data-theme', 'light');
        document.documentElement.classList.remove('xeg-theme-dark');
        document.documentElement.classList.add('xeg-theme-light');
        logger.debug('테스트 환경: 기본 라이트 테마 적용');
      }
    } catch (error) {
      logger.error('Fallback 테마 적용 실패:', error);
    }
  }

  /**
   * 테마 설정 (사용자가 수동으로 선택)
   */
  public setTheme(theme: Theme): void {
    // 유효한 테마 값 검증
    const validThemes: Theme[] = ['auto', 'light', 'dark'];
    if (!validThemes.includes(theme)) {
      throw new Error(`Invalid theme "${theme}". Valid themes are: ${validThemes.join(', ')}`);
    }

    // native 테마 지원 중단 - 추가적인 체크 (타입 시스템 우회를 위해)
    if ((theme as string) === 'native') {
      throw new Error('Native theme is no longer supported. Use "auto" instead.');
    }

    this.userSelectedTheme = theme;

    // localStorage에 저장
    try {
      if (typeof localStorage !== 'undefined') {
        localStorage.setItem('xeg-theme', theme);
      }
    } catch (error) {
      logger.error('테마 저장 실패:', error);
    }

    this.applyTheme();
  }

  /**
   * 테마 적용 로직 - 성능 최적화된 버전
   */
  private applyTheme(): void {
    let effectiveTheme: Theme;

    if (this.userSelectedTheme === 'auto') {
      // auto 모드: 시스템 테마 감지
      const isDark = this.mediaQueryList?.matches ?? false;
      effectiveTheme = isDark ? 'dark' : 'light';
    } else {
      // 수동 선택된 테마 사용
      effectiveTheme = this.userSelectedTheme;
    }

    this.currentTheme = effectiveTheme;

    // 성능 최적화: 배치 처리로 DOM 업데이트
    this.scheduleBatchUpdate();
  }

  /**
   * DOM에 테마 적용
   */
  private applyThemeToDOM(theme: Theme): void {
    try {
      if (typeof document === 'undefined') return;

      const documentElement = document.documentElement;

      // 기존 테마 클래스 제거 (native 클래스도 제거)
      documentElement.classList.remove('xeg-theme-light', 'xeg-theme-dark');

      // 새 테마 클래스 추가
      documentElement.classList.add(`xeg-theme-${theme}`);

      // data-theme 속성 설정 (실제 적용된 테마)
      documentElement.setAttribute('data-theme', theme);

      // data-theme-style 속성 제거 (네이티브 스타일이 기본)
      documentElement.removeAttribute('data-theme-style');

      logger.debug(`테마 적용 완료: ${this.userSelectedTheme} -> ${theme}`);
    } catch (error) {
      logger.error('테마 적용 실패:', error);
    }
  }

  /**
   * 갤러리 컨테이너들에 테마 적용
   */
  private applyToGalleryContainers(): void {
    const galleryContainers = document.querySelectorAll(
      '[data-testid="gallery-container"], [data-xeg-gallery], .gallery-container, [data-component-type]'
    );
    galleryContainers.forEach(container => {
      (container as HTMLElement).setAttribute('data-theme', this.currentTheme);
      // data-theme-style 속성 제거
      (container as HTMLElement).removeAttribute('data-theme-style');
    });
  }

  /**
   * 모든 컴포넌트에 테마 적용
   */
  public applyThemeToAll(): void {
    // 루트 요소에 테마 적용 보장
    if (typeof document !== 'undefined') {
      const documentElement = document.documentElement;
      documentElement.setAttribute('data-theme', this.currentTheme);
      // data-theme-style 속성 제거
      documentElement.removeAttribute('data-theme-style');
    }

    // 모든 컴포넌트에 테마 적용
    const componentSelectors = [
      '.toolbar',
      '.settings-modal',
      '.gallery-container',
      '.tooltip',
      '.coach-mark',
      '[data-xeg-component]',
      '[data-testid="gallery-container"]', // 테스트용
      '[data-component-type]', // 테스트용
    ];

    componentSelectors.forEach(selector => {
      const components = document.querySelectorAll(selector);
      components.forEach(component => this.applyToComponent(component));
    });

    // 갤러리 컨테이너 특별 처리
    this.applyToGalleryContainers();
  }

  /**
   * 관찰자 추가
   */
  public addObserver(callback: ThemeObserver): void {
    this.observers.add(callback);
  }

  /**
   * 관찰자 제거
   */
  public removeObserver(callback: ThemeObserver): void {
    this.observers.delete(callback);
  }

  /**
   * 관찰자들에게 테마 변경 알림
   */
  private notifyObservers(): void {
    this.observers.forEach(callback => {
      try {
        callback(this.currentTheme);
      } catch (error) {
        logger.error('테마 관찰자 알림 실패:', error);
      }
    });
  }

  /**
   * 컴포넌트에 즉시 테마 적용
   */
  /**
   * 특정 컴포넌트에 테마 적용 (public으로 테스트에서 접근 가능)
   */
  public applyToComponent(component: Element): void {
    // 컴포넌트에 테마 속성 적용
    component.setAttribute('data-theme', this.currentTheme);
    // data-theme-style 속성 제거 (네이티브 스타일 기본)
    component.removeAttribute('data-theme-style');

    // 컴포넌트별 특별한 처리
    if (
      component.classList.contains('gallery-container') ||
      component.classList.contains('xeg-gallery')
    ) {
      this.applyToGalleryContainers();
    }
  }

  /**
   * 현재 테마 반환
   */
  public getCurrentTheme(): Theme {
    return this.currentTheme;
  }

  /**
   * 사용자가 선택한 테마 반환
   */
  public getUserSelectedTheme(): Theme {
    return this.userSelectedTheme;
  }

  /**
   * 현재 테마 정보 반환
   */
  public getCurrentThemeInfo(): { theme: Theme } {
    return {
      theme: this.currentTheme,
    };
  }

  /**
   * 다크 모드 여부 확인
   */
  public isDarkMode(): boolean {
    return this.currentTheme === 'dark';
  }

  /**
   * 시스템 테마 감지 초기화
   */
  private initializeThemeDetection(): void {
    if (!this.mediaQueryList) return;

    // 초기 테마 적용
    this.applyTheme();

    // 시스템 테마 변경 감지
    try {
      this.mediaQueryList.addEventListener('change', this.onSystemThemeChange);
    } catch {
      // 일부 브라우저는 addListener를 사용 (레거시). 테스트 환경에서는 무시
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (this.mediaQueryList as any).addListener?.(this.onSystemThemeChange);
    }

    logger.info('통합 테마 시스템 초기화 완료');
  }

  /**
   * 서비스 종료
   */
  public destroy(): void {
    // 배치 처리 타이머 정리
    if (this.batchUpdateTimer) {
      clearTimeout(this.batchUpdateTimer);
      this.batchUpdateTimer = null;
    }

    if (this.mediaQueryList) {
      try {
        this.mediaQueryList.removeEventListener('change', this.onSystemThemeChange);
      } catch {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (this.mediaQueryList as any).removeListener?.(this.onSystemThemeChange);
      }
      this.mediaQueryList = null;
    }

    if (this.reducedMotionQuery) {
      this.reducedMotionQuery = null;
    }

    // 관찰자들 정리
    this.observers.clear();

    logger.info('ThemeService destroyed');
  }

  // =====================================
  // Performance Optimization Methods
  // =====================================

  /**
   * 접근성: 모션 감소 선호도 확인
   *
   * @returns {boolean} 사용자가 모션 감소를 선호하는지 여부
   */
  public isReducedMotionPreferred(): boolean {
    return this.reducedMotionQuery?.matches ?? false;
  }

  /**
   * 테마 전환 애니메이션 지속시간 설정
   *
   * @param {number} duration - 애니메이션 지속시간 (milliseconds)
   */
  public setTransitionDuration(duration: number): void {
    this.transitionDuration = duration;

    if (typeof document !== 'undefined') {
      document.documentElement.style.setProperty(
        '--xeg-theme-transition-duration',
        `${duration}ms`
      );
    }
  }

  /**
   * 사용하지 않는 CSS 변수 정리
   *
   * 메모리 최적화를 위해 현재 테마에서 사용하지 않는 CSS 변수들을 제거
   */
  public cleanupUnusedVariables(): void {
    if (typeof document === 'undefined') return;

    const documentElement = document.documentElement;
    const currentTheme = this.getCurrentTheme();

    // 테마별로 사용하지 않는 변수들 정의
    const unusedVariables: Record<Theme, string[]> = {
      light: ['--xeg-native-shadow'],
      dark: ['--xeg-native-shadow'],
      auto: [], // auto는 현재 해석된 테마에 따라 결정됨
    };

    const variablesToClean = unusedVariables[currentTheme] || [];

    variablesToClean.forEach(variable => {
      documentElement.style.removeProperty(variable);
    });

    logger.debug(`정리된 CSS 변수: ${variablesToClean.length}개`);
  }

  /**
   * 현재 등록된 관찰자 수 반환 (메모리 누수 디버깅용)
   *
   * @returns {number} 관찰자 수
   */
  public getObserverCount(): number {
    return this.observers.size;
  }

  // =====================================
  // Private Performance Methods
  // =====================================

  /**
   * 배치 처리된 테마 적용
   * 성능 최적화를 위해 연속된 테마 변경을 배치로 처리
   */
  private scheduleBatchUpdate(): void {
    // 이미 같은 테마라면 아무것도 하지 않음
    const currentState = { theme: this.currentTheme };
    if (this.previousThemeState && this.previousThemeState.theme === currentState.theme) {
      return; // 중복 업데이트 방지
    }

    if (this.batchUpdateTimer) {
      clearTimeout(this.batchUpdateTimer);
    }

    this.batchUpdateTimer = window.setTimeout(() => {
      this.executeBatchUpdate();
      this.batchUpdateTimer = null;
    }, 16); // ~60fps에 맞춰 16ms 지연
  }

  /**
   * 배치 업데이트 실행
   */
  private executeBatchUpdate(): void {
    // 현재 상태와 이전 상태 비교하여 실제 변경이 있을 때만 업데이트
    const currentState = { theme: this.currentTheme };

    if (this.previousThemeState && this.previousThemeState.theme === currentState.theme) {
      return; // 변경사항 없음 - 업데이트 건너뛰기
    }

    // 애니메이션 전환 클래스 추가
    this.applyTransitionClass();

    // DOM 업데이트 수행
    this.applyThemeToDOM(this.currentTheme);
    this.applyThemeToAll();
    this.applyAccessibilityAttributes();

    // 상태 캐싱 업데이트
    this.previousThemeState = { ...currentState };

    // 관찰자들에게 알림
    this.notifyObservers();
  }

  /**
   * 테마 전환 애니메이션 클래스 적용
   */
  private applyTransitionClass(): void {
    if (typeof document === 'undefined') return;

    const documentElement = document.documentElement;

    // 모션 감소를 선호하지 않는 경우에만 전환 애니메이션 적용
    if (!this.isReducedMotionPreferred()) {
      documentElement.classList.add('xeg-theme-transition');

      // 전환 완료 후 클래스 제거
      setTimeout(() => {
        documentElement.classList.remove('xeg-theme-transition');
      }, this.transitionDuration);
    }
  }

  /**
   * 접근성 속성 적용
   */
  private applyAccessibilityAttributes(): void {
    if (typeof document === 'undefined') return;

    const body = document.body;

    // 모션 감소 선호도 속성 설정
    body.setAttribute('data-reduced-motion', this.isReducedMotionPreferred().toString());
  }
}

// ================================
// Phase 4: 표준화된 인스턴스 export
// ================================

/**
 * 표준화된 ThemeService 인스턴스
 */
export const themeService = new ThemeService();

/**
 * Default export (표준 패턴)
 */
export default themeService;
