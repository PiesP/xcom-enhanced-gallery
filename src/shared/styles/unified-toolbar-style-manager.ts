/**
 * 툴바 버튼 통합 스타일링 시스템
 *
 * TDD GREEN 단계: 테스트를 통과시키기 위한 최소 구현
 *
 * @version 1.0.0
 * @description 툴바 버튼의 크기, 색상, 패딩을 통일된 설정에서 관리
 */

// 접근성 상수
const ACCESSIBILITY_MIN_TOUCH_TARGET = 44;

// 통합 툴바 스타일 설정 인터페이스
export interface UnifiedToolbarStyleConfig {
  sizes: {
    sm: { width: number; height: number; iconSize: number; padding: string };
    md: { width: number; height: number; iconSize: number; padding: string };
    lg: { width: number; height: number; iconSize: number; padding: string };
  };
  variants: {
    primary: { background: string; color: string; border: string };
    secondary: { background: string; color: string; border: string };
    danger: { background: string; color: string; border: string };
  };
  spacing: {
    gap: string;
    padding: string;
    margin: string;
  };
  accessibility: {
    minTouchTarget: number;
    focusRingWidth: string;
    focusRingColor: string;
  };
}

/**
 * 통합 툴바 스타일 관리자 클래스
 */
export class UnifiedToolbarStyleManager {
  private static instance: UnifiedToolbarStyleManager;
  private config: UnifiedToolbarStyleConfig;

  private constructor() {
    this.config = this.initializeConfig();
  }

  /**
   * 싱글톤 인스턴스 반환
   */
  public static getInstance(): UnifiedToolbarStyleManager {
    if (!UnifiedToolbarStyleManager.instance) {
      UnifiedToolbarStyleManager.instance = new UnifiedToolbarStyleManager();
    }
    return UnifiedToolbarStyleManager.instance;
  }

  /**
   * 기본 설정 초기화
   */
  private initializeConfig(): UnifiedToolbarStyleConfig {
    return {
      sizes: {
        sm: {
          width: 32,
          height: 32,
          iconSize: 16,
          padding: 'var(--xeg-spacing-xs)',
        },
        md: {
          width: 44,
          height: 44,
          iconSize: 20,
          padding: 'var(--xeg-spacing-sm)',
        },
        lg: {
          width: 48,
          height: 48,
          iconSize: 24,
          padding: 'var(--xeg-spacing-md)',
        },
      },
      variants: {
        primary: {
          background: 'var(--xeg-color-primary)',
          color: 'var(--xeg-color-white)',
          border: 'var(--xeg-color-primary)',
        },
        secondary: {
          background: 'var(--xeg-button-bg)',
          color: 'var(--xeg-button-text)',
          border: 'var(--xeg-border-light)',
        },
        danger: {
          background: 'var(--xeg-color-error-alpha-10)',
          color: 'var(--xeg-color-error)',
          border: 'var(--xeg-color-error-alpha-30)',
        },
      },
      spacing: {
        gap: 'var(--xeg-toolbar-button-gap)',
        padding: 'var(--xeg-toolbar-button-padding)',
        margin: 'var(--xeg-spacing-xs)',
      },
      accessibility: {
        minTouchTarget: 44,
        focusRingWidth: 'var(--xeg-focus-ring-width)',
        focusRingColor: 'var(--xeg-color-primary)',
      },
    };
  }

  /**
   * 통합된 툴바 스타일 설정 반환
   */
  public getConfig(): UnifiedToolbarStyleConfig {
    return { ...this.config };
  }

  /**
   * 버튼 변형과 크기에 따른 통합된 스타일 생성
   */
  public getButtonStyle(
    variant: 'primary' | 'secondary' | 'danger',
    size: 'sm' | 'md' | 'lg'
  ): Record<string, string> {
    const sizeConfig = this.config.sizes[size];
    const variantConfig = this.config.variants[variant];

    return {
      width: `${sizeConfig.width}px`,
      height: `${sizeConfig.height}px`,
      padding: sizeConfig.padding,
      background: variantConfig.background,
      color: variantConfig.color,
      border: `1px solid ${variantConfig.border}`,
      borderRadius: 'var(--xeg-radius-md)',
      fontSize: 'var(--xeg-text-sm)',
      display: 'inline-flex',
      alignItems: 'center',
      justifyContent: 'center',
      cursor: 'pointer',
      transition: 'all var(--xeg-transition-fast) ease',
    };
  }

  /**
   * 일관된 CSS 커스텀 프로퍼티 생성
   */
  public generateCSSCustomProperties(): Record<string, string> {
    const properties: Record<string, string> = {};

    // 크기 관련 CSS 변수들
    Object.entries(this.config.sizes).forEach(([sizeKey, sizeValue]) => {
      properties[`--xeg-toolbar-button-width-${sizeKey}`] = `${sizeValue.width}px`;
      properties[`--xeg-toolbar-button-height-${sizeKey}`] = `${sizeValue.height}px`;
      properties[`--xeg-toolbar-button-icon-${sizeKey}`] = `${sizeValue.iconSize}px`;
      properties[`--xeg-toolbar-button-padding-${sizeKey}`] = sizeValue.padding;
    });

    // 변형 관련 CSS 변수들
    Object.entries(this.config.variants).forEach(([variantKey, variantValue]) => {
      properties[`--xeg-toolbar-button-bg-${variantKey}`] = variantValue.background;
      properties[`--xeg-toolbar-button-color-${variantKey}`] = variantValue.color;
      properties[`--xeg-toolbar-button-border-${variantKey}`] = variantValue.border;
    });

    // 접근성 관련 CSS 변수들
    const minTouchTarget = `${this.config.accessibility.minTouchTarget}px`;
    properties['--xeg-toolbar-button-min-touch-target'] = minTouchTarget;
    properties['--xeg-toolbar-button-focus-ring-width'] = this.config.accessibility.focusRingWidth;
    properties['--xeg-toolbar-button-focus-ring-color'] = this.config.accessibility.focusRingColor;

    return properties;
  }

  /**
   * 툴바 버튼 스타일 일관성 검증
   */
  public validateConsistency(): { isConsistent: boolean; issues: string[] } {
    const issues: string[] = [];

    // 크기 일관성 검증
    const sizes = Object.values(this.config.sizes);
    if (sizes.length === 0) {
      issues.push('크기 설정이 정의되지 않았습니다.');
    }

    // 변형 일관성 검증
    const variants = Object.values(this.config.variants);
    if (variants.length === 0) {
      issues.push('변형 설정이 정의되지 않았습니다.');
    }

    // 접근성 기준 검증
    if (this.config.accessibility.minTouchTarget < ACCESSIBILITY_MIN_TOUCH_TARGET) {
      issues.push('최소 터치 타겟 크기가 접근성 기준(44px)에 미달합니다.');
    }

    // 토큰 사용 일관성 검증
    const hasConsistentTokens = Object.values(this.config.sizes).every(size =>
      size.padding.startsWith('var(--xeg-')
    );

    if (!hasConsistentTokens) {
      issues.push('일부 설정에서 디자인 토큰을 사용하지 않습니다.');
    }

    return {
      isConsistent: issues.length === 0,
      issues,
    };
  }

  /**
   * 설정 업데이트
   */
  public updateConfig(updates: Partial<UnifiedToolbarStyleConfig>): void {
    this.config = { ...this.config, ...updates };
  }

  /**
   * 특정 크기의 아이콘 크기 반환
   */
  public getIconSize(size: 'sm' | 'md' | 'lg'): number {
    return this.config.sizes[size].iconSize;
  }

  /**
   * 특정 변형의 색상 정보 반환
   */
  public getVariantColors(variant: 'primary' | 'secondary' | 'danger') {
    return { ...this.config.variants[variant] };
  }
}

// 전역에서 사용할 수 있는 인스턴스 export
export const toolbarStyleManager = UnifiedToolbarStyleManager.getInstance();
