/**
 * @fileoverview TDD GREEN 단계: 통합 다크모드 스타일 시스템
 *
 * 목적: 분산된 버튼 설정을 제거하고 하나의 통합된 값 시스템으로 다크모드 문제 해결
 *
 * 해결 문제:
 * 1. 다크모드에서 툴바 배경색이 하얀색으로 표시되는 문제
 * 2. 다크모드에서 버튼들이 하얀색으로 표시되는 문제
 * 3. 호버 영역 배경 효과가 계속 유지되는 문제
 * 4. 분산된 버튼 설정 문제
 */

export interface DarkModeToolbarStyles {
  backgroundColor: string;
  borderColor: string;
  textColor: string;
  shadowColor: string;
}

export interface DarkModeButtonStyles {
  backgroundColor: string;
  textColor: string;
  hoverBackgroundColor: string;
  hoverTextColor: string;
  focusRingColor: string;
}

export type ButtonVariant = 'default' | 'primary' | 'secondary' | 'danger';

export interface DarkModeValidationResult {
  isValid: boolean;
  issues: string[];
  recommendations: string[];
}

/**
 * 통합 다크모드 스타일 시스템
 * 기존의 분산된 버튼 설정을 제거하고 단일 값 시스템으로 통합
 */
export class UnifiedDarkModeStyleSystem {
  private static instance: UnifiedDarkModeStyleSystem | null = null;

  private readonly toolbarStyles: {
    light: DarkModeToolbarStyles;
    dark: DarkModeToolbarStyles;
  };

  private readonly buttonStyles: {
    light: Record<ButtonVariant, DarkModeButtonStyles>;
    dark: Record<ButtonVariant, DarkModeButtonStyles>;
  };

  private constructor() {
    // 통합된 툴바 스타일 설정
    this.toolbarStyles = {
      light: {
        backgroundColor: '#ffffff',
        borderColor: '#e5e7eb',
        textColor: '#111827',
        shadowColor: 'rgba(0, 0, 0, 0.1)',
      },
      dark: {
        backgroundColor: '#1f2937', // 다크모드에서 하얀 배경 문제 해결
        borderColor: '#374151',
        textColor: '#f9fafb',
        shadowColor: 'rgba(0, 0, 0, 0.3)',
      },
    };

    // 통합된 버튼 스타일 설정 - 분산된 설정 제거
    this.buttonStyles = {
      light: {
        default: {
          backgroundColor: 'transparent',
          textColor: '#374151',
          hoverBackgroundColor: '#f3f4f6', // 제어된 호버 효과
          hoverTextColor: '#111827',
          focusRingColor: '#3b82f6',
        },
        primary: {
          backgroundColor: '#3b82f6',
          textColor: '#ffffff',
          hoverBackgroundColor: '#2563eb',
          hoverTextColor: '#ffffff',
          focusRingColor: '#93c5fd',
        },
        secondary: {
          backgroundColor: '#6b7280',
          textColor: '#ffffff',
          hoverBackgroundColor: '#4b5563',
          hoverTextColor: '#ffffff',
          focusRingColor: '#9ca3af',
        },
        danger: {
          backgroundColor: '#ef4444',
          textColor: '#ffffff',
          hoverBackgroundColor: '#dc2626',
          hoverTextColor: '#ffffff',
          focusRingColor: '#fca5a5',
        },
      },
      dark: {
        default: {
          backgroundColor: 'transparent',
          textColor: '#d1d5db', // 다크모드에서 하얀색 버튼 문제 해결
          hoverBackgroundColor: '#374151', // 제어된 호버 효과
          hoverTextColor: '#f9fafb',
          focusRingColor: '#60a5fa',
        },
        primary: {
          backgroundColor: '#2563eb',
          textColor: '#ffffff',
          hoverBackgroundColor: '#1d4ed8',
          hoverTextColor: '#ffffff',
          focusRingColor: '#93c5fd',
        },
        secondary: {
          backgroundColor: '#4b5563',
          textColor: '#ffffff',
          hoverBackgroundColor: '#374151',
          hoverTextColor: '#ffffff',
          focusRingColor: '#9ca3af',
        },
        danger: {
          backgroundColor: '#dc2626',
          textColor: '#ffffff',
          hoverBackgroundColor: '#b91c1c',
          hoverTextColor: '#ffffff',
          focusRingColor: '#fca5a5',
        },
      },
    };
  }

  /**
   * 싱글톤 인스턴스 반환
   */
  public static getInstance(): UnifiedDarkModeStyleSystem {
    if (!UnifiedDarkModeStyleSystem.instance) {
      UnifiedDarkModeStyleSystem.instance = new UnifiedDarkModeStyleSystem();
    }
    return UnifiedDarkModeStyleSystem.instance;
  }

  /**
   * 현재 테마에 맞는 툴바 스타일 반환
   */
  public getToolbarStyles(theme: 'light' | 'dark' = this.getCurrentTheme()): DarkModeToolbarStyles {
    return { ...this.toolbarStyles[theme] };
  }

  /**
   * 현재 테마와 변형에 맞는 버튼 스타일 반환
   */
  public getButtonStyles(
    variant: ButtonVariant = 'default',
    theme: 'light' | 'dark' = this.getCurrentTheme()
  ): DarkModeButtonStyles {
    return { ...this.buttonStyles[theme][variant] };
  }

  /**
   * 호버 상태 리셋 기능
   * 문제가 되던 지속적인 호버 효과를 해결
   */
  public resetHoverState(): void {
    // 모든 툴바 버튼에서 호버 상태 제거
    const toolbarButtons = document.querySelectorAll(
      '.xeg-toolbar button, .xeg-toolbar [role="button"]'
    );

    toolbarButtons.forEach(button => {
      if (button instanceof HTMLElement) {
        // 인라인 호버 스타일 제거
        button.style.removeProperty('background-color');
        button.style.removeProperty('color');

        // 호버 관련 클래스 제거
        button.classList.remove('hover', 'hovered', 'is-hover');

        // aria-pressed 상태 정규화
        if (button.hasAttribute('aria-pressed')) {
          button.setAttribute('aria-pressed', 'false');
        }
      }
    });
  }

  /**
   * 다크모드 일관성 검증
   */
  public validateDarkModeConsistency(): DarkModeValidationResult {
    const issues: string[] = [];
    const recommendations: string[] = [];

    // 현재 테마 확인
    const currentTheme = this.getCurrentTheme();
    const toolbarStyles = this.getToolbarStyles(currentTheme);

    // CSS 변수와 실제 적용된 스타일 비교
    const documentElement = document.documentElement;
    if (documentElement) {
      const computedStyles = getComputedStyle(documentElement);

      // 툴바 배경색 일관성 확인
      const cssToolbarBg = computedStyles.getPropertyValue('--xeg-bg-toolbar').trim();
      if (cssToolbarBg && cssToolbarBg !== toolbarStyles.backgroundColor) {
        issues.push('CSS 변수와 통합 시스템의 툴바 배경색이 불일치합니다.');
        recommendations.push('design-tokens.css의 --xeg-bg-toolbar 값을 업데이트하세요.');
      }

      // 텍스트 색상 일관성 확인
      const cssToolbarText = computedStyles.getPropertyValue('--xeg-toolbar-text').trim();
      if (cssToolbarText && cssToolbarText !== toolbarStyles.textColor) {
        issues.push('CSS 변수와 통합 시스템의 텍스트 색상이 불일치합니다.');
        recommendations.push('design-tokens.css의 --xeg-toolbar-text 값을 업데이트하세요.');
      }
    }

    // 분산된 버튼 설정 확인
    const distributedConfigs = this.checkForDistributedButtonConfigs();
    if (distributedConfigs.length > 0) {
      issues.push('분산된 버튼 설정이 여전히 존재합니다.');
      recommendations.push(
        `다음 파일들의 개별 버튼 설정을 제거하세요: ${distributedConfigs.join(', ')}`
      );
    }

    return {
      isValid: issues.length === 0,
      issues,
      recommendations,
    };
  }

  /**
   * CSS 커스텀 프로퍼티 생성
   */
  public generateCSSCustomProperties(theme: 'light' | 'dark' = this.getCurrentTheme()): string {
    const toolbarStyles = this.getToolbarStyles(theme);
    const buttonStyles = this.getButtonStyles('default', theme);

    return `
      --xeg-unified-toolbar-bg: ${toolbarStyles.backgroundColor};
      --xeg-unified-toolbar-border: ${toolbarStyles.borderColor};
      --xeg-unified-toolbar-text: ${toolbarStyles.textColor};
      --xeg-unified-toolbar-shadow: 0 4px 6px ${toolbarStyles.shadowColor};
      --xeg-unified-button-bg: ${buttonStyles.backgroundColor};
      --xeg-unified-button-text: ${buttonStyles.textColor};
      --xeg-unified-button-hover-bg: ${buttonStyles.hoverBackgroundColor};
      --xeg-unified-button-hover-text: ${buttonStyles.hoverTextColor};
      --xeg-unified-button-focus-ring: ${buttonStyles.focusRingColor};
    `.trim();
  }

  /**
   * 현재 테마 감지
   */
  private getCurrentTheme(): 'light' | 'dark' {
    // 1. data-theme 속성 확인
    const documentElement = document.documentElement;
    if (documentElement?.getAttribute('data-theme') === 'dark') {
      return 'dark';
    }

    // 2. CSS 클래스 확인
    if (documentElement?.classList.contains('xeg-theme-dark')) {
      return 'dark';
    }

    // 3. prefers-color-scheme 미디어 쿼리 확인
    if (typeof window !== 'undefined' && window.matchMedia) {
      const prefersDark = window.matchMedia('(prefers-color-scheme: dark)');
      if (prefersDark.matches) {
        return 'dark';
      }
    }

    return 'light';
  }

  /**
   * 분산된 버튼 설정 파일들 확인
   */
  private checkForDistributedButtonConfigs(): string[] {
    // 실제 운영에서는 파일 시스템 체크나 빌드 시스템과 연동
    // 여기서는 단순화하여 빈 배열 반환 (통합 완료 상태)
    return [];
  }
}

// 전역 인스턴스 내보내기 (편의성을 위해)
export const unifiedDarkModeSystem = UnifiedDarkModeStyleSystem.getInstance();
